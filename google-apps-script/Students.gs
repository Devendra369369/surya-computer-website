/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

 /* ==================================================
    SURYA COMPUTER OF EDUCATION CENTER
    File    : Students.gs
    Version : v2.0.0
    Purpose : Student Database Management
 ================================================== */

 "use strict";


 const SURYA_STUDENTS_SHEET =
     "Students";


 /* ==================================================
    GENERATE ADMISSION ID
 ================================================== */

 function generateAdmissionId() {

     const sheet =
         getSheet(
             SURYA_STUDENTS_SHEET
         );


     const lastRow =
         sheet.getLastRow();


     if (lastRow < 2) {

         return "SC-ADM-0001";

     }


     const values =
         sheet
             .getRange(
                 2,
                 2,
                 lastRow - 1,
                 1
             )
             .getValues();


     let maxNumber =
         0;


     values.forEach(
         function(row) {

             const id =
                 String(
                     row[0] || ""
                 )
                 .trim()
                 .toUpperCase();


             if (
                 id.startsWith(
                     "SC-ADM-"
                 )
             ) {

                 const number =
                     parseInt(
                         id.replace(
                             "SC-ADM-",
                             ""
                         ),
                         10
                     );


                 if (
                     !isNaN(number) &&
                     number > maxNumber
                 ) {

                     maxNumber =
                         number;

                 }

             }

         }
     );


     return (
         "SC-ADM-" +
         String(
             maxNumber + 1
         ).padStart(
             4,
             "0"
         )
     );

 }


 /* ==================================================
   GENERATE STUDENT ID
   FORMAT: SC + COURSE PREFIX + SEQUENCE
   Examples:
   CCC           → SCCCC0001
   ADCA          → SCADCA0001
   TALLY PRIME   → SCTALLY0001
   BASIC COMPUTER→ SCBASIC0001
   ================================================== */

function generateStudentId(course) {

    course =
        String(course || "")
            .trim()
            .toUpperCase();

    /* =========================================
       COURSE PREFIX MAPPING
    ========================================= */

    const courseMap = {

        "CCC": "CCC",

        "DCA": "DCA",

        "डीसीए": "DCA",

        "ADCA": "ADCA",

        "एडीसीए": "ADCA",

        "TALLY PRIME": "TALLY",

        "TALLY": "TALLY",

        "BASIC COMPUTER": "BASIC",

        "BASIC": "BASIC"

    };

    let prefix =
        courseMap[course] || "";

    /* =========================================
       UNKNOWN COURSE
       ========================================= */

    if (!prefix) {

        prefix =
            course
                .replace(/[^A-Z0-9]/g, "")
                .substring(0, 5) ||
            "GEN";

    }

    /* =========================================
       STUDENTS SHEET
       ========================================= */

    const sheet =
        getSheet(
            SURYA_STUDENTS_SHEET
        );

    const lastRow =
        sheet.getLastRow();

    const expectedPrefix =
        "SC" + prefix;

    let maxNumber = 0;

    /* =========================================
       READ EXISTING STUDENT IDs
       ========================================= */

    if (lastRow >= 2) {

        const values =
            sheet
                .getRange(
                    2,
                    1,
                    lastRow - 1,
                    1
                )
                .getValues();

        values.forEach(function(row) {

            const id =
                String(row[0] || "")
                    .trim()
                    .toUpperCase();

            if (
                id.startsWith(
                    expectedPrefix
                )
            ) {

                const number =
                    parseInt(
                        id.substring(
                            expectedPrefix.length
                        ),
                        10
                    );

                if (
                    !isNaN(number) &&
                    number > maxNumber
                ) {

                    maxNumber = number;

                }

            }

        });

    }

    /* =========================================
       NEXT COURSE-WISE STUDENT ID
       ========================================= */

    return (
        expectedPrefix +
        String(maxNumber + 1)
            .padStart(4, "0")
    );

}

/* ==================================================
    SAVE STUDENT RECORD
 ================================================== */

 function saveStudentRecord(
     studentId,
     admissionId,
     application
 ) {

     if (!studentId) {

         throw new Error(
             "Student ID is required."
         );

     }


     if (!admissionId) {

         throw new Error(
             "Admission ID is required."
         );

     }


     if (!application) {

         throw new Error(
             "Application data is missing."
         );

     }


     const sheet =
         getSheet(
             SURYA_STUDENTS_SHEET
         );


     /* =========================================
        DUPLICATE STUDENT ID CHECK
     ========================================= */

     const lastRow =
         sheet.getLastRow();


     if (lastRow > 1) {

         const values =
             sheet
                 .getRange(
                     2,
                     1,
                     lastRow - 1,
                     1
                 )
                 .getValues();


         for (
             let i = 0;
             i < values.length;
             i++
         ) {

             if (
                 String(
                     values[i][0] || ""
                 )
                 .trim()
                 .toUpperCase()
                 ===
                 String(
                     studentId
                 )
                 .trim()
                 .toUpperCase()
             ) {

                 throw new Error(
                     "Student ID already exists."
                 );

             }

         }

     }


     /* =========================================
        STUDENT DATA
     ========================================= */

     const studentName =
         application["Student Name"] ||
         application.Name ||
         "";

     const fatherName =
         application["Father Name"] ||
         "";

     const motherName =
         application["Mother Name"] ||
         "";

     const dob =
         application["Date of Birth"] ||
         application.DOB ||
         "";

     const mobile =
         application.Mobile ||
         application.mobile ||
         "";

     const email =
         application.Email ||
         application.email ||
         "";

     const address =
         application.Address ||
         application.address ||
         "";

     const course =
         application.Course ||
         application.course ||
         "";

     const photo =
         application.Photo ||
         application.photo ||
         "";

     const signature =
         application.Signature ||
         application.signature ||
         "";


     /* =========================================
        SAVE STUDENT
     ========================================= */

     sheet.appendRow([

         studentId,

         admissionId,

         studentName,

         fatherName,

         motherName,

         dob,

         mobile,

         email,

         address,

         course,

         photo,

         signature,

         new Date(),

         "Active"

     ]);


     return {

         success:
             true,

         studentId:
             studentId,

         admissionId:
             admissionId,

         status:
             "Active"

     };

 }


 /* ==================================================
    GET ALL STUDENTS
 ================================================== */

 function getStudents() {

     const sheet =
         getSheet(
             SURYA_STUDENTS_SHEET
         );


     const values =
         sheet
             .getDataRange()
             .getValues();


     if (
         values.length < 2
     ) {

         return jsonResponse({

             success:
                 true,

             students:
                 []

         });

     }


     const headers =
         values[0];


     const students =
         [];


     for (
         let i = 1;
         i < values.length;
         i++
     ) {

         const record =
             {};


         headers.forEach(
             function(
                 header,
                 index
             ) {

                 record[
                     String(
                         header
                     ).trim()
                 ] =
                     values[i][index];

             }
         );


         students.push(
             record
         );

     }


     return jsonResponse({

         success:
             true,

         students:
             students

     });

 }


 /* ==================================================
    GET SINGLE STUDENT
 ================================================== */

 function getStudent(
     studentId
 ) {

     studentId =
         String(
             studentId || ""
         )
         .trim();


     if (!studentId) {

         return jsonResponse({

             success:
                 false,

             message:
                 "Student ID is required."

         });

     }


     const sheet =
         getSheet(
             SURYA_STUDENTS_SHEET
         );


     const values =
         sheet
             .getDataRange()
             .getValues();


     if (
         values.length < 2
     ) {

         return jsonResponse({

             success:
                 false,

             message:
                 "No students found."

         });

     }


     const headers =
         values[0];


     for (
         let i = 1;
         i < values.length;
         i++
     ) {

         if (
             String(
                 values[i][0] || ""
             )
             .trim()
             .toUpperCase()
             ===
             studentId
                 .toUpperCase()
         ) {

             const student =
                 {};


             headers.forEach(
                 function(
                     header,
                     index
                 ) {

                     student[
                         String(
                             header
                         ).trim()
                     ] =
                         values[i][index];

                 }
             );


             return jsonResponse({

                 success:
                     true,

                 student:
                     student

             });

         }

     }


     return jsonResponse({

         success:
             false,

         message:
             "Student not found."

     });

 }


 /* ==================================================
    UPDATE STUDENT DETAILS
    Admin-only route. Updates only editable fields.
 ================================================== */

 function updateStudent(
     studentId,
     name,
     fatherName,
     course,
     mobile,
     status
 ) {

     studentId = String(studentId || "").trim();
     name = String(name || "").trim();
     fatherName = String(fatherName || "").trim();
     course = String(course || "").trim();
     mobile = String(mobile || "").trim();
     status = String(status || "").trim();

     if (!studentId) {
         return jsonResponse({success:false, message:"Student ID is required."});
     }

     if (!name) {
         return jsonResponse({success:false, message:"Student name is required."});
     }

     const sheet = getSheet(SURYA_STUDENTS_SHEET);
     const values = sheet.getDataRange().getValues();

     if (values.length < 2) {
         return jsonResponse({success:false, message:"No students found."});
     }

     const headers = values[0].map(function(h) { return String(h || "").trim(); });
     const headerIndex = {};
     headers.forEach(function(h, i) { if (h) headerIndex[h.toLowerCase()] = i + 1; });

     const rowNumber = values.findIndex(function(row, i) {
         return i > 0 && String(row[0] || "").trim().toUpperCase() === studentId.toUpperCase();
     });

     if (rowNumber < 1) {
         return jsonResponse({success:false, message:"Student not found."});
     }

     const updates = {
         "student name": name,
         "name": name,
         "father name": fatherName,
         "course": course,
         "mobile": mobile,
         "status": status || "Active"
     };

     Object.keys(updates).forEach(function(key) {
         const col = headerIndex[key];
         if (col) sheet.getRange(rowNumber + 1, col).setValue(updates[key]);
     });

     return jsonResponse({
         success: true,
         message: "Student details updated successfully.",
         studentId: studentId
     });
 }


 /* ==================================================
    UPDATE STUDENT STATUS
 ================================================== */

 function updateStudentStatus(
     studentId,
     status
 ) {

     studentId =
         String(
             studentId || ""
         )
         .trim();


     status =
         String(
             status || ""
         )
         .trim();


     if (!studentId) {

         return jsonResponse({

             success:
                 false,

             message:
                 "Student ID is required."

         });

     }


     if (!status) {

         return jsonResponse({

             success:
                 false,

             message:
                 "Student status is required."

         });

     }


     const sheet =
         getSheet(
             SURYA_STUDENTS_SHEET
         );


     const values =
         sheet
             .getDataRange()
             .getValues();


     for (
         let i = 1;
         i < values.length;
         i++
     ) {

         if (
             String(
                 values[i][0] || ""
             )
             .trim()
             .toUpperCase()
             ===
             studentId
                 .toUpperCase()
         ) {

             sheet
                 .getRange(
                     i + 1,
                     14
                 )
                 .setValue(
                     status
                 );


             return jsonResponse({

                 success:
                     true,

                 message:
                     "Student status updated successfully.",

                 studentId:
                     studentId,

                 status:
                     status

             });

         }

     }


     return jsonResponse({

         success:
             false,

         message:
             "Student not found."

     });

 }


 /* ==================================================
    STUDENTS MODULE READY
 ================================================== */

 console.log(
     "SURYA STUDENTS MANAGER v2.0.0 READY!"
 );