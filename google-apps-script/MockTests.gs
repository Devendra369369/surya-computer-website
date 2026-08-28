/* =========================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File: MockTests.gs
   Version: v2.0.0
   Purpose: Course + Subject-wise CBT Mock Test system
========================================================= */
"use strict";

const MOCK_TEST_SHEET = "MockTests";
const MOCK_QUESTION_SHEET = "MockQuestions";
const MOCK_ATTEMPT_SHEET = "MockAttempts";
const MOCK_ANSWER_SHEET = "MockAnswers";
const MOCK_START_PREFIX = "SURYA_MOCK_START_";

function mockEnsureSheets_() {
  const ss = getSuryaSpreadsheet();
  const defs = {
    [MOCK_TEST_SHEET]: ["Test ID","Title","Course","Subject ID","Subject Name","Duration","Total Marks","Description","Status","Created At","Updated At"],
    [MOCK_QUESTION_SHEET]: ["Question ID","Test ID","Question","Option A","Option B","Option C","Option D","Correct Answer","Marks","Status","Created At","Updated At"],
    [MOCK_ATTEMPT_SHEET]: ["Attempt ID","Test ID","Test Title","Student ID","Student Name","Score","Total Marks","Percentage","Grade","Result","Submitted At"],
    [MOCK_ANSWER_SHEET]: ["Attempt ID","Question ID","Student ID","Question","Selected Answer","Correct Answer","Marks","Awarded Marks"]
  };

  Object.keys(defs).forEach(function(name) {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1,1,1,defs[name].length).setValues([defs[name]]);
    } else {
      const last = sh.getLastColumn();
      const current = last > 0 && sh.getLastRow() > 0
        ? sh.getRange(1,1,1,last).getValues()[0].map(function(x){return String(x || "").trim();})
        : [];
      defs[name].forEach(function(h) {
        if (current.indexOf(h) === -1) sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
      });
    }
    sh.setFrozenRows(1);
  });
}

function mockHeaderMap_(sh) {
  const h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const m = {};
  h.forEach(function(x,i){ m[String(x).trim()] = i; });
  return m;
}

function mockRows_(name) {
  mockEnsureSheets_();
  const sh = getSuryaSpreadsheet().getSheetByName(name);
  if (sh.getLastRow() < 2) return [];
  const map = mockHeaderMap_(sh);
  const vals = sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  return vals.map(function(r,ri) {
    const o = {};
    Object.keys(map).forEach(function(k){ o[k] = r[map[k]]; });
    o._row = ri + 2;
    return o;
  });
}

function mockId_(prefix) {
  return prefix + "-" + Utilities.getUuid().replace(/-/g,"").slice(0,12).toUpperCase();
}

function mockDate_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMMM yyyy HH:mm:ss");
}

function mockGrade_(p) {
  p = Number(p);
  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";
  if (p >= 33) return "D";
  return "F";
}

function mockAdminGuard_(token) {
  if (typeof verifyAdminSession === "function" && !verifyAdminSession(String(token || ""))) {
    throw new Error("Unauthorized. Admin login required.");
  }
  return true;
}

function mockCourseSubject_(course, subjectId) {
  const rows = typeof getCourseSubjects === "function"
    ? getSuryaSpreadsheet().getSheetByName("Course Subjects")
      ? mockRows_("Course Subjects")
      : []
    : [];

  const c = String(course || "").trim().toUpperCase();
  const sid = String(subjectId || "").trim().toUpperCase();

  return rows.find(function(r) {
    return String(r["Course"] || "").trim().toUpperCase() === c &&
           String(r["Subject ID"] || "").trim().toUpperCase() === sid &&
           String(r["Status"] || "Active").trim().toLowerCase() === "active";
  }) || null;
}

/* ---------------- ADMIN ---------------- */

function getMockTests_() {
  return mockRows_(MOCK_TEST_SHEET).map(function(r) {
    delete r._row;
    return r;
  });
}

function getMockQuestions_(testId,publishedOnly) {
  return mockRows_(MOCK_QUESTION_SHEET).filter(function(r) {
    if (String(r["Test ID"]) !== String(testId)) return false;
    return !publishedOnly || String(r["Status"]).toLowerCase() === "published";
  }).map(function(r) {
    delete r._row;
    return r;
  });
}

function apiMockTests_(token) {
  mockAdminGuard_(token);
  return {success:true,tests:getMockTests_()};
}

function apiSaveMockTest_(test,token) {
  mockAdminGuard_(token);
  mockEnsureSheets_();

  const sh = getSuryaSpreadsheet().getSheetByName(MOCK_TEST_SHEET);
  const map = mockHeaderMap_(sh);
  const rows = mockRows_(MOCK_TEST_SHEET);

  const id = String(test.testId || "").trim() || mockId_("SC-MOCK");
  const title = String(test.title || "").trim();
  const course = String(test.course || "").trim();
  const subjectId = String(test.subjectId || "").trim();
  const subjectName = String(test.subjectName || "").trim();
  const duration = Number(test.duration || 30);
  const totalMarks = Number(test.totalMarks || 0);
  const description = String(test.description || "").trim();
  const status = ["Draft","Published"].indexOf(String(test.status || "Draft")) >= 0
    ? String(test.status || "Draft") : "Draft";

  if (!title || !course || !subjectId || !duration || duration < 1 || !totalMarks || totalMarks < 1) {
    throw new Error("Title, Course, Subject, Duration and Total Marks are required.");
  }

  const subject = mockCourseSubject_(course, subjectId);
  if (!subject) throw new Error("Selected subject is not active for this course.");

  if (status === "Published") {
    const qCount = mockRows_(MOCK_QUESTION_SHEET).filter(function(q){
      return String(q["Test ID"]) === id &&
             String(q["Status"] || "Published").toLowerCase() === "published";
    }).length;
    if (!qCount) throw new Error("Add at least one published question before publishing this test.");
  }

  const canonicalSubjectName = String(subject["Subject Name"] || subjectName).trim();
  const now = mockDate_();
  const existing = rows.find(function(r){return String(r["Test ID"]) === id;});

  const values = {
    "Test ID": id,
    "Title": title,
    "Course": course,
    "Subject ID": subjectId,
    "Subject Name": canonicalSubjectName,
    "Duration": duration,
    "Total Marks": totalMarks,
    "Description": description,
    "Status": status,
    "Created At": existing ? existing["Created At"] : now,
    "Updated At": now
  };

  const arr = Object.keys(map).map(function(k){return values[k] !== undefined ? values[k] : "";});
  if (existing) sh.getRange(existing._row,1,1,sh.getLastColumn()).setValues([arr]);
  else sh.appendRow(arr);

  return {success:true,test:values};
}

function apiSetMockTestStatus_(testId,status,token) {
  mockAdminGuard_(token);
  const sh = getSuryaSpreadsheet().getSheetByName(MOCK_TEST_SHEET);
  const rows = mockRows_(MOCK_TEST_SHEET);
  const r = rows.find(function(x){return String(x["Test ID"]) === String(testId);});
  if (!r) throw new Error("Test not found.");
  if (["Published","Draft"].indexOf(String(status)) < 0) throw new Error("Invalid test status.");
  if (String(status) === "Published") {
    const questionCount = mockRows_(MOCK_QUESTION_SHEET).filter(function(q){
      return String(q["Test ID"]) === String(testId) &&
             String(q["Status"] || "Published").toLowerCase() === "published";
    }).length;
    if (!questionCount) throw new Error("Add at least one published question before publishing this test.");
  }
  const m = mockHeaderMap_(sh);
  sh.getRange(r._row,m["Status"]+1).setValue(status);
  sh.getRange(r._row,m["Updated At"]+1).setValue(mockDate_());
  return {success:true};
}

function apiMockQuestions_(testId,token) {
  mockAdminGuard_(token);
  return {success:true,questions:getMockQuestions_(testId,false)};
}

function apiSaveMockQuestion_(q,token) {
  mockAdminGuard_(token);
  mockEnsureSheets_();

  const sh = getSuryaSpreadsheet().getSheetByName(MOCK_QUESTION_SHEET);
  const map = mockHeaderMap_(sh);
  const rows = mockRows_(MOCK_QUESTION_SHEET);
  const testId = String(q.testId || "").trim();
  const test = getMockTests_().find(function(t){return String(t["Test ID"]) === testId;});
  if (!test) throw new Error("Mock test not found.");

  const question = String(q.question || "").trim();
  const options = [q.optionA,q.optionB,q.optionC,q.optionD].map(function(x){return String(x || "").trim();});
  const correct = String(q.correctAnswer || "A").trim().toUpperCase().slice(0,1);
  const marks = Number(q.marks || 1);

  if (!question || options.some(function(x){return !x;}) || ["A","B","C","D"].indexOf(correct) < 0 || !Number.isFinite(marks) || marks <= 0) {
    throw new Error("Question, all four options, correct answer and valid marks are required.");
  }

  const id = String(q.questionId || "").trim() || mockId_("Q");
  const now = mockDate_();
  const existing = rows.find(function(r){return String(r["Question ID"]) === id;});
  const values = {
    "Question ID": id,
    "Test ID": testId,
    "Question": question,
    "Option A": options[0],
    "Option B": options[1],
    "Option C": options[2],
    "Option D": options[3],
    "Correct Answer": correct,
    "Marks": marks,
    "Status": "Published",
    "Created At": existing ? existing["Created At"] : now,
    "Updated At": now
  };
  const arr = Object.keys(map).map(function(k){return values[k] !== undefined ? values[k] : "";});
  if (existing) sh.getRange(existing._row,1,1,sh.getLastColumn()).setValues([arr]);
  else sh.appendRow(arr);

  /* CBT total marks are authoritative from the question bank. */
  const testSheet = getSuryaSpreadsheet().getSheetByName(MOCK_TEST_SHEET);
  const testRows = mockRows_(MOCK_TEST_SHEET);
  const testRow = testRows.find(function(t){return String(t["Test ID"]) === testId;});
  if (testRow) {
    const questionRows = mockRows_(MOCK_QUESTION_SHEET).filter(function(x){
      return String(x["Test ID"]) === testId &&
             String(x["Status"] || "Published").toLowerCase() === "published";
    });
    const questionTotal = questionRows.reduce(function(sum,x){
      return sum + Math.max(0, Number(x["Marks"] || 0));
    },0);
    const testMap = mockHeaderMap_(testSheet);
    if (testMap["Total Marks"] !== undefined) {
      testSheet.getRange(testRow._row,testMap["Total Marks"]+1).setValue(questionTotal);
    }
    values["Total Marks"] = questionTotal;
  }

  return {success:true,question:values};
}

function apiMockAttempts_(testId,token) {
  mockAdminGuard_(token);
  return {
    success:true,
    attempts:mockRows_(MOCK_ATTEMPT_SHEET).filter(function(r){return String(r["Test ID"]) === String(testId);}).map(function(r){delete r._row;return r;})
  };
}

/* ---------------- STUDENT ---------------- */

function apiPublishedMockTests_(token) {
  const session = studentSession_(token);
  const student = studentPublicProfile_(session.studentId) || {};
  const course = String(student["Course"] || "").trim();

  const allTests = getMockTests_().filter(function(t){
    return String(t["Status"] || "").toLowerCase() === "published";
  });

  /* Student records may store either Course ID or Course Name.
     Resolve both forms so the correct course tests always appear. */
  const allowedCourses = {};
  if (course) allowedCourses[course.toLowerCase()] = true;

  try {
    const courseSheet = getSuryaSpreadsheet().getSheetByName("Courses");
    if (courseSheet && courseSheet.getLastRow() >= 2) {
      const courseRows = mockRows_("Courses");
      courseRows.forEach(function(c) {
        const id = String(c["Course ID"] || "").trim();
        const name = String(c["Course Name"] || "").trim();
        if (
          id.toLowerCase() === course.toLowerCase() ||
          name.toLowerCase() === course.toLowerCase()
        ) {
          if (id) allowedCourses[id.toLowerCase()] = true;
          if (name) allowedCourses[name.toLowerCase()] = true;
        }
      });
    }
  } catch (e) {
    /* Student course itself remains the fallback. */
  }

  const courseTests = allTests.filter(function(t){
    return !!allowedCourses[String(t["Course"] || "").trim().toLowerCase()];
  });

  return {
    success:true,
    studentId:session.studentId,
    studentCourse:course,
    courseTests:courseTests,
    allTests:allTests,
    tests:courseTests
  };
}

function apiPublishedMockQuestions_(token,testId) {
  const session = studentSession_(token);
  const tests = getMockTests_();
  const test = tests.find(function(t){return String(t["Test ID"]) === String(testId);});

  if (!test || String(test["Status"]).toLowerCase() !== "published") throw new Error("Test is not available.");

  const student = studentPublicProfile_(session.studentId) || {};
  const studentCourse = String(student["Course"] || "").trim();
  const testCourse = String(test["Course"] || "").trim();

  if (studentCourse.toLowerCase() !== testCourse.toLowerCase()) {
    /* The All Courses button is intentionally supported. */
  }

  const key = MOCK_START_PREFIX + session.studentId + "_" + String(testId);
  const props = PropertiesService.getScriptProperties();
  const oldStart = Number(props.getProperty(key) || 0);
  const maxAge = (Number(test["Duration"] || 30) + 5) * 60 * 1000;
  if (!oldStart || Date.now() - oldStart > maxAge) props.setProperty(key,String(Date.now()));

  const questions = getMockQuestions_(testId,true).map(function(q){
    return {
      "Question ID":q["Question ID"],
      "Test ID":q["Test ID"],
      "Question":q["Question"],
      "Option A":q["Option A"],
      "Option B":q["Option B"],
      "Option C":q["Option C"],
      "Option D":q["Option D"],
      "Marks":q["Marks"]
    };
  });

  return {success:true,test:test,questions:questions};
}

function apiSubmitMockTest_(token,testId,answers) {
  const session = studentSession_(token);
  const student = studentPublicProfile_(session.studentId);
  mockEnsureSheets_();

  const props = PropertiesService.getScriptProperties();
  const startKey = MOCK_START_PREFIX + session.studentId + "_" + String(testId);
  const started = Number(props.getProperty(startKey) || 0);
  const nowMs = Date.now();

  const duplicateKey = "SURYA_MOCK_SUBMIT_" + session.studentId + "_" + String(testId);
  const cache = CacheService.getScriptCache();
  if (cache.get(duplicateKey)) throw new Error("This test was just submitted. Please wait before submitting again.");

  const tests = getMockTests_();
  const test = tests.find(function(t){return String(t["Test ID"]) === String(testId);});
  if (!test || String(test["Status"]).toLowerCase() !== "published") throw new Error("Test is not available.");

  const previousAttempt = mockRows_(MOCK_ATTEMPT_SHEET).find(function(r) {
    return String(r["Student ID"]).trim().toUpperCase() === String(session.studentId).trim().toUpperCase() &&
           String(r["Test ID"]).trim() === String(testId).trim();
  });
  if (previousAttempt) throw new Error("You have already submitted this mock test.");

  if (started && nowMs - started > (Number(test["Duration"] || 30) + 2) * 60 * 1000) {
    throw new Error("Time is over for this mock test.");
  }

  const qs = getMockQuestions_(testId,true);
  if (!qs.length) throw new Error("No published questions.");
  if (!Array.isArray(answers) || answers.length !== qs.length) throw new Error("Invalid answer data.");

  cache.put(duplicateKey,"1",12);

  const attemptId = mockId_("ATT");
  const sh = getSuryaSpreadsheet().getSheetByName(MOCK_ATTEMPT_SHEET);
  const ash = getSuryaSpreadsheet().getSheetByName(MOCK_ANSWER_SHEET);

  let score = 0, total = 0, review = [];

  qs.forEach(function(q,i) {
    const marks = Math.max(0,Number(q["Marks"] || 1));
    const selected = String(answers[i] || "").trim().toUpperCase().slice(0,1);
    const correct = String(q["Correct Answer"] || "").toUpperCase();
    const award = selected === correct ? marks : 0;
    score += award;
    total += marks;

    review.push({
      question:q["Question"],
      yourAnswer:selected,
      correctAnswer:correct,
      correctText:q["Option " + correct] || "",
      marks:marks,
      awarded:award
    });

    ash.appendRow([attemptId,q["Question ID"],session.studentId,q["Question"],selected,correct,marks,award]);
  });

  const p = total ? Math.round(score / total * 10000) / 100 : 0;
  const grade = mockGrade_(p);
  const result = p >= 33 ? "PASS" : "FAIL";

  sh.appendRow([attemptId,testId,test["Title"],session.studentId,student["Student Name"],score,total,p,grade,result,mockDate_()]);
  props.deleteProperty(startKey);

  return {
    success:true,
    result:{
      attemptId:attemptId,
      testId:testId,
      title:test["Title"],
      course:test["Course"],
      subjectId:test["Subject ID"],
      subjectName:test["Subject Name"],
      score:score,
      totalMarks:total,
      percentage:p,
      grade:grade,
      result:result,
      submittedAt:mockDate_(),
      review:review
    }
  };
}

function apiMockStudentHistory_(token) {
  const session = studentSession_(token);
  return {
    success:true,
    attempts:mockRows_(MOCK_ATTEMPT_SHEET).filter(function(r){
      return String(r["Student ID"]).toUpperCase() === String(session.studentId).toUpperCase();
    }).map(function(r){delete r._row;return r;})
  };
}

function routeMockAction_(payload) {
  switch(payload.action) {
    case "mockTests": return apiMockTests_(payload.token);
    case "saveMockTest": return apiSaveMockTest_(payload.test || {},payload.token);
    case "setMockTestStatus": return apiSetMockTestStatus_(payload.testId,payload.status,payload.token);
    case "mockQuestions": return apiMockQuestions_(payload.testId,payload.token);
    case "saveMockQuestion": return apiSaveMockQuestion_(payload.question || {},payload.token);
    case "mockAttempts": return apiMockAttempts_(payload.testId,payload.token);
    case "publishedMockTests": return apiPublishedMockTests_(payload.token);
    case "publishedMockQuestions": return apiPublishedMockQuestions_(payload.token,payload.testId);
    case "submitMockTest": return apiSubmitMockTest_(payload.token,payload.testId,payload.answers);
    case "mockStudentHistory": return apiMockStudentHistory_(payload.token);
    default: return null;
  }
}
