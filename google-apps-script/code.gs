/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   CENTRAL DATABASE API
   File    : Code.gs
   Version : v1.1.0
   Purpose : Secure Main API Router
================================================== */

"use strict";


/* ==================================================
   GET REQUEST
================================================== */

function doGet(e) {

    const action =
        e &&
        e.parameter &&
        e.parameter.action
            ? String(e.parameter.action).trim()
            : "";


    const id =
        e &&
        e.parameter &&
        e.parameter.id
            ? String(e.parameter.id).trim()
            : "";


    const token =
        e &&
        e.parameter &&
        e.parameter.token
            ? String(e.parameter.token).trim()
            : "";


    /* =========================================
       PUBLIC: CERTIFICATE VERIFICATION
    ========================================= */

    if (action === "certificate") {

        return getCertificate(id);

    }


    /* =========================================
       PUBLIC: HEALTH CHECK
    ========================================= */

    if (action === "") {

        return jsonResponse({

            success: true,

            message:
                "SURYA COMPUTER CENTRAL DATABASE API is working",

            version:
                "1.1.0",

            security:
                "Admin authentication enabled"

        });

    }


    /* =========================================
       ADMIN AUTHENTICATION
    ========================================= */

    if (action === "adminLogin") {

        return adminLogin(

            e.parameter.username,

            e.parameter.password

        );

    }


    if (action === "adminLogout") {

        return adminLogout(token);

    }


    /* =========================================
       VERIFY ADMIN SESSION
    ========================================= */

    if (!verifyAdminSession(token)) {

        return jsonResponse({

            success: false,

            authenticated: false,

            message:
                "Unauthorized. Admin login required."

        });

    }

/* =========================================
   PROTECTED: STUDENT PHOTO
========================================= */

if (action === "studentPhoto") {

    return getStudentPhoto(id);

}

if (action === "studentSignature") {

    return getStudentSignature(id);

}

    /* =========================================
       PROTECTED: APPLICATIONS
    ========================================= */

    if (action === "applications") {

        return getApplications();

    }


    /* =========================================
       PROTECTED: SINGLE APPLICATION
    ========================================= */

    if (action === "application") {

        return getApplication(id);

    }


    /* =========================================
       PROTECTED: STUDENTS
    ========================================= */

    if (action === "students") {

        return getStudents();

    }


    /* =========================================
       PROTECTED: SINGLE STUDENT
    ========================================= */

    if (action === "student") {

        return getStudent(id);

    }
    
    /* =========================================
   PROTECTED: COURSE SUBJECTS
========================================= */

if (action === "courseSubjects") {

    return getCourseSubjects();

}


/* =========================================
   PROTECTED: ALL COURSES
========================================= */

if (action === "courses") {

    return getCourses();

}
/* =========================================
   PROTECTED: ALL RESULTS
========================================= */

if (action === "results") {

    return getResults();

}


/* =========================================
   PROTECTED: SINGLE RESULT
========================================= */

if (action === "result") {

    return getResult(id);

}


/* =========================================
   PROTECTED: RESULT SUBJECTS
========================================= */

if (action === "resultSubjects") {

    return getResultSubjects(id);

}


    /* =========================================
       PROTECTED: ALL CERTIFICATES
    ========================================= */

    if (action === "certificates") {

        return getCertificates();

    }


    return jsonResponse({

        success: false,

        message:
            "Unknown API action."

    });

}


/* ==================================================
   POST REQUEST
================================================== */

function doPost(e) {

    try {
            Logger.log("=== NEW API doPost HIT ===");

        if (!e || !e.postData) {

            return jsonResponse({

                success: false,

                message:
                    "POST data is missing."

            });

        }


        const rawData =
            e.postData.contents;


        if (!rawData) {

            return jsonResponse({

                success: false,

                message:
                    "Request body is empty."

            });

        }


        const data =
            JSON.parse(rawData);


        const action =
            data.action
                ? String(data.action).trim()
                : "";

            /* =========================================
   ADMIN LOGIN
========================================= */

if (
    action === "adminLogin"
) {

    return adminLogin(
        data.username,
        data.password
    );

}


/* =========================================
   ADMIN LOGOUT
========================================= */

if (
    action === "adminLogout"
) {

    return adminLogout(
        data.token
    );

}

/* =========================================
   CHANGE ADMIN PASSWORD
========================================= */

if (
    action ===
    "changeAdminPassword"
) {

    return changeAdminPassword(

        data.token,

        data.currentPassword,

        data.newPassword

    );

}
        /* =========================================
           PUBLIC: SUBMIT ADMISSION
        ========================================= */

        if (
            action ===
            "submitAdmission"
        ) {

            return submitAdmission(
                data
            );

        }

        /* =========================================
           ADMIN TOKEN
        ========================================= */

        const token =
            String(
                data.token || ""
            ).trim();


        if (
            !verifyAdminSession(
                token
            )
        ) {

            return jsonResponse({

                success: false,

                authenticated: false,

                message:
                    "Unauthorized. Admin login required."

            });

        }

/* =========================================
   UPDATE APPLICATION
========================================= */

if (
    action ===
    "updateApplication"
) {

    return updateApplication(

        data

    );

}

        /* =========================================
           ADD COURSE
        ========================================= */

        if (
            action ===
            "addCourse"
        ) {

            return addCourse(

                data.courseId,

                data.courseName,

                data.duration,

                data.fee,

                data.description

            );

        }


        /* =========================================
           UPDATE COURSE
        ========================================= */

        if (
            action ===
            "updateCourse"
        ) {

            return updateCourse(

                data.courseId,

                data.courseName,

                data.duration,

                data.fee,

                data.description,

                data.status

            );

        }


        /* =========================================
           DISABLE COURSE
        ========================================= */

        if (
            action ===
            "disableCourse"
        ) {

            return disableCourse(

                data.courseId

            );

        }


        /* =========================================
           ENABLE COURSE
        ========================================= */

        if (
            action ===
            "enableCourse"
        ) {

            return enableCourse(

                data.courseId

            );

        }


        /* =========================================
           APPROVE APPLICATION
        ========================================= */

        if (
            action ===
            "approveApplication"
        ) {

            return approveApplication(
                data.applicationId
            );

        }


        /* =========================================
           REJECT APPLICATION
        ========================================= */

        if (
            action ===
            "rejectApplication"
        ) {

            return rejectApplication(
                data.applicationId
            );

        }
/* =========================================
   ADD COURSE SUBJECT
========================================= */

if (
    action ===
    "addCourseSubject"
) {

    return addCourseSubject(

        data.course,

        data.subjectId,

        data.subjectName,

        data.maxMarks,

        data.passMarks

    );

}


/* =========================================
   UPDATE COURSE SUBJECT
========================================= */

if (
    action ===
    "updateCourseSubject"
) {

    return updateCourseSubject(

        data.subjectId,

        data.course,

        data.subjectName,

        data.maxMarks,

        data.passMarks,

        data.status

    );

}


/* =========================================
   DISABLE COURSE SUBJECT
========================================= */

if (
    action ===
    "disableCourseSubject"
) {

    return disableCourseSubject(

        data.subjectId

    );

}


/* =========================================
   ENABLE COURSE SUBJECT
========================================= */

if (
    action ===
    "enableCourseSubject"
) {

    return enableCourseSubject(

        data.subjectId

    );

}
/* =========================================
   CREATE RESULT
========================================= */

if (
    action ===
    "createResult"
) {

    return createResult(

        data.studentId,

        data.studentName,

        data.course,

        data.exam,

        data.totalMarks,

        data.obtainedMarks,

        data.examDate,

        data.status,
        
        data.resultId

    );

}


/* =========================================
   UPDATE RESULT
========================================= */

if (
    action ===
    "updateResult"
) {

    return updateResult(

        data.resultId,

        data.studentName,

        data.course,

        data.exam,

        data.totalMarks,

        data.obtainedMarks,

        data.examDate,

        data.status

    );

}


/* =========================================
   DISABLE RESULT
========================================= */

if (
    action ===
    "disableResult"
) {

    return disableResult(

        data.resultId

    );

}


/* =========================================
   ENABLE RESULT
========================================= */

if (
    action ===
    "enableResult"
) {

    return enableResult(

        data.resultId

    );

}


/* =========================================
   GET RESULT SUBJECTS
========================================= */

if (
    action ===
    "getResultSubjects"
) {

    return getResultSubjects(
        data.resultId
    );

}


/* =========================================
   SAVE RESULT SUBJECT
========================================= */

if (
    action ===
    "saveResultSubject"
) {

    return saveResultSubject(

        data.resultId,

        data.studentId,

        data.subjectId,

        data.subjectName,

        data.maxTheoryMarks,

        data.theoryMarks,

        data.maxPracticalMarks,

        data.practicalMarks,

        data.status

    );

}


/* =========================================
   UPDATE RESULT SUBJECT
========================================= */

if (
    action ===
    "updateResultSubject"
) {

    return updateResultSubject(

        data.resultId,

        data.subjectId,

        data.maxTheoryMarks,

        data.theoryMarks,

        data.maxPracticalMarks,

        data.practicalMarks,

        data.status

    );

}


/* =========================================
   DISABLE RESULT SUBJECT
========================================= */

if (
    action ===
    "disableResultSubject"
) {

    return disableResultSubject(

        data.resultId,

        data.subjectId

    );

}
/* =========================================
   CREATE CERTIFICATE FROM RESULT
========================================= */

if (
    action ===
    "createCertificateFromResult"
) {

    return createCertificateFromResult(
        data.resultId
    );

}


/* =========================================
   DISABLE CERTIFICATE
========================================= */

if (
    action ===
    "disableCertificate"
) {

    return disableCertificate(
        data.certificateId
    );

}

        return jsonResponse({

            success: false,

            message:
                "Unknown POST action."

        });

    }


    catch (error) {

        console.error(
            "API POST ERROR:",
            error
        );


        return jsonResponse({

            success: false,

            message:
                error.message ||
                String(error)

        });

    }

}


/* ==================================================
   HEALTH TEST
================================================== */

function testHealthCheck() {

    return jsonResponse({

        success: true,

        message:
            "SURYA COMPUTER CENTRAL DATABASE BACKEND OK",

        version:
            "1.1.0",

        security:
            "Admin authentication enabled"

    });

}