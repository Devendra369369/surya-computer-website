(function(){
  "use strict";
  var key="SURYA_CIMP_THEME";
  var saved=localStorage.getItem(key);
  var theme=saved || "light";
  document.documentElement.setAttribute("data-theme",theme);
  function addToggle(){
    if(document.querySelector(".cimp-theme-toggle")) return;
    var b=document.createElement("button");
    b.type="button"; b.className="cimp-theme-toggle";
    b.setAttribute("aria-label","Toggle dark and light mode");
    function sync(){ b.textContent=document.documentElement.getAttribute("data-theme")==="dark" ? "☀️" : "🌙"; }
    b.addEventListener("click",function(){
      var next=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
      document.documentElement.setAttribute("data-theme",next);
      localStorage.setItem(key,next); sync();
    });
    document.body.appendChild(b); sync();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",addToggle); else addToggle();
})();
