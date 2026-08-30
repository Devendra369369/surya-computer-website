/* ==================================================
   SURYA CIMP ADMIN GUARD + TRUSTED DEVICE APPROVAL
================================================== */
(function(){
  "use strict";

  const token = sessionStorage.getItem("SURYA_ADMIN_TOKEN");
  const auth = sessionStorage.getItem("SURYA_ADMIN_AUTH");

  if(!token || auth !== "true"){
    const target = encodeURIComponent(location.pathname.split("/").pop() || "admin.html");
    location.replace("admin-login.html?next=" + target);
    return;
  }

  const API = "https://script.google.com/macros/s/AKfycbwHLdgDT9lyVnQc_65gF3LQC1ZWuFnfOU2Uxwg7PVee8O-oUGdDjcK29EBzCSHMtDSrxQ/exec";
  let polling = false;

  function esc(v){
    return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  }

  function getOrCreateApprovalBox(){
    let box = document.getElementById("suryaAdminApprovalBox");
    if(box) return box;

    box = document.createElement("div");
    box.id = "suryaAdminApprovalBox";
    box.style.cssText =
      "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);" +
      "width:min(92vw,430px);z-index:1000000;background:#fff;color:#172033;" +
      "padding:22px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.35);" +
      "text-align:center;border:1px solid #dbe2ea;";
    box.innerHTML = `
      <h2 style="margin-top:0">🔐 New Admin Login</h2>
      <p id="suryaApprovalInfo">A new browser/device is requesting Admin access.</p>
      <p style="font-size:15px">Verify the device and tap <b>YES</b> only if you recognize it.</p>
      <div id="suryaApprovalNumber" style="font-size:38px;font-weight:900;letter-spacing:6px;margin:12px 0;"></div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button id="suryaApprovalNo" type="button" style="padding:12px 18px;border:0;border-radius:9px;background:#c62828;color:#fff;font-weight:700;cursor:pointer;">❌ NO</button>
        <button id="suryaApprovalYes" type="button" style="padding:12px 18px;border:0;border-radius:9px;background:#198754;color:#fff;font-weight:700;cursor:pointer;">✅ YES — VERIFY NUMBER</button>
      </div>
    `;
    document.body.appendChild(box);
    return box;
  }

  async function respond(challenge, approve){
    const number = approve ? String(challenge.number || "") : "";
    const r = await fetch(API,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({
        action:"respondAdminLoginChallenge",
        token:token,
        challengeId:challenge.challengeId,
        approve:approve,
        number:number
      })
    });
    return await r.json();
  }

  async function poll(){
    if(polling) return;
    polling = true;

    try{
      const r = await fetch(API,{
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify({
          action:"getAdminLoginChallenges",
          token:token
        })
      });
      const d = await r.json();

      if(!d.success) return;
      const c = (d.challenges || [])[0];
      if(!c) return;

      const box = getOrCreateApprovalBox();
      box.style.display = "block";
      document.getElementById("suryaApprovalNumber").textContent = String(c.number || "—");
      document.getElementById("suryaApprovalYes").textContent = "✅ YES — " + String(c.number || "");
      document.getElementById("suryaApprovalInfo").innerHTML =
        "Browser: <b>" + esc(c.browser) + "</b><br>" +
        "Device: <b>" + esc(c.platform) + "</b><br>" +
        "Time zone: <b>" + esc(c.timezone) + "</b>";

      const yes = document.getElementById("suryaApprovalYes");
      const no = document.getElementById("suryaApprovalNo");

      const finish = async function(approve){
        yes.disabled = true; no.disabled = true;
        try{
          const result = await respond(c,approve);
          if(result.success){
            box.remove();
          }else{
            alert("❌ " + (result.message || "Unable to process approval."));
            yes.disabled = false; no.disabled = false;
          }
        }catch(e){
          alert("❌ Approval service unavailable.");
          yes.disabled = false; no.disabled = false;
        }
      };

      yes.onclick = function(){finish(true);};
      no.onclick = function(){finish(false);};
    }catch(e){
      /* Background security polling must never block the Admin UI. */
    }finally{
      polling = false;
    }
  }

  setTimeout(function(){
    poll();
    setInterval(poll,5000);
  },1500);
})();
