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


NESTJS_URL = os.getenv("NESTJS_URL", "http://localhost:3000")
SEARCH_TERMS = _parse_csv(
    os.getenv("SEARCH_TERMS"),
    ["software engineer", "frontend developer", "backend developer"],
)
LOCATIONS = _parse_csv(os.getenv("LOCATIONS"), ["mexico", "worldwide"])
RESULTS = _parse_int(os.getenv("RESULTS"), 30)
HOURS_OLD = _parse_int(os.getenv("HOURS_OLD"), 48)
SCRAPE_INTERVAL_HOURS = _parse_int(os.getenv("SCRAPE_INTERVAL_HOURS"), 6)
PORT = _parse_int(os.getenv("PORT"), 8000)
