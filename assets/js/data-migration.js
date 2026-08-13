/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : data-migration.js
   Version : v1.0.0
   Purpose : Existing Data Structure Migration
   Author  : Devendra Kumar
   Guide   : AERON
================================================== */


/* ==================================================
   MIGRATION SYSTEM
================================================== */

function runSuryaDataMigration() {

    const data =
        loadSuryaData();


    let changed = false;


    /* ==================================================
       ENSURE MODULES EXIST
    ================================================== */

    if (!Array.isArray(data.admissions)) {

        data.admissions = [];
        changed = true;

    }


    if (!Array.isArray(data.students)) {

        data.students = [];
        changed = true;

    }


    if (!Array.isArray(data.results)) {

        data.results = [];
        changed = true;

    }


    if (!Array.isArray(data.certificates)) {

        data.certificates = [];
        changed = true;

    }


    /* ==================================================
       LINK STUDENTS WITH APPLICATIONS
       ONLY WHEN MATCH IS CERTAIN
    ================================================== */

    data.students.forEach(
        function(student) {

            /* ------------------------------------------
               Already linked
            ------------------------------------------ */

            if (
                student.applicationId &&
                student.admissionId
            ) {

                return;

            }


            /* ------------------------------------------
               Find application using existing
               admissionId if available
            ------------------------------------------ */

            let matchedApplication = null;


            if (student.admissionId) {

                matchedApplication =
                    data.admissions.find(
                        function(application) {

                            return (
                                application.admissionId ===
                                student.admissionId
                            );

                        }
                    );

            }


            /* ------------------------------------------
               Find by exact student name + mobile
               ONLY when unique
            ------------------------------------------ */

            if (!matchedApplication) {

                const matches =
                    data.admissions.filter(
                        function(application) {

                            return (

                                application.studentName ===
                                student.name

                                &&

                                application.mobile ===
                                student.mobile

                            );

                        }
                    );


                if (matches.length === 1) {

                    matchedApplication =
                        matches[0];

                }

            }


            /* ------------------------------------------
               Apply confirmed relation
            ------------------------------------------ */

            if (matchedApplication) {

                student.applicationId =
                    matchedApplication.id;


                if (
                    matchedApplication.admissionId
                ) {

                    student.admissionId =
                        matchedApplication.admissionId;

                }


                if (
                    matchedApplication.studentId
                ) {

                    student.id =
                        matchedApplication.studentId;

                }


                changed = true;

            }

        }
    );


    /* ==================================================
       LINK APPLICATIONS WITH STUDENTS
    ================================================== */

    data.admissions.forEach(
        function(application) {

            if (
                application.studentId &&
                application.admissionId
            ) {

                return;

            }


            const matchedStudent =
                data.students.find(
                    function(student) {

                        return (

                            student.applicationId ===
                            application.id

                        );

                    }
                );


            if (matchedStudent) {

                application.studentId =
                    matchedStudent.id;


                if (
                    matchedStudent.admissionId
                ) {

                    application.admissionId =
                        matchedStudent.admissionId;

                }


                changed = true;

            }

        }
    );


    /* ==================================================
       LINK CERTIFICATES WITH STUDENTS
    ================================================== */

    data.certificates.forEach(
        function(certificate) {

            if (
                certificate.studentId
            ) {

                return;

            }


            const matchedStudent =
                data.students.find(
                    function(student) {

                        return (

                            student.name ===
                            certificate.studentName

                            &&

                            student.course ===
                            certificate.course

                        );

                    }
                );


            if (matchedStudent) {

                certificate.studentId =
                    matchedStudent.id;

                changed = true;

            }

        }
    );


    /* ==================================================
       SAVE ONLY IF CHANGES EXIST
    ================================================== */

    if (changed) {

        saveSuryaData(data);

        console.log(
            "✅ SURYA DATA MIGRATION COMPLETED."
        );

    }
    else {

        console.log(
            "ℹ️ SURYA DATA MIGRATION: No changes required."
        );

    }

}


/* ==================================================
   RUN MIGRATION
================================================== */

runSuryaDataMigration();


/* ==================================================
   MIGRATION SYSTEM READY
================================================== */

console.log(
    "SURYA DATA MIGRATION READY!"
);