import { format, toZonedTime } from 'date-fns-tz';

export function getExplanation(key: string): string {
  const explanations: Record<string, string> = {
    blacklisted: "URL encontrada em listas de phishing conhecidas, indicando que foi previamente identificada como maliciosa por organizações de segurança.",
    blacklist_source: "Fonte que identificou esta URL como maliciosa",
    suspicious_numbers: "Uso de números substituindo letras (como '1' no lugar de 'l') é uma técnica comum em domínios de phishing para imitar sites legítimos.",
    excessive_subdomains: "Múltiplos subdomínios podem ser usados para ocultar a identidade real do domínio ou para criar URLs que parecem pertencer a organizações legítimas.",
    special_chars: "Caracteres especiais em URLs podem ser usados para confundir usuários ou para explorar vulnerabilidades em navegadores e filtros de segurança.",
    domain_creation_date: "A data de criação do domínio. Domínios recentes são frequentemente associados a ataques de phishing, pois tendem a ter vida curta.",
    domain_age_days: "Idade do domínio em dias. Domínios com menos de 30 dias são especialmente suspeitos, pois a maioria dos sites de phishing é rapidamente removida.",
    dynamic_dns: "Serviços de DNS dinâmico são frequentemente usados em ataques para criar domínios temporários ou para mudar rapidamente de localização.",
    dns_records: "Registros DNS incompletos ou inconsistentes podem indicar uma infraestrutura temporária típica de sites fraudulentos.",
    ssl_valid: "Um certificado SSL inválido ou ausente indica falta de segurança na comunicação e possível falsificação do site.",
    ssl_issuer: "A autoridade que emitiu o certificado. Certificados gratuitos ou auto-assinados são mais comuns em sites maliciosos.",
    ssl_expiration_date: "Data de expiração do certificado SSL. Certificados expirados indicam negligência ou tentativa deliberada de falsificação.",
    ssl_domain_match: "Quando o domínio no certificado não corresponde ao domínio do site, pode ser uma tentativa de falsificar a identidade.",
    redirects: "Redirecionamentos entre domínios diferentes podem ocultar a verdadeira origem da página maliciosa ou manipular a URL exibida.",
    similar_domains: "Domínios semelhantes a marcas conhecidas indicam possível tentativa de falsificação através de typosquatting ou domain spoofing.",
    forms_found: "Formulários podem ser usados para coletar dados sensíveis. Sites de phishing frequentemente contêm formulários para roubo de credenciais.",
    login_fields_found: "Campos de login em sites suspeitos são fortes indicadores de tentativa de roubo de credenciais.",
    sensitive_fields_found: "Campos solicitando informações sensíveis como números de cartão ou senhas representam alto risco quando encontrados em sites suspeitos.",
    suspicious_images: "Imagens imitando logos de marcas conhecidas são usadas para dar aparência de legitimidade a sites fraudulentos.",
  };

  return explanations[key];
}

export function formatDateBR(dateStr: string): string {
  const timeZone = 'America/Sao_Paulo';
  const date = toZonedTime(dateStr, timeZone);
  return format(date, 'dd/MM/yyyy HH:mm', { timeZone });
}
