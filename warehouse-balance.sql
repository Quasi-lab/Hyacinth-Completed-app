-- Run all statements in one Supabase SQL Editor execution.
-- Preview only. After approval, change FALSE to TRUE to apply atomically.
BEGIN;
SET LOCAL statement_timeout = '120s';

CREATE TEMP TABLE balance_config ON COMMIT DROP AS SELECT FALSE AS apply_changes;
DO $$
BEGIN
  IF (SELECT apply_changes FROM balance_config) THEN
    LOCK TABLE public."PatientRecords", public."Patient_Dim", public."Bill_Dim",
      public."Doctor_Dim", public."Nurse_Dim", public."Room_Dim" IN SHARE ROW EXCLUSIVE MODE;
  END IF;
END $$;

CREATE TEMP TABLE balance_fact ON COMMIT DROP AS
SELECT f.*, CASE b."productName" WHEN 'ECG' THEN 'cardio'
  WHEN 'Dengue NS1 Test' THEN 'infectious' ELSE 'general' END AS team
FROM public."PatientRecords" f JOIN public."Bill_Dim" b USING ("billID");

CREATE TEMP TABLE balance_staff ON COMMIT DROP AS
SELECT 'doctor'::text AS role, "doctorID" AS id, CASE "medicalSpecialization"
  WHEN 'Cardiology' THEN 'cardio' WHEN 'Infectious Disease' THEN 'infectious' ELSE 'general' END AS team,
  FALSE AS is_new FROM public."Doctor_Dim"
UNION ALL
SELECT 'nurse', "nurseID", CASE
  WHEN "areaAssignment" IN ('Emergency Room') THEN 'infectious'
  WHEN "areaAssignment" = 'Medical Ward' THEN 'cardio'
  WHEN "areaAssignment" IN ('ICU', 'Intensive Care Unit') THEN 'legacy' ELSE 'general' END,
  FALSE FROM public."Nurse_Dim";

CREATE TEMP TABLE balance_rooms ON COMMIT DROP AS
SELECT "roomId" AS id, "servicableBeds" AS capacity, FALSE AS is_new
FROM public."Room_Dim"
UNION ALL VALUES (401, 6, TRUE), (402, 6, TRUE);

-- Three existing encounters overlap in the one-hour planning model.
-- Increase the modeled capacity only after confirming this third bay can be staffed.
UPDATE balance_rooms SET capacity = 3 WHERE id = 301 AND capacity = 2;

CREATE TEMP TABLE balance_assignment (
  fact_id bigint PRIMARY KEY, admitted timestamptz NOT NULL,
  patient_id bigint NOT NULL, doctor_id bigint NOT NULL, nurse_id bigint NOT NULL, room_id int NOT NULL
) ON COMMIT DROP;
CREATE INDEX ON balance_assignment (doctor_id, admitted);
CREATE INDEX ON balance_assignment (nurse_id, admitted);
CREATE INDEX ON balance_assignment (room_id, admitted);

CREATE TEMP TABLE balance_merge (
  source_patient bigint PRIMARY KEY, target_patient bigint UNIQUE NOT NULL, fact_id bigint UNIQUE NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE
  encounter RECORD;
  staff_role text;
  assigned_doctor bigint;
  assigned_nurse bigint;
  assigned_room int;
  chosen_staff bigint;
  previous_capacity int;
  merge_count int;
BEGIN
  IF (SELECT count(*) FROM balance_fact) <> 6504
     OR (SELECT count(*) FROM balance_fact WHERE "recordID" BETWEEN -5000 AND -1) <> 5000
     OR EXISTS (SELECT 1 FROM balance_fact WHERE admission IS NULL)
     OR (SELECT count(*) FROM public."Patient_Dim") <> 6503
     OR (SELECT count(*) FROM public."Room_Dim") <> 15
     OR (SELECT count(*) FROM public."Doctor_Dim") <> 8
     OR (SELECT count(*) FROM public."Nurse_Dim") <> 8 THEN
    RAISE EXCEPTION 'Warehouse differs from the audited snapshot; rerun the audit before applying';
  END IF;

  IF (SELECT count(*) FROM public."Room_Dim" WHERE "roomId" = 301 AND "servicableBeds" = 2) <> 1
     OR EXISTS (SELECT id FROM balance_rooms GROUP BY id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Room capacity or proposed IDs differ from the audited plan';
  END IF;

  INSERT INTO balance_assignment
  SELECT "recordID", admission, "patientID", "doctorID", "nurseID", "roomID"
  FROM balance_fact WHERE "recordID" NOT BETWEEN -5000 AND -1;

  FOR encounter IN SELECT * FROM balance_fact WHERE "recordID" BETWEEN -5000 AND -1 ORDER BY admission, "recordID"
  LOOP
    SELECT r.id INTO assigned_room
    FROM balance_rooms r
    WHERE r.capacity > 0 AND (
      (encounter.team = 'infectious' AND r.is_new)
      OR (encounter.team <> 'infectious' AND NOT r.is_new AND r.id <> 302)
    )
    AND (SELECT count(*) FROM balance_assignment a
      WHERE a.room_id = r.id
        AND a.admitted > encounter.admission - interval '1 hour'
        AND a.admitted < encounter.admission + interval '1 hour') < r.capacity
    ORDER BY (r.id = encounter."roomID") DESC, r.id
    LIMIT 1;

    IF assigned_room IS NULL THEN
      RAISE EXCEPTION 'No eligible room can accommodate fact %', encounter."recordID";
    END IF;

    FOREACH staff_role IN ARRAY ARRAY['doctor','nurse'] LOOP
      SELECT s.id INTO chosen_staff
      FROM balance_staff s
      CROSS JOIN LATERAL (
        SELECT count(*) AS load
        FROM balance_assignment a
        WHERE ((staff_role = 'doctor' AND a.doctor_id = s.id)
           OR (staff_role = 'nurse' AND a.nurse_id = s.id))
          AND a.admitted > encounter.admission - interval '1 hour'
          AND a.admitted < encounter.admission + interval '1 hour'
      ) workload
      WHERE s.role = staff_role AND s.team = encounter.team AND workload.load < 3
      ORDER BY s.is_new, workload.load, s.id
      LIMIT 1;

      IF chosen_staff IS NULL THEN
        SELECT greatest(8999, coalesce(max(id), 8999)) + 1 INTO chosen_staff
        FROM balance_staff WHERE role = staff_role;
        INSERT INTO balance_staff VALUES (staff_role, chosen_staff, encounter.team, TRUE);
      END IF;

      IF staff_role = 'doctor' THEN assigned_doctor := chosen_staff;
      ELSE assigned_nurse := chosen_staff;
      END IF;
    END LOOP;

    INSERT INTO balance_assignment VALUES
      (encounter."recordID", encounter.admission, encounter."patientID", assigned_doctor, assigned_nurse, assigned_room);
  END LOOP;

  SELECT (SELECT count(*) FROM balance_staff WHERE is_new)
       + (SELECT count(*) FROM balance_rooms r WHERE is_new
            AND EXISTS (SELECT FROM balance_assignment a WHERE a.room_id = r.id))
  INTO merge_count;

  -- Join pairs of synthetic patients with the same service on separate dates.
  -- Each source and target has exactly one fact and neither is a legacy patient.
  INSERT INTO balance_merge
  WITH candidates AS (
    SELECT f."recordID", f."patientID", f.admission, b."productName",
      row_number() OVER (PARTITION BY b."productName" ORDER BY f.admission, f."recordID") AS rn,
      count(*) OVER (PARTITION BY b."productName") AS group_size
    FROM balance_fact f JOIN public."Bill_Dim" b USING ("billID")
    JOIN public."Patient_Dim" p USING ("patientID")
    WHERE f."recordID" BETWEEN -5000 AND -1 AND f."recordID" = f."patientID"
      AND p."firstName" = 'Synthetic'
      AND (SELECT count(*) FROM balance_assignment a WHERE a.patient_id = f."patientID") = 1
  )
  SELECT later."patientID", earlier."patientID", later."recordID"
  FROM candidates earlier JOIN candidates later
    ON later."productName" = earlier."productName" AND later.rn = earlier.rn + earlier.group_size / 2
  WHERE earlier.rn <= earlier.group_size / 2
    AND later.admission >= earlier.admission + interval '7 days'
  ORDER BY (later.admission - earlier.admission) DESC, later."recordID"
  LIMIT merge_count;

  GET DIAGNOSTICS previous_capacity = ROW_COUNT;
  IF previous_capacity <> merge_count THEN
    RAISE EXCEPTION 'Could not find enough eligible synthetic repeat visits';
  END IF;

  UPDATE balance_assignment a SET patient_id = m.target_patient
  FROM balance_merge m WHERE a.fact_id = m.fact_id;

  IF EXISTS (
    SELECT 1 FROM balance_assignment a JOIN balance_rooms r ON r.id = a.room_id
    JOIN balance_assignment b ON b.room_id = a.room_id
      AND b.admitted > a.admitted - interval '1 hour' AND b.admitted <= a.admitted
    GROUP BY a.fact_id, r.capacity HAVING count(*) > r.capacity
  ) OR EXISTS (
    SELECT 1 FROM balance_assignment a JOIN balance_assignment b
      ON b.doctor_id = a.doctor_id
      AND b.admitted > a.admitted - interval '1 hour' AND b.admitted <= a.admitted
    GROUP BY a.fact_id HAVING count(*) > 3
  ) OR EXISTS (
    SELECT 1 FROM balance_assignment a JOIN balance_assignment b
      ON b.nurse_id = a.nurse_id
      AND b.admitted > a.admitted - interval '1 hour' AND b.admitted <= a.admitted
    GROUP BY a.fact_id HAVING count(*) > 3
  ) THEN
    RAISE EXCEPTION 'The proposed assignments exceed modeled capacity';
  END IF;

  IF (SELECT apply_changes FROM balance_config) THEN
    INSERT INTO public."Doctor_Dim" ("doctorID", "firstName", "lastName", "medicalSpecialization")
    SELECT id, 'Synthetic', 'Clinician ' || id,
      CASE team WHEN 'cardio' THEN 'Cardiology' WHEN 'infectious' THEN 'Infectious Disease' ELSE 'General Practice' END
    FROM balance_staff WHERE is_new AND role = 'doctor';

    INSERT INTO public."Nurse_Dim" ("nurseID", "firstName", "lastName", "areaAssignment")
    SELECT id, 'Synthetic', 'Nurse ' || id,
      CASE team WHEN 'cardio' THEN 'Cardiac Diagnostics' WHEN 'infectious' THEN 'Infection Screening' ELSE 'Outpatient Diagnostics' END
    FROM balance_staff WHERE is_new AND role = 'nurse';

    INSERT INTO public."Room_Dim" ("roomId", "servicableBeds", "currentAvailability", "roomClass")
    SELECT id, capacity, TRUE, 'Infection Screening Ward' FROM balance_rooms r
    WHERE is_new AND EXISTS (SELECT FROM balance_assignment a WHERE a.room_id = r.id);

    UPDATE public."Room_Dim" SET "servicableBeds" = 3 WHERE "roomId" = 301;
    UPDATE public."PatientRecords" f SET "doctorID" = a.doctor_id, "nurseID" = a.nurse_id,
      "roomID" = a.room_id, "patientID" = a.patient_id
    FROM balance_assignment a WHERE f."recordID" = a.fact_id AND a.fact_id BETWEEN -5000 AND -1;

    DELETE FROM public."Patient_Dim" p USING balance_merge m
    WHERE p."patientID" = m.source_patient AND p."firstName" = 'Synthetic'
      AND NOT EXISTS (SELECT FROM public."PatientRecords" f WHERE f."patientID" = p."patientID");
    GET DIAGNOSTICS previous_capacity = ROW_COUNT;
    IF previous_capacity <> merge_count OR (SELECT count(*) FROM public."PatientRecords") <> 6504
       OR (SELECT count(*) FROM public."Patient_Dim") + (SELECT count(*) FROM public."Doctor_Dim")
          + (SELECT count(*) FROM public."Nurse_Dim") + (SELECT count(*) FROM public."Room_Dim") <> 6534
    THEN
      RAISE EXCEPTION 'Post-change counts failed validation';
    END IF;
  END IF;
END $$;

-- Results use the captured original assignments and proposed assignments.
WITH comparison AS (
  SELECT 'current' AS version, "recordID" AS id, admission AS admitted,
    "patientID" AS patient, "doctorID" AS doctor, "nurseID" AS nurse, "roomID" AS room
  FROM balance_fact
  UNION ALL
  SELECT 'proposed', fact_id, admitted, patient_id, doctor_id, nurse_id, room_id
  FROM balance_assignment
), scenarios AS (
  SELECT version,
    count(*) FILTER (WHERE admitted >= TIMESTAMPTZ '2026-08-01 00:00+08'
      AND admitted < TIMESTAMPTZ '2026-09-01 00:00+08') AS august_admissions,
    count(DISTINCT patient) FILTER (WHERE room = 301 AND admitted >= TIMESTAMPTZ '2026-05-01 00:00+08'
      AND admitted < TIMESTAMPTZ '2026-06-01 00:00+08') AS may_room_301_patients,
    count(DISTINCT doctor) FILTER (WHERE room = 303) AS room_303_doctors,
    count(DISTINCT nurse) FILTER (WHERE room = 303) AS room_303_nurses
  FROM comparison GROUP BY version
)
SELECT (SELECT apply_changes FROM balance_config) AS applied,
  (SELECT count(*) FROM balance_assignment) AS facts,
  (SELECT count(*) FROM balance_merge) AS synthetic_patients_removed,
  (SELECT jsonb_agg(to_jsonb(s) ORDER BY role,id) FROM balance_staff s WHERE is_new) AS additional_staff,
  (SELECT array_agg(id ORDER BY id) FROM balance_rooms r WHERE is_new
    AND EXISTS (SELECT FROM balance_assignment a WHERE a.room_id = r.id)) AS additional_rooms,
  (SELECT jsonb_agg(to_jsonb(s) ORDER BY version) FROM scenarios s) AS scenarios,
  (SELECT sum("financialCost") FROM public."Bill_Dim"
    WHERE "purchasedAt" >= TIMESTAMPTZ '2026-05-01 00:00+08'
      AND "purchasedAt" < TIMESTAMPTZ '2026-06-01 00:00+08') AS may_revenue;
COMMIT;
