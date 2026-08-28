/* ==================================================
   GOOGLE APPS SCRIPT API
================================================== */

const SURYA_DATABASE_API =
    "https://script.google.com/macros/s/AKfycbwSNgtaUsInP4pOPORHVcYjyFKIqESpTj_zyLqy-4dpLUMX--D1EnRv36YVbGwfkL7l/exec";


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
   OPEN PASSWORD PANEL
================================================== */

function openPasswordPanel() {

    const panel =
        document.getElementById(
            "passwordPanel"
        );

    panel.style.display =
        "block";

    panel.scrollIntoView({
        behavior: "smooth"
    });

}


/* ==================================================
   CLOSE PASSWORD PANEL
================================================== */

function closePasswordPanel() {

    document.getElementById(
        "passwordPanel"
    ).style.display =
        "none";

    document.getElementById(
        "changePasswordForm"
    ).reset();

    document.getElementById(
        "passwordMessage"
    ).innerHTML =
        "";

}


/* ==================================================
   CHANGE PASSWORD
================================================== */

document
    .getElementById(
        "changePasswordForm"
    )
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const currentPassword =
                document
                    .getElementById(
                        "currentAdminPassword"
                    )
                    .value;


            const newPassword =
                document
                    .getElementById(
                        "newAdminPassword"
                    )
                    .value;


            const confirmPassword =
                document
                    .getElementById(
                        "confirmAdminPassword"
                    )
                    .value;


            const message =
                document.getElementById(
                    "passwordMessage"
                );


            /* =====================================
               CONFIRM PASSWORD
            ===================================== */

            if (
                newPassword !==
                confirmPassword
            ) {

                message.innerHTML =
                    "❌ New passwords do not match.";

                return;

            }


            /* =====================================
               PASSWORD LENGTH
            ===================================== */

            if (
                newPassword.length < 8
            ) {

                message.innerHTML =
                    "❌ Password must contain at least 8 characters.";

                return;

            }


            message.innerHTML =
                "⏳ Changing password...";


            try {

                const response =
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
                                        "changeAdminPassword",

                                    token:
                                        SURYA_ADMIN_TOKEN,

                                    currentPassword:
                                        currentPassword,

                                    newPassword:
                                        newPassword

                                })

                        }
                    );


                const result =
                    await response.json();


                if (
                    result.success
                ) {

                    message.innerHTML =
                        "✅ Password changed successfully.";

                    /*
                       Backend has already revoked
                       all admin sessions.
                    */

                    setTimeout(
                        function() {

                            sessionStorage.removeItem(
                                "SURYA_ADMIN_TOKEN"
                            );

                            sessionStorage.removeItem(
                                "SURYA_ADMIN_AUTH"
                            );

                            window.location.replace(
                                "admin-login.html"
                            );

                        },
                        1500
                    );

                }

                else {

                    message.innerHTML =
                        "❌ " +
                        (
                            result.message ||
                            "Password change failed."
                        );

                }


            }

            catch (error) {

                console.error(
                    "PASSWORD CHANGE ERROR:",
                    error
                );

                message.innerHTML =
                    "❌ Server connection failed.";

            }

        }
    );


/* ==================================================
   SERVER-SIDE LOGOUT
================================================== */

async function adminLogout() {

    const token =
        sessionStorage.getItem(
            "SURYA_ADMIN_TOKEN"
        );


    try {

        if (token) {

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
                                "adminLogout",

                            token:
                                token

                        })

                }
            );

        }

    }

    catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

    }


    sessionStorage.removeItem(
        "SURYA_ADMIN_TOKEN"
    );

    sessionStorage.removeItem(
        "SURYA_ADMIN_AUTH"
    );


    window.location.replace(
        "admin-login.html"
    );

}
