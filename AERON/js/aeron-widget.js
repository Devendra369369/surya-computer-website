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
        systemKeyboardOpen: false,
        launcherCompact: false,
        keyboardMode: "letters",
        keyboardLang: "en",
        capsLock: false,
        shiftOnce: false,
        advanced: false,
        ctrl: false,
        alt: false,
        listening: false,
        recognition: null,
        lastShiftTap: 0,
        lastRightShiftTap: 0,
        lastLauncherTap: 0
    };

    function detectMode() {
        const page = (location.pathname.split("/").pop() || "");
        const isAdminPage = /^admin(?:-|\.html|$)/i.test(page);
        const adminAuth = sessionStorage.getItem("SURYA_ADMIN_TOKEN") && sessionStorage.getItem("SURYA_ADMIN_AUTH") === "true";
        if (isAdminPage && adminAuth) return "admin";
        const studentAuth = sessionStorage.getItem("SURYA_STUDENT_TOKEN") && sessionStorage.getItem("SURYA_STUDENT_AUTH") === "true";
        if (studentAuth) return "student";
        return "public";
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
        return fetch(cfg.apiUrl, {
            method:"POST",
            headers:{"Content-Type":"text/plain;charset=utf-8"},
            body:JSON.stringify(payload)
        }).then(async r => {
            let d = null;
            try { d = await r.json(); } catch (_) {}
            if (!r.ok) throw new Error((d && d.message) || "AERON API request failed.");
            return d || {};
        });
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
                    <button class="aeron-stop" id="aeronStop" type="button" title="Stop / Start AERON">■</button>
                    <button class="aeron-close" id="aeronClose" type="button" title="Close">×</button>
                </header>

                <div class="aeron-chat" id="aeronChat"></div>
                <div class="aeron-typing" id="aeronTyping" hidden><span></span><span></span><span></span><b>AERON सोच रहा है...</b></div>

                <form class="aeron-input-area" id="aeronForm">
                    <button type="button" class="aeron-keyboard-toggle" id="aeronKeyboardToggle" aria-label="Keyboard mode" title="Keyboard mode">A⌨</button>
                    <textarea id="aeronInput" rows="1" maxlength="${Number(cfg.maxQuestionLength || 1000)}" placeholder="AERON से कुछ पूछें..." autocomplete="off" spellcheck="true" inputmode="none" wrap="soft" aria-label="Message to AERON"></textarea>
                    <button type="button" class="aeron-mic" id="aeronMic" aria-label="Voice input" title="Voice input">🎙️</button>
                    <button type="submit" id="aeronSend" aria-label="Send message">➤</button>
                </form>

                <div class="aeron-keyboard" id="aeronKeyboard" hidden aria-label="AERON custom keyboard">
                    <div class="aeron-keyboard-toolbar">
                        <button type="button" data-kb-action="lang" title="English / Hindi">अं</button>
                        <button type="button" data-kb-action="numbers" title="Numbers and symbols">123</button>
                        <button type="button" data-kb-action="symbols" title="Symbols">@#$</button>
                        <button type="button" data-kb-action="paste" title="Paste from clipboard">📋</button>
                        <button type="button" data-kb-action="advanced" title="Normal / Computer keyboard">CPU</button>
                        <button type="button" data-kb-action="backspace" title="Backspace">⌫</button>
                        <button type="button" data-kb-action="clear" title="Clear">C</button>
                    </div>
                    <div class="aeron-keyboard-mode" id="aeronKeyboardMode">NORMAL</div>
                    <div class="aeron-keyboard-rows" id="aeronKeyboardRows"></div>
                </div>

                <div class="aeron-footer"><span>AERON • Surya CEC</span><span class="aeron-memory-status" id="aeronMemoryStatus"></span><button type="button" id="aeronHide">Hide</button></div>
            </section>
        `;
        document.body.appendChild(root);

        const panel = root.querySelector("#aeronPanel");
        const chat = root.querySelector("#aeronChat");
        const input = root.querySelector("#aeronInput");
        const send = root.querySelector("#aeronSend");
        const mic = root.querySelector("#aeronMic");
        const typing = root.querySelector("#aeronTyping");
        const stop = root.querySelector("#aeronStop");
        const keyboard = root.querySelector("#aeronKeyboard");
        const keyboardRows = root.querySelector("#aeronKeyboardRows");
        const keyboardToggle = root.querySelector("#aeronKeyboardToggle");
        const launcher = root.querySelector("#aeronLauncher");
        const keyboardModeLabel = root.querySelector("#aeronKeyboardMode");

        root.querySelector(".aeron-mode").textContent = state.mode === "admin" ? "Admin Assistant" : state.mode === "student" ? "Student Assistant" : "Public Assistant";
        function scrollBottom(){ chat.scrollTop = chat.scrollHeight; requestAnimationFrame(()=>{ chat.scrollTop = chat.scrollHeight; }); }
        function addMessage(html,type="bot") {
            const row=document.createElement("div");
            row.className=`aeron-message ${type === "user" ? "aeron-user" : "aeron-bot"}`;
            row.innerHTML=`<div class="aeron-message-avatar"><img src="AERON/assets/icon/aeron.svg" alt="" aria-hidden="true"></div><div class="aeron-bubble">${html}</div>`;
            chat.appendChild(row); scrollBottom();
        }
        function setTyping(on){ typing.hidden=!on; if(on) scrollBottom(); requestAnimationFrame(positionLauncherNearTyping); }
        function autoGrowInput(){
            input.style.width="100%";
            input.style.height="auto";
            const isMobile=window.matchMedia && window.matchMedia("(max-width:600px)").matches;
            const max=isMobile ? Math.min(180, Math.max(120, Math.round(window.innerHeight*0.28))) : 220;
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
        function close(){ stopListening(); closeSystemKeyboard(); closeKeyboard(); panel.classList.remove("open"); panel.setAttribute("aria-hidden","true"); }
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
            if(state.systemKeyboardOpen){ input.focus({preventScroll:true}); }
        }
        function keepInputCaretVisible(){
            if(!input) return;
            try{ input.focus({preventScroll:true}); }catch(_){ try{ input.focus(); }catch(__){} }
            requestAnimationFrame(()=>{ ensureCaretVisible(); autoGrowInput(); });
        }
        function ensureCaretVisible(){
            if(!input) return;
            const cs=getComputedStyle(input);
            const lh=parseFloat(cs.lineHeight)||Math.max(20,parseFloat(cs.fontSize)||15)*1.45;
            const before=input.value.slice(0,input.selectionStart??input.value.length);
            const line=(before.match(/\n/g)||[]).length;
            const padTop=parseFloat(cs.paddingTop)||0;
            const caretTop=line*lh+padTop;
            const caretBottom=caretTop+lh;
            const viewTop=input.scrollTop;
            const viewBottom=viewTop+input.clientHeight;
            if(caretTop < viewTop+4) input.scrollTop=Math.max(0,caretTop-4);
            else if(caretBottom > viewBottom-4) input.scrollTop=Math.max(0,caretBottom-input.clientHeight+4);
        }
        function backspace(){
            const s=input.selectionStart??input.value.length,e=input.selectionEnd??input.value.length;
            if(s!==e) input.setRangeText("",s,e,"start");
            else if(s>0) input.setRangeText("",s-1,s,"start");
            input.dispatchEvent(new Event("input",{bubbles:true}));
            autoGrowInput();
            requestAnimationFrame(ensureCaretVisible);
            if(state.systemKeyboardOpen){ input.focus({preventScroll:true}); }
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

        function renderKeyboard(){
            keyboardRows.innerHTML="";
            root.classList.toggle("aeron-advanced-keyboard",state.advanced);
            keyboardModeLabel.textContent=state.advanced?"COMPUTER MODE":"";
            let rows;
            if(state.advanced) rows=KB_ADV1;
            else rows=state.keyboardMode === "numbers" ? KB_NUM : (state.keyboardMode === "symbols" ? KB_SYMBOLS : (state.keyboardLang === "hi" ? KB_HI : KB_EN));
            rows.forEach(row=>{
                const line=document.createElement("div"); line.className="aeron-keyboard-row";
                row.forEach(key=>{
                    const b=document.createElement("button"); b.type="button"; b.className="aeron-key";
                    const isShift=key === "Shift" || key === "Caps";
                    let label=key;
                    if(!state.advanced && state.keyboardLang === "en" && state.keyboardMode === "letters" && (state.capsLock||state.shiftOnce)) label=key.toUpperCase();
                    if(state.advanced && state.ctrl && key !== "Ctrl") b.classList.add("aeron-modified");
                    if(state.advanced && state.alt && key !== "Alt") b.classList.add("aeron-alt-active");
                    b.textContent=label; b.dataset.key=key;
                    b.addEventListener("click",()=>{
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
                });
                keyboardRows.appendChild(line);
            });
            if(!state.advanced){
                const bottom=document.createElement("div"); bottom.className="aeron-keyboard-row aeron-keyboard-bottom";
                const left=document.createElement("button");left.type="button";left.className="aeron-key aeron-key-wide";left.textContent=state.capsLock?"⇧ CAPS":state.shiftOnce?"⇧ ON":"⇧";left.title="Single tap: one capital. Double tap: Caps Lock";
                left.addEventListener("click",()=>{const now=Date.now();if(now-state.lastShiftTap<360){state.lastShiftTap=0;state.capsLock=!state.capsLock;state.shiftOnce=false;}else{state.lastShiftTap=now;state.shiftOnce=true;}renderKeyboard();});
                const space=document.createElement("button");space.type="button";space.className="aeron-key aeron-key-space";space.textContent="Space";space.addEventListener("click",()=>insertText(" "));
                const enter=document.createElement("button");enter.type="button";enter.className="aeron-key aeron-key-wide";enter.textContent="↵ Enter";enter.title="Enter = new line";enter.addEventListener("click",()=>insertText("\n"));
                const rightWrap=document.createElement("div");rightWrap.className="aeron-right-shift-wrap";
                const cancel=document.createElement("button");cancel.type="button";cancel.className="aeron-key aeron-key-cancel";cancel.textContent="×";cancel.title="Delete one character";
                let cancelHandled=false, cancelTimer=null, cancelRepeater=null;
                const stopCancelRepeat=()=>{
                    clearTimeout(cancelTimer); clearInterval(cancelRepeater);
                    cancelTimer=null; cancelRepeater=null; cancelHandled=false;
                };
                cancel.addEventListener("pointerdown",e=>{
                    e.preventDefault(); e.stopPropagation(); cancelHandled=true; backspace();
                    // Hold = normal keyboard-style repeat delete. First repeat is slightly delayed,
                    // then characters are removed continuously until the finger is released.
                    cancelTimer=setTimeout(()=>{
                        cancelRepeater=setInterval(()=>backspace(),70);
                    },380);
                });
                cancel.addEventListener("pointerup",e=>{e.preventDefault();e.stopPropagation();stopCancelRepeat();});
                cancel.addEventListener("pointercancel",stopCancelRepeat);
                cancel.addEventListener("pointerleave",stopCancelRepeat);
                cancel.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();});
                const right=document.createElement("button");right.type="button";right.className="aeron-key aeron-key-wide aeron-right-shift";right.textContent="⇧";right.title="Send message";right.addEventListener("click",()=>submitQuestion(input.value));
                rightWrap.append(cancel,right); bottom.append(left,space,enter,rightWrap); keyboardRows.appendChild(bottom);
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
            if(state.keyboardOpen) { keyboardToggle.textContent="A⌨"; keyboardToggle.title="Switch to mobile keyboard"; }
            else if(state.systemKeyboardOpen) { keyboardToggle.textContent="📱"; keyboardToggle.title="Switch to AERON keyboard"; }
            else { keyboardToggle.textContent="A⌨"; keyboardToggle.title="Open AERON keyboard"; }
        }
        function closeSystemKeyboard(){
            state.systemKeyboardOpen=false;
            root.classList.remove("aeron-system-keyboard-active");
            input.readOnly=false;
            input.setAttribute("inputmode","none");
            hideVirtualKeyboard();
            setKeyboardButtonLabel();
            updateKeyboardViewport();
        }
        function openSystemKeyboard(){
            stopListening();
            try{ if(navigator.virtualKeyboard) navigator.virtualKeyboard.overlaysContent=false; }catch(_){}
            if(state.keyboardOpen) closeKeyboard();
            state.systemKeyboardOpen=true;
            root.classList.add("aeron-system-keyboard-active");
            input.readOnly=false;
            input.setAttribute("inputmode","text");
            input.focus({preventScroll:true});
            input.setSelectionRange(input.value.length,input.value.length);
            setKeyboardButtonLabel();
            updateKeyboardViewport();
            [40,120,240,420].forEach(ms=>setTimeout(()=>{
                updateKeyboardViewport();
                autoGrowInput();
                input.focus({preventScroll:true});
                input.setSelectionRange(input.value.length,input.value.length);
                positionLauncherNearTyping();
            },ms));
        }
        function openKeyboard(){
            stopListening();
            if(state.systemKeyboardOpen) closeSystemKeyboard();
            state.keyboardOpen=true;
            keyboard.hidden=false;
            input.readOnly=false;
            input.setAttribute("inputmode","none");
            renderKeyboard();
            hideVirtualKeyboard();
            placeLauncherForKeyboard(true);
            setKeyboardButtonLabel();
            input.focus({preventScroll:true});
            input.setSelectionRange(input.value.length,input.value.length);
            setTimeout(()=>{
                hideVirtualKeyboard();
                updateKeyboardViewport();
                autoGrowInput();
                positionLauncherNearTyping();
            },30);
        }
        function closeKeyboard(){
            state.keyboardOpen=false;
            keyboard.hidden=true;
            placeLauncherForKeyboard(false);
            if(!state.systemKeyboardOpen) hideVirtualKeyboard();
            setKeyboardButtonLabel();
            updateKeyboardViewport();
        }
        function toggleKeyboardMode(){
            if(state.keyboardOpen){
                closeKeyboard();
                openSystemKeyboard();
                return;
            }
            if(state.systemKeyboardOpen){
                closeSystemKeyboard();
                openKeyboard();
                return;
            }
            openKeyboard();
        }

        function cycleKeyboardMode(){
            toggleKeyboardMode();
        }

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
            };
        }
        function startListening(){
            if(state.systemKeyboardOpen) closeSystemKeyboard();
            if(!state.recognition) setupSpeech();
            if(!state.recognition){addSystemNotice("🎙️ इस browser में free voice input उपलब्ध नहीं है। Chrome में कोशिश करें.");return;}
            state.recognition.lang=state.keyboardLang === "hi" ? "hi-IN" : "en-IN";
            if(state.listening){stopListening();return;}
            try { state.recognition.start(); } catch(_) {}
        }
        function stopListening(){try{state.recognition?.abort?.();}catch(_){}state.listening=false;mic.classList.remove("listening");mic.textContent="🎙️";}

        keyboardToggle.addEventListener("pointerdown",e=>e.stopPropagation());
        keyboardToggle.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();cycleKeyboardMode();});
        input.addEventListener("focus",()=>{
            // Keep the textarea editable so Chrome can render its native blinking caret.
            // inputmode=none prevents the Android IME until the explicit mobile-keyboard button is used.
            if(!state.systemKeyboardOpen){
                input.readOnly=false;
                input.setAttribute("inputmode","none");
            }
            autoGrowInput();
        });
        input.addEventListener("input",()=>{ autoGrowInput(); requestAnimationFrame(ensureCaretVisible); });
        input.addEventListener("click",()=>{ if(state.systemKeyboardOpen) setTimeout(autoGrowInput,0); });
        mic.addEventListener("click",startListening);
        keyboard.addEventListener("pointerdown",e=>{
            e.preventDefault();
        });
        keyboard.addEventListener("click",e=>{
            const a=e.target.closest("[data-kb-action]")?.dataset.kbAction; if(!a)return;
            if(a==="lang"){state.keyboardLang=state.keyboardLang==="en"?"hi":"en";state.keyboardMode="letters";state.shiftOnce=false;state.capsLock=false;setupSpeech();renderKeyboard();}
            if(a==="numbers"){state.keyboardMode=state.keyboardMode==="numbers"?"letters":"numbers";state.shiftOnce=false;renderKeyboard();}
            if(a==="symbols"){state.keyboardMode=state.keyboardMode==="symbols"?"letters":"symbols";state.shiftOnce=false;renderKeyboard();}
            if(a==="advanced"){state.advanced=!state.advanced;state.keyboardMode="letters";state.ctrl=false;state.alt=false;state.shiftOnce=false;renderKeyboard();}
            if(a==="backspace")backspace();
            if(a==="paste")pasteClipboard();
            if(a==="clear")clearDraft();
        });

        async function submitQuestion(question){
            if(state.stopped)return;
            question=String(question||"").trim().slice(0,Number(cfg.maxQuestionLength||1000));
            if(!question)return;
            addMessage(esc(question),"user");input.value="";autoGrowInput();keepInputCaretVisible();setTyping(true);clearTimeout(state.responseTimer);
            state.responseTimer=setTimeout(async()=>{
                if(state.stopped){setTyping(false);return;}
                try{
                    await knowledgePromise;
                    const data=await apiFetch({action:state.mode==="admin"?"aeronAdminAsk":"aeronAsk",question,pageContext:{page:location.pathname.split("/").pop()||"index.html",title:document.title,mode:state.mode},studentToken:state.mode==="student"?sessionStorage.getItem("SURYA_STUDENT_TOKEN")||"":"",token:state.mode==="admin"?sessionStorage.getItem("SURYA_ADMIN_TOKEN")||"":"",memory:state.memoryEnabled?state.memory:{}});
                    setTyping(false);
                    if(data&&data.success===false&&data.authenticated===false&&state.mode!=="admin"){addMessage(localAnswer(question));}
                    else if(data&&data.html)addMessage(data.html);
                    else if(data&&data.message)addMessage(esc(data.message));
                    else addMessage(localAnswer(question));
                    if(data&&data.memorySuggestion&&state.memoryEnabled)rememberLocal(data.memorySuggestion.key,data.memorySuggestion.value);
                    if(data&&data.escalation&&state.mode!=="admin")addEscalation();
                }catch(_){setTyping(false);addMessage(localAnswer(question));}
            },200);
        }
        function addEscalation(){
            if(chat.querySelector(".aeron-escalation:last-child"))return;
            const box=document.createElement("div");box.className="aeron-escalation";
            box.innerHTML=`<button class="primary" type="button" data-help="notify">🆘 Admin को मदद request</button><a href="tel:+91${esc(cfg.contactPhone)}"><button type="button">📞 ${esc(cfg.contactPhone)}</button></a>`;
            box.querySelector("[data-help=notify]").addEventListener("click",async()=>{const message=prompt("Admin को कौन-सी समस्या बतानी है?");if(!message)return;try{await apiFetch({action:"aeronHelp",message:String(message).slice(0,1500),pageContext:{page:location.pathname.split("/").pop()||"index.html",title:document.title,mode:state.mode},anonymousId:anonId()});addMessage("✅ आपकी help request admin को भेज दी गई है।");}catch(_){addMessage("❌ Help request अभी नहीं भेजी जा सकी। कृपया official contact number पर संपर्क करें।");}});
            chat.appendChild(box);scrollBottom();
        }
        function localAnswer(question){
            const q=String(question||"").toLowerCase(),k=localKnowledge||{};
            if(/\b(hello|hi|hey|namaste)\b|नमस्ते|हेलो/.test(q))return `<strong>नमस्ते! 👋</strong><p>मैं AERON हूँ। बताइए, मैं आपकी किस तरह मदद करूँ?</p>`;
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
                if(state.keyboardOpen || state.systemKeyboardOpen) positionLauncherNearTyping();
                return;
            }
            state.lastLauncherTap=now;
            if(!panel.classList.contains("open")){open();openKeyboard();return;}
            if(state.keyboardOpen){
                // The launcher must never close the custom keyboard when it is
                // sitting beside the typing row. A tap simply keeps focus here.
                input.focus({preventScroll:true});
                return;
            }
            if(state.systemKeyboardOpen){openKeyboard();return;}
            openKeyboard();
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
        document.addEventListener("keydown",e=>{if(e.key==="Escape"&&state.keyboardOpen)closeKeyboard();});

        function positionLauncherNearTyping(){
            if(!panel.classList.contains("open")) return;
            if(!(state.keyboardOpen || state.systemKeyboardOpen)) return;
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
            if(state.systemKeyboardOpen){
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
            if(state.keyboardOpen || state.systemKeyboardOpen){
                requestAnimationFrame(()=>requestAnimationFrame(positionLauncherNearTyping));
            }
        }
        window.visualViewport?.addEventListener("resize",updateKeyboardViewport);
        window.visualViewport?.addEventListener("scroll",updateKeyboardViewport);
        window.addEventListener("orientationchange",()=>setTimeout(updateKeyboardViewport,120));
        window.addEventListener("resize",updateKeyboardViewport);
        navigator.virtualKeyboard?.addEventListener?.("geometrychange",updateKeyboardViewport);
        updateKeyboardViewport();
        restoreLauncherPosition();
        autoGrowInput();
        root.querySelector("#aeronMemoryStatus").textContent=state.memoryEnabled?"Memory: ON":"Memory: local";
        setupSpeech(); intro();

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
