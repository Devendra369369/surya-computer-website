/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File : SetupSheets.gs
   Version : v2.0.0
   Purpose : One-click Google Sheet structure setup + safe header migration
================================================== */
"use strict";

function setupSuryaSheets() {
  const ss = getSuryaSpreadsheet();

  const defs = {
    "Admissions":["Application ID","Student Name","Father Name","Mother Name","Date of Birth","Course","Mobile","Email","Address","Photo URL","Photo Name","Signature URL","Marksheet URL","Aadhaar Uploaded","Aadhaar Mode","Aadhaar Name","Aadhaar Front Name","Aadhaar Back Name","Aadhaar Back Uploaded","Application Date","Status","Aadhaar Front URL","Aadhaar Back URL"],
    "Students":["Student ID","Admission ID","Student Name","Father Name","Mother Name","Date of Birth","Mobile","Email","Address","Course","Photo","Signature","Created At","Status"],
    "StudentAuth":["Student ID","Password Hash","Salt","Email","OTP Hash","OTP Expires","OTP Attempts","Status","Created At","Updated At"],
    "Courses":["Course ID","Course Name","Duration","Fee","Description","Status"],
    "Course Subjects":["Course","Subject ID","Subject Name","Max Marks","Pass Marks","Status"],
    "Results":["Result ID","Student ID","Student Name","Course","Exam","Total Marks","Obtained Marks","Percentage","Grade","Result","Exam Date","Status"],
    "Result Subjects":["Result ID","Student ID","Subject ID","Subject Name","Max Theory Marks","Theory Marks","Max Practical Marks","Practical Marks","Total Max Marks","Obtained Marks","Percentage","Grade","Result","Status"],
    "Certificates":["Certificate ID","Student ID","Student Name","Father Name","Course","Total Marks","Obtained Marks","Percentage","Grade","Final Result","Issue Date","Status","Result ID"],
    "MockTests":["Test ID","Title","Course","Subject ID","Subject Name","Duration","Total Marks","Description","Status","Created At","Updated At"],
    "MockQuestions":["Question ID","Test ID","Question","Option A","Option B","Option C","Option D","Correct Answer","Marks","Status","Created At","Updated At"],
    "MockAttempts":["Attempt ID","Test ID","Test Title","Student ID","Student Name","Score","Total Marks","Percentage","Grade","Result","Submitted At"],
    "MockAnswers":["Attempt ID","Question ID","Student ID","Question","Selected Answer","Correct Answer","Marks","Awarded Marks"],
    "LiveClasses":["Class ID","Title","Course","Teacher","Date","Start Time","End Time","Join URL","Description","Status"],
    "Notices":["Notice ID","Title","Message","Category","Status","Priority","Created At","Updated At"],
    "PublicMedia":["Media ID","Title","Category","File ID","URL","MIME Type","Size Bytes","Status","Sort Order","Created At","Updated At"],
    "ContactMessages":["Message ID","Name","Email","Message","Status","Created At","Handled At","Reply","Replied At"]
  };

  const created = [];
  const addedHeaders = [];

  Object.keys(defs).forEach(function(name) {
    let sh = ss.getSheetByName(name);

    if (!sh) {
      sh = ss.insertSheet(name);
      created.push(name);
    }

    const required = defs[name];
    const lastColumn = sh.getLastColumn();

    let current = [];
    if (lastColumn > 0 && sh.getLastRow() > 0) {
      current = sh.getRange(1, 1, 1, lastColumn)
        .getValues()[0]
        .map(function(x) { return String(x || "").trim(); });
    }

    if (!current.length || current.every(function(x) { return !x; })) {
      sh.getRange(1, 1, 1, required.length).setValues([required]);
    } else {
      required.forEach(function(header) {
        if (current.indexOf(header) === -1) {
          const newCol = sh.getLastColumn() + 1;
          sh.getRange(1, newCol).setValue(header);
          addedHeaders.push(name + " → " + header);
        }
      });
    }

    sh.setFrozenRows(1);
  });

  return {
    success: true,
    message: "SURYA sheets checked and safely migrated.",
    created: created,
    addedHeaders: addedHeaders,
    sheets: Object.keys(defs),
    count: Object.keys(defs).length
  };
}
