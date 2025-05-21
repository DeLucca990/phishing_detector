from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from urllib.parse import urlparse
from typing import List

from .database import engine, SessionLocal, Base
from .db_models import CheckResult
from .models import URLCheckRequest, URLCheckResult, URLCheckHistory, DomainSimilarity
from .services import (
    check_blacklist, has_suspicious_numbers, count_subdomains, has_special_chars,
    get_domain_age, get_dns_records, is_dynamic_dns, analyze_ssl,
    detect_redirects, find_similar_domains, analyze_content_advanced
)

# Cria tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Phishing Detector com Histórico")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency para sessão DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/check_url", response_model=URLCheckResult)
async def check_url(req: URLCheckRequest, db: Session = Depends(get_db)):
    raw = req.url.strip()
    if not raw.lower().startswith(("http://", "https://")):
        raw = "http://" + raw
    parsed = urlparse(raw)
    host = parsed.netloc.lower()

    # execução das análises
    black, src = check_blacklist(raw)
    nums = has_suspicious_numbers(host)
    subs = count_subdomains(host) > 2
    spec = has_special_chars(raw)
    creation, age = get_domain_age(host)
    dns_recs = get_dns_records(host)
    dyn = is_dynamic_dns(host)
    ssl_ok, issuer, exp, match = analyze_ssl(host)
    redirects = detect_redirects(raw)
    sims = find_similar_domains(host, threshold=0.75)
    forms, login, sens, imgs = analyze_content_advanced(raw)

    # Persiste no DB
    entry = CheckResult(
        url=raw,
        blacklisted=black, blacklist_source=src,
        suspicious_numbers=nums, excessive_subdomains=subs, special_chars=spec,
        domain_creation_date=creation, domain_age_days=age,
        dynamic_dns=dyn, dns_records=dns_recs,
        ssl_valid=ssl_ok, ssl_issuer=issuer,
        ssl_expiration_date=exp, ssl_domain_match=match,
        redirects=redirects, similar_domains=[dict(s) for s in sims],
        forms_found=forms, login_fields_found=login,
        sensitive_fields_found=sens, suspicious_images=imgs
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return URLCheckResult(
        url=raw,
        blacklisted=black, blacklist_source=src,
        suspicious_numbers=nums, excessive_subdomains=subs, special_chars=spec,
        domain_creation_date=creation, domain_age_days=age,
        dynamic_dns=dyn, dns_records=dns_recs,
        ssl_valid=ssl_ok, ssl_issuer=issuer,
        ssl_expiration_date=exp, ssl_domain_match=match,
        redirects=redirects,
        similar_domains=[DomainSimilarity(**s) for s in sims],
        forms_found=forms,
        login_fields_found=login,
        sensitive_fields_found=sens,
        suspicious_images=imgs
    )

@app.get("/history", response_model=List[URLCheckHistory])
def get_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    entries = db.query(CheckResult) \
        .order_by(CheckResult.timestamp.desc()) \
        .offset(skip).limit(limit).all()
    return entries

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)