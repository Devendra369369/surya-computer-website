/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : Courses.gs
   Version : v1.0.0
   Purpose : Course Management
================================================== */

"use strict";

const SURYA_COURSES_SHEET = "Courses";


function getCourses() {

    const sheet =
        getSheet(SURYA_COURSES_SHEET);

    const values =
        sheet.getDataRange().getValues();

    if (values.length < 2) {

        return jsonResponse({
            success: true,
            courses: []
        });

    }

    const headers = values[0];

    const courses = [];

    for (let i = 1; i < values.length; i++) {

        const row = values[i];

        if (
            row.every(function(value) {
                return value === "" || value === null;
            })
        ) {
            continue;
        }

        const record = {};

        headers.forEach(function(header, index) {

            const key =
                String(header).trim();

            if (key) {
                record[key] = row[index];
            }

        });

        courses.push(record);

    }

    return jsonResponse({
        success: true,
        courses: courses
    });

}


function addCourse(
    courseId,
    courseName,
    duration,
    fee,
    description
) {

    courseId =
        String(courseId || "").trim();

    courseName =
        String(courseName || "").trim();

    duration =
        String(duration || "").trim();

    fee =
        Number(fee);

    description =
        String(description || "").trim();


    if (
        !courseId ||
        !courseName ||
        !duration ||
        !Number.isFinite(fee)
    ) {

        return jsonResponse({
            success: false,
            message:
                "Course ID, Course Name, Duration and Fee are required."
        });

    }


    const sheet =
        getSheet(SURYA_COURSES_SHEET);

    const values =
        sheet.getDataRange().getValues();


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const existingId =
            String(values[i][0] || "")
                .trim()
                .toUpperCase();

        if (
            existingId ===
            courseId.toUpperCase()
        ) {

            return jsonResponse({
                success: false,
                message:
                    "Course ID already exists."
            });

        }

    }


    sheet.appendRow([

        courseId,
        courseName,
        duration,
        fee,
        description,
        "Active"

    ]);


    return jsonResponse({

        success: true,

        message:
            "Course added successfully.",

        course: {

            courseId: courseId,

            courseName: courseName,

            duration: duration,

            fee: fee,

            description: description,

            status: "Active"

        }

    });

}


function updateCourse(
    courseId,
    courseName,
    duration,
    fee,
    description,
    status
) {

    courseId =
        String(courseId || "").trim();

    courseName =
        String(courseName || "").trim();

    duration =
        String(duration || "").trim();

    fee =
        Number(fee);

    description =
        String(description || "").trim();

    status =
        String(status || "Active").trim();


    if (
        !courseId ||
        !courseName ||
        !duration ||
        !Number.isFinite(fee)
    ) {

        return jsonResponse({
            success: false,
            message:
                "Invalid course details."
        });

    }


    const sheet =
        getSheet(SURYA_COURSES_SHEET);

    const values =
        sheet.getDataRange().getValues();


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const existingId =
            String(values[i][0] || "")
                .trim()
                .toUpperCase();


        if (
            existingId ===
            courseId.toUpperCase()
        ) {

            sheet
                .getRange(i + 1, 1, 1, 6)
                .setValues([[
                    courseId,
                    courseName,
                    duration,
                    fee,
                    description,
                    status
                ]]);


            return jsonResponse({

                success: true,

                message:
                    "Course updated successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Course not found."

    });

}


function disableCourse(
    courseId
) {

    courseId =
        String(courseId || "").trim();


    if (!courseId) {

        return jsonResponse({

            success: false,

            message:
                "Course ID is required."

        });

    }


    const sheet =
        getSheet(SURYA_COURSES_SHEET);

    const values =
        sheet.getDataRange().getValues();


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const existingId =
            String(values[i][0] || "")
                .trim()
                .toUpperCase();


        if (
            existingId ===
            courseId.toUpperCase()
        ) {

            sheet
                .getRange(i + 1, 6)
                .setValue("Inactive");


            return jsonResponse({

                success: true,

                message:
                    "Course disabled successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Course not found."

    });

}


console.log(
    "SURYA COURSES MANAGER v1.0.0 READY!"
);


/* ==================================================
   ENABLE COURSE
================================================== */

function enableCourse(
    courseId
) {

    courseId =
        String(
            courseId || ""
        ).trim();


    if (!courseId) {

        return jsonResponse({

            success: false,

            message:
                "Course ID is required."

        });

    }


    const sheet =
        getSheet(
            SURYA_COURSES_SHEET
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

        const existingId =
            String(
                values[i][0] || ""
            )
                .trim()
                .toUpperCase();


        if (
            existingId ===
            courseId.toUpperCase()
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
                    "Course enabled successfully."

            });

        }

    }


    return jsonResponse({

        success: false,

        message:
            "Course not found."

    });

}
