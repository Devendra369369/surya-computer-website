/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   ADMIN AUTHENTICATION & SECURITY
   File    : Auth.gs
   Version : v2.0.0

   Security:
   - SHA-256 password hash
   - Script Properties credential storage
   - 6 hour sessions
   - 5 failed attempts
   - 12 hour account lock
   - Per-session token
   - Logout/revocation
   - Password change invalidates sessions
================================================== */

"use strict";


/* ==================================================
   SECURITY SETTINGS
================================================== */

const ADMIN_SESSION_SECONDS = 6 * 60 * 60;       // 6 hours
const ADMIN_LOCK_SECONDS = 12 * 60 * 60;          // 12 hours
const ADMIN_MAX_FAILED_ATTEMPTS = 5;

const ADMIN_ALERT_EMAILS = [
    "aeronhadalyaan@gmail.com",
    "sadhuji9616@gmail.com"
];


/* ==================================================
   PROPERTY KEYS
================================================== */

const PROP_USERNAME = "SURYA_ADMIN_USERNAME";
const PROP_PASSWORD_HASH = "SURYA_ADMIN_PASSWORD_HASH";

const PROP_FAILED_ATTEMPTS = "SURYA_ADMIN_FAILED_ATTEMPTS";
const PROP_LOCK_UNTIL = "SURYA_ADMIN_LOCK_UNTIL";

const PROP_SESSION_PREFIX = "SURYA_ADMIN_SESSION_";

const PROP_SECURITY_VERSION = "SURYA_ADMIN_SECURITY_VERSION";


/* ==================================================
   SHA-256 HASH
================================================== */

function hashPassword(password) {

    password =
        String(password || "");

    const digest =
        Utilities.computeDigest(
            Utilities.DigestAlgorithm.SHA_256,
            password,
            Utilities.Charset.UTF_8
        );

    return digest
        .map(function(byte) {

            const value =
                (byte < 0)
                    ? byte + 256
                    : byte;

            return value
                .toString(16)
                .padStart(2, "0");

        })
        .join("");
}


/* ==================================================
   SECURITY INITIALIZATION
================================================== */

/*
   IMPORTANT:

   Run this function ONCE from Apps Script editor.

   Before running:
   - change the username if required
   - change the temporary password

   After successful setup:
   DELETE THIS FUNCTION from Auth.gs.

   Do NOT leave the temporary password in source code.
*/

function setupAdminSecurity() {

    const username = "admin";
    const password = "ADMIN123";

    if (
        !username ||
        !password ||
        password.length < 8
    ) {

        throw new Error(
            "Username/password invalid. Password must be at least 8 characters."
        );

    }

    const props =
        PropertiesService.getScriptProperties();

    props.setProperties({

        [PROP_USERNAME]:
            String(username).trim(),

        [PROP_PASSWORD_HASH]:
            hashPassword(password),

        [PROP_FAILED_ATTEMPTS]:
            "0",

        [PROP_LOCK_UNTIL]:
            "0",

        [PROP_SECURITY_VERSION]:
            "2.0.0"

    }, false);

    return "Admin security initialized successfully.";
}


/* ==================================================
   CHECK SECURITY INITIALIZATION
================================================== */

function isAdminSecurityInitialized() {

    const props =
        PropertiesService.getScriptProperties();

    const username =
        props.getProperty(
            PROP_USERNAME
        );

    const passwordHash =
        props.getProperty(
            PROP_PASSWORD_HASH
        );

    return !!(
        username &&
        passwordHash
    );
}


/* ==================================================
   ADMIN LOGIN
================================================== */

function adminLogin(username, password) {

    username =
        String(username || "").trim();

    password =
        String(password || "");

    const lock =
        LockService.getScriptLock();

    lock.waitLock(10000);

    try {

        if (!isAdminSecurityInitialized()) {

            return jsonResponse({

                success: false,

                message:
                    "Admin security is not initialized."

            });

        }

        const props =
            PropertiesService.getScriptProperties();

        const storedUsername =
            props.getProperty(
                PROP_USERNAME
            );

        const storedPasswordHash =
            props.getProperty(
                PROP_PASSWORD_HASH
            );


        /* =========================================
           CHECK ACCOUNT LOCK
        ========================================= */

        const now =
            Date.now();

        const lockUntil =
            Number(
                props.getProperty(
                    PROP_LOCK_UNTIL
                ) || "0"
            );


        if (
            lockUntil > now
        ) {

            const remainingMinutes =
                Math.ceil(
                    (
                        lockUntil - now
                    ) / 60000
                );

            return jsonResponse({

                success: false,

                locked: true,

                message:
                    "Admin account is temporarily locked. Try again later.",

                remainingMinutes:
                    remainingMinutes

            });

        }


        /* =========================================
           VERIFY USERNAME + PASSWORD
        ========================================= */

        const suppliedHash =
            hashPassword(password);

        const usernameOK =
            username === storedUsername;

        const passwordOK =
            suppliedHash === storedPasswordHash;


        if (
            !usernameOK ||
            !passwordOK
        ) {

            let failedAttempts =
                Number(
                    props.getProperty(
                        PROP_FAILED_ATTEMPTS
                    ) || "0"
                );

            failedAttempts++;

            props.setProperty(
                PROP_FAILED_ATTEMPTS,
                String(failedAttempts)
            );


            /* =====================================
               LOCK AFTER MAX ATTEMPTS
            ===================================== */

            if (
                failedAttempts >=
                ADMIN_MAX_FAILED_ATTEMPTS
            ) {

                const newLockUntil =
                    Date.now() +
                    (
                        ADMIN_LOCK_SECONDS *
                        1000
                    );

                props.setProperty(
                    PROP_LOCK_UNTIL,
                    String(newLockUntil)
                );

                props.setProperty(
                    PROP_FAILED_ATTEMPTS,
                    "0"
                );


                sendAdminSecurityAlert(
                    "ADMIN ACCOUNT LOCKED",
                    "The SURYA admin account has been locked after multiple failed login attempts."
                );


                return jsonResponse({

                    success: false,

                    locked: true,

                    message:
                        "Too many failed login attempts. Admin account locked for 12 hours."

                });

            }


            return jsonResponse({

                success: false,

                message:
                    "Invalid Admin Username or Password.",

                remainingAttempts:
                    ADMIN_MAX_FAILED_ATTEMPTS -
                    failedAttempts

            });

        }


        /* =========================================
           SUCCESSFUL LOGIN
        ========================================= */

        props.setProperty(
            PROP_FAILED_ATTEMPTS,
            "0"
        );

        props.setProperty(
            PROP_LOCK_UNTIL,
            "0"
        );


        /* =========================================
           CREATE RANDOM SESSION TOKEN
        ========================================= */

        const token =
            Utilities.getUuid();


        const expiresAt =
            Date.now() +
            (
                ADMIN_SESSION_SECONDS *
                1000
            );


        const sessionData = {

            username:
                storedUsername,

            createdAt:
                Date.now(),

            expiresAt:
                expiresAt

        };


        props.setProperty(

            PROP_SESSION_PREFIX +
            token,

            JSON.stringify(
                sessionData
            )

        );


        return jsonResponse({

            success: true,

            message:
                "Admin authentication successful.",

            token:
                token,

            expiresAt:
                expiresAt,

            expiresIn:
                ADMIN_SESSION_SECONDS

        });

    }

    finally {

        lock.releaseLock();

    }

}


/* ==================================================
   VERIFY ADMIN SESSION
================================================== */

function verifyAdminSession(token) {

    token =
        String(token || "").trim();


    if (!token) {

        return false;

    }


    const props =
        PropertiesService.getScriptProperties();


    const key =
        PROP_SESSION_PREFIX +
        token;


    const rawSession =
        props.getProperty(key);


    if (!rawSession) {

        return false;

    }


    let session;

    try {

        session =
            JSON.parse(
                rawSession
            );

    }

    catch (error) {

        props.deleteProperty(key);

        return false;

    }


    const now =
        Date.now();


    /* =========================================
       SESSION EXPIRED
    ========================================= */

    if (
        !session.expiresAt ||
        Number(session.expiresAt) <= now
    ) {

        props.deleteProperty(key);

        return false;

    }


    /* =========================================
       SESSION VALID
    ========================================= */

    return true;

}


/* ==================================================
   ADMIN LOGOUT
================================================== */

function adminLogout(token) {

    token =
        String(token || "").trim();


    if (token) {

        PropertiesService
            .getScriptProperties()
            .deleteProperty(
                PROP_SESSION_PREFIX +
                token
            );

    }


    return jsonResponse({

        success: true,

        message:
            "Admin logged out."

    });

}


/* ==================================================
   CHANGE ADMIN PASSWORD
================================================== */

function changeAdminPassword(
    token,
    currentPassword,
    newPassword
) {

    if (
        !verifyAdminSession(token)
    ) {

        return jsonResponse({

            success: false,

            authenticated: false,

            message:
                "Unauthorized. Admin login required."

        });

    }


    currentPassword =
        String(
            currentPassword || ""
        );

    newPassword =
        String(
            newPassword || ""
        );


    if (
        newPassword.length < 8
    ) {

        return jsonResponse({

            success: false,

            message:
                "New password must contain at least 8 characters."

        });

    }


    const lock =
        LockService.getScriptLock();

    lock.waitLock(10000);


    try {

        const props =
            PropertiesService
                .getScriptProperties();


        const storedHash =
            props.getProperty(
                PROP_PASSWORD_HASH
            );


        if (
            hashPassword(
                currentPassword
            ) !== storedHash
        ) {

            return jsonResponse({

                success: false,

                message:
                    "Current password is incorrect."

            });

        }


        props.setProperty(

            PROP_PASSWORD_HASH,

            hashPassword(
                newPassword
            )

        );


        /*
           Password change invalidates
           all existing sessions.
        */

        revokeAllAdminSessions();


        return jsonResponse({

            success: true,

            message:
                "Admin password changed successfully. Please login again."

        });

    }

    finally {

        lock.releaseLock();

    }

}


/* ==================================================
   REVOKE ALL ADMIN SESSIONS
================================================== */

function revokeAllAdminSessions() {

    const props =
        PropertiesService
            .getScriptProperties();

    const all =
        props.getProperties();


    Object.keys(all)
        .forEach(function(key) {

            if (
                key.indexOf(
                    PROP_SESSION_PREFIX
                ) === 0
            ) {

                props.deleteProperty(key);

            }

        });

}


/* ==================================================
   SECURITY ALERT EMAIL
================================================== */

function sendAdminSecurityAlert(
    subject,
    message
) {

    try {

        ADMIN_ALERT_EMAILS.forEach(
            function(email) {

                MailApp.sendEmail({

                    to:
                        email,

                    subject:
                        "SURYA ADMIN SECURITY: " +
                        subject,

                    body:
                        message +
                        "\n\n" +
                        "Time: " +
                        new Date().toString()

                });

            }
        );

    }

    catch (error) {

        console.error(
            "Security alert email failed:",
            error
        );

    }

}


/* ==================================================
   SECURITY STATUS
================================================== */

function getAdminSecurityStatus(
    token
) {

    if (
        !verifyAdminSession(token)
    ) {

        return jsonResponse({

            success: false,

            authenticated: false,

            message:
                "Unauthorized. Admin login required."

        });

    }


    const props =
        PropertiesService
            .getScriptProperties();


    const lockUntil =
        Number(
            props.getProperty(
                PROP_LOCK_UNTIL
            ) || "0"
        );


    const failedAttempts =
        Number(
            props.getProperty(
                PROP_FAILED_ATTEMPTS
            ) || "0"
        );


    return jsonResponse({

        success: true,

        securityVersion:
            props.getProperty(
                PROP_SECURITY_VERSION
            ) || "2.0.0",

        failedAttempts:
            failedAttempts,

        maxFailedAttempts:
            ADMIN_MAX_FAILED_ATTEMPTS,

        locked:
            lockUntil > Date.now(),

        lockUntil:
            lockUntil || null,

        sessionLifetimeHours:
            6

    });

}