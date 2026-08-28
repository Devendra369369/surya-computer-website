/* ==================================================
   GOOGLE APPS SCRIPT API
================================================== */

const SURYA_DATABASE_API =
    "https://script.google.com/macros/s/AKfycbwSNgtaUsInP4pOPORHVcYjyFKIqESpTj_zyLqy-4dpLUMX--D1EnRv36YVbGwfkL7l/exec?v=cert-panel-20260829";


/* ==================================================
   ADMIN SESSION
================================================== */

const SURYA_ADMIN_TOKEN =
    sessionStorage.getItem(
        "SURYA_ADMIN_TOKEN"
    );


const SURYA_ADMIN_AUTH =
    sessionStorage.getItem(
        "SURYA_ADMIN_AUTH"
    );


/* ==================================================
   SESSION GUARD
================================================== */

if (
    SURYA_ADMIN_AUTH !== "true" ||
    !SURYA_ADMIN_TOKEN
) {

    window.location.replace(
        "admin-login.html"
    );

}


/* ==================================================
   GLOBAL CERTIFICATES
================================================== */

let allCertificates = [];

let currentCertificate = null;


/* ==================================================
   ELEMENTS
================================================== */

const searchInput =
    document.getElementById(
        "certificateSearch"
    );

const messageBox =
    document.getElementById(
        "certificateMessage"
    );

const certificateCard =
    document.getElementById(
        "certificateCard"
    );

const noCertificate =
    document.getElementById(
        "noCertificate"
    );

const certificateList =
    document.getElementById(
        "certificateList"
    );


/* ==================================================
   MESSAGE
================================================== */

function showMessage(
    message,
    type = "info"
) {

    messageBox.textContent =
        message;


    if (type === "error") {

        messageBox.style.color =
            "red";

    }

    else if (type === "success") {

        messageBox.style.color =
            "green";

    }

    else {

        messageBox.style.color =
            "#333";

    }

}


/* ==================================================
   LOAD CERTIFICATES
================================================== */

async function loadCertificates() {

    if (!SURYA_ADMIN_TOKEN) {
        showMessage(
            "❌ Admin session expired. Please login again."
        );
        return;
    }

    showMessage(
        "⏳ Loading certificates..."
    );


    certificateCard.style.display =
        "none";

    noCertificate.style.display =
        "none";


    try {

        const response =
    await fetch(
        SURYA_DATABASE_API,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "text/plain;charset=utf-8"
            },

            body:
                JSON.stringify({

                    action:
                        "certificates",

                    token:
                        SURYA_ADMIN_TOKEN

                })

        }
    );


        if (!response.ok) {

            throw new Error(
                "Server returned " +
                response.status
            );

        }


        const result =
            await response.json();


        if (
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to load certificates."
            );

        }


        allCertificates =
            Array.isArray(
                result.certificates
            )
                ? result.certificates
                : [];


        showMessage(
            "✅ Certificates loaded successfully.",
            "success"
        );


        renderCertificateList(
            allCertificates
        );


        if (
            allCertificates.length === 0
        ) {

            noCertificate.style.display =
                "block";

            noCertificate.textContent =
                "📜 No certificate records found.";

            return;

        }


        displayCertificate(
            allCertificates[0]
        );


    }

    catch (error) {

        console.error(
            "CERTIFICATE LOAD ERROR:",
            error
        );


        showMessage(
            "❌ Unable to connect to certificate database.",
            "error"
        );


        certificateCard.style.display =
            "none";

    }

}


/* ==================================================
   DISPLAY CERTIFICATE
================================================== */

function displayCertificate(
    certificate
) {

    if (!certificate) {

        certificateCard.style.display =
            "none";

        return;

    }


    currentCertificate =
        certificate;


    certificateCard.style.display =
        "block";

    noCertificate.style.display =
        "none";


    const status =
        String(
            certificate.Status || ""
        );


    certificateCard.innerHTML = `

        <div class="certificate-card-header">

            <h3>
                📜 Certificate
            </h3>

            <span class="certificate-verified">
                ${escapeHtml(status)}
            </span>

        </div>


        <div class="certificate-details">

            <p>
                <strong>Certificate ID:</strong>
                ${escapeHtml(certificate["Certificate ID"])}
            </p>

            <p>
                <strong>Student ID:</strong>
                ${escapeHtml(certificate["Student ID"])}
            </p>

            <p>
                <strong>Student Name:</strong>
                ${escapeHtml(certificate["Student Name"])}
            </p>

            <p>
                <strong>Father Name:</strong>
                ${escapeHtml(certificate["Father Name"])}
            </p>

            <p>
                <strong>Course:</strong>
                ${escapeHtml(certificate["Course"])}
            </p>

            <p>
                <strong>Total Marks:</strong>
                ${escapeHtml(certificate["Total Marks"])}
            </p>

            <p>
                <strong>Obtained Marks:</strong>
                ${escapeHtml(certificate["Obtained Marks"])}
            </p>

            <p>
                <strong>Percentage:</strong>
                ${escapeHtml(certificate["Percentage"])}
            </p>

            <p>
                <strong>Grade:</strong>
                ${escapeHtml(certificate["Grade"])}
            </p>

            <p>
                <strong>Result:</strong>
                ${escapeHtml((certificate["Final Result"] || certificate["Result"] || ""))}
            </p>

            <p>
                <strong>Issue Date:</strong>
                ${formatDate(certificate["Issue Date"])}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHtml(status)}
            </p>

            <p>
                <strong>Result ID:</strong>
                ${escapeHtml(certificate["Result ID"])}
            </p>

        </div>


        <div class="certificate-actions">

            <button
                type="button"
                onclick="viewCertificate()"
            >
                👁️ View
            </button>


            <button
                type="button"
                onclick="printCertificate()"
            >
                🖨️ Print
            </button>


            ${
                status.toLowerCase() === "active"
                ? `
                    <button
                        type="button"
                        onclick="disableCertificate()"
                    >
                        🚫 Disable
                    </button>
                `
                : ""
            }

        </div>

    `;

}


/* ==================================================
   RENDER CERTIFICATE LIST
================================================== */

function renderCertificateList(
    certificates
) {

    certificateList.innerHTML =
        "";


    if (
        !certificates.length
    ) {

        return;

    }


    const heading =
        document.createElement(
            "h3"
        );


    heading.textContent =
        "📚 Certificate Records (" +
        certificates.length +
        ")";


    certificateList.appendChild(
        heading
    );


    certificates.forEach(
        function(certificate) {

            const item =
                document.createElement(
                    "div"
                );


            item.style.cssText = `
                padding:15px;
                margin:10px 0;
                background:#fff;
                border-radius:10px;
                box-shadow:0 2px 8px rgba(0,0,0,0.08);
                cursor:pointer;
            `;


            item.innerHTML = `

                <strong>
                    ${escapeHtml(certificate["Certificate ID"])}
                </strong>

                <br>

                ${escapeHtml(certificate["Student Name"])}

                <br>

                <small>
                    Student ID:
                    ${escapeHtml(certificate["Student ID"])}
                    |
                    Status:
                    ${escapeHtml(certificate["Status"])}
                </small>

            `;


            item.addEventListener(
                "click",
                function() {

                    displayCertificate(
                        certificate
                    );

                    certificateCard.scrollIntoView({
                        behavior:"smooth",
                        block:"start"
                    });

                }
            );


            certificateList.appendChild(
                item
            );

        }
    );

}


/* ==================================================
   SEARCH
================================================== */

searchInput.addEventListener(
    "input",
    function() {

        const search =
            this.value
                .trim()
                .toLowerCase();


        if (!search) {

            renderCertificateList(
                allCertificates
            );


            if (
                allCertificates.length
            ) {

                displayCertificate(
                    allCertificates[0]
                );

            }

            return;

        }


        const filtered =
            allCertificates.filter(
                function(certificate) {

                    return (

                        String(
                            certificate["Certificate ID"] || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            certificate["Student ID"] || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            certificate["Student Name"] || ""
                        )
                        .toLowerCase()
                        .includes(search)

                    );

                }
            );


        renderCertificateList(
            filtered
        );


        if (
            filtered.length > 0
        ) {

            displayCertificate(
                filtered[0]
            );

        }

        else {

            certificateCard.style.display =
                "none";

            noCertificate.style.display =
                "block";

            noCertificate.textContent =
                "❌ Certificate not found.";

        }

    }
);


/* ==================================================
   VIEW CERTIFICATE
================================================== */

function viewCertificate() {

    if (!currentCertificate) {

        alert(
            "Certificate record not found."
        );

        return;

    }


    const certificate =
        currentCertificate;


    alert(

        "CERTIFICATE DETAILS\n\n" +

        "Certificate ID: " +
        (certificate["Certificate ID"] || "") +

        "\n\nStudent ID: " +
        (certificate["Student ID"] || "") +

        "\n\nStudent Name: " +
        (certificate["Student Name"] || "") +

        "\n\nFather Name: " +
        (certificate["Father Name"] || "") +

        "\n\nCourse: " +
        (certificate["Course"] || "") +

        "\n\nTotal Marks: " +
        (certificate["Total Marks"] || "") +

        "\n\nObtained Marks: " +
        (certificate["Obtained Marks"] || "") +

        "\n\nPercentage: " +
        (certificate["Percentage"] || "") +

        "\n\nGrade: " +
        (certificate["Grade"] || "") +

        "\n\nResult: " +
        ((certificate["Final Result"] || certificate["Result"] || "") || "") +

        "\n\nIssue Date: " +
        formatDate(
            certificate["Issue Date"]
        ) +

        "\n\nStatus: " +
        (certificate["Status"] || "") +

        "\n\nResult ID: " +
        (certificate["Result ID"] || "")

    );

}


/* ==================================================
   DISABLE CERTIFICATE
================================================== */

async function disableCertificate() {

    if (!currentCertificate) {

        alert(
            "Certificate record not found."
        );

        return;

    }


    const certificateId =
        currentCertificate[
            "Certificate ID"
        ];


    if (!certificateId) {

        alert(
            "Certificate ID not found."
        );

        return;

    }


    const confirmed =
        confirm(

            "⚠️ Disable Certificate?\n\n" +

            "Certificate ID: " +
            certificateId +

            "\n\n" +

            "After disabling, public verification should not treat this certificate as active."

        );


    if (!confirmed) {

        return;

    }


    showMessage(
        "⏳ Disabling certificate..."
    );


    try {

        const response =
            await fetch(
                SURYA_DATABASE_API,
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({

                            action:
                                "disableCertificate",

                            token:
                                SURYA_ADMIN_TOKEN,

                            certificateId:
                                certificateId

                        })

                }
            );


        const result =
            await response.json();


        if (
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Certificate could not be disabled."
            );

        }


        showMessage(
            "✅ Certificate disabled successfully.",
            "success"
        );


        await loadCertificates();


        const updated =
            allCertificates.find(
                function(certificate) {

                    return (
                        String(
                            certificate[
                                "Certificate ID"
                            ] || ""
                        )
                        .toUpperCase()
                        ===
                        String(
                            certificateId
                        )
                        .toUpperCase()
                    );

                }
            );


        if (updated) {

            displayCertificate(
                updated
            );

        }

    }

    catch (error) {

        console.error(
            "DISABLE CERTIFICATE ERROR:",
            error
        );


        showMessage(
            "❌ " +
            error.message,
            "error"
        );

    }

}


/* ==================================================
   PRINT CERTIFICATE
================================================== */

function printCertificate() {

    if (!currentCertificate) {

        alert(
            "Certificate record not found."
        );

        return;

    }


    const certificateId =
        currentCertificate[
            "Certificate ID"
        ];


    if (!certificateId) {

        alert(
            "Certificate ID not found."
        );

        return;

    }


    window.location.href =
        "certificate-print.html?id=" +
        encodeURIComponent(
            certificateId
        );

}


/* ==================================================
   FORMAT DATE
================================================== */

function formatDate(
    value
) {

    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        !isNaN(
            date.getTime()
        )
    ) {

        return date.toLocaleDateString(
            "en-IN",
            {
                day:"2-digit",
                month:"long",
                year:"numeric"
            }
        );

    }


    return String(value);

}


/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ==================================================
   PAGE LOAD
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadCertificates();

    }
);


/* ==================================================
   CERTIFICATE ADMIN MODULE READY
================================================== */

console.log(
    "SURYA CERTIFICATE ADMIN v2.0.0 READY!"
);
