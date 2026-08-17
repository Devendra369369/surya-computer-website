console.log("MARCSHEET MODULE LOADED v2.1");
/* ==================================================
   SURYA STUDENT MARCSHEET UPLOAD MODULE
================================================== */

function initStudentMarcsheetUpload() {

    const marcsheetInput =
        document.getElementById("studentMarcsheetInput");

    const marcsheetPreview =
        document.getElementById("studentMarcsheetPreview");

    if (!marcsheetInput || !marcsheetPreview) {
        return;
    }

    marcsheetInput.addEventListener("change", function () {

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

        const reader =
            new FileReader();

        reader.onload = function (event) {

            marcsheetPreview.src =
                event.target.result;

            marcsheetPreview.style.display =
                "block";

            window.studentMarcsheetData =
                event.target.result;

            console.log(
                "STUDENT MARCSHEET PREVIEW READY"
            );

        };

        reader.readAsDataURL(file);

    });
}
