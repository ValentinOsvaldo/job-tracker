import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")


def _parse_csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_int(value: str | None, default: int) -> int:
    if not value:
        return default
    return int(value)


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


NESTJS_URL = os.getenv("NESTJS_URL", "http://localhost:3000")
SEARCH_TERMS = _parse_csv(
    os.getenv("SEARCH_TERMS"),
    ["software engineer", "frontend developer", "backend developer"],
)
LOCATIONS = _parse_csv(os.getenv("LOCATIONS"), ["mexico"])
RESULTS = _parse_int(os.getenv("RESULTS"), 15)
HOURS_OLD = _parse_int(os.getenv("HOURS_OLD"), 48)
PORT = _parse_int(os.getenv("PORT"), 8000)
LINKEDIN_FETCH_DESCRIPTION = _parse_bool(
    os.getenv("LINKEDIN_FETCH_DESCRIPTION"),
    True,
)
RELEVANCE_FILTER = _parse_bool(os.getenv("RELEVANCE_FILTER"), True)
ENFORCE_ANNUAL_SALARY = _parse_bool(os.getenv("ENFORCE_ANNUAL_SALARY"), True)
