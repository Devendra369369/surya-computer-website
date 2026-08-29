/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File: LiveClasses.gs
   Purpose: Student live-class access
================================================== */
"use strict";
const LIVE_CLASS_SHEET="LiveClasses";
const LIVE_NOTIFICATION_MINUTES = 15;
function liveEnsureSheet_(){
    const ss=getSuryaSpreadsheet();
    let sh=ss.getSheetByName(LIVE_CLASS_SHEET);

    if(!sh){
        sh=ss.insertSheet(LIVE_CLASS_SHEET);
        sh.getRange(1,1,1,11).setValues([[
            "Class ID",
            "Title",
            "Course",
            "Teacher",
            "Date",
            "Start Time",
            "End Time",
            "Join URL",
            "Description",
            "Status",
            "Notification Sent"
        ]]);
    }else{
        const lastCol=sh.getLastColumn();
        const headers=sh.getRange(1,1,1,lastCol).getValues()[0]
            .map(x=>String(x).trim());

        if(!headers.includes("Notification Sent")){
            sh.getRange(1,lastCol+1).setValue("Notification Sent");
        }
    }

    return sh;
}
function liveRows_(){const sh=liveEnsureSheet_();if(sh.getLastRow()<2)return [];const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map((r,i)=>{const o={_row:i+2};h.forEach((x,j)=>o[String(x).trim()]=r[j]);return o;});}
function liveId_(){return "SC-LIVE-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase();}
function liveList_(studentToken){const s=studentSession_(studentToken),student=studentPublicProfile_(s.studentId),course=String(student.Course||"").trim().toLowerCase();return {success:true,classes:liveRows_().filter(r=>String(r.Status||"").toLowerCase()==="published"&&(!String(r.Course||"").trim()||String(r.Course).trim().toLowerCase()===course)).map(r=>{delete r._row;return r;})};}
function liveAdminList_(token){if(!verifyAdminSession(token))throw new Error("Unauthorized. Admin login required.");return {success:true,classes:liveRows_().map(r=>{delete r._row;return r;})};}
function liveSave_(token,c){
    if(!verifyAdminSession(token))
        throw new Error("Unauthorized. Admin login required.");

    const sh = liveEnsureSheet_();
    const rows = liveRows_();

    const id =
        String(c.classId || "").trim() || liveId_();

    const old =
        rows.find(r =>
            String(r["Class ID"]) === id
        );

    const obj = {
        "Class ID": id,
        "Title": String(c.title || ""),
        "Course": String(c.course || ""),
        "Teacher": String(c.teacher || ""),
        "Date": String(c.date || ""),
        "Start Time": String(c.startTime || ""),
        "End Time": String(c.endTime || ""),
        "Join URL": String(c.joinUrl || ""),
        "Description": String(c.description || ""),
        "Status": String(c.status || "Draft")
    };

    const h =
        sh.getRange(
            1,
            1,
            1,
            sh.getLastColumn()
        )
        .getValues()[0]
        .map(x => String(x).trim());

    const arr =
        h.map(k => obj[k] ?? "");

    if(old){

        sh.getRange(
            old._row,
            1,
            1,
            h.length
        ).setNumberFormat("@");

        sh.getRange(
            old._row,
            1,
            1,
            h.length
        ).setValues([arr]);

    }else{

        const row =
            sh.getLastRow() + 1;

        sh.getRange(
            row,
            1,
            1,
            h.length
        ).setNumberFormat("@");

        sh.getRange(
            row,
            1,
            1,
            h.length
        ).setValues([arr]);
    }

    return {
        success: true,
        class: obj
    };
}

/* ==================================================
   LIVE CLASS EMAIL NOTIFICATION
   Sends notification 15 minutes before class
================================================== */

function liveNotificationNow_(){
    return new Date();
}

function liveParseDateTime_(dateValue, timeValue){
    const dateText = String(dateValue || "").trim();
    const timeText = String(timeValue || "").trim();

    if(!dateText || !timeText) return null;

    const parts = dateText.split(/[-\/]/);
    if(parts.length !== 3) return null;

    let year, month, day;

    if(parts[0].length === 4){
        year = Number(parts[0]);
        month = Number(parts[1]) - 1;
        day = Number(parts[2]);
    }else{
        month = Number(parts[0]) - 1;
        day = Number(parts[1]);
        year = Number(parts[2]);

        if(year < 100) year += 2000;
    }

    let hours = 0;
    let minutes = 0;

    const tm = timeText.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

    if(!tm) return null;

    hours = Number(tm[1]);
    minutes = Number(tm[2]);

    const ampm = String(tm[3] || "").toUpperCase();

    if(ampm === "PM" && hours < 12) hours += 12;
    if(ampm === "AM" && hours === 12) hours = 0;

    return new Date(year, month, day, hours, minutes, 0, 0);
}


function liveGetActiveStudentsByCourse_(course){
    const sh = getSheet("Students");
    const values = sh.getDataRange().getValues();

    if(values.length < 2) return [];

    const headers = values[0].map(x => String(x).trim());

    const courseKey = String(course || "").trim().toLowerCase();

    const courseIndex = headers.indexOf("Course");
    const emailIndex = headers.indexOf("Email");
    const statusIndex = headers.indexOf("Status");
    const nameIndex = headers.indexOf("Student Name");

    if(courseIndex < 0 || emailIndex < 0){
        throw new Error("Students sheet must contain Course and Email columns.");
    }

    return values.slice(1)
        .map(row => ({
            name: nameIndex >= 0 ? String(row[nameIndex] || "").trim() : "Student",
            email: String(row[emailIndex] || "").trim().toLowerCase(),
            course: String(row[courseIndex] || "").trim().toLowerCase(),
            status: statusIndex >= 0
                ? String(row[statusIndex] || "").trim().toLowerCase()
                : "active"
        }))
        .filter(student =>
            student.email &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email) &&
            student.course === courseKey &&
            (!student.status || student.status === "active")
        );
}


function liveSendClassNotification_(classRow){
    const course = String(classRow["Course"] || "").trim();

    const students = liveGetActiveStudentsByCourse_(course);

    if(!students.length){
        return {
            sent: 0,
            message: "No active students with valid email found for course: " + course
        };
    }

    const title = String(classRow["Title"] || "Live Class");
    const teacher = String(classRow["Teacher"] || "");
    const date = String(classRow["Date"] || "");
    const start = String(classRow["Start Time"] || "");
    const end = String(classRow["End Time"] || "");
    const joinUrl = String(classRow["Join URL"] || "").trim();
    const description = String(classRow["Description"] || "");

    let sent = 0;

    students.forEach(student => {

        const html =
            "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'>" +
            "<h2>🔴 Live Class Starting Soon</h2>" +
            "<p>Hello <b>" + escapeHtml_(student.name || "Student") + "</b>,</p>" +
            "<p>Your live class is scheduled to start in approximately <b>15 minutes</b>.</p>" +

            "<div style='padding:15px;border:1px solid #ddd;border-radius:10px'>" +
            "<p><b>📚 Class:</b> " + escapeHtml_(title) + "</p>" +
            "<p><b>📖 Course:</b> " + escapeHtml_(course) + "</p>" +
            "<p><b>👨‍🏫 Teacher:</b> " + escapeHtml_(teacher) + "</p>" +
            "<p><b>📅 Date:</b> " + escapeHtml_(date) + "</p>" +
            "<p><b>⏰ Time:</b> " + escapeHtml_(start) +
                " - " + escapeHtml_(end) + "</p>" +
            (description
                ? "<p>" + escapeHtml_(description) + "</p>"
                : "") +
            "</div>" +

            (joinUrl
                ? "<p style='margin-top:20px'>" +
                  "<a href='" + escapeHtml_(joinUrl) +
                  "' style='display:inline-block;padding:12px 20px;background:#1769aa;color:white;text-decoration:none;border-radius:8px'>" +
                  "🎥 Join Live Class" +
                  "</a></p>"
                : "") +

            "<p>— SURYA COMPUTER OF EDUCATION CENTER</p>" +
            "</div>";

        try{
            MailApp.sendEmail({
                to: student.email,
                subject: "🔴 Live Class Starting Soon – " + title,
                htmlBody: html
            });

            sent++;

        }catch(error){
            console.error(
                "LIVE CLASS EMAIL FAILED: " +
                student.email +
                " | " +
                error
            );
        }
    });

    return {
        sent: sent,
        total: students.length
    };
}


/* ==================================================
   CHECK LIVE CLASSES AND SEND NOTIFICATIONS
================================================== */

function checkLiveClassNotifications(){

    const lock = LockService.getScriptLock();

    /*
     * Prevent two trigger executions from processing
     * the same live class at the same time.
     */
    if(!lock.tryLock(30000)){
        console.log("LIVE NOTIFICATION: Another execution is already running.");
        return {
            success: false,
            message: "Another notification check is already running."
        };
    }

    try{

        const sh = liveEnsureSheet_();
        const rows = liveRows_();

        const now = liveNotificationNow_();

        let processed = 0;
        let sentClasses = 0;

        rows.forEach(row => {

            if(
                String(row["Status"] || "")
                    .trim()
                    .toLowerCase() !== "published"
            ){
                return;
            }

            /*
             * Already claimed/sent = never process again.
             */
            if(
                String(row["Notification Sent"] || "")
                    .trim()
                    .toLowerCase() === "yes"
            ){
                return;
            }

            const start = liveParseDateTime_(
                row["Date"],
                row["Start Time"]
            );

            if(!start) return;

            const diffMinutes =
                (start.getTime() - now.getTime()) / 60000;

            /*
             * Notification window:
             * 15 minutes before class
             * until 5 minutes before class.
             */
            if(
                diffMinutes <= LIVE_NOTIFICATION_MINUTES &&
                diffMinutes > 5
            ){

                processed++;

                /*
                 * CLAIM THE CLASS BEFORE SENDING.
                 *
                 * This is the important duplicate-protection step.
                 */
                const notificationCol =
                    Object.keys(row).findIndex(
                        key => key === "Notification Sent"
                    ) + 1;

                if(notificationCol <= 0){
                    console.error(
                        "Notification Sent column not found."
                    );
                    return;
                }

                /*
                 * Mark immediately so another execution
                 * cannot send the same notification again.
                 */
                sh.getRange(
                    row._row,
                    notificationCol
                ).setValue("Yes");

                SpreadsheetApp.flush();

                /*
                 * Now send the notification.
                 */
                try{

                    const result =
                        liveSendClassNotification_(row);

                    if(result.sent > 0 || result.total === 0){

                        sentClasses++;

                        console.log(
                            "LIVE CLASS NOTIFICATION SENT: " +
                            String(row["Class ID"] || "")
                        );

                    }else{

                        /*
                         * No valid students found.
                         * Keep Yes so the trigger does not
                         * repeatedly send/check the same class.
                         */
                        console.log(
                            "No valid students for class: " +
                            String(row["Class ID"] || "")
                        );
                    }

                }catch(error){

                    /*
                     * Do NOT reset Notification Sent.
                     * This guarantees duplicate protection even
                     * if the trigger encounters an error.
                     */
                    console.error(
                        "LIVE CLASS NOTIFICATION ERROR: " +
                        String(row["Class ID"] || "") +
                        " | " +
                        error
                    );
                }
            }
        });

        return {
            success: true,
            checked: rows.length,
            processed: processed,
            notificationsSent: sentClasses,
            checkedAt: now
        };

    }finally{

        lock.releaseLock();

    }
}

/* ==================================================
   CREATE / RESET NOTIFICATION TRIGGER
================================================== */

function setupLiveClassNotificationTrigger(){

    const triggers =
        ScriptApp.getProjectTriggers();

    triggers.forEach(trigger => {

        if(
            trigger.getHandlerFunction() ===
            "checkLiveClassNotifications"
        ){
            ScriptApp.deleteTrigger(trigger);
        }

    });

    ScriptApp.newTrigger(
        "checkLiveClassNotifications"
    )
    .timeBased()
    .everyMinutes(5)
    .create();

    return {
        success: true,
        message:
            "Live class notification trigger created. " +
            "It checks every 5 minutes and sends emails approximately 15 minutes before class."
    };
}


function liveDelete_(token,id){if(!verifyAdminSession(token))throw new Error("Unauthorized. Admin login required.");const sh=liveEnsureSheet_(),r=liveRows_().find(x=>String(x["Class ID"])===String(id));if(!r)throw new Error("Class not found.");sh.deleteRow(r._row);return {success:true};}
