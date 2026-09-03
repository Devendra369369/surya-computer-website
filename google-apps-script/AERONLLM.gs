/* ==================================================
   AERON LLM PROVIDER
   Gemini-compatible server-side adapter
   API key MUST stay in Script Properties.
================================================== */
"use strict";

const AERON_LLM_MODEL = "gemini-3.6-flash";
const AERON_LLM_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/";

function aeronLLMEnabled_() {
  const props = PropertiesService.getScriptProperties();
  const key = String(props.getProperty("AERON_GEMINI_API_KEY") || "").trim();
  const enabled = String(props.getProperty("AERON_LLM_ENABLED") || "true").toLowerCase() !== "false";
  return enabled && !!key;
}

function aeronLLMGenerate_(systemInstruction, userQuestion, context) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = String(props.getProperty("AERON_GEMINI_API_KEY") || "").trim();
  if (!apiKey) return null;

  const model = String(props.getProperty("AERON_LLM_MODEL") || AERON_LLM_MODEL).trim();
  const endpoint = AERON_LLM_ENDPOINT + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);
  const prompt = [
    systemInstruction,
    "VERIFIED CONTEXT:",
    JSON.stringify(context || {}, null, 2),
    "USER QUESTION:",
    String(userQuestion || "")
  ].join("\n\n");

  const payload = {
    contents: [{parts: [{text: prompt}]}],
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 450
    }
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      console.log("AERON LLM HTTP " + code + ": " + response.getContentText().slice(0,1000));
      return null;
    }
    const data = JSON.parse(response.getContentText() || "{}");
    const text = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts && data.candidates[0].content.parts.map(function(p){return p.text || "";}).join("").trim();
    return text || null;
  } catch (err) {
    console.log("AERON LLM error: " + err);
    return null;
  }
}

function aeronLLMContext_(question, pageContext, history) {
  return {
    institute: "SURYA COMPUTER OF EDUCATION CENTER",
    location: "Kamalpur, Chandauli, Uttar Pradesh",
    phone: "7084275870",
    email: "sunilkumar5757@gmail.com",
    page: String((pageContext || {}).page || "index.html"),
    courses: aeronPublicCourses_().slice(0, 20),
    notices: aeronPublicNotices_().slice(0, 10),
    conversationHistory: Array.isArray(history) ? history.slice(-6) : []
  };
}

function aeronLLMAnswerPublic_(question, pageContext, history) {
  if (!aeronLLMEnabled_()) return null;
  const system = [
    "You are AERON, the official assistant for SURYA COMPUTER OF EDUCATION CENTER.",
    "Answer in the same language/style as the user; Hindi/Hinglish is preferred when the user writes Hindi/Hinglish.",
    "Use the VERIFIED CONTEXT for institute-specific facts. Never invent fees, dates, student records, results, certificates, or policies.",
    "If a requested fact is not present in verified context, clearly say it is not currently verified and suggest the relevant website section or official contact.",
    "Keep answers concise, friendly and useful. Do not claim to be ChatGPT or another product.",
    "You are public mode: never reveal private/admin/student information."
  ].join("\n");
  return aeronLLMGenerate_(system, question, aeronLLMContext_(question, pageContext, history));
}

function aeronLLMAnswerAdmin_(question, summary) {
  if (!aeronLLMEnabled_()) return null;
  const system = [
    "You are AERON Admin Assistant for SURYA COMPUTER OF EDUCATION CENTER.",
    "The user is already authenticated as an admin.",
    "Use only the supplied verified admin context.",
    "Do not invent database values or claim an action was completed unless a server tool actually completed it.",
    "For now you may explain information and guide the admin. Do not fabricate write/delete/update actions.",
    "Answer in concise Hindi/Hinglish when appropriate."
  ].join("\n");
  return aeronLLMGenerate_(system, question, summary || {});
}

function setupAeronLLM() {
  const props = PropertiesService.getScriptProperties();

  props.setProperty("AERON_LLM_ENABLED", "true");
  props.setProperty("AERON_LLM_MODEL", "gemini-3.6-flash");

  Logger.log("AERON LLM settings saved. API key अभी set नहीं की गई है.");
}
