/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   ADMIN AUTHENTICATION & SECURITY
   File    : Auth.gs
   Version : v3.0.0

   Security:
   - SHA-256 password hash
   - Script Properties credential storage
   - 6 hour sessions
   - 5 failed attempts
   - 12 hour account lock
   - Per-session token
   - Logout/revocation
   - Password change invalidates sessions
   - Email alerts for login/logout/security events
   - New-browser/device detection
   - OTP password recovery
   - Recovery OTP hashing + expiry + attempt limits
================================================== */

"use strict";


/* ==================================================
   SECURITY SETTINGS
================================================== */

const ADMIN_SESSION_SECONDS = 6 * 60 * 60;       // 6 hours
const ADMIN_LOCK_SECONDS = 12 * 60 * 60;          // 12 hours
const ADMIN_MAX_FAILED_ATTEMPTS = 5;
const ADMIN_OTP_EXPIRY_SECONDS = 10 * 60;
const ADMIN_MAX_OTP_ATTEMPTS = 5;
const ADMIN_DEVICE_MAX_RECORDS = 25;

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
const PROP_RECOVERY_EMAIL = "SURYA_ADMIN_RECOVERY_EMAIL";
const PROP_OTP_HASH = "SURYA_ADMIN_OTP_HASH";
const PROP_OTP_EXPIRES = "SURYA_ADMIN_OTP_EXPIRES";
const PROP_OTP_ATTEMPTS = "SURYA_ADMIN_OTP_ATTEMPTS";
const PROP_OTP_USERNAME = "SURYA_ADMIN_OTP_USERNAME";
const PROP_DEVICE_PREFIX = "SURYA_ADMIN_DEVICE_";
const PROP_LOGIN_CHALLENGE_PREFIX = "SURYA_ADMIN_LOGIN_CHALLENGE_";
const ADMIN_LOGIN_CHALLENGE_SECONDS = 120;

// Separate emergency-lock credential. Only the SHA-256 hash is stored.
const EMERGENCY_LOCK_PASSWORD_HASH = "b65841b8268dbb217903df1125abb6cd7c377c94679305cb6f597fedf918ea5c";
const PROP_EMERGENCY_ATTEMPTS = "SURYA_EMERGENCY_LOCK_ATTEMPTS";
const PROP_EMERGENCY_WINDOW = "SURYA_EMERGENCY_LOCK_WINDOW";
const EMERGENCY_MAX_ATTEMPTS = 5;
const EMERGENCY_WINDOW_MS = 15 * 60 * 1000;


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
   ONE-TIME ADMIN SECURITY INITIALIZER
   Run once in Apps Script editor on a fresh deployment.
   It generates a random temporary password and logs it once.
   Change the password immediately after first login.
================================================== */
function initializeAdminSecurity() {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty(PROP_USERNAME) && props.getProperty(PROP_PASSWORD_HASH)) {
        return "Admin security is already initialized.";
    }
    const username = "admin";
    const temporaryPassword = "SURYA-" + Utilities.getUuid().replace(/-/g, "").slice(0, 14) + "!";
    props.setProperties({
        [PROP_USERNAME]: username,
        [PROP_PASSWORD_HASH]: hashPassword(temporaryPassword),
        [PROP_FAILED_ATTEMPTS]: "0",
        [PROP_LOCK_UNTIL]: "0",
        [PROP_SECURITY_VERSION]: "3.1.0",
        [PROP_RECOVERY_EMAIL]: "sadhuji9616@gmail.com"
    }, false);
    console.log("SURYA temporary admin username: " + username);
    console.log("SURYA temporary admin password (store securely, then change it): " + temporaryPassword);
    return "Admin initialized. The temporary credentials are available in the Apps Script execution log. Change the password immediately.";
}

function hasTrustedAdminDevice_() {
    const props = PropertiesService.getScriptProperties();
    return Object.keys(props.getProperties()).some(function(key) {
        return key.indexOf(PROP_DEVICE_PREFIX) === 0;
    });
}

/* ==================================================
   ADMIN LOGIN
================================================== */

function adminLogin(username, password, clientInfo) {

    clientInfo = clientInfo || {};

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
           NEW DEVICE LOCATION GATE
        ========================================= */

        const deviceId = String(clientInfo.deviceId || "").trim().slice(0, 120);
        const deviceKey = deviceId
            ? PROP_DEVICE_PREFIX + hashPassword(deviceId).slice(0, 32)
            : "";
        const knownDevice = !!(deviceKey && props.getProperty(deviceKey));
        const latitude = clientInfo.latitude;
        const longitude = clientInfo.longitude;
        const hasLocation =
            latitude !== null && latitude !== undefined &&
            longitude !== null && longitude !== undefined &&
            latitude !== "" && longitude !== "" &&
            isFinite(Number(latitude)) && isFinite(Number(longitude));

        /*
         * NEW BROWSER / DEVICE:
         * Password is already verified above, but the session is NOT
         * created yet. A trusted Admin device must approve this login.
         */
        if (!knownDevice && hasTrustedAdminDevice_()) {
            const challengeId = Utilities.getUuid();
            const challengeNumber = String(Math.floor(10 + Math.random() * 90));
            const expiresAt = Date.now() + ADMIN_LOGIN_CHALLENGE_SECONDS * 1000;

            props.setProperty(
                PROP_LOGIN_CHALLENGE_PREFIX + challengeId,
                JSON.stringify({
                    challengeId: challengeId,
                    username: storedUsername,
                    number: challengeNumber,
                    status: "pending",
                    createdAt: Date.now(),
                    expiresAt: expiresAt,
                    clientInfo: {
                        browser: String(clientInfo.browser || "Unknown").slice(0,120),
                        platform: String(clientInfo.platform || "Unknown").slice(0,120),
                        userAgent: String(clientInfo.userAgent || "Unknown").slice(0,500),
                        timezone: String(clientInfo.timezone || "Unknown").slice(0,100)
                    }
                })
            );

            sendAdminSecurityAlert(
                "ADMIN LOGIN APPROVAL REQUIRED",
                "A new browser/device entered the correct Admin password and is waiting for approval.\\n\\n" +
                "Approval number: " + challengeNumber + "\\n" +
                "Browser: " + String(clientInfo.browser || "Unknown") + "\\n" +
                "Platform: " + String(clientInfo.platform || "Unknown") + "\\n" +
                "Time: " + new Date().toString()
            );

            return jsonResponse({
                success: false,
                verificationRequired: true,
                challengeId: challengeId,
                challengeNumber: challengeNumber,
                expiresAt: expiresAt,
                expiresIn: ADMIN_LOGIN_CHALLENGE_SECONDS,
                message: "New browser/device detected. Approve this login from an already trusted Admin device."
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

        if (deviceId) {
            const deviceData = {
                deviceId: deviceId,
                browser: String(clientInfo.browser || "Unknown").slice(0, 120),
                platform: String(clientInfo.platform || "Unknown").slice(0, 120),
                userAgent: String(clientInfo.userAgent || "Unknown").slice(0, 500),
                language: String(clientInfo.language || "Unknown").slice(0, 80),
                timezone: String(clientInfo.timezone || "Unknown").slice(0, 100),
                screen: String(clientInfo.screen || "Unknown").slice(0, 80),
                latitude: hasLocation ? String(Number(latitude).toFixed(4)) : "Unavailable",
                longitude: hasLocation ? String(Number(longitude).toFixed(4)) : "Unavailable",
                lastSeen: new Date().toISOString()
            };
            props.setProperty(deviceKey, JSON.stringify(deviceData));

            if (!knownDevice) {
                sendAdminSecurityAlert(
                    "NEW ADMIN BROWSER / DEVICE LOGIN",
                    "A new browser/device successfully logged into the SURYA Admin Panel.\n\n" +
                    "Browser: " + deviceData.browser + "\n" +
                    "Platform: " + deviceData.platform + "\n" +
                    "Time: " + new Date().toString() + "\n" +
                    "Timezone: " + deviceData.timezone + "\n" +
                    "Screen: " + deviceData.screen + "\n" +
                    "Approx. Location: " + deviceData.latitude + ", " + deviceData.longitude + "\n\n" +
                    "User-Agent:\n" + deviceData.userAgent
                );
            }
        }


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
   ADMIN LOGIN APPROVAL — PENDING CHALLENGES
================================================== */

function getAdminLoginChallenges(token) {
    if (!verifyAdminSession(token)) {
        return jsonResponse({
            success: false,
            authenticated: false,
            message: "Unauthorized."
        });
    }

    const props = PropertiesService.getScriptProperties();
    const all = props.getProperties();
    const now = Date.now();
    const challenges = [];

    Object.keys(all).forEach(function(key) {
        if (key.indexOf(PROP_LOGIN_CHALLENGE_PREFIX) !== 0) return;

        try {
            const c = JSON.parse(all[key]);

            if (!c.expiresAt || Number(c.expiresAt) <= now) {
                props.deleteProperty(key);
                return;
            }

            if (c.status === "pending" && c.username === (props.getProperty(PROP_USERNAME) || "")) {
                challenges.push({
                    challengeId: c.challengeId,
                    number: c.number,
                    expiresAt: c.expiresAt,
                    browser: c.clientInfo && c.clientInfo.browser || "Unknown",
                    platform: c.clientInfo && c.clientInfo.platform || "Unknown",
                    timezone: c.clientInfo && c.clientInfo.timezone || "Unknown"
                });
            }
        } catch (e) {
            props.deleteProperty(key);
        }
    });

    return jsonResponse({
        success: true,
        challenges: challenges
    });
}


/* ==================================================
   ADMIN LOGIN APPROVAL — YES / NO
================================================== */

function respondAdminLoginChallenge(token, challengeId, approve, number) {
    if (!verifyAdminSession(token)) {
        return jsonResponse({
            success: false,
            authenticated: false,
            message: "Unauthorized."
        });
    }

    challengeId = String(challengeId || "").trim();
    number = String(number || "").trim();

    if (!challengeId) {
        return jsonResponse({success:false,message:"Challenge ID is required."});
    }

    const props = PropertiesService.getScriptProperties();
    const key = PROP_LOGIN_CHALLENGE_PREFIX + challengeId;
    const raw = props.getProperty(key);

    if (!raw) return jsonResponse({success:false,message:"Login request expired or was not found."});

    let c;
    try {
        c = JSON.parse(raw);
    } catch (e) {
        props.deleteProperty(key);
        return jsonResponse({success:false,message:"Invalid login request."});
    }

    if (!c.expiresAt || Number(c.expiresAt) <= Date.now()) {
        props.deleteProperty(key);
        return jsonResponse({success:false,message:"Login request expired."});
    }

    if (c.status !== "pending") {
        return jsonResponse({
            success: c.status === "approved",
            status: c.status,
            message: c.status === "approved" ? "Login already approved." : "Login request was denied."
        });
    }

    if (String(approve) !== "true" && String(approve) !== "false") {
        return jsonResponse({success:false,message:"Invalid approval response."});
    }

    if (String(approve) === "true" && number !== String(c.number)) {
        return jsonResponse({success:false,message:"Security number does not match."});
    }

    c.status = String(approve) === "true" ? "approved" : "denied";
    c.respondedAt = Date.now();
    c.respondedBy = (PropertiesService.getScriptProperties().getProperty(PROP_USERNAME) || "admin");

    props.setProperty(key, JSON.stringify(c));

    sendAdminSecurityAlert(
        c.status === "approved" ? "NEW ADMIN LOGIN APPROVED" : "NEW ADMIN LOGIN DENIED",
        "A trusted Admin device " + c.status + " a new browser/device login request.\n\n" +
        "Approval number: " + c.number + "\n" +
        "Browser: " + (c.clientInfo && c.clientInfo.browser || "Unknown") + "\n" +
        "Platform: " + (c.clientInfo && c.clientInfo.platform || "Unknown")
    );

    return jsonResponse({
        success: true,
        status: c.status,
        message: c.status === "approved" ? "New Admin login approved." : "New Admin login denied."
    });
}


/* ==================================================
   ADMIN LOGIN APPROVAL — COMPLETE AFTER APPROVAL
================================================== */

function completeAdminLogin(challengeId, clientInfo) {
    challengeId = String(challengeId || "").trim();
    clientInfo = clientInfo || {};

    if (!challengeId) {
        return jsonResponse({success:false,message:"Challenge ID is required."});
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
        const props = PropertiesService.getScriptProperties();
        const key = PROP_LOGIN_CHALLENGE_PREFIX + challengeId;
        const raw = props.getProperty(key);

        if (!raw) return jsonResponse({success:false,message:"Login request expired or was not found."});

        let c;
        try {
            c = JSON.parse(raw);
        } catch (e) {
            props.deleteProperty(key);
            return jsonResponse({success:false,message:"Invalid login request."});
        }

        if (!c.expiresAt || Number(c.expiresAt) <= Date.now()) {
            props.deleteProperty(key);
            return jsonResponse({success:false,message:"Login request expired."});
        }

        if (c.status !== "approved") {
            return jsonResponse({
                success:false,
                pending:c.status === "pending",
                denied:c.status === "denied",
                message:c.status === "denied" ? "Login was denied on the trusted Admin device." : "Waiting for approval from a trusted Admin device."
            });
        }

        const token = Utilities.getUuid();
        const expiresAt = Date.now() + ADMIN_SESSION_SECONDS * 1000;

        props.setProperty(
            PROP_SESSION_PREFIX + token,
            JSON.stringify({
                username: c.username,
                createdAt: Date.now(),
                expiresAt: expiresAt
            })
        );

        const deviceId = String(clientInfo.deviceId || "").trim().slice(0,120);
        if (deviceId) {
            const deviceKey = PROP_DEVICE_PREFIX + hashPassword(deviceId).slice(0,32);
            props.setProperty(deviceKey, JSON.stringify({
                deviceId: deviceId,
                browser: String(clientInfo.browser || "Unknown").slice(0,120),
                platform: String(clientInfo.platform || "Unknown").slice(0,120),
                userAgent: String(clientInfo.userAgent || "Unknown").slice(0,500),
                language: String(clientInfo.language || "Unknown").slice(0,80),
                timezone: String(clientInfo.timezone || "Unknown").slice(0,100),
                screen: String(clientInfo.screen || "Unknown").slice(0,80),
                latitude: clientInfo.latitude == null ? "Unavailable" : String(clientInfo.latitude),
                longitude: clientInfo.longitude == null ? "Unavailable" : String(clientInfo.longitude),
                lastSeen: new Date().toISOString()
            }));
        }

        props.deleteProperty(key);

        return jsonResponse({
            success:true,
            message:"Admin authentication successful.",
            token:token,
            expiresAt:expiresAt,
            expiresIn:ADMIN_SESSION_SECONDS
        });
    } finally {
        lock.releaseLock();
    }
}


/* ==================================================
   CLEAN EXPIRED LOGIN CHALLENGES
================================================== */

function cleanupAdminLoginChallenges() {
    const props = PropertiesService.getScriptProperties();
    const now = Date.now();
    Object.keys(props.getProperties()).forEach(function(key) {
        if (key.indexOf(PROP_LOGIN_CHALLENGE_PREFIX) !== 0) return;
        try {
            const c = JSON.parse(props.getProperty(key) || "{}");
            if (!c.expiresAt || Number(c.expiresAt) <= now) props.deleteProperty(key);
        } catch (e) {
            props.deleteProperty(key);
        }
    });
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
   CONFIGURE RECOVERY EMAIL
================================================== */

function setupAdminRecoveryEmail() {

    const recoveryEmail = "sadhuji9616@gmail.com";

    if (
        !recoveryEmail ||
        recoveryEmail.indexOf("@") < 1
    ) {
        throw new Error("Invalid admin recovery email configuration.");
    }

    PropertiesService
        .getScriptProperties()
        .setProperty(
            PROP_RECOVERY_EMAIL,
            recoveryEmail.trim()
        );

    return "Admin recovery email configured successfully.";
}


/* ==================================================
   PASSWORD RECOVERY - REQUEST OTP
================================================== */

function requestAdminPasswordReset(username, recoveryEmail) {

    username = String(username || "").trim();
    recoveryEmail = String(recoveryEmail || "").trim().toLowerCase();

    const props = PropertiesService.getScriptProperties();
    const storedUsername = props.getProperty(PROP_USERNAME) || "";
    const storedRecoveryEmail =
        String(props.getProperty(PROP_RECOVERY_EMAIL) || "")
            .trim()
            .toLowerCase();

    /* Always return a generic response to avoid account enumeration. */
    const generic = jsonResponse({
        success: true,
        message: "If the supplied details are valid, a verification OTP has been sent to the registered recovery email."
    });

    if (
        !username ||
        !recoveryEmail ||
        username !== storedUsername ||
        !storedRecoveryEmail ||
        recoveryEmail !== storedRecoveryEmail
    ) {
        return generic;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + ADMIN_OTP_EXPIRY_SECONDS * 1000;

    props.setProperties({
        [PROP_OTP_HASH]: hashPassword(otp),
        [PROP_OTP_EXPIRES]: String(expiresAt),
        [PROP_OTP_ATTEMPTS]: "0",
        [PROP_OTP_USERNAME]: username
    }, false);

    try {
        MailApp.sendEmail({
            to: storedRecoveryEmail,
            subject: "SURYA ADMIN: Password Reset OTP",
            body:
                "Your SURYA Computer admin password reset OTP is: " + otp +
                "\n\nThis OTP expires in 10 minutes and can be used only a limited number of times." +
                "\n\nIf you did not request this, ignore this email and review your admin security alerts."
        });
    } catch (error) {
        props.deleteProperty(PROP_OTP_HASH);
        props.deleteProperty(PROP_OTP_EXPIRES);
        props.deleteProperty(PROP_OTP_ATTEMPTS);
        props.deleteProperty(PROP_OTP_USERNAME);
        console.error("ADMIN OTP EMAIL ERROR:", error);
    }

    return generic;
}


/* ==================================================
   PASSWORD RECOVERY - RESET WITH OTP
================================================== */

function resetAdminPasswordWithOtp(username, otp, newPassword) {

    username = String(username || "").trim();
    otp = String(otp || "").trim();
    newPassword = String(newPassword || "");

    const props = PropertiesService.getScriptProperties();
    const storedUsername = props.getProperty(PROP_USERNAME) || "";

    if (!username || username !== storedUsername) {
        return jsonResponse({ success: false, message: "Invalid password reset request." });
    }

    if (newPassword.length < 10) {
        return jsonResponse({ success: false, message: "New password must contain at least 10 characters." });
    }

    const expiresAt = Number(props.getProperty(PROP_OTP_EXPIRES) || "0");
    const attempts = Number(props.getProperty(PROP_OTP_ATTEMPTS) || "0");
    const storedOtpHash = props.getProperty(PROP_OTP_HASH) || "";

    if (!storedOtpHash || !expiresAt || expiresAt <= Date.now()) {
        return jsonResponse({ success: false, message: "OTP expired. Request a new OTP." });
    }

    if (attempts >= ADMIN_MAX_OTP_ATTEMPTS) {
        return jsonResponse({ success: false, message: "Too many OTP attempts. Request a new OTP." });
    }

    props.setProperty(PROP_OTP_ATTEMPTS, String(attempts + 1));

    if (hashPassword(otp) !== storedOtpHash) {
        return jsonResponse({
            success: false,
            message: "Invalid OTP.",
            remainingAttempts: Math.max(0, ADMIN_MAX_OTP_ATTEMPTS - attempts - 1)
        });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
        props.setProperty(PROP_PASSWORD_HASH, hashPassword(newPassword));
        revokeAllAdminSessions();

        props.deleteProperty(PROP_OTP_HASH);
        props.deleteProperty(PROP_OTP_EXPIRES);
        props.deleteProperty(PROP_OTP_ATTEMPTS);
        props.deleteProperty(PROP_OTP_USERNAME);

        sendAdminSecurityAlert(
            "ADMIN PASSWORD RESET",
            "The admin password was reset successfully using the registered recovery OTP."
        );

        return jsonResponse({
            success: true,
            message: "Admin password reset successfully. Please login again."
        });
    }
    finally {
        lock.releaseLock();
    }
}


/* ==================================================
   CLIENT SECURITY EVENT / DEVICE ALERT
================================================== */

function recordAdminSecurityEvent(token, eventType, clientInfo) {

    if (!verifyAdminSession(token)) {
        return jsonResponse({ success: false, authenticated: false, message: "Unauthorized." });
    }

    eventType = String(eventType || "SECURITY EVENT").trim().toUpperCase();
    clientInfo = clientInfo || {};

    const props = PropertiesService.getScriptProperties();
    const deviceId = String(clientInfo.deviceId || "unknown").trim().slice(0, 120);
    const deviceKey = PROP_DEVICE_PREFIX + hashPassword(deviceId).slice(0, 32);
    const existing = props.getProperty(deviceKey);
    const isNewDevice = !existing;

    const data = {
        deviceId: deviceId,
        browser: String(clientInfo.browser || "Unknown").slice(0, 120),
        platform: String(clientInfo.platform || "Unknown").slice(0, 120),
        userAgent: String(clientInfo.userAgent || "Unknown").slice(0, 500),
        language: String(clientInfo.language || "Unknown").slice(0, 80),
        timezone: String(clientInfo.timezone || "Unknown").slice(0, 100),
        screen: String(clientInfo.screen || "Unknown").slice(0, 80),
        latitude: clientInfo.latitude === null || clientInfo.latitude === undefined ? "Unavailable" : String(clientInfo.latitude),
        longitude: clientInfo.longitude === null || clientInfo.longitude === undefined ? "Unavailable" : String(clientInfo.longitude),
        lastSeen: new Date().toISOString()
    };

    props.setProperty(deviceKey, JSON.stringify(data));

    const subject =
        eventType === "LOGIN" && isNewDevice
            ? "NEW ADMIN BROWSER / DEVICE LOGIN"
            : "ADMIN " + eventType;

    let body =
        "SURYA Computer admin security event\n\n" +
        "Event: " + eventType + "\n" +
        "New Browser/Device: " + (isNewDevice ? "YES" : "NO") + "\n" +
        "Time: " + new Date().toString() + "\n" +
        "Browser: " + data.browser + "\n" +
        "Platform: " + data.platform + "\n" +
        "Language: " + data.language + "\n" +
        "Timezone: " + data.timezone + "\n" +
        "Screen: " + data.screen + "\n" +
        "Approx browser location: " +
        (data.latitude === "Unavailable" ? "Not provided" : data.latitude + ", " + data.longitude) +
        "\n\nUser-Agent:\n" + data.userAgent;

    sendAdminSecurityAlert(subject, body);

    return jsonResponse({ success: true, newDevice: isNewDevice });
}


/* ==================================================
   EMERGENCY ADMIN LOCK - SEPARATE PASSWORD
================================================== */

function emergencyLockAdmin(password) {
    const props = PropertiesService.getScriptProperties();
    const now = Date.now();
    const windowStart = Number(props.getProperty(PROP_EMERGENCY_WINDOW) || "0");
    let attempts = Number(props.getProperty(PROP_EMERGENCY_ATTEMPTS) || "0");

    if (!windowStart || now - windowStart > EMERGENCY_WINDOW_MS) {
        attempts = 0;
        props.setProperty(PROP_EMERGENCY_WINDOW, String(now));
        props.setProperty(PROP_EMERGENCY_ATTEMPTS, "0");
    }

    if (attempts >= EMERGENCY_MAX_ATTEMPTS) {
        return jsonResponse({success:false,message:"Too many emergency password attempts. Try again later."});
    }

    const suppliedHash = hashPassword(password);
    if (suppliedHash !== EMERGENCY_LOCK_PASSWORD_HASH) {
        attempts += 1;
        props.setProperty(PROP_EMERGENCY_ATTEMPTS, String(attempts));
        return jsonResponse({success:false,message:"Invalid emergency password."});
    }

    props.deleteProperty(PROP_EMERGENCY_ATTEMPTS);
    props.deleteProperty(PROP_EMERGENCY_WINDOW);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
        const until = now + (24 * 60 * 60 * 1000);
        props.setProperty(PROP_LOCK_UNTIL, String(until));
        props.setProperty(PROP_FAILED_ATTEMPTS, "0");
        revokeAllAdminSessions();
        sendAdminSecurityAlert(
            "EMERGENCY ADMIN LOCK ACTIVATED",
            "The separate emergency lock password was accepted.\n\n" +
            "All Admin sessions were revoked and new Admin login is blocked for 24 hours.\n" +
            "Public website, student portal, mock tests, admissions and other public services remain active.\n\n" +
            "Lock until: " + new Date(until).toString()
        );
        return jsonResponse({success:true,locked:true,lockUntil:until,message:"Admin login locked for 24 hours. Public services remain active."});
    } finally {
        lock.releaseLock();
    }
}


/* ==================================================
   EMERGENCY ADMIN LOCK - ADMIN SESSION
================================================== */

function lockAdminFor24Hours(token) {

    if (!verifyAdminSession(token)) {
        return jsonResponse({
            success: false,
            authenticated: false,
            message: "Unauthorized."
        });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
        const props = PropertiesService.getScriptProperties();
        const until = Date.now() + (24 * 60 * 60 * 1000);
        props.setProperty(PROP_LOCK_UNTIL, String(until));
        props.setProperty(PROP_FAILED_ATTEMPTS, "0");
        revokeAllAdminSessions();

        sendAdminSecurityAlert(
            "ADMIN ACCESS LOCKED FOR 24 HOURS",
            "Emergency admin lock was activated.\n\n" +
            "Admin login is blocked for 24 hours.\n" +
            "Public website, student portal, mock tests and admission system remain available.\n\n" +
            "Lock until: " + new Date(until).toString()
        );

        return jsonResponse({
            success: true,
            locked: true,
            lockUntil: until,
            message: "Admin login locked for 24 hours. Public services remain active."
        });
    } finally {
        lock.releaseLock();
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