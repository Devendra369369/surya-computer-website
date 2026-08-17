/* ==================================================
   SURYA STUDENT AADHAAR UPLOAD MODULE
   PDF = single file
   IMAGE = Front + Back
================================================== */

function initStudentAadhaarUpload() {

    const input =
        document.getElementById("aadhaarCard");

    const preview =
        document.getElementById("aadhaarPreview");

    const previewContainer =
        document.getElementById(
            "aadhaarPreviewContainer"
        );

    const pdfPreview =
        document.getElementById(
            "aadhaarPdfPreview"
        );

    if (!input) {
        return;
    }


    window.studentAadhaarData = {
        mode: "",
        frontFile: null,
        backFile: null
    };


    let backInput = null;
    let backPreview = null;


    input.addEventListener(
        "change",
        function() {

            const file =
                input.files[0];

            if (!file) {
                return;
            }


            /* =====================================
               PDF
            ===================================== */

            if (
                file.type ===
                "application/pdf"
            ) {

                window.studentAadhaarData = {

                    mode:
                        "pdf",

                    frontFile:
                        file,

                    backFile:
                        null

                };


                if (preview) {
                    preview.style.display =
                        "none";
                }

                if (pdfPreview) {
                    pdfPreview.style.display =
                        "block";
                }

                if (previewContainer) {
                    previewContainer.style.display =
                        "block";
                }


                removeBackUpload();

                console.log(
                    "AADHAAR PDF SELECTED"
                );

                return;

            }


            /* =====================================
               IMAGE FRONT
            ===================================== */

            if (
                !file.type.startsWith("image/")
            ) {

                alert(
                    "Please select Aadhaar image or PDF."
                );

                input.value = "";

                return;

            }


            window.studentAadhaarData = {

                mode:
                    "image",

                frontFile:
                    file,

                backFile:
                    null

            };


            if (pdfPreview) {
                pdfPreview.style.display =
                    "none";
            }


            const reader =
                new FileReader();

            reader.onload =
                function(event) {

                    if (preview) {

                        preview.src =
                            event.target.result;

                        preview.style.display =
                            "block";

                    }

                    if (previewContainer) {

                        previewContainer.style.display =
                            "block";

                    }

                };

            reader.readAsDataURL(file);


            createBackUpload();


            console.log(
                "AADHAAR FRONT SELECTED — BACK REQUIRED"
            );

        }
    );


    function createBackUpload() {

        removeBackUpload();


        backInput =
            document.createElement("input");

        backInput.type =
            "file";

        backInput.id =
            "aadhaarBackCard";

        backInput.accept =
            "image/*";

        backInput.required =
            true;


        const label =
            document.createElement("label");

        label.id =
            "aadhaarBackLabel";

        label.innerHTML =
            "📄 Upload Aadhaar Back Image";


        const container =
            document.createElement("div");

        container.id =
            "aadhaarBackUploadContainer";

        container.style.textAlign =
            "center";

        container.style.margin =
            "10px 0";


        backPreview =
            document.createElement("img");

        backPreview.id =
            "aadhaarBackPreview";

        backPreview.alt =
            "Aadhaar Back Preview";

        backPreview.style.display =
            "none";

        backPreview.style.maxWidth =
            "100%";

        backPreview.style.width =
            "300px";

        backPreview.style.maxHeight =
            "400px";

        backPreview.style.objectFit =
            "contain";

        backPreview.style.border =
            "2px solid #222";

        backPreview.style.borderRadius =
            "5px";


        container.appendChild(label);

        container.appendChild(
            backInput
        );

        container.appendChild(
            document.createElement("br")
        );

        container.appendChild(
            backPreview
        );


        input.parentNode.insertBefore(
            container,
            input.parentNode.querySelector(
                "#submitAdmissionBtn"
            )
        );


        backInput.addEventListener(
            "change",
            function() {

                const file =
                    backInput.files[0];

                if (!file) {
                    return;
                }


                if (
                    !file.type.startsWith("image/")
                ) {

                    alert(
                        "Aadhaar Back must be an image."
                    );

                    backInput.value = "";

                    return;

                }


                window.studentAadhaarData.backFile =
                    file;


                const reader =
                    new FileReader();

                reader.onload =
                    function(event) {

                        backPreview.src =
                            event.target.result;

                        backPreview.style.display =
                            "block";

                    };

                reader.readAsDataURL(file);


                console.log(
                    "AADHAAR BACK SELECTED"
                );

            }
        );

    }


    function removeBackUpload() {

        const oldContainer =
            document.getElementById(
                "aadhaarBackUploadContainer"
            );

        if (oldContainer) {
            oldContainer.remove();
        }

        backInput = null;
        backPreview = null;

    }

}


document.addEventListener(
    "DOMContentLoaded",
    function() {

        initStudentAadhaarUpload();

    }
);
