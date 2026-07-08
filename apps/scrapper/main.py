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

def do_scrape():
    combined = fetch_jobs()
    httpx.post(f"{NESTJS_URL}/api/jobs/ingest",
               json=combined.to_dict(orient="records"),
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
    return fetch_jobs().to_dict(orient="records")