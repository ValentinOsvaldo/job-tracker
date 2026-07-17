"""Post-scrape relevance filters for software-related roles."""

from __future__ import annotations

import re

# Titles that clearly are not software engineering roles (ES + EN).
TITLE_BLOCKLIST = (
    "gerente comercial",
    "director comercial",
    "vendedor",
    "vendedora",
    "sales executive",
    "sales manager",
    "sales associate",
    "account executive",
    "account manager",
    "cuenta clave",
    "key account",
    "telemarketing",
    "call center",
    "reclutador",
    "reclutadora",
    "recruiter",
    "talent acquisition",
    "cajero",
    "cajera",
    "chofer",
    "conductor",
    "mesero",
    "mesera",
    "cocinero",
    "almacenista",
    "ayudante general",
    "asistente administrativo",
    "recepcionista",
    "contador",
    "contadora",
    "community manager",
    "social media manager",
    "promotor de ventas",
    "ejecutivo de ventas",
    "asesor comercial",
    "asesora comercial",
    "real estate",
    "bienes raices",
    "bienes raíces",
)

# Keep if title or description matches at least one tech signal.
TECH_ALLOWLIST = (
    "software",
    "developer",
    "desarrollador",
    "desarrolladora",
    "engineer",
    "ingeniero",
    "ingeniera",
    "frontend",
    "front-end",
    "front end",
    "backend",
    "back-end",
    "back end",
    "fullstack",
    "full-stack",
    "full stack",
    "mobile",
    "ios",
    "android",
    "react",
    "vue",
    "angular",
    "svelte",
    "next.js",
    "nuxt",
    "node",
    "nodejs",
    "node.js",
    "typescript",
    "javascript",
    "python",
    "java",
    ".net",
    "dotnet",
    "c#",
    "golang",
    "rust",
    "kotlin",
    "swift",
    "devops",
    "sre",
    "site reliability",
    "qa engineer",
    "quality assurance",
    "data engineer",
    "data scientist",
    "machine learning",
    "ml engineer",
    "programmer",
    "programador",
    "programadora",
    "web developer",
    "software architect",
    "tech lead",
    "technical lead",
    "platform engineer",
    "cloud engineer",
    "cybersecurity",
    "seguridad informatica",
    "seguridad informática",
)


def _normalize(text: str | None) -> str:
    if not text or not isinstance(text, str):
        return ""
    return " ".join(text.lower().split())


def is_blocked_title(title: str | None) -> bool:
    normalized = _normalize(title)
    if not normalized:
        return True
    return any(phrase in normalized for phrase in TITLE_BLOCKLIST)


def has_tech_signal(title: str | None, description: str | None = None) -> bool:
    haystack = f"{_normalize(title)} {_normalize(description)}"
    return any(signal in haystack for signal in TECH_ALLOWLIST)


def matches_search_terms(
    title: str | None,
    description: str | None,
    search_terms: list[str] | None,
) -> bool:
    """Require at least one meaningful search token to appear in title/description."""
    if not search_terms:
        return True

    haystack = f"{_normalize(title)} {_normalize(description)}"
    if not haystack:
        return False

    tokens: list[str] = []
    for term in search_terms:
        for token in re.split(r"[\s,/|+]+", term.lower()):
            cleaned = token.strip(".-_")
            if len(cleaned) >= 3:
                tokens.append(cleaned)

    if not tokens:
        return True

    return any(token in haystack for token in tokens)


def is_relevant_job(
    title: str | None,
    description: str | None = None,
    search_terms: list[str] | None = None,
) -> bool:
    if is_blocked_title(title):
        return False
    if not has_tech_signal(title, description):
        return False
    if not matches_search_terms(title, description, search_terms):
        return False
    return True
