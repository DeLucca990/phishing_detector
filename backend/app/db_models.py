from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime
)
from sqlalchemy.types import JSON
from datetime import datetime
from database import Base

class CheckResult(Base):
    __tablename__ = "check_results"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    url = Column(String, index=True)
    blacklisted = Column(Boolean)
    blacklist_source = Column(String, nullable=True)

    suspicious_numbers = Column(Boolean)
    excessive_subdomains = Column(Boolean)
    special_chars = Column(Boolean)

    domain_creation_date = Column(DateTime, nullable=True)
    domain_age_days = Column(Integer, nullable=True)

    dynamic_dns = Column(Boolean)
    dns_records = Column(JSON)

    ssl_valid = Column(Boolean, nullable=True)
    ssl_issuer = Column(String, nullable=True)
    ssl_expiration_date = Column(DateTime, nullable=True)
    ssl_domain_match = Column(Boolean, nullable=True)

    redirects = Column(JSON)
    similar_domains = Column(JSON)

    forms_found = Column(Integer)
    login_fields_found = Column(Boolean)
    sensitive_fields_found = Column(JSON)
    suspicious_images = Column(JSON)