# SURYA CIMP — Final Build

**Product:** CIMP — Computer Institute Management Platform  
**Organization:** SURYA COMPUTER OF EDUCATION CENTER  
**Developer:** Devendra Kumar  
**Technical Advisor:** AERON  

## What is included
- Public institute website, admissions, result/certificate verification, gallery and contact.
- Admin authentication with hashed password, sessions, lockout, recovery OTP and security events.
- Student login, password change and registered-email OTP reset.
- Mock Tests with admin management, published questions, server-side scoring, attempts and history.
- Live Classes and Notices.
- Admin-managed public gallery uploads stored in Google Drive and grouped by category.
- Two-page certificate print with subject-wise marks.
- Central Google Apps Script backend + Google Sheets database.

## IMPORTANT: Apps Script deployment
The frontend currently uses this central endpoint:
`https://script.google.com/macros/s/AKfycbziAiwAq8nTE-65FVdy8LbmQFBbLVoeukklrOK4uFAgNKZyyjY5bMBJSuOPTBgY5bVufw/exec`

The previously tested URL beginning with `AKfycbxm...` returned Google's **Page not found** page. That is a stale/invalid deployment URL, not a valid JSON API response. If this deployment is replaced, update the endpoint in the frontend before going live.

## First backend setup
1. Open the Apps Script project using the supplied `.clasp.json` / Script ID.
2. Import all `.gs` files from `google-apps-script/`.
3. On a fresh Apps Script project, run `initializeAdminSecurity()` once; copy the temporary credentials from the execution log and change the password immediately from Admin → Change Password.
4. Run `setupSuryaSheets()` once and authorize Sheets/Drive/Mail permissions.
5. Confirm all **16** sheets below exist.
6. Deploy as Web App: **Execute as Me** and **Who has access: Anyone** (or the equivalent allowed by the account).
7. If the deployment URL changes, update the single API endpoint in the HTML files.

## Student password flow
- When an application is approved, a Student ID is created and a StudentAuth record is initialized.
- Admin can set/reset the student's password from **Admin → Student Access**.
- The student can also use **Forgot Password** with the email registered in the Students sheet.
- OTP is emailed to that registered address; after OTP verification the student chooses a new password.
- Passwords are stored as salted SHA-256 hashes, not plain text.

## Mock Test flow
`MockTests → MockQuestions → published test → student submit → MockAttempts + MockAnswers → student history`
- Correct answers are never sent to the student question payload.
- Scoring is performed on the server.
- One student can submit a particular test only once.
- Time is checked server-side.

## Gallery flow
`Admin upload → Google Drive/SURYA_PUBLIC_MEDIA → PublicMedia → publicMedia API → Home/Gallery`
Allowed: JPG/PNG/WebP, max 2 MB per image. Choose a category during upload; Gallery creates separate category sections automatically.

## Contact flow
`Contact form → submitContactMessage → ContactMessages sheet + institute email`
A short per-email throttle and global burst guard reduce automated mail flooding.

## Admission abuse protection
The application endpoint uses a honeypot, minimum form time, payload/file-size limits, identity throttling, global burst throttling, duplicate detection and an atomic Apps Script lock. No web system can guarantee protection against every attack, but these controls reduce common automated flooding and duplicate submissions.

## Google Sheet tabs and headers
See `REDMAP_GOOGLE_SHEETS_FINAL.md` for the exact header map.
