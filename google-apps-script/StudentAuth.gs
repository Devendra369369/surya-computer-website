/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File: StudentAuth.gs
   Version: v1.0.0
   Purpose: Secure Student Login / Password Reset
================================================== */
"use strict";

const STUDENT_AUTH_SHEET = "StudentAuth";
const STUDENT_SESSION_PREFIX = "SURYA_STUDENT_SESSION_";
const STUDENT_SESSION_SECONDS = 6 * 60 * 60;
const STUDENT_OTP_SECONDS = 10 * 60;
const STUDENT_MAX_OTP_ATTEMPTS = 5;

function studentAuthEnsureSheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName(STUDENT_AUTH_SHEET);
  if(!sh){
    sh=ss.insertSheet(STUDENT_AUTH_SHEET);
    sh.getRange(1,1,1,10).setValues([[
      "Student ID","Password Hash","Salt","Email","OTP Hash","OTP Expires","OTP Attempts","Status","Created At","Updated At"
    ]]);
  }
  return sh;
}

function studentAuthRows_(){
  const sh=studentAuthEnsureSheet_();
  if(sh.getLastRow()<2)return [];
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const v=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  return v.map((r,i)=>{const o={_row:i+2};h.forEach((x,j)=>o[String(x).trim()]=r[j]);return o;});
}
function studentAuthHash_(value,salt){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(salt||"")+"::"+String(value||""));
  return bytes.map(b=>{const n=b<0?b+256:b;return (n<16?"0":"")+n.toString(16);}).join("");
}
function studentAuthRandom_(n){return Utilities.getUuid().replace(/-/g,"").slice(0,n||24);}
function studentAuthNow_(){return new Date();}
function studentAuthStudent_(studentId){
  const id=String(studentId||"").trim().toUpperCase();
  if(!id)throw new Error("Student ID is required.");
  const sh=getSheet("Students"), vals=sh.getDataRange().getValues();
  if(vals.length<2)throw new Error("Student not found.");
  const h=vals[0].map(x=>String(x).trim());
  for(let i=1;i<vals.length;i++){
    if(String(vals[i][0]||"").trim().toUpperCase()===id){
      const o={};h.forEach((k,j)=>o[k]=vals[i][j]);return o;
    }
  }
  throw new Error("Student not found.");
}
function studentAuthRow_(studentId){
  const id=String(studentId||"").trim().toUpperCase();
  return studentAuthRows_().find(r=>String(r["Student ID"]||"").trim().toUpperCase()===id)||null;
}
function studentAuthSaveRow_(data){
  const sh=studentAuthEnsureSheet_(), rows=studentAuthRows_();
  const existing=rows.find(r=>String(r["Student ID"]||"").trim().toUpperCase()===String(data.studentId).trim().toUpperCase());
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(x=>String(x).trim());
  const obj={
    "Student ID":data.studentId,
    "Password Hash":data.passwordHash||existing?.["Password Hash"]||"",
    "Salt":data.salt||existing?.["Salt"]||"",
    "Email":data.email||existing?.["Email"]||"",
    "OTP Hash":data.otpHash||existing?.["OTP Hash"]||"",
    "OTP Expires":data.otpExpires !== undefined ? data.otpExpires : (existing ? existing["OTP Expires"] : ""),
    "OTP Attempts":data.otpAttempts !== undefined ? data.otpAttempts : (existing ? existing["OTP Attempts"] : 0),
    "Status":data.status||existing?.["Status"]||"Active",
    "Created At":existing?.["Created At"]||studentAuthNow_(),
    "Updated At":studentAuthNow_()
  };
  const arr=h.map(k=>obj[k]??"");
  if(existing)sh.getRange(existing._row,1,1,h.length).setValues([arr]);else sh.appendRow(arr);
  return obj;
}
function studentSessionKey_(token){return STUDENT_SESSION_PREFIX+String(token||"");}
function studentCreateSession_(studentId){
  const token=studentAuthRandom_(48);
  PropertiesService.getScriptProperties().setProperty(studentSessionKey_(token),JSON.stringify({studentId:String(studentId).trim().toUpperCase(),expiresAt:Date.now()+STUDENT_SESSION_SECONDS*1000}));
  return token;
}
function verifyStudentSession(token){
  if(!token)return false;
  const raw=PropertiesService.getScriptProperties().getProperty(studentSessionKey_(token));
  if(!raw)return false;
  try{const s=JSON.parse(raw);if(!s.expiresAt||Date.now()>Number(s.expiresAt)){PropertiesService.getScriptProperties().deleteProperty(studentSessionKey_(token));return false;}return true;}catch(_){return false;}
}
function studentSession_(token){
  if(!verifyStudentSession(token))throw new Error("Student login expired. Please login again.");
  return JSON.parse(PropertiesService.getScriptProperties().getProperty(studentSessionKey_(token)));
}
function studentLogout_(token){if(token)PropertiesService.getScriptProperties().deleteProperty(studentSessionKey_(token));return {success:true};}

function studentPublicProfile_(studentId){
  const s=studentAuthStudent_(studentId);
  return {"Student ID":s["Student ID"]||s.ID||"","Student Name":s["Student Name"]||s.Name||"","Father Name":s["Father Name"]||"","Mother Name":s["Mother Name"]||"","Course":s.Course||"","Mobile":s.Mobile||"","Email":s.Email||s.email||"","Photo":s.Photo||"","Signature":s.Signature||"","Status":s.Status||""};
}

function studentLogin_(studentId,password){
  const s=studentAuthStudent_(studentId), id=String(s["Student ID"]||s.ID||studentId).trim().toUpperCase();
  if(String(s.Status||"Active").toLowerCase()==="inactive")throw new Error("Student account is inactive.");
  const row=studentAuthRow_(id);
  if(!row||!row["Password Hash"]||!row.Salt)throw new Error("Password is not set. Use Forgot Password to create your password.");
  if(studentAuthHash_(password,row.Salt)!==String(row["Password Hash"]))throw new Error("Invalid Student ID or password.");
  const token=studentCreateSession_(id);
  return {success:true,token,student:studentPublicProfile_(id),expiresIn:STUDENT_SESSION_SECONDS};
}

function studentRequestReset_(studentId,email){
  const s=studentAuthStudent_(studentId);const registered=String(s.Email||s.email||"").trim().toLowerCase();
  const supplied=String(email||"").trim().toLowerCase();
  if(!registered||!supplied||registered!==supplied)throw new Error("Student ID and registered email do not match.");
  const key="SURYA_STUDENT_OTP_"+Utilities.base64EncodeWebSafe(String(studentId).trim().toUpperCase()+"|"+registered).slice(0,40);
  const cache=CacheService.getScriptCache();
  if(cache.get(key))throw new Error("Please wait 60 seconds before requesting another OTP.");
  cache.put(key,"1",60);
  const otp=String(Math.floor(100000+Math.random()*900000));
  const salt=studentAuthRandom_(24);
  studentAuthSaveRow_({studentId:String(s["Student ID"]||studentId).trim(),email:registered,otpHash:studentAuthHash_(otp,salt),salt:salt,otpExpires:new Date(Date.now()+STUDENT_OTP_SECONDS*1000),otpAttempts:0,status:"Active"});
  MailApp.sendEmail({to:registered,subject:"Surya Computer – Student Password Reset OTP",htmlBody:"<p>Your password reset OTP is <b style='font-size:22px'>"+otp+"</b></p><p>Valid for 10 minutes. Do not share it with anyone.</p>"});
  return {success:true,message:"OTP sent to your registered email."};
}

function studentResetPassword_(studentId,email,otp,newPassword){
  const s=studentAuthStudent_(studentId), registered=String(s.Email||s.email||"").trim().toLowerCase();
  if(!registered||registered!==String(email||"").trim().toLowerCase())throw new Error("Student ID and registered email do not match.");
  if(String(newPassword||"").length<8)throw new Error("New password must contain at least 8 characters.");
  const row=studentAuthRow_(studentId);if(!row||!row["OTP Hash"]||!row["OTP Expires"]||new Date(row["OTP Expires"]).getTime()<Date.now())throw new Error("OTP expired. Request a new OTP.");
  const attempts=Number(row["OTP Attempts"]||0);if(attempts>=STUDENT_MAX_OTP_ATTEMPTS)throw new Error("Too many OTP attempts. Request a new OTP.");
  if(studentAuthHash_(otp,row.Salt)!==String(row["OTP Hash"])){
    studentAuthSaveRow_({studentId:s["Student ID"]||studentId,otpAttempts:attempts+1});
    throw new Error("Invalid OTP.");
  }
  const salt=studentAuthRandom_(24);studentAuthSaveRow_({studentId:s["Student ID"]||studentId,email:registered,passwordHash:studentAuthHash_(newPassword,salt),salt:salt,otpHash:"",otpExpires:"",otpAttempts:0,status:"Active"});
  return {success:true,message:"Password reset successfully. You can now login."};
}

function studentChangePassword_(token,currentPassword,newPassword){
  const session=studentSession_(token),id=session.studentId,row=studentAuthRow_(id);
  if(!row||studentAuthHash_(currentPassword,row.Salt)!==String(row["Password Hash"]||""))throw new Error("Current password is incorrect.");
  if(String(newPassword||"").length<8)throw new Error("New password must contain at least 8 characters.");
  const salt=studentAuthRandom_(24);studentAuthSaveRow_({studentId:id,passwordHash:studentAuthHash_(newPassword,salt),salt:salt});
  return {success:true,message:"Password changed successfully."};
}

function studentMe_(token){const s=studentSession_(token);return {success:true,student:studentPublicProfile_(s.studentId)};}

function studentAdminSetPassword_(token,studentId,newPassword){
  if(!verifyAdminSession(token))throw new Error("Unauthorized. Admin login required.");
  const s=studentAuthStudent_(studentId), pw=String(newPassword||"");
  if(pw.length<8)throw new Error("Password must contain at least 8 characters.");
  const salt=studentAuthRandom_(24);
  studentAuthSaveRow_({studentId:s["Student ID"]||studentId,email:s.Email||s.email||"",passwordHash:studentAuthHash_(pw,salt),salt:salt,otpHash:"",otpExpires:"",otpAttempts:0,status:"Active"});
  return {success:true,message:"Student password set successfully."};
}
