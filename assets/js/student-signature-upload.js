console.log("SIGNATURE MODULE LOADED v2.2");
/* ==================================================
   SURYA STUDENT SIGNATURE UPLOAD MODULE
================================================== */

"use strict";

/* Backend hard limit (admission.gs) is 600000 bytes.
   Target is kept a little under it so the final
   base64 payload always clears the check safely. */
const SURYA_SIGNATURE_BACKEND_LIMIT = 600000;
const SURYA_SIGNATURE_TARGET_SIZE = 500 * 1024;
const SURYA_SIGNATURE_MAX_DIMENSION = 1000;


function surya_base64DecodedSize_(dataUrl) {

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
   COMPRESS STUDENT SIGNATURE (only if needed)
   Uses FileReader + Image, same pattern as
   compressStudentPhoto() in student-photo.js.
================================================== */

function compressStudentSignature(file) {

    return new Promise(function(resolve, reject) {

        if (!file) {
            reject(new Error(
                "Signature file not selected."
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
                "Signature file could not be read | " +
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
                surya_base64DecodedSize_(rawDataUrl) <=
                SURYA_SIGNATURE_BACKEND_LIMIT
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
                            SURYA_SIGNATURE_MAX_DIMENSION /
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

                    let quality = 0.9;

                    function makeSignature() {

                        canvas.width = width;
                        canvas.height = height;

                        context.clearRect(0, 0, width, height);

                        /* WHITE BACKGROUND — keeps the ink lines
                           crisp instead of turning transparent
                           areas black when re-encoded as JPEG */
                        context.fillStyle = "#ffffff";

                        context.fillRect(0, 0, width, height);

                        context.drawImage(image, 0, 0, width, height);

                        const dataUrl =
                            canvas.toDataURL("image/jpeg", quality);

                        const size =
                            surya_base64DecodedSize_(dataUrl);

                        if (
                            size > SURYA_SIGNATURE_TARGET_SIZE &&
                            quality > 0.6
                        ) {

                            quality -= 0.05;
                            makeSignature();
                            return;
                        }

                        if (
                            size > SURYA_SIGNATURE_BACKEND_LIMIT &&
                            width > 400
                        ) {

                            width = Math.round(width * 0.85);
                            height = Math.round(height * 0.85);
                            quality = 0.9;
                            makeSignature();
                            return;
                        }

                        resolve(dataUrl);

                    }

                    makeSignature();

                }

                catch (error) {

                    reject(new Error(
                        "Signature processing failed | " +
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
                    "Signature image could not be loaded."
                ));

            };

            image.src = rawDataUrl;

        };

        reader.readAsDataURL(file);

    });

}


function initStudentSignatureUpload() {

    const signatureInput =
        document.getElementById("studentSignatureInput");

    const signaturePreview =
        document.getElementById("studentSignaturePreview");

    if (!signatureInput || !signaturePreview) {
        return;
    }

    signatureInput.addEventListener("change", async function () {

        const file =
            signatureInput.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            alert("Please upload a signature image.");

            signatureInput.value = "";

            return;
        }

        try {

            const signatureData =
                await compressStudentSignature(file);

            signaturePreview.src =
                signatureData;

            signaturePreview.style.display =
                "block";

            window.studentSignatureData =
                signatureData;

            console.log(
                "STUDENT SIGNATURE PREVIEW READY"
            );

        } catch (error) {

            console.error(
                "SIGNATURE COMPRESSION ERROR:",
                error
            );

            alert("❌ " + error.message);

            signatureInput.value = "";

            window.studentSignatureData = "";

        }

    });
}
