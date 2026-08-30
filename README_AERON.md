# AERON — Surya CEC AI Assistant

Version: 2.3 Mobile/System Keyboard UX + Voice + Advanced Keyboard  
Project: SURYA COMPUTER OF EDUCATION CENTER / CIMP_V.3.0.3  
Purpose: Website assistant, public help assistant, student assistant and authenticated admin assistant.

## What AERON can do now

### Public assistant
AERON is available on the public website pages through one reusable widget.

It can:
- answer verified institute basics (courses, admission guidance, certificate guidance, result guidance, notices and contact information);
- read active course data from the CIMP backend when available;
- show recent published notices when available;
- look up a public certificate when a valid Certificate ID is supplied;
- link users to the correct website section;
- refuse to invent fees, dates or policies when verified data is unavailable;
- offer an official admin-help request when the answer is not confidently known;
- show the institute's official contact number for urgent human assistance.

### Student mode
When the existing student session is active, AERON identifies the page as Student mode. The architecture is ready for student-scoped tools; private data is not exposed merely because the chatbot is present.

### Admin mode
On authenticated admin pages, AERON switches to Admin Assistant mode. The backend validates the existing admin session before returning admin information.

Current allowlisted admin assistance includes:
- dashboard counts;
- pending admissions count;
- student count;
- certificate count;
- published notice count;
- new/open contact-message count;
- AERON notification history.

No arbitrary code execution is provided.

## Notifications

AERON adds a persistent notification sheet:

`AERON_NOTIFICATIONS`

New admission:
- saved in the normal Admissions sheet;
- AERON notification is recorded;
- admin email notification is attempted independently of the browser/dashboard state.

Public help request:
- AERON can create a help notification;
- the request is recorded and an admin email is attempted.

Website contact:
- the existing contact email flow remains intact;
- an AERON notification record is also created.

Notification failures are isolated so that a notification failure does not cancel a successful admission.

## Memory

AERON uses two memory layers:

1. Local browser memory: suitable for non-sensitive, user-approved preferences.
2. Persistent backend memory: `AERONMemory.gs` provides opt-in storage for authenticated student/admin sessions.

Important limitation:
- anonymous visitors do not get cross-device permanent identity automatically;
- true cross-device permanent personal memory requires an authenticated account or another stable identity mechanism;
- passwords, access tokens and unnecessary sensitive documents must never be stored in AERON memory.

Hashing is not encryption. A hash cannot normally be decoded back into its input, but guessable values can still be attacked by repeated guesses. Secrets require proper secret storage and access control.

## Security model

Public:
`Public UI → public allowlisted API`

Student:
`Student session → student-scoped API`

Admin:
`Admin session → verifyAdminSession() → admin allowlisted API`

Important:
Putting an admin button or page behind JavaScript is not security. Source view, DevTools, curl or Postman can inspect public static files. Sensitive admin operations must therefore remain protected on the backend.

AERON does not contain an admin bypass mechanism.

## AI engine status

The current package is an AI-engine-ready foundation, not a hosted proprietary large language model.

Current answer generation:
- verified CIMP data;
- deterministic intent/rule routing;
- local knowledge fallback.

Future AI providers can be connected behind `AERON Core` without rebuilding the website.

Planned provider abstraction:

`AERON Core → AI Router → provider`

Possible providers:
- AERON MINI Genesis (planned);
- a permitted/free-tier external model;
- another compatible model.

API keys must remain server-side. Never place a provider key in `index.html` or browser JavaScript.

## Future roadmap

### AERON MINI Genesis
Build Genesis as the main reasoning engine later and connect it through the provider adapter.

Planned capabilities:
- natural Hindi/English conversation;
- multi-turn reasoning;
- contextual answers;
- tool calling;
- safer response grounding;
- structured function execution.

### Knowledge system
Expand:
- course details and fees;
- admission policies;
- institute FAQ;
- notices;
- student help articles;
- certificate/result guidance.

### Memory
Expand with:
- consent controls;
- user-visible memory management;
- expiry rules;
- sensitive-data classification;
- authenticated cross-device memory.

### Notifications
Potential future channels:
- Telegram bot;
- browser push;
- email fallback;
- other approved notification providers.

The current build intentionally uses email plus a persistent notification sheet without requiring a paid messaging provider.

### Admin actions
Future admin task execution will remain allowlisted and backend-authorized.

Example:
`Admin request → intent → permission check → allowed action → audit log`

AERON must never execute arbitrary code from natural-language instructions.

## Files

`AERON/index.html`
- standalone test page.

`AERON/css/aeron.css`
- scoped widget UI.

`AERON/js/aeron-widget.js`
- reusable public/student/admin widget controller.

`AERON/js/aeron.js`
- legacy compatibility entry.

`AERON/config/aeron-config.js`
- backend endpoint and UI configuration.

`AERON/brain/`
- rules, intents and verified public knowledge seed.

`AERON/assets/icon/aeron.svg`
- AERON widget icon.

Backend:
- `google-apps-script/AERON.gs`
- `google-apps-script/AERONMemory.gs`
- `google-apps-script/AERONNotifications.gs`

## Deployment notes

After adding/changing the `.gs` AERON files:
1. `clasp push`
2. create/update the Apps Script Web App deployment
3. test public AERON
4. test authenticated admin AERON
5. test new-admission notification
6. test public help escalation

Frontend-only changes do not require an Apps Script redeployment.

## Safety rule

AERON should answer from verified project data whenever possible.

When data is missing or uncertain, AERON should say that it does not have verified information and direct the user to the official institute contact channel instead of guessing.

## Custom keyboard (v1.0)

The widget includes an optional AERON keyboard designed for mobile screens. Tapping the message field or the **⌨** button opens it. The browser input uses `readonly` + `inputmode="none"`, so the Android system keyboard does not cover the send button.

Keyboard controls:
- `अं / EN` — English ↔ Hindi layout
- `123 / ABC` — numbers/symbols ↔ letters
- `⇧` — English Shift / uppercase
- `⌫` — backspace
- `C` — clear message
- `📋` — paste from clipboard when browser permission allows
- `Space` — insert a space
- `↵ Enter` — send the message

The keyboard is intentionally implemented as a separate UI layer inside `AERON/js/aeron-widget.js` and styled in `AERON/css/aeron.css`. Future buttons can be added to the keyboard arrays and action handler without changing the backend.

## v2.1 changes

### Mobile keyboard
The AERON widget now includes a built-in keyboard tray. On mobile, the message field uses `readonly` and `inputmode="none"` so the Android system keyboard does not cover the send button. Tapping the field or `⌨` opens AERON Keyboard.

Keyboard layout is generated in `AERON/js/aeron-widget.js`:
- English QWERTY with Shift
- Hindi Devanagari layout
- Numbers/symbols mode
- Backspace, Clear, Paste, Space and Enter/Send

To add or change keys later, edit the `KB_EN`, `KB_HI` or `KB_NUM` arrays and, for special buttons, the `data-kb-action` handler in the same file. Styling belongs in the `AERON CUSTOM MOBILE KEYBOARD` section of `AERON/css/aeron.css`.

### Public API fallback
If a hosting deployment is still running an older central API and returns the generic `Unauthorized. Admin login required.` response to a public AERON question, the browser no longer displays that internal error to visitors. It falls back to AERON's local verified knowledge response and offers human help when appropriate. The Apps Script deployment should still be updated so live course/notice data and backend tools work normally.

### Index cleanup
The old hard-coded AERON panel was removed from the main `index.html`. The reusable widget now creates the panel once, preventing duplicate IDs and duplicate UI.

## AERON v2.3 roadmap — keyboard, voice and AI

### Current release
1. Normal mobile keyboard with English/Hindi and numbers.
2. Left Shift: single = one capital, double = Caps Lock.
3. Right Shift: single = one capital, double = Send.
4. Enter = newline; Send button/right-shift double tap = send.
5. Advanced Computer Keyboard: Esc, F1–F12, Tab, Caps, Ctrl, Alt, arrows, Home, End, Delete.
6. Custom Ctrl+A = Select All + open Advanced mode.
7. Custom Ctrl+C/V/X support using browser clipboard permission.
8. Custom Ctrl+F = AERON internal chat search.
9. Free browser speech-to-text using Web Speech API.
10. Local verified fallback when API is unavailable.

### Future phases
- AERON MINI Genesis as a replaceable AI engine behind a provider adapter.
- Optional provider failover: primary provider → configured free/low-cost provider → local verified mode.
- Persistent consent-based memory for signed-in students/admins.
- Admin notification center and safe help escalation.
- More computer-keyboard macros, but only through explicit allowlists.
- Voice output (text-to-speech) after browser compatibility testing.

### Rule that must not be broken
Global browser/OS shortcuts are never hijacked. New AERON commands should be implemented on the custom keyboard or behind explicit AERON UI controls. Server-side admin authorization remains mandatory.


## AERON v2.3 input and keyboard UX

- The message textarea is **read-only to the device keyboard by default** (`readonly` + `inputmode="none"`). Typing one character will not suddenly open the Android keyboard.
- **⌨ AERON Keyboard** opens the built-in AERON keyboard.
- **📱 Mobile Keyboard** explicitly opens the Android/browser keyboard. Tapping it again switches back to AERON Keyboard.
- The AERON launcher automatically shrinks and moves away from the keyboard while the AERON keyboard is open. It can also be dragged to a preferred screen position.
- The launcher stays draggable; dragging it does not accidentally open/close the assistant.
- The device keyboard is never intercepted or replaced by JavaScript.
- **Enter** remains a normal newline key in the message textarea. Sending is done with the Send button or the custom right-shift double-tap command.
- Voice input uses the browser's free Speech Recognition API when supported. Final recognized speech is placed into the message and submitted automatically so a completed voice command is not left unsent.
- When the device keyboard is open, the chat panel uses dynamic viewport sizing so the message controls remain above the keyboard as far as the browser allows.



## AERON v2.4 keyboard/mobile UX

- Android system keyboard is **not opened automatically** when the AERON custom keyboard is active.
- The **📱 Mobile Keyboard** button explicitly switches to the device keyboard; pressing it again switches back to AERON Keyboard.
- The AERON launcher becomes a compact, low-opacity floating control while the custom keyboard is open and is positioned away from the input/keyboard area. It remains draggable.
- Normal Enter inserts a newline. Right Shift double-tap sends. Left Shift single-tap applies one capital; double-tap enables Caps Lock.
- A small **× Cancel** control is placed above the right Shift/Send key to close the AERON keyboard without removing the M key.
- Voice input uses the browser's free Speech Recognition API when supported. Final speech is inserted and sent automatically; microphone errors are shown as a useful status message.
- The mobile input controls are compact so the send button remains visible when the Android keyboard is open.

## AERON v2.5 UI/Keyboard update

The v2.5 build focuses on mobile usability: the chat input expands with longer text, Android keyboard switching is explicit, the custom keyboard stays independent, and the floating AERON control automatically moves near the typing indicator when a keyboard is active. The floating control becomes smaller and more transparent in that state and remains draggable.

### Keyboard behavior

- **Enter:** normal newline; it does not send.
- **Left Shift:** single tap = one capital; quick double tap = Caps Lock.
- **Right Shift:** single tap = one capital; quick double tap = Send.
- **CPU:** toggles Computer/Advanced keyboard mode.
- **Ctrl+A:** standard Select All and also enters Computer Mode.
- **Ctrl+C / Ctrl+V / Ctrl+X:** copy/paste/cut behavior is retained where the browser permits clipboard access.
- **Ctrl+F:** opens AERON message search.
- Physical keyboard/browser shortcuts are not globally overridden.

### Voice input

AERON uses the browser's free `SpeechRecognition` / `webkitSpeechRecognition` implementation when available. Voice input may require microphone permission and a secure context such as HTTPS or localhost. If permission is denied, Chrome must be changed to **Allow** for the site.


## v2.6 Mobile keyboard / viewport fix
- First keyboard control opens AERON custom keyboard; the separate 📱 control opens the Android keyboard.
- Android keyboard mode uses `visualViewport` geometry so the panel and Send button stay above the system keyboard.
- The message textarea grows vertically while typing and keeps the caret at the end when switching keyboard modes.
- Custom keyboard Paste uses the browser Clipboard API with a manual text fallback.
- AERON launcher movement is immediate (no drag transition), auto-anchors near the typing indicator while keyboard is open, remains draggable, and double-tap toggles compact size.
- Enter remains a normal newline; Send remains the dedicated button / right-shift double tap.


## AERON v3.0 current mobile fixes

This release addresses Android Chrome keyboard overlap and composer usability based on mobile testing.

- The native Android keyboard frame is calculated from `visualViewport` and applied directly to the panel; the composer is kept inside that frame so the Send button has room to remain visible.
- The custom AERON composer uses the full remaining horizontal width and an always-visible caret. The textarea grows only while text is entered and wraps long messages.
- Chat scrolling uses `scroll-behavior: auto` and overscroll containment to reduce lag/jumps after several messages.
- The AERON floating orb docks beside the typing/status line instead of the Send button when either keyboard is active. Its manual position remains draggable and its compact double-tap state remains available.
- CSS no longer competes with JavaScript using a `100dvh` override for the native keyboard mode; JavaScript owns the exact visual-viewport frame.

For browser compatibility, native device keyboard behaviour depends on the browser exposing IME/visual-viewport geometry. The custom AERON keyboard remains available independently.
