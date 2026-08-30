/* ==================================================
   AERON CORE v2.0
   Public + Student + Admin Assistant
   Safe, allowlisted, AI-provider agnostic
================================================== */

"use strict";

const AERON_VERSION = "2.0.0";

function aeronCleanText_(value, maxLen) {
  return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, maxLen || 1000);
}

function aeronHtml_(value) {
  if (typeof escapeHtml_ === "function") return escapeHtml_(value);
  return String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function aeronResponse_(html, extra) {
  const out = Object.assign({
    success: true,
    version: AERON_VERSION,
    html: html
  }, extra || {});
  return out;
}

function aeronPublicCourses_() {
  try {
    const response = getPublicCourses();
    const data = response && response.getContent ? JSON.parse(response.getContent()) : response;
    return Array.isArray(data.courses) ? data.courses : [];
  } catch (_) {
    return [];
  }
}

function aeronPublicNotices_() {
  try {
    const response = publicNotices_();
    const data = response && response.getContent ? JSON.parse(response.getContent()) : response;
    return Array.isArray(data.notices) ? data.notices : [];
  } catch (_) {
    return [];
  }
}

function aeronCertificatePublic_(certificateId) {
  try {
    const response = getCertificate(String(certificateId || "").trim());
    const data = response && response.getContent ? JSON.parse(response.getContent()) : response;
    return data && data.success ? data.certificate : null;
  } catch (_) {
    return null;
  }
}

function aeronPublicAnswer_(question, pageContext) {
  const q = aeronCleanText_(question, 1000);
  const lower = q.toLowerCase();
  const page = aeronCleanText_((pageContext || {}).page, 120);

  if (!q) return aeronResponse_("<strong>AERON</strong><p>कृपया अपना सवाल लिखिए।</p>");

  if (/(hello|hi|hey|namaste|नमस्ते|हेलो)/i.test(lower) && q.length < 80) {
    return aeronResponse_(
      "<strong>नमस्ते! 👋</strong><p>मैं AERON हूँ। Surya Computer Of Education Center की website पर आपकी मदद करने के लिए तैयार हूँ।</p>",
      { intent: "greeting" }
    );
  }

  if (/(contact|phone|mobile|number|सम्पर्क|संपर्क|फोन|मोबाइल)/i.test(lower)) {
    return aeronResponse_(
      "<strong>📞 Contact</strong><p>" +
      aeronHtml_("Surya Computer Of Education Center") + "<br>" +
      "📍 " + aeronHtml_("Kamalpur, Chandauli, Uttar Pradesh") + "<br>" +
      "📞 <a href=\"tel:+917084275870\">7084275870</a><br>" +
      "✉️ <a href=\"mailto:sunilkumar5757@gmail.com\">sunilkumar5757@gmail.com</a></p>",
      { intent: "contact" }
    );
  }

  if (/(course|courses|कोर्स|पाठ्यक्रम|adca|dca|ccc|tally|typing|basic computer)/i.test(lower)) {
    const courses = aeronPublicCourses_();
    if (courses.length) {
      const items = courses.slice(0, 12).map(function(c) {
        const name = c["Course Name"] || c.courseName || c["Name"] || c.name || "";
        const duration = c["Duration"] || c.duration || "";
        const fee = c["Fee"] || c.fee;
        const description = c["Description"] || c.description || "";
        let line = "<li><b>" + aeronHtml_(name) + "</b>";
        if (duration) line += " — " + aeronHtml_(duration);
        if (fee !== undefined && fee !== "") line += " — ₹" + aeronHtml_(fee);
        if (description) line += "<br><small>" + aeronHtml_(description) + "</small>";
        return line + "</li>";
      }).join("");
      return aeronResponse_("<strong>📚 Courses</strong><ul>" + items + "</ul>", {intent:"courses"});
    }
    return aeronResponse_(
      "<strong>📚 Courses</strong><p>उपलब्ध course data अभी live database से नहीं मिल पाया। Website के Courses page पर verified जानकारी देखें।</p>",
      {intent:"courses", escalation:true}
    );
  }

  if (/(admission|admit|प्रवेश|एडमिशन|application|आवेदन)/i.test(lower)) {
    const link = "admission.html";
    return aeronResponse_(
      "<strong>📝 Admission</strong><p>Online admission के लिए Admission page खोलें। Form भरते समय नाम, DOB, mobile और documents ध्यान से भरें।</p><p><a href=\"" + link + "\">Open Admission →</a></p>",
      {intent:"admission"}
    );
  }

  const certMatch = q.match(/SC[- ]?CERT[- ]?\d{4}/i);
  if (/(certificate|प्रमाणपत्र|सर्टिफिकेट|verify|सत्यापित)/i.test(lower) || certMatch) {
    if (certMatch) {
      const id = certMatch[0].replace(/\s+/g,"-").toUpperCase();
      const cert = aeronCertificatePublic_(id);
      if (cert) {
        const status = String(cert["Status"] || cert.status || "").trim();
        return aeronResponse_(
          "<strong>🎓 Certificate Verified</strong><p>" +
          "Certificate ID: <b>" + aeronHtml_(id) + "</b><br>" +
          "Student: " + aeronHtml_(cert["Student Name"] || "") + "<br>" +
          "Course: " + aeronHtml_(cert["Course"] || "") + "<br>" +
          "Status: " + aeronHtml_(status) + "</p>",
          {intent:"certificate"}
        );
      }
      return aeronResponse_("<strong>🎓 Certificate</strong><p>यह Certificate ID नहीं मिला। कृपया ID दोबारा जाँचें।</p>", {intent:"certificate"});
    }
    return aeronResponse_(
      "<strong>🎓 Certificate Verification</strong><p>Certificate page पर Certificate ID डालकर public verification की जा सकती है।</p><p><a href=\"certificate.html\">Open Certificate Verification →</a></p>",
      {intent:"certificate"}
    );
  }

  if (/(result|परिणाम|marks|अंक|score)/i.test(lower)) {
    return aeronResponse_(
      "<strong>📊 Result</strong><p>Published result देखने के लिए Public Result page का उपयोग करें। Student ID/result details के अनुसार search करें।</p><p><a href=\"result.html\">Open Result →</a></p>",
      {intent:"result"}
    );
  }

  if (/(notice|सूचना|latest notice|नोटिस)/i.test(lower)) {
    const notices = aeronPublicNotices_();
    if (notices.length) {
      const items = notices.slice(0, 5).map(function(n) {
        return "<li><b>" + aeronHtml_(n.title || "") + "</b><br>" + aeronHtml_(n.message || "") + "</li>";
      }).join("");
      return aeronResponse_("<strong>📢 Latest Notices</strong><ul>" + items + "</ul>", {intent:"notice"});
    }
    return aeronResponse_("<strong>📢 Notices</strong><p>अभी कोई published notice उपलब्ध नहीं मिली।</p>", {intent:"notice"});
  }

  if (/(help|problem|issue|परेशान|मदद|समस्या|support)/i.test(lower)) {
    return aeronResponse_(
      "<strong>🆘 Help</strong><p>मैं आपकी समस्या समझने की कोशिश कर सकता हूँ। अगर मैं verified answer न दे पाऊँ तो Admin को help request भेजने का विकल्प उपलब्ध है।</p>",
      {intent:"help", escalation:true}
    );
  }

  if (/fee|fees|फीस|शुल्क/i.test(lower)) {
    const courses = aeronPublicCourses_();
    const matched = courses.find(function(c) {
      const name = String(c["Course Name"] || c.courseName || c["Name"] || "").toLowerCase();
      return name && lower.includes(name);
    });
    if (matched) {
      const fee = matched["Fee"] !== undefined ? matched["Fee"] : matched.fee;
      if (fee !== undefined && fee !== "") {
        return aeronResponse_("<strong>💰 Course Fee</strong><p>" + aeronHtml_(matched["Course Name"] || matched.courseName || "") + ": <b>₹" + aeronHtml_(fee) + "</b></p>", {intent:"fee"});
      }
    }
    return aeronResponse_("<strong>💰 Fee</strong><p>Fee का verified amount मुझे अभी नहीं मिला। मैं अनुमान नहीं लगाऊँगा। Courses page या institute से confirm करें।</p>", {intent:"fee", escalation:true});
  }

  return aeronResponse_(
    "<strong>🤖 AERON</strong><p>मुझे इसका verified answer अभी नहीं मिला। आप Courses, Admission, Certificate, Result, Notice या Contact के बारे में पूछ सकते हैं।</p>",
    {intent:"unknown", escalation:true}
  );
}

function aeronAsk_(data) {
  const result = aeronPublicAnswer_(data.question, data.pageContext || {});
  return result;
}

/* ---------------- ADMIN ---------------- */

function aeronAdminSummary_(token) {
  if (!verifyAdminSession(String(token || ""))) {
    return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  }
  const ss = getSuryaSpreadsheet();
  function count_(name, predicate) {
    const sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return 0;
    const values = sh.getDataRange().getValues();
    const headers = values[0].map(function(x){return String(x).trim();});
    let n=0;
    for(let i=1;i<values.length;i++){
      if(!predicate || predicate(values[i],headers)) n++;
    }
    return n;
  }
  const pendingAdmissions = count_("Admissions", function(r,h){
    const idx=h.indexOf("Status"); return idx<0 || String(r[idx]||"").trim().toLowerCase()==="pending";
  });
  const students = count_("Students");
  const certificates = count_("Certificates");
  const notices = count_("Notices", function(r,h){
    const idx=h.indexOf("Status"); return idx<0 || String(r[idx]||"").trim().toLowerCase()==="published";
  });
  const messages = count_("ContactMessages", function(r,h){
    const idx=h.indexOf("Status"); return idx<0 || ["new","open"].includes(String(r[idx]||"").trim().toLowerCase());
  });
  return aeronResponse_(
    "<strong>🛡️ Admin Overview</strong>" +
    "<p>Pending Admissions: <b>" + pendingAdmissions + "</b><br>" +
    "Students: <b>" + students + "</b><br>" +
    "Certificates: <b>" + certificates + "</b><br>" +
    "Published Notices: <b>" + notices + "</b><br>" +
    "Open/New Messages: <b>" + messages + "</b></p>",
    {intent:"admin-summary", admin:true}
  );
}

function aeronAdminAsk_(token, question) {
  if (!verifyAdminSession(String(token || ""))) {
    return {success:false,authenticated:false,message:"Unauthorized. Admin login required."};
  }
  const q = aeronCleanText_(question, 1000).toLowerCase();

  if (/(pending admissions|new admissions|pending application|pending admission)/i.test(q)) return aeronAdminSummary_(token);
  if (/(student count|total students|students kitne|कितने student)/i.test(q)) return aeronAdminSummary_(token);
  if (/(certificate count|certificates|कितने certificate)/i.test(q)) return aeronAdminSummary_(token);
  if (/(notification|notifications|alert|alerts)/i.test(q)) {
    return aeronAdminNotifications_(token);
  }

  return aeronResponse_(
    "<strong>🛡️ AERON Admin</strong><p>मैं authorized admin information और approved tools के साथ काम कर सकता हूँ। अभी available commands में dashboard summary, pending admissions, student/certificate counts और notifications शामिल हैं।</p>",
    {intent:"admin-help", admin:true}
  );
}
