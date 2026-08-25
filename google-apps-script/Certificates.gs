/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : Certificates.gs
   Version : v1.1.0
   Purpose : Certificate Database Management
================================================== */

"use strict";


const SURYA_CERTIFICATES_SHEET =
    "Certificates";


/* ==================================================
   GENERATE CERTIFICATE ID
   Example: SC-CERT-0001
================================================== */

function generateCertificateId() {

    const sheet =
        getSheet(
            SURYA_CERTIFICATES_SHEET
        );


    const lastRow =
        sheet.getLastRow();


    if (lastRow < 2) {

        return "SC-CERT-0001";

    }


    const values =
        sheet
            .getRange(
                2,
                1,
                lastRow - 1,
                1
            )
            .getValues();


    let maxNumber = 0;


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
                    "SC-CERT-"
                )
            ) {

                const number =
                    parseInt(
                        id.replace(
                            "SC-CERT-",
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
        "SC-CERT-" +
        String(
            maxNumber + 1
        ).padStart(
            4,
            "0"
        )
    );

}


/* ==================================================
   GET CERTIFICATE
================================================== */

function getCertificate(
    certificateId
) {

    certificateId =
        String(
            certificateId || ""
        ).trim();


    if (!certificateId) {

        return jsonResponse({

            success: false,

            message:
                "Certificate ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_CERTIFICATES_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    if (
        values.length < 2
    ) {

        return jsonResponse({

            success: false,

            message:
                "No certificate records found."

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
            String(
                row[0] || ""
            )
            .trim()
            .toUpperCase()
            ===
            certificateId
                .toUpperCase()
        ) {

            const certificate =
                {};


            headers.forEach(
                function(
                    header,
                    index
                ) {

                    certificate[
                        String(
                            header
                        ).trim()
                    ] =
                        row[index];

                }
            );


            return jsonResponse({

                success: true,

                certificate:
                    certificate

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Certificate not found."

    });

}


/* ==================================================
   GET ALL CERTIFICATES
================================================== */

function getCertificates() {

    const sheet =
        getSheet(
            SURYA_CERTIFICATES_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    if (
        values.length < 2
    ) {

        return jsonResponse({

            success: true,

            certificates: []

        });

    }


    const headers =
        values[0];


    const certificates =
        [];


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const certificate =
            {};


        headers.forEach(
            function(
                header,
                index
            ) {

                certificate[
                    String(
                        header
                    ).trim()
                ] =
                    values[i][index];

            }
        );


        certificates.push(
            certificate
        );

    }


    return jsonResponse({

        success: true,

        certificates:
            certificates

    });

}


/* ==================================================
   CREATE CERTIFICATE FROM RESULT
================================================== */

function createCertificateFromResult(
    resultId
) {

    resultId =
        String(
            resultId || ""
        ).trim();


    if (!resultId) {

        return jsonResponse({

            success: false,

            message:
                "Result ID is required."

        });

    }


    /* =========================================
       GET RESULT
    ========================================= */

    const resultResponse =
        getResult(
            resultId
        );


    const resultData =
        resultResponse &&
        resultResponse.getContent
            ? JSON.parse(
                resultResponse.getContent()
            )
            : resultResponse;


    if (
        !resultData ||
        !resultData.success ||
        !resultData.result
    ) {

        return jsonResponse({

            success: false,

            message:
                "Result not found."

        });

    }


    const result =
        resultData.result;


    /* =========================================
       RESULT STATUS CHECK
    ========================================= */

    const resultStatus =
        String(
            result.Status || ""
        )
        .trim()
        .toUpperCase();


    if (
        resultStatus &&
        resultStatus !== "ACTIVE"
    ) {

        return jsonResponse({

            success: false,

            message:
                "Certificate cannot be generated for an inactive result."

        });

    }


    /* =========================================
       STUDENT ID
    ========================================= */

    const studentId =
        String(
            result["Student ID"] || ""
        ).trim();


    if (!studentId) {

        return jsonResponse({

            success: false,

            message:
                "Student ID is missing from result."

        });

    }


    /* =========================================
       GET STUDENT
    ========================================= */

    const studentResponse =
        getStudent(
            studentId
        );


    const studentData =
        studentResponse &&
        studentResponse.getContent
            ? JSON.parse(
                studentResponse.getContent()
            )
            : studentResponse;


    if (
        !studentData ||
        !studentData.success ||
        !studentData.student
    ) {

        return jsonResponse({

            success: false,

            message:
                "Student record not found."

        });

    }


    const student =
        studentData.student;


    /* =========================================
       CHECK EXISTING CERTIFICATE
    ========================================= */

    const sheet =
        getSheet(
            SURYA_CERTIFICATES_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    const headers =
        values.length
            ? values[0]
            : [];


    const resultIdIndex =
        headers.indexOf(
            "Result ID"
        );


    if (
        resultIdIndex >= 0 &&
        values.length > 1
    ) {

        for (
            let i = 1;
            i < values.length;
            i++
        ) {

            if (
                String(
                    values[i][
                        resultIdIndex
                    ] || ""
                )
                .trim()
                .toUpperCase()
                ===
                resultId
                    .toUpperCase()
            ) {

                return jsonResponse({

                    success: false,

                    message:
                        "Certificate already exists for this Result ID.",

                    certificateId:
                        values[i][0]

                });

            }

        }

    }


    /* =========================================
       GENERATE CERTIFICATE ID
    ========================================= */

    const certificateId =
        generateCertificateId();


    /* =========================================
       CERTIFICATE DATA
    ========================================= */

    const studentName =
        student["Student Name"] ||
        "";

    const fatherName =
        student["Father Name"] ||
        "";

    const course =
        result.Course ||
        student.Course ||
        "";

    const totalMarks =
        Number(
            result["Total Marks"]
        ) || 0;

    const obtainedMarks =
        Number(
            result["Obtained Marks"]
        ) || 0;

    const percentage =
        result.Percentage !== undefined
            ? result.Percentage
            : (
                totalMarks > 0
                    ? (
                        obtainedMarks /
                        totalMarks
                    ) * 100
                    : 0
            );

    const grade =
        result.Grade ||
        "";

    const finalResult =
        result.Result ||
        "";


    /* =========================================
       SAVE CERTIFICATE
    ========================================= */

    sheet.appendRow([

        certificateId,

        studentId,

        studentName,

        fatherName,

        course,

        totalMarks,

        obtainedMarks,

        Number(
            percentage
        ),

        grade,

        finalResult,

        new Date(),

        "Active",

        resultId

    ]);


    return jsonResponse({

        success: true,

        message:
            "Certificate generated successfully.",

        certificateId:
            certificateId,

        resultId:
            resultId,

        studentId:
            studentId

    });

}


/* ==================================================
   DISABLE CERTIFICATE
================================================== */

function disableCertificate(
    certificateId
) {

    certificateId =
        String(
            certificateId || ""
        ).trim();


    if (!certificateId) {

        return jsonResponse({

            success: false,

            message:
                "Certificate ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_CERTIFICATES_SHEET
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
            certificateId
                .toUpperCase()
        ) {

            sheet
                .getRange(
                    i + 1,
                    12
                )
                .setValue(
                    "Inactive"
                );


            return jsonResponse({

                success: true,

                message:
                    "Certificate disabled successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Certificate not found."

    });

}


/* ==================================================
   CERTIFICATES MODULE READY
================================================== */

console.log(
    "SURYA CERTIFICATES MANAGER v1.1.0 READY!"
);