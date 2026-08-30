/* ==================================================
   AERON MEMORY v1.0
   Opt-in, scoped persistence
================================================== */

"use strict";

const AERON_MEMORY_SHEET = "AERON_MEMORY";

function aeronMemoryEnsureSheet_() {
  const ss = getSuryaSpreadsheet();
  let sh = ss.getSheetByName(AERON_MEMORY_SHEET);
  const headers = ["Memory ID","Owner Type","Owner ID","Memory Key","Memory Value","Consent","Status","Created At","Updated At"];
  if (!sh) {
    sh = ss.insertSheet(AERON_MEMORY_SHEET);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function aeronMemoryOwner_(token) {
  token = String(token || "").trim();
  if (token && verifyAdminSession(token)) {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_SESSION_PREFIX + token);
    try {
      const s = JSON.parse(raw || "{}");
      return {type:"admin", id:"admin:" + String(s.username || "admin")};
    } catch (_) { return {type:"admin", id:"admin"}; }
  }
  if (token && verifyStudentSession(token)) {
    try {
      const s = studentSession_(token);
      return {type:"student", id:"student:" + String(s.studentId || "").trim().toUpperCase()};
    } catch (_) {}
  }
  return null;
}

function aeronMemoryRows_(owner) {
  const sh = aeronMemoryEnsureSheet_();
  if (!owner || sh.getLastRow() < 2) return [];
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(x){return String(x).trim();});
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues()
    .map(function(r,i){
      const o={_row:i+2}; headers.forEach(function(h,j){o[h]=r[j];}); return o;
    })
    .filter(function(r){
      return String(r["Owner Type"]||"")===owner.type &&
             String(r["Owner ID"]||"")===owner.id &&
             String(r["Status"]||"Active").toLowerCase()==="active";
    });
}

function aeronMemorySave_(token, key, value, consent) {
  const owner = aeronMemoryOwner_(token);
  if (!owner) return {success:false,message:"Persistent memory requires a signed-in student or authenticated admin session."};
  if (!consent) return {success:false,message:"Memory was not saved because consent was not provided."};
  key = aeronCleanText_(key,80);
  value = aeronCleanText_(value,500);
  if (!key || !value) return {success:false,message:"Memory key and value are required."};

  const sh = aeronMemoryEnsureSheet_();
  const rows = aeronMemoryRows_(owner);
  const existing = rows.find(function(r){return String(r["Memory Key"])===key;});
  const now = new Date();
  if (existing) {
    sh.getRange(existing._row,5).setValue(value);
    sh.getRange(existing._row,6).setValue("Yes");
    sh.getRange(existing._row,7).setValue("Active");
    sh.getRange(existing._row,9).setValue(now);
    return {success:true,message:"Memory updated."};
  }
  const id = "AERON-MEM-" + Utilities.getUuid().replace(/-/g,"").slice(0,12).toUpperCase();
  sh.appendRow([id,owner.type,owner.id,key,value,"Yes","Active",now,now]);
  return {success:true,memoryId:id,message:"Memory saved."};
}

function aeronMemoryGet_(token) {
  const owner = aeronMemoryOwner_(token);
  if (!owner) return {success:false,message:"Persistent memory requires a signed-in student or authenticated admin session."};
  return {success:true,memory:aeronMemoryRows_(owner).map(function(r){return {key:String(r["Memory Key"]),value:String(r["Memory Value"])};})};
}
