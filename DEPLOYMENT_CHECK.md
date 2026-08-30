# CIMP Backend Deployment Check

The frontend is configured to use one central Apps Script `/exec` endpoint. Do not mix an old deployment URL into individual pages.

## Health check

Open the endpoint in a browser or run:

```bash
curl -L "<YOUR_CURRENT_EXEC_URL>"
```

Expected JSON includes:

```json
{"success":true,"message":"SURYA COMPUTER CENTRAL DATABASE API is working"}
```

If Google returns **Page not found / Sorry, unable to open the file at present**, the URL is a stale/invalid deployment address. Redeploy the Apps Script project and replace the endpoint in the HTML files.

## Fresh deployment order

1. Import all files from `google-apps-script/`.
2. Run `initializeAdminSecurity()` once on a fresh project.
3. Copy the temporary credentials from the Apps Script execution log and immediately change the password from Admin → Change Password.
4. Run `setupSuryaSheets()` once.
5. Authorize Sheets, Drive and Mail when prompted.
6. Deploy as a Web App, executing as the owner, with access allowed for the public API routes.
7. Put the resulting `/exec` URL into the frontend if it changed.
8. Test Admin login, Student login/OTP reset, Admission, Contact, Gallery upload, Notices, Results, Certificate print, Mock Test and Live Classes.


## AERON v2.1 deployment note
- Frontend custom keyboard and public fallback are static-file changes.
- The included Apps Script source contains the AERON public/admin routes. If the live web-app deployment is older than this source, run `clasp push` and update the web-app deployment before testing live courses/notices/admin AERON.
- Never expose admin tokens or AI provider keys in frontend files.
