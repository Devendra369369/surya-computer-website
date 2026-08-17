/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : admission.js
   Version : v1.0.0
   Author  : Devendra Kumar
   Guide   : AERON
   Created : 07-08-2026
   Purpose : Admission Form + Student Photo
================================================== */


/* ==================================================
   ELEMENTS
================================================== */

const admissionForm =
    document.getElementById("admissionForm");

const studentPhotoInput =
    document.getElementById("studentPhoto");

const photoPreview =
    document.getElementById("photoPreview");

const photoPreviewContainer =
    document.getElementById(
        "photoPreviewContainer"
    );


/* ==================================================
   PHOTO PREVIEW — CENTRAL PHOTO MANAGER
================================================== */

if (studentPhotoInput) {

    studentPhotoInput.addEventListener(
        "change",
        function () {

            previewStudentPhoto(
                this.files[0],
                photoPreview,
                photoPreviewContainer
            );

        }
    );

}


/* ==================================================
   FILE → DATA URL
================================================== */

function readFileAsDataURL(file) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function () {

                    resolve(reader.result);

                };


            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "File could not be read."
                        )
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}


/* ==================================================
   ADMISSION SUBMIT
================================================== */

if (admissionForm) {

    admissionForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            try {

                /* ======================================
                   FORM DATA
                ====================================== */

                const studentName =
                    document
                    .getElementById("studentName")
                    .value
                    .trim();


                const fatherName =
                    document
                    .getElementById("fatherName")
                    .value
                    .trim();


                const motherName =
                    document
                    .getElementById("motherName")
                    .value
                    .trim();


                const dateOfBirth =
                    document
                    .getElementById("dateOfBirth")
                    .value;


                const course =
                    document
                    .getElementById("course")
                    .value
                    .trim();


                const mobile =
                    document
                    .getElementById("mobile")
                    .value
                    .trim();


                const email =
                    document
                    .getElementById("email")
                    .value
                    .trim();


                const address =
                    document
                    .getElementById("address")
                    .value
                    .trim();


                /* ======================================
                   PHOTO
                ====================================== */

                const photoFile =
                    studentPhotoInput.files[0];


                if (!photoFile) {

                    alert(
                        "❌ Please upload student photo."
                    );

                    return;
                }


                const photoData =
                    await readFileAsDataURL(
                        photoFile
                    );


                /* ======================================
                   GET DATA
                ====================================== */

                const admissions =
                    getSuryaModule(
                        "admissions"
                    );




                /* ======================================
                   GENERATE IDS
                ====================================== */

                const applicationId =
                    generateApplicationId();



                /* ======================================
                   DATE
                ====================================== */

                const applicationDate =
                    new Date()
                    .toLocaleDateString(
                        "en-GB",
                        {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                        }
                    );


                /* ======================================
                   APPLICATION
                ====================================== */

                const newApplication = {

                    id:
                        applicationId,

                    studentName:
                        studentName,

                    fatherName:
                        fatherName,

                    motherName:
                        motherName,

                    dateOfBirth:
                        dateOfBirth,

                    course:
                        course,

                    mobile:
                        mobile,

                    email:
                        email,

                    address:
                        address,

                    photo:
                        photoData,

                    photoName:
                        photoFile.name,

                    photoType:
                        photoFile.type,

                    applicationDate:
                        applicationDate,

                    status:
                        "Pending"

                };


                /* ======================================
                   SAVE APPLICATION
                ====================================== */

                admissions.push(
                    newApplication
                );


                updateSuryaModule(
                    "admissions",
                    admissions
                );


                /* ======================================
   LAST APPLICATION
====================================== */

                localStorage.setItem(
                    "lastApplicationId",
                    applicationId
                );


                /* ======================================
                   SUCCESS
                ====================================== */

                alert(

                    "✅ Admission submitted successfully!\n\n" +

                    "Application ID: " +
                    applicationId +

                    "\n\n📷 Student photo saved successfully."

                );


                /* ======================================
                   SUCCESS PAGE
                ====================================== */

                window.location.href =
                    "admission-success.html";


            }

            catch (error) {

                console.error(
                    "ADMISSION ERROR:",
                    error
                );


                alert(
                    "❌ Admission could not be saved.\n\n" +
                    error.message
                );

            }

        }
    );

}


/* ==================================================
   READY
================================================== */

console.log(
    "SURYA ADMISSION MODULE READY!"
);