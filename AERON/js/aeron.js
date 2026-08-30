/* ==================================================
   AERON ASSISTANT
   Surya Computer Of Education Center
   JavaScript Engine v1.0
================================================== */

"use strict";


/* ==================================================
   ELEMENTS
================================================== */

const launcher =
    document.getElementById("aeronLauncher");

const panel =
    document.getElementById("aeronPanel");

const closeBtn =
    document.getElementById("aeronClose");

const stopBtn =
    document.getElementById("aeronStop");

const hideBtn =
    document.getElementById("aeronHide");

const chat =
    document.getElementById("aeronChat");

const form =
    document.getElementById("aeronForm");

const input =
    document.getElementById("aeronInput");

const sendBtn =
    document.getElementById("aeronSend");

const typing =
    document.getElementById("aeronTyping");


/* ==================================================
   STATE
================================================== */

let aeronStopped = false;

let typingTimer = null;

let responseTimer = null;


/* ==================================================
   OPEN AERON
================================================== */

function openAeron() {

    if (!panel) return;

    panel.classList.add("open");

    panel.setAttribute(
        "aria-hidden",
        "false"
    );

    if (!aeronStopped && input) {

        setTimeout(
            function () {
                input.focus();
            },
            250
        );

    }

}


/* ==================================================
   CLOSE AERON
================================================== */

function closeAeron() {

    if (!panel) return;

    panel.classList.remove("open");

    panel.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* ==================================================
   STOP AERON
================================================== */

function stopAeron() {

    aeronStopped = true;

    clearTimeout(responseTimer);

    clearInterval(typingTimer);

    hideTyping();

    if (panel) {

        panel.classList.add(
            "aeron-stopped"
        );

    }

    if (input) {

        input.disabled = true;

        input.placeholder =
            "AERON stopped";

    }

    if (sendBtn) {

        sendBtn.disabled = true;

    }

}


/* ==================================================
   START AERON AGAIN
================================================== */

function startAeron() {

    aeronStopped = false;

    if (panel) {

        panel.classList.remove(
            "aeron-stopped"
        );

    }

    if (input) {

        input.disabled = false;

        input.placeholder =
            "AERON से कुछ पूछें...";

    }

    if (sendBtn) {

        sendBtn.disabled = false;

    }

    if (input) {

        input.focus();

    }

}


/* ==================================================
   STOP BUTTON
   Tap once = Stop
   Tap again = Start
================================================== */

if (stopBtn) {

    stopBtn.addEventListener(
        "click",
        function () {

            if (aeronStopped) {

                startAeron();

            } else {

                stopAeron();

            }

        }
    );

}


/* ==================================================
   OPEN BUTTON
================================================== */

if (launcher) {

    launcher.addEventListener(
        "click",
        function () {

            if (
                panel.classList.contains("open")
            ) {

                closeAeron();

            } else {

                openAeron();

            }

        }
    );

}


/* ==================================================
   CLOSE BUTTON
================================================== */

if (closeBtn) {

    closeBtn.addEventListener(
        "click",
        closeAeron
    );

}


/* ==================================================
   HIDE BUTTON
================================================== */

if (hideBtn) {

    hideBtn.addEventListener(
        "click",
        closeAeron
    );

}


/* ==================================================
   ESCAPE KEY
================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            panel &&
            panel.classList.contains("open")
        ) {

            closeAeron();

        }

    }
);


/* ==================================================
   TYPING
================================================== */

function showTyping() {

    if (!typing) return;

    typing.hidden = false;

}


function hideTyping() {

    if (!typing) return;

    typing.hidden = true;

}


/* ==================================================
   SCROLL CHAT TO BOTTOM
================================================== */

function scrollChat() {

    if (!chat) return;

    chat.scrollTop =
        chat.scrollHeight;

}


/* ==================================================
   ADD MESSAGE
================================================== */

function addMessage(
    message,
    type = "bot"
) {

    if (!chat) return;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "aeron-message " +
        (
            type === "user"
                ? "aeron-user"
                : "aeron-bot"
        );


    if (type === "bot") {

        wrapper.innerHTML = `
            <div class="aeron-message-avatar">
                ✦
            </div>

            <div class="aeron-bubble">
                ${message}
            </div>
        `;

    } else {

        wrapper.innerHTML = `
            <div class="aeron-bubble">
                ${escapeHtml(message)}
            </div>
        `;

    }


    chat.appendChild(wrapper);

    scrollChat();

}


/* ==================================================
   BASIC HTML ESCAPE
================================================== */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


/* ==================================================
   DEMO AERON BRAIN
================================================== */

function getAeronResponse(question) {

    const q =
        question
        .toLowerCase()
        .trim();


    /* COURSE */

    if (
        q.includes("course") ||
        q.includes("courses") ||
        q.includes("कोर्स") ||
        q.includes("पाठ्यक्रम")
    ) {

        return `
            <strong>📚 Courses</strong>

            <p>
                Surya Computer Of Education Center
                में CCC, DCA, ADCA, Tally Prime,
                Typing और Basic Computer जैसे courses
                उपलब्ध हैं।
            </p>
        `;

    }


    /* ADMISSION */

    if (
        q.includes("admission") ||
        q.includes("admit") ||
        q.includes("प्रवेश") ||
        q.includes("एडमिशन")
    ) {

        return `
            <strong>📝 Online Admission</strong>

            <p>
                आप website के Admission section से
                online application भर सकते हैं।
            </p>

            <p>
                अपनी जानकारी ध्यान से भरें और
                आवश्यक documents upload करें।
            </p>
        `;

    }


    /* CERTIFICATE */

    if (
        q.includes("certificate") ||
        q.includes("प्रमाणपत्र") ||
        q.includes("सर्टिफिकेट")
    ) {

        return `
            <strong>🎓 Certificate Verification</strong>

            <p>
                Certificate Verification section में
                Certificate ID डालकर certificate की
                जानकारी verify की जा सकती है।
            </p>
        `;

    }


    /* CONTACT */

    if (
        q.includes("contact") ||
        q.includes("phone") ||
        q.includes("mobile") ||
        q.includes("सम्पर्क") ||
        q.includes("संपर्क")
    ) {

        return `
            <strong>📞 Contact</strong>

            <p>
                Surya Computer Of Education Center
                <br>
                📍 Kamalpur, Chandauli,
                Uttar Pradesh
            </p>

            <p>
                📞 7084275870
            </p>
        `;

    }


    /* HELLO */

    if (
        q.includes("hello") ||
        q.includes("hi") ||
        q.includes("hey") ||
        q.includes("नमस्ते") ||
        q.includes("हेलो")
    ) {

        return `
            <strong>नमस्ते! 👋</strong>

            <p>
                मैं AERON हूँ।
                बताइए, मैं आपकी क्या मदद करूँ?
            </p>
        `;

    }


    /* DEFAULT */

    return `
        <strong>🤖 AERON</strong>

        <p>
            मैं अभी अपने learning/demo mode में हूँ।
        </p>

        <p>
            आप मुझे <b>Courses, Admission,
            Certificate या Contact</b> के बारे में
            पूछ सकते हैं।
        </p>
    `;

}


/* ==================================================
   BOT RESPONSE
================================================== */

function answerQuestion(question) {

    if (aeronStopped) return;

    showTyping();

    clearTimeout(responseTimer);

    responseTimer =
        setTimeout(
            function () {

                if (aeronStopped) {

                    hideTyping();

                    return;

                }

                hideTyping();

                const response =
                    getAeronResponse(
                        question
                    );

                addMessage(
                    response,
                    "bot"
                );

            },
            700
        );

}


/* ==================================================
   FORM SUBMIT
================================================== */

if (form) {

    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            if (aeronStopped) return;

            const question =
                input.value.trim();

            if (!question) return;

            addMessage(
                question,
                "user"
            );

            input.value = "";

            answerQuestion(
                question
            );

        }
    );

}


/* ==================================================
   QUICK ACTION BUTTONS
================================================== */

document
    .querySelectorAll(
        ".aeron-quick-actions button"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (aeronStopped) return;

                    const question =
                        button.dataset.question ||
                        button.textContent.trim();

                    addMessage(
                        question,
                        "user"
                    );

                    answerQuestion(
                        question
                    );

                }
            );

        }
    );


/* ==================================================
   STARTUP
================================================== */

hideTyping();

console.log(
    "AERON Assistant v1.0 loaded successfully."
);
