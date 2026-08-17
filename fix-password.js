const fs = require("fs");

const file = "admin-admissions.html";

let s = fs.readFileSync(file, "utf8");

const oldText = `    photoType:
        application.photoType || "",

    status:
        "Active"`;

const newText = `    photoType:
        application.photoType || "",

    password:
        String(application.mobile || "").slice(-6),

    status:
        "Active"`;

if (!s.includes(oldText)) {
    console.log("TARGET NOT FOUND");
    process.exit(1);
}

s = s.replace(oldText, newText);

fs.writeFileSync(file, s);

console.log("PASSWORD FIELD ADDED");
