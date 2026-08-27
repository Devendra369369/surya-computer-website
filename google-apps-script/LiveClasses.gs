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
function liveEnsureSheet_(){const ss=SpreadsheetApp.getActiveSpreadsheet();let sh=ss.getSheetByName(LIVE_CLASS_SHEET);if(!sh){sh=ss.insertSheet(LIVE_CLASS_SHEET);sh.getRange(1,1,1,10).setValues([["Class ID","Title","Course","Teacher","Date","Start Time","End Time","Join URL","Description","Status"]]);}return sh;}
function liveRows_(){const sh=liveEnsureSheet_();if(sh.getLastRow()<2)return [];const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map((r,i)=>{const o={_row:i+2};h.forEach((x,j)=>o[String(x).trim()]=r[j]);return o;});}
function liveId_(){return "SC-LIVE-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase();}
function liveList_(studentToken){const s=studentSession_(studentToken),student=studentPublicProfile_(s.studentId),course=String(student.Course||"").trim().toLowerCase();return {success:true,classes:liveRows_().filter(r=>String(r.Status||"").toLowerCase()==="published"&&(!String(r.Course||"").trim()||String(r.Course).trim().toLowerCase()===course)).map(r=>{delete r._row;return r;})};}
function liveAdminList_(token){if(!verifyAdminSession(token))throw new Error("Unauthorized. Admin login required.");return {success:true,classes:liveRows_().map(r=>{delete r._row;return r;})};}
function liveSave_(token,c){if(!verifyAdminSession(token))throw new Error("Unauthorized. Admin login required.");const sh=liveEnsureSheet_(),rows=liveRows_(),id=String(c.classId||"").trim()||liveId_(),old=rows.find(r=>String(r["Class ID"])===id);const obj={"Class ID":id,"Title":String(c.title||""),"Course":String(c.course||""),"Teacher":String(c.teacher||""),"Date":String(c.date||""),"Start Time":String(c.startTime||""),"End Time":String(c.endTime||""),"Join URL":String(c.joinUrl||""),"Description":String(c.description||""),"Status":String(c.status||"Draft")};const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(x=>String(x).trim()),arr=h.map(k=>obj[k]??"");if(old)sh.getRange(old._row,1,1,h.length).setValues([arr]);else sh.appendRow(arr);return {success:true,class:obj};}
function liveDelete_(token,id){if(!verifyAdminSession(token))throw new Error("Unauthorized. Admin login required.");const sh=liveEnsureSheet_(),r=liveRows_().find(x=>String(x["Class ID"])===String(id));if(!r)throw new Error("Class not found.");sh.deleteRow(r._row);return {success:true};}
