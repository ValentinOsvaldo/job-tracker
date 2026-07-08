from datetime import date, datetime, timezone

from fastapi import FastAPI, HTTPException
from jobspy import scrape_jobs
from apscheduler.schedulers.background import BackgroundScheduler
import httpx
import pandas as pd
from config import *

app = FastAPI()
scheduler = BackgroundScheduler()

def fetch_jobs() -> pd.DataFrame:
    all_jobs = []

    for term in SEARCH_TERMS:
        for location in LOCATIONS:
            jobs = scrape_jobs(
                site_name=["linkedin", "indeed"],
                search_term=term,
                location=location,
                results_wanted=RESULTS,
                hours_old=HOURS_OLD,
            )
            all_jobs.append(jobs)

    combined = pd.concat(all_jobs).drop_duplicates(subset=["job_url"])
    return combined.where(pd.notna(combined), other=None)

def to_json_value(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, (datetime, pd.Timestamp)):
        return int(value.timestamp() * 1000)
    if isinstance(value, date):
        dt = datetime.combine(value, datetime.min.time(), tzinfo=timezone.utc)
        return int(dt.timestamp() * 1000)
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

def records_for_json(df: pd.DataFrame) -> list[dict]:
    records = df.to_dict(orient="records")
    serialized = [
        {key: to_json_value(val) for key, val in record.items()}
        for record in records
    ]
    return [record for record in serialized if is_valid_record(record)]

def do_scrape() -> dict:
    combined = fetch_jobs()
    payload = records_for_json(combined)
    base_url = NESTJS_URL.rstrip("/")
    response = httpx.post(
        f"{base_url}/api/jobs/ingest",
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    ingest = response.json()
    print(f"Sent {len(payload)} jobs to NestJS: {ingest}")
    return {"sent": len(payload), "ingest": ingest}

scheduler.add_job(do_scrape, "interval", hours=SCRAPE_INTERVAL_HOURS)
scheduler.start()

@app.post("/scrape")
def scrape_now():
    try:
        result = do_scrape()
        return {"ok": True, **result}
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "ok": False,
                "status": exc.response.status_code,
                "error": exc.response.text,
            },
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail={"ok": False, "error": str(exc)},
        ) from exc

@app.get("/scrape/preview")
def scrape_preview():
    return records_for_json(fetch_jobs())
