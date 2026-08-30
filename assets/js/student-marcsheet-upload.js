console.log("MARCSHEET MODULE LOADED v2.2");
/* ==================================================
   SURYA STUDENT MARCSHEET UPLOAD MODULE
================================================== */

"use strict";

/* Backend hard limit (admission.gs) is 2500000 bytes.
   Target is kept a little under it so the final
   base64 payload always clears the check safely.
   Max dimension is kept generous so mark-sheet text
   stays readable after compression. */
const SURYA_MARCSHEET_BACKEND_LIMIT = 2500000;
const SURYA_MARCSHEET_TARGET_SIZE = 2000 * 1024;
const SURYA_MARCSHEET_MAX_DIMENSION = 1800;


function surya_marcsheetBase64DecodedSize_(dataUrl) {

    const value =
        String(dataUrl || "")
        .replace(/^data:[^;]+;base64,/, "")
        .replace(/\s/g, "");

    if (!value) {
        return 0;
    }

    return Math.floor(value.length * 3 / 4) -
        (value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0);

}


/* ==================================================
   COMPRESS STUDENT MARCSHEET (only if needed)
   Uses FileReader + Image, same pattern as
   compressStudentPhoto() in student-photo.js.
================================================== */

function compressStudentMarcsheet(file) {

    return new Promise(function(resolve, reject) {

        if (!file) {
            reject(new Error(
                "Marksheet file not selected."
            ));
            return;
        }

        if (
            !file.type ||
            !file.type.startsWith("image/")
        ) {
            reject(new Error(
                "Please select a valid image file."
            ));
            return;
        }

        const reader = new FileReader();

        reader.onerror = function() {

            reject(new Error(
                "Marksheet file could not be read | " +
                "name=" + file.name +
                " | type=" + file.type +
                " | size=" + file.size
            ));

        };

        reader.onload = function(event) {

            const rawDataUrl = event.target.result;

            /* ALREADY WITHIN BACKEND LIMIT —
               keep the original file as-is, do NOT
               re-compress a file that is already fine. */
            if (
                surya_marcsheetBase64DecodedSize_(rawDataUrl) <=
                SURYA_MARCSHEET_BACKEND_LIMIT
            ) {
                resolve(rawDataUrl);
                return;
            }

            const image = new Image();

            image.onload = function() {

                try {

                    const scale =
                        Math.min(
                            1,
                            SURYA_MARCSHEET_MAX_DIMENSION /
                            Math.max(image.width, image.height)
                        );

                    let width =
                        Math.max(1, Math.round(image.width * scale));

                    let height =
                        Math.max(1, Math.round(image.height * scale));

                    const canvas =
                        document.createElement("canvas");

                    const context =
                        canvas.getContext("2d");

                    if (!context) {

                        throw new Error(
                            "Canvas is not supported on this device."
                        );

                    }

                    let quality = 0.85;

                    function makeMarcsheet() {

                        canvas.width = width;
                        canvas.height = height;

                        context.clearRect(0, 0, width, height);

                        /* WHITE BACKGROUND — keeps printed text
                           crisp instead of turning transparent
                           areas black when re-encoded as JPEG */
                        context.fillStyle = "#ffffff";

                        context.fillRect(0, 0, width, height);

                        context.drawImage(image, 0, 0, width, height);

                        const dataUrl =
                            canvas.toDataURL("image/jpeg", quality);

                        const size =
                            surya_marcsheetBase64DecodedSize_(dataUrl);

                        if (
                            size > SURYA_MARCSHEET_TARGET_SIZE &&
                            quality > 0.6
                        ) {

                            quality -= 0.05;
                            makeMarcsheet();
                            return;
                        }

                        if (
                            size > SURYA_MARCSHEET_BACKEND_LIMIT &&
                            width > 700
                        ) {

                            width = Math.round(width * 0.85);
                            height = Math.round(height * 0.85);
                            quality = 0.85;
                            makeMarcsheet();
                            return;
                        }

                        resolve(dataUrl);

                    }

                    makeMarcsheet();

                }

                catch (error) {

                    reject(new Error(
                        "Marksheet processing failed | " +
                        "name=" + file.name +
                        " | type=" + file.type +
                        " | size=" + file.size +
                        " | " +
                        error.message
                    ));

                }

            };

            image.onerror = function() {

                reject(new Error(
                    "Marksheet image could not be loaded."
                ));

            };

            image.src = rawDataUrl;

        };

        reader.readAsDataURL(file);

    });

}


function initStudentMarcsheetUpload() {

    const marcsheetInput =
        document.getElementById("studentMarcsheetInput");

    const marcsheetPreview =
        document.getElementById("studentMarcsheetPreview");

    if (!marcsheetInput || !marcsheetPreview) {
        return;
    }

    marcsheetInput.addEventListener("change", async function () {

        const file =
            marcsheetInput.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            alert("Please upload a marcsheet image.");

            marcsheetInput.value = "";

            return;
        }

        try {

            const marcsheetData =
                await compressStudentMarcsheet(file);

            marcsheetPreview.src =
                marcsheetData;

            marcsheetPreview.style.display =
                "block";

            window.studentMarcsheetData =
                marcsheetData;

            console.log(
                "STUDENT MARCSHEET PREVIEW READY"
            );

        } catch (error) {

            console.error(
                "MARCSHEET COMPRESSION ERROR:",
                error
            );

            alert("❌ " + error.message);

            marcsheetInput.value = "";

            window.studentMarcsheetData = "";

        }

    });
}
