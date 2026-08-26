/* ==================================================
   SURYA CENTRAL DATABASE API
================================================== */

const SURYA_DATABASE_API =
    "https://script.google.com/macros/s/AKfycbxmKAb9FbNVEEsir5P2wck6Im_Wwm_fPqL0jBMIksLUSd6Dkd8w074STmqESIVBGaCw7A/exec";

/* ==================================================
   RESULT MANAGEMENT
================================================== */

let currentResult = null;
let selectedStudent = null;


/* ==================================================
   LOAD RESULTS
================================================== */

async function loadResults() {

    const resultCard =
        document.getElementById("resultCard");

    const noResult =
        document.getElementById("noResult");

    const adminToken =
        sessionStorage.getItem(
            "SURYA_ADMIN_TOKEN"
        );

    if (!adminToken) {

        window.location.replace(
            "admin-login.html"
        );

        return;
    }

    try {

        /* =========================================
           LOAD RESULTS
        ========================================= */

        const resultsResponse =
            await fetch(
                SURYA_DATABASE_API +
                "?action=results&token=" +
                encodeURIComponent(
                    adminToken
                )
            );

        if (!resultsResponse.ok) {

            throw new Error(
                "Results database request failed."
            );

        }

        const resultsData =
            await resultsResponse.json();

        if (
            !resultsData.success ||
            !Array.isArray(
                resultsData.results
            )
        ) {

            throw new Error(
                resultsData.message ||
                "Results could not be loaded."
            );

        }


        /* =========================================
           LOAD STUDENTS
        ========================================= */

        const studentsResponse =
            await fetch(
                SURYA_DATABASE_API +
                "?action=students&token=" +
                encodeURIComponent(
                    adminToken
                )
            );

        if (!studentsResponse.ok) {

            throw new Error(
                "Students database request failed."
            );

        }

        const studentsData =
            await studentsResponse.json();

        if (
            !studentsData.success ||
            !Array.isArray(
                studentsData.students
            )
        ) {

            throw new Error(
                studentsData.message ||
                "Students could not be loaded."
            );

        }


        /* =========================================
           NORMALIZE CENTRAL DATA
        ========================================= */

        window.SURYA_CENTRAL_RESULTS =
            resultsData.results.map(
                function(result) {

                    return {

                        resultId:
                            result.resultId ||
                            result["Result ID"] ||
                            "",

                        studentId:
                            result.studentId ||
                            result["Student ID"] ||
                            "",

                        studentName:
                            result.studentName ||
                            result["Student Name"] ||
                            "",

                        course:
                            result.course ||
                            result["Course"] ||
                            "",

                        exam:
                            result.exam ||
                            result["Exam"] ||
                            "",

                        totalMarks:
                            Number(
                                result.totalMarks ||
                                result["Total Marks"] ||
                                0
                            ),

                        obtainedMarks:
                            Number(
                                result.obtainedMarks ||
                                result["Obtained Marks"] ||
                                0
                            ),

                        percentage:
                            Number(
                                result.percentage ||
                                result["Percentage"] ||
                                0
                            ),

                        grade:
                            result.grade ||
                            result["Grade"] ||
                            "",

                        result:
                            result.result ||
                            result["Result"] ||
                            "",

                        examDate:
                            result.examDate ||
                            result["Exam Date"] ||
                            "",

                        status:
                            result.status ||
                            result["Status"] ||
                            "Draft"

                    };

                }
            );


        window.SURYA_CENTRAL_STUDENTS =
            studentsData.students.map(
                function(student) {

                    return {

                        id:
                            student.id ||
                            student["Student ID"] ||
                            "",

                        name:
                            student.name ||
                            student["Student Name"] ||
                            "",

                        course:
                            student.course ||
                            student["Course"] ||
                            "",
                        photo:
                            student.photo ||
                            student["Photo"] ||
                            ""

                    };

                }
            );

              /* =========================================
           LOAD RESULT SUBJECTS
           Attach subjects to each result
        ========================================= */

        await Promise.all(

            window.SURYA_CENTRAL_RESULTS.map(
                async function(result) {

                    try {

                        const subjectResponse =
                            await fetch(
                                SURYA_DATABASE_API +
                                "?action=resultSubjects&id=" +
                                encodeURIComponent(
                                    result.resultId
                                ) +
                                "&token=" +
                                encodeURIComponent(
                                    adminToken
                                )
                            );


                        if (!subjectResponse.ok) {

                            throw new Error(
                                "Result subjects request failed."
                            );

                        }


                        const subjectData =
                            await subjectResponse.json();


                        if (
                            subjectData.success &&
                            Array.isArray(
                                subjectData.subjects
                            )
                        ) {

                            result.subjects =
                                subjectData.subjects;

                        }
                        else {

                            result.subjects = [];

                        }

                    }
                    catch (error) {

                        console.error(
                            "RESULT SUBJECT LOAD ERROR:",
                            result.resultId,
                            error
                        );

                        result.subjects = [];

                    }

                }
            )

        );

        /* =========================================
           INITIAL DISPLAY
        ========================================= */

        const results =
            window.SURYA_CENTRAL_RESULTS;

        if (results.length === 0) {

            resultCard.style.display =
                "none";

            noResult.style.display =
                "block";

        }
        else {

            currentResult =
                results[0];

            displayResult(
                currentResult
            );

        }


        console.log(
            "SURYA CENTRAL RESULTS:",
            results.length
        );

        console.log(
            "SURYA CENTRAL STUDENTS:",
            window.SURYA_CENTRAL_STUDENTS.length
        );

          if (typeof window.AERON_CREATE_RESULT_PANEL === "function") {
              window.AERON_CREATE_RESULT_PANEL();
          }

          if (typeof window.AERON_RESULT_RENDER === "function") {
              window.AERON_RESULT_RENDER("all");
          }


    }
    catch (error) {

        console.error(
            "LOAD CENTRAL DATA ERROR:",
            error
        );

        alert(
            "❌ Central Database load failed: " +
            error.message
        );

    }

}

/* ==================================================
   DISPLAY RESULT
================================================== */

function displayResult(result) {

    const card =
        document.getElementById("resultCard");

    const noResult =
        document.getElementById("noResult");

    card.style.display = "block";
    noResult.style.display = "none";

    card.innerHTML = `

        <div class="result-card-header">

            <h3>
                👨‍🎓 ${result.studentName}
            </h3>

            <span class="result-published">
                ${result.status}
            </span>

        </div>

        <div class="result-details">

            <p>
                <strong>Student ID:</strong>
                ${result.studentId}
            </p>

            <p>
                <strong>Course:</strong>
                ${result.course}
            </p>

            <p>
                <strong>Exam:</strong>
                ${result.exam}
            </p>

            <p>
                <strong>Total Marks:</strong>
                ${result.totalMarks}
            </p>

            <p>
                <strong>Obtained Marks:</strong>
                ${result.obtainedMarks}
            </p>

            <p>
                <strong>Percentage:</strong>
                ${result.percentage}%
            </p>

            <p>
                <strong>Grade:</strong>
                ${result.grade}
            </p>

            <p>
                <strong>Result:</strong>
                ${result.result}
            </p>

        </div>

        <div class="result-actions">

            <button
                type="button"
                onclick="viewResult()"
            >
                👁️ View
            </button>

            <button
                type="button"
                onclick="editResult()"
            >
                ✏️ Edit
            </button>

            <button
                type="button"
                onclick="publishResult()"
            >
                📢 Publish
            </button>

        </div>

    `;
}


/* ==================================================
   SEARCH RESULT
   Multiple Exams Supported
================================================== */

function searchResult() {

    const search =
        document
            .getElementById("resultSearch")
            .value
            .trim()
            .toLowerCase();

    const results =
        Array.isArray(window.SURYA_CENTRAL_RESULTS)
            ? window.SURYA_CENTRAL_RESULTS
            : [];

    const students =
        Array.isArray(window.SURYA_CENTRAL_STUDENTS)
            ? window.SURYA_CENTRAL_STUDENTS
            : [];

    const card =
        document.getElementById("resultCard");

    const noResult =
        document.getElementById("noResult");


    if (search === "") {

        if (results.length > 0) {

            currentResult =
                results[0];

            displayResult(
                currentResult
            );

        }
        else {

            card.style.display =
                "none";

            noResult.style.display =
                "block";

        }

        return;
    }


    const foundResults =
        results.filter(function(result) {

            return (

                String(
                    result.studentName || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    result.studentId || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    result.course || ""
                )
                .toLowerCase()
                .includes(search)

            );

        });


    if (foundResults.length > 0) {

        card.style.display =
            "block";

        noResult.style.display =
            "none";

        currentResult =
            foundResults[0];

        card.innerHTML = `

            <div class="result-card-header">

                <h3>
                    👨‍🎓
                    ${foundResults[0].studentName}
                </h3>

                <span>
                    ${foundResults.length}
                    Result(s)
                </span>

            </div>

            ${foundResults
                .map(function(result) {

                    return `

                        <div
                            class="result-details"
                            style="
                                border:1px solid #ddd;
                                padding:15px;
                                margin:10px 0;
                                border-radius:10px;
                            "
                        >

                            <h4>
                                📚 ${result.exam}
                            </h4>

                            <p>
                                <strong>
                                    Student ID:
                                </strong>
                                ${result.studentId}
                            </p>

                            <p>
                                <strong>
                                    Course:
                                </strong>
                                ${result.course}
                            </p>

                            <p>
                                <strong>
                                    Total Marks:
                                </strong>
                                ${result.totalMarks}
                            </p>

                            <p>
                                <strong>
                                    Obtained Marks:
                                </strong>
                                ${result.obtainedMarks}
                            </p>

                            <p>
                                <strong>
                                    Percentage:
                                </strong>
                                ${result.percentage}%
                            </p>

                            <p>
                                <strong>
                                    Grade:
                                </strong>
                                ${result.grade}
                            </p>

                            <p>
                                <strong>
                                    Result:
                                </strong>
                                ${result.result}
                            </p>

                            <p>
                                <strong>
                                    Status:
                                </strong>
                                ${result.status}
                            </p>

                            <div class="result-actions">

                                <button
                                    type="button"
                                    onclick='selectResultForAction(${JSON.stringify(result)})'
                                >
                                    👁️ View
                                </button>

                                <button
                                    type="button"
                                    onclick='editSpecificResult(${JSON.stringify(result)})'
                                >
                                    ✏️ Edit
                                </button>

                                <button
                                    type="button"
                                    onclick='publishSpecificResult(${JSON.stringify(result)})'
                                >
                                    📢 Publish
                                </button>

                            </div>

                        </div>

                    `;

                })
                .join("")}

        `;

        return;
    }


    const foundStudent =
        students.find(function(student) {

            return (

                String(
                    student.name || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    student.id || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    student.course || ""
                )
                .toLowerCase()
                .includes(search)

            );

        });


    if (foundStudent) {

        currentResult =
            null;

        card.style.display =
            "block";

        noResult.style.display =
            "none";

        card.innerHTML = `

            <div class="result-card-header">

                <h3>
                    👨‍🎓 ${foundStudent.name}
                </h3>

                <span>
                    No Result
                </span>

            </div>

            <div class="result-details">

                <p>
                    <strong>
                        Student ID:
                    </strong>
                    ${foundStudent.id}
                </p>

                <p>
                    <strong>
                        Course:
                    </strong>
                    ${foundStudent.course}
                </p>

                <p>
                    This student does not have
                    a result yet.
                </p>

            </div>

            <div class="result-actions">

                <button
                    type="button"
                    onclick='openResultEntry(${JSON.stringify(foundStudent)})'
                >
                    📝 Enter Result
                </button>

            </div>

        `;

        return;
    }


    card.style.display =
        "none";

    noResult.style.display =
        "block";

}

/* ==================================================
   SELECT RESULT
================================================== */

function selectResultForAction(result) {

    currentResult =
        result;


    viewResult();

}


/* ==================================================
   EDIT SPECIFIC RESULT
================================================== */

function editSpecificResult(result) {

    currentResult =
        result;


    selectedStudent = {

        id:
            result.studentId,

        name:
            result.studentName,

        course:
            result.course

    };


    editResult();

}


/* ==================================================
   PUBLISH SPECIFIC RESULT
================================================== */

function publishSpecificResult(result) {

    const results =
        getSuryaModule("results");


    const resultIndex =
        results.findIndex(function(item) {

            return (

                item.studentId ===
                result.studentId

                &&

                String(item.exam || "")
                    .trim()
                    .toLowerCase() ===

                String(result.exam || "")
                    .trim()
                    .toLowerCase()

            );

        });


    if (resultIndex === -1) {

        alert(
            "Result record not found."
        );

        return;
    }


    results[resultIndex].status =
        "Published";


    updateSuryaModule(
        "results",
        results
    );


    currentResult =
        results[resultIndex];


    alert(
        "✅ Result Published Successfully!"
    );


    searchResult();

}

/* ==================================================
   VIEW RESULT
================================================== */

function viewResult() {

    if (!currentResult) {

        alert(
            "Result record not found."
        );

        return;
    }

    alert(

        "Student Result\n\n" +

        "Name: " +
        currentResult.studentName +

        "\n\nStudent ID: " +
        currentResult.studentId +

        "\n\nCourse: " +
        currentResult.course +

        "\n\nExam: " +
        currentResult.exam +

        "\n\nTotal Marks: " +
        currentResult.totalMarks +

        "\n\nObtained Marks: " +
        currentResult.obtainedMarks +

        "\n\nPercentage: " +
        currentResult.percentage +
        "%" +

        "\n\nGrade: " +
        currentResult.grade +

        "\n\nResult: " +
        currentResult.result

    );

}


/* ==================================================
   EDIT RESULT
================================================== */

function editResult() {

    if (!currentResult) {

        alert(
            "Result record not found."
        );

        return;
    }

    const resultId =
        String(
            currentResult.resultId || ""
        ).trim();

    if (!resultId) {

        alert(
            "Result ID missing. Cannot edit result."
        );

        return;
    }

    /*
       AERON EDIT MODE
       Preserve the existing Result ID.
    */

    window.AERON_EDIT_RESULT = {
        resultId: resultId,
        result: currentResult
    };

    AERON_EDIT_RESULT = window.AERON_EDIT_RESULT;

    const student = {

        id:
            currentResult.studentId || "",

        name:
            currentResult.studentName || "",

        course:
            currentResult.course || ""

    };

    openSubjectWiseResultEntry(
        student
    );

}


/* ==================================================
   PUBLISH RESULT
   Uses UNIQUE RESULT ID
   Multiple Exams Safe
================================================== */

function publishResult() {

    if (!currentResult) {

        alert(
            "Result record not found."
        );

        return;
    }


    const resultId =
        String(
            currentResult.resultId || ""
        ).trim();


    if (!resultId) {

        alert(
            "Result ID missing. Cannot publish result."
        );

        return;
    }


    const results =
        getSuryaModule("results");


    const resultIndex =
        results.findIndex(
            function(result) {

                return (
                    String(
                        result.resultId || ""
                    ).trim().toUpperCase()
                    ===
                    resultId.toUpperCase()
                );

            }
        );


    if (resultIndex === -1) {

        alert(
            "Result record not found."
        );

        return;
    }


    /*
       Publish ONLY the selected result.
       Student ID alone is NOT used.
    */

    results[resultIndex].status =
        "Published";


    updateSuryaModule(
        "results",
        results
    );


    currentResult =
        results[resultIndex];


    displayResult(
        currentResult
    );


    alert(
        "Result Published Successfully!"
    );

            }


/* ==================================================
   OPEN RESULT ENTRY
================================================== */
function openResultEntry(student) {

    selectedStudent = student;

    document
        .getElementById("entryStudentName")
        .textContent = student.name;

    document
        .getElementById("entryStudentId")
        .textContent = student.id;

    document
        .getElementById("entryCourse")
        .textContent = student.course;

    document
        .getElementById("examName")
        .value = "";

    document
        .getElementById("calculatedResult")
        .innerHTML = "";

    document
        .getElementById("subjectsContainer")
        .innerHTML = `
            <div class="subject-row">

                <input
                    type="text"
                    class="subject-name"
                    placeholder="Subject"
                >

                <input
                    type="number"
                    class="subject-max"
                    placeholder="Max Marks"
                    min="1"
                >

                <input
                    type="number"
                    class="subject-obtained"
                    placeholder="Obtained"
                    min="0"
                >

                <button
                    type="button"
                    onclick="removeSubject(this)"
                >
                    ✖
                </button>

            </div>
        `;

    document
        .getElementById("resultEntryForm")
        .style.display = "block";

}
/* ==================================================
   CALCULATE RESULT
================================================== */

function getSubjectMarks() {

    const rows =
        document.querySelectorAll(
            ".subject-row"
        );

    const subjects = [];

    rows.forEach(
        function(row, index) {

            const name =
                row
                    .querySelector(
                        ".subject-name"
                    )
                    .value
                    .trim();

            const maxMarks =
                Number(
                    row
                        .querySelector(
                            ".subject-max"
                        )
                        .value
                );

            const obtainedMarks =
                Number(
                    row
                        .querySelector(
                            ".subject-obtained"
                        )
                        .value
                );


            if (!name) {
                return;
            }


            if (
                !maxMarks ||
                maxMarks <= 0
            ) {

                throw new Error(
                    "Please enter valid Max Marks for " +
                    name
                );

            }


            if (
                obtainedMarks < 0 ||
                obtainedMarks > maxMarks
            ) {

                throw new Error(
                    "Invalid Obtained Marks for " +
                    name
                );

            }


            subjects.push({

                subjectId:
    String(
        row.dataset.subjectId ||
        ""
    ).trim(),

                subjectName:
                    name,

                name:
                    name,

                maxMarks:
                    maxMarks,

                obtainedMarks:
                    obtainedMarks,

                maxTheoryMarks:
                    maxMarks,

                theoryMarks:
                    obtainedMarks,

                maxPracticalMarks:
                    0,

                practicalMarks:
                    0

            });

        }
    );


    return subjects;
}


/* ==================================================
   ADD SUBJECT
================================================== */

function addSubject() {

    const container =
        document.getElementById("subjectsContainer");

    const row =
        document.createElement("div");

    row.className =
        "subject-row";

    row.innerHTML = `

        <input
            type="text"
            class="subject-name"
            placeholder="Subject"
        >

        <input
            type="number"
            class="subject-max"
            placeholder="Max Marks"
            min="1"
        >

        <input
            type="number"
            class="subject-obtained"
            placeholder="Obtained"
            min="0"
        >

        <button
            type="button"
            onclick="removeSubject(this)"
        >
            ✖
        </button>

    `;

    container.appendChild(row);
}


/* ==================================================
   REMOVE SUBJECT
================================================== */

function removeSubject(button) {

    const rows =
        document.querySelectorAll(".subject-row");

    if (rows.length <= 1) {
        return;
    }

    button
        .closest(".subject-row")
        .remove();
}


/* ==================================================
   CALCULATE RESULT
================================================== */

function calculateResult() {

    const calculatedResult =
        document.getElementById("calculatedResult");

    let subjects;

    try {

        subjects =
            getSubjectMarks();

    }
    catch (error) {

        calculatedResult.innerHTML =
            "❌ " + error.message;

        return;
    }

    if (subjects.length === 0) {

        calculatedResult.innerHTML =
            "❌ Please enter at least one subject.";

        return;
    }

    const totalMarks =
        subjects.reduce(
            function(total, subject) {

                return total +
                    subject.maxMarks;

            },
            0
        );

    const obtainedMarks =
        subjects.reduce(
            function(total, subject) {

                return total +
                    subject.obtainedMarks;

            },
            0
        );

    const percentage =
        Number(
            (
                obtainedMarks /
                totalMarks *
                100
            ).toFixed(2)
        );

    let grade;

    if (percentage >= 80) {

        grade = "A";

    }
    else if (percentage >= 60) {

        grade = "B";

    }
    else if (percentage >= 50) {

        grade = "C";

    }
    else if (percentage >= 33) {

        grade = "D";

    }
    else {

        grade = "F";

    }

    const result =
        percentage >= 33
        ? "PASS"
        : "FAIL";

    calculatedResult.innerHTML = `

        <div>

            <p>
                <strong>Total Marks:</strong>
                ${totalMarks}
            </p>

            <p>
                <strong>Obtained Marks:</strong>
                ${obtainedMarks}
            </p>

            <p>
                <strong>Percentage:</strong>
                ${percentage}%
            </p>

            <p>
                <strong>Grade:</strong>
                ${grade}
            </p>

            <p>
                <strong>Result:</strong>
                ${result}
            </p>

        </div>

    `;
}


/* ==================================================
   SAVE / UPDATE RESULT
================================================== */

async function saveResult() {

    if (!selectedStudent) {

        alert(
            "Student record not selected."
        );

        return;
    }


    const examName =
        document
            .getElementById("examName")
            .value
            .trim();


    if (!examName) {

        alert(
            "Please enter Examination Name."
        );

        return;
    }


    let subjects;

    try {

        subjects =
            getSubjectMarks();

    }
    catch (error) {

        alert(
            error.message
        );

        return;
    }


    if (subjects.length === 0) {

        alert(
            "Please enter at least one subject."
        );

        return;
    }


    const totalMarks =
        subjects.reduce(
            function(total, subject) {

                return total +
                    Number(
                        subject.maxMarks
                    );

            },
            0
        );


    const obtainedMarks =
        subjects.reduce(
            function(total, subject) {

                return total +
                    Number(
                        subject.obtainedMarks
                    );

            },
            0
        );


    if (
        totalMarks <= 0 ||
        obtainedMarks < 0 ||
        obtainedMarks > totalMarks
    ) {

        alert(
            "Invalid marks entered."
        );

        return;
    }


    const percentage =
        Number(
            (
                obtainedMarks /
                totalMarks *
                100
            ).toFixed(2)
        );


    let grade;

    if (percentage >= 80) {

        grade = "A";

    }
    else if (percentage >= 60) {

        grade = "B";

    }
    else if (percentage >= 50) {

        grade = "C";

    }
    else if (percentage >= 33) {

        grade = "D";

    }
    else {

        grade = "F";

    }


    const result =
        percentage >= 33
            ? "PASS"
            : "FAIL";


    const adminToken =
        sessionStorage.getItem(
            "SURYA_ADMIN_TOKEN"
        );


    if (!adminToken) {

        window.location.replace(
            "admin-login.html"
        );

        return;
    }


    /*
       Existing result = UPDATE
       New result = CREATE
    */

    const existingResultId =
        currentResult &&
        currentResult.resultId
            ? currentResult.resultId
            : "";


    const action =
        existingResultId
            ? "updateResult"
            : "createResult";


    const resultId =
        existingResultId ||
        (
            String(
                selectedStudent.id || ""
            )
            .trim()
            .toUpperCase()

            +

            "-"

            +

            String(
                examName || ""
            )
            .trim()
            .toUpperCase()
            .replace(
                /[^A-Z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            )
        );


    try {

        /*
           =========================================
           SAVE MAIN RESULT
        =========================================
        */

        const resultResponse =
            await fetch(
                SURYA_DATABASE_API,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            action:
                                action,

                            token:
                                adminToken,

                            resultId:
                                resultId,

                            studentId:
                                selectedStudent.id,

                            studentName:
                                selectedStudent.name,

                            course:
                                selectedStudent.course,

                            exam:
                                examName,

                            totalMarks:
                                totalMarks,

                            obtainedMarks:
                                obtainedMarks,

                            examDate:
                                new Date()
                                    .toISOString()
                                    .split("T")[0],

                            status:
                                currentResult &&
                                currentResult.status
                                    ? currentResult.status
                                    : "Draft"

                        })

                }
            );


        if (!resultResponse.ok) {

            throw new Error(
                "Result API request failed."
            );

        }


        const resultData =
            await resultResponse.json();


        if (!resultData.success) {

            throw new Error(
                resultData.message ||
                "Result could not be saved."
            );

        }


        /*
           =========================================
           SAVE SUBJECTS
           =========================================
        */

        const savedResultId =
    resultData.result &&
    resultData.result.resultId
        ? resultData.result.resultId
        : resultId;


                for (
            let i = 0;
            i < subjects.length;
            i++
        ) {

            const subject =
                subjects[i];


            const existingSubjectId =
                String(
                    subject.subjectId ||
                    ""
                ).trim();


            const subjectId =
                existingSubjectId ||
                (
                    savedResultId +
                    "-SUB-" +
                    String(i + 1)
                        .padStart(2, "0")
                );


            const subjectAction =
    existingSubjectId
        ? "updateResultSubject"
        : "saveResultSubject";


            const subjectBody = {

                action:
                    subjectAction,

                token:
                    adminToken,

                resultId:
                    savedResultId,

                subjectId:
                    subjectId,

                maxTheoryMarks:
                    Number(
                        subject.maxTheoryMarks ??
                        subject.maxMarks ??
                        0
                    ),

                theoryMarks:
                    Number(
                        subject.theoryMarks ??
                        subject.obtainedMarks ??
                        0
                    ),

                maxPracticalMarks:
                    Number(
                        subject.maxPracticalMarks ??
                        0
                    ),

                practicalMarks:
                    Number(
                        subject.practicalMarks ??
                        0
                    ),

                status:
                    "Active"

            };


            /*
               Student ID is required only
               when creating a NEW subject.
            */

            if (
                subjectAction ===
                "saveResultSubject"
            ) {

                subjectBody.studentId =
                    selectedStudent.id;

                subjectBody.subjectName =
                    subject.subjectName ||
                    subject.name ||
                    "";

            }


            const subjectResponse =
                await fetch(
                    SURYA_DATABASE_API,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "text/plain;charset=utf-8"

                        },

                        body:
                            JSON.stringify(
                                subjectBody
                            )

                    }
                );


            if (!subjectResponse.ok) {

                throw new Error(
                    "Subject API request failed."
                );

            }


            const subjectData =
                await subjectResponse.json();


            if (!subjectData.success) {

                throw new Error(
                    subjectData.message ||
                    (
                        subjectAction ===
                        "updateResultSubject"

                            ?

                        "Subject could not be updated: "

                            :

                        "Subject could not be saved: "
                    ) +
                    (
                        subject.subjectName ||
                        subject.name ||
                        ("Subject " + (i + 1))
                    )
                );

            }


            /*
               Keep ID inside current object
               for immediate UI state.
            */

            subject.subjectId =
                subjectId;

                }


        /*
           =========================================
           UPDATE CURRENT RESULT
           =========================================
        */

        currentResult = {

            resultId:
                savedResultId,

            studentId:
                selectedStudent.id,

            studentName:
                selectedStudent.name,

            course:
                selectedStudent.course,

            exam:
                examName,

            subjects:
                subjects,

            totalMarks:
                totalMarks,

            obtainedMarks:
                obtainedMarks,

            percentage:
                percentage,

            grade:
                grade,

            result:
                result,

            status:
                currentResult &&
                currentResult.status
                    ? currentResult.status
                    : "Draft"

        };


        document
            .getElementById(
                "resultEntryForm"
            )
            .style.display =
                "none";


        displayResult(
            currentResult
        );


        alert(

            action === "updateResult"

                ?

                "✅ Examination result updated successfully in Central Database."

                :

                "✅ Examination result saved successfully in Central Database."

        );


        /*
           Reload central data
        */

        await loadResults();

    }
    catch (error) {

        console.error(
            "SAVE RESULT ERROR:",
            error
        );

        alert(
            "❌ Central Database save failed:\n" +
            error.message
        );

    }

}

/* ==================================================
   PAGE LOAD
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadResults();

    }
);
