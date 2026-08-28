/* ==================================================
   AERON_RESULT_PANEL_V2
================================================== */

(function () {

    "use strict";

    const PANEL_ID = "aeronResultPanelV2";

    function getResults() {

    const data =
        window.SURYA_CENTRAL_RESULTS;

    return Array.isArray(data)
        ? data
        : [];
}


function getStudents() {

    const data =
        window.SURYA_CENTRAL_STUDENTS;

    return Array.isArray(data)
        ? data
        : [];
}


function hasResult(student, results) {

    return results.some(function (r) {

        return (
            String(r.studentId || "")
                .trim()
                .toUpperCase()
            ===
            String(student.id || "")
                .trim()
                .toUpperCase()
        );

    });

}

    function makeResultId(studentId, examName) {

        const sid =
            String(studentId || "")
                .trim()
                .toUpperCase();

        const exam =
            String(examName || "")
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

        return sid + "-" + exam;
    }

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function calculateFromSubjects(subjects) {

        let total = 0;
        let obtained = 0;

        subjects.forEach(function (s) {
            total += Number(s.maxMarks) || 0;
            obtained += Number(s.obtainedMarks) || 0;
        });

        const percentage =
            total > 0
                ? Number(((obtained / total) * 100).toFixed(2))
                : 0;

        let grade = "F";

        if (percentage >= 80) grade = "A";
        else if (percentage >= 60) grade = "B";
        else if (percentage >= 50) grade = "C";
        else if (percentage >= 33) grade = "D";

        return {
            totalMarks: total,
            obtainedMarks: obtained,
            percentage: percentage,
            grade: grade,
            result: percentage >= 33 ? "PASS" : "FAIL"
        };
    }

    function createPanel() {

        const oldCard =
            document.getElementById("resultCard");

        if (!oldCard) return;

        if (document.getElementById(PANEL_ID)) return;

        const wrapper =
            document.createElement("div");

        wrapper.id = PANEL_ID;

        wrapper.innerHTML = `

            <div class="aeron-result-tabs">

                <button
                    class="aeron-result-tab active"
                    id="aeronTabAll"
                    type="button"
                    onclick="AERON_RESULT_SHOW('all')">
                    👨‍🎓 All Students — 0
                </button>

                <button
                    class="aeron-result-tab"
                    id="aeronTabCreate"
                    type="button"
                    onclick="AERON_RESULT_SHOW('create')">
                    📝 Create Result — 0
                </button>

                <button
                    class="aeron-result-tab"
                    id="aeronTabComplete"
                    type="button"
                    onclick="AERON_RESULT_SHOW('complete')">
                    ✅ Complete Result — 0
                </button>

            </div>

            <div
                id="aeronPanelAll"
                class="aeron-result-panel active">

                <input
                    id="aeronSearchAll"
                    class="aeron-result-search"
                    placeholder="🔍 Search Student ID, Name or Course"
                    oninput="AERON_RESULT_RENDER('all')">

                <div id="aeronListAll"></div>

            </div>

            <div
                id="aeronPanelCreate"
                class="aeron-result-panel">

                <input
                    id="aeronSearchCreate"
                    class="aeron-result-search"
                    placeholder="🔍 Search student to create result"
                    oninput="AERON_RESULT_RENDER('create')">

                <div id="aeronListCreate"></div>

            </div>

            <div
                id="aeronPanelComplete"
                class="aeron-result-panel">

                <input
                    id="aeronSearchComplete"
                    class="aeron-result-search"
                    placeholder="🔍 Search completed student"
                    oninput="AERON_RESULT_RENDER('complete')">

                <div id="aeronListComplete"></div>

            </div>

        `;

        oldCard.parentNode.insertBefore(
            wrapper,
            oldCard
        );

        oldCard.style.display = "none";

        AERON_RESULT_RENDER("all");



    }
        window.AERON_CREATE_RESULT_PANEL = createPanel;




    window.AERON_RESULT_SHOW = function (panel) {

        ["all", "create", "complete"].forEach(function (name) {

            const p =
                document.getElementById(


                    "aeronPanel" +
                    name.charAt(0).toUpperCase() +
                    name.slice(1)
                );

            const tab =
                document.getElementById(
                    "aeronTab" +
                    name.charAt(0).toUpperCase() +
                    name.slice(1)
                );

            if (p) {
                p.classList.toggle(
                    "active",
                    name === panel
                );
            }

            if (tab) {
                tab.classList.toggle(
                    "active",
                    name === panel
                );
            }

        });

        AERON_RESULT_RENDER(panel);
    };

    window.AERON_RESULT_RENDER = function (panel) {

        const students = getStudents();
        const results = getResults();

        const completed =
            students.filter(function (student) {
                return hasResult(student, results);
            });

        const pending =
            students.filter(function (student) {
                return !hasResult(student, results);
            });

        document.getElementById("aeronTabAll").textContent =
            "👨‍🎓 All Students — " + students.length;

        document.getElementById("aeronTabCreate").textContent =
            "📝 Create Result — " + pending.length;

        document.getElementById("aeronTabComplete").textContent =
            "✅ Complete Result — " + completed.length;

        let list = students;
        let searchId = "aeronSearchAll";

        if (panel === "create") {
            list = pending;
            searchId = "aeronSearchCreate";
        }

        if (panel === "complete") {
            list = completed;
            searchId = "aeronSearchComplete";
        }

        const search =
            String(
                document.getElementById(searchId)?.value || ""
            )
            .trim()
            .toLowerCase();

        if (search) {

            list = list.filter(function (student) {

                return (
                    String(student.name || "")
                        .toLowerCase()
                        .includes(search)
                    ||
                    String(student.id || "")
                        .toLowerCase()
                        .includes(search)
                    ||
                    String(student.course || "")
                        .toLowerCase()
                        .includes(search)
                );

            });

        }

        const target =
            document.getElementById(
                panel === "all"
                    ? "aeronListAll"
                    : panel === "create"
                    ? "aeronListCreate"
                    : "aeronListComplete"
            );

        if (!target) return;

        if (list.length === 0) {

            target.innerHTML =
                "<p>❌ Student not found.</p>";

            return;
        }

        target.innerHTML =
            list.map(function (student) {

                const studentResults =
                    results.filter(function (r) {

                        return String(r.studentId || "").trim() ===
                               String(student.id || "").trim();

                    });

                let examsHTML = "";

                if (panel === "complete") {

                    examsHTML =
                        studentResults.map(function (r) {

                            return `

                                <div class="aeron-exam">

                                    <strong>
                                        📚 ${escapeHTML(r.exam)}
                                    </strong>

                                    <p>
                                        ${escapeHTML(r.obtainedMarks)}
                                        /
                                        ${escapeHTML(r.totalMarks)}
                                        —
                                        ${escapeHTML(r.percentage)}%
                                        —
                                        Grade ${escapeHTML(r.grade)}
                                    </p>

                                    <p>
                                        Status:
                                        <strong>
                                            ${escapeHTML(r.status || "Draft")}
                                        </strong>
                                    </p>

                                    <div class="aeron-mini-actions">

                                        <button
                                            type="button"
                                            onclick='AERON_VIEW_RESULT(${JSON.stringify(r)})'>
                                            👁️ View
                                        </button>

                                        <button
                                            type="button"
                                            onclick='editSpecificResult(${JSON.stringify(r)})'>
                                            ✏️ Edit
                                        </button>

                                        <button
                                            type="button"
                                            onclick='AERON_PUBLISH_RESULT(${JSON.stringify(r)})'>
                                            📢 Publish
                                        </button>

                                    </div>

                                </div>

                            `;

                        }).join("");

                }

                return `

                    <div
                        class="aeron-student-card"
                        data-student-id="${escapeHTML(student.id)}"
                    >

                        <div class="aeron-student-main">

                            <div class="aeron-student-info">

                                <div class="aeron-student-head">

                                    <strong>
                                        👨‍🎓 ${escapeHTML(student.name)}
                                    </strong>

                                    <span>
                                        ${escapeHTML(student.id)}
                                    </span>

                                </div>

                                <p>
                                    Course:
                                    ${escapeHTML(student.course)}
                                </p>

                            </div>

                            <div class="aeron-result-photo-container">

                                <div class="aeron-result-photo-loading">
                                    📷
                                </div>

                            </div>

                        </div>

                        ${
                            panel === "create"

                            ?

                            `<div class="aeron-mini-actions">

                                <button
                                    type="button"
                                    onclick='openSubjectWiseResultEntry(${JSON.stringify(student)})'>
                                    📝 Create
                                </button>

                            </div>`

                            :

                            panel === "complete"

                            ?

                            examsHTML

                            :

                            `<p>
                                ${
                                    studentResults.length > 0
                                    ? "✅ " + studentResults.length + " examination result(s)"
                                    : "⏳ Result not created yet"
                                }
                            </p>`

                        }

                    </div>

                `;

            }).join("");

          target.querySelectorAll(".aeron-student-card").forEach(
              function(card) {

                  const studentId =
                      card.getAttribute("data-student-id");

                  const student =
                      list.find(function(item) {
                          return String(item.id || "") ===
                                 String(studentId || "");
                      });

                  if (student) {
                      loadResultStudentPhoto(student, card);
                  }

              }
          );

    };

    async function loadResultStudentPhoto(student, card) {

        try {

            if (!student || !student.photo || !card) {
                return;
            }

            const photoUrl =
                String(student.photo || "");

            const match =
                photoUrl.match(/[?&]id=([^&]+)/) ||
                photoUrl.match(/\/file\/d\/([^/]+)/);

            if (!match) {
                console.error(
                    "RESULT PHOTO FILE ID NOT FOUND:",
                    student.photo
                );
                return;
            }

            const fileId = match[1];

            const adminToken =
                sessionStorage.getItem(
                    "SURYA_ADMIN_TOKEN"
                );

            if (!adminToken) {
                console.error(
                    "RESULT PHOTO ADMIN TOKEN NOT FOUND"
                );
                return;
            }

            const response =
                await fetch(
                    SURYA_DATABASE_API +
                    "?action=studentPhoto" +
                    "&id=" +
                    encodeURIComponent(fileId) +
                    "&token=" +
                    encodeURIComponent(adminToken)
                );

            if (!response.ok) {
                throw new Error(
                    "Private student photo request failed."
                );
            }

            const result =
                await response.json();

            if (
                !result.success ||
                !result.data
            ) {
                console.error(
                    "RESULT PRIVATE PHOTO LOAD FAILED:",
                    result.message
                );
                return;
            }

            const container =
                card.querySelector(
                    ".aeron-result-photo-container"
                );

            if (!container) {
                return;
            }

            container.innerHTML = "";

            const img =
                document.createElement("img");

            img.src =
                "data:" +
                result.mimeType +
                ";base64," +
                result.data;

            img.alt = "Student Photo";

            img.style.width = "90px";
            img.style.height = "110px";
            img.style.objectFit = "cover";
            img.style.objectPosition = "center";
            img.style.borderRadius = "8px";
            img.style.border = "1px solid #ddd";
            img.style.display = "block";

            container.appendChild(img);

        } catch (error) {

            console.error(
                "RESULT PRIVATE PHOTO ERROR:",
                error
            );

        }

    };

    window.AERON_VIEW_RESULT = function (result) {

        window.currentResult = result;

        alert(
            "Student Result\n\n" +
            "Name: " + result.studentName +
            "\n\nStudent ID: " + result.studentId +
            "\n\nCourse: " + result.course +
            "\n\nExam: " + result.exam +
            "\n\nTotal Marks: " + result.totalMarks +
            "\n\nObtained Marks: " + result.obtainedMarks +
            "\n\nPercentage: " + result.percentage + "%" +
            "\n\nGrade: " + result.grade +
            "\n\nResult: " + result.result +
            "\n\nStatus: " + (result.status || "Draft") +
            "\n\nResult ID: " + (result.resultId || "")
        );

    };

    window.AERON_PUBLISH_RESULT = async function (result) {

        const resultId =
            String(result && result.resultId || "").trim();

        if (!resultId) {
            alert("❌ Result ID missing. Cannot publish result.");
            return;
        }

        if (!confirm("क्या इस result को Publish करना है?")) return;

        try {
            if (typeof AERON_CENTRAL_PUBLISH_RESULT !== "function") {
                throw new Error("Central Result Publish module is unavailable.");
            }

            await AERON_CENTRAL_PUBLISH_RESULT(resultId);

            const results = getResults();
            const index = results.findIndex(function (r) {
                return String(r.resultId || "").trim().toUpperCase() === resultId.toUpperCase();
            });

            if (index >= 0) {
                results[index].status = "Published";
                updateSuryaModule("results", results);
            }

            alert("✅ Result Published Successfully!");
            AERON_RESULT_RENDER("complete");

        } catch (error) {
            console.error("CENTRAL RESULT PUBLISH ERROR:", error);
            alert("❌ " + error.message);
        }
    };


    
    

    /* ============================================================
   SURYA COMPUTER OF EDUCATION CENTER
   AERON FINAL CENTRAL RESULT ENTRY SYSTEM
   VERSION: v3.0.0

   CENTRAL DATABASE:
   - Course Subjects -> Google Apps Script
   - Result Subjects -> Google Apps Script
   - No local result database
   - Theory: 0-70
   - Practical: 0-30
============================================================ */

(function () {

    "use strict";

    /* ========================================================
       CENTRAL API
    ======================================================== */

    const AERON_RESULT_API =
        "https://script.google.com/macros/s/AKfycbwSNgtaUsInP4pOPORHVcYjyFKIqESpTj_zyLqy-4dpLUMX--D1EnRv36YVbGwfkL7l/exec";


    const THEORY_MAX = 70;
    const PRACTICAL_MAX = 30;


    /* ========================================================
       STATE
    ======================================================== */

    let AERON_RESULT_STUDENT = null;

    /*
     * AERON EDIT STATE
     * Always read the current value from window.
     * Edit button may set this after this IIFE starts.
     */
    const getAeronEditResult = function () {
        return window.AERON_EDIT_RESULT || null;
    };

    let AERON_COURSE_SUBJECT_LIST = [];

    let AERON_SELECTED_RESULT_SUBJECTS = [];
    let AERON_EXISTING_RESULT_SUBJECT_IDS = new Set();

    

    /* ========================================================
       ESCAPE HTML
    ======================================================== */

    function safeHTML(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* ========================================================
       CENTRAL API REQUEST
    ======================================================== */

    async function centralRequest(
        action,
        options
    ) {

        options =
            options || {};

        const token =
            sessionStorage.getItem(
                "SURYA_ADMIN_TOKEN"
            );

        if (!token) {

            throw new Error(
                "Admin login required."
            );

        }


        let url =
            AERON_RESULT_API +
            "?action=" +
            encodeURIComponent(action) +
            "&token=" +
            encodeURIComponent(token);
      /* ========================================================
   GET PARAMETERS
   ======================================================== */

if (
    options.params &&
    typeof options.params === "object"
) {

    Object.keys(
        options.params
    ).forEach(
        function (key) {

            const value =
                options.params[key];

            if (
                value !== undefined &&
                value !== null
            ) {

                url +=
                    "&" +
                    encodeURIComponent(key) +
                    "=" +
                    encodeURIComponent(
                        String(value)
                    );

            }

        }
    );

}


        const fetchOptions = {};


        if (options.method) {

            fetchOptions.method =
                options.method;

        }


        if (options.body !== undefined) {

            fetchOptions.headers = {

                "Content-Type":
                    "text/plain;charset=utf-8"

            };

            fetchOptions.body =
                JSON.stringify(
                    options.body
                );

        }


        const response =
            await fetch(
                url,
                fetchOptions
            );


        if (!response.ok) {

            throw new Error(
                "Central API request failed."
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Central API returned an error."
            );

        }


        return data;

    }


    /* ========================================================
       CREATE UI
    ======================================================== */

    function createAeronResultUI() {

        if (
            document.getElementById(
                "aeronFinalResultEntry"
            )
        ) {

            return;

        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.id =
            "aeronFinalResultEntry";


        wrapper.style.display =
            "none";


        wrapper.innerHTML = `

<style>

# aERON_FINAL_RESULT_ENTRY {
    box-sizing: border-box;
}

.aeron-final-result-card {

    max-width: 1000px;

    margin: 20px auto;

    padding: 22px;

    background: #ffffff;

    border-radius: 16px;

    box-shadow:
        0 8px 30px rgba(0,0,0,0.10);

}

.aeron-final-result-card * {

    box-sizing: border-box;

}

.aeron-result-header h3 {

    margin: 0;

    font-size: 24px;

}

.aeron-result-header p {

    margin: 6px 0 20px;

    color: #666;

}

.aeron-student-info-grid {

    display: grid;

    grid-template-columns:
        repeat(3, 1fr);

    gap: 12px;

    margin-bottom: 20px;

}

.aeron-student-info-box {

    padding: 14px;

    background: #f7f8fa;

    border-radius: 10px;

}

.aeron-student-info-box small {

    display: block;

    color: #777;

    margin-bottom: 5px;

}

.aeron-student-info-box strong {

    display: block;

}

.aeron-exam-box {

    margin-bottom: 20px;

}

.aeron-exam-box label {

    display: block;

    font-weight: 600;

    margin-bottom: 7px;

}

.aeron-exam-box input {

    width: 100%;

    padding: 13px;

    border: 1px solid #d9dde3;

    border-radius: 9px;

    font-size: 15px;

}

.aeron-subject-selector {

    padding: 16px;

    border: 1px solid #e2e5e9;

    border-radius: 12px;

    margin-bottom: 20px;

}

.aeron-subject-selector h4 {

    margin: 0 0 5px;

}

.aeron-subject-selector p {

    margin: 0 0 12px;

    color: #777;

    font-size: 13px;

}

.aeron-subject-select-row {

    display: flex;

    gap: 10px;

}

.aeron-subject-select-row select {

    flex: 1;

    min-width: 0;

    padding: 12px;

    border: 1px solid #d9dde3;

    border-radius: 9px;

    background: #fff;

}

.aeron-add-subject-btn {

    border: none;

    border-radius: 9px;

    padding: 12px 16px;

    cursor: pointer;

    font-weight: 700;

}

.aeron-selected-title {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 12px;

}

.aeron-selected-title h4 {

    margin: 0;

}

.aeron-selected-title span {

    color: #777;

    font-size: 13px;

}

.aeron-result-subject {

    border: 1px solid #e0e4e9;

    border-radius: 13px;

    padding: 16px;

    margin-bottom: 13px;

}

.aeron-result-subject-head {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 15px;

}

.aeron-result-subject-name {

    font-weight: 700;

    font-size: 16px;

}

.aeron-result-subject-id {

    color: #777;

    font-size: 12px;

    margin-top: 3px;

}

.aeron-remove-subject {

    border: none;

    background: transparent;

    cursor: pointer;

    font-size: 18px;

}

.aeron-mark-grid {

    display: grid;

    grid-template-columns:
        1fr 1fr 1fr;

    gap: 12px;

}

.aeron-mark-box {

    padding: 12px;

    background: #f7f8fa;

    border-radius: 10px;

}

.aeron-mark-box label {

    display: block;

    font-weight: 600;

    font-size: 13px;

    margin-bottom: 4px;

}

.aeron-mark-box small {

    display: block;

    color: #777;

    margin-bottom: 7px;

}

.aeron-mark-box input {

    width: 100%;

    padding: 11px;

    border: 1px solid #d7dce2;

    border-radius: 8px;

    font-size: 16px;

}

.aeron-subject-total {

    font-size: 22px;

    font-weight: 700;

    padding-top: 8px;

}

.aeron-result-summary {

    display: grid;

    grid-template-columns:
        repeat(3, 1fr);

    gap: 12px;

    margin-top: 20px;

}

.aeron-summary-box {

    padding: 15px;

    background: #f7f8fa;

    border-radius: 11px;

}

.aeron-summary-box small {

    display: block;

    color: #666;

}

.aeron-summary-box strong {

    display: block;

    margin-top: 5px;

    font-size: 20px;

}

.aeron-validation {

    margin-top: 15px;

    min-height: 22px;

    font-weight: 600;

}

.aeron-result-actions {

    display: flex;

    gap: 10px;

    margin-top: 20px;

}

.aeron-result-actions button {

    padding: 13px 20px;

    border: none;

    border-radius: 9px;

    cursor: pointer;

    font-weight: 700;

}

.aeron-save-result {

    flex: 1;

}

.aeron-cancel-result {

    min-width: 110px;

}

@media (max-width: 700px) {

    .aeron-student-info-grid {

        grid-template-columns: 1fr;

    }

    .aeron-subject-select-row {

        flex-direction: column;

    }

    .aeron-mark-grid {

        grid-template-columns: 1fr;

    }

    .aeron-result-summary {

        grid-template-columns: 1fr 1fr;

    }

    .aeron-result-actions {

        flex-direction: column;

    }

}

</style>


<div class="aeron-final-result-card">

    <div class="aeron-result-header">

        <h3>
            📝 Enter Student Result
        </h3>

        <p>
            Subject-wise Result Entry — Theory 70 + Practical 30
        </p>

    </div>


    <div class="aeron-student-info-grid">

        <div class="aeron-student-info-box">

            <small>
                Student
            </small>

            <strong id="aeronEntryStudentName">
                -
            </strong>

        </div>


        <div class="aeron-student-info-box">

            <small>
                Student ID
            </small>

            <strong id="aeronEntryStudentId">
                -
            </strong>

        </div>


        <div class="aeron-student-info-box">

            <small>
                Course
            </small>

            <strong id="aeronEntryCourse">
                -
            </strong>

        </div>

    </div>


    <div class="aeron-exam-box">

        <label>
            Examination Name
        </label>

        <input
            type="text"
            id="aeronFinalExamName"
            placeholder="Final Examination 2026"
            autocomplete="off"
        >

    </div>


    <div class="aeron-subject-selector">

        <h4>
            📚 Select Subjects
        </h4>

        <p>
            Subjects are loaded from the Central Course Subjects database.
        </p>


        <div class="aeron-subject-select-row">

            <select
                id="aeronFinalSubjectSelect"
            >

                <option value="">
                    ⏳ Loading subjects...
                </option>

            </select>


            <button
                type="button"
                class="aeron-add-subject-btn"
                id="aeronFinalAddSubjectBtn"
            >
                ➕ Add Subject
            </button>

        </div>

    </div>


    <div
        id="aeronFinalSelectedSection"
        style="display:none;"
    >

        <div class="aeron-selected-title">

            <h4>
                📋 Selected Subjects
            </h4>

            <span
                id="aeronFinalSubjectCount"
            >
                0 Subjects
            </span>

        </div>


        <div
            id="aeronFinalSelectedSubjects"
        ></div>

    </div>


    <div class="aeron-result-summary">

        <div class="aeron-summary-box">

            <small>
                Total Theory
            </small>

            <strong id="aeronFinalTheory">
                0 / 0
            </strong>

        </div>


        <div class="aeron-summary-box">

            <small>
                Total Practical
            </small>

            <strong id="aeronFinalPractical">
                0 / 0
            </strong>

        </div>


        <div class="aeron-summary-box">

            <small>
                Grand Total
            </small>

            <strong id="aeronFinalGrand">
                0 / 0
            </strong>

        </div>


        <div class="aeron-summary-box">

            <small>
                Percentage
            </small>

            <strong id="aeronFinalPercentage">
                0%
            </strong>

        </div>


        <div class="aeron-summary-box">

            <small>
                Grade
            </small>

            <strong id="aeronFinalGrade">
                -
            </strong>

        </div>


        <div class="aeron-summary-box">

            <small>
                Result
            </small>

            <strong id="aeronFinalStatus">
                -
            </strong>

        </div>

    </div>


    <div
        id="aeronFinalValidation"
        class="aeron-validation"
    ></div>


    <div class="aeron-result-actions">

        <button
            type="button"
            class="aeron-save-result"
            id="aeronFinalSaveBtn"
        >
            💾 Save Result
        </button>


        <button
            type="button"
            class="aeron-cancel-result"
            id="aeronFinalCancelBtn"
        >
            ✖ Cancel
        </button>

    </div>

</div>
`;


        document.body.appendChild(
            wrapper
        );


        document
            .getElementById(
                "aeronFinalAddSubjectBtn"
            )
            .onclick =
            addSelectedSubject;


        document
            .getElementById(
                "aeronFinalSaveBtn"
            )
            .onclick =
            saveSubjectWiseResult;


        document
            .getElementById(
                "aeronFinalCancelBtn"
            )
            .onclick =
            closeSubjectWiseResultEntry;

    }


    /* ========================================================
       OPEN RESULT ENTRY
    ======================================================== */

    window.openSubjectWiseResultEntry =
        async function (student) {

        createAeronResultUI();


        AERON_RESULT_STUDENT =
            student || null;


        if (!AERON_RESULT_STUDENT) {

            alert(
                "❌ Student not selected."
            );

            return;

        }


        AERON_SELECTED_RESULT_SUBJECTS =
            [];

        AERON_EXISTING_RESULT_SUBJECT_IDS =
            new Set();

                /*
         * AERON EDIT MODE
         * Keep existing result information.
         */

        const currentAeronEditResult =
            getAeronEditResult();

        const editResult =
            currentAeronEditResult &&
            currentAeronEditResult.result
                ? currentAeronEditResult.result
                : null;

        const isEditMode =
            !!(
                currentAeronEditResult &&
                currentAeronEditResult.resultId
            );


        /*
         * LOAD EXISTING RESULT SUBJECTS
         * Only in Edit Mode
         */

        if (isEditMode) {

            const existingResultId =
                String(
                    currentAeronEditResult.resultId || ""
                ).trim();

            try {

                const subjectData =
    await centralRequest(
        "getResultSubjects",
        {
            method: "POST",

            body: {

                action:
                    "getResultSubjects",

                token:
                    sessionStorage.getItem(
                        "SURYA_ADMIN_TOKEN"
                    ),

                resultId:
                    existingResultId

            }
        }
    );

                console.log(
                    "🔎 AERON GET RESULT SUBJECTS:",
                    {
                        resultId: existingResultId,
                        subjectData: subjectData
                    }
                );

                if (
                    subjectData &&
                    subjectData.success &&
                    Array.isArray(
                        subjectData.subjects
                    )
                ) {

                    AERON_EXISTING_RESULT_SUBJECT_IDS =
                        new Set(
                            subjectData.subjects
                                .map(function(item){
                                    return String(
                                        item.subjectId ||
                                        item.SubjectID ||
                                        item["Subject ID"] ||
                                        ""
                                    ).trim().toUpperCase();
                                })
                                .filter(Boolean)
                        );

                    AERON_SELECTED_RESULT_SUBJECTS =
    subjectData.subjects.map(
        function (subject) {

            return {

                isExistingResultSubject: true,

                subjectId:
                    String(
                        subject.subjectId ||
                        subject.SubjectID ||
                        subject["Subject ID"] ||
                        ""
                    ).trim(),

                subjectName:
                    String(
                        subject.subjectName ||
                        subject.SubjectName ||
                        subject["Subject Name"] ||
                        ""
                    ).trim(),

                maxTheoryMarks:
                    Number(
                        subject.maxTheoryMarks ??
                        subject["Max Theory Marks"] ??
                        THEORY_MAX
                    ),

                theoryMarks:
                    Number(
                        subject.theoryMarks ??
                        subject["Theory Marks"] ??
                        0
                    ),

                maxPracticalMarks:
                    Number(
                        subject.maxPracticalMarks ??
                        subject["Max Practical Marks"] ??
                        PRACTICAL_MAX
                    ),

                practicalMarks:
                    Number(
                        subject.practicalMarks ??
                        subject["Practical Marks"] ??
                        0
                    )

            };

        }
    );
                }

            }
            catch (error) {

                console.error(
                    "EDIT RESULT SUBJECT LOAD ERROR:",
                    error
                );

                showValidation(
                    "❌ पुराने Result Subjects load नहीं हो सके: " +
                    error.message
                );

            }

        }


        document
            .getElementById(
                "aeronEntryStudentName"
            )
            .textContent =
            AERON_RESULT_STUDENT.name || "-";


        document
            .getElementById(
                "aeronEntryStudentId"
            )
            .textContent =
            AERON_RESULT_STUDENT.id || "-";


        document
            .getElementById(
                "aeronEntryCourse"
            )
            .textContent =
            AERON_RESULT_STUDENT.course || "-";


        document
    .getElementById(
        "aeronFinalExamName"
    )
    .value =
    isEditMode
        ? String(
            editResult &&
            (
                editResult.exam ||
                editResult.examName ||
                editResult.ExaminationName ||
                editResult["Examination Name"] ||
                ""
            )
        ).trim()
        : "";

        document
    .getElementById(
        "aeronFinalSelectedSection"
    )
    .style.display =
    isEditMode &&
    AERON_SELECTED_RESULT_SUBJECTS.length > 0
        ? "block"
        : "none";


        if (
    !isEditMode ||
    AERON_SELECTED_RESULT_SUBJECTS.length === 0
) {

    document
        .getElementById(
            "aeronFinalSelectedSubjects"
        )
        .innerHTML =
        "";

        }


        document
            .getElementById(
                "aeronFinalValidation"
            )
            .textContent =
            "";


        resetSummary();

                /*
         * AERON EDIT MODE
         * Render existing subjects and marks.
         */

        if (isEditMode) {

            renderSelectedSubjects();
            updateAeronEditSummary();

        }


        document
            .getElementById(
                "aeronFinalResultEntry"
            )
            .style.display =
            "block";


        window.scrollTo({

            top:
                document
                    .getElementById(
                        "aeronFinalResultEntry"
                    )
                    .offsetTop - 20,

            behavior:
                "smooth"

        });


        await loadCentralCourseSubjects();

    };

    /* ========================================================
       AERON COURSE CODE NORMALIZER
       Hindi / English Course Name -> Central Course Code
    ======================================================== */

    function normalizeCourseCode(course) {

        const value =
            String(course || "")
                .trim()
                .toUpperCase();

        const courseMap = {

            "DCA": "DCA",
            "डीसीए": "DCA",

            "ADCA": "ADCA",
            "एडीसीए": "ADCA",

            "PGDCA": "PGDCA",
            "पीजीडीसीए": "PGDCA"

        };

        return (
            courseMap[value] ||
            value
        );
    }

    /* ========================================================
       LOAD COURSE SUBJECTS FROM CENTRAL API
    ======================================================== */

    async function loadCentralCourseSubjects() {

        const select =
            document.getElementById(
                "aeronFinalSubjectSelect"
            );


        if (!select) return;


        const rawCourse =
            String(
                AERON_RESULT_STUDENT &&
                AERON_RESULT_STUDENT.course ||
                ""
            )
            .trim();

        const course =
            normalizeCourseCode(
                rawCourse
            );


        if (!course) {

            select.innerHTML =
                `
                <option value="">
                    ❌ Course not found
                </option>
                `;

            return;

        }


        select.innerHTML =
            `
            <option value="">
                ⏳ Loading ${safeHTML(course)} subjects...
            </option>
            `;


        try {

            const data =
                await centralRequest(
                    "courseSubjects"
                );


            const allSubjects =
                Array.isArray(
                    data.subjects
                )
                    ? data.subjects
                    : [];


            AERON_COURSE_SUBJECT_LIST =
                allSubjects.filter(
                    function (subject) {

                        const subjectCourse =
                            String(
                                subject.Course ||
                                subject.course ||
                                ""
                            )
                            .trim()
                            .toUpperCase();


                        const status =
                            String(
                                subject.Status ||
                                subject.status ||
                                "Active"
                            )
                            .trim()
                            .toLowerCase();


                        return (
                            subjectCourse ===
                            course
                        )
                        &&
                        status ===
                        "active";

                    }
                );


            renderCentralSubjectSelect();


        } catch (error) {

            console.error(
                "AERON CENTRAL COURSE SUBJECT ERROR:",
                error
            );


            select.innerHTML =
                `
                <option value="">
                    ❌ Subjects could not be loaded
                </option>
                `;


            showValidation(
                "❌ Central Course Subjects load failed: " +
                error.message
            );

        }

    }


    /* ========================================================
       RENDER SUBJECT SELECT
    ======================================================== */

    function renderCentralSubjectSelect() {

        const select =
            document.getElementById(
                "aeronFinalSubjectSelect"
            );


        if (!select) return;


        select.innerHTML =
            `
            <option value="">
                ➕ Select Subject
            </option>
            `;


        AERON_COURSE_SUBJECT_LIST
            .forEach(
                function (subject) {

                    const subjectId =
                        String(
                            subject.SubjectID ||
                            subject.subjectId ||
                            subject["Subject ID"] ||
                            ""
                        ).trim();


                    const subjectName =
                        String(
                            subject.SubjectName ||
                            subject.subjectName ||
                            subject["Subject Name"] ||
                            ""
                        ).trim();


                    if (!subjectId || !subjectName) {

                        return;

                    }


                    const alreadySelected =
                        AERON_SELECTED_RESULT_SUBJECTS
                            .some(
                                function (item) {

                                    return (
                                        String(
                                            item.subjectId
                                        )
                                        .toUpperCase()
                                        ===
                                        subjectId
                                            .toUpperCase()
                                    );

                                }
                            );


                    if (alreadySelected) {

                        return;

                    }


                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        subjectId;


                    option.textContent =
                        subjectName;


                    option.dataset.subjectName =
                        subjectName;


                    select.appendChild(
                        option
                    );

                }
            );


        if (
            select.options.length === 1
        ) {

            select.innerHTML =
                `
                <option value="">
                    ⚠️ No active subjects found
                </option>
                `;

        }

    }


    /* ========================================================
       ADD SELECTED SUBJECT
    ======================================================== */

    function addSelectedSubject() {

        const select =
            document.getElementById(
                "aeronFinalSubjectSelect"
            );


        if (!select) return;


        const subjectId =
            String(
                select.value || ""
            ).trim();


        if (!subjectId) {

            showValidation(
                "⚠️ पहले Subject select करें."
            );

            return;

        }


        const subject =
            AERON_COURSE_SUBJECT_LIST.find(
                function (item) {

                    const id =
                        String(
                            item.SubjectID ||
                            item.subjectId ||
                            item["Subject ID"] ||
                            ""
                        ).trim();


                    return (
                        id ===
                        subjectId
                    );

                }
            );


        if (!subject) {

            showValidation(
                "❌ Subject not found."
            );

            return;

        }


        const subjectName =
            String(
                subject.SubjectName ||
                subject.subjectName ||
                subject["Subject Name"] ||
                ""
            ).trim();


        const already =
            AERON_SELECTED_RESULT_SUBJECTS
                .some(
                    function (item) {

                        return (
                            String(
                                item.subjectId
                            )
                            .toUpperCase()
                            ===
                            subjectId
                                .toUpperCase()
                        );

                    }
                );


        if (already) {

            showValidation(
                "⚠️ यह subject पहले से selected है."
            );

            return;

        }


        AERON_SELECTED_RESULT_SUBJECTS
            .push({

                subjectId:
                    subjectId,

                subjectName:
                    subjectName,

                maxTheoryMarks:
                    THEORY_MAX,

                maxPracticalMarks:
                    PRACTICAL_MAX,

                theoryMarks:
                    0,

                practicalMarks:
                    0

            });


        clearValidation();


        renderSelectedSubjects();

        renderCentralSubjectSelect();

    }


    /* ========================================================
       REMOVE SUBJECT
    ======================================================== */

    function removeSelectedSubject(index) {

        if (
            index < 0 ||
            index >=
            AERON_SELECTED_RESULT_SUBJECTS.length
        ) {

            return;

        }


        AERON_SELECTED_RESULT_SUBJECTS
            .splice(
                index,
                1
            );


        renderSelectedSubjects();

        renderCentralSubjectSelect();

    }


    /* ========================================================
       UPDATE MARK
    ======================================================== */

    function updateSubjectMark(
        index,
        type,
        value
    ) {

        const item =
            AERON_SELECTED_RESULT_SUBJECTS[
                index
            ];


        if (!item) return;


        let mark =
            Number(value);


        if (
            !Number.isFinite(mark)
        ) {

            mark = 0;

        }


        if (type === "theory") {

            if (mark < 0) {

                mark = 0;

            }


            if (mark > THEORY_MAX) {

                showValidation(
                    "❌ Theory marks 0 से 70 के बीच होने चाहिए."
                );

                mark =
                    THEORY_MAX;

            }


            item.theoryMarks =
                mark;

        }


        if (type === "practical") {

            if (mark < 0) {

                mark = 0;

            }


            if (mark > PRACTICAL_MAX) {

                showValidation(
                    "❌ Practical marks 0 से 30 के बीच होने चाहिए."
                );

                mark =
                    PRACTICAL_MAX;

            }


            item.practicalMarks =
                mark;

        }


        renderSelectedSubjects();

    }


    /* ========================================================
       RENDER SELECTED SUBJECTS
    ======================================================== */

    function renderSelectedSubjects() {

        const section =
            document.getElementById(
                "aeronFinalSelectedSection"
            );


        const box =
            document.getElementById(
                "aeronFinalSelectedSubjects"
            );


        const count =
            document.getElementById(
                "aeronFinalSubjectCount"
            );


        if (!section || !box) return;


        count.textContent =
            AERON_SELECTED_RESULT_SUBJECTS.length +
            " Subject" +
            (
                AERON_SELECTED_RESULT_SUBJECTS.length === 1
                    ? ""
                    : "s"
            );


        if (
            AERON_SELECTED_RESULT_SUBJECTS.length === 0
        ) {

            section.style.display =
                "none";


            box.innerHTML =
                "";


            resetSummary();

            return;

        }


        section.style.display =
            "block";


        box.innerHTML =
            AERON_SELECTED_RESULT_SUBJECTS
                .map(
                    function (item, index) {

                        const total =
                            Number(
                                item.theoryMarks
                            ) +
                            Number(
                                item.practicalMarks
                            );


                        return `

<div class="aeron-result-subject">

    <div class="aeron-result-subject-head">

        <div>

            <div class="aeron-result-subject-name">

                ${safeHTML(
                    item.subjectName
                )}

            </div>

            <div class="aeron-result-subject-id">

                Subject ID:
                ${safeHTML(
                    item.subjectId
                )}

            </div>

        </div>


        <button
            type="button"
            class="aeron-remove-subject"
            data-remove-subject="${index}"
            title="Remove Subject"
        >
            ✖
        </button>

    </div>


    <div class="aeron-mark-grid">

        <div class="aeron-mark-box">

            <label>
                Theory
            </label>

            <small>
                70 में से
            </small>

            <input
                type="number"
                min="0"
                max="70"
                value="${item.theoryMarks}"
                data-mark-index="${index}"
                data-mark-type="theory"
            >

        </div>


        <div class="aeron-mark-box">

            <label>
                Practical
            </label>

            <small>
                30 में से
            </small>

            <input
                type="number"
                min="0"
                max="30"
                value="${item.practicalMarks}"
                data-mark-index="${index}"
                data-mark-type="practical"
            >

        </div>


        <div class="aeron-mark-box">

            <label>
                Total
            </label>

            <small>
                100 में से
            </small>

            <div class="aeron-subject-total">

                ${total}

            </div>

        </div>

    </div>

</div>

`;

                    }
                )
                .join("");


        box
            .querySelectorAll(
                "[data-remove-subject]"
            )
            .forEach(
                function (button) {

                    button.onclick =
                        function () {

                            removeSelectedSubject(
                                Number(
                                    button.dataset
                                        .removeSubject
                                )
                            );

                        };

                }
            );


        box
            .querySelectorAll(
                "[data-mark-index]"
            )
            .forEach(
                function (input) {

                    input.onchange =
                        function () {

                            updateSubjectMark(
                                Number(
                                    input.dataset
                                        .markIndex
                                ),
                                input.dataset
                                    .markType,
                                input.value
                            );

                        };

                }
            );


        updateSummary();

    }


    /* ========================================================
       SUMMARY
    ======================================================== */

    function updateSummary() {

        let theory =
            0;

        let practical =
            0;


        AERON_SELECTED_RESULT_SUBJECTS
            .forEach(
                function (item) {

                    theory +=
                        Number(
                            item.theoryMarks
                        ) || 0;


                    practical +=
                        Number(
                            item.practicalMarks
                        ) || 0;

                }
            );


        const subjectCount =
            AERON_SELECTED_RESULT_SUBJECTS.length;


        const theoryMax =
            subjectCount *
            THEORY_MAX;


        const practicalMax =
            subjectCount *
            PRACTICAL_MAX;


        const grandMax =
            theoryMax +
            practicalMax;


        const grand =
            theory +
            practical;


        const percentage =
            grandMax > 0
                ? (
                    grand /
                    grandMax *
                    100
                )
                    .toFixed(2)
                : "0.00";


        const grade =
            getGrade(
                Number(
                    percentage
                )
            );


        const result =
            Number(
                percentage
            ) >= 33
                ? "PASS"
                : "FAIL";


        setText(
            "aeronFinalTheory",
            theory +
            " / " +
            theoryMax
        );


        setText(
            "aeronFinalPractical",
            practical +
            " / " +
            practicalMax
        );


        setText(
            "aeronFinalGrand",
            grand +
            " / " +
            grandMax
        );


        setText(
            "aeronFinalPercentage",
            percentage +
            "%"
        );


        setText(
            "aeronFinalGrade",
            subjectCount
                ? grade
                : "-"
        );


        setText(
            "aeronFinalStatus",
            subjectCount
                ? result
                : "-"
        );

    }


    /* ========================================================
       GRADE
    ======================================================== */

    function getGrade(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 33) return "D";
    return "F";
    }


    /* ========================================================
       RESET SUMMARY
    ======================================================== */

    function resetSummary() {

        setText(
            "aeronFinalTheory",
            "0 / 0"
        );

        setText(
            "aeronFinalPractical",
            "0 / 0"
        );

        setText(
            "aeronFinalGrand",
            "0 / 0"
        );

        setText(
            "aeronFinalPercentage",
            "0%"
        );

        setText(
            "aeronFinalGrade",
            "-"
        );

        setText(
            "aeronFinalStatus",
            "-"
        );

    }

        /* ========================================================
       AERON EDIT SUMMARY
       Calculate summary from existing subjects
    ======================================================== */

    function updateAeronEditSummary() {

        let totalTheory = 0;
        let obtainedTheory = 0;

        let totalPractical = 0;
        let obtainedPractical = 0;


        AERON_SELECTED_RESULT_SUBJECTS
            .forEach(
                function (subject) {

                    const maxTheory =
                        Number(
                            subject.maxTheoryMarks ??
                            THEORY_MAX
                        );

                    const theory =
                        Number(
                            subject.theoryMarks
                        ) || 0;

                    const maxPractical =
                        Number(
                            subject.maxPracticalMarks ??
                            PRACTICAL_MAX
                        );

                    const practical =
                        Number(
                            subject.practicalMarks
                        ) || 0;


                    totalTheory +=
                        maxTheory;

                    obtainedTheory +=
                        theory;


                    totalPractical +=
                        maxPractical;

                    obtainedPractical +=
                        practical;

                }
            );


        const totalMarks =
            totalTheory +
            totalPractical;


        const obtainedMarks =
            obtainedTheory +
            obtainedPractical;


        const percentage =
            totalMarks > 0
                ? Number(
                    (
                        obtainedMarks /
                        totalMarks *
                        100
                    ).toFixed(2)
                )
                : 0;


        let grade = "F";


        if (percentage >= 90) {

            grade = "A+";

        }
        else if (percentage >= 80) {

            grade = "A";

        }
        else if (percentage >= 70) {

            grade = "B+";

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


        const result =
            percentage >= 33
                ? "PASS"
                : "FAIL";


        setText(
            "aeronFinalTheory",
            obtainedTheory +
            " / " +
            totalTheory
        );


        setText(
            "aeronFinalPractical",
            obtainedPractical +
            " / " +
            totalPractical
        );


        setText(
            "aeronFinalGrand",
            obtainedMarks +
            " / " +
            totalMarks
        );


        setText(
            "aeronFinalPercentage",
            percentage +
            "%"
        );


        setText(
            "aeronFinalGrade",
            grade
        );


        setText(
            "aeronFinalStatus",
            result
        );

    }


    /* ========================================================
       TEXT HELPER
    ======================================================== */

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.textContent =
                value;

        }

    }


    /* ========================================================
       VALIDATION
    ======================================================== */

    function showValidation(
        message
    ) {

        const box =
            document.getElementById(
                "aeronFinalValidation"
            );


        if (box) {

            box.textContent =
                message;

        }

    }


    function clearValidation() {

        showValidation("");

    }


    /* ========================================================
       CLOSE
    ======================================================== */

    window.closeSubjectWiseResultEntry =
        function () {

        const wrapper =
            document.getElementById(
                "aeronFinalResultEntry"
            );


        if (wrapper) {

            wrapper.style.display =
                "none";

        }


        AERON_RESULT_STUDENT =
            null;


        AERON_SELECTED_RESULT_SUBJECTS =
            [];

    };
/* ========================================================
       SAVE RESULT SUBJECTS
       CENTRAL GOOGLE APPS SCRIPT
    ======================================================== */

    window.saveSubjectWiseResult =
        async function () {

        clearValidation();


        if (!AERON_RESULT_STUDENT) {

            showValidation(
                "❌ Student not selected."
            );

            return;

        }


        const examInput =
            document.getElementById(
                "aeronFinalExamName"
            );


        const examName =
            String(
                examInput &&
                examInput.value ||
                ""
            ).trim();


        if (!examName) {

            showValidation(
                "❌ Examination Name required."
            );

            examInput.focus();

            return;

        }


        if (
            AERON_SELECTED_RESULT_SUBJECTS.length === 0
        ) {

            showValidation(
                "❌ कम से कम एक subject select करें."
            );

            return;

        }


        for (
            let i = 0;
            i <
            AERON_SELECTED_RESULT_SUBJECTS.length;
            i++
        ) {

            const subject =
                AERON_SELECTED_RESULT_SUBJECTS[
                    i
                ];


            if (
                subject.theoryMarks < 0 ||
                subject.theoryMarks > THEORY_MAX
            ) {

                showValidation(
                    "❌ " +
                    subject.subjectName +
                    ": Theory marks 0–70 होने चाहिए."
                );

                return;

            }


            if (
                subject.practicalMarks < 0 ||
                subject.practicalMarks >
                PRACTICAL_MAX
            ) {

                showValidation(
                    "❌ " +
                    subject.subjectName +
                    ": Practical marks 0–30 होने चाहिए."
                );

                return;

            }

        }


        const saveButton =
            document.getElementById(
                "aeronFinalSaveBtn"
            );


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "⏳ Saving...";

        }


        try {

            /*
             * RESULT ID
             *
             * Existing result ID is preferred.
             * Otherwise generate one for this result.
             */

            const currentAeronEditResult =
    getAeronEditResult();

const existingResultId =
    currentAeronEditResult &&
    currentAeronEditResult.resultId
        ? String(
            currentAeronEditResult.resultId
        ).trim()
        : "";

const resultId =
    existingResultId ||
    (
        "SCR-" +
        String(
            AERON_RESULT_STUDENT.id ||
            "STUDENT"
        )
        .replace(
            /[^A-Za-z0-9]/g,
            ""
        )
        .toUpperCase() +
        "-" +
        Date.now()
    );

const resultAction =
    existingResultId
        ? "updateResult"
        : "createResult";

console.log(
    "🔎 AERON EDIT DEBUG:",
    {
        AERON_EDIT_RESULT: currentAeronEditResult,
        existingResultId: existingResultId,
        resultId: resultId,
        resultAction: resultAction
    }
);
          /* ==================================================
   CREATE RESULT SUMMARY
   CENTRAL RESULTS SHEET
================================================== */

let totalMarks = 0;
let obtainedMarks = 0;

for (
    let i = 0;
    i < AERON_SELECTED_RESULT_SUBJECTS.length;
    i++
) {
    const subject =
        AERON_SELECTED_RESULT_SUBJECTS[i];

    totalMarks +=
        THEORY_MAX +
        PRACTICAL_MAX;

    obtainedMarks +=
        (Number(subject.theoryMarks) || 0) +
        (Number(subject.practicalMarks) || 0);
}

const percentage =
    totalMarks > 0
        ? Number(
            (
                (obtainedMarks / totalMarks) *
                100
            ).toFixed(2)
        )
        : 0;

let grade = "F";

if (percentage >= 90) {
    grade = "A+";
}
else if (percentage >= 80) {
    grade = "A";
}
else if (percentage >= 70) {
    grade = "B+";
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

const result =
    percentage >= 33
        ? "PASS"
        : "FAIL";


const resultResponse =
    await centralRequest(
        resultAction,
        {
            method: "POST",

            body: {
                action: resultAction,

                resultId:
                    existingResultId,

                token:
                    sessionStorage.getItem(
                        "SURYA_ADMIN_TOKEN"
                    ),

                studentId:
                    AERON_RESULT_STUDENT.id,

                studentName:
                    AERON_RESULT_STUDENT.name,

                course:
                    AERON_RESULT_STUDENT.course,

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
                    "Draft"
            }
        }
    );


if (
    !resultResponse.success
) {
    throw new Error(
        resultResponse.message ||
        "Result summary could not be created."
    );
}

  /*
   * AERON CENTRAL RESULT ID
   * Use the ID returned by Central API.
   */
  
  const savedCentralResultId =
    String(
        resultResponse.result?.resultId ||
        resultResponse.resultId ||
        resultResponse.data?.resultId ||
        resultId ||
        ""
    ).trim();

  if (!savedCentralResultId) {
      throw new Error(
          "Central Result ID missing after result creation."
      );
  }



                        /*
             * SAVE / UPDATE EVERY SELECTED SUBJECT
             * CENTRAL RESULT SUBJECTS
             */

            const usedResultSubjectIds = new Set(
                Array.from(AERON_EXISTING_RESULT_SUBJECT_IDS)
                    .concat(
                        AERON_SELECTED_RESULT_SUBJECTS
                    .map(function(item){
                        return String(item.subjectId || "").trim().toUpperCase();
                    })
                    .filter(Boolean)
                    )
            );

            let nextSubjectNumber = 1;

            function getUniqueResultSubjectId() {
                let candidate = "";
                do {
                    candidate =
                        savedCentralResultId +
                        "-SUB-" +
                        String(nextSubjectNumber++).padStart(2, "0");
                } while (usedResultSubjectIds.has(candidate.toUpperCase()));

                usedResultSubjectIds.add(candidate.toUpperCase());
                return candidate;
            }

            for (
                let i = 0;
                i <
                AERON_SELECTED_RESULT_SUBJECTS.length;
                i++
            ) {

                const subject =
                    AERON_SELECTED_RESULT_SUBJECTS[i];


                const existingSubjectId =
                    String(
                        subject.subjectId || ""
                    ).trim();


                const subjectAction =
    existingSubjectId
        ? "updateResultSubject"
        : "saveResultSubject";


                const subjectBody = {

                    action:
                        subjectAction,

                    token:
                        sessionStorage.getItem(
                            "SURYA_ADMIN_TOKEN"
                        ),

                    resultId:
                        savedCentralResultId,

                    subjectId:
                        existingSubjectId ||
                        getUniqueResultSubjectId(),

                    maxTheoryMarks:
                        Number(
                            subject.maxTheoryMarks ??
                            THEORY_MAX
                        ),

                    theoryMarks:
                        Number(
                            subject.theoryMarks
                        ) || 0,

                    maxPracticalMarks:
                        Number(
                            subject.maxPracticalMarks ??
                            PRACTICAL_MAX
                        ),

                    practicalMarks:
                        Number(
                            subject.practicalMarks
                        ) || 0,

                    status:
                        "Draft"

                };


                /*
                 * New subject needs student/name.
                 * Existing subject only needs Result ID + Subject ID.
                 */

                if (
                    subjectAction ===
                    "saveResultSubject"
                ) {

                    subjectBody.studentId =
                        AERON_RESULT_STUDENT.id;

                    subjectBody.subjectName =
                        subject.subjectName || "";

                }


                const subjectResponse =
                    await centralRequest(
                        subjectAction,
                        {
                            method:
                                "POST",

                            body:
                                subjectBody
                        }
                    );


                if (
                    !subjectResponse ||
                    !subjectResponse.success
                ) {

                    throw new Error(
                        subjectResponse &&
                        subjectResponse.message
                            ? subjectResponse.message
                            :
                            (
                                subjectAction ===
                                "updateResultSubject"
                                    ?
                                "Subject could not be updated: "
                                    :
                                "Subject could not be saved: "
                            ) +
                            subject.subjectName
                    );

                }

            }

            /*
             * Edit reconciliation:
             * subjects removed from the editor are disabled centrally,
             * never physically deleted.
             */
            const selectedIdsAfterSave = new Set(
                AERON_SELECTED_RESULT_SUBJECTS
                    .map(function(item){
                        return String(item.subjectId || "").trim().toUpperCase();
                    })
                    .filter(Boolean)
            );

            for (const oldSubjectId of Array.from(AERON_EXISTING_RESULT_SUBJECT_IDS)) {
                if (selectedIdsAfterSave.has(oldSubjectId)) continue;

                const disableResponse = await centralRequest(
                    "disableResultSubject",
                    {
                        method:"POST",
                        body:{
                            action:"disableResultSubject",
                            resultId:savedCentralResultId,
                            subjectId:oldSubjectId,
                            token:sessionStorage.getItem("SURYA_ADMIN_TOKEN")
                        }
                    }
                );

                if (!disableResponse || !disableResponse.success) {
                    throw new Error(
                        disableResponse && disableResponse.message
                            ? disableResponse.message
                            : "Removed Result Subject could not be disabled."
                    );
                }
            }


            showValidation(
                "✅ Result subjects saved successfully to Central Database."
            );


            alert(
                "✅ Result saved successfully!\n\n" +
                "Result ID: " +
                savedCentralResultId
            );


            /*
             * CLOSE ENTRY
             */

            closeSubjectWiseResultEntry();


            /*
             * REFRESH RESULT DASHBOARD
             * IF EXISTING FUNCTION AVAILABLE
             */

            if (
                typeof AERON_RESULT_RENDER ===
                "function"
            ) {

                AERON_RESULT_RENDER(
                    "create"
                );

            }

        } catch (error) {

            console.error(
                "AERON CENTRAL RESULT SAVE ERROR:",
                error
            );


            showValidation(
                "❌ Result save failed: " +
                error.message
            );


            alert(
                "❌ Result could not be saved.\n\n" +
                error.message
            );

        } finally {

            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "💾 Save Result";

            }

        }

    };


    /* ========================================================
       INITIALIZE
    ======================================================== */

    function initAeronFinalResultSystem() {

        createAeronResultUI();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initAeronFinalResultSystem
        );

    } else {

        initAeronFinalResultSystem();

    }

     
})();



  })();
