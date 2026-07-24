"""Heuristic remote/hybrid/onsite classification for scraped jobs."""

from __future__ import annotations

import re

# Hybrid signals checked first since they are the most specific ("2 days in
# office" also contains "office", which alone would look like onsite).
HYBRID_KEYWORDS = (
    "hibrido",
    "híbrido",
    "hibrida",
    "híbrida",
    "hybrid",
    "modalidad mixta",
    "trabajo mixto",
    "esquema mixto",
    "parcialmente remoto",
    "parcialmente remota",
    "parcialmente presencial",
    "remote onsite",
    "onsite remote",
    "office remote",
    "remote hybrid",
    "hybrid remote",
    "dias en oficina",
    "días en oficina",
    "days in office",
    "days per week in office",
    "days a week in office",
    "some days in office",
    "algunos dias en oficina",
    "algunos días en oficina",
)

REMOTE_KEYWORDS = (
    "remoto",
    "remota",
    "100 remoto",
    "100 remota",
    "full remote",
    "fully remote",
    "totalmente remoto",
    "totalmente remota",
    "trabajo remoto",
    "trabajo desde casa",
    "home office",
    "teletrabajo",
    "work from home",
    "wfh",
    "remote work",
    "remote first",
    "remote friendly",
    "remote",
)

ONSITE_KEYWORDS = (
    "presencial",
    "100 presencial",
    "totalmente presencial",
    "en oficina",
    "en sitio",
    "on site",
    "onsite",
    "in office",
    "en las instalaciones",
    "asistencia obligatoria a oficina",
)


def _normalize(text: str | None) -> str:
    if not text or not isinstance(text, str):
        return ""
    # Punctuation (hyphens, slashes, "%", parentheses, commas...) becomes
    # whitespace, and every token gets padded with single spaces. This lets
    # keyword lists stay free of hyphens/slashes ("on-site" -> "on site")
    # and lets single ambiguous words like "remote" match only as a whole
    # word instead of matching inside "remotely".
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    return f" {' '.join(cleaned.split())} "


def _normalize_keywords(keywords: tuple[str, ...]) -> tuple[str, ...]:
    return tuple(_normalize(keyword) for keyword in keywords)


_HYBRID_PATTERNS = _normalize_keywords(HYBRID_KEYWORDS)
_REMOTE_PATTERNS = _normalize_keywords(REMOTE_KEYWORDS)
_ONSITE_PATTERNS = _normalize_keywords(ONSITE_KEYWORDS)


def classify_work_mode(
    title: str | None,
    location: str | None = None,
    description: str | None = None,
    is_remote: bool | None = None,
) -> str:
    """Returns one of: 'remote', 'hybrid', 'onsite', 'unknown'."""
    haystack = "".join(
        _normalize(part) for part in (title, location, description) if part
    )

    has_hybrid = any(pattern in haystack for pattern in _HYBRID_PATTERNS)
    has_remote = bool(is_remote) or any(
        pattern in haystack for pattern in _REMOTE_PATTERNS
    )
    has_onsite = any(pattern in haystack for pattern in _ONSITE_PATTERNS)

    if has_hybrid:
        return "hybrid"
    if has_remote and has_onsite:
        return "hybrid"
    if has_remote:
        return "remote"
    if has_onsite:
        return "onsite"
    return "unknown"
