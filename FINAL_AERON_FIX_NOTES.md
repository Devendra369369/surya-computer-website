# AERON CIMP v3.9 FINAL FIX

This package is based on the uploaded `AERON_CIMP_v3.7_KEYBOARD_API_FIXED.zip`.

## AERON UI
- One composer row: textarea + single keyboard-mode button + single action button.
- Action button is Voice when input is empty and Send when text exists.
- The keyboard-mode button switches between Android/mobile keyboard and AERON custom keyboard.
- Custom keyboard remains inside the composer and uses an internal height limit so it does not get clipped by the AERON window.
- Normal custom keyboard keeps the right-side bottom action as Send.
- Advanced/computer keyboard keeps the right Shift key as Send.
- Typing area uses larger readable text.
- AERON widget colors were changed from saturated blue to a neutral slate/gray palette to reduce glare.

## Answers / API
- Common capital questions (India, USA, Nepal, France, UK, Japan, China) have deterministic local answers.
- Deterministic common-knowledge answers are selected before an inconsistent LLM answer, so repeated India/USA capital questions stay consistent.
- Apps Script AERON backend has deterministic general-knowledge routing before the LLM fallback.
- Gemini temperature was reduced to 0.15 for more stable open-ended responses.
- The API remains the main path for institute-specific and open-ended questions; local fallback is used when the API is unavailable or returns a generic/unverified response.

## Voice / TTS
- Browser SpeechRecognition remains free and uses hi-IN/en-IN based on keyboard language.
- TTS now prefers an available Hindi/Indian male voice when the device/browser exposes one.
- Browser APIs do not expose a reliable voice-age value, so an exact 18-year-old voice cannot be guaranteed. Pitch is lightly adjusted toward a youthful sound.

## Important deployment note
The website frontend is fixed in `AERON/js/aeron-widget.js` and `AERON/css/aeron.css`.
The server-side source is fixed in `google-apps-script/AERON.gs` and `google-apps-script/AERONLLM.gs`.
After deploying the Apps Script source, make sure the website config points to the current Web App `/exec` URL.
