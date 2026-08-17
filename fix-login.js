const fs = require("fs");

const file = "student-login.html";
let s = fs.readFileSync(file, "utf8");

const start = s.indexOf("<script>", s.indexOf('<div id="loginMessage"></div>'));
const end = s.indexOf("</script>", start);

if (start === -1 || end === -1) {
    console.log("LOGIN SCRIPT NOT FOUND");
    process.exit(1);
}

const newScript = `<script>

const loginForm =
    document.getElementById("studentLoginForm");

const loginMessage =
    document.getElementById("loginMessage");

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const studentId =
        document.getElementById("studentId").value.trim();

    const password =
        document.getElementById("studentPassword").value.trim();

    const students =
        getSuryaModule("students");

    const student =
        students.find(function(item) {

            return (
                item.id === studentId &&
                item.password === password
            );

        });

    if (student) {

        localStorage.setItem(
            "loggedInStudentId",
            student.id
        );

        window.location.href =
            "student-dashboard.html";

    } else {

        loginMessage.innerHTML = \`
            <div class="login-error">
                ❌ Invalid Student ID or Password
            </div>
        \`;

    }

});

</script>`;

s =
    s.slice(0, start) +
    newScript +
    s.slice(end + "</script>".length);

fs.writeFileSync(file, s);

console.log("STUDENT LOGIN CONNECTED TO STUDENT DATA");
