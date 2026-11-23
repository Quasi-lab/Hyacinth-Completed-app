-- Read-only verification for the existing Finals import.
begin transaction isolation level repeatable read read only;

with warehouse as (
  select f."recordID", f.admission, b."financialCost",
    p."patientID" is null or d."doctorID" is null or n."nurseID" is null
      or r."roomId" is null or b."billID" is null as missing_reference,
    case
      when f."recordID" between 1 and 1504 then 'midterm'
      when f."recordID" between -5000 and -1 then 'finals additions'
      else 'outside cohorts'
    end as cohort
  from public."PatientRecords" f
  left join public."Patient_Dim" p on p."patientID" = f."patientID"
  left join public."Doctor_Dim" d on d."doctorID" = f."doctorID"
  left join public."Nurse_Dim" n on n."nurseID" = f."nurseID"
  left join public."Room_Dim" r on r."roomId" = f."roomID"
  left join public."Bill_Dim" b on b."billID" = f."billID"
)
select coalesce(cohort, 'warehouse total') as cohort,
  count(*) as admissions,
  count(*) - count(distinct "recordID") as duplicate_record_ids,
  count(*) filter (where missing_reference) as missing_references,
  count(*) filter (
    where admission >= timestamptz '2026-08-01 00:00:00 Asia/Manila'
      and admission < timestamptz '2026-09-01 00:00:00 Asia/Manila'
  ) as august_admissions,
  sum("financialCost"::numeric) as billed
from warehouse
group by grouping sets ((cohort), ());

-- Compare the same membership and Manila reporting periods as the Finals UI.
with scopes(name) as (values ('midterm'), ('midterm plus finals')),
cohort_facts as (
  select s.name, f.*
  from scopes s
  join public."PatientRecords" f on f."recordID" between 1 and 1504
    or (s.name = 'midterm plus finals' and f."recordID" between -5000 and -1)
),
cohort_bills as (
  select distinct name, "billID" from cohort_facts
),
scenario_facts as (
  select name,
    count(*) filter (
      where admission >= timestamptz '2026-08-01 00:00:00 Asia/Manila'
        and admission < timestamptz '2026-09-01 00:00:00 Asia/Manila'
    ) as august_admissions,
    count(distinct "patientID") filter (
      where "roomID" = 301
        and admission >= timestamptz '2026-05-01 00:00:00 Asia/Manila'
        and admission < timestamptz '2026-06-01 00:00:00 Asia/Manila'
    ) as may_room_301_patients,
    count(distinct "doctorID") filter (where "roomID" = 303) as room_303_doctors,
    count(distinct "nurseID") filter (where "roomID" = 303) as room_303_nurses
  from cohort_facts
  group by name
),
scenario_bills as (
  select c.name, sum(b."financialCost"::numeric) as may_billed
  from cohort_bills c
  join public."Bill_Dim" b using ("billID")
  where b."purchasedAt" >= timestamptz '2026-05-01 00:00:00 Asia/Manila'
    and b."purchasedAt" < timestamptz '2026-06-01 00:00:00 Asia/Manila'
  group by c.name
)
select s.name, f.august_admissions, f.may_room_301_patients,
  f.room_303_doctors, f.room_303_nurses, coalesce(b.may_billed, 0) as may_billed
from scopes s
left join scenario_facts f using (name)
left join scenario_bills b using (name)
order by s.name;

-- PostgreSQL execution time for the same count query at the two cohort sizes.
explain (analyze, timing off)
select count(*) from public."PatientRecords" where "recordID" between 1 and 1504;

explain (analyze, timing off)
select count(*) from public."PatientRecords"
where "recordID" between 1 and 1504 or "recordID" between -5000 and -1;

commit;
