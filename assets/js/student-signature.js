/* ==================================================
   SURYA STUDENT SIGNATURE MODULE
================================================== */

function showStudentSignature(student) {

    const signature =
        document.getElementById("studentSignature");

    if (!signature) {
        return;
    }

    signature.src =
        student && student.signature
            ? student.signature
            : "assets/images/signature-placeholder.svg";
}