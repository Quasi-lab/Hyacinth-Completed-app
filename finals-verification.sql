SELECT COUNT(*) AS total_facts,
       COUNT(*) FILTER (WHERE f."recordID" BETWEEN -5000 AND -1) AS new_facts,
       COUNT(*) FILTER (WHERE f."recordID" NOT BETWEEN -5000 AND -1) AS non_batch_facts,
       COUNT(*) FILTER (WHERE p."patientID" IS NULL OR r."roomId" IS NULL OR
         d."doctorID" IS NULL OR n."nurseID" IS NULL OR b."billID" IS NULL) AS orphaned_facts
FROM public."PatientRecords" f
LEFT JOIN public."Patient_Dim" p ON p."patientID" = f."patientID"
LEFT JOIN public."Room_Dim" r ON r."roomId" = f."roomID"
LEFT JOIN public."Doctor_Dim" d ON d."doctorID" = f."doctorID"
LEFT JOIN public."Nurse_Dim" n ON n."nurseID" = f."nurseID"
LEFT JOIN public."Bill_Dim" b ON b."billID" = f."billID";
