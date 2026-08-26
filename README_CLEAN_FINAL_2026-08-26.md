# SURYA COMPUTER OF EDUCATION CENTER — CLEAN FINAL PROJECT

## Architecture
- Public website pages are frontend-only and contain no admin credentials.
- Admin authentication, sessions, password recovery, device/browser detection and the 24-hour emergency lock are enforced server-side in Google Apps Script.
- Student login, mock tests and live classes use server-side student sessions.
- Results and certificates use the Results/ResultSubjects/Certificates backend.

## Admin entry
- Normal Admin login: `admin-login.html`
- Emergency 24-hour lock: `admin-emergency.html` (separate password; does not appear in the public dashboard)

## Security note
No website can truly hide HTML/JavaScript from a browser's View Source/DevTools. The protection therefore does **not** depend on hiding source code: sensitive operations are checked again by the Google Apps Script backend.

## Backend deployment
Deploy all `.gs` files from `google-apps-script/` together in the same Apps Script project. Update the API URL in frontend files only if the deployment URL changes.

## Emergency password
A separate emergency password was generated for this build. It is not stored in the project files or frontend code; only its SHA-256 hash is stored server-side. Keep the password private and change the hash after deployment if desired.
