/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : data-manager.js
   Version : v1.0.0
   Purpose : Central Local Data Manager
   Author  : Devendra Kumar
   Guide   : AERON 
================================================== */

const SURYA_DATA_KEY = "SURYA_CEC_DATA";


/* ==================================================
   DEFAULT DATA
================================================== */

const defaultData = {

    admissions: [
        {
            id: "SC-ADM-001",
            studentName: "Demo Student",
            fatherName: "Demo Father",
            course: "ADCA",
            mobile: "9876543210",
            status: "Pending"
        }
    ],

    students: [
        {
            id: "STU001",
            name: "Demo Student",
            fatherName: "Demo Father",
            course: "ADCA",
            mobile: "9876543210",
            status: "Active"
        }
    ],

    results: [
        {
            studentId: "STU001",
            studentName: "Demo Student",
            course: "ADCA",
            exam: "Final Examination 2026",
            totalMarks: 500,
            obtainedMarks: 425,
            percentage: 85,
            grade: "A",
            result: "PASS",
            status: "Published"
        }
    ],
    certificates: [
    {
        certificateId: "SC-CERT-001",
        studentId: "STU001",
        studentName: "Demo Student",
        course: "ADCA",
        issueDate: "09 August 2026",
        status: "Verified"
    },

    {
        certificateId: "SC-CERT-002",
        studentId: "STU002",
        studentName: "Student Two",
        course: "ADCA",
        issueDate: "10 August 2026",
        status: "Verified"
    }
],


    notices: [
        {
            id: "NOTICE-001",
            title: "ADCA Admission Open 2026",
            message: "ADCA new batch admission is now open.",
            date: "09 August 2026"
        },

        {
            id: "NOTICE-002",
            title: "CCC New Batch Starting Soon",
            message: "Contact office for new batch details.",
            date: "09 August 2026"
        }
    ],

    courses: [
        {
            id: "COURSE-001",
            name: "CCC",
            duration: "3 Months",
            fee: 3000,
            description: "Course on Computer Concepts",
            status: "Active"
        },

        {
            id: "COURSE-002",
            name: "DCA",
            duration: "6 Months",
            fee: 5000,
            description: "Diploma in Computer Application",
            status: "Active"
        },

        {
            id: "COURSE-003",
            name: "ADCA",
            duration: "12 Months",
            fee: 8000,
            description: "Advanced Diploma in Computer Application",
            status: "Active"
        },

        {
            id: "COURSE-004",
            name: "Tally Prime",
            duration: "3 Months",
            fee: 4000,
            description: "Accounting & GST",
            status: "Active"
        }
    ]

};


/* ==================================================
   LOAD DATA
================================================== */

function loadSuryaData() {

    const savedData =
        localStorage.getItem(SURYA_DATA_KEY);

    if (!savedData) {

        localStorage.setItem(
            SURYA_DATA_KEY,
            JSON.stringify(defaultData)
        );

        return defaultData;
    }

    try {

        return JSON.parse(savedData);

    } catch (error) {

        console.error(
            "SURYA DATA ERROR:",
            error
        );

        localStorage.setItem(
            SURYA_DATA_KEY,
            JSON.stringify(defaultData)
        );

        return defaultData;
    }
}


/* ==================================================
   SAVE DATA
================================================== */

function saveSuryaData(data) {

    localStorage.setItem(
        SURYA_DATA_KEY,
        JSON.stringify(data)
    );

}


/* ==================================================
   GET MODULE DATA
================================================== */

function getSuryaModule(moduleName) {

    const data = loadSuryaData();

    return data[moduleName] || [];

}


/* ==================================================
   UPDATE MODULE DATA
================================================== */

function updateSuryaModule(moduleName, moduleData) {

    const data = loadSuryaData();

    data[moduleName] = moduleData;

    saveSuryaData(data);

}


/* ==================================================
   RESET DATA
================================================== */

function resetSuryaData() {

    const confirmReset =
        confirm(
            "⚠️ सभी demo data reset हो जाएगा।\n\nक्या आप जारी रखना चाहते हैं?"
        );

    if (!confirmReset) {
        return;
    }

    localStorage.setItem(
        SURYA_DATA_KEY,
        JSON.stringify(defaultData)
    );

    alert(
        "✅ Demo data successfully reset!"
    );

    location.reload();

}

/* ==================================================
   CERTIFICATE DATA MIGRATION
================================================== */

function migrateCertificateData() {

    const data =
        loadSuryaData();


    if (!Array.isArray(data.certificates)) {

        data.certificates = [];

    }


    const certificateExists =
        data.certificates.some(function(certificate) {

            return (
                certificate.certificateId ===
                "SC-CERT-002"
            );

        });


    if (!certificateExists) {

        data.certificates.push({

            certificateId:
                "SC-CERT-002",

            studentId:
                "STU002",

            studentName:
                "Student Two",

            course:
                "ADCA",

            issueDate:
                "10 August 2026",

            status:
                "Verified"

        });


        saveSuryaData(data);


        console.log(
            "STU002 certificate added successfully."
        );

    }

}


/* ==================================================
   RUN CERTIFICATE MIGRATION
================================================== */

migrateCertificateData();
/* ==================================================
   DATA MANAGER READY
================================================== */

console.log(
    " SURYA DATA MANAGER READY!"
);

/* ==================================================
   ID GENERATOR SYSTEM
================================================== */


/* ==================================================
   APPLICATION ID
   Example: SC-APP-0001
================================================== */

function generateApplicationId() {

    const admissions =
        getSuryaModule("admissions");


    let maxNumber = 0;


    admissions.forEach(
        function(application) {

            if (
                application.id &&
                application.id.startsWith("SC-APP-")
            ) {

                const number =
                    parseInt(
                        application.id
                            .replace("SC-APP-", ""),
                        10
                    );


                if (
                    !isNaN(number) &&
                    number > maxNumber
                ) {

                    maxNumber = number;

                }

            }

        }
    );


    return (
        "SC-APP-" +
        String(maxNumber + 1)
            .padStart(4, "0")
    );

}


/* ==================================================
   ADMISSION ID
   Example: SC-ADM-0001
================================================== */

function generateAdmissionId() {

    const students =
        getSuryaModule("students");


    let maxNumber = 0;


    students.forEach(
        function(student) {

            if (
                student.admissionId &&
                student.admissionId
                    .startsWith("SC-ADM-")
            ) {

                const number =
                    parseInt(
                        student.admissionId
                            .replace("SC-ADM-", ""),
                        10
                    );


                if (
                    !isNaN(number) &&
                    number > maxNumber
                ) {

                    maxNumber = number;

                }

            }

        }
    );


    return (
        "SC-ADM-" +
        String(maxNumber + 1)
            .padStart(4, "0")
    );

}


/* ==================================================
   STUDENT ID
   Course-wise ID
================================================== */

function generateStudentId(course) {

    const students =
        getSuryaModule("students");


    let prefix = "ST";


    const courseName =
        course
            .toUpperCase()
            .replace(/[^A-Z]/g, "");


    if (courseName === "ADCA") {

        prefix = "STADCA";

    }

    else if (courseName === "DCA") {

        prefix = "STDCA";

    }

    else if (
        courseName === "TALLYPRIME"
    ) {

        prefix = "STTALLY";

    }

    else if (courseName === "CCC") {

        prefix = "STCCC";

    }

    else if (
        courseName === "BASICCOMPUTER"
    ) {

        prefix = "STBASIC";

    }

    else if (
        courseName === "TYPING"
    ) {

        prefix = "STTYPING";

    }


    let maxNumber = 0;


    students.forEach(
        function(student) {

            if (
                student.id &&
                student.id.startsWith(prefix)
            ) {

                const number =
                    parseInt(
                        student.id
                            .replace(prefix, ""),
                        10
                    );


                if (
                    !isNaN(number) &&
                    number > maxNumber
                ) {

                    maxNumber = number;

                }

            }

        }
    );


    return (
        prefix +
        String(maxNumber + 1)
            .padStart(4, "0")
    );

}


/* ==================================================
   CERTIFICATE ID
   Example: SC-CERT-0001
================================================== */

function generateCertificateId() {

    const certificates =
        getSuryaModule("certificates");


    let maxNumber = 0;


    certificates.forEach(
        function(certificate) {

            if (
                certificate.certificateId &&
                certificate.certificateId
                    .startsWith("SC-CERT-")
            ) {

                const number =
                    parseInt(
                        certificate.certificateId
                            .replace("SC-CERT-", ""),
                        10
                    );


                if (
                    !isNaN(number) &&
                    number > maxNumber
                ) {

                    maxNumber = number;

                }

            }

        }
    );


    return (
        "SC-CERT-" +
        String(maxNumber + 1)
            .padStart(4, "0")
    );

}


/* ==================================================
   ID GENERATOR READY
================================================== */

console.log(
    "SURYA ID GENERATOR READY!"
);

/* ==================================================
   ID STRUCTURE MIGRATION
   Purpose:
   Convert old demo records to new ID structure
================================================== */

function migrateIdStructure() {

    const data =
        loadSuryaData();


    /* ==================================================
       APPLICATION MIGRATION
    ================================================== */

    if (!Array.isArray(data.admissions)) {

        data.admissions = [];

    }


    data.admissions.forEach(
        function(application, index) {

            /*
             * Old IDs:
             * SC-ADM-001
             *
             * New IDs:
             * SC-APP-0001
             */

            if (
                application.id &&
                application.id.startsWith("SC-ADM-")
            ) {

                const oldNumber =
                    parseInt(
                        application.id
                            .replace("SC-ADM-", ""),
                        10
                    );


                if (!isNaN(oldNumber)) {

                    application.id =
                        "SC-APP-" +
                        String(oldNumber)
                            .padStart(4, "0");

                }

            }

        }
    );


    /* ==================================================
       STUDENT MIGRATION
    ================================================== */

    if (!Array.isArray(data.students)) {

        data.students = [];

    }


    data.students.forEach(
        function(student) {

            /*
             * Add Admission ID
             */

            if (!student.admissionId) {

                const matchingApplication =
                    data.admissions.find(
                        function(application) {

                            return (
                                application.studentName ===
                                student.name
                            );

                        }
                    );


                if (matchingApplication) {

                    const applicationNumber =
                        parseInt(
                            matchingApplication.id
                                .replace("SC-APP-", ""),
                            10
                        );


                    student.admissionId =
                        "SC-ADM-" +
                        String(applicationNumber)
                            .padStart(4, "0");

                }

            }


            /*
             * Convert old Student ID
             */

            if (
                student.id &&
                student.id.startsWith("STU")
            ) {

                const courseName =
                    student.course ||
                    "ADCA";


                student.id =
                    generateStudentIdFromList(
                        courseName,
                        data.students,
                        student.id
                    );

            }

        }
    );


    /* ==================================================
       CERTIFICATE MIGRATION
    ================================================== */

    if (!Array.isArray(data.certificates)) {

        data.certificates = [];

    }


    data.certificates.forEach(
        function(certificate) {

            if (
                certificate.certificateId &&
                certificate.certificateId.startsWith(
                    "SC-CERT-"
                )
            ) {

                const number =
                    parseInt(
                        certificate.certificateId
                            .replace("SC-CERT-", ""),
                        10
                    );


                if (!isNaN(number)) {

                    certificate.certificateId =
                        "SC-CERT-" +
                        String(number)
                            .padStart(4, "0");

                }

            }

        }
    );


    /* ==================================================
       SAVE MIGRATED DATA
    ================================================== */

    saveSuryaData(data);


    console.log(
        "SURYA ID STRUCTURE MIGRATION COMPLETE!"
    );

}


/* ==================================================
   STUDENT ID HELPER
================================================== */

function generateStudentIdFromList(
    course,
    students,
    currentId
) {

    const courseName =
        course
            .toUpperCase()
            .replace(/[^A-Z]/g, "");


    let prefix = "ST";


    if (courseName === "ADCA") {

        prefix = "STADCA";

    }

    else if (courseName === "DCA") {

        prefix = "STDCA";

    }

    else if (
        courseName === "TALLYPRIME"
    ) {

        prefix = "STTALLY";

    }

    else if (courseName === "CCC") {

        prefix = "STCCC";

    }

    else if (
        courseName === "BASICCOMPUTER"
    ) {

        prefix = "STBASIC";

    }

    else if (
        courseName === "TYPING"
    ) {

        prefix = "STTYPING";

    }


    let maxNumber = 0;


    students.forEach(
        function(student) {

            if (
                student.id &&
                student.id.startsWith(prefix) &&
                student.id !== currentId
            ) {

                const number =
                    parseInt(
                        student.id
                            .replace(prefix, ""),
                        10
                    );


                if (
                    !isNaN(number) &&
                    number > maxNumber
                ) {

                    maxNumber = number;

                }

            }

        }
    );


    return (
        prefix +
        String(maxNumber + 1)
            .padStart(4, "0")
    );

}


/* ==================================================
   RUN ID MIGRATION
================================================== */

migrateIdStructure();