from datetime import date, datetime, timezone

from fastapi import FastAPI
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

def records_for_json(df: pd.DataFrame) -> list[dict]:
    records = df.to_dict(orient="records")
    return [
        {key: to_json_value(val) for key, val in record.items()}
        for record in records
    ]

def do_scrape():
    combined = fetch_jobs()
    httpx.post(f"{NESTJS_URL}/api/jobs/ingest",
               json=records_for_json(combined),
               timeout=30)
    print(f"Sent {len(combined)} jobs to NestJS")

scheduler.add_job(do_scrape, "interval", hours=SCRAPE_INTERVAL_HOURS)
scheduler.start()

@app.post("/scrape")
def scrape_now():
    do_scrape()
    return {"ok": True}

@app.get("/scrape/preview")
def scrape_preview():
    return records_for_json(fetch_jobs())