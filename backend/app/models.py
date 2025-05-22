from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class URLCheckRequest(BaseModel):
    url: str = Field(..., description="URL ou domínio (ex: exemplo.com) a ser analisado")

class DomainSimilarity(BaseModel):
    brand: str
    distance: int

class MLScore(BaseModel):
    label: str = Field(..., description="Classe predita pelo modelo")
    probability: float = Field(..., ge=0, le=1, description="Probabilidade da classe")

class URLCheckResult(BaseModel):
    url: str
    blacklisted: bool
    blacklist_source: Optional[str]

    suspicious_numbers: bool
    excessive_subdomains: bool
    special_chars: bool

    # WHOIS
    domain_creation_date: Optional[datetime]
    domain_age_days: Optional[int]

    # DNS
    dynamic_dns: bool
    dns_records: List[str]

    # SSL detalhado
    ssl_valid: Optional[bool]
    ssl_issuer: Optional[str]
    ssl_expiration_date: Optional[datetime]
    ssl_domain_match: Optional[bool]

    # Redirecionamentos
    redirects: List[str]

    # Similaridade de domínio
    similar_domains: List[DomainSimilarity]

    # Conteúdo
    forms_found: int
    login_fields_found: bool
    sensitive_fields_found: List[str]
    suspicious_images: List[str]

    # ML
    ml_scores: List[MLScore] = Field(
        ..., description="Lista de todas as classes com suas probabilidades"
    )

class URLCheckHistory(URLCheckResult):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True