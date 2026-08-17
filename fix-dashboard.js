const fs = require("fs");

const file = "student-dashboard.html";
let s = fs.readFileSync(file, "utf8");

s = s.replace(
    '<strong>Demo Student</strong>',
    '<strong id="dashboardStudentName">Loading...</strong>'
);

s = s.replace(
    '<strong>Student Name:</strong>\n            Demo Student',
    '<strong>Student Name:</strong>\n            <span id="dashboardName">Loading...</span>'
);

s = s.replace(
    '<strong>Student ID:</strong>\n            STU001',
    '<strong>Student ID:</strong>\n            <span id="dashboardId">Loading...</span>'
);

s = s.replace(
    '<strong>Course:</strong>\n            ADCA',
    '<strong>Course:</strong>\n            <span id="dashboardCourse">Loading...</span>'
);

s = s.replace(
    '<strong>Mobile:</strong>\n    9876543210',
    '<strong>Mobile:</strong>\n    <span id="dashboardMobile">Loading...</span>'
);

s = s.replace(
    '<strong>Course Status:</strong>\n    Active',
    '<strong>Course Status:</strong>\n    <span id="dashboardStatus">Loading...</span>'
);

const marker = '<script>\\n\\nfunction logoutStudent()';

const newScript = `<script src="assets/js/data-manager.js"></script>

<script>

const loggedInStudentId =
    localStorage.getItem("loggedInStudentId");

const students =
    getSuryaModule("students");

const student =
    students.find(function(item) {

        return item.id === loggedInStudentId;

    });

if (!student) {

    alert("Student session not found. Please login again.");

    window.location.href =
        "student-login.html";

} else {

    document.getElementById("dashboardStudentName").textContent =
        student.name || "Student";

    document.getElementById("dashboardName").textContent =
        student.name || "N/A";

    document.getElementById("dashboardId").textContent =
        student.id || "N/A";

    document.getElementById("dashboardCourse").textContent =
        student.course || "N/A";

    document.getElementById("dashboardMobile").textContent =
        student.mobile || "N/A";

    document.getElementById("dashboardStatus").textContent =
        student.status || "N/A";

}

function logoutStudent() {

    localStorage.removeItem("loggedInStudentId");

    alert("You have been logged out.");

    window.location.href =
        "student-login.html";

}

</script>`;

const scriptStart = s.indexOf("<script>", s.indexOf("DASHBOARD SCRIPT"));

const scriptEnd = s.indexOf("</script>", scriptStart);

if (scriptStart === -1 || scriptEnd === -1) {
    console.log("DASHBOARD SCRIPT NOT FOUND");
    process.exit(1);
}

s =
    s.slice(0, scriptStart) +
    newScript +
    s.slice(scriptEnd + "</script>".length);

fs.writeFileSync(file, s);

console.log("STUDENT DASHBOARD CONNECTED TO STUDENT DATA");
