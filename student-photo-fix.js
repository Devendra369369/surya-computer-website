/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : student-photo.js
   Version : v1.1.0
   Purpose : Central Student Photo Manager
   Author  : Devendra Kumar
   Guide   : AERON
================================================== */

"use strict";


/* ==================================================
   PHOTO SETTINGS
================================================== */

const SURYA_PHOTO_MAX_SIZE =
    300 * 1024;

const SURYA_PHOTO_WIDTH =
    400;

const SURYA_PHOTO_HEIGHT =
    500;


/* ==================================================
   COMPRESS STUDENT PHOTO
================================================== */

function compressStudentPhoto(file) {

    return new Promise(
        function(resolve, reject) {

            if (!file) {

                reject(
                    new Error(
                        "Student photo not selected."
                    )
                );

                return;

            }


            if (
                !file.type ||
                !file.type.startsWith("image/")
            ) {

                reject(
                    new Error(
                        "Please select a valid image file."
                    )
                );

                return;

            }


            /* =========================================
               CREATE TEMPORARY OBJECT URL
               No FileReader required
            ========================================= */

            const objectUrl =
                URL.createObjectURL(file);


            const image =
                new Image();


            image.onload =
                function() {

                    try {

                        /* =================================
                           CREATE CANVAS
                        ================================= */

                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            SURYA_PHOTO_WIDTH;


                        canvas.height =
                            SURYA_PHOTO_HEIGHT;


                        const context =
                            canvas.getContext(
                                "2d"
                            );


                        if (!context) {

                            throw new Error(
                                "Photo processing is not supported on this device."
                            );

                        }


                        /* =================================
                           WHITE BACKGROUND
                        ================================= */

                        context.fillStyle =
                            "#ffffff";


                        context.fillRect(
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );


                        /* =================================
                           KEEP ASPECT RATIO
                        ================================= */

                        const scale =
                            Math.min(
                                canvas.width /
                                    image.width,

                                canvas.height /
                                    image.height
                            );


                        const width =
                            image.width *
                            scale;


                        const height =
                            image.height *
                            scale;


                        const x =
                            (
                                canvas.width -
                                width
                            ) / 2;


                        const y =
                            (
                                canvas.height -
                                height
                            ) / 2;


                        context.drawImage(
                            image,
                            x,
                            y,
                            width,
                            height
                        );


                        /* =================================
                           JPEG COMPRESSION
                        ================================= */

                        let quality =
                            0.75;


                        function makePhoto() {

                            const photoData =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    quality
                                );


                            const size =
                                Math.round(
                                    (
                                        photoData.length *
                                        3
                                    ) / 4
                                );


                            if (
                                size >
                                    SURYA_PHOTO_MAX_SIZE &&
                                quality >
                                    0.35
                            ) {

                                quality -=
                                    0.10;

                                makePhoto();

                                return;

                            }


                            URL.revokeObjectURL(
                                objectUrl
                            );


                            resolve(
                                photoData
                            );

                        }


                        makePhoto();

                    }

                    catch (error) {

                        URL.revokeObjectURL(
                            objectUrl
                        );


                        reject(
                            new Error(
                                "Photo processing failed: " +
                                error.message
                            )
                        );

                    }

                };


            image.onerror =
                function() {

                    URL.revokeObjectURL(
                        objectUrl
                    );


                    reject(
                        new Error(
                            "Photo could not be loaded. Please select a valid image."
                        )
                    );

                };


            image.src =
                objectUrl;

        }
    );

}


/* ==================================================
   PHOTO PREVIEW
================================================== */

function previewStudentPhoto(
    file,
    previewElement,
    containerElement
) {

    if (!file) {

        if (previewElement) {

            previewElement.src =
                "";

        }

        if (containerElement) {

            containerElement.style.display =
                "none";

        }

        return;

    }


    compressStudentPhoto(file)

        .then(
            function(photoData) {

                if (previewElement) {

                    previewElement.src =
                        photoData;

                }


                if (containerElement) {

                    containerElement.style.display =
                        "block";

                }

            }
        )

        .catch(
            function(error) {

                console.error(
                    "PHOTO PREVIEW ERROR:",
                    error
                );


                alert(
                    "❌ " +
                    error.message
                );

            }
        );

}
