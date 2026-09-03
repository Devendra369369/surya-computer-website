/* ==================================================
   AERON WIDGET v3.0
   Reusable public + student + admin assistant
   - Safe local fallback
   - Custom mobile keyboard
   - Normal / Advanced keyboard modes
   - Standard physical keyboard shortcuts preserved
   - Free browser speech-to-text when supported
================================================== */
"use strict";

(function () {
    const cfg = window.AERON_CONFIG || {
        apiUrl: "",
        instituteName: "Surya Computer Of Education Center",
        instituteLocation: "Kamalpur, Chandauli, Uttar Pradesh",
        contactPhone: "7084275870",
        contactEmail: "sunilkumar5757@gmail.com",
        maxQuestionLength: 1000,
        memoryKey: "AERON_LOCAL_MEMORY_V2",
        anonKey: "AERON_ANONYMOUS_ID_V2",
        launcherPositionKey: "AERON_LAUNCHER_POSITION_V2",
        uiVersion: "3.0.0"
    };

    let localKnowledge = null;
    const knowledgePromise = fetch("AERON/brain/knowledge.json", {cache:"no-store"})
        .then(r => r.ok ? r.json() : null)
        .then(d => { localKnowledge = d; return d; })
        .catch(() => null);

    const state = {
        stopped: false,
        responseTimer: null,
        mode: detectMode(),
        memoryEnabled: false,
        memory: loadLocalMemory(),
        keyboardOpen: false,
        nativeKeyboardOpen: false,
        launcherCompact: false,
        keyboardMode: "letters",
        keyboardLang: "en",
        capsLock: false,
        shiftOnce: false,
        advanced: false,
        ctrl: false,
        alt: false,
        listening: false,
        voiceConversation: !!cfg.voiceConversation,
        voiceSessionActive: false,
        speaking: false,
        minimized: false,
        maximized: false,
        recognition: null,
        lastShiftTap: 0,
        lastRightShiftTap: 0,
        lastLauncherTap: 0
    };

    /* =========================================================
   AERON CLIPBOARD HISTORY
   Max Items: 20
   Storage: IndexedDB
   ========================================================= */

const AERON_CLIPBOARD_DB = "AERON_CLIPBOARD_DB";
const AERON_CLIPBOARD_STORE = "history";
const AERON_CLIPBOARD_MAX_ITEMS = 20;

function openAeronClipboardDB(){
    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(AERON_CLIPBOARD_DB, 1);

        request.onupgradeneeded = (e) => {

            const db = e.target.result;

            if(!db.objectStoreNames.contains(
                AERON_CLIPBOARD_STORE
            )){

                const store = db.createObjectStore(
                    AERON_CLIPBOARD_STORE,
                    {
                        keyPath: "id",
                        autoIncrement: true
                    }
                );

                store.createIndex(
                    "createdAt",
                    "createdAt"
                );

                store.createIndex(
                    "pinned",
                    "pinned"
                );
            }
        };

        request.onsuccess = (e) => {
            resolve(e.target.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}
  /* =========================
   SAVE CLIPBOARD ITEM
   ========================= */

async function saveAeronClipboard(text){

    text = String(text || "");

    if(!text){
        return;
    }

    try{

        const db = await openAeronClipboardDB();

        await new Promise((resolve, reject) => {

            const tx = db.transaction(
                AERON_CLIPBOARD_STORE,
                "readwrite"
            );

            const store = tx.objectStore(
                AERON_CLIPBOARD_STORE
            );

            const request = store.getAll();

            request.onsuccess = () => {

                const items = request.result || [];

                const duplicate = items.find(
                    item => item.text === text
                );

                if(duplicate){
                    store.delete(duplicate.id);
                }

                store.add({
                    text: text,
                    createdAt: Date.now(),
                    pinned: false
                });
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                resolve();
            };

            tx.onerror = () => {
                reject(tx.error);
            };

            tx.onabort = () => {
                reject(tx.error);
            };
        });

        db.close();

        await trimAeronClipboard();
      /* =========================
   CLIPBOARD PIN
   ========================= */

async function toggleAeronClipboardPin(id, pinned){
    try{
        const db = await openAeronClipboardDB();

        await new Promise((resolve, reject) => {
            const tx = db.transaction(
                AERON_CLIPBOARD_STORE,
                "readwrite"
            );

            const store =
                tx.objectStore(AERON_CLIPBOARD_STORE);

            const request = store.get(id);

            request.onsuccess = () => {
                const item = request.result;

                if(!item){
                    return;
                }

                item.pinned = !!pinned;
                store.put(item);
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                resolve();
            };

            tx.onerror = () => {
                reject(tx.error);
            };
        });

        db.close();

    }catch(err){
        console.warn(
            "AERON Clipboard pin error:",
            err
        );
    }
}


/* =========================
   CLIPBOARD DELETE
   ========================= */

async function deleteAeronClipboard(id){
    try{
        const db = await openAeronClipboardDB();

        await new Promise((resolve, reject) => {
            const tx = db.transaction(
                AERON_CLIPBOARD_STORE,
                "readwrite"
            );

            tx.objectStore(
                AERON_CLIPBOARD_STORE
            ).delete(id);

            tx.oncomplete = () => {
                resolve();
            };

            tx.onerror = () => {
                reject(tx.error);
            };
        });

        db.close();

    }catch(err){
        console.warn(
            "AERON Clipboard delete error:",
            err
        );
    }
}


/* =========================
   CLIPBOARD CLEAR ALL
   ========================= */

async function clearAeronClipboard(){
    try{
        const db = await openAeronClipboardDB();

        await new Promise((resolve, reject) => {
            const tx = db.transaction(
                AERON_CLIPBOARD_STORE,
                "readwrite"
            );

            tx.objectStore(
                AERON_CLIPBOARD_STORE
            ).clear();

            tx.oncomplete = () => {
                resolve();
            };

            tx.onerror = () => {
                reject(tx.error);
            };
        });

        db.close();

    }catch(err){
        console.warn(
            "AERON Clipboard clear error:",
            err
        );
    }
}

    }catch(err){

        console.warn(
            "AERON Clipboard save error:",
            err
        );
    }
}
  /* =========================
   GET ALL CLIPBOARD ITEMS
   ========================= */

async function getAeronClipboard(){

    try{

        const db = await openAeronClipboardDB();

        return await new Promise((resolve, reject) => {

            const tx = db.transaction(
                AERON_CLIPBOARD_STORE,
                "readonly"
            );

            const store = tx.objectStore(
                AERON_CLIPBOARD_STORE
            );

            const request = store.getAll();

            request.onsuccess = () => {

                const items = request.result || [];

                items.sort(
                    (a, b) =>
                        b.createdAt - a.createdAt
                );

                resolve(items);
            };

            request.onerror = () => {
                reject(request.error);
            };

            tx.oncomplete = () => {
                db.close();
            };
        });

    }catch(err){

        console.warn(
            "AERON Clipboard read error:",
            err
        );

        return [];
    }
}
  /* =========================
   CLIPBOARD AUTO CLEANUP
   ========================= */

async function trimAeronClipboard(){
    try{
        const items = await getAeronClipboard();

        if(items.length <= AERON_CLIPBOARD_MAX_ITEMS){
            return;
        }

        // सबसे पुराने unpinned items पहले हटेंगे
        const unpinned = items
            .filter(item => !item.pinned)
            .sort((a,b) => a.createdAt - b.createdAt);

        const removeCount =
            items.length - AERON_CLIPBOARD_MAX_ITEMS;

        const removeItems =
            unpinned.slice(0, removeCount);

        if(!removeItems.length){
            return;
        }

        const db = await openAeronClipboardDB();

        await new Promise((resolve, reject) => {

            const tx = db.transaction(
                AERON_CLIPBOARD_STORE,
                "readwrite"
            );

            const store =
                tx.objectStore(AERON_CLIPBOARD_STORE);

            removeItems.forEach(item => {
                store.delete(item.id);
            });

            tx.oncomplete = () => {
                resolve();
            };

            tx.onerror = () => {
                reject(tx.error);
            };

            tx.onabort = () => {
                reject(tx.error);
            };
        });

        db.close();

    }catch(err){

        console.warn(
            "AERON Clipboard cleanup error:",
            err
        );
    }
}

    function detectMode() {
        const page = (location.pathname.split("/").pop() || "");
        const isAdminPage = /^admin(?:-|\.html|$)/i.test(page);
        const adminAuth = sessionStorage.getItem("SURYA_ADMIN_TOKEN") && sessionStorage.getItem("SURYA_ADMIN_AUTH") === "true";
        if (isAdminPage && adminAuth) return "admin";
        const studentAuth = sessionStorage.getItem("SURYA_STUDENT_TOKEN") && sessionStorage.getItem("SURYA_STUDENT_AUTH") === "true";
        if (studentAuth) return "student";
        return "public";
    }

    function isDesktopAeron(){
        return window.matchMedia && window.matchMedia("(min-width: 601px)").matches;
    }

    function esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
    }

    function anonId() {
        let id = localStorage.getItem(cfg.anonKey);
        if (!id) {
            id = "anon-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random());
            localStorage.setItem(cfg.anonKey, id);
        }
        return id;
    }

    function loadLocalMemory() {
        try {
            const raw = localStorage.getItem(cfg.memoryKey);
            return raw ? JSON.parse(raw) : {};
        } catch (_) { return {}; }
    }
    function saveLocalMemory() { try { localStorage.setItem(cfg.memoryKey, JSON.stringify(state.memory)); } catch (_) {} }
    function rememberLocal(key, value) {
        if (!state.memoryEnabled || !key || !value) return;
        state.memory[String(key).slice(0,80)] = String(value).slice(0,500);
        saveLocalMemory();
    }

    function apiFetch(payload) {
        if (!cfg.apiUrl) return Promise.reject(new Error("AERON API is not configured."));
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(), 5500);
        return fetch(cfg.apiUrl, {
            method:"POST",
            headers:{"Content-Type":"text/plain;charset=utf-8"},
            body:JSON.stringify(payload),
            signal:controller.signal
        }).then(async r => {
            let d = null;
            try { d = await r.json(); } catch (_) {}
            if (!r.ok) throw new Error((d && d.message) || "AERON API request failed.");
            return d || {};
        }).finally(()=>clearTimeout(timer));
    }

    function buildWidget() {
        if (document.querySelector(".aeron-widget")) return;

        const root = document.createElement("div");
        root.className = "aeron-widget";
        root.innerHTML = `
            <button class="aeron-launcher" id="aeronLauncher" type="button" aria-label="Open AERON Assistant">
                <span class="aeron-robot"><img src="AERON/assets/icon/aeron.svg" alt="" aria-hidden="true"></span>
                <span class="aeron-status" aria-hidden="true"></span>
            </button>
            <section class="aeron-panel" id="aeronPanel" aria-hidden="true">
                <header class="aeron-header">
                    <div class="aeron-avatar"><img src="AERON/assets/icon/aeron.svg" alt="" aria-hidden="true"></div>
                    <div class="aeron-title"><strong>AERON</strong><span>Surya CEC Assistant</span><small class="aeron-mode"></small></div>
                    <div class="aeron-window-controls" role="group" aria-label="Window controls">
                        <button class="aeron-window-btn" id="aeronMinimize" type="button" title="Minimize">—</button>
                        <button class="aeron-window-btn" id="aeronMaximize" type="button" title="Maximize">□</button>
                        <button class="aeron-stop" id="aeronStop" type="button" title="Stop / Start AERON">■</button>
                        <button class="aeron-close" id="aeronClose" type="button" title="Close">×</button>
                    </div>
                </header>

                <div class="aeron-chat" id="aeronChat"></div>
                <div class="aeron-typing" id="aeronTyping" hidden><span></span><span></span><span></span><b>AERON सोच रहा है...</b></div>

                <form class="aeron-input-area" id="aeronForm">
                    <div class="aeron-compose-row">
    <textarea id="aeronInput" rows="1" maxlength="${Number(cfg.maxQuestionLength || 1000)}" placeholder="AERON से कुछ पूछें..." autocomplete="on" autocorrect="on" autocapitalize="sentences" spellcheck="true" inputmode="text" wrap="soft" aria-label="Message to AERON"></textarea>

    <div class="aeron-compose-buttons">
        <button type="button" class="aeron-keyboard-toggle" id="aeronKeyboardToggle" aria-label="Keyboard mode" title="AERON keyboard">⌨</button>
        <button type="button" id="aeronAction" aria-label="Voice input" title="Voice input">🎙️</button>
    </div>
</div>
                    <div class="aeron-keyboard notranslate" id="aeronKeyboard" hidden aria-label="AERON custom keyboard" translate="no">
                        <div class="aeron-keyboard-toolbar">
                            <button type="button" data-kb-action="lang" title="English / Hindi">अं</button>
                            <button type="button" data-kb-action="numbers" title="Numbers and symbols">123</button>
                            <button type="button" data-kb-action="mode" title="Normal / Computer keyboard">MODE</button>
                            <button type="button" id="aeronClipboardButton" title="Clipboard History" aria-label="Clipboard History">📋</button>
                            <button type="button" data-kb-action="clear" title="Clear">C</button>
                        </div>
                        <div class="aeron-suggestions notranslate" id="aeronSuggestions" translate="no" aria-label="Word suggestions"></div>
                        <div class="aeron-clipboard-panel" id="aeronClipboardPanel" hidden>

    <div class="aeron-clipboard-header">
        <strong>📋 Clipboard</strong>

        <button
            type="button"
            id="aeronClipboardClose"
            title="Close"
            aria-label="Close"
        >✕</button>
    </div>

    <div
        class="aeron-clipboard-list"
        id="aeronClipboardList"
    ></div>

    <div class="aeron-clipboard-footer">

        <span id="aeronClipboardCount">
            0 / 20 items
        </span>

        <button
            type="button"
            id="aeronClipboardClear"
        >Clear All</button>

    </div>

</div>
                        <div class="aeron-keyboard-rows" id="aeronKeyboardRows"></div>
                    </div>
                </form>

                <div class="aeron-footer"><span>AERON • Surya CEC</span><span class="aeron-memory-status" id="aeronMemoryStatus"></span><button type="button" id="aeronHide">Hide</button></div>
            </section>
        `;
        document.body.appendChild(root);

        const panel = root.querySelector("#aeronPanel");
        const chat = root.querySelector("#aeronChat");
        const input = root.querySelector("#aeronInput");
        const action = root.querySelector("#aeronAction");
        const send = action;
        const mic = action;
        const typing = root.querySelector("#aeronTyping");

        // Chrome / Google Translate: NEVER translate AERON UI or chat.
        [
            root,
            chat,
            typing,
            root.querySelector(".aeron-title"),
            root.querySelector(".aeron-window-controls"),
            root.querySelector("#aeronForm"),
            root.querySelector(".aeron-footer"),
            root.querySelector("#aeronKeyboard")
        ].forEach(function(el) {
            if (el) {
                el.classList.add("notranslate");
                el.setAttribute("translate", "no");
            }
        });

        input.setAttribute("translate", "no");
        input.classList.add("notranslate");
        input.setAttribute("data-no-translate", "true");
        input.setAttribute("translate", "no");
        input.placeholder = "AERON से कुछ पूछें...";

        const stop = root.querySelector("#aeronStop");
        const minimize = root.querySelector("#aeronMinimize");
        const maximize = root.querySelector("#aeronMaximize");
        const keyboard = root.querySelector("#aeronKeyboard");
        const keyboardRows = root.querySelector("#aeronKeyboardRows");
        const keyboardToggle = root.querySelector("#aeronKeyboardToggle");
        const clipboardButton =
    root.querySelector("#aeronClipboardButton");
        const launcher = root.querySelector("#aeronLauncher");
        const suggestions = root.querySelector("#aeronSuggestions");
        /* =========================================================
   AERON CLIPBOARD PANEL REFERENCES
   ========================================================= */

const clipboardPanel =
    root.querySelector("#aeronClipboardPanel");

const clipboardList =
    root.querySelector("#aeronClipboardList");

const clipboardClose =
    root.querySelector("#aeronClipboardClose");

const clipboardClear =
    root.querySelector("#aeronClipboardClear");

const clipboardCount =
    root.querySelector("#aeronClipboardCount");

/* Clipboard delete fallback: capture before keyboard-level handlers. */
if(clipboardList && !clipboardList.dataset.deleteCaptureBound){
    clipboardList.dataset.deleteCaptureBound = "1";
    clipboardList.addEventListener("click", async (e) => {
        const button = e.target.closest("[data-clipboard-delete-id]");
        if(!button || !clipboardList.contains(button)) return;
        e.preventDefault();
        e.stopPropagation();
        const id = Number(button.dataset.clipboardDeleteId);
        if(!Number.isFinite(id)) return;
        await deleteAeronClipboard(id);
        await renderAeronClipboard();
    }, {capture:true});
}
      /* =========================================================
   RENDER AERON CLIPBOARD HISTORY
   ========================================================= */

async function renderAeronClipboard(){

    if(!clipboardList){
        return;
    }

    clipboardList.innerHTML = "";

    const items = await getAeronClipboard();

    clipboardCount.textContent =
        `${items.length} / ${AERON_CLIPBOARD_MAX_ITEMS} items`;

    if(!items.length){

        const empty = document.createElement("div");

        empty.className =
            "aeron-clipboard-empty";

        empty.textContent =
            "Clipboard history अभी खाली है.";

        clipboardList.appendChild(empty);

        return;
    }

    items.forEach(item => {

        const box =
            document.createElement("div");

        box.className =
            "aeron-clipboard-item";


        /* -------- TEXT -------- */

        const preview =
            document.createElement("div");

        preview.className =
            "aeron-clipboard-text";

        preview.textContent =
            item.text;


        /* -------- CHARACTER COUNT -------- */

        const info =
            document.createElement("div");

        info.className =
            "aeron-clipboard-info";

        info.textContent =
            `${item.text.length.toLocaleString()} characters`;


        /* -------- ACTIONS -------- */

        const actions =
            document.createElement("div");

        actions.className =
            "aeron-clipboard-actions";


        /* -------- PASTE -------- */

        const paste =
            document.createElement("button");

        paste.type = "button";
        paste.textContent = "Paste";
        paste.title = "Paste";

        paste.addEventListener(
    "pointerdown",
    (e) => {

        e.preventDefault();
        e.stopPropagation();

        const wasKeyboardOpen =
            state.keyboardOpen;

        if(wasKeyboardOpen){
            input.setAttribute(
                "inputmode",
                "none"
            );
        }

        insertText(item.text);

        clipboardPanel.hidden = true;

        if(wasKeyboardOpen){

            requestAnimationFrame(() => {

                input.focus({
                    preventScroll: true
                });

                requestAnimationFrame(
                    ensureCaretVisible
                );

            });
        }
    }
);
        /* -------- PIN -------- */

        const pin =
            document.createElement("button");

        pin.type = "button";

        pin.textContent =
            item.pinned ? "📌" : "📍";

        pin.title =
            item.pinned
                ? "Unpin"
                : "Pin";

        pin.addEventListener(
            "click",
            async () => {

                await toggleAeronClipboardPin(
                    item.id,
                    !item.pinned
                );

                await renderAeronClipboard();
            }
        );


        /* -------- DELETE -------- */

        const del =
            document.createElement("button");

        del.type = "button";
        del.textContent = "🗑️";
        del.title = "Delete";
        del.dataset.clipboardDeleteId = String(item.id);

        del.addEventListener(
            "click",
            async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await deleteAeronClipboard(item.id);
                await renderAeronClipboard();
            },
            {capture:true}
        );


        actions.append(
            paste,
            pin,
            del
        );

        box.append(
            preview,
            info,
            actions
        );

        clipboardList.appendChild(box);

    });
}
      /* =========================================================
   CLIPBOARD PANEL CONTROLS
   ========================================================= */

async function openAeronClipboard(){

    clipboardPanel.hidden = false;

    /* =========================
       IMPORT CURRENT CLIPBOARD
       ========================= */

    try{

        if(navigator.clipboard?.readText){

            const externalText =
                await navigator.clipboard.readText();

            if(externalText){
                await saveAeronClipboard(externalText);
            }
        }

    }catch(_){
        // Clipboard permission denied होने पर
        // History फिर भी खुलेगी
    }

    await renderAeronClipboard();
}


function closeAeronClipboard(){

    clipboardPanel.hidden = true;

    clipboardPanel.style.removeProperty("position");
    clipboardPanel.style.removeProperty("left");
    clipboardPanel.style.removeProperty("right");
    clipboardPanel.style.removeProperty("bottom");
    clipboardPanel.style.removeProperty("max-height");
    clipboardPanel.style.removeProperty("z-index");
    clipboardPanel.style.removeProperty("display");
}


function closeClipboardOnly(e){

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    /* X = ONLY close Clipboard.
       Do not touch input, focus or keyboard state. */

    clipboardPanel.hidden = true;

    clipboardPanel.style.removeProperty("position");
    clipboardPanel.style.removeProperty("left");
    clipboardPanel.style.removeProperty("right");
    clipboardPanel.style.removeProperty("bottom");
    clipboardPanel.style.removeProperty("max-height");
    clipboardPanel.style.removeProperty("z-index");
    clipboardPanel.style.removeProperty("display");
}

/* Clipboard X — CLICK ONLY.
   Do not close on pointerdown because that can expose
   the keyboard underneath before the click event finishes. */
clipboardClose.addEventListener(
    "click",
    closeClipboardOnly,
    {
        passive: false,
        capture: true
    }
);


clipboardClear.addEventListener(
    "click",
    async () => {

        await clearAeronClipboard();

        await renderAeronClipboard();
    }
);
        clipboardButton?.addEventListener(
    "pointerdown",
    async (e) => {

        e.preventDefault();
        e.stopPropagation();

        if(clipboardPanel.hidden){

            await openAeronClipboard();

            /* FINAL CLIPBOARD OVERLAY POSITION */
            clipboardPanel.hidden = false;
            clipboardPanel.style.setProperty(
                "position",
                "fixed",
                "important"
            );
            clipboardPanel.style.setProperty(
                "left",
                "6px",
                "important"
            );
            clipboardPanel.style.setProperty(
                "right",
                "6px",
                "important"
            );
            clipboardPanel.style.setProperty(
                "bottom",
                "80px",
                "important"
            );
            clipboardPanel.style.setProperty(
                "max-height",
                "190px",
                "important"
            );
            clipboardPanel.style.setProperty(
                "z-index",
                "2147483647",
                "important"
            );
            clipboardPanel.style.setProperty(
                "display",
                "flex",
                "important"
            );

        }else{

            closeAeronClipboard();

            clipboardPanel.style.removeProperty("position");
            clipboardPanel.style.removeProperty("left");
            clipboardPanel.style.removeProperty("right");
            clipboardPanel.style.removeProperty("bottom");
            clipboardPanel.style.removeProperty("max-height");
            clipboardPanel.style.removeProperty("z-index");
            clipboardPanel.style.removeProperty("display");

        }
    },
    { passive: false }
);
        setTimeout(setKeyboardButtonLabel,0);
        setTimeout(updateSendVisibility,0);

        root.querySelector(".aeron-mode").textContent = state.mode === "admin" ? "Admin Assistant" : state.mode === "student" ? "Student Assistant" : "Public Assistant";
        function scrollBottom(){ chat.scrollTop = chat.scrollHeight; requestAnimationFrame(()=>{ chat.scrollTop = chat.scrollHeight; }); }
        function addMessage(html,type="bot") {
            const row=document.createElement("div");
            row.className=`aeron-message ${type === "user" ? "aeron-user" : "aeron-bot"}`;

            // Chrome / Google Translate: NEVER translate chat messages.
            row.classList.add("notranslate");
            row.setAttribute("translate", "no");
            row.innerHTML=`<div class="aeron-message-avatar"><img src="AERON/assets/icon/aeron.svg" alt="" aria-hidden="true"></div><div class="aeron-bubble">${html}</div>`;
            chat.appendChild(row); scrollBottom();
            if(type !== "user" && state.voiceSessionActive){
                speakAeron(stripHtml(html));
            }
        }
        function setTyping(on){ typing.hidden=!on; if(on) scrollBottom(); requestAnimationFrame(positionLauncherNearTyping); }
        function updateSendVisibility(){
            const hasText=String(input.value||"").trim().length>0;
            action.type=hasText?"submit":"button";
            action.textContent=hasText?"➤":"🎙️";
            action.setAttribute("aria-label",hasText?"Send message":"Voice input");
            action.title=hasText?"Send message":"Voice input";
            action.classList.toggle("aeron-send-mode",hasText);
            action.classList.toggle("aeron-voice-mode",!hasText);
            action.disabled=state.stopped;
        }
        function stripHtml(html){ const d=document.createElement("div"); d.innerHTML=String(html||""); return (d.textContent||d.innerText||"").replace(/\s+/g," ").trim(); }
        function cleanSpeechText(html){
            let text=stripHtml(html);
            // TTS should speak words, not UI decoration/markdown.
            text=text.replace(/[*_`~#]+/g," ");
            text=text.replace(/https?:\/\/\S+/gi," ");
            text=text.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu," ");
            text=text.replace(/\s+/g," ").trim();
            return text.slice(0,4000);
        }
        function chooseHindiVoice(){
            if(!("speechSynthesis" in window)) return null;
            const voices=window.speechSynthesis.getVoices()||[];
            const text=v=>((v.name||"")+" "+(v.voiceURI||"")+" "+(v.lang||"")).toLowerCase();
            const hi=voices.filter(v=>/^hi[-_]IN$/i.test(v.lang));
            // Prefer a Hindi/Indian male-sounding system voice when the device provides one.
            // Browsers do not expose a reliable voice age, so an exact "18-year-old" voice
            // cannot be guaranteed; pitch/rate are used only as a light youthful adjustment.
            const maleNames=hi.find(v=>/(madhur|hemant|ravi|male|man|google hindi|microsoft.*hindi)/i.test(text(v)) && !/(female|swara|heera|kalpana)/i.test(text(v)));
            if(maleNames) return maleNames;
            if(hi.length) return hi[0];
            return voices.find(v=>/(hi[-_]in|hindi|india)/i.test(text(v)) && !/(female|swara|heera|kalpana)/i.test(text(v))) || null;
        }
        async function speakAeron(text){
            if(!state.voiceSessionActive || !cfg.voiceOutput || !String(text||"").trim()) return;
            const spoken=cleanSpeechText(text);
            if(!spoken) return;
            state.speaking=true;
            try{
                // AERON local TTS foundation is always tried first.
                if(window.AERON_TTS){
                    const localOk=await window.AERON_TTS.speak(spoken,{
                        voice:cfg.ttsVoice||"male",
                        lang:cfg.voiceLang||"hi-IN",
                        rate:Number(cfg.voiceRate||0.96),
                        pitch:Number(cfg.voicePitch||1.03)
                    });
                    if(localOk){
                        state.speaking=false;
                        if(state.voiceSessionActive && !state.stopped) setTimeout(startListening,220);
                        return;
                    }
                }
                // Temporary compatibility fallback until the local neural voice model is installed.
                if(!("speechSynthesis" in window)) { state.speaking=false; return; }
                window.speechSynthesis.cancel();
                const u=new SpeechSynthesisUtterance(spoken);
                u.lang=cfg.voiceLang||"hi-IN";
                u.rate=Number(cfg.voiceRate||0.96);
                u.pitch=Number(cfg.voicePitch||1.03);
                const v=chooseHindiVoice(); if(v) u.voice=v;
                u.onend=()=>{state.speaking=false;if(state.voiceSessionActive && !state.stopped) setTimeout(startListening,220);};
                u.onerror=()=>{state.speaking=false;if(state.voiceSessionActive && !state.stopped) setTimeout(startListening,350);};
                window.speechSynthesis.speak(u);
            }catch(_){ state.speaking=false; }
        }
        if("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged=()=>{};
        function autoGrowInput(){
            input.style.width="100%";
            input.style.height="auto";
            const isMobile=window.matchMedia && window.matchMedia("(max-width:600px)").matches;
            const max=isMobile ? (state.keyboardOpen ? 90 : Math.min(160, Math.max(100, Math.round(window.innerHeight*0.22)))) : 220;
            const desired=Math.max(42,input.scrollHeight);
            input.style.height=Math.min(desired,max)+"px";
            input.style.overflowY=input.scrollHeight>max?"auto":"hidden";
            // Keep the newest text/caret visible, just like a modern chat composer.
            input.scrollTop=Math.max(0,input.scrollHeight-input.clientHeight);
            requestAnimationFrame(()=>{
                input.scrollTop=Math.max(0,input.scrollHeight-input.clientHeight);
                ensureCaretVisible();
                positionLauncherNearTyping();
                updateKeyboardViewport();
            });
        }

        function addQuickActions(){
            const box=document.createElement("div"); box.className="aeron-quick-actions";
            const actions=state.mode === "admin" ? [["📋 Pending Admissions","pending admissions"],["📨 Notifications","show notifications"],["👨‍🎓 Student Count","student count"],["🎓 Certificates","certificate count"]] : [["📚 Courses","courses"],["📝 Admission","admission"],["🎓 Certificate","certificate"],["📞 Contact","contact"],["🆘 Need Help","I need human help"]];
            actions.forEach(([label,q])=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.dataset.question=q;b.addEventListener("click",()=>submitQuestion(q));box.appendChild(b);});
            chat.appendChild(box); scrollBottom();
        }
        function intro(){
            let text=`<strong>नमस्ते! 👋</strong><p>मैं AERON हूँ। मैं ${esc(cfg.instituteName)} की website पर आपकी मदद करने के लिए तैयार हूँ।</p>`;
            if(state.mode === "admin") text += `<p>🛡️ Admin mode सक्रिय है। केवल server-authorized admin actions उपलब्ध हैं।</p>`;
            else if(state.mode === "student") text += `<p>🎓 Student mode सक्रिय है।</p>`;
            addMessage(text); addQuickActions();
        }
        function open(){ panel.classList.add("open"); panel.setAttribute("aria-hidden","false"); }
        function close(){ stopListening(); closeKeyboard(); state.nativeKeyboardOpen=false; root.classList.remove("aeron-system-keyboard-active"); panel.classList.remove("open"); panel.setAttribute("aria-hidden","true"); }
        function hideVirtualKeyboard(){
            try{ input.blur(); document.activeElement?.blur?.(); }catch(_){}
            try{ if(navigator.virtualKeyboard && navigator.virtualKeyboard.hide) navigator.virtualKeyboard.hide(); }catch(_){}
        }
        function stopAeron(){ state.stopped=true; clearTimeout(state.responseTimer); setTyping(false); input.disabled=true; send.disabled=true; mic.disabled=true; panel.classList.add("aeron-stopped"); closeKeyboard(); stop.textContent="▶"; }
        function startAeron(){ state.stopped=false; input.disabled=false; send.disabled=false; mic.disabled=false; input.placeholder="AERON से कुछ पूछें..."; panel.classList.remove("aeron-stopped"); stop.textContent="■"; input.focus({preventScroll:true}); }

        function insertText(text){
            if(state.stopped) return;
            const start=input.selectionStart ?? input.value.length, end=input.selectionEnd ?? input.value.length;
            const room=Number(cfg.maxQuestionLength||1000)-input.value.length+(end-start);
            text=String(text||"").slice(0,Math.max(0,room));
            input.setRangeText(text,start,end,"end");
            input.dispatchEvent(new Event("input",{bubbles:true}));
            autoGrowInput();
            if(state.keyboardOpen){ input.focus({preventScroll:true}); }
        }
        function keepInputCaretVisible(){
            if(!input) return;
            try{ input.focus({preventScroll:true}); }catch(_){ try{ input.focus(); }catch(__){} }
            requestAnimationFrame(()=>{ ensureCaretVisible(); autoGrowInput(); });
        }
        function ensureCaretVisible(){

    if(!input) return;

    try{

        const cs = getComputedStyle(input);

        const lineHeight =
            parseFloat(cs.lineHeight) ||
            Math.max(
                20,
                parseFloat(cs.fontSize) || 15
            ) * 1.45;

        const caretPosition =
            input.selectionStart ?? input.value.length;

        const textBefore =
            input.value.slice(0, caretPosition);

        /*
         * Textarea में wrapped lines को ध्यान में रखते हुए
         * caret के आसपास का text calculate करते हैं।
         */
        const textareaWidth =
            input.clientWidth -
            (parseFloat(cs.paddingLeft) || 0) -
            (parseFloat(cs.paddingRight) || 0);

        const fontSize =
            parseFloat(cs.fontSize) || 15;

        const approxCharWidth =
            Math.max(7, fontSize * 0.52);

        const charsPerLine =
            Math.max(
                1,
                Math.floor(
                    textareaWidth /
                    approxCharWidth
                )
            );

        const logicalLines =
            textBefore.split("\n");

        let visualLines = 0;

        logicalLines.forEach(line => {

            visualLines += Math.max(
                1,
                Math.ceil(
                    line.length /
                    charsPerLine
                )
            );

        });

        /*
         * Caret की अनुमानित vertical position.
         */
        const padTop =
            parseFloat(cs.paddingTop) || 0;

        const caretTop =
            Math.max(
                0,
                (visualLines - 1) *
                lineHeight +
                padTop
            );

        const caretBottom =
            caretTop + lineHeight;

        const viewTop =
            input.scrollTop;

        const viewBottom =
            viewTop + input.clientHeight;

        /*
         * ऊपर चला गया हो तो ऊपर scroll करो।
         */
        if(caretTop < viewTop + 8){

            input.scrollTop =
                Math.max(
                    0,
                    caretTop - 8
                );
        }

        /*
         * नीचे छिप रहा हो तो नीचे scroll करो।
         */
        else if(
            caretBottom >
            viewBottom - 8
        ){

            input.scrollTop =
                Math.max(
                    0,
                    caretBottom -
                    input.clientHeight +
                    8
                );
        }

        /*
         * Browser को actual caret तक scroll करने का
         * एक अतिरिक्त मौका।
         */
        requestAnimationFrame(() => {

            try{

                const active =
                    document.activeElement === input;

                if(
                    active &&
                    state.keyboardOpen
                ){

                    input.scrollIntoView({
                        block: "nearest",
                        inline: "nearest"
                    });

                }

            }catch(_){}

        });

    }catch(_){}
        }
        function backspace(){
            const s=input.selectionStart??input.value.length,e=input.selectionEnd??input.value.length;
            if(s!==e) input.setRangeText("",s,e,"start");
            else if(s>0) input.setRangeText("",s-1,s,"start");
            input.dispatchEvent(new Event("input",{bubbles:true}));
            autoGrowInput();
            requestAnimationFrame(ensureCaretVisible);
            if(state.keyboardOpen){ input.focus({preventScroll:true}); }
        }
        function selectAll(){ input.focus({preventScroll:true}); input.select(); requestAnimationFrame(ensureCaretVisible); }
        function copySelected(){
            const s=input.selectionStart??0,e=input.selectionEnd??0;
            if(s===e) return;
            const text=input.value.slice(s,e);
            navigator.clipboard?.writeText(text).catch(()=>{});
        }
        async function pasteClipboard(){
            try {
                if(!navigator.clipboard?.readText){
                    addSystemNotice("📋 इस browser में clipboard paste उपलब्ध नहीं है।");
                    return;
                }
                const t=await navigator.clipboard.readText();
                if(t) insertText(t);
                else addSystemNotice("📋 Clipboard खाली है।");
            }catch(_){
                addSystemNotice("📋 Clipboard permission नहीं मिली। Browser में Paste/Clipboard की अनुमति दें।");
            }
        }
        function clearDraft(){
            input.value="";
            updateSendVisibility();
            autoGrowInput();
            input.focus({preventScroll:true});
        }

        const KB_EN=[["q","w","e","r","t","y","u","i","o","p"],["a","s","d","f","g","h","j","k","l"],["z","x","c","v","b","n","m"]];
        const KB_HI=[["क","ख","ग","घ","ङ","च","छ","ज","झ","ञ"],["ट","ठ","ड","ढ","ण","त","थ","द","ध","न"],["प","फ","ब","भ","म","य","र","ल","व","स"],["श","ष","ह","अ","आ","इ","ई","उ","ऊ","ए"],["ऐ","ओ","औ","ं","ः","्","़","।","?","!"]];
        const KB_NUM=[["1","2","3","4","5","6","7","8","9","0"],["@","#","$","%","&","*","-","+","=","/"],[".",",","!","?","(",")","[","]","{","}"]];
        const KB_ADV1=[
            ["Esc","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12"],
            ["`","1","2","3","4","5","6","7","8","9","0","-","=","Backspace"],
            ["Tab","q","w","e","r","t","y","u","i","o","p","[","]","\\"],
            ["Caps","a","s","d","f","g","h","j","k","l",";","'","Enter"],
            ["Shift","z","x","c","v","b","n","m",",",".","/","Shift"],
            ["Ctrl","Alt","Space","←","↑","↓","→","Home","End","Delete"]
        ];
        const KB_SYMBOLS=[["~","!","@","#","$","%","^","&","*","(",")","_","+"],["{","}","<",">","[","]","|","\\",";",":","'","\""],["/","?","\\","@","#","$","%","&","*",".",","]];

        function specialKey(key){
            if(key === "Backspace") { backspace(); return true; }
            if(key === "Space") { insertText(" "); return true; }
            if(key === "Enter") { insertText("\n"); return true; }
            if(key === "Tab") { insertText("\t"); return true; }
            if(key === "Delete") {
                const s=input.selectionStart??0,e=input.selectionEnd??0;
                if(s!==e) input.setRangeText("",s,e,"start");
                else input.setRangeText("",s,Math.min(input.value.length,s+1),"start");
                input.dispatchEvent(new Event("input",{bubbles:true}));
                autoGrowInput();
                return true;
            }
            if(["←","↑","↓","→","Home","End"].includes(key)) { moveCaret(key); return true; }
            if(key === "Esc") { state.ctrl=false; state.alt=false; renderKeyboard(); return true; }
            if(/^F(?:[1-9]|1[0-2])$/.test(key)) return true;
            return false;
        }
        function moveCaret(key){
            let p=input.selectionStart??0;
            if(key === "←") p=Math.max(0,p-1);
            if(key === "→") p=Math.min(input.value.length,p+1);
            if(key === "Home") p=0;
            if(key === "End") p=input.value.length;
            if(key === "↑" || key === "↓") { const before=input.value.slice(0,p); const col=before.length-(before.lastIndexOf("\n")+1); const lines=input.value.split("\n"); let row=0,pos=0; for(let i=0;i<lines.length;i++){if(p<=pos+lines[i].length){row=i;break;}pos+=lines[i].length+1;} if(key==="↑"&&row>0){let np=0;for(let i=0;i<row-1;i++)np+=lines[i].length+1;p=np+Math.min(col,lines[row-1].length);} if(key==="↓"&&row<lines.length-1){let np=0;for(let i=0;i<row+1;i++)np+=i===row?0:lines[i].length+1;p=np+Math.min(col,lines[row+1].length);}}
            input.setSelectionRange(p,p); input.focus({preventScroll:true});
            requestAnimationFrame(ensureCaretVisible);
        }
        function ctrlAction(key){
            const k=String(key).toLowerCase();
            if(k === "a") { selectAll(); state.advanced=true; state.ctrl=false; renderKeyboard(); addSystemNotice("Advanced keyboard ON — Ctrl+A ने standard Select All भी किया है."); return true; }
            if(k === "c") { copySelected(); state.ctrl=false; renderKeyboard(); return true; }
            if(k === "v") { pasteClipboard(); state.ctrl=false; renderKeyboard(); return true; }
            if(k === "x") { copySelected(); const s=input.selectionStart??0,e=input.selectionEnd??0;if(s!==e)input.setRangeText("",s,e,"start");state.ctrl=false;renderKeyboard();return true; }
            if(k === "f") { state.ctrl=false; renderKeyboard(); openCommandSearch(); return true; }
            if(k === "l") { state.ctrl=false; renderKeyboard(); input.focus(); return true; }
            return false;
        }
        function addSystemNotice(text){ const n=document.createElement("div"); n.className="aeron-system-note"; n.textContent=text; chat.appendChild(n); scrollBottom(); }

        const AERON_SUGGESTIONS = [
            "hello","how","are","you","kaise","ho","aap","main","mujhe","kya","hai","hain",
            "course","courses","admission","certificate","result","fees","duration","contact",
            "namaste","thank","thanks","please","batao","chahiye","computer","CCC","DCA","ADCA","Tally"
        ];
        const AERON_NEXT_WORDS = {
            hello:["how","hi","namaste"], how:["are","is","do"], are:["you","the","there"], you:["doing","want","looking"],
            kaise:["ho","hain","hai"], ho:["aap","tum","main"], aap:["kaise","kya","ke"], main:["kya","kaise","aap"],
            mujhe:["course","fees","admission"], kya:["hai","hain","chahiye"], hai:["fees","duration","admission"],
            course:["ki","fees","duration"], courses:["ki","fees","batao"], admission:["kaise","fees","open"],
            certificate:["kaise","verify","download"], result:["kaise","check","dekhu"],
            thank:["you","you so much","thanks"], thanks:["you","AERON","a lot"],
            नमस्ते:["आप","कैसे","हैं"], आप:["कैसे","क्या","कौन"], मुझे:["क्या","कोर्स","फीस"],
            क्या:["है","हैं","चाहिए"], है:["फीस","अवधि","कैसे"], हैं:["आप","क्या","कहाँ"],
            कोर्स:["की","फीस","अवधि"], फीस:["कितनी","है","बताना"], एडमिशन:["कैसे","कब","खुला"],
            सर्टिफिकेट:["कैसे","verify","download"], रिजल्ट:["कैसे","check","देखें"]
        };
        function updateSuggestions(){
            if(!suggestions) return;
            suggestions.innerHTML="";
            const value=String(input.value||"");
            const token=(value.match(/([^\s]+)$/)?.[1]||"").toLowerCase();
            let list=AERON_NEXT_WORDS[token]||[];
            if(!list.length && token.length>=1){
                list=AERON_SUGGESTIONS.filter(w=>w.toLowerCase().startsWith(token)).slice(0,3);
            }
            if(!list.length && value.trim()) list=["?","batao","please"];
            list=[...new Set(list)].slice(0,3);
            list.forEach(word=>{
                const b=document.createElement("button");
                b.type="button"; b.className="aeron-suggestion"; b.textContent=word;
                b.setAttribute("translate","no"); b.classList.add("notranslate");
                b.addEventListener("click",()=>{
                    const current=String(input.value||"");
                    const m=current.match(/^(.*?)(\s*)([^\s]*)$/s);
                    const prefix=m?m[1]:current;
                    const sep=current && !/\s$/.test(current)?" ":"";
                    if(token && current.endsWith(m?.[3]||"")) input.value=prefix+(prefix?" ":"")+word+" ";
                    else insertText((sep||current?sep:"")+word+" ");
                    autoGrowInput(); updateSendVisibility(); updateSuggestions(); input.focus({preventScroll:true});
                    requestAnimationFrame(ensureCaretVisible);
                });
                suggestions.appendChild(b);
            });
        }

        function renderKeyboard(){
            keyboardRows.innerHTML="";
            // Chrome/Google Translate: never translate AERON keyboard
    keyboard.setAttribute("translate","no");
    keyboard.classList.add("notranslate");
            root.classList.toggle("aeron-advanced-keyboard",state.advanced);
            let rows;
            if(state.advanced) rows=KB_ADV1;
            else rows=state.keyboardMode === "numbers" ? KB_NUM : (state.keyboardMode === "symbols" ? KB_SYMBOLS : (state.keyboardLang === "hi" ? KB_HI : KB_EN));
            rows.forEach(row=>{
                const line=document.createElement("div"); line.className="aeron-keyboard-row";
                row.forEach((key,keyIndex)=>{
                    const b=document.createElement("button"); b.type="button"; b.className="aeron-key";
                    const isRightShift=state.advanced && row===KB_ADV1[4] && keyIndex===row.length-1;
                    const isShift=(key === "Shift" || key === "Caps") && !isRightShift;
                    let label=key;
                    if(!state.advanced && state.keyboardLang === "en" && state.keyboardMode === "letters" && (state.capsLock||state.shiftOnce)) label=key.toUpperCase();
                    if(state.advanced && state.ctrl && key !== "Ctrl") b.classList.add("aeron-modified");
                    if(state.advanced && state.alt && key !== "Alt") b.classList.add("aeron-alt-active");
                    b.textContent=isRightShift ? "➤" : label; b.dataset.key=key;
                    if(isRightShift){ b.classList.add("aeron-right-shift"); b.title="Send message"; }
                    b.addEventListener("click",()=>{
                        if(isRightShift){ const text=String(input.value||"").trim(); if(text) submitQuestion(text); return; }
                        if(state.advanced && key === "Ctrl"){state.ctrl=!state.ctrl;renderKeyboard();return;}
                        if(state.advanced && key === "Alt"){state.alt=!state.alt;renderKeyboard();return;}
                        if(isShift){
                            const now=Date.now();
                            if(state.advanced){
                                // Computer mode: both Shift keys are real modifiers.
                                if(key === "Shift"){ state.shiftOnce=!state.shiftOnce; renderKeyboard(); return; }
                                if(key === "Caps"){ state.capsLock=!state.capsLock; renderKeyboard(); return; }
                            }
                            if(now-state.lastShiftTap<380){state.lastShiftTap=0;state.capsLock=!state.capsLock;state.shiftOnce=false;}
                            else {state.lastShiftTap=now;state.shiftOnce=true;}
                            renderKeyboard();
                            return;
                        }
                        if(state.ctrl && ctrlAction(key)) return;
                        if(state.alt){ if(key === "Tab") addSystemNotice("Alt+Tab browser/app switching phone system का काम है; website इसे override नहीं करती."); state.alt=false; renderKeyboard(); return; }
                        if(state.advanced){
                            if(specialKey(key)) { renderKeyboard(); return; }
                            let out=key.length===1 ? key : "";
                            if(state.shiftOnce || state.capsLock){
                                const shifted={"1":"!","2":"@","3":"#","4":"$","5":"%","6":"^","7":"&","8":"*","9":"(","0":")","-":"_","=":"+","[":"{","]":"}","\\":"|",";":":","'":"\"",",":"<",".":">","/":"?","`":"~"};
                                out=shifted[out] || out.toUpperCase();
                            }
                            insertText(out);
                            if(state.shiftOnce && !state.capsLock){state.shiftOnce=false;renderKeyboard();}
                        } else {
                            if(state.keyboardLang === "en" && state.keyboardMode === "letters" && (state.capsLock||state.shiftOnce)) insertText(key.toUpperCase()); else insertText(key);
                            if(state.shiftOnce && !state.capsLock){state.shiftOnce=false;renderKeyboard();}
                        }
                    });
                    line.appendChild(b);
                  if(
    !state.advanced &&
    state.keyboardLang === "en" &&
    state.keyboardMode === "letters" &&
    key === "m"
){
    const backspaceBtn = document.createElement("button");
    backspaceBtn.type = "button";
    backspaceBtn.className = "aeron-key aeron-key-backspace";
    backspaceBtn.textContent = "⌫";
    backspaceBtn.title = "Backspace";

    let deleteTimer = null;
    let deleteInterval = null;
    let longPress = false;

    const stopDeleting = () => {
        if(deleteTimer){
            clearTimeout(deleteTimer);
            deleteTimer = null;
        }

        if(deleteInterval){
            clearInterval(deleteInterval);
            deleteInterval = null;
        }
    };

    const startDeleting = (e) => {
        e.preventDefault();
        longPress = false;

        // Pehla delete
        backspace();

        // Thodi der press rakhne par continuous delete
        deleteTimer = setTimeout(() => {
            longPress = true;

            deleteInterval = setInterval(() => {
                backspace();
            }, 70);

        }, 450);
    };

    const endDeleting = () => {
        stopDeleting();
    };

    backspaceBtn.addEventListener("mousedown", startDeleting);
    backspaceBtn.addEventListener("mouseup", endDeleting);
    backspaceBtn.addEventListener("mouseleave", endDeleting);

    backspaceBtn.addEventListener("touchstart", startDeleting, {passive:false});
    backspaceBtn.addEventListener("touchend", endDeleting);
    backspaceBtn.addEventListener("touchcancel", endDeleting);

    line.appendChild(backspaceBtn);
                  }
                });
                keyboardRows.appendChild(line);
            });
            if(!state.advanced){
                const bottom=document.createElement("div"); bottom.className="aeron-keyboard-row aeron-keyboard-bottom";
                const space=document.createElement("button");space.type="button";space.className="aeron-key aeron-key-space";space.textContent="Space";space.addEventListener("click",()=>insertText(" "));
                const enter=document.createElement("button");enter.type="button";enter.className="aeron-key aeron-key-wide";enter.textContent="↵ Enter";enter.title="Enter = new line";enter.addEventListener("click",()=>insertText("\n"));
                const right=document.createElement("button");right.type="button";right.className="aeron-key aeron-key-wide aeron-right-shift";right.textContent="⇧ Send";right.title="Shift / Send — tap to send";right.setAttribute("aria-label","Shift Send");right.addEventListener("click",()=>submitQuestion(input.value));
                bottom.append(space,enter,right); keyboardRows.appendChild(bottom);
            }
        }
        function placeLauncherForKeyboard(active){
            root.classList.toggle("aeron-keyboard-active",!!active);
            launcher.classList.toggle("aeron-keyboard-shifted",!!active);
            launcher.setAttribute("aria-label",active?"AERON keyboard open":"Open AERON Assistant");
            launcher.title=active?"AERON keyboard open — tap to close":"Open AERON Assistant";
            if(!active && launcherAutoMoved){
                launcher.style.left=""; launcher.style.top=""; launcher.style.right=""; launcher.style.bottom="";
                launcherAutoMoved=false;
            }
        }
        function setKeyboardButtonLabel(){
            if(!keyboardToggle) return;
            if(state.keyboardOpen){
                keyboardToggle.textContent="📱";
                keyboardToggle.title="Mobile keyboard";
                keyboardToggle.setAttribute("aria-label","Switch to mobile keyboard");
            } else {
                keyboardToggle.textContent="⌨";
                keyboardToggle.title=state.nativeKeyboardOpen?"AERON keyboard":"Open mobile keyboard";
                keyboardToggle.setAttribute("aria-label",state.nativeKeyboardOpen?"Switch to AERON keyboard":"Open mobile keyboard");
            }
        }
        function closeKeyboard(){
            state.keyboardOpen=false;
            keyboard.hidden=true;
            root.classList.remove("aeron-keyboard-active");
            input.readOnly=false;
            input.setAttribute("inputmode","text");
            placeLauncherForKeyboard(false);
            setKeyboardButtonLabel();
            updateKeyboardViewport();
        }
        function openKeyboard(){
            stopListening();
            state.nativeKeyboardOpen=false;
            root.classList.remove("aeron-system-keyboard-active");
            state.keyboardOpen=true;
            keyboard.hidden=false;
            input.readOnly=false;
            input.setAttribute("inputmode","none");
            renderKeyboard();
            updateSuggestions();
            placeLauncherForKeyboard(true);
            setKeyboardButtonLabel();
            input.focus({preventScroll:true});
            input.setSelectionRange(input.value.length,input.value.length);
            setTimeout(()=>{autoGrowInput();positionLauncherNearTyping();},20);
        }
        function openMobileKeyboard(){
            stopListening();
            closeKeyboard();
            state.nativeKeyboardOpen=true;
            root.classList.add("aeron-system-keyboard-active");
            input.readOnly=false;
            input.setAttribute("inputmode","text");
            try{ if(navigator.virtualKeyboard && "overlaysContent" in navigator.virtualKeyboard) navigator.virtualKeyboard.overlaysContent=false; }catch(_){}
            // Keep focus in the same trusted tap so Android Chrome is allowed to open the IME.
            input.focus({preventScroll:true});
            setTimeout(()=>{
                try{ if(navigator.virtualKeyboard?.show) navigator.virtualKeyboard.show(); }catch(_){}
                input.focus({preventScroll:true});
                autoGrowInput();updateKeyboardViewport();
            },40);
            setKeyboardButtonLabel();
        }
        function toggleKeyboardMode(){
            if(state.keyboardOpen){ openMobileKeyboard(); return; }
            if(state.nativeKeyboardOpen){ openKeyboard(); return; }
            openMobileKeyboard();
        }
        function cycleKeyboardMode(){ toggleKeyboardMode(); }

        function openCommandSearch(){
            const old=document.querySelector(".aeron-command-search"); if(old) old.remove();
            const box=document.createElement("div"); box.className="aeron-command-search";
            box.innerHTML=`<input type="search" placeholder="AERON search..." aria-label="AERON search"><button type="button">×</button>`;
            panel.insertBefore(box,chat); const s=box.querySelector("input"); s.focus();
            s.addEventListener("input",()=>{const q=s.value.toLowerCase();chat.querySelectorAll(".aeron-message").forEach(m=>{m.hidden=!!q&&!m.textContent.toLowerCase().includes(q);});});
            box.querySelector("button").addEventListener("click",()=>{box.remove();chat.querySelectorAll(".aeron-message").forEach(m=>m.hidden=false);input.focus();});
        }

        function setupSpeech(){
            const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
            if(!SR){ mic.title="Voice input is not supported by this browser"; return; }
            try { state.recognition?.abort?.(); } catch(_) {}
            state.recognition=new SR();
            state.recognition.continuous=false;
            state.recognition.interimResults=false;
            state.recognition.maxAlternatives=1;
            state.recognition.lang=state.keyboardLang === "hi" ? "hi-IN" : "en-IN";
            state.recognition.onstart=()=>{state.listening=true;mic.classList.add("listening");mic.textContent="⏹";};
            state.recognition.onresult=e=>{
                let text="";
                for(let i=e.resultIndex;i<e.results.length;i++){
                    if(e.results[i].isFinal) text+=e.results[i][0].transcript;
                }
                text=text.trim();
                if(text){ input.value=text.slice(0,Number(cfg.maxQuestionLength||1000)); autoGrowInput(); submitQuestion(text); }
            };
            state.recognition.onerror=e=>{
                state.listening=false; mic.classList.remove("listening"); mic.textContent="🎙️";
                const code=String(e&&e.error||"");
                if(code==="not-allowed" || code==="service-not-allowed") {
                    state.voiceSessionActive=false;
                    state.voiceConversation=false;
                }
                const msg=code==="not-allowed"||code==="service-not-allowed"
                    ? "🎙️ Microphone permission नहीं मिली। Chrome की site settings में Microphone → Allow करें।"
                    : code==="no-speech"
                    ? "🎙️ आवाज़ detect नहीं हुई। फिर से बोलकर कोशिश करें।"
                    : "🎙️ Voice input शुरू नहीं हो सका। Chrome में microphone permission और HTTPS/localhost check करें।";
                addSystemNotice(msg);
            };
            state.recognition.onend=()=>{
                state.listening=false;
                mic.classList.remove("listening");
                mic.textContent="🎙️";
                if(state.voiceConversation && !state.stopped && !state.speaking){
                    setTimeout(()=>{ if(!state.listening && !state.speaking && state.voiceConversation && !state.stopped) startListening(); },180);
                }
            };
        }
        function startListening(){
            if(!state.recognition) setupSpeech();
            if(!state.recognition){addSystemNotice("🎙️ इस browser में free voice input उपलब्ध नहीं है। Chrome में कोशिश करें.");return;}
            state.recognition.lang=state.keyboardLang === "hi" ? "hi-IN" : "en-IN";
            if(state.speaking){ window.speechSynthesis?.cancel?.(); state.speaking=false; }
            if(state.listening){ stopListening(); return; }
            state.voiceConversation=true;
            state.voiceSessionActive=true;
            try {
                state.recognition.start();
            } catch(err) {
                state.listening=false;
                state.voiceSessionActive=false;
                state.voiceConversation=false;
                addSystemNotice("🎙️ Voice शुरू नहीं हो सका। Chrome में microphone permission Allow करके फिर कोशिश करें।");
            }
        }
        function stopListening(){
            try{state.recognition?.abort?.();}catch(_){}
            state.listening=false;
            state.voiceSessionActive=false;
            state.voiceConversation=false;
            try{window.speechSynthesis?.cancel?.();}catch(_){}
            state.speaking=false;
            mic.classList.remove("listening");
            mic.textContent="🎙️";
        }

        keyboardToggle.addEventListener("pointerdown",e=>e.stopPropagation());
        keyboardToggle.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();cycleKeyboardMode();});
        input.addEventListener("pointerdown",()=>{
            if(state.keyboardOpen){
                closeKeyboard();
                state.nativeKeyboardOpen=true;
                root.classList.add("aeron-system-keyboard-active");
                input.readOnly=false;
                input.setAttribute("inputmode","text");
                setTimeout(()=>{ try{input.focus({preventScroll:true});}catch(_){} updateKeyboardViewport(); },0);
            }
        });
        input.addEventListener("focus",()=>{
            input.readOnly=false;
            if(!state.keyboardOpen) input.setAttribute("inputmode","text");
            autoGrowInput();
            updateSendVisibility();
        });
        input.addEventListener("input",()=>{ autoGrowInput(); updateSendVisibility(); updateSuggestions(); requestAnimationFrame(ensureCaretVisible); });
        input.addEventListener("click",()=>{ setTimeout(autoGrowInput,0); });
        // Voice is intentionally a single-tap control. Starting SpeechRecognition
        // directly from the user gesture is more reliable on Android Chrome than
        // starting it from a delayed timer, and it makes voice-to-voice practical.
        action.addEventListener("click",e=>{
            if(String(input.value||"").trim()){ e.preventDefault(); submitQuestion(input.value); }
            else startListening();
        });
        async function pasteFromClipboard(){
    try{
        if(!navigator.clipboard || !navigator.clipboard.readText){
            addSystemNotice("इस browser में clipboard paste उपलब्ध नहीं है.");
            return;
        }

        const text=await navigator.clipboard.readText();

        if(!text){
            addSystemNotice("Clipboard खाली है.");
            return;
        }

        insertText(text);

        if(state.keyboardOpen){
            input.focus({preventScroll:true});
        }

        addSystemNotice("Clipboard से text paste हो गया.");
    }catch(err){
        addSystemNotice("Clipboard से paste नहीं हो पाया.");
    }
        }
        keyboard.addEventListener("pointerdown",e=>{
            e.preventDefault();
        });
        keyboard.addEventListener("click",e=>{
            const a=e.target.closest("[data-kb-action]")?.dataset.kbAction; if(!a)return;
            if(a==="lang"){state.keyboardLang=state.keyboardLang==="en"?"hi":"en";state.keyboardMode="letters";state.shiftOnce=false;state.capsLock=false;setupSpeech();renderKeyboard();}
            if(a==="numbers"){state.keyboardMode=state.keyboardMode==="numbers"?"letters":"numbers";state.shiftOnce=false;renderKeyboard();}
            if(a==="mode"){state.advanced=!state.advanced;state.keyboardMode="letters";state.ctrl=false;state.alt=false;state.shiftOnce=false;renderKeyboard();}
            if(a==="backspace")backspace();
           if(a==="copy"){

    e.preventDefault();
    e.stopPropagation();

    if(clipboardPanel.hidden){

        openAeronClipboard();

    }else{

        closeAeronClipboard();

    }

    return;
           }      
           
            if(a==="clear")clearDraft();
        });

        async function submitQuestion(question){
            if(state.stopped)return;
            question=String(question||"").trim().slice(0,Number(cfg.maxQuestionLength||1000));
            if(!question)return;
            addMessage(esc(question),"user");input.value="";updateSendVisibility();autoGrowInput();updateSuggestions();clearTimeout(state.responseTimer);
            setTyping(true);
            state.responseTimer=setTimeout(async()=>{
                if(state.stopped){setTyping(false);return;}
                try{
                    const history=Array.from(chat.querySelectorAll(".aeron-message")).slice(-6).map(m=>({
                        role:m.classList.contains("aeron-user")?"user":"assistant",
                        text:(m.querySelector(".aeron-bubble")?.textContent||"").trim().slice(0,600)
                    }));
                    // Knowledge loads in parallel; API call should not wait on it.
                    void knowledgePromise;
                    const data=await apiFetch({action:state.mode==="admin"?"aeronAdminAsk":"aeronAsk",question,pageContext:{page:location.pathname.split("/").pop()||"index.html",title:document.title,mode:state.mode},studentToken:state.mode==="student"?sessionStorage.getItem("SURYA_STUDENT_TOKEN")||"":"",token:state.mode==="admin"?sessionStorage.getItem("SURYA_ADMIN_TOKEN")||"":"",memory:state.memoryEnabled?state.memory:{},history:history});
                    setTyping(false);
                    let replyHtml="";
                    const local=localAnswer(question);
                    const deterministic=localGeneralKnowledge(question);
                    const genericApi=String(data&&data.html||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
                    const apiLooksGeneric=!genericApi || /verified Surya CEC information.*Courses.*Admission.*Certificate.*Result.*Notice.*Contact/i.test(genericApi) || /verified answer अभी नहीं मिला/i.test(genericApi);
                    // Gemini/verified API responses take priority for open-ended questions.
                    // Deterministic local answers are only a fallback when the API cannot answer.
                    if(data&&data.llm&&data.html) replyHtml=data.html;
                    else if(data&&data.html&&!apiLooksGeneric) replyHtml=data.html;
                    else if(deterministic) replyHtml=deterministic;
                    else if(data&&data.success===false&&data.authenticated===false&&state.mode!=="admin") replyHtml=local;
                    else if(local && !/verified Surya CEC information/i.test(stripHtml(local))) replyHtml=local;
                    else if(data&&data.message) replyHtml=esc(data.message);
                    else replyHtml=local;
                    addMessage(replyHtml);
                    if(data&&data.memorySuggestion&&state.memoryEnabled)rememberLocal(data.memorySuggestion.key,data.memorySuggestion.value);
                    if(data&&data.escalation&&state.mode!=="admin")addEscalation();
                }catch(_){setTyping(false);const reply=localAnswer(question);addMessage(reply);}
            },0);
        }
        function addEscalation(){
            if(chat.querySelector(".aeron-escalation:last-child"))return;
            const box=document.createElement("div");box.className="aeron-escalation";
            box.innerHTML=`<button class="primary" type="button" data-help="notify">🆘 Admin को मदद request</button><a href="tel:+91${esc(cfg.contactPhone)}"><button type="button">📞 ${esc(cfg.contactPhone)}</button></a>`;
            box.querySelector("[data-help=notify]").addEventListener("click",async()=>{const message=prompt("Admin को कौन-सी समस्या बतानी है?");if(!message)return;try{await apiFetch({action:"aeronHelp",message:String(message).slice(0,1500),pageContext:{page:location.pathname.split("/").pop()||"index.html",title:document.title,mode:state.mode},anonymousId:anonId()});addMessage("✅ आपकी help request admin को भेज दी गई है।");}catch(_){addMessage("❌ Help request अभी नहीं भेजी जा सकी। कृपया official contact number पर संपर्क करें।");}});
            chat.appendChild(box);scrollBottom();
        }
        function localGeneralKnowledge(question){
            const q=String(question||"").trim().toLowerCase();
            const capitalMap=[
                [/(bhart|bharat|india|indian|भारत|इंडिया).*?(capital|rajdhani|rajhani|rajdha?ni|राजधानी|capital city)|(capital|rajdhani|rajhani|rajdha?ni|राजधानी|capital city).*?(bhart|bharat|india|indian|भारत|इंडिया)/,"🇮🇳 भारत","नई दिल्ली"],
                [/(america|amerika|usa|united states|अमेरिका|अमरीका).*?(capital|rajdhani|राजधानी|capital city)|(capital|rajdhani|राजधानी|capital city).*?(america|amerika|usa|united states|अमेरिका|अमरीका)/,"🇺🇸 अमेरिका","वॉशिंगटन, डी.सी."],
                [/(nepal|नेपाल).*?(capital|rajdhani|राजधानी)|(capital|rajdhani|राजधानी).*?(nepal|नेपाल)/,"🇳🇵 Nepal","Kathmandu"],
                [/(france|फ्रांस).*?(capital|rajdhani|राजधानी)|(capital|rajdhani|राजधानी).*?(france|फ्रांस)/,"🇫🇷 France","Paris"],
                [/(uk|united kingdom|britain|england|इंग्लैंड|ब्रिटेन).*?(capital|rajdhani|राजधानी)|(capital|rajdhani|राजधानी).*?(uk|united kingdom|britain|england|इंग्लैंड|ब्रिटेन)/,"🇬🇧 United Kingdom","London"],
                [/(japan|जापान).*?(capital|rajdhani|राजधानी)|(capital|rajdhani|राजधानी).*?(japan|जापान)/,"🇯🇵 Japan","Tokyo"],
                [/(china|चीन).*?(capital|rajdhani|राजधानी)|(capital|rajdhani|राजधानी).*?(china|चीन)/,"🇨🇳 China","Beijing"]
            ];
            for(const [re,country,capital] of capitalMap){if(re.test(q)) return `<strong>${country}</strong><p>राजधानी <b>${capital}</b> है।</p>`;}
            return null;
        }

        function localAnswer(question){
            const q=String(question||"").toLowerCase(),k=localKnowledge||{};
            if(/\b(hello|hi|hey|namaste)\b|नमस्ते|हेलो/.test(q))return `<strong>नमस्ते! 👋</strong><p>मैं AERON हूँ। बताइए, मैं आपकी किस तरह मदद करूँ?</p>`;
            const general=localGeneralKnowledge(q);
            if(general) return general;
            if(/(london|uk|united kingdom|britain|england|इंग्लैंड|ब्रिटेन)/.test(q) && /(capital|rajdhani|rajhani|राजधानी)/.test(q))return `<strong>🇬🇧 UK</strong><p>United Kingdom की राजधानी <b>London</b> है।</p>`;
            if(/(france|फ्रांस)/.test(q) && /(capital|rajdhani|राजधानी)/.test(q))return `<strong>🇫🇷 France</strong><p>France की राजधानी <b>Paris</b> है।</p>`;
            if(/(nepal|नेपाल)/.test(q) && /(capital|rajdhani|राजधानी)/.test(q))return `<strong>🇳🇵 Nepal</strong><p>Nepal की राजधानी <b>Kathmandu</b> है।</p>`;
            const math=q.replace(/×/g,"*").replace(/÷/g,"/").replace(/[^0-9+\-*/().% ]/g,"").trim();
            if(math && /[+\-*/%]/.test(math) && math.length<60){ try { const result=Function('"use strict";return ('+math+')')(); if(Number.isFinite(result)) return `<strong>🧮 Answer</strong><p>${esc(math)} = <b>${esc(result)}</b></p>`; } catch(_){} }
            if(/(who are you|tum kaun|aap kaun|what can you do|kya kar sakte)/.test(q))return `<strong>🤖 AERON</strong><p>मैं SURYA COMPUTER OF EDUCATION CENTER का website assistant हूँ। Courses, Admission, Certificate, Result, Notice, Contact और सामान्य सवालों में मदद कर सकता हूँ।</p>`;
            if(/course|courses|कोर्स|पाठ्यक्रम|adca|dca|ccc|tally|typing/.test(q)){const list=Array.isArray(k.courses)?k.courses.join(", "):"CCC, DCA, ADCA, Tally Prime, Typing और Basic Computer";return `<strong>📚 Courses</strong><p>अभी उपलब्ध जानकारी के अनुसार: ${esc(list)}.</p>`;}
            if(/admission|प्रवेश|एडमिशन|application/.test(q))return `<strong>📝 Admission</strong><p>Admission page से online application भर सकते हैं।</p>`;
            if(/certificate|प्रमाणपत्र|सर्टिफिकेट/.test(q))return `<strong>🎓 Certificate</strong><p>Certificate page पर Certificate ID डालकर public verification की जा सकती है।</p>`;
            if(/result|परिणाम|marks|अंक/.test(q))return `<strong>📊 Result</strong><p>Result page से उपलब्ध published result check किया जा सकता है।</p>`;
            if(/notice|सूचना/.test(q))return `<strong>📢 Notice</strong><p>Latest institute notices website के Notice section में देखें।</p>`;
            if(/contact|phone|mobile|number|संपर्क|सम्पर्क/.test(q))return `<strong>📞 Contact</strong><p>${esc(cfg.contactPhone)}<br>${esc(cfg.contactEmail)}<br>${esc(cfg.instituteLocation)}</p>`;
            if(/help|problem|issue|मदद|परेशान|support/.test(q))return `<strong>🆘 Help</strong><p>अपनी समस्या बताइए। जरूरत पड़ने पर official admin contact से संपर्क करें।</p>`;
            return `<strong>🤖 AERON</strong><p>मैं verified Surya CEC information, Courses, Admission, Certificate, Result, Notice और Contact में मदद कर सकता हूँ।</p>`;
        }

        let dragStartX=0,dragStartY=0,dragMoved=false,dragging=false,dragOffsetX=0,dragOffsetY=0,launcherAutoMoved=false;
        let launcherTapTimer=null;
        function saveLauncherPosition(){
            if(launcherAutoMoved) return;
            try{
                localStorage.setItem(cfg.launcherPositionKey,JSON.stringify({
                    left:parseFloat(launcher.style.left)||launcher.getBoundingClientRect().left,
                    top:parseFloat(launcher.style.top)||launcher.getBoundingClientRect().top
                }));
            }catch(_){}
        }
        function restoreLauncherPosition(){
            try{
                const raw=localStorage.getItem(cfg.launcherPositionKey);
                if(!raw) return;
                const pos=JSON.parse(raw);
                if(Number.isFinite(pos.left)&&Number.isFinite(pos.top)){
                    const maxX=window.innerWidth-launcher.offsetWidth-4, maxY=window.innerHeight-launcher.offsetHeight-4;
                    launcher.style.left=Math.max(4,Math.min(maxX,pos.left))+"px";
                    launcher.style.top=Math.max(4,Math.min(maxY,pos.top))+"px";
                    launcher.style.right="auto"; launcher.style.bottom="auto";
                }
            }catch(_){}
        }
        launcher.addEventListener("pointerdown",e=>{
            dragging=true; dragMoved=false;
            const r=launcher.getBoundingClientRect();
            dragOffsetX=e.clientX-r.left; dragOffsetY=e.clientY-r.top;
            dragStartX=e.clientX; dragStartY=e.clientY;
            launcher.setPointerCapture?.(e.pointerId);
        });
        launcher.addEventListener("pointermove",e=>{
            if(!dragging) return;
            const dx=e.clientX-dragStartX,dy=e.clientY-dragStartY;
            if(Math.abs(dx)+Math.abs(dy)<4) return;
            dragMoved=true;
            const maxX=window.innerWidth-launcher.offsetWidth-4, maxY=window.innerHeight-launcher.offsetHeight-4;
            const x=Math.max(4,Math.min(maxX,e.clientX-dragOffsetX));
            const y=Math.max(4,Math.min(maxY,e.clientY-dragOffsetY));
            launcher.style.left=x+"px"; launcher.style.top=y+"px";
            launcher.style.right="auto"; launcher.style.bottom="auto";
            launcherAutoMoved=false;
        });
        launcher.addEventListener("pointerup",()=>{dragging=false;if(dragMoved)saveLauncherPosition();});
        launcher.addEventListener("pointercancel",()=>{dragging=false;});
        launcher.addEventListener("click",()=>{
            if(dragMoved){dragMoved=false;return;}
            const previousRect=launcher.getBoundingClientRect();
            launcherTapRect=previousRect;
            const now=Date.now();
            if(now-state.lastLauncherTap < 300){
                state.lastLauncherTap=0;
                state.launcherCompact=!state.launcherCompact;
                root.classList.toggle("aeron-launcher-compact",state.launcherCompact);
                if(state.keyboardOpen) positionLauncherNearTyping();
                return;
            }
            state.lastLauncherTap=now;
            if(!panel.classList.contains("open")){

    open();

    input.readOnly = false;

    /*
     * Mobile पर native keyboard नहीं खोलना।
     * AERON का custom keyboard सीधे खुलेगा।
     */
    if(!isDesktopAeron()){

        input.setAttribute(
            "inputmode",
            "none"
        );

        setTimeout(()=>{

            if(!state.keyboardOpen){
                keyboardToggle?.click();
            }

            input.focus({
                preventScroll:true
            });

        },60);

    }else{

        /*
         * PC पर physical keyboard normal रहेगा।
         */
        input.setAttribute(
            "inputmode",
            "text"
        );

        setTimeout(()=>{
            input.focus({
                preventScroll:true
            });
        },20);
    }

    return;
}
            input.focus({preventScroll:true});
        });
        // Double-tap remains usable even when the first tap immediately auto-docks the orb.
        let launcherTapRect=null;
        document.addEventListener("pointerup",e=>{
            const now=Date.now();
            if(now-state.lastLauncherTap>320 || !launcherTapRect || dragging) return;
            const r=launcherTapRect;
            if(e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom){
                e.preventDefault();
                state.lastLauncherTap=0;
                state.launcherCompact=!state.launcherCompact;
                root.classList.toggle("aeron-launcher-compact",state.launcherCompact);
                positionLauncherNearTyping();
            }
        },true);
        function setMinimized(on){
            state.minimized=!!on;
            if(state.minimized) state.maximized=false;
            root.classList.toggle("aeron-minimized",state.minimized);
            root.classList.toggle("aeron-maximized",state.maximized);
            if(minimize) minimize.textContent=state.minimized?"□":"—";
            if(minimize) minimize.title=state.minimized?"Restore":"Minimize";
            if(maximize) maximize.textContent=state.maximized?"❐":"□";
            if(maximize) maximize.title=state.maximized?"Restore size":"Maximize";
            requestAnimationFrame(updateKeyboardViewport);
        }
        function setMaximized(on){
            state.maximized=!!on;
            if(state.maximized) state.minimized=false;
            root.classList.toggle("aeron-maximized",state.maximized);
            root.classList.toggle("aeron-minimized",state.minimized);
            if(maximize) maximize.textContent=state.maximized?"❐":"□";
            if(maximize) maximize.title=state.maximized?"Restore size":"Maximize";
            if(minimize) minimize.textContent=state.minimized?"□":"—";
            if(minimize) minimize.title=state.minimized?"Restore":"Minimize";
            requestAnimationFrame(updateKeyboardViewport);
        }
        minimize?.addEventListener("click",()=>setMinimized(!state.minimized));
        maximize?.addEventListener("click",()=>setMaximized(!state.maximized));
        root.querySelector("#aeronClose").addEventListener("click",close);
        root.querySelector("#aeronHide").addEventListener("click",close);
        stop.addEventListener("click",()=>state.stopped?startAeron():stopAeron());
        root.querySelector("#aeronForm").addEventListener("submit",e=>{e.preventDefault();submitQuestion(input.value);});

        /* Physical keyboard: normal browser/OS rules are intentionally NOT overridden.
           Enter = newline in the textarea. Ctrl+A/C/V/F remain browser-standard. */
        input.addEventListener("keydown",e=>{
            if(e.key === "Enter" && !e.shiftKey){
                e.stopPropagation();
                return;
            }
        });
        let rightShiftSending=false;
        document.addEventListener("keydown",e=>{
            if(e.key==="Shift" && e.location===2 && !(navigator.maxTouchPoints>0 && /Android|Mobile/i.test(navigator.userAgent))){
                if(panel.classList.contains("open") && !state.stopped){
                    const text=String(input.value||"").trim();
                    if(text && !e.repeat && !rightShiftSending){
                        e.preventDefault();
                        rightShiftSending=true; submitQuestion(text);
                        setTimeout(()=>{rightShiftSending=false;},180);
                    }
                }
            }
            if(e.key==="Escape"&&state.keyboardOpen)closeKeyboard();
        });

        function positionLauncherNearTyping(){
            if(!panel.classList.contains("open")) return;
            if(!state.keyboardOpen) return;
            const vv=window.visualViewport;
            const visibleTop=vv ? vv.offsetTop : 0;
            const visibleBottom=vv ? vv.offsetTop+vv.height : window.innerHeight;
            const pr=panel.getBoundingClientRect();
            const size=state.launcherCompact ? 24 : (state.keyboardOpen ? 30 : 32);
            const composer=input.parentElement.getBoundingClientRect();
            const typingVisible=!typing.hidden;
            const tRect=typingVisible ? typing.getBoundingClientRect() : null;
            // Dock the orb on the right side of the dedicated status/typing row,
            // never on top of the Send button or keyboard keys.
            let y=tRect ? Math.round(tRect.top+(tRect.height-size)/2) : Math.round(composer.top-size-5);
            let x=Math.round(pr.right-size-10);
            if(state.keyboardOpen){
                const kr=keyboard.getBoundingClientRect();
                y=Math.min(y,Math.round(kr.top-size-7));
            }
            x=Math.max(5,Math.min(window.innerWidth-size-5,x));
            y=Math.max(visibleTop+5,Math.min(visibleBottom-size-5,y));
            launcher.style.left=x+"px";
            launcher.style.top=y+"px";
            launcher.style.right="auto";
            launcher.style.bottom="auto";
            launcherAutoMoved=true;
        }
        function updateKeyboardViewport(){
            const vv=window.visualViewport;
            const vvHeight=vv ? vv.height : window.innerHeight;
            const vvTop=vv ? vv.offsetTop : 0;
            const vvBottom=vv ? vv.offsetTop+vv.height : window.innerHeight;
            let imeHeight=0;
            try{
                const r=navigator.virtualKeyboard?.boundingRect;
                if(r && r.height) imeHeight=Math.max(0,r.height);
            }catch(_){}
            // Some Android/Chrome builds overlay the IME without shrinking visualViewport.
            // In that case the VirtualKeyboard bounding rectangle is the reliable signal.
            const visibleHeight=Math.max(260,Math.round(Math.min(vvHeight, window.innerHeight-imeHeight)));
            const keyboardBottom=Math.max(0,Math.round(window.innerHeight-visibleHeight));
            root.style.setProperty("--aeron-vv-height",visibleHeight+"px");
            root.style.setProperty("--aeron-vv-top",Math.round(vvTop)+"px");
            root.style.setProperty("--aeron-keyboard-offset",keyboardBottom+"px");
            if(state.keyboardOpen){
                const panelTop=Math.max(0,Math.round(vvTop));
                const panelH=visibleHeight;
                root.style.setProperty("--aeron-panel-top",panelTop+"px");
                root.style.setProperty("--aeron-panel-height",panelH+"px");
                panel.style.position="fixed";
                panel.style.top=panelTop+"px";
                panel.style.bottom="auto";
                panel.style.left="3px"; panel.style.right="3px";
                panel.style.height=panelH+"px";
                panel.style.maxHeight=panelH+"px";
                panel.style.transform="none"; panel.style.margin="0";
            }else if(!state.keyboardOpen){
                panel.style.position=""; panel.style.top=""; panel.style.bottom="";
                panel.style.height=""; panel.style.maxHeight=""; panel.style.transform=""; panel.style.margin="";
            }
            if(state.keyboardOpen || false){
                requestAnimationFrame(()=>requestAnimationFrame(positionLauncherNearTyping));
            }
        }
        window.visualViewport?.addEventListener("resize",updateKeyboardViewport);
        window.visualViewport?.addEventListener("scroll",updateKeyboardViewport);
        window.addEventListener("orientationchange",()=>setTimeout(updateKeyboardViewport,120));
        window.addEventListener("resize",()=>{
            if(isDesktopAeron() && state.keyboardOpen) closeKeyboard();
            updateKeyboardViewport();
        });
        navigator.virtualKeyboard?.addEventListener?.("geometrychange",updateKeyboardViewport);
        updateKeyboardViewport();
        restoreLauncherPosition();
        autoGrowInput();
        root.querySelector("#aeronMemoryStatus").textContent=state.memoryEnabled?"Memory: ON":"Memory: local";
        setupSpeech(); updateSendVisibility(); intro();

        window.AERON_WIDGET_STATE=state;
    }

    window.AERON={
        open:()=>document.querySelector(".aeron-launcher")?.click(),
        close:()=>document.querySelector(".aeron-close")?.click(),
        enableMemory:()=>{state.memoryEnabled=true;const e=document.getElementById("aeronMemoryStatus");if(e)e.textContent="Memory: ON";},
        disableMemory:()=>{state.memoryEnabled=false;const e=document.getElementById("aeronMemoryStatus");if(e)e.textContent="Memory: local";},
        clearMemory:()=>{state.memory={};saveLocalMemory();},
        setAdvanced:(on=true)=>{state.advanced=!!on; if(!state.keyboardOpen) document.querySelector("#aeronKeyboardToggle")?.click(); else renderKeyboard();},
        toggleKeyboard:()=>document.querySelector("#aeronKeyboardToggle")?.click(),
        openMobileKeyboard:()=>{const b=document.querySelector("#aeronKeyboardToggle"); if(b){ if(!document.querySelector(".aeron-widget")?.contains(b)) return; b.click(); }},
        openAeronKeyboard:()=>document.querySelector("#aeronKeyboardToggle")?.click()
    };

    document.addEventListener("DOMContentLoaded",buildWidget);
})();
