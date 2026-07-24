-- One-off cleanup for jobs already ingested as near-duplicates (same title +
-- company, scraped more than once under different URLs). Run manually against
-- the DB; not a TypeORM migration.
--
-- Match key: LOWER(TRIM(title)) + LOWER(TRIM(company)). Location is
-- intentionally excluded from the key since the same posting is often listed
-- with slightly different location text across sites/scrapes.
--
-- Keep priority per duplicate group (highest wins):
--   1) has job_user_statuses rows (you interacted with it: liked/applied/etc.)
--   2) has job_analyses rows (already AI-scored)
--   3) oldest scraped_at (earliest copy)
-- Everything else in the group is deleted; job_analyses/job_user_statuses for
-- deleted jobs cascade automatically (ON DELETE CASCADE).

-- 1) Preview: see how many rows would be deleted and a sample of the groups.
WITH ranked AS (
  SELECT
    j.id,
    j.title,
    j.company,
    j.scraped_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(j.title)), LOWER(TRIM(COALESCE(j.company, '')))
      ORDER BY
        (EXISTS (SELECT 1 FROM job_user_statuses jus WHERE jus.job_id = j.id)) DESC,
        (EXISTS (SELECT 1 FROM job_analyses ja WHERE ja.job_id = j.id)) DESC,
        j.scraped_at ASC
    ) AS rn
  FROM jobs j
)
SELECT count(*) AS would_delete
FROM ranked
WHERE rn > 1;

-- 2) Actual delete. Uncomment to run.
-- WITH ranked AS (
--   SELECT
--     j.id,
--     ROW_NUMBER() OVER (
--       PARTITION BY LOWER(TRIM(j.title)), LOWER(TRIM(COALESCE(j.company, '')))
--       ORDER BY
--         (EXISTS (SELECT 1 FROM job_user_statuses jus WHERE jus.job_id = j.id)) DESC,
--         (EXISTS (SELECT 1 FROM job_analyses ja WHERE ja.job_id = j.id)) DESC,
--         j.scraped_at ASC
--     ) AS rn
--   FROM jobs j
-- )
-- DELETE FROM jobs
-- WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
