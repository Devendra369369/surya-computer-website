/* ==================================================
   ADMISSION MANAGEMENT
================================================== */

let currentApplication = null;

const SURYA_DATABASE_API =
    "https://script.google.com/macros/s/AKfycbziAiwAq8nTE-65FVdy8LbmQFBbLVoeukklrOK4uFAgNKZyyjY5bMBJSuOPTBgY5bVufw/exec";

  /* ==================================================
   INDIAN DATE / TIME FORMAT
================================================== */

function formatIndianDateTime(value) {

    if (!value) {
        return "N/A";
    }

    const text = String(value).trim();

    // Already Indian formatted date/time
    if (
        /^\d{2}\/\d{2}\/\d{4}/.test(text)
    ) {
        return text;
    }

    const date = new Date(text);

    if (isNaN(date.getTime())) {
        return text;
    }

    return date.toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    );
}


/* ==================================================
   INDIAN DOB FORMAT
================================================== */

function formatIndianDOB(value) {

    if (!value) {
        return "N/A";
    }

    const text = String(value).trim();

    // YYYY-MM-DD
    const simpleDate =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

    if (simpleDate) {

        return (
            simpleDate[3] +
            "/" +
            simpleDate[2] +
            "/" +
            simpleDate[1]
        );

    }

    const date =
        new Date(text);

    if (isNaN(date.getTime())) {
        return text;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}
  let allAdmissions = [];
let admissionFilter = "all";
let admissionSearchTerm = "";

/* ==================================================
   LOAD APPLICATIONS
================================================== */

async function loadApplications() {

    const applicationList =
        document.getElementById(
            "applicationList"
        );


    const noApplications =
        document.getElementById(
            "noApplications"
        );


    applicationList.innerHTML = "";


    try {

        /* =========================================
           LOAD FROM GOOGLE CENTRAL DATABASE
        ========================================= */
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


const response =
    await fetch(
        SURYA_DATABASE_API +
        "?action=applications&token=" +
        encodeURIComponent(
            adminToken
        )
    );
        
        

        if (!response.ok) {

            throw new Error(
                "Google Database request failed."
            );

        }


        const result =
            await response.json();


        if (
            !result.success ||
            !Array.isArray(
                result.applications
            )
        ) {

            throw new Error(
                "Invalid applications response."
            );

        }


        /* =========================================
           CONVERT GOOGLE RECORDS
           TO ADMIN APPLICATION FORMAT
        ========================================= */

        const admissions =
            result.applications.map(
                function(record) {

                    return {

                        id:
                            record["Application ID"] || "",

                        studentName:
                            record["Student Name"] || "",

                        fatherName:
                            record["Father Name"] || "",

                        motherName:
                            record["Mother Name"] || "",

                        dateOfBirth:
                          formatIndianDOB(
                             record["Date of Birth"] || ""
                           ),

                        course:
                            record["Course"] || "",

                        mobile:
                            record["Mobile"] || "",

                        email:
                            record["Email"] || "",

                        address:
                            record["Address"] || "",

                        photo:
                            record["Photo"] || "",

                        photoName:
                            record["Photo Name"] || "",

                        signature:
                            record["Signature"] || "",

                        marcsheet:
                            record["Marcsheet"] || "",

                        aadhaarUploaded:
                            record["Aadhaar Uploaded"] || "",

                        aadhaarMode:
                            record["Aadhaar Mode"] || "",

                        aadhaarName:
                            record["Aadhaar Name"] || "",

                        aadhaarFrontName:
                            record["Aadhaar Front Name"] || "",

                        aadhaarBackName:
                            record["Aadhaar Back Name"] || "",

                        aadhaarBackUploaded:
                            record["Aadhaar Back Uploaded"] || "",

                        applicationDate:
                          formatIndianDateTime(
                            record["Application Date"] || ""
                          ),

                        status:
                            record["Status"] || "Pending",

                        aadhaarFrontUrl:
                            record["Aadhaar Front URL"] || "",

                        aadhaarBackUrl:
                            record["Aadhaar Back URL"] || ""

                    };

                }
            );


        allAdmissions = admissions;

        /* =========================================
           SAVE FRESH GOOGLE DATA LOCALLY
        ========================================= */

        updateSuryaModule(
            "admissions",
            admissions
        );


        /* =========================================
           EMPTY CHECK
        ========================================= */

        if (
            admissions.length === 0
        ) {

            noApplications.style.display =
                "block";

            updateAdmissionCounts(
                admissions
            );

            return;

        }


        noApplications.style.display =
            "none";


        /* =========================================
           DISPLAY APPLICATIONS
        ========================================= */

        renderAdmissionApplications();


        updateAdmissionCounts(
            admissions
        );

    }


    catch (error) {

        console.error(
            "LOAD APPLICATIONS ERROR:",
            error
        );


        noApplications.style.display =
            "block";


        noApplications.innerHTML = `
            ❌ Failed to load applications.
            <br>
            <small>
                ${error.message}
            </small>
        `;

    }

}


function renderAdmissionApplications() {

    const applicationList =
        document.getElementById("applicationList");

    if (!applicationList) return;

    applicationList.innerHTML = "";

    const term = admissionSearchTerm.trim().toLowerCase();

    const filtered = allAdmissions.filter(function(application) {

        const status = String(application.status || "Pending");

        if (admissionFilter !== "all" && status.toLowerCase() !== admissionFilter.toLowerCase()) {
            return false;
        }

        if (!term) return true;

        const haystack = [
            application.id,
            application.studentId,
            application.studentName,
            application.mobile,
            application.course,
            application.email
        ].join(" ").toLowerCase();

        return haystack.includes(term);
    });

    const noApplications = document.getElementById("noApplications");

    if (!filtered.length) {
        if (noApplications) {
            noApplications.style.display = "block";
            noApplications.textContent = "❌ No matching applications found.";
        }
        return;
    }

    if (noApplications) noApplications.style.display = "none";

    filtered.forEach(function(application) {
        displayApplication(application);
    });
}

function setAdmissionFilter(filter) {
    admissionFilter = filter || "all";
    document.querySelectorAll(".admission-filter-btn").forEach(function(btn) {
        btn.classList.toggle("active", (btn.dataset.admissionFilter || "all") === admissionFilter);
    });
    renderAdmissionApplications();
}

function updateAdmissionFilterCounts(admissions) {
    const total = admissions.length;
    const pending = admissions.filter(a => String(a.status || "").toLowerCase() === "pending").length;
    const approved = admissions.filter(a => String(a.status || "").toLowerCase() === "approved").length;
    const rejected = admissions.filter(a => String(a.status || "").toLowerCase() === "rejected").length;
    const set = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
    set("filterTotalCount", total);
    set("filterPendingCount", pending);
    set("filterApprovedCount", approved);
    set("filterRejectedCount", rejected);
}

/* ==================================================
   DISPLAY APPLICATION
================================================== */

function displayApplication(application) {

    const applicationList =
        document.getElementById(
            "applicationList"
        );


    const card =
        document.createElement("div");


    card.className =
        "application-card";


    let statusClass =
        "status-pending";


    if (
        application.status ===
        "Approved"
    ) {

        statusClass =
            "status-approved";

    }


    if (
        application.status ===
        "Rejected"
    ) {

        statusClass =
            "status-rejected";

    }


    /* ==================================================
   STUDENT PHOTO
================================================== */

const photoHTML = `
            <div
            class="application-photo"
            style="
                text-align:center;
                margin-bottom:15px;
            "
        >
            <div
                class="student-photo-container"
                style="
                    width:120px;
                    height:150px;
                    margin:0 auto 8px ;
                    border:2px solid #ddd;
                    border-radius:8px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#f5f5f5;
                    overflow:hidden;
                    box-sizing:border-box;
                    padding:0;
                "
            >
                ⏳
            </div>

            <strong>
                Student Photo
            </strong>
        </div>
`;


    card.innerHTML = `

        <div class="application-top">

            <h3>
                ${application.id}
            </h3>

            <span
                class="${statusClass}"
            >
                ${application.status}
            </span>

        </div>

            ${photoHTML}


        <div class="application-details">

            <p>
                <strong>Student Name:</strong>
                ${application.studentName}
            </p>

            <p>
                <strong>Father's Name:</strong>
                ${application.fatherName}
            </p>

            <p>
                <strong>Course:</strong>
                ${application.course}
            </p>

            <p>
                <strong>Mobile:</strong>
                ${application.mobile}
            </p>

            <p>
                <strong>Application Date:</strong>
                ${application.applicationDate || "N/A"}
            </p>


            ${
                application.admissionId
                ?
                `
                <p>
                    <strong>Admission ID:</strong>
                    ${application.admissionId}
                </p>
                `
                :
                ""
            }


            ${
                application.studentId
                ?
                `
                <p>
                    <strong>Student ID:</strong>
                    ${application.studentId}
                </p>
                `
                :
                ""
            }

        </div>


        <div class="application-actions">

            <button
                class="view-btn"
                type="button"
                onclick="viewApplication('${application.id}')"
            >
                👁️ View Details
            </button>

            <button
              class="view-btn"
              type="button"
              onclick="viewDocuments('${application.id}')"
          >
              📄 View Documents
            </button>
          

            <button
                class="approve-btn"
                type="button"
                onclick="approveApplication('${application.id}')"
                ${application.status !== "Pending" ? "disabled" : ""}
            >
                ✅ Approve
            </button>


            <button
                class="reject-btn"
                type="button"
                onclick="rejectApplication('${application.id}')"
                ${application.status !== "Pending" ? "disabled" : ""}
            >
                ❌ Reject
            </button>

        </div>

    `;


    applicationList.appendChild(
        card
    );
  
loadPrivateStudentPhoto(
    application,
    card
);
}
  /* ==================================================
   LOAD PRIVATE STUDENT PHOTO
================================================== */

async function loadPrivateStudentPhoto(
    application,
    card
) {

    try {

        if (!application.photo) {
            return;
        }


        /* =========================================
           EXTRACT GOOGLE DRIVE FILE ID
        ========================================= */

        const photoUrl =
            String(application.photo || "");

        const match =
            photoUrl.match(
                /[?&]id=([^&]+)/
            ) ||
            photoUrl.match(
                /\/file\/d\/([^/]+)/
            );


        if (!match) {

            console.error(
                "PHOTO FILE ID NOT FOUND:",
                application.photo
            );

            return;
        }


        const fileId =
            match[1];


        /* =========================================
           ADMIN TOKEN
        ========================================= */

        const adminToken =
            sessionStorage.getItem(
                "SURYA_ADMIN_TOKEN"
            );


        if (!adminToken) {

            console.error(
                "ADMIN TOKEN NOT FOUND"
            );

            return;
        }


        /* =========================================
           REQUEST PRIVATE PHOTO
        ========================================= */

        const response =
            await fetch(
                SURYA_DATABASE_API +
                "?action=studentPhoto" +
                "&id=" +
                encodeURIComponent(fileId) +
                "&token=" +
                encodeURIComponent(adminToken)
            );


        const result =
            await response.json();

        console.log("PHOTO API DEBUG:", {
            fileId: fileId,
            hasToken: !!adminToken,
            success: result.success,
            mimeType: result.mimeType,
            hasData: !!result.data,
            message: result.message
        });


        if (
            !result.success ||
            !result.data
        ) {

            console.error(
                "PRIVATE PHOTO LOAD FAILED:",
                result.message
            );

            return;
        }


        /* =========================================
           CREATE IMAGE
        ========================================= */

        const photoContainer =
            card.querySelector(
                ".student-photo-container"
            );


        if (!photoContainer) {

            console.error(
                "PHOTO CONTAINER NOT FOUND"
            );

            return;
        }


        const img =
            document.createElement("img");


        img.src =
            "data:" +
            result.mimeType +
            ";base64," +
            result.data;


        img.alt =
            "Student Photo";


        img.style.setProperty("width", "120px", "important");
img.style.setProperty("height", "150px", "important");

img.style.setProperty("min-width", "120px", "important");
img.style.setProperty("min-height", "150px", "important");

img.style.setProperty("max-width", "120px", "important");
img.style.setProperty("max-height", "150px", "important");

img.style.setProperty("flex", "0 0 120px", "important");
img.style.setProperty("flex-shrink", "0", "important");
img.style.setProperty("flex-grow", "0", "important");

img.style.setProperty("object-fit", "fill", "important");
img.style.setProperty("object-position", "center", "important");

img.style.setProperty("display", "block", "important");
img.style.setProperty("margin", "0", "important");
img.style.setProperty("padding", "0", "important");
img.style.setProperty("box-sizing", "border-box", "important");
      img.style.position = "relative";
img.style.left = "28px";
      
        /* =========================================
           REPLACE OLD PHOTO CONTENT
        ========================================= */

        photoContainer.innerHTML = "";


        photoContainer.appendChild(
            img
        );


        const label =
            document.createElement(
                "strong"
            );


        label.textContent =
            "Student Photo";


        photoContainer.appendChild(
            label
        );

    }

    catch (error) {

        console.error(
            "PRIVATE STUDENT PHOTO ERROR:",
            error
        );

    }

              }


    

/* ==================================================
   LOAD PRIVATE VIEW PHOTO
================================================== */

async function loadPrivateViewPhoto(
    application,
    modal
) {

    try {

        if (!application.photo) {
            return;
        }


        /* =========================================
           EXTRACT GOOGLE DRIVE FILE ID
        ========================================= */

        const photoUrl =
            String(application.photo || "");

        const match =
            photoUrl.match(
                /[?&]id=([^&]+)/
            ) ||
            photoUrl.match(
                /\/file\/d\/([^/]+)/
            );


        if (!match) {

            console.error(
                "VIEW PHOTO FILE ID NOT FOUND:",
                application.photo
            );

            return;
        }


        const fileId =
            match[1];


        /* =========================================
           ADMIN TOKEN
        ========================================= */

        const adminToken =
            sessionStorage.getItem(
                "SURYA_ADMIN_TOKEN"
            );


        if (!adminToken) {

            console.error(
                "ADMIN TOKEN NOT FOUND"
            );

            return;
        }


        /* =========================================
           REQUEST PRIVATE PHOTO
        ========================================= */

        const response =
            await fetch(
                SURYA_DATABASE_API +
                "?action=studentPhoto" +
                "&id=" +
                encodeURIComponent(fileId) +
                "&token=" +
                encodeURIComponent(adminToken)
            );


        const result =
            await response.json();

        console.log("PHOTO API DEBUG:", {
            fileId: fileId,
            hasToken: !!adminToken,
            success: result.success,
            mimeType: result.mimeType,
            hasData: !!result.data,
            message: result.message
        });


        if (
            !result.success ||
            !result.data
        ) {

            console.error(
                "VIEW PHOTO LOAD FAILED:",
                result.message
            );

            return;
        }


        /* =========================================
           FIND VIEW PHOTO CONTAINER
        ========================================= */

        const photoContainer =
            modal.querySelector(
                "#view-student-photo"
            );


        if (!photoContainer) {

            console.error(
                "VIEW PHOTO CONTAINER NOT FOUND"
            );

            return;
        }


        /* =========================================
           CREATE IMAGE
        ========================================= */

        const img =
            document.createElement("img");


        img.src =
            "data:" +
            result.mimeType +
            ";base64," +
            result.data;


        img.alt =
            "Student Photo";


        img.style.width =
            "120px";


        img.style.height =
            "150px";


        img.style.objectFit =
            "fill";


        img.style.display =
            "block";


        img.style.margin =
            "0";


        img.style.padding =
            "0";


        img.style.boxSizing =
            "border-box";


        /* =========================================
           REPLACE LOADING CONTENT
        ========================================= */

        photoContainer.innerHTML = "";


        photoContainer.appendChild(
            img
        );

    }

    catch (error) {

        console.error(
            "PRIVATE VIEW PHOTO ERROR:",
            error
        );

    }

}
/* ==================================================
   ADMISSION COUNTS
================================================== */

function updateAdmissionCounts(
    admissions
) {

    updateAdmissionFilterCounts(admissions);

    const total =
        admissions.length;


    const pending =
        admissions.filter(
            function(application) {

                return (
                    application.status ===
                    "Pending"
                );

            }
        ).length;


    const approved =
        admissions.filter(
            function(application) {

                return (
                    application.status ===
                    "Approved"
                );

            }
        ).length;


    const rejected =
        admissions.filter(
            function(application) {

                return (
                    application.status ===
                    "Rejected"
                );

            }
        ).length;


    const totalElement =
        document.getElementById(
            "totalApplications"
        );

    const pendingElement =
        document.getElementById(
            "pendingApplications"
        );

    const approvedElement =
        document.getElementById(
            "approvedApplications"
        );

    const rejectedElement =
        document.getElementById(
            "rejectedApplications"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (pendingElement) {

        pendingElement.textContent =
            pending;

    }


    if (approvedElement) {

        approvedElement.textContent =
            approved;

    }


    if (rejectedElement) {

        rejectedElement.textContent =
            rejected;

    }

}


/* ==================================================
   FIND APPLICATION
================================================== */

function findApplication(
    applicationId
) {

    const admissions =
        getSuryaModule("admissions");


    const application =
        admissions.find(
            function(application) {

                return (
                    String(application.id || "")
                        .trim()
                    ===
                    String(applicationId || "")
                        .trim()
                );

            }
        );


    if (!application) {

        return null;

    }


    /* ==================================================
       GOOGLE DATABASE DOCUMENT URL MAPPING
    ================================================== */

    application.aadhaarFrontUrl =
        application.aadhaarFrontUrl ||
        application["Aadhaar Front URL"] ||
        "";

    
    application.aadhaarBackUrl =
        application.aadhaarBackUrl ||
        application["Aadhaar Back URL"] ||
        "";


    application.photo =
        application.photo ||
        application["Photo"] ||
        "";


    application.signature =
        application.signature ||
        application["Signature"] ||
        "";


    application.marcsheet =
        application.marcsheet ||
        application["Marcsheet"] ||
        "";


    return application;

}


/* ==================================================
   APPROVE APPLICATION — CENTRAL DATABASE
================================================== */

async function approveApplication(
    applicationId
) {

    if (!applicationId) {

        alert(
            "Application ID is required."
        );

        return;
    }


    const adminToken =
        sessionStorage.getItem(
            "SURYA_ADMIN_TOKEN"
        );


    if (!adminToken) {

        alert(
            "Admin session expired. Please login again."
        );

        window.location.replace(
            "admin-login.html"
        );

        return;
    }


    /* =========================================
       CONFIRM APPROVAL
    ========================================= */

    const confirmed =
        confirm(
            "Approve this application?\n\n" +
            "Application ID: " +
            applicationId
        );


    if (!confirmed) {

        return;
    }


    try {

        /* =========================================
           SEND APPROVAL TO GOOGLE CENTRAL DATABASE
        ========================================= */

        const response =
            await fetch(
                SURYA_DATABASE_API +
                "?action=approveApplication" +
                "&token=" +
                encodeURIComponent(
                    adminToken
                ),
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=UTF-8"
                    },

                    body: JSON.stringify({

                        action:
                            "approveApplication",

                        applicationId:
                            applicationId,

                        token:
                            adminToken

                    })

                }
            );


        const result =
            await response.json();


        console.log(
            "APPROVAL API RESULT:",
            result
        );


        /* =========================================
           API ERROR
        ========================================= */

        if (!result.success) {

            alert(
                "❌ Approval failed.\n\n" +
                (
                    result.message ||
                    "Unknown error."
                )
            );

            return;
        }


        /* =========================================
           SUCCESS
        ========================================= */

        alert(

            "✅ Application Approved!\n\n" +

            "Admission ID: " +
            (
                result.admissionId ||
                "N/A"
            ) +

            "\n\nStudent ID: " +
            (
                result.studentId ||
                "N/A"
            ) +

            "\n\nStudent Record Created Successfully."

        );


        /* =========================================
           RELOAD FROM GOOGLE DATABASE
        ========================================= */

        await loadApplications();


    }

    catch (error) {

        console.error(
            "APPROVAL API ERROR:",
            error
        );


        alert(
            "❌ Approval request failed.\n\n" +
            (
                error.message ||
                String(error)
            )
        );

    }

}

/* ==================================================
   REJECT APPLICATION
================================================== */

function rejectApplication(
    applicationId
) {

    const admissions =
        getSuryaModule("admissions");


    const application =
        admissions.find(
            function(app) {

                return (
                    app.id ===
                    applicationId
                );

            }
        );


    if (!application) {

        alert(
            "Application record not found."
        );

        return;
    }


    if (
        application.status !==
        "Pending"
    ) {

        alert(
            "This application has already been processed."
        );

        return;
    }


    application.status =
        "Rejected";


    updateSuryaModule(
        "admissions",
        admissions
    );


    loadApplications();


    alert(
        "❌ Application Rejected."
    );

}


/* ==================================================
   VIEW APPLICATION
================================================== */

function viewApplication(applicationId) {

    const application =
        findApplication(
            applicationId
        );


    if (!application) {

        alert(
            "Application record not found."
        );

        return;
    }


    /* ==================================================
   PHOTO
================================================== */

const photoHTML = `
    <div
        id="view-student-photo"
        class="student-photo-container"
        style="
            width:120px;
            height:150px;
            margin:0 auto 15px;
            border:2px solid #ddd;
            border-radius:8px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#f5f5f5;
            overflow:hidden;
            box-sizing:border-box;
        "
    >
        ⏳
    </div>
`;

    /* ==================================================
       CREATE VIEW MODAL
    ================================================== */

    const modal =
        document.createElement("div");


    modal.id =
        "applicationViewModal";


    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.65);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        z-index:9999;
    `;


    modal.innerHTML = `

        <div
            style="
                background:#fff;
                width:100%;
                max-width:450px;
                max-height:90vh;
                overflow-y:auto;
                border-radius:12px;
                padding:20px;
                box-sizing:border-box;
                position:relative;
            "
        >

            <button
                type="button"
                onclick="closeApplicationView()"
                style="
                    position:absolute;
                    right:12px;
                    top:10px;
                    border:none;
                    background:#1565c0 !important;
                    color:#ffffff !important;
                    background:none;
                    font-size:25px;
                    cursor:pointer;
                "
            >
                ✖️
            </button>


            <h2
                style="
                    text-align:center;
                    margin-top:5px;
                "
            >
                📋 Application Details
            </h2>


            ${photoHTML}


            <p>
                <strong>Application ID:</strong>
                ${application.id}
            </p>


            <p>
                <strong>Student Name:</strong>
                ${application.studentName}
            </p>


            <p>
                <strong>Father's Name:</strong>
                ${application.fatherName}
            </p>


            <p>
                <strong>Mother's Name:</strong>
                ${application.motherName || "N/A"}
            </p>


            <p>
                <strong>Date of Birth:</strong>
                ${application.dateOfBirth || "N/A"}
            </p>


            <p>
                <strong>Course:</strong>
                ${application.course}
            </p>


            <p>
                <strong>Mobile:</strong>
                ${application.mobile}
            </p>


            <p>
                <strong>Email:</strong>
                ${application.email || "N/A"}
            </p>


            <p>
                <strong>Address:</strong>
                ${application.address || "N/A"}
            </p>


            <p>
                <strong>Application Date:</strong>
                ${application.applicationDate || "N/A"}
            </p>


            <p>
                <strong>Status:</strong>
                ${application.status}
            </p>


            ${
                application.admissionId
                ?
                `
                <p>
                    <strong>Admission ID:</strong>
                    ${application.admissionId}
                </p>
                `
                :
                ""
            }


            ${
                application.studentId
                ?
                `
                <p>
                    <strong>Student ID:</strong>
                    ${application.studentId}
                </p>
                `
                :
                ""
            }


            <button
                type="button"
                onclick="closeApplicationView()"
                style="
                    width:100%;
                    padding:12px;
                    margin-top:10px;
                    border:none;
                    background:#1565c0 !important;
                    color:#ffffff !important;
                    border-radius:6px;
                    cursor:pointer;
                "
            >
                Close
            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );
  /* ==================================================
   LOAD PRIVATE VIEW PHOTO
================================================== */

loadPrivateViewPhoto(
    application,
    modal
);


    /* ==================================================
       CLOSE WHEN CLICKING OUTSIDE
    ================================================== */

    modal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                modal
            ) {

                closeApplicationView();

            }

        }
    );

}


/* ==================================================
   CLOSE APPLICATION VIEW
================================================== */

function closeApplicationView() {

    const modal =
        document.getElementById(
            "applicationViewModal"
        );


    if (modal) {

        modal.remove();

    }

}

/* ==================================================
   VIEW DOCUMENTS
================================================== */

function viewDocuments(applicationId) {

    const application =
        findApplication(
            applicationId
        );


    if (!application) {

        alert(
            "Application record not found."
        );

        return;
    }


    /* ==================================================
       DOCUMENT URLS
    ================================================== */

    const photoUrl =
        application.photo || "";

    const signatureUrl =
        application.signature || "";

    const marksheetUrl =
        application.marcsheet || "";

    const aadhaarFrontUrl =
        application.aadhaarFrontUrl || "";

    const aadhaarBackUrl =
        application.aadhaarBackUrl || "";


    /* ==================================================
       DOCUMENT CARD
    ================================================== */

    function documentCard(
        title,
        url,
        type
    ) {

        if (!url) {

            return `
                <div
                    style="
                        border:1px solid #ddd;
                        border-radius:8px;
                        padding:12px;
                        margin-bottom:12px;
                        background:#f8f8f8;
                    "
                >
                    <strong>${title}</strong>

                    <p
                        style="
                            margin:8px 0 0;
                            color:#888;
                        "
                    >
                        ❌ Document URL not available
                    </p>
                </div>
            `;

        }


        if (type === "image") {

            return `
                <div
                    style="
                        border:1px solid #ddd;
                        border-radius:8px;
                        padding:12px;
                        margin-bottom:12px;
                    "
                >

                    <strong>${title}</strong>

                    <img
                        src="${url}"
                        alt="${title}"
                        style="
                            display:block;
                            width:100%;
                            max-height:300px;
                            object-fit:contain;
                            margin-top:10px;
                            border:1px solid #ddd;
                            border-radius:6px;
                        "
                    >

                    <a
                        href="${url}"
                        target="_blank"
                        rel="noopener"
                        style="
                            display:block;
                            margin-top:10px;
                            text-align:center;
                            padding:9px;
                            background:#1565c0;
                            color:#fff;
                            text-decoration:none;
                            border-radius:6px;
                        "
                    >
                        🔗 Open Document
                    </a>

                </div>
            `;

        }


        return `
            <div
                style="
                    border:1px solid #ddd;
                    border-radius:8px;
                    padding:12px;
                    margin-bottom:12px;
                "
            >

                <strong>${title}</strong>

                <a
                    href="${url}"
                    target="_blank"
                    rel="noopener"
                    style="
                        display:block;
                        margin-top:10px;
                        text-align:center;
                        padding:9px;
                        background:#1565c0;
                        color:#fff;
                        text-decoration:none;
                        border-radius:6px;
                    "
                >
                    📄 Open Document
                </a>

            </div>
        `;

    }


    /* ==================================================
       CREATE DOCUMENT MODAL
    ================================================== */

    const modal =
        document.createElement("div");


    modal.id =
        "applicationDocumentsModal";


    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.65);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        z-index:10000;
    `;


    modal.innerHTML = `

        <div
            style="
                background:#fff;
                width:100%;
                max-width:500px;
                max-height:90vh;
                overflow-y:auto;
                border-radius:12px;
                padding:20px;
                box-sizing:border-box;
                position:relative;
            "
        >

            <button
                type="button"
                onclick="closeDocumentsView()"
                style="
                    position:absolute;
                    right:12px;
                    top:10px;
                    border:none;
                    background:#1565c0 !important;
                    color:#fff !important;
                    font-size:22px;
                    cursor:pointer;
                    border-radius:4px;
                "
            >
                ✖️
            </button>


            <h2
                style="
                    text-align:center;
                    margin-top:5px;
                "
            >
                📄 Student Documents
            </h2>


            <p
                style="
                    text-align:center;
                    color:#666;
                "
            >
                Application ID:
                <strong>
                    ${application.id}
                </strong>
            </p>


            ${documentCard(
                "📸 Student Photo",
                photoUrl,
                "image"
            )}


            ${documentCard(
                "✍️ Signature",
                signatureUrl,
                "image"
            )}


            ${documentCard(
                "📑 Marksheet",
                marksheetUrl,
                "document"
            )}


            ${documentCard(
                "🪪 Aadhaar Front",
                aadhaarFrontUrl,
                "image"
            )}


            ${documentCard(
                "🪪 Aadhaar Back",
                aadhaarBackUrl,
                "image"
            )}


            <button
                type="button"
                onclick="closeDocumentsView()"
                style="
                    width:100%;
                    padding:12px;
                    margin-top:5px;
                    border:none;
                    background:#1565c0 !important;
                    color:#fff !important;
                    border-radius:6px;
                    cursor:pointer;
                "
            >
                Close
            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* ==================================================
       CLOSE OUTSIDE
    ================================================== */

    modal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                modal
            ) {

                closeDocumentsView();

            }

        }
    );

}


/* ==================================================
   CLOSE DOCUMENTS VIEW
================================================== */

function closeDocumentsView() {

    const modal =
        document.getElementById(
            "applicationDocumentsModal"
        );


    if (modal) {

        modal.remove();

    }

                      }

document.addEventListener("DOMContentLoaded", function() {

    const search = document.getElementById("admissionSearch");
    if (search) {
        search.addEventListener("input", function() {
            admissionSearchTerm = this.value;
            renderAdmissionApplications();
        });
    }

    document.querySelectorAll(".admission-filter-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            setAdmissionFilter(this.dataset.admissionFilter || "all");
        });
    });

});

/* ==================================================
   PAGE LOAD
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadApplications();

    }
);
