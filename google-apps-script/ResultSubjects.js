/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : ResultSubjects.gs
   Version : v1.0.0
   Purpose : Result Subject Marks Management
================================================== */

"use strict";


const SURYA_RESULT_SUBJECTS_SHEET =
    "Result Subjects";


/* ==================================================
   GET ALL RESULT SUBJECTS
================================================== */

function getResultSubjects(resultId) {

    resultId =
        String(resultId || "").trim();


    const sheet =
        getSheet(
            SURYA_RESULT_SUBJECTS_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    if (values.length < 2) {

        return jsonResponse({

            success: true,

            subjects: []

        });

    }


    const headers =
        values[0];

    const subjects = [];


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const row =
            values[i];


        if (
            resultId &&
            String(row[0])
                .trim()
                .toUpperCase()
            !==
            resultId.toUpperCase()
        ) {
            continue;
        }

        /* Disabled result subjects are never returned to the entry/print UI. */
        if (
            String(row[13] || "Active")
                .trim()
                .toLowerCase() === "inactive"
        ) {
            continue;
        }


        const record = {};


        headers.forEach(
            function(header, index) {

                record[
                    String(header).trim()
                ] =
                    row[index];

            }
        );


        subjects.push(record);

    }


    return jsonResponse({

        success: true,

        subjects:
            subjects

    });

}


/* ==================================================
   CALCULATE SUBJECT RESULT
================================================== */

function calculateSubjectResult(
    maxTheoryMarks,
    theoryMarks,
    maxPracticalMarks,
    practicalMarks
) {

    const maxTheory =
        Number(maxTheoryMarks) || 0;

    const theory =
        Number(theoryMarks) || 0;

    const maxPractical =
        Number(maxPracticalMarks) || 0;

    const practical =
        Number(practicalMarks) || 0;


    const totalMax =
        maxTheory +
        maxPractical;


    const obtained =
        theory +
        practical;


    if (theory < 0 ||
        practical < 0 ||
        theory > maxTheory ||
        practical > maxPractical) {

        return {

            success: false,

            message:
                "Marks cannot exceed maximum marks."

        };

    }


    let percentage = 0;


    if (totalMax > 0) {

        percentage =
            (obtained / totalMax) * 100;

    }


    percentage =
        Number(
            percentage.toFixed(2)
        );


    const grade =
        calculateSubjectGrade(
            percentage
        );


    const result =
        percentage >= 33
            ? "PASS"
            : "FAIL";


    return {

        success: true,

        totalMaxMarks:
            totalMax,

        obtainedMarks:
            obtained,

        percentage:
            percentage,

        grade:
            grade,

        result:
            result

    };

}


/* ==================================================
   SUBJECT GRADE
================================================== */

function calculateSubjectGrade(
    percentage
) {

    percentage =
        Number(percentage) || 0;


    if (percentage >= 90) {

        return "A+";

    }


    if (percentage >= 80) {

        return "A";

    }


    if (percentage >= 70) {

        return "B+";

    }


    if (percentage >= 60) {

        return "B";

    }


    if (percentage >= 50) {

        return "C";

    }


    if (percentage >= 33) {

        return "D";

    }


    return "F";

}

/* ==================================================
   SAVE RESULT SUBJECT
================================================== */

function saveResultSubject(
    resultId,
    studentId,
    subjectId,
    subjectName,
    maxTheoryMarks,
    theoryMarks,
    maxPracticalMarks,
    practicalMarks,
    status
) {

    resultId =
        String(resultId || "").trim();

    studentId =
        String(studentId || "").trim();

    subjectId =
        String(subjectId || "").trim();

    subjectName =
        String(subjectName || "").trim();


    if (
        !resultId ||
        !studentId ||
        !subjectId ||
        !subjectName
    ) {

        return jsonResponse({

            success: false,

            message:
                "Result ID, Student ID, Subject ID and Subject Name are required."

        });

    }


    const calculation =
        calculateSubjectResult(
            maxTheoryMarks,
            theoryMarks,
            maxPracticalMarks,
            practicalMarks
        );


    if (!calculation.success) {

        return jsonResponse(
            calculation
        );

    }


    const sheet =
        getSheet(
            SURYA_RESULT_SUBJECTS_SHEET
        );


    const values =
        sheet
            .getDataRange()
            .getValues();


    /* ==================================================
       CHECK EXISTING SUBJECT
    ================================================== */

    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const sameResult =
            String(values[i][0])
                .trim()
                .toUpperCase()
            ===
            resultId.toUpperCase();


        const sameSubject =
            String(values[i][2])
                .trim()
                .toUpperCase()
            ===
            subjectId.toUpperCase();


        if (
            sameResult &&
            sameSubject
        ) {

            return jsonResponse({

                success: false,

                message:
                    "This subject already exists for this result."

            });

        }

    }


    sheet.appendRow([

        resultId,

        studentId,

        subjectId,

        subjectName,

        Number(maxTheoryMarks) || 0,

        Number(theoryMarks) || 0,

        Number(maxPracticalMarks) || 0,

        Number(practicalMarks) || 0,

        calculation.totalMaxMarks,

        calculation.obtainedMarks,

        calculation.percentage,

        calculation.grade,

        calculation.result,

        String(
            status || "Draft"
        ).trim()

    ]);


    return jsonResponse({

        success: true,

        message:
            "Result subject saved successfully.",

        subject: {

            resultId:
                resultId,

            studentId:
                studentId,

            subjectId:
                subjectId,

            subjectName:
                subjectName,

            maxTheoryMarks:
                Number(maxTheoryMarks) || 0,

            theoryMarks:
                Number(theoryMarks) || 0,

            maxPracticalMarks:
                Number(maxPracticalMarks) || 0,

            practicalMarks:
                Number(practicalMarks) || 0,

            totalMaxMarks:
                calculation.totalMaxMarks,

            obtainedMarks:
                calculation.obtainedMarks,

            percentage:
                calculation.percentage,

            grade:
                calculation.grade,

            result:
                calculation.result,

            status:
                String(
                    status || "Draft"
                ).trim()

        }

    });

}


/* ==================================================
   UPDATE RESULT SUBJECT
================================================== */

function updateResultSubject(
    resultId,
    subjectId,
    maxTheoryMarks,
    theoryMarks,
    maxPracticalMarks,
    practicalMarks,
    status
) {

    resultId =
        String(resultId || "").trim();

    subjectId =
        String(subjectId || "").trim();


    if (
        !resultId ||
        !subjectId
    ) {

        return jsonResponse({

            success: false,

            message:
                "Result ID and Subject ID are required."

        });

    }


    const calculation =
        calculateSubjectResult(
            maxTheoryMarks,
            theoryMarks,
            maxPracticalMarks,
            practicalMarks
        );


    if (!calculation.success) {

        return jsonResponse(
            calculation
        );

    }


    const sheet =
        getSheet(
            SURYA_RESULT_SUBJECTS_SHEET
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

        const sameResult =
            String(values[i][0])
                .trim()
                .toUpperCase()
            ===
            resultId.toUpperCase();


        const sameSubject =
            String(values[i][2])
                .trim()
                .toUpperCase()
            ===
            subjectId.toUpperCase();


        if (
            sameResult &&
            sameSubject
        ) {

            const rowNumber =
                i + 1;


            sheet
                .getRange(
                    rowNumber,
                    5,
                    1,
                    10
                )
                .setValues([[
                    
                    Number(maxTheoryMarks) || 0,

                    Number(theoryMarks) || 0,

                    Number(maxPracticalMarks) || 0,

                    Number(practicalMarks) || 0,

                    calculation.totalMaxMarks,

                    calculation.obtainedMarks,

                    calculation.percentage,

                    calculation.grade,

                    calculation.result,

                    String(
                        status || "Draft"
                    ).trim()

                ]]);


            return jsonResponse({

                success: true,

                message:
                    "Result subject updated successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Result subject not found."

    });

}


/* ==================================================
   DELETE / DISABLE RESULT SUBJECT
================================================== */

function disableResultSubject(
    resultId,
    subjectId
) {

    resultId =
        String(resultId || "").trim();

    subjectId =
        String(subjectId || "").trim();


    if (
        !resultId ||
        !subjectId
    ) {

        return jsonResponse({

            success: false,

            message:
                "Result ID and Subject ID are required."

        });

    }


    const sheet =
        getSheet(
            SURYA_RESULT_SUBJECTS_SHEET
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

            String(values[i][0])
                .trim()
                .toUpperCase()
            ===
            resultId.toUpperCase()

            &&

            String(values[i][2])
                .trim()
                .toUpperCase()
            ===
            subjectId.toUpperCase()

        ) {

            sheet
                .getRange(
                    i + 1,
                    14
                )
                .setValue(
                    "Inactive"
                );


            return jsonResponse({

                success: true,

                message:
                    "Result subject disabled successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Result subject not found."

    });

}


/* ==================================================
   RESULT SUBJECTS MANAGER READY
================================================== */

console.log(
    "SURYA RESULT SUBJECTS MANAGER v1.0.0 READY!"
);