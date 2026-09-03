/* ==================================================
   AERON LOCAL TTS ENGINE FOUNDATION
   v1.0 — provider-ready, browser-independent architecture
   The actual Indian male/female neural voice models can be
   plugged in later without changing AERON widget code.
================================================== */
(function(){
    "use strict";

    const providers = new Map();
    let activeVoice = "male";

    function clean(text){
        return String(text || "")
            .replace(/<[^>]*>/g," ")
            .replace(/https?:\/\/\S+/gi," ")
            .replace(/[*_`~#]+/g," ")
            .replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\uFE0F\u200D]/gu," ")
            .replace(/\s+/g," ").trim().slice(0,4000);
    }

    async function speak(text, options){
        const spoken=clean(text);
        if(!spoken) return false;
        const opts=Object.assign({voice:activeVoice,lang:"hi-IN",rate:0.96,pitch:1.0},options||{});
        const provider=providers.get(opts.voice)||providers.get("male");
        if(provider && typeof provider.speak === "function") {
            try {
                const ok=await provider.speak(spoken,opts);
                if(ok) return true;
            } catch(err) {
                console.warn("AERON local TTS provider error:",err);
            }
        }
        return false;
    }

    function stop(){
        for(const provider of providers.values()){
            try{ provider.stop?.(); }catch(_){}
        }
    }

    function registerVoice(name, provider){
        if(!name || !provider) return;
        providers.set(String(name),provider);
    }

    function setVoice(name){
        if(providers.has(name) || name === "male" || name === "female") activeVoice=name;
    }

    // Local-model adapter contract. A future ONNX/WebAssembly/native model
    // only needs to implement speak(text, options) -> Promise<boolean>.
    registerVoice("male", {
        speak: async () => false,
        stop: () => {}
    });
    registerVoice("female", {
        speak: async () => false,
        stop: () => {}
    });

    window.AERON_TTS = Object.freeze({
        version:"1.0.0-foundation",
        engine:"aeron-local",
        speak, stop, registerVoice, setVoice,
        getVoice:()=>activeVoice
    });
})();
