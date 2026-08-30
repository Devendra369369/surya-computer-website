/* ==================================================
   AERON NOTIFICATIONS v1.0
================================================== */

"use strict";

const AERON_NOTIFICATION_SHEET = "AERON_NOTIFICATIONS";

function aeronNotificationEnsureSheet_() {
  const ss = getSuryaSpreadsheet();
  let sh = ss.getSheetByName(AERON_NOTIFICATION_SHEET);
  const headers = ["Notification ID","Type","Title","Message","Page","Status","Created At","Handled At"];
  if (!sh) {
    sh = ss.insertSheet(AERON_NOTIFICATION_SHEET);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function aeronNotificationSave_(type,title,message,page) {
  const sh = aeronNotificationEnsureSheet_();
  const id = "AERON-NOTIFY-" + Utilities.getUuid().replace(/-/g,"").slice(0,12).toUpperCase();
  sh.appendRow([id,String(type||"GENERAL").slice(0,40),String(title||"").slice(0,160),String(message||"").slice(0,3000),String(page||"").slice(0,120),"New",new Date(),""]);
  return id;
}

function aeronAdminEmailList_() {
  if (typeof ADMIN_ALERT_EMAILS !== "undefined" && Array.isArray(ADMIN_ALERT_EMAILS) && ADMIN_ALERT_EMAILS.length) {
    return ADMIN_ALERT_EMAILS.join(",");
  }
  return "sunilkumar5757@gmail.com";
}

function aeronNotifyAdmins_(type,title,message,page,sendEmail) {
  try {
    const id = aeronNotificationSave_(type,title,message,page);
    if (sendEmail !== false) {
      MailApp.sendEmail({
        to: aeronAdminEmailList_(),
        subject: "AERON — " + String(title || "Notification").slice(0,120),
        htmlBody:
          "<p><b>" + escapeHtml_(title) + "</b></p>" +
          "<p>" + escapeHtml_(message).replace(/\n/g,"<br>") + "</p>" +
          (page ? "<p><small>Page: " + escapeHtml_(page) + "</small></p>" : "") +
          "<p><small>Notification ID: " + escapeHtml_(id) + "</small></p>"
      });
    }
    return {success:true,notificationId:id};
  } catch (e) {
    return {success:false,message:String(e && e.message || e)};
  }
}

function aeronNotifyNewAdmission_(data) {
  return aeronNotifyAdmins_(
    "NEW_ADMISSION",
    "New Admission Application",
    "Application " + String(data.applicationId || "") +
      "\nStudent: " + String(data.studentName || "") +
      "\nCourse: " + String(data.course || "") +
      "\nMobile: " + String(data.mobile || ""),
    "admission.html",
    true
  );
}

function aeronNotifyHelpRequest_(data) {
  return aeronNotifyAdmins_(
    "HELP_REQUEST",
    "AERON Help Request",
    String(data.message || "") +
      "\nPage: " + String(data.page || ""),
    String(data.page || ""),
    true
  );
}

function aeronAdminNotifications_(token) {
  if (!verifyAdminSession(String(token || ""))) {
    return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  }
  const sh = aeronNotificationEnsureSheet_();
  if (sh.getLastRow() < 2) return aeronResponse_("<strong>📨 Notifications</strong><p>No notifications yet.</p>", {notifications:[]});
  const h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(x){return String(x).trim();});
  const rows = sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues()
    .map(function(r){const o={};h.forEach(function(k,j){o[k]=r[j];});return o;})
    .sort(function(a,b){return new Date(b["Created At"]||0)-new Date(a["Created At"]||0);})
    .slice(0,30);
  const items = rows.map(function(n){
    return "<li><b>"+escapeHtml_(n["Title"]||"Notification")+"</b><br>"+escapeHtml_(n["Message"]||"").replace(/\n/g,"<br>")+"</li>";
  }).join("");
  return aeronResponse_("<strong>📨 Notifications</strong><ul>"+items+"</ul>", {notifications:rows, admin:true});
}

function aeronPublicHelp_(data) {
  const message = aeronCleanText_(data.message,1500);
  if (!message) return {success:false,message:"Help message is required."};
  return aeronNotifyHelpRequest_(data);
}
