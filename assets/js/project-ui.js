(function () {
    "use strict";

    /* ==================================================
       SURYA CIMP
       THEME + READING MODE CONTROLLER

       SINGLE CLICK:
       NORMAL → READING 1 → READING 2 → READING 3 → READING 4 → NORMAL

       2 FAST CLICKS:
       DARK ↔ LIGHT

       3 FAST CLICKS:
       READING CANCEL → NORMAL

       Technical Advisor: AERON
    ================================================== */

    var THEME_KEY = "SURYA_CIMP_THEME";
    var baseTheme = localStorage.getItem(THEME_KEY);
    if (baseTheme !== "dark" && baseTheme !== "light") baseTheme = "light";

    var readingTints = [
        "rgba(255, 70, 35, 0.075)",
        "rgba(255, 90, 55, 0.11)",
        "rgba(255, 75, 45, 0.14)",
        "rgba(255, 100, 70, 0.08)"
    ];

    var readingLevel = -1;
    var tapCount = 0;
    var tapTimer = null;
    var FAST_CLICK_TIME = 350;

    var style = document.createElement("style");
    style.id = "cimp-theme-reading-style";
    style.textContent = `
        .cimp-theme-toggle {
            position: fixed; right: 18px; bottom: 18px;
            width: 50px; height: 50px; padding: 0; border: none;
            border-radius: 50%; display: flex; align-items: center;
            justify-content: center; cursor: pointer; z-index: 999999;
            background: rgba(255,255,255,0.08);
            box-shadow: 0 2px 7px rgba(0,0,0,0.05);
            opacity: 0.50; -webkit-tap-highlight-color: transparent;
            user-select: none; touch-action: manipulation;
            transition: transform .15s ease, opacity .20s ease;
        }
        .cimp-theme-toggle:active { transform: scale(0.90); opacity: 0.68; }
        .cimp-theme-toggle.cimp-normal-empty {
            opacity: 0.08; background: rgba(255,255,255,0.03); box-shadow: none;
        }
        .cimp-book-icon, .cimp-book-icon svg { width: 36px; height: 32px; display: block; }
        .cimp-book-icon { pointer-events: none; }
        html[data-cimp-reading="true"]::after {
            content: ""; position: fixed; inset: 0; pointer-events: none;
            z-index: 999998; background: var(--cimp-reading-tint);
        }
        html[data-cimp-reading="true"], html[data-cimp-reading="true"] body { filter: none !important; }
        @media print { .cimp-theme-toggle { display:none !important; } }
    `;
    document.head.appendChild(style);

    function applyBaseTheme() {
        document.documentElement.setAttribute("data-theme", baseTheme);
        document.documentElement.style.colorScheme = baseTheme;
        localStorage.setItem(THEME_KEY, baseTheme);
    }

    function applyReadingLevel() {
        if (readingLevel === -1) {
            document.documentElement.removeAttribute("data-cimp-reading");
            document.documentElement.style.removeProperty("--cimp-reading-tint");
            updateButton(); return;
        }
        document.documentElement.style.setProperty("--cimp-reading-tint", readingTints[readingLevel]);
        document.documentElement.setAttribute("data-cimp-reading", "true");
        updateButton();
    }

    function nextReadingLevel() {
        if (readingLevel === -1) readingLevel = 0;
        else { readingLevel++; if (readingLevel >= 4) readingLevel = -1; }
        applyReadingLevel();
    }

    function toggleDarkLight() {
        baseTheme = baseTheme === "dark" ? "light" : "dark";
        applyBaseTheme(); applyReadingLevel();
    }

    function cancelReading() {
        readingLevel = -1;
        document.documentElement.removeAttribute("data-cimp-reading");
        document.documentElement.style.removeProperty("--cimp-reading-tint");
        updateButton();
    }

    function createBookIcon(level) {
        var wrapper = document.createElement("span");
        wrapper.className = "cimp-book-icon";
        var numberX = (level === 1 || level === 3) ? 20 : 44;
        wrapper.innerHTML = `
            <svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M31 10 C24 6 15 6 7 10 V45 C15 41 24 41 31 46 Z" fill="rgba(255,255,255,.72)" stroke="rgba(70,50,35,.45)" stroke-width="2.2"/>
                <path d="M33 10 C40 6 49 6 57 10 V45 C49 41 40 41 33 46 Z" fill="rgba(255,255,255,.72)" stroke="rgba(70,50,35,.45)" stroke-width="2.2"/>
                <path d="M32 10 V46" stroke="rgba(70,50,35,.50)" stroke-width="2"/>
                <path d="M11 17 C17 15 24 16 28 18 M11 25 C17 23 24 24 28 26 M11 33 C17 31 24 32 28 34" fill="none" stroke="rgba(90,70,50,.20)" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M36 18 C40 16 47 15 53 17 M36 26 C40 24 47 23 53 25 M36 34 C40 32 47 31 53 33" fill="none" stroke="rgba(90,70,50,.20)" stroke-width="1.2" stroke-linecap="round"/>
                <text x="${numberX}" y="34" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="rgba(55,35,20,.48)">${level}</text>
            </svg>`;
        return wrapper;
    }

    function updateButton() {
        var button = document.querySelector(".cimp-theme-toggle");
        if (!button) return;
        button.innerHTML = "";
        if (readingLevel >= 0) {
            button.classList.remove("cimp-normal-empty");
            button.style.opacity = "0.50";
            button.appendChild(createBookIcon(readingLevel + 1));
            button.title = "Reading Mode Level " + (readingLevel + 1);
            return;
        }
        button.classList.add("cimp-normal-empty");
        button.style.opacity = "0.08";
        button.style.pointerEvents = "auto";
        button.title = "Theme & Reading Control";
    }

    function processClicks() {
        if (tapCount === 1) nextReadingLevel();
        else if (tapCount === 2) toggleDarkLight();
        else if (tapCount >= 3) cancelReading();
        tapCount = 0;
    }

    function handleClick() {
        tapCount++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(processClicks, FAST_CLICK_TIME);
    }

    function addToggle() {
        var oldButton = document.querySelector(".cimp-theme-toggle");
        if (oldButton) oldButton.remove();
        var button = document.createElement("button");
        button.type = "button";
        button.className = "cimp-theme-toggle";
        button.setAttribute("aria-label", "Theme and Reading Control");
        button.style.pointerEvents = "auto";
        button.addEventListener("click", handleClick);
        document.body.appendChild(button);
        updateButton();
    }

    function start() {
        applyBaseTheme();
        readingLevel = -1;
        document.documentElement.removeAttribute("data-cimp-reading");
        document.documentElement.style.removeProperty("--cimp-reading-tint");
        addToggle();
    }


    /* ==================================================
       FORM UX
       Focused field is kept in the visual center so the
       mobile keyboard does not hide the active control.
       Enter moves to the next logical field.
    ================================================== */
    function setupCenteredFormNavigation() {
        var controls = Array.prototype.slice.call(
            document.querySelectorAll(
                'input:not([type="hidden"]), select, textarea'
            )
        );

        controls.forEach(function(control) {
            control.addEventListener("focus", function() {
                setTimeout(function() {
                    try {
                        control.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                            inline: "nearest"
                        });
                    } catch (_) {}
                }, 180);
            });

            control.addEventListener("keydown", function(event) {
                if (event.key !== "Enter") return;
                if (control.tagName === "TEXTAREA" && !event.ctrlKey) return;

                event.preventDefault();

                var currentIndex = controls.indexOf(control);
                for (var i = currentIndex + 1; i < controls.length; i++) {
                    var next = controls[i];
                    if (!next.disabled && next.offsetParent !== null) {
                        next.focus({preventScroll:true});
                        setTimeout(function(){ try { next.scrollIntoView({behavior:"smooth",block:"center"}); } catch (_) {} }, 80);
                        break;
                    }
                }
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupCenteredFormNavigation);
    } else {
        setupCenteredFormNavigation();
    }
})();
