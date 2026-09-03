# AERON LLM + Voice Setup

## LLM
The Apps Script backend now has a Gemini-compatible server-side adapter in `google-apps-script/AERONLLM.gs`.

In Apps Script → Project Settings → Script Properties, add:

- `AERON_GEMINI_API_KEY` = your Google AI Studio Gemini API key
- `AERON_LLM_ENABLED` = `true`
- optional `AERON_LLM_MODEL` = `gemini-3.6-flash`

The API key is never placed in the public website JavaScript.

## Voice
AERON uses the browser Web Speech APIs:
- Hindi input: `hi-IN`
- Hindi output: `hi-IN`
- voice conversation automatically restarts listening after AERON finishes speaking
- the exact available Indian Hindi voice depends on the browser/OS voice pack

On Android/Chrome, install/download a Hindi voice if no Hindi voice appears in the device text-to-speech settings.

## Desktop
On PC the custom mobile keyboard is hidden. The normal physical keyboard is used. A double press of the **Right Shift** key sends the typed message.
