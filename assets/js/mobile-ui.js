/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : mobile-ui.js
   Version : v1.2.0
   Purpose : Mobile Keyboard Input Visibility
================================================== */

(function () {

    "use strict";


    function keepVisible(element) {

        if (!element) {
            return;
        }


        if (
            !element.matches(
                "input, textarea, select"
            )
        ) {
            return;
        }


        setTimeout(function () {

            element.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });

        }, 150);

    }


    /* ==================================================
       INPUT / TEXTAREA / SELECT FOCUS
    ================================================== */

    document.addEventListener(
        "focusin",
        function (event) {

            const element =
                event.target;


            if (
                !element.matches(
                    "input, textarea, select"
                )
            ) {
                return;
            }


            keepVisible(element);


            setTimeout(function () {

                keepVisible(element);

            }, 400);


            setTimeout(function () {

                keepVisible(element);

            }, 800);

        }
    );


    /* ==================================================
       KEYBOARD / VIEWPORT CHANGE
    ================================================== */

    if (window.visualViewport) {

        window.visualViewport.addEventListener(
            "resize",
            function () {

                const element =
                    document.activeElement;


                if (
                    element &&
                    element.matches(
                        "input, textarea, select"
                    )
                ) {

                    keepVisible(element);

                }

            }
        );

    }


    console.log(
        "SURYA MOBILE UI READY"
    );

})();