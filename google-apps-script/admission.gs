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

        throw new Error(
            "Admission data is missing."
        );

    }


        
    const sheet =
    getSheet(
        SURYA_ADMISSIONS_SHEET
    );


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
            22
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

        message:
            "Admission submitted successfully.",

        applicationId:
            applicationId,

        status:
            "Pending",

        documents:
            documents

    });

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