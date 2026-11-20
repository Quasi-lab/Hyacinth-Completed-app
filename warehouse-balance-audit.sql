-- Read-only inventory, integrity, capacity proxies, and four examination queries.
SET TIME ZONE 'Asia/Manila';

WITH inventory AS (
  SELECT 'Admissions' AS category, count(*) AS records FROM public."PatientRecords"
  UNION ALL SELECT 'Patients', count(*) FROM public."Patient_Dim"
  UNION ALL SELECT 'Doctors', count(*) FROM public."Doctor_Dim"
  UNION ALL SELECT 'Nurses', count(*) FROM public."Nurse_Dim"
  UNION ALL SELECT 'Rooms', count(*) FROM public."Room_Dim"
  UNION ALL SELECT 'Bills', count(*) FROM public."Bill_Dim"
)
SELECT category, records FROM inventory
UNION ALL SELECT 'Warehouse total', sum(records) FROM inventory
UNION ALL SELECT 'Instruments (outside star schema)', count(*) FROM public.instruments;

SELECT count(*) AS fact_count,
  count(*) FILTER (WHERE a."recordID" BETWEEN -5000 AND -1) AS synthetic_facts,
  count(*) FILTER (WHERE p."patientID" IS NULL OR d."doctorID" IS NULL OR n."nurseID" IS NULL
    OR r."roomId" IS NULL OR b."billID" IS NULL) AS invalid_fact_keys,
  (SELECT count(*) FROM public."Patient_Dim" p WHERE NOT EXISTS (
     SELECT 1 FROM public."PatientRecords" f WHERE f."patientID" = p."patientID"
  )) AS unreferenced_patients
FROM public."PatientRecords" a
LEFT JOIN public."Patient_Dim" p USING ("patientID")
LEFT JOIN public."Doctor_Dim" d USING ("doctorID")
LEFT JOIN public."Nurse_Dim" n USING ("nurseID")
LEFT JOIN public."Room_Dim" r ON r."roomId" = a."roomID"
LEFT JOIN public."Bill_Dim" b USING ("billID");

WITH daily AS (
  SELECT admission::date AS admission_date, count(*) AS arrivals
  FROM public."PatientRecords" GROUP BY 1
), instants AS (
  SELECT DISTINCT admission FROM public."PatientRecords" WHERE admission IS NOT NULL
), rolling AS (
  SELECT i.admission, count(*) AS modeled_load
  FROM instants i JOIN public."PatientRecords" a
    ON a.admission > i.admission - interval '1 hour' AND a.admission <= i.admission
  GROUP BY 1
)
SELECT (SELECT sum("servicableBeds") FROM public."Room_Dim") AS total_bays,
  (SELECT round(avg(arrivals), 1) FROM daily) AS average_on_admission_days,
  (SELECT max(arrivals) FROM daily) AS peak_daily_arrivals,
  (SELECT max(modeled_load) FROM rolling) AS peak_modeled_concurrency;

WITH room_instants AS (
  SELECT DISTINCT "roomID", admission FROM public."PatientRecords" WHERE admission IS NOT NULL
), room_load AS (
  SELECT i."roomID", i.admission, count(*) AS modeled_load
  FROM room_instants i
  JOIN public."PatientRecords" b ON b."roomID" = i."roomID"
    AND b.admission > i.admission - interval '1 hour' AND b.admission <= i.admission
  GROUP BY 1, 2
)
SELECT r."roomId", r."roomClass", r."servicableBeds",
  coalesce(max(l.modeled_load), 0) AS modeled_peak,
  count(*) FILTER (WHERE l.modeled_load > r."servicableBeds") AS over_capacity_instants
FROM public."Room_Dim" r LEFT JOIN room_load l ON l."roomID" = r."roomId"
GROUP BY 1, 2, 3 ORDER BY 1;

-- 1. August admissions and attending physicians.
SELECT f."recordID", f.admission, p."patientID",
  concat_ws(' ', p."firstName", p."lastName") AS patient,
  d."doctorID", concat_ws(' ', d."firstName", d."lastName") AS doctor,
  count(*) OVER () AS august_admissions
FROM public."PatientRecords" f
JOIN public."Patient_Dim" p USING ("patientID")
JOIN public."Doctor_Dim" d USING ("doctorID")
WHERE f.admission >= TIMESTAMPTZ '2026-08-01 00:00+08'
  AND f.admission < TIMESTAMPTZ '2026-09-01 00:00+08'
ORDER BY f.admission, f."recordID";

-- 2. Distinct patients who used Room 301 in May.
WITH patients AS (
  SELECT DISTINCT p."patientID", concat_ws(' ', p."firstName", p."lastName") AS patient
  FROM public."PatientRecords" f JOIN public."Patient_Dim" p USING ("patientID")
  WHERE f."roomID" = 301 AND f.admission >= TIMESTAMPTZ '2026-05-01 00:00+08'
    AND f.admission < TIMESTAMPTZ '2026-06-01 00:00+08'
)
SELECT patients.*, count(*) OVER () AS distinct_patients FROM patients ORDER BY "patientID";

-- 3. Distinct Room 303 staff and separate totals by role.
WITH staff AS (
  SELECT DISTINCT 'Doctor' AS role, d."doctorID" AS id, concat_ws(' ', d."firstName", d."lastName") AS name
  FROM public."PatientRecords" f JOIN public."Doctor_Dim" d USING ("doctorID") WHERE f."roomID" = 303
  UNION ALL
  SELECT DISTINCT 'Nurse', n."nurseID", concat_ws(' ', n."firstName", n."lastName")
  FROM public."PatientRecords" f JOIN public."Nurse_Dim" n USING ("nurseID") WHERE f."roomID" = 303
)
SELECT staff.*, count(*) OVER (PARTITION BY role) AS role_total FROM staff ORDER BY role, id;

-- 4. Count and total each May bill once even if facts share it.
SELECT "productName", count(*) AS may_transactions, sum("financialCost") AS service_revenue,
  sum(sum("financialCost")) OVER () AS may_total
FROM public."Bill_Dim"
WHERE "purchasedAt" >= TIMESTAMPTZ '2026-05-01 00:00+08'
  AND "purchasedAt" < TIMESTAMPTZ '2026-06-01 00:00+08'
GROUP BY 1 ORDER BY service_revenue DESC, "productName";
