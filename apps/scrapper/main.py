from datetime import date, datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from jobspy import scrape_jobs
import httpx
import pandas as pd
from pydantic import BaseModel, Field

from config import (
    ENFORCE_ANNUAL_SALARY,
    HOURS_OLD,
    LINKEDIN_FETCH_DESCRIPTION,
    LOCATIONS,
    NESTJS_URL,
    RELEVANCE_FILTER,
    RESULTS,
    SEARCH_TERMS,
)
from filters import is_relevant_job
from work_mode import classify_work_mode

SiteName = Literal["linkedin", "indeed"]
DEFAULT_SITES: list[SiteName] = ["linkedin", "indeed"]
INGEST_FIELDS = (
    "title",
    "job_url",
    "site",
    "company",
    "location",
    "description",
    "date_posted",
    "job_type",
    "min_amount",
    "max_amount",
    "interval",
)

app = FastAPI()


class ScrapeParams(BaseModel):
    sites: list[SiteName] = Field(default_factory=lambda: list(DEFAULT_SITES))
    search_terms: list[str] = Field(min_length=1)
    locations: list[str] = Field(min_length=1)
    results_wanted: int = Field(default=30, ge=1, le=100)
    hours_old: int = Field(default=48, ge=1)


class ScrapeRequest(BaseModel):
    sites: list[SiteName] | None = None
    search_terms: list[str] | None = None
    locations: list[str] | None = None
    results_wanted: int | None = Field(None, ge=1, le=100)
    hours_old: int | None = Field(None, ge=1)


def default_scrape_params() -> ScrapeParams:
    return ScrapeParams(
        sites=list(DEFAULT_SITES),
        search_terms=SEARCH_TERMS,
        locations=LOCATIONS,
        results_wanted=RESULTS,
        hours_old=HOURS_OLD,
    )


def resolve_scrape_params(request: ScrapeRequest | None = None) -> ScrapeParams:
    defaults = default_scrape_params()

    if request is None:
        return defaults

    return ScrapeParams(
        sites=request.sites or defaults.sites,
        search_terms=request.search_terms or defaults.search_terms,
        locations=request.locations or defaults.locations,
        results_wanted=request.results_wanted or defaults.results_wanted,
        hours_old=request.hours_old or defaults.hours_old,
    )


def parse_csv_query(value: str | None) -> list[str] | None:
    if not value:
        return None
    items = [item.strip() for item in value.split(",") if item.strip()]
    return items or None


def scrape_params_from_query(
    sites: str | None = None,
    search_terms: str | None = None,
    locations: str | None = None,
    results_wanted: int | None = Query(None, ge=1, le=100),
    hours_old: int | None = Query(None, ge=1),
) -> ScrapeParams:
    parsed_sites = parse_csv_query(sites)
    valid_sites: list[SiteName] | None = None

    if parsed_sites:
        invalid = [site for site in parsed_sites if site not in ("linkedin", "indeed")]
        if invalid:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid sites: {invalid}. Use linkedin and/or indeed.",
            )
        valid_sites = parsed_sites  # type: ignore[assignment]

    return resolve_scrape_params(
        ScrapeRequest(
            sites=valid_sites,
            search_terms=parse_csv_query(search_terms),
            locations=parse_csv_query(locations),
            results_wanted=results_wanted,
            hours_old=hours_old,
        )
    )


def fetch_jobs(params: ScrapeParams | None = None) -> pd.DataFrame:
    scrape = params or default_scrape_params()
    all_jobs = []

    for term in scrape.search_terms:
        for location in scrape.locations:
            jobs = scrape_jobs(
                site_name=scrape.sites,
                search_term=term,
                location=location,
                results_wanted=scrape.results_wanted,
                hours_old=scrape.hours_old,
                country_indeed="Mexico",
                linkedin_fetch_description=LINKEDIN_FETCH_DESCRIPTION,
                enforce_annual_salary=ENFORCE_ANNUAL_SALARY,
            )
            all_jobs.append(jobs)

    if not all_jobs:
        return pd.DataFrame()

    combined = pd.concat(all_jobs).drop_duplicates(subset=["job_url"])
    return combined.where(pd.notna(combined), other=None)


def to_json_value(value):
    if hasattr(value, "item"):
        return to_json_value(value.item())
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, (datetime, pd.Timestamp)):
        return int(value.timestamp() * 1000)
    if isinstance(value, date):
        dt = datetime.combine(value, datetime.min.time(), tzinfo=timezone.utc)
        return int(dt.timestamp() * 1000)
    if isinstance(value, float):
        return int(value) if value.is_integer() else value
    return value


def is_valid_record(record: dict) -> bool:
    title = record.get("title")
    job_url = record.get("job_url")
    site = record.get("site")
    return (
        isinstance(title, str)
        and title.strip()
        and isinstance(job_url, str)
        and job_url.strip().startswith("http")
        and site in ("linkedin", "indeed")
    )


def records_for_json(
    df: pd.DataFrame,
    search_terms: list[str] | None = None,
) -> tuple[list[dict], dict[str, int]]:
    stats = {"raw": 0, "blocked": 0, "kept": 0}

    if df.empty:
        return [], stats

    records = df.to_dict(orient="records")
    serialized: list[dict] = []

    for record in records:
        payload = {
            key: to_json_value(record[key])
            for key in INGEST_FIELDS
            if key in record
        }

        if not is_valid_record(payload):
            continue

        stats["raw"] += 1

        if RELEVANCE_FILTER and not is_relevant_job(
            payload.get("title"),
            payload.get("description"),
            search_terms,
        ):
            stats["blocked"] += 1
            continue

        is_remote_value = to_json_value(record.get("is_remote"))
        payload["work_mode"] = classify_work_mode(
            payload.get("title"),
            payload.get("location"),
            payload.get("description"),
            bool(is_remote_value) if is_remote_value is not None else None,
        )

        stats["kept"] += 1
        serialized.append(payload)

    return serialized, stats


def do_scrape(params: ScrapeParams | None = None) -> dict:
    scrape = params or default_scrape_params()
    combined = fetch_jobs(scrape)
    payload, filter_stats = records_for_json(combined, scrape.search_terms)
    filtered_out = filter_stats["blocked"]
    base_url = NESTJS_URL.rstrip("/")
    response = httpx.post(
        f"{base_url}/api/jobs/ingest",
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    ingest = response.json()
    print(
        "Sent {sent} jobs to NestJS (raw={raw}, blocked={blocked}, kept={kept}): {ingest}".format(
            sent=len(payload),
            raw=filter_stats["raw"],
            blocked=filter_stats["blocked"],
            kept=filter_stats["kept"],
            ingest=ingest,
        )
    )
    return {
        "sent": len(payload),
        "filtered_out": filtered_out,
        "filter": filter_stats,
        "ingest": ingest,
        "params": scrape.model_dump(),
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/scrape")
def scrape_now(body: ScrapeRequest | None = None):
    params = resolve_scrape_params(body)

    try:
        result = do_scrape(params)
        return {"ok": True, **result}
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        hint = None
        if status == 413:
            hint = "NestJS rejected the payload (too large). Redeploy the API with an increased body size limit."
        raise HTTPException(
            status_code=502,
            detail={
                "ok": False,
                "status": status,
                "error": exc.response.text,
                "hint": hint,
                "nestjs_url": NESTJS_URL.rstrip("/"),
            },
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "ok": False,
                "error": str(exc),
                "hint": "Could not reach NestJS. Check NESTJS_URL and that the API is running.",
                "nestjs_url": NESTJS_URL.rstrip("/"),
            },
        ) from exc


@app.get("/scrape/preview")
def scrape_preview(
    sites: str | None = Query(
        None,
        description="Comma-separated: linkedin, indeed",
        examples=["linkedin", "linkedin,indeed"],
    ),
    search_terms: str | None = Query(
        None,
        description="Comma-separated search terms",
        examples=["software engineer,frontend developer"],
    ),
    locations: str | None = Query(
        None,
        description="Comma-separated locations",
        examples=["mexico,remote"],
    ),
    results_wanted: int | None = Query(None, ge=1, le=100),
    hours_old: int | None = Query(None, ge=1),
):
    params = scrape_params_from_query(
        sites=sites,
        search_terms=search_terms,
        locations=locations,
        results_wanted=results_wanted,
        hours_old=hours_old,
    )
    jobs, filter_stats = records_for_json(fetch_jobs(params), params.search_terms)
    return {
        "params": params.model_dump(),
        "filter": filter_stats,
        "filtered_out": filter_stats["blocked"],
        "jobs": jobs,
    }
