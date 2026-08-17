console.log("SIGNATURE MODULE LOADED v2.1");
/* ==================================================
   SURYA STUDENT SIGNATURE UPLOAD MODULE
================================================== */

function initStudentSignatureUpload() {

    const signatureInput =
        document.getElementById("studentSignatureInput");

    const signaturePreview =
        document.getElementById("studentSignaturePreview");

    if (!signatureInput || !signaturePreview) {
        return;
    }

    signatureInput.addEventListener("change", function () {

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

        const reader =
            new FileReader();

        reader.onload = function (event) {

            signaturePreview.src =
                event.target.result;

            signaturePreview.style.display =
                "block";

            window.studentSignatureData =
                event.target.result;

            console.log(
                "STUDENT SIGNATURE PREVIEW READY"
            );

        };

        reader.readAsDataURL(file);

    });
}
