import os, re, socket, ssl, requests
import whois, dns.resolver
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from datetime import datetime
from difflib import SequenceMatcher

# 1. Blacklist via OpenPhish feed público
OPENPHISH_FEED_URL = os.getenv("OPENPHISH_FEED_URL", "https://openphish.com/feed.txt")

def load_openphish():
    try:
        resp = requests.get(OPENPHISH_FEED_URL, timeout=5)
        lines = [l.strip() for l in resp.text.splitlines() if l.strip()]
        return { urlparse(line).netloc.lower() for line in lines }
    except Exception:
        return set()

def load_local_blacklist():
    path = os.path.join(os.path.dirname(__file__), "..", "blacklist.txt")
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            return { line.strip().lower() for line in f if line.strip() }
    return set()

_OPENPHISH = load_openphish()
_LOCAL_BL   = load_local_blacklist()
BLACKLIST   = _OPENPHISH.union(_LOCAL_BL)

def check_blacklist(url: str):
    host = urlparse(url).netloc.lower()
    if host in BLACKLIST:
        return True, "OpenPhish" if host in _OPENPHISH else "Local"
    return False, None


# 2. Heurísticas de URL
def has_suspicious_numbers(domain: str):
    return bool(re.search(r"[0-9]", domain))

def count_subdomains(host: str):
    parts = host.split(".")
    return len(parts) - 2

def has_special_chars(url: str):
    return bool(re.search(r"[^A-Za-z0-9\-\._~/:\?=&%]", url))


# 3. Características técnicas
def get_domain_age(domain: str):
    w = whois.whois(domain)
    creation = w.creation_date
    if isinstance(creation, list):
        creation = creation[0]
    if not creation:
        return None, None
    age = (datetime.utcnow() - creation).days
    return creation, age

def get_dns_records(domain: str):
    recs = []
    for rtype in ("A","NS","MX","TXT"):
        try:
            answers = dns.resolver.resolve(domain, rtype, lifetime=3)
            recs += [f"{rtype}: {rdata.to_text()}" for rdata in answers]
        except Exception:
            pass
    return recs

def check_ssl_valid(hostname: str):
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=hostname) as s:
            s.settimeout(3)
            s.connect((hostname, 443))
            cert = s.getpeercert()
        not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
        return not_after > datetime.utcnow()
    except Exception:
        return False


# 4. Análise de conteúdo
BRAND_KEYWORDS = ["paypal", "linkedin", "google", "facebook", "apple", "microsoft", "amazon", "twitter", "instagram", "whatsapp", "youtube", "netflix", "ebay", "alibaba", "tiktok"]

def analyze_content(url: str):
    try:
        r = requests.get(url, timeout=5, verify=False)
        soup = BeautifulSoup(r.text, "html.parser")
    except Exception:
        return 0, False, []

    forms = soup.find_all("form")
    forms_count = len(forms)
    login_fields = any(f.find("input", {"type": "password"}) for f in forms)
    imgs = soup.find_all("img", src=True)
    found = [
        img["src"]
        for img in imgs
        if any(kw in (img.get("alt","") + img["src"]).lower() for kw in BRAND_KEYWORDS)
    ]
    return forms_count, login_fields, found

DYNAMIC_DNS_SUFFIXES = (
    "no-ip.org","dyndns.org","duckdns.org","freedns.afraid.org"
)
def is_dynamic_dns(domain: str) -> bool:
    return any(domain.endswith(suffix) for suffix in DYNAMIC_DNS_SUFFIXES)

# ——— 4. SSL detalhado ———
def analyze_ssl(hostname: str):
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=hostname) as s:
            s.settimeout(3)
            s.connect((hostname, 443))
            cert = s.getpeercert()
        # emissor
        issuer = dict(x[0] for x in cert.get("issuer", []))
        issuer_name = issuer.get("O") or issuer.get("CN") or str(issuer)
        # expiração
        exp = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
        # domínio no CN ou SAN?
        cn = cert.get("subject", ((),))[0][0][1]
        match = (hostname == cn) or any(hostname == alt for alt in cert.get("subjectAltName", []))
        valid = exp > datetime.utcnow()
        return valid, issuer_name, exp, match
    except Exception:
        return False, None, None, None

# ——— 5. Redirecionamentos suspeitos ———
def detect_redirects(url: str):
    try:
        resp = requests.get(url, timeout=5, allow_redirects=True, verify=False)
        chain = [r.url for r in resp.history] + [resp.url]
        # filtra somente redireções que mudam de domínio
        return [u for u in chain if urlparse(u).netloc != urlparse(url).netloc]
    except Exception:
        return []

# ——— 6. Similaridade de domínio ———
KNOWN_BRANDS = ["paypal.com","google.com","facebook.com","apple.com","microsoft.com","amazon.com","twitter.com","instagram.com","whatsapp.com","youtube.com","netflix.com","ebay.com","alibaba.com","tiktok.com"]
def domain_levenshtein(host: str, target: str):
    # uma aproximação simples
    return int((1 - SequenceMatcher(None, host, target).ratio()) * max(len(host), len(target)))

def find_similar_domains(host: str, threshold: float = 0.7):
    sims = []
    for brand in KNOWN_BRANDS:
        ratio = SequenceMatcher(None, host, brand).ratio()
        if ratio >= threshold:
            # distancia em caracteres
            dist = domain_levenshtein(host, brand)
            sims.append({"brand": brand, "distance": dist})
    return sims

# ——— 7. Análise de conteúdo sensível ———
SENSITIVE_KEYS = ["email","senha","password","cpf","cartão","creditcard"]
def analyze_content_advanced(url: str):
    forms = []
    sensitive = set()
    try:
        r = requests.get(url, timeout=5, verify=False)
        soup = BeautifulSoup(r.text, "html.parser")
    except Exception:
        return 0, False, [], []

    all_forms = soup.find_all("form")
    for f in all_forms:
        forms.append(f)
        # busca inputs que contenham palavras‐chave sensíveis
        for inp in f.find_all("input", attrs={"name": True}):
            name = inp["name"].lower()
            for key in SENSITIVE_KEYS:
                if key in name:
                    sensitive.add(name)
    forms_count = len(all_forms)
    login_fields = any(f.find("input", {"type": "password"}) for f in all_forms)
    return forms_count, login_fields, list(sensitive), [
        img["src"] for img in soup.find_all("img", src=True)
        if any(b in (img.get("alt","") + img["src"]).lower() for b in KNOWN_BRANDS)
    ]