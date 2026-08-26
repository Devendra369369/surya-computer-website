/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : Results.gs
   Version : v2.0.0
   Purpose : Multiple Exam Result Management
================================================== */

"use strict";


const SURYA_RESULTS_SHEET =
    "Results";


/* ==================================================
   GENERATE RESULT ID
   Example: SC-RES-0001
================================================== */

function generateResultId() {

    const sheet =
        getSheet(
            SURYA_RESULTS_SHEET
        );

    const lastRow =
        sheet.getLastRow();

    if (lastRow < 2) {

        return "SC-RES-0001";

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
                ).trim();

            if (
                id.startsWith(
                    "SC-RES-"
                )
            ) {

                const number =
                    parseInt(
                        id.replace(
                            "SC-RES-",
                            ""
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

        }
    );

    return (
        "SC-RES-" +
        String(
            maxNumber + 1
        ).padStart(4, "0")
    );

}


/* ==================================================
   GET ALL RESULTS
================================================== */

function getResults() {

    const sheet =
        getSheet(
            SURYA_RESULTS_SHEET
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

            results: []

        });

    }

    const headers =
        values[0];

    const results = [];

    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        if (
            values[i].every(
                function(value) {
                    return value === "";
                }
            )
        ) {
            continue;
        }

        const record = {};

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

        results.push(
            record
        );

    }

    return jsonResponse({

        success: true,

        results:
            results

    });

}


/* ==================================================
   GET SINGLE RESULT
================================================== */

function getResult(
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

    const sheet =
        getSheet(
            SURYA_RESULTS_SHEET
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
                "No result records found."

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
            String(values[i][0])
                .trim()
                .toUpperCase()
            ===
            resultId.toUpperCase()
        ) {

            const record = {};

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

            return jsonResponse({

                success: true,

                result:
                    record

            });

        }

    }

    return jsonResponse({

        success: false,

        message:
            "Result not found."

    });

}


/* ==================================================
   CREATE RESULT
   Multiple Exams Supported
================================================== */

function createResult(
    studentId,
    studentName,
    course,
    exam,
    totalMarks,
    obtainedMarks,
    examDate,
    status,
    suppliedResultId
) {

    studentId =
        String(
            studentId || ""
        ).trim();

    studentName =
        String(
            studentName || ""
        ).trim();

    course =
        String(
            course || ""
        ).trim();

    exam =
        String(
            exam || ""
        ).trim();

    examDate =
        String(
            examDate || ""
        ).trim();

    status =
        String(
            status || "Draft"
        ).trim();


    if (
        !studentId ||
        !studentName ||
        !course ||
        !exam
    ) {

        return jsonResponse({

            success: false,

            message:
                "Student ID, Student Name, Course and Exam are required."

        });

    }


    const total =
        Number(
            totalMarks
        );

    const obtained =
        Number(
            obtainedMarks
        );


    if (
        !isFinite(total) ||
        total <= 0
    ) {

        return jsonResponse({

            success: false,

            message:
                "Invalid Total Marks."

        });

    }


    if (
        !isFinite(obtained) ||
        obtained < 0 ||
        obtained > total
    ) {

        return jsonResponse({

            success: false,

            message:
                "Invalid Obtained Marks."

        });

    }


    const sheet =
        getSheet(
            SURYA_RESULTS_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    /* ------------------------------------------
       DUPLICATE CHECK
       Same Student + Same Exam
    ------------------------------------------ */

    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const sameStudent =
            String(
                values[i][1] || ""
            )
                .trim()
                .toUpperCase()
            ===
            studentId.toUpperCase();


        const sameExam =
            String(
                values[i][4] || ""
            )
                .trim()
                .toLowerCase()
            ===
            exam.toLowerCase();


        if (
            sameStudent &&
            sameExam
        ) {

            return jsonResponse({

                success: false,

                duplicate: true,

                message:
                    "This examination result already exists for this student."

            });

        }

    }


    const percentage =
        Number(
            (
                (obtained / total) *
                100
            ).toFixed(2)
        );


    let grade;

    if (percentage >= 80) {

        grade = "A";

    }

    else if (percentage >= 60) {

        grade = "B";

    }

    else if (percentage >= 50) {

        grade = "C";

    }

    else if (percentage >= 33) {

        grade = "D";

    }

    else {

        grade = "F";

    }


    const result =
        percentage >= 33
            ? "PASS"
            : "FAIL";


    const resultId =
        String(
            suppliedResultId || ""
        ).trim() ||
        generateResultId();


    sheet.appendRow([

        resultId,

        studentId,

        studentName,

        course,

        exam,

        total,

        obtained,

        percentage,

        grade,

        result,

        examDate,

        status

    ]);


    return jsonResponse({

        success: true,

        message:
            "Result created successfully.",

        result: {

            resultId:
                resultId,

            studentId:
                studentId,

            studentName:
                studentName,

            course:
                course,

            exam:
                exam,

            totalMarks:
                total,

            obtainedMarks:
                obtained,

            percentage:
                percentage,

            grade:
                grade,

            result:
                result,

            examDate:
                examDate,

            status:
                status

        }

    });

}


/* ==================================================
   UPDATE RESULT
================================================== */

function updateResult(
    resultId,
    studentName,
    course,
    exam,
    totalMarks,
    obtainedMarks,
    examDate,
    status
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


    const total =
        Number(
            totalMarks
        );

    const obtained =
        Number(
            obtainedMarks
        );


    if (
        !isFinite(total) ||
        total <= 0
    ) {

        return jsonResponse({

            success: false,

            message:
                "Invalid Total Marks."

        });

    }


    if (
        !isFinite(obtained) ||
        obtained < 0 ||
        obtained > total
    ) {

        return jsonResponse({

            success: false,

            message:
                "Invalid Obtained Marks."

        });

    }


    const percentage =
        Number(
            (
                (obtained / total) *
                100
            ).toFixed(2)
        );


    let grade;

    if (percentage >= 80) {

        grade = "A";

    }

    else if (percentage >= 60) {

        grade = "B";

    }

    else if (percentage >= 50) {

        grade = "C";

    }

    else if (percentage >= 33) {

        grade = "D";

    }

    else {

        grade = "F";

    }


    const result =
        percentage >= 33
            ? "PASS"
            : "FAIL";


    const sheet =
        getSheet(
            SURYA_RESULTS_SHEET
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
            resultId.toUpperCase()
        ) {

            const rowNumber =
                i + 1;


            /*
               Keep Result ID and Student ID.
               Update columns C-L.
            */

            sheet
                .getRange(
                    rowNumber,
                    3,
                    1,
                    10
                )
                .setValues([[

                    String(
                        studentName || ""
                    ).trim(),

                    String(
                        course || ""
                    ).trim(),

                    String(
                        exam || ""
                    ).trim(),

                    total,

                    obtained,

                    percentage,

                    grade,

                    result,

                    String(
                        examDate || ""
                    ).trim(),

                    String(
                        status || "Draft"
                    ).trim()

                ]]);


            return jsonResponse({

                success: true,

                message:
                    "Result updated successfully.",

                resultId:
                    resultId

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Result not found."

    });

}


/* ==================================================
   PUBLISH RESULT
================================================== */

function publishResult(resultId) {

    resultId = String(resultId || "").trim();

    if (!resultId) {
        return jsonResponse({
            success: false,
            message: "Result ID is required."
        });
    }

    const sheet = getSheet(SURYA_RESULTS_SHEET);
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
        if (String(values[i][0] || "").trim().toUpperCase() === resultId.toUpperCase()) {
            sheet.getRange(i + 1, 12).setValue("Published");

            return jsonResponse({
                success: true,
                message: "Result published successfully.",
                resultId: resultId,
                status: "Published"
            });
        }
    }

    return jsonResponse({
        success: false,
        message: "Result not found."
    });
}


/* ==================================================
   DISABLE RESULT
================================================== */

function disableResult(
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


    const sheet =
        getSheet(
            SURYA_RESULTS_SHEET
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
            resultId.toUpperCase()
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
                    "Result disabled successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Result not found."

    });

}


/* ==================================================
   ENABLE RESULT
================================================== */

function enableResult(
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


    const sheet =
        getSheet(
            SURYA_RESULTS_SHEET
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
            resultId.toUpperCase()
        ) {

            sheet
                .getRange(
                    i + 1,
                    12
                )
                .setValue(
                    "Active"
                );


            return jsonResponse({

                success: true,

                message:
                    "Result enabled successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Result not found."

    });

}


/* ==================================================
   RESULTS MODULE READY
================================================== */

console.log(
    "SURYA RESULTS MANAGER v2.0.0 READY!"
);
