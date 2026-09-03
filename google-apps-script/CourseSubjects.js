/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : CourseSubjects.gs
   Version : v2.0.0
   Purpose : Central Course & Subject Management
================================================== */

"use strict";


const SURYA_COURSE_SUBJECTS_SHEET =
    "Course Subjects";


/* ==================================================
   MARK STRUCTURE
   THEORY 70 + PRACTICAL 30 = 100
================================================== */

const COURSE_SUBJECT_THEORY_MAX =
    70;

const COURSE_SUBJECT_PRACTICAL_MAX =
    30;

const COURSE_SUBJECT_TOTAL_MAX =
    100;


/* ==================================================
   VALIDATE MARKS
================================================== */

function validateCourseSubjectMarks(
    maxMarks,
    passMarks
) {

    const max =
        Number(maxMarks);

    const pass =
        Number(passMarks);


    if (
        !Number.isFinite(max) ||
        max <= 0
    ) {

        return {
            success: false,
            message:
                "Max Marks must be greater than 0."
        };

    }


    if (
        !Number.isFinite(pass) ||
        pass < 0
    ) {

        return {
            success: false,
            message:
                "Pass Marks cannot be negative."
        };

    }


    if (pass > max) {

        return {
            success: false,
            message:
                "Pass Marks cannot exceed Max Marks."
        };

    }


    return {

        success: true,

        maxMarks: max,

        passMarks: pass

    };

}


/* ==================================================
   NORMALIZE COURSE SUBJECT
================================================== */

function normalizeCourseSubject(
    record
) {

    return {

        course:
            record.course ||
            record.Course ||
            "",

        subjectId:
            record.subjectId ||
            record["Subject ID"] ||
            "",

        subjectName:
            record.subjectName ||
            record["Subject Name"] ||
            "",

        maxMarks:
            Number(
                record.maxMarks ||
                record["Max Marks"] ||
                100
            ),

        passMarks:
            Number(
                record.passMarks ||
                record["Pass Marks"] ||
                33
            ),

        status:
            record.status ||
            record.Status ||
            "Active",

        maxTheoryMarks:
            COURSE_SUBJECT_THEORY_MAX,

        maxPracticalMarks:
            COURSE_SUBJECT_PRACTICAL_MAX,

        totalMarks:
            COURSE_SUBJECT_TOTAL_MAX

    };

}


/* ==================================================
   GET ALL COURSE SUBJECTS
================================================== */

function getCourseSubjects() {

    const sheet =
        getSheet(
            SURYA_COURSE_SUBJECTS_SHEET
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
            row.every(
                function(value) {

                    return (
                        value === "" ||
                        value === null
                    );

                }
            )
        ) {

            continue;

        }


        const record = {};


        headers.forEach(
            function(header, index) {

                const key =
                    String(
                        header
                    ).trim();


                if (key) {

                    record[key] =
                        row[index];

                }

            }
        );


        subjects.push(
            normalizeCourseSubject(
                record
            )
        );

    }


    return jsonResponse({

        success: true,

        subjects:
            subjects

    });

}


/* ==================================================
   ADD SUBJECT
================================================== */

function addCourseSubject(
    course,
    subjectId,
    subjectName,
    maxMarks,
    passMarks
) {

    course =
        String(
            course || ""
        ).trim();


    subjectId =
        String(
            subjectId || ""
        ).trim();


    subjectName =
        String(
            subjectName || ""
        ).trim();


    if (
        !course ||
        !subjectId ||
        !subjectName
    ) {

        return jsonResponse({

            success: false,

            message:
                "Course, Subject ID and Subject Name are required."

        });

    }


    const marks =
        validateCourseSubjectMarks(
            maxMarks || 100,
            passMarks || 33
        );


    if (
        !marks.success
    ) {

        return jsonResponse(
            marks
        );

    }


    const sheet =
        getSheet(
            SURYA_COURSE_SUBJECTS_SHEET
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

        const existingCourse =
            String(
                values[i][0] || ""
            )
                .trim()
                .toUpperCase();


        const existingSubjectId =
            String(
                values[i][1] || ""
            )
                .trim()
                .toUpperCase();


        if (
            existingCourse ===
                course.toUpperCase()
            &&
            existingSubjectId ===
                subjectId.toUpperCase()
        ) {

            return jsonResponse({

                success: false,

                message:
                    "This Subject ID already exists for this course."

            });

        }

    }


    sheet.appendRow([

        course,

        subjectId,

        subjectName,

        marks.maxMarks,

        marks.passMarks,

        "Active"

    ]);


    return jsonResponse({

        success: true,

        message:
            "Subject added successfully.",

        subject:
            normalizeCourseSubject({

                course:
                    course,

                subjectId:
                    subjectId,

                subjectName:
                    subjectName,

                maxMarks:
                    marks.maxMarks,

                passMarks:
                    marks.passMarks,

                status:
                    "Active"

            })

    });

}


/* ==================================================
   UPDATE SUBJECT
================================================== */

function updateCourseSubject(
    subjectId,
    course,
    subjectName,
    maxMarks,
    passMarks,
    status
) {

    subjectId =
        String(
            subjectId || ""
        ).trim();


    course =
        String(
            course || ""
        ).trim();


    subjectName =
        String(
            subjectName || ""
        ).trim();


    if (!subjectId) {

        return jsonResponse({

            success: false,

            message:
                "Subject ID is required."

        });

    }


    if (!course) {

        return jsonResponse({

            success: false,

            message:
                "Course is required."

        });

    }


    if (!subjectName) {

        return jsonResponse({

            success: false,

            message:
                "Subject Name is required."

        });

    }


    const marks =
        validateCourseSubjectMarks(
            maxMarks || 100,
            passMarks || 33
        );


    if (
        !marks.success
    ) {

        return jsonResponse(
            marks
        );

    }


    const sheet =
        getSheet(
            SURYA_COURSE_SUBJECTS_SHEET
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

        const existingCourse =
            String(
                values[i][0] || ""
            )
                .trim()
                .toUpperCase();


        const existingSubjectId =
            String(
                values[i][1] || ""
            )
                .trim()
                .toUpperCase();


        if (
            existingCourse ===
                course.toUpperCase()
            &&
            existingSubjectId ===
                subjectId.toUpperCase()
        ) {

            const rowNumber =
                i + 1;


            sheet
                .getRange(
                    rowNumber,
                    1,
                    1,
                    6
                )
                .setValues([[
                    course,
                    subjectId,
                    subjectName,
                    marks.maxMarks,
                    marks.passMarks,
                    String(
                        status || "Active"
                    ).trim()
                ]]);


            return jsonResponse({

                success: true,

                message:
                    "Subject updated successfully.",

                subject:
                    normalizeCourseSubject({

                        course:
                            course,

                        subjectId:
                            subjectId,

                        subjectName:
                            subjectName,

                        maxMarks:
                            marks.maxMarks,

                        passMarks:
                            marks.passMarks,

                        status:
                            String(
                                status ||
                                "Active"
                            ).trim()

                    })

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Subject not found."

    });

}


/* ==================================================
   DISABLE SUBJECT
================================================== */

function disableCourseSubject(
    subjectId
) {

    subjectId =
        String(
            subjectId || ""
        ).trim();


    if (!subjectId) {

        return jsonResponse({

            success: false,

            message:
                "Subject ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_COURSE_SUBJECTS_SHEET
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

        const existingSubjectId =
            String(
                values[i][1] || ""
            )
                .trim()
                .toUpperCase();


        if (
            existingSubjectId ===
            subjectId.toUpperCase()
        ) {

            sheet
                .getRange(
                    i + 1,
                    6
                )
                .setValue(
                    "Inactive"
                );


            return jsonResponse({

                success: true,

                message:
                    "Subject disabled successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Subject not found."

    });

}


/* ==================================================
   ENABLE SUBJECT
================================================== */

function enableCourseSubject(
    subjectId
) {

    subjectId =
        String(
            subjectId || ""
        ).trim();


    if (!subjectId) {

        return jsonResponse({

            success: false,

            message:
                "Subject ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_COURSE_SUBJECTS_SHEET
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

        const existingSubjectId =
            String(
                values[i][1] || ""
            )
                .trim()
                .toUpperCase();


        if (
            existingSubjectId ===
            subjectId.toUpperCase()
        ) {

            sheet
                .getRange(
                    i + 1,
                    6
                )
                .setValue(
                    "Active"
                );


            return jsonResponse({

                success: true,

                message:
                    "Subject enabled successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Subject not found."

    });

}


/* ==================================================
   GET SUBJECTS FOR ONE COURSE
================================================== */

function getCourseSubjectsByCourse(
    course
) {

    course =
        String(
            course || ""
        ).trim();


    if (!course) {

        return jsonResponse({

            success: false,

            message:
                "Course is required.",

            subjects: []

        });

    }


    const sheet =
        getSheet(
            SURYA_COURSE_SUBJECTS_SHEET
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

            course:
                course,

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


        const rowCourse =
            String(
                row[0] || ""
            )
                .trim()
                .toUpperCase();


        const status =
            String(
                row[5] || "Active"
            )
                .trim();


        if (
            rowCourse !==
            course.toUpperCase()
        ) {

            continue;

        }


        if (
            status.toLowerCase() !==
            "active"
        ) {

            continue;

        }


        const record = {};


        headers.forEach(
            function(header, index) {

                const key =
                    String(
                        header
                    ).trim();


                if (key) {

                    record[key] =
                        row[index];

                }

            }
        );


        subjects.push(
            normalizeCourseSubject(
                record
            )
        );

    }


    return jsonResponse({

        success: true,

        course:
            course,

        subjects:
            subjects

    });

}


/* ==================================================
   COURSE SUBJECTS MANAGER READY
================================================== */

console.log(
    "SURYA COURSE SUBJECTS MANAGER v2.0.0 READY!"
);