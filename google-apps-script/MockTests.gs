/* =========================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File: MockTests.gs
   Purpose: Online Mock Test module
   Sheets:
   MockTests
   MockQuestions
   MockAttempts
   MockAnswers
   ========================================================= */

const MOCK_TEST_SHEET = "MockTests";
const MOCK_QUESTION_SHEET = "MockQuestions";
const MOCK_ATTEMPT_SHEET = "MockAttempts";
const MOCK_ANSWER_SHEET = "MockAnswers";

function mockEnsureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defs = {
    [MOCK_TEST_SHEET]: ["Test ID","Title","Course","Duration","Total Marks","Description","Status","Created At","Updated At"],
    [MOCK_QUESTION_SHEET]: ["Question ID","Test ID","Question","Option A","Option B","Option C","Option D","Correct Answer","Marks","Status","Created At","Updated At"],
    [MOCK_ATTEMPT_SHEET]: ["Attempt ID","Test ID","Test Title","Student ID","Student Name","Score","Total Marks","Percentage","Grade","Result","Submitted At"],
    [MOCK_ANSWER_SHEET]: ["Attempt ID","Question ID","Student ID","Question","Selected Answer","Correct Answer","Marks","Awarded Marks"]
  };
  Object.keys(defs).forEach(name=>{
    let sh=ss.getSheetByName(name);
    if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,defs[name].length).setValues([defs[name]]);}
  });
}

function mockHeaderMap_(sh){
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const m={};h.forEach((x,i)=>m[String(x).trim()]=i);return m;
}
function mockRows_(name){
  mockEnsureSheets_();
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if(sh.getLastRow()<2)return [];
  const map=mockHeaderMap_(sh),vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  return vals.map((r,ri)=>{const o={};Object.keys(map).forEach(k=>o[k]=r[map[k]]);o._row=ri+2;return o;});
}
function mockId_(prefix){return prefix+"-"+Utilities.getUuid().replace(/-/g,"").slice(0,12).toUpperCase();}
function mockDate_(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),"dd MMMM yyyy HH:mm:ss");}
function mockGrade_(p){p=Number(p);if(p>=90)return"A+";if(p>=80)return"A";if(p>=70)return"B+";if(p>=60)return"B";if(p>=50)return"C";if(p>=33)return"D";return"F";}
function mockStudentPassword_(studentId){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students");
  if(!sh)return null;
  const map=mockHeaderMap_(sh),rows=mockRows_("Students");
  const idKey=["Student ID","StudentID","ID","studentId"].find(k=>map[k]!==undefined);
  const pwKey=["Password","password","Student Password","Login Password"].find(k=>map[k]!==undefined);
  if(!idKey||!pwKey)return null;
  const row=rows.find(r=>String(r[idKey]).trim().toUpperCase()===String(studentId).trim().toUpperCase());
  if(!row)return null;
  const nameKey=["Student Name","Name","studentName"].find(k=>map[k]!==undefined);
  return {studentId:row[idKey],studentName:nameKey?row[nameKey]:"",password:String(row[pwKey]??"")};
}

function mockAdminGuard_(){
  const token=String(arguments[0]||"");
  if(typeof verifyAdminSession === "function" && !verifyAdminSession(token)) throw new Error("Unauthorized. Admin login required.");
  return true;
}

/* -------- ADMIN -------- */

function getMockTests_(){
  return mockRows_(MOCK_TEST_SHEET).map(r=>{
    delete r._row; return r;
  });
}
function getMockQuestions_(testId,publishedOnly){
  return mockRows_(MOCK_QUESTION_SHEET).filter(r=>{
    if(String(r["Test ID"])!==String(testId))return false;
    return !publishedOnly || String(r["Status"]).toLowerCase()==="published";
  }).map(r=>{delete r._row;return r;});
}

function apiMockTests_(token){mockAdminGuard_(token);return {success:true,tests:getMockTests_()};}
function apiSaveMockTest_(test,token){
  mockAdminGuard_(token);mockEnsureSheets_();
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOCK_TEST_SHEET);
  const map=mockHeaderMap_(sh),rows=mockRows_(MOCK_TEST_SHEET);
  let id=String(test.testId||"").trim();
  const now=mockDate_();
  if(!id)id=mockId_("SC-MOCK");
  const existing=rows.find(r=>String(r["Test ID"])===id);
  const values={
    "Test ID":id,"Title":String(test.title||"").trim(),"Course":String(test.course||"").trim(),
    "Duration":Number(test.duration||30),"Total Marks":Number(test.totalMarks||0),
    "Description":String(test.description||"").trim(),"Status":String(test.status||"Draft"),
    "Created At":existing?existing["Created At"]:now,"Updated At":now
  };
  const arr=Object.keys(map).map(k=>values[k]??"");
  if(existing)sh.getRange(existing._row,1,1,sh.getLastColumn()).setValues([arr]);
  else sh.appendRow(arr);
  return {success:true,test:values};
}
function apiSetMockTestStatus_(testId,status,token){
  mockAdminGuard_(token);const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOCK_TEST_SHEET),rows=mockRows_(MOCK_TEST_SHEET);
  const r=rows.find(x=>String(x["Test ID"])===String(testId));if(!r)throw new Error("Test not found.");
  const m=mockHeaderMap_(sh);sh.getRange(r._row,m["Status"]+1).setValue(status);sh.getRange(r._row,m["Updated At"]+1).setValue(mockDate_());
  return {success:true};
}
function apiMockQuestions_(testId,token){mockAdminGuard_(token);return {success:true,questions:getMockQuestions_(testId,false)};}
function apiSaveMockQuestion_(q,token){
  mockAdminGuard_(token);mockEnsureSheets_();
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOCK_QUESTION_SHEET),map=mockHeaderMap_(sh),rows=mockRows_(MOCK_QUESTION_SHEET);
  let id=String(q.questionId||"").trim();const now=mockDate_();if(!id)id=mockId_("Q");
  const existing=rows.find(r=>String(r["Question ID"])===id);
  const values={"Question ID":id,"Test ID":q.testId,"Question":q.question,"Option A":q.optionA,"Option B":q.optionB,"Option C":q.optionC,"Option D":q.optionD,"Correct Answer":String(q.correctAnswer||"A").toUpperCase(),"Marks":Number(q.marks||1),"Status":"Published","Created At":existing?existing["Created At"]:now,"Updated At":now};
  const arr=Object.keys(map).map(k=>values[k]??"");
  if(existing)sh.getRange(existing._row,1,1,sh.getLastColumn()).setValues([arr]);else sh.appendRow(arr);
  return {success:true,question:values};
}
function apiMockAttempts_(testId,token){mockAdminGuard_(token);return {success:true,attempts:mockRows_(MOCK_ATTEMPT_SHEET).filter(r=>String(r["Test ID"])===String(testId)).map(r=>{delete r._row;return r;})};}

/* -------- STUDENT -------- */

function apiPublishedMockTests_(token){
  const session=studentSession_(token);
  return {success:true,studentId:session.studentId,tests:getMockTests_().filter(t=>String(t["Status"]).toLowerCase()==="published")};
}
function apiPublishedMockQuestions_(token,testId){
  studentSession_(token);
  return {success:true,questions:getMockQuestions_(testId,true)};
}
function apiSubmitMockTest_(token,testId,answers){
  const session=studentSession_(token);
  const student=studentPublicProfile_(session.studentId);
  mockEnsureSheets_();
  const tests=getMockTests_(),test=tests.find(t=>String(t["Test ID"])===String(testId));
  if(!test||String(test["Status"]).toLowerCase()!=="published")throw new Error("Test is not available.");
  const qs=getMockQuestions_(testId,true);if(!qs.length)throw new Error("No published questions.");
  if(!Array.isArray(answers)||answers.length!==qs.length)throw new Error("Invalid answer data.");
  const attemptId=mockId_("ATT"),sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOCK_ATTEMPT_SHEET),ash=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOCK_ANSWER_SHEET);
  let score=0,total=0,review=[];
  qs.forEach((q,i)=>{
    const marks=Number(q["Marks"]||1),selected=String(answers[i]||"").toUpperCase(),correct=String(q["Correct Answer"]||"").toUpperCase(),award=selected===correct?marks:0;
    score+=award;total+=marks;
    review.push({question:q["Question"],yourAnswer:selected,correctAnswer:correct,correctText:q["Option "+correct]||"",marks,awarded:award});
    ash.appendRow([attemptId,q["Question ID"],session.studentId,q["Question"],selected,correct,marks,award]);
  });
  const p=total?Math.round(score/total*10000)/100:0,grade=mockGrade_(p),result=p>=33?"PASS":"FAIL";
  sh.appendRow([attemptId,testId,test["Title"],session.studentId,student["Student Name"],score,total,p,grade,result,mockDate_()]);
  return {success:true,result:{attemptId,score,totalMarks:total,percentage:p,grade,result,submittedAt:mockDate_(),review}};
}
function apiMockStudentHistory_(token){
  const session=studentSession_(token);
  return {success:true,attempts:mockRows_(MOCK_ATTEMPT_SHEET).filter(r=>String(r["Student ID"]).toUpperCase()===String(session.studentId).toUpperCase()).map(r=>{delete r._row;return r;})};
}

/* -------- ROUTER --------
   Add these cases to your existing doPost(e) router.
*/
function routeMockAction_(payload){
  switch(payload.action){
    case "mockTests": return apiMockTests_(payload.token);
    case "saveMockTest": return apiSaveMockTest_(payload.test||{},payload.token);
    case "setMockTestStatus": return apiSetMockTestStatus_(payload.testId,payload.status,payload.token);
    case "mockQuestions": return apiMockQuestions_(payload.testId,payload.token);
    case "saveMockQuestion": return apiSaveMockQuestion_(payload.question||{},payload.token);
    case "mockAttempts": return apiMockAttempts_(payload.testId,payload.token);
    case "publishedMockTests": return apiPublishedMockTests_(payload.token);
    case "publishedMockQuestions": return apiPublishedMockQuestions_(payload.token,payload.testId);
    case "submitMockTest": return apiSubmitMockTest_(payload.token,payload.testId,payload.answers);
    case "mockStudentHistory": return apiMockStudentHistory_(payload.token);
    default: return null;
  }
}
