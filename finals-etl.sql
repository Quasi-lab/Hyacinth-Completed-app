-- Synthetic capstone batch. Existing rows and identity sequences are preserved.
BEGIN;
LOCK TABLE public."PatientRecords", public."Patient_Dim", public."Bill_Dim" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public."PatientRecords") < 1000 THEN
    RAISE EXCEPTION 'The midterm baseline requires at least 1,000 facts';
  END IF;
  IF EXISTS (SELECT 1 FROM public."PatientRecords" WHERE "recordID" BETWEEN -5000 AND -1)
     OR EXISTS (SELECT 1 FROM public."Patient_Dim" WHERE "patientID" BETWEEN -5000 AND -1)
     OR EXISTS (SELECT 1 FROM public."Bill_Dim" WHERE "billID" BETWEEN -5000 AND -1) THEN
    RAISE EXCEPTION 'The reserved capstone batch IDs are already in use';
  END IF;
END $$;

CREATE TEMP TABLE finals_batch ON COMMIT DROP AS
WITH cohorts AS (
  SELECT i,
    CASE WHEN i <= 1100 THEN 5 WHEN i <= 2700 THEN 8
         WHEN i <= 3300 THEN 10 WHEN i <= 4000 THEN 11
         ELSE (ARRAY[1,2,3,4,6,7,9])[(i % 7) + 1] END AS month,
    ((i * 113 + i / 7) % 100) AS mix
  FROM generate_series(1, 5000) AS series(i)
), assignments AS (
  SELECT *, make_timestamptz(2026, month, 1 + (i * 17 + i / 29) % 19,
      8 + i % 11, (i * 7) % 60, 0, 'Asia/Manila') AS admitted,
    CASE WHEN month = 5 AND mix < 45 THEN 301
         WHEN mix BETWEEN 45 AND 52 THEN 303
         ELSE 101 + (i * 13 + i / 11) % 12 END AS room,
    CASE WHEN month = 5 AND mix < 55 THEN 1
         WHEN month = 8 AND mix < 62 THEN 2
         ELSE 3 + (i * 13 + i / 7) % 4 END AS service
  FROM cohorts
)
SELECT -i AS id, i, admitted, room,
  CASE WHEN room = 303 THEN (ARRAY[102,2003,2004])[1 + (i % 3)]
       WHEN month = 8 AND mix < 62 THEN 2006
       ELSE (ARRAY[101,102,2001,2002,2003,2004,2005,2006])[1 + ((i * 19 + i / 11) % 8)] END AS doctor,
  CASE WHEN room = 303 THEN (ARRAY[201,3002,3004])[1 + ((i / 3) % 3)]
       ELSE (ARRAY[201,202,3001,3002,3003,3004,3005,3006])[1 + ((i * 3 + i / 13) % 8)] END AS nurse,
  (ARRAY['ECG', 'Dengue NS1 Test', 'CBC', 'Chest X-Ray', 'Urinalysis', 'General Consultation'])[service] AS product,
  round((ARRAY[1050,1500,480,810,340,650])[service]::numeric *
    (0.8 + ((i * 37 + i / 13) % 41) / 100.0) *
    CASE WHEN i % 125 = 0 THEN 8 ELSE 1 END, 2) AS cost,
  CASE WHEN i % 125 = 0 THEN 'Synthetic duplicate-charge test' ELSE 'Synthetic routine encounter' END AS details
FROM assignments;

INSERT INTO public."Patient_Dim" ("patientID", "firstName", "lastName", "patientBdate")
SELECT id, 'Synthetic', 'Patient ' || i, (admitted AT TIME ZONE 'Asia/Manila')::date - (730 + (i * 131) % 31000)
FROM finals_batch;

INSERT INTO public."Bill_Dim" ("billID", "purchasedAt", "productName", "financialCost", details)
SELECT id, admitted, product, cost, details FROM finals_batch;

INSERT INTO public."PatientRecords" ("recordID", admission, "patientID", "roomID", "doctorID", "nurseID", "billID")
SELECT id, admitted, id, room, doctor, nurse, id FROM finals_batch;

COMMIT;
