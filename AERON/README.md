# AERON — Surya CEC AI Assistant

Version: 3.0 Mobile Keyboard Stability + Computer Keyboard + Voice + Responsive Composer  
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

# AERON v2.2 — Keyboard & Voice Architecture

## What changed
- **Normal mobile keyboard:** English/Hindi letters, numbers/symbols, Space, Backspace, Clear.
- **Left Shift:** single tap = one capital letter; double tap quickly = Caps Lock.
- **Right Shift / SEND:** single tap = one capital letter; double tap quickly = send message.
- **Enter:** normal Enter inserts a new line. It does **not** send the message.
- **AERON Advanced / Computer mode:** toolbar `ADV` or the custom `Ctrl+A` action opens Advanced mode. Custom `Ctrl+A` first performs standard Select All and then enables Advanced mode.
- **Ctrl+C / Ctrl+V / Ctrl+X:** custom advanced keyboard provides copy/paste/cut behavior where browser permissions allow it.
- **Ctrl+F:** opens AERON's internal chat search. Physical browser Ctrl+F is untouched.
- **Ctrl+Alt style modifiers:** Ctrl and Alt are modifier buttons; future command keys can be added without changing the normal keyboard.
- **Computer keys:** Esc, F1–F12, Tab, Caps, Ctrl, Alt, arrows, Home, End, Delete and other keys are present in Advanced mode.
- **Voice input:** uses the browser's built-in Web Speech API when supported. No paid voice API is required.

## Important keyboard rule
The website does **not** override the device's physical keyboard shortcuts. Physical Ctrl+A/C/V/F continue to follow the browser/OS. The special AERON combinations are implemented on the on-screen custom keyboard.

## How to add a new key later
1. Open `AERON/js/aeron-widget.js`.
2. Normal keys are in `KB_EN`, `KB_HI`, and `KB_NUM`.
3. Computer keys are in `KB_ADV1`.
4. Keys such as Enter, Tab, Delete, arrows and modifiers are handled by `specialKey()`, `moveCaret()`, and `ctrlAction()`.
5. Add a new special key there rather than changing global document shortcuts.
6. Add its visual behavior in `AERON/css/aeron.css`.

## Voice
Speech recognition is browser-provided and therefore has no AERON API charge. Availability depends on the browser/device and may require microphone permission.

## AI/API architecture
AERON uses the configured Google Apps Script endpoint as its current primary provider. If that endpoint is unavailable, the widget falls back to verified local knowledge. No untrusted public LLM endpoint is hard-coded. A future provider can be added behind `apiFetch()` without changing the keyboard.

## Security
- Public pages never receive admin records through the UI.
- Admin actions are server-authorized with the existing admin session token.
- Client-side JavaScript is not treated as a security boundary.
- Sensitive/admin operations must remain allowlisted on the Apps Script backend.


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


## v2.5 Mobile UX update

- Message textarea now auto-grows while typing, up to a safe mobile height, so longer messages remain visible instead of being hidden behind the input area.
- AERON custom keyboard remains independent from the Android keyboard. The `📱`/keyboard control explicitly switches to the device keyboard; switching back returns to the AERON keyboard.
- The toolbar uses `CPU` for **Computer Mode**. The unnecessary `NORMAL • MOBILE MODE` label is hidden.
- Normal Enter remains **newline**. Right Shift single-tap keeps the one-character Shift behavior; quick double-tap sends the message.
- Left Shift single-tap = one capital; double-tap = Caps Lock.
- Mic and mobile-keyboard controls are intentionally small, thin and semi-transparent on phones.
- The Send button is kept prominent and compact.
- The AERON floating circle automatically moves beside the `AERON सोच रहा है...` area while a keyboard is active, becomes smaller/semi-transparent, and returns after keyboard close. Manual dragging is still supported.
- Browser speech-to-text uses the free Web Speech API when the browser supports it. No paid voice API is required for this feature.
- Voice recognition errors now show a clear permission/support message instead of failing silently.

### Chrome microphone permission

For local testing, `http://127.0.0.1:8080` / `http://localhost:8080` can request microphone access in supported Chrome versions. For the deployed site, microphone access should be allowed for the HTTPS domain.

Chrome Android: open the AERON page → tap the **lock/site controls icon** near the address → **Permissions** (or **Site settings**) → **Microphone** → **Allow** → reload the page. If Chrome already blocked it, change Microphone from **Block** to **Allow**.


## AERON v2.7 Mobile Keyboard / Input Rules

- The left `A⌨` button is the single keyboard-mode switch. First tap opens AERON's custom keyboard; the next tap switches to the Android/mobile keyboard; the next tap returns to AERON keyboard.
- The AERON floating orb also opens the chat and AERON keyboard together on the first tap when the panel is closed. A tap while the custom keyboard is open closes that keyboard.
- Android/browser keyboard behavior is not overridden globally. Native Enter remains a newline; the AERON send button sends the message.
- The custom right Shift is a direct Send button in normal mode. Left Shift: one tap = one capital, double tap = Caps Lock.
- `×` above the right Shift clears only the current draft. It does not delete chat history.
- The custom keyboard uses `inputmode=none`/readonly so typing a custom key cannot summon the Android keyboard. The Android keyboard is opened only by the shared keyboard-mode button.
- The message textarea starts compact and auto-grows with wrapped text up to a mobile-friendly limit; the scroll position follows the latest text so the caret remains visible.
- Native Android keyboard mode recalculates the panel against `visualViewport`/VirtualKeyboard geometry so the composer and Send button stay above the keyboard as supported by the browser.
- The AERON orb becomes smaller and semi-transparent while a keyboard mode is active and is placed near the typing indicator; it remains draggable and its manual position persists in localStorage. Double-tap toggles compact size.
- Clipboard Paste uses the browser Clipboard API. No JavaScript prompt dialog is used as a fake paste UI. If permission is denied, an inline notice is shown.
- Voice input uses the browser's free SpeechRecognition/Web Speech implementation when available. Permission must be granted by the browser; no paid speech API is required.

### Adding keyboard buttons

Custom keys are generated in `AERON/js/aeron-widget.js`. Add a normal character to `KB_EN`, `KB_HI`, or `KB_NUM`; add a computer-style control key to `KB_ADV1`. Functional keys are handled in `specialKey()` or `ctrlAction()`. Keep browser-native/global shortcuts untouched unless a new AERON-specific control is required.


## AERON v3.0 — Mobile keyboard stability

This release focuses on the mobile typing experience. The composer now uses the full remaining width, keeps a visible caret, and grows vertically as the message wraps. Chat scrolling uses immediate scrolling/overscroll containment to avoid the repeated jump/lag that can happen while several messages are added.

### Native Android keyboard mode
The system keyboard is opened only through the keyboard-mode control. AERON calculates the current `visualViewport` geometry and explicitly frames the panel between the visible viewport top and the keyboard area. This keeps the typing composer and Send button above the Android keyboard when the browser exposes the IME geometry. The implementation intentionally avoids a competing `100dvh` override; JavaScript owns the exact frame.

### AERON orb
When either keyboard mode is active, the AERON orb is docked beside the typing-status row rather than the Send button. The orb is compact and semi-transparent, remains draggable, and the previous manual position remains stored. A double-tap compact toggle is retained; document-level tap tracking also recognizes the second tap if the first tap immediately moved the orb.

### Keyboard semantics
- Enter inserts a newline.
- The right Shift/Send key sends with one tap in normal mode.
- The small `×` above it deletes one character.
- `C` clears the full draft.
- Arrow keys move the caret and never insert arrow characters.
- In Computer mode, Ctrl/Caps/Shift/Tab and symbol mappings retain their dedicated behavior.

### Browser/device limitation
The website can control its own AERON keyboard and can request the Android keyboard, but it cannot replace the Android keyboard globally. A truly system-wide AERON keyboard for other apps requires a separate Android IME application.

## Files changed in v3.0
`AERON/js/aeron-widget.js` — keyboard state, viewport framing, orb docking and input behavior.

`AERON/css/aeron.css` — final mobile IME-safe panel/composer/orb rules.

`AERON/config/aeron-config.js` — UI version metadata.

This release does not require any provider API key change.


## AERON v3.5 desktop + voice update
- Desktop uses the real PC keyboard; the custom mobile keyboard is hidden above 600px.
- Right Shift double-press sends the current text message.
- Send button is hidden when the composer is empty.
- Header includes Minimize, Maximize/Restore, Stop and Close.
- Double-tap the microphone to enter/exit continuous voice conversation.
- Voice mode uses Hindi (hi-IN) speech recognition and browser Hindi TTS when available.
- Voice session is only auto-restarted after a user explicitly starts voice mode.
- Recent conversation turns are sent to the server LLM for context.
- Gemini API credentials remain server-side in Apps Script Script Properties.


## v3.6 keyboard/API repair
- One composer only: textarea opens the real phone keyboard; one AERON keyboard button opens the custom keyboard.
- Normal mode has no left Shift; the right Shift key is Send. Computer mode also uses the right Shift key as Send.
- Right Shift on a physical PC/laptop sends the current message.
- Custom keyboard suggestions stay above the keys.
- Apps Script remains the primary answer path; Bharat/America capital answers are served through the API, and optional Gemini LLM is used when `AERON_GEMINI_API_KEY` is configured in Script Properties.
