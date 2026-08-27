/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : Media.gs
   Purpose : Admin-managed public image gallery
================================================== */
"use strict";

const SURYA_MEDIA_SHEET = "PublicMedia";
const SURYA_MEDIA_FOLDER_NAME = "SURYA_PUBLIC_MEDIA";
const SURYA_MEDIA_MAX_BYTES = 2 * 1024 * 1024;
const SURYA_MEDIA_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function mediaEnsureSheet_() {
  const ss = getSuryaSpreadsheet();
  let sh = ss.getSheetByName(SURYA_MEDIA_SHEET);
  const headers = ["Media ID","Title","Category","File ID","URL","MIME Type","Size Bytes","Status","Sort Order","Created At","Updated At"];
  if (!sh) {
    sh = ss.insertSheet(SURYA_MEDIA_SHEET);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  } else {
    const existing = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(x=>String(x).trim());
    if (existing.indexOf("Category") < 0) {
      sh.insertColumnAfter(2);
      sh.getRange(1,3).setValue("Category");
    }
  }
  return sh;
}

function mediaRows_() {
  const sh = mediaEnsureSheet_();
  if (sh.getLastRow() < 2) return [];
  const h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map((r,i)=>{
    const o = {_row:i+2}; h.forEach((k,j)=>o[String(k).trim()]=r[j]); return o;
  });
}

function mediaFolder_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SURYA_PUBLIC_MEDIA_FOLDER_ID");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) {}
  }
  const it = DriveApp.getFoldersByName(SURYA_MEDIA_FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(SURYA_MEDIA_FOLDER_NAME);
  props.setProperty("SURYA_PUBLIC_MEDIA_FOLDER_ID", folder.getId());
  return folder;
}

function mediaBase64Bytes_(value) {
  const s = String(value || "").replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (!s) return 0;
  return Math.floor((s.length * 3) / 4) - (s.endsWith("==") ? 2 : s.endsWith("=") ? 1 : 0);
}

function mediaMimeFromData_(data, supplied) {
  const m = String(supplied || "").toLowerCase().trim();
  if (SURYA_MEDIA_ALLOWED_TYPES.indexOf(m) >= 0) return m;
  const hit = String(data || "").match(/^data:(image\/(?:jpeg|png|webp));base64,/i);
  return hit ? hit[1].toLowerCase() : "";
}

function mediaUpload_(token, data) {
  if (!verifyAdminSession(String(token || ""))) return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  const title = String(data && data.title || "").trim().slice(0,100);
  const category = String(data && data.category || "Institute").trim().slice(0,60) || "Institute";
  const image = String(data && data.image || "");
  const mime = mediaMimeFromData_(image, data && data.mimeType);
  if (!title) return {success:false,message:"Image title is required."};
  if (!mime) return {success:false,message:"Only JPG, PNG and WebP images are allowed."};
  const bytes = mediaBase64Bytes_(image);
  if (!bytes || bytes > SURYA_MEDIA_MAX_BYTES) return {success:false,message:"Image must be between 1 byte and 2 MB."};

  const clean = image.replace(/^data:[^;]+;base64,/, "");
  const ext = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
  const fileName = "SURYA_MEDIA_" + Utilities.getUuid().replace(/-/g,"").slice(0,12) + ext;
  const blob = Utilities.newBlob(Utilities.base64Decode(clean), mime, fileName);
  const file = mediaFolder_().createFile(blob);
  file.setName(fileName);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  const url = "https://drive.google.com/uc?export=view&id=" + file.getId();
  const sh = mediaEnsureSheet_();
  const id = "MEDIA-" + Utilities.getUuid().replace(/-/g,"").slice(0,12).toUpperCase();
  const sort = Math.max(0, ...mediaRows_().map(r => Number(r["Sort Order"] || 0))) + 1;
  sh.appendRow([id,title,category,file.getId(),url,mime,bytes,"Published",sort,new Date(),new Date()]);
  return {success:true,message:"Image uploaded successfully.",media:{id:id,title:title,category:category,url:url,mimeType:mime,sizeBytes:bytes,status:"Published",sortOrder:sort}};
}

function mediaListPublic_() {
  const rows = mediaRows_().filter(r=>String(r["Status"]||"").toLowerCase()==="published");
  rows.sort((a,b)=>Number(a["Sort Order"]||0)-Number(b["Sort Order"]||0));
  return {success:true,media:rows.map(r=>({id:r["Media ID"],title:r["Title"],url:r["URL"],category:r["Category"]||"Institute",mimeType:r["MIME Type"],sortOrder:r["Sort Order"]}))};
}

function mediaListAdmin_(token) {
  if (!verifyAdminSession(String(token || ""))) return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  const rows = mediaRows_();
  rows.sort((a,b)=>Number(a["Sort Order"]||0)-Number(b["Sort Order"]||0));
  return {success:true,media:rows.map(r=>({id:r["Media ID"],title:r["Title"],fileId:r["File ID"],url:r["URL"],category:r["Category"]||"Institute",mimeType:r["MIME Type"],sizeBytes:r["Size Bytes"],status:r["Status"],sortOrder:r["Sort Order"]}))};
}

function mediaDelete_(token, mediaId) {
  if (!verifyAdminSession(String(token || ""))) return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  const id = String(mediaId || "").trim();
  const sh = mediaEnsureSheet_();
  const row = mediaRows_().find(r=>String(r["Media ID"])===id);
  if (!row) return {success:false,message:"Image not found."};
  try { DriveApp.getFileById(String(row["File ID"])).setTrashed(true); } catch (e) {}
  sh.deleteRow(row._row);
  return {success:true,message:"Image deleted."};
}
