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
        data.password,
        data.clientInfo || {}
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
   EMERGENCY 24-HOUR ADMIN LOCK
========================================= */

if (
    action === "lockAdminFor24Hours"
) {

    return lockAdminFor24Hours(
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
   ADMIN PASSWORD RECOVERY - REQUEST OTP
========================================= */

if (action === "requestAdminPasswordReset") {

    return requestAdminPasswordReset(
        data.username,
        data.recoveryEmail
    );

}

/* =========================================
   ADMIN PASSWORD RECOVERY - RESET
========================================= */

if (action === "resetAdminPasswordWithOtp") {

    return resetAdminPasswordWithOtp(
        data.username,
        data.otp,
        data.newPassword
    );

}

/* =========================================
   ADMIN SECURITY EVENT / ALERT
========================================= */

if (action === "recordAdminSecurityEvent") {

    return recordAdminSecurityEvent(
        data.token,
        data.eventType,
        data.clientInfo
    );

}

        /* =========================================
           PUBLIC: EMERGENCY ADMIN LOCK
        ========================================= */
        if (action === "emergencyLockAdmin") {
            return emergencyLockAdmin(data.password);
        }

        /* =========================================
           PUBLIC: STUDENT AUTHENTICATION
        ========================================= */
        if (action === "studentLogin") return jsonResponse(studentLogin_(data.studentId, data.password));
        if (action === "studentRequestReset") return jsonResponse(studentRequestReset_(data.studentId, data.email));
        if (action === "studentResetPassword") return jsonResponse(studentResetPassword_(data.studentId, data.email, data.otp, data.newPassword));
        if (action === "studentAdminSetPassword") {
            if (!verifyAdminSession(String(data.token || ""))) return jsonResponse({success:false,authenticated:false,message:"Unauthorized. Admin login required."});
            return jsonResponse(studentAdminSetPassword_(data.token, data.studentId, data.newPassword));
        }

        /* =========================================
           PUBLIC: CONTACT MESSAGE
        ========================================= */
        if (action === "submitContactMessage") {
            return submitContactMessage_(data);
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

        /* =========================================
           STUDENT SESSION ROUTES
        ========================================= */
        if (action === "studentLogout") return jsonResponse(studentLogout_(token));
        if (action === "studentMe") return jsonResponse(studentMe_(token));
        if (action === "studentChangePassword") return jsonResponse(studentChangePassword_(token, data.currentPassword, data.newPassword));

        if (["publishedMockTests","publishedMockQuestions","submitMockTest","mockStudentHistory","liveClasses"].includes(action)) {
            if (!verifyStudentSession(token)) return jsonResponse({success:false,authenticated:false,message:"Student login required."});
            let out;
            if (action === "publishedMockTests") out = apiPublishedMockTests_(token);
            else if (action === "publishedMockQuestions") out = apiPublishedMockQuestions_(token, data.testId);
            else if (action === "submitMockTest") out = apiSubmitMockTest_(token, data.testId, data.answers);
            else if (action === "mockStudentHistory") out = apiMockStudentHistory_(token);
            else out = liveList_(token);
            return jsonResponse(out);
        }

        /* =========================================
           ADMIN MOCK TEST / LIVE CLASS ROUTES
        ========================================= */
        if (["mockTests","saveMockTest","setMockTestStatus","mockQuestions","saveMockQuestion","mockAttempts","liveAdminList","liveSave","liveDelete"].includes(action)) {
            if (!verifyAdminSession(token)) return jsonResponse({success:false,authenticated:false,message:"Unauthorized. Admin login required."});
            if (action === "liveAdminList") return jsonResponse(liveAdminList_(token));
            if (action === "liveSave") return jsonResponse(liveSave_(token, data.class || {}));
            if (action === "liveDelete") return jsonResponse(liveDelete_(token, data.classId));
            return jsonResponse(routeMockAction_(data));
        }

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

/* ==================================================
   PUBLIC CONTACT MESSAGE
================================================== */
function submitContactMessage_(data) {
    const name = String(data.name || "").trim().slice(0, 100);
    const email = String(data.email || "").trim().slice(0, 160);
    const message = String(data.message || "").trim().slice(0, 2000);
    if (!name || !email || !message) return jsonResponse({success:false,message:"Name, email and message are required."});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({success:false,message:"Please enter a valid email address."});
    MailApp.sendEmail({
        to: "sunilkumar5757@gmail.com",
        replyTo: email,
        subject: "SURYA Website Contact — " + name,
        htmlBody: "<p><b>Name:</b> " + escapeHtml_(name) + "</p><p><b>Email:</b> " + escapeHtml_(email) + "</p><p><b>Message:</b><br>" + escapeHtml_(message).replace(/\n/g,"<br>") + "</p>"
    });
    return jsonResponse({success:true,message:"Message sent successfully."});
}

function escapeHtml_(value) {
    return String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
}
