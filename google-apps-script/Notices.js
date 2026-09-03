/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File: Notices.gs
   Purpose: Secure public notice management
================================================== */
"use strict";

const SURYA_NOTICE_SHEET = "Notices";

function noticeEnsureSheet_(){
  const ss=getSuryaSpreadsheet();
  let sh=ss.getSheetByName(SURYA_NOTICE_SHEET);
  const h=["Notice ID","Title","Message","Category","Status","Priority","Created At","Updated At"];
  if(!sh){sh=ss.insertSheet(SURYA_NOTICE_SHEET);sh.getRange(1,1,1,h.length).setValues([h]);sh.setFrozenRows(1);}
  return sh;
}
function noticeRows_(){
  const sh=noticeEnsureSheet_(); if(sh.getLastRow()<2)return [];
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(x=>String(x).trim());
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o;});
}
function noticeId_(){return "NOTICE-"+Utilities.getUuid().replace(/-/g,"").slice(0,12).toUpperCase();}
function noticeClean_(r){return {id:String(r["Notice ID"]||""),title:String(r.Title||""),message:String(r.Message||""),category:String(r.Category||"General"),status:String(r.Status||"Published"),priority:String(r.Priority||"Normal"),createdAt:r["Created At"]||"",updatedAt:r["Updated At"]||""};}
function publicNotices_(){
  const rows=noticeRows_().filter(r=>String(r.Status||"").toLowerCase()==="published");
  rows.sort((a,b)=>{const pa=String(a.Priority||"").toLowerCase()==="high"?0:1,pb=String(b.Priority||"").toLowerCase()==="high"?0:1;if(pa!==pb)return pa-pb;return new Date(b["Updated At"]||0)-new Date(a["Updated At"]||0);});
  return {success:true,notices:rows.slice(0,30).map(noticeClean_)};
}
function adminNotices_(token){
  if(!verifyAdminSession(String(token||"")))return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  return {success:true,notices:noticeRows_().sort((a,b)=>b._row-a._row).map(noticeClean_)};
}
function saveNotice_(token,n){
  if(!verifyAdminSession(String(token||"")))return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  const title=String(n.title||"").trim().slice(0,120),message=String(n.message||"").trim().slice(0,4000);
  if(!title||!message)throw new Error("Notice title and message are required.");
  const category=String(n.category||"General").trim().slice(0,60)||"General";
  const priority=["Normal","High"].includes(String(n.priority||"Normal"))?String(n.priority||"Normal"):"Normal";
  const status=["Published","Draft"].includes(String(n.status||"Published"))?String(n.status||"Published"):"Published";
  const sh=noticeEnsureSheet_(),rows=noticeRows_(),id=String(n.id||"").trim(),existing=rows.find(r=>String(r["Notice ID"])===id),now=new Date();
  const row=[existing?existing["Notice ID"]:noticeId_(),title,message,category,status,priority,existing?existing["Created At"]:now,now];
  if(existing)sh.getRange(existing._row,1,1,row.length).setValues([row]);else sh.appendRow(row);
  return {success:true,message:existing?"Notice updated successfully.":"Notice published successfully.",notice:noticeClean_({"Notice ID":row[0],Title:row[1],Message:row[2],Category:row[3],Status:row[4],Priority:row[5],"Created At":row[6],"Updated At":row[7]})};
}
function deleteNotice_(token,id){
  if(!verifyAdminSession(String(token||"")))return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  const sh=noticeEnsureSheet_(),row=noticeRows_().find(r=>String(r["Notice ID"])===String(id||""));if(!row)return {success:false,message:"Notice not found."};sh.deleteRow(row._row);return {success:true,message:"Notice deleted."};
}
