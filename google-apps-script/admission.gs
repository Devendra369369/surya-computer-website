/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : Admissions.gs
   Version : v1.0.0
   Purpose : Admission Database Management
================================================== */

"use strict";


const SURYA_ADMISSIONS_SHEET =
    "Admissions";


/* ==================================================
   SUBMIT ADMISSION
================================================== */

function submitAdmission(data) {

    if (!data) {
        throw new Error("Admission data is missing.");
    }

    // Anti-bot / abuse controls. Apps Script does not expose the visitor IP,
    // so the strongest practical protection here is payload limits, a honeypot,
    // a minimum form-fill time, per-identity throttling and an atomic lock.
    if (String(data.website || "").trim() !== "") {
        return jsonResponse({success:false,message:"Invalid submission."});
    }

    const startedAt = Number(data.formStartedAt || 0);
    if (startedAt && Date.now() - startedAt < 2500) {
        return jsonResponse({success:false,message:"Please take a moment to complete the application before submitting."});
    }

    const mobile = String(data.mobile || "").replace(/\D/g, "");
    const email = String(data.email || "").trim().toLowerCase();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
        return jsonResponse({success:false,message:"Please enter a valid 10-digit mobile number."});
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({success:false,message:"Please enter a valid email address."});
    }

    function bytes_(value) {
        const v = String(value || "").replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
        if (!v) return 0;
        return Math.floor(v.length * 3 / 4) - (v.endsWith("==") ? 2 : v.endsWith("=") ? 1 : 0);
    }
    if (bytes_(data.photo) > 1500000 || bytes_(data.signature) > 600000 || bytes_(data.marcsheet) > 2500000) {
        return jsonResponse({success:false,message:"Photo/signature/marksheet file is too large. Please compress the file and try again."});
    }
    const ad = data.aadhaarData || {};
    if (bytes_(ad.frontData) > 2500000 || bytes_(ad.backData) > 2500000) {
        return jsonResponse({success:false,message:"Aadhaar image/PDF is too large. Please use a smaller file."});
    }

    const cache = CacheService.getScriptCache();
    const identityKey = "SURYA_ADMISSION_" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, mobile + "|" + email)).slice(0,32);
    if (cache.get(identityKey)) {
        return jsonResponse({success:false,message:"Please wait a few seconds before submitting another application."});
    }
    // Very short global burst guard. It stops rapid automated floods without
    // locking out normal users for minutes.
    if (cache.get("SURYA_ADMISSION_BURST")) {
        return jsonResponse({success:false,message:"The admission service is busy. Please wait a few seconds and try again."});
    }
    cache.put(identityKey, "1", 25);
    cache.put("SURYA_ADMISSION_BURST", "1", 3);

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(8000)) {
        return jsonResponse({success:false,message:"The admission service is busy. Please try again shortly."});
    }

    try {
        const sheet = getSheet(SURYA_ADMISSIONS_SHEET);


/* =========================================
   DUPLICATE ADMISSION PROTECTION
   Same student + mobile + DOB + course
   cannot be submitted again
========================================= */

const lastRow =
    sheet.getLastRow();

if (lastRow > 1) {

    const existingRows =
        sheet
        .getRange(
            2,
            1,
            lastRow - 1,
            23
        )
        .getValues();

    const duplicate =
        existingRows.some(
            function(row) {

                const existingName =
                    String(row[1] || "")
                    .trim()
                    .toLowerCase();

                const existingMobile =
                    String(row[6] || "")
                    .trim();

                const existingDob =
                    String(row[4] || "")
                    .trim();

                const existingCourse =
                    String(row[5] || "")
                    .trim()
                    .toLowerCase();

                return (
                    existingName ===
                    String(data.studentName || "")
                    .trim()
                    .toLowerCase()
                    &&
                    existingMobile ===
                    String(data.mobile || "")
                    .trim()
                    &&
                    existingDob ===
                    String(data.dateOfBirth || "")
                    .trim()
                    &&
                    existingCourse ===
                    String(data.course || "")
                    .trim()
                    .toLowerCase()
                );

            }
        );


    if (duplicate) {

        return jsonResponse({

            success: false,

            duplicate: true,

            message:
                "This admission has already been submitted. Duplicate application is not allowed."

        });

    }

}


    const applicationId =
        generateServerApplicationId();


    const applicationDate =
        new Date();


    /* =========================================
       SAVE DOCUMENTS
    ========================================= */

    const documents =
        saveStudentDocuments(
            applicationId,
            data
        );


    /* =========================================
       NEW ROW
    ========================================= */

    const row = [

        applicationId,

        data.studentName || "",

        data.fatherName || "",

        data.motherName || "",

        data.dateOfBirth || "",

        data.course || "",

        data.mobile || "",

        data.email || "",

        data.address || "",

        documents.photoUrl || "",

        documents.photoName || "",

        documents.signatureUrl || "",

        documents.marksheetUrl || "",

        documents.aadhaarUploaded
            ? "Yes"
            : "No",

        documents.aadhaarMode || "",

        documents.aadhaarName || "",

        documents.aadhaarFrontName || "",

        documents.aadhaarBackName || "",

        documents.aadhaarBackUploaded
            ? "Yes"
            : "No",

        applicationDate,

        "Pending",
        
        documents.aadhaarFrontUrl || "",

        documents.aadhaarBackUrl || ""

    ];


    sheet.appendRow(row);


        return jsonResponse({
            success: true,
            message: "Admission submitted successfully.",
            applicationId: applicationId,
            status: "Pending",
            documents: documents
        });
    } finally {
        lock.releaseLock();
    }
}


/* ==================================================
   GET ALL APPLICATIONS
================================================== */

function getApplications() {

    const sheet =
        getSheet(
            SURYA_ADMISSIONS_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    if (values.length < 2) {

        return jsonResponse({

            success: true,

            applications: []

        });

    }


    const headers =
        values[0];


    const applications = [];


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const row =
            values[i];


        const record = {};


        headers.forEach(
            function(header, index) {

                record[
                    String(header).trim()
                ] =
                    row[index];

            }
        );


        applications.push(
            record
        );

    }


    return jsonResponse({

        success: true,

        applications:
            applications

    });

}

/* ==================================================
   GET PRIVATE STUDENT PHOTO
================================================== */

function getStudentPhoto(fileId) {

    try {

        fileId =
            String(fileId || "").trim();

        if (!fileId) {

            return jsonResponse({
                success: false,
                message: "Photo file ID is required."
            });

        }

        const file =
            DriveApp.getFileById(fileId);

        const blob =
            file.getBlob();

        const bytes =
            blob.getBytes();

        const base64 =
            Utilities.base64Encode(bytes);

        return jsonResponse({

            success: true,

            mimeType:
                blob.getContentType(),

            data:
                base64

        });

    }

    catch (error) {

        console.error(
            "PHOTO API ERROR:",
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

function getStudentSignature(fileId) {

    try {

        fileId =
            String(fileId || "").trim();


        if (!fileId) {

            return jsonResponse({

                success: false,

                message:
                    "Signature file ID is required."

            });

        }


        const file =
            DriveApp.getFileById(fileId);


        const blob =
            file.getBlob();


        const bytes =
            blob.getBytes();


        const base64 =
            Utilities.base64Encode(bytes);


        return jsonResponse({

            success: true,

            mimeType:
                blob.getContentType(),

            data:
                base64

        });

    }


    catch (error) {

        console.error(
            "SIGNATURE API ERROR:",
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
   GET SINGLE APPLICATION
================================================== */

function getApplication(
    applicationId
) {

    if (!applicationId) {

        return jsonResponse({

            success: false,

            message:
                "Application ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_ADMISSIONS_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    if (values.length < 2) {

        return jsonResponse({

            success: false,

            message:
                "No applications found."

        });

    }


    const headers =
        values[0];


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const row =
            values[i];


        if (
            String(row[0]).trim()
                .toUpperCase()
            ===
            String(applicationId)
                .trim()
                .toUpperCase()
        ) {

            const record = {};


            headers.forEach(
                function(header, index) {

                    record[
                        String(header).trim()
                    ] =
                        row[index];

                }
            );


            return jsonResponse({

                success: true,

                application:
                    record

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Application not found."

    });

}


/* ==================================================
   APPROVE APPLICATION
================================================== */

function approveApplication(
    applicationId
) {

    if (!applicationId) {

        return jsonResponse({

            success: false,

            message:
                "Application ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_ADMISSIONS_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    const headers =
        values[0];


    let rowNumber =
        -1;


    let application =
        null;


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        if (
            String(values[i][0])
                .trim()
                .toUpperCase()
            ===
            String(applicationId)
                .trim()
                .toUpperCase()
        ) {

            rowNumber =
                i + 1;


            application = {};


            headers.forEach(
                function(header, index) {

                    application[
                        String(header).trim()
                    ] =
                        values[i][index];

                }
            );


            break;

        }

    }


    if (!application) {

        return jsonResponse({

            success: false,

            message:
                "Application not found."

        });

    }


    const status =
        String(
            application.Status || ""
        ).trim();


    if (status !== "Pending") {

        return jsonResponse({

            success: false,

            message:
                "This application has already been processed."

        });

    }


    /* =========================================
       GENERATE IDs
    ========================================= */

    const admissionId =
        generateAdmissionId();


    const studentId =
        generateStudentId(
            application.Course
        );


    /* =========================================
       SAVE STUDENT
    ========================================= */

    saveStudentRecord(

        studentId,

        admissionId,

        application

    );

    // Create the StudentAuth record immediately. The password remains unset
    // until Admin sets it or the student uses Forgot Password with the
    // registered email address.
    if (typeof studentAuthSaveRow_ === "function") {
        studentAuthSaveRow_({
            studentId: studentId,
            email: String(application.Email || "").trim().toLowerCase(),
            status: "Active"
        });
    }


    /* =========================================
       UPDATE APPLICATION
    ========================================= */

    const statusColumn =
        headers.indexOf("Status") + 1;


    if (statusColumn > 0) {

        sheet
            .getRange(
                rowNumber,
                statusColumn
            )
            .setValue("Approved");

    }


    return jsonResponse({

        success: true,

        message:
            "Application approved successfully.",

        applicationId:
            applicationId,

        admissionId:
            admissionId,

        studentId:
            studentId,

        status:
            "Approved"

    });

}


/* ==================================================
   REJECT APPLICATION
================================================== */

function rejectApplication(
    applicationId
) {

    if (!applicationId) {

        return jsonResponse({

            success: false,

            message:
                "Application ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_ADMISSIONS_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    const headers =
        values[0];


    const statusColumn =
        headers.indexOf("Status") + 1;


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        if (
            String(values[i][0])
                .trim()
                .toUpperCase()
            ===
            String(applicationId)
                .trim()
                .toUpperCase()
        ) {

            sheet
                .getRange(
                    i + 1,
                    statusColumn
                )
                .setValue("Rejected");


            return jsonResponse({

                success: true,

                message:
                    "Application rejected successfully.",

                applicationId:
                    applicationId,

                status:
                    "Rejected"

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Application not found."

    });

}

/* ==================================================
   UPDATE ADMISSION APPLICATION
================================================== */

function updateApplication(data) {

    if (!data || !data.applicationId) {

        return jsonResponse({

            success: false,

            message:
                "Application ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_ADMISSIONS_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    const headers =
        values[0];


    let rowNumber = -1;


    /* =========================================
       FIND APPLICATION BY APPLICATION ID
    ========================================= */

    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        if (
            String(values[i][0])
                .trim()
                .toUpperCase()
            ===
            String(data.applicationId)
                .trim()
                .toUpperCase()
        ) {

            rowNumber =
                i + 1;

            break;

        }

    }


    if (rowNumber === -1) {

        return jsonResponse({

            success: false,

            message:
                "Application not found."

        });

    }


    /* =========================================
       ONLY EDITABLE STUDENT DETAILS
    ========================================= */

    const editableFields = {

        "Student Name":
            data.studentName,

        "Father Name":
            data.fatherName,

        "Mother Name":
            data.motherName,

        "Date of Birth":
            data.dateOfBirth,

        "Course":
            data.course,

        "Mobile":
            data.mobile,

        "Email":
            data.email,

        "Address":
            data.address

    };


    /* =========================================
       UPDATE EXISTING COLUMNS
       WITHOUT CHANGING IDs / DOCUMENTS /
       STATUS / APPLICATION DATE
    ========================================= */

    Object.keys(editableFields).forEach(
        function(header) {

            const column =
                headers.indexOf(header) + 1;


            if (
                column > 0 &&
                editableFields[header] !== undefined
            ) {

                sheet
                    .getRange(
                        rowNumber,
                        column
                    )
                    .setValue(
                        editableFields[header]
                    );

            }

        }
    );


    return jsonResponse({

        success: true,

        message:
            "Application updated successfully.",

        applicationId:
            data.applicationId

    });

}


/* ==================================================
   SERVER APPLICATION ID
================================================== */

function generateServerApplicationId() {

    const sheet =
        getSheet(
            SURYA_ADMISSIONS_SHEET
        );


    const lastRow =
        sheet.getLastRow();


    if (lastRow < 2) {

        return "SC-APP-0001";

    }


    const ids =
        sheet
            .getRange(
                2,
                1,
                lastRow - 1,
                1
            )
            .getValues();


    let maxNumber =
        0;


    ids.forEach(
        function(row) {

            const id =
                String(
                    row[0] || ""
                );


            if (
                id.startsWith(
                    "SC-APP-"
                )
            ) {

                const number =
                    parseInt(
                        id.replace(
                            "SC-APP-",
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
        "SC-APP-" +
        String(
            maxNumber + 1
        ).padStart(4, "0")
    );

}