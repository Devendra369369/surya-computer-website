/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : aadhaar-manager.js
   Version : v3.0.0
   Purpose : Aadhaar PDF / Front + Back Manager
================================================== */

"use strict";

const SURYA_AADHAAR_DB =
    "SURYA_AADHAAR_DB";

const SURYA_AADHAAR_STORE =
    "aadhaarFiles";

const SURYA_AADHAAR_MAX_SIZE =
    2 * 1024 * 1024;


/* ==================================================
   OPEN DATABASE
================================================== */

function openAadhaarDatabase() {

    return new Promise(function(resolve, reject) {

        const request =
            indexedDB.open(
                SURYA_AADHAAR_DB,
                1
            );

        request.onupgradeneeded =
            function(event) {

                const db =
                    event.target.result;

                if (
                    !db.objectStoreNames.contains(
                        SURYA_AADHAAR_STORE
                    )
                ) {

                    db.createObjectStore(
                        SURYA_AADHAAR_STORE,
                        {
                            keyPath: "applicationId"
                        }
                    );

                }

            };

        request.onsuccess =
            function(event) {

                resolve(
                    event.target.result
                );

            };

        request.onerror =
            function() {

                reject(
                    new Error(
                        "Aadhaar database could not be opened."
                    )
                );

            };

    });

}


/* ==================================================
   VALIDATE FILE
================================================== */

function validateAadhaarFile(file) {

    if (!file) {

        throw new Error(
            "Aadhaar file is missing."
        );

    }

    const validType =
        file.type === "application/pdf" ||
        file.type.startsWith("image/");

    if (!validType) {

        throw new Error(
            "Aadhaar must be an image or PDF."
        );

    }

    if (
        file.size >
        SURYA_AADHAAR_MAX_SIZE
    ) {

        throw new Error(
            "Each Aadhaar file must be 2 MB or smaller."
        );

    }

}


/* ==================================================
   READ FILE
================================================== */

function readAadhaarFile(file) {

    return new Promise(
        function(resolve, reject) {

            const reader =
                new FileReader();

            reader.onload =
                function(event) {

                    resolve(
                        event.target.result
                    );

                };

            reader.onerror =
                function() {

                    reject(
                        new Error(
                            "Aadhaar file could not be read."
                        )
                    );

                };

            reader.readAsDataURL(file);

        }
    );

}


/* ==================================================
   SAVE PDF OR FRONT + BACK
================================================== */

async function saveAadhaarFiles(
    applicationId,
    aadhaarData
) {

    if (!aadhaarData) {

        throw new Error(
            "Aadhaar data is missing."
        );

    }

    const mode =
        aadhaarData.mode;

    const frontFile =
        aadhaarData.frontFile;

    const backFile =
        aadhaarData.backFile || null;

    if (mode === "pdf") {

        validateAadhaarFile(frontFile);

        if (
            frontFile.type !==
            "application/pdf"
        ) {

            throw new Error(
                "Invalid Aadhaar PDF."
            );

        }

    }

    else if (mode === "image") {

        validateAadhaarFile(frontFile);

        if (!frontFile.type.startsWith("image/")) {

            throw new Error(
                "Aadhaar Front must be an image."
            );

        }

        if (!backFile) {

            throw new Error(
                "Please upload Aadhaar Back image."
            );

        }

        if (!backFile.type.startsWith("image/")) {

            throw new Error(
                "Aadhaar Back must be an image."
            );

        }

        validateAadhaarFile(backFile);

    }

    else {

        throw new Error(
            "Please select Aadhaar PDF or Front image."
        );

    }


    const frontData =
    await readAadhaarFile(
        frontFile
    );


let backData = "";


if (
    mode === "image" &&
    backFile
) {

    backData =
        await readAadhaarFile(
            backFile
        );

}


/* =========================================
   OPEN DATABASE AFTER FILE READING
========================================= */

const db =
    await openAadhaarDatabase();


const transaction =
    db.transaction(
        SURYA_AADHAAR_STORE,
        "readwrite"
    );


const store =
    transaction.objectStore(
        SURYA_AADHAAR_STORE
    );


    store.put({

        applicationId:
            applicationId,

        mode:
            mode,

        frontData:
            frontData,

        frontName:
            frontFile.name,

        frontType:
            frontFile.type,

        frontSize:
            frontFile.size,

        backData:
            backData,

        backName:
            backFile
                ? backFile.name
                : "",

        backType:
            backFile
                ? backFile.type
                : "",

        backSize:
            backFile
                ? backFile.size
                : 0,

        savedAt:
            new Date().toISOString()

    });


    return new Promise(
        function(resolve, reject) {

            transaction.oncomplete =
                function() {

                    db.close();

                    resolve(true);

                };

            transaction.onerror =
                function() {

                    db.close();

                    reject(
                        new Error(
                            "Aadhaar could not be saved."
                        )
                    );

                };

        }
    );

}


/* ==================================================
   OLD FUNCTION — COMPATIBILITY
================================================== */

async function saveAadhaarFile(
    applicationId,
    file
) {

    return saveAadhaarFiles(
        applicationId,
        {
            mode:
                file.type === "application/pdf"
                    ? "pdf"
                    : "image",

            frontFile:
                file,

            backFile:
                null
        }
    );

}


/* ==================================================
   GET AADHAAR
================================================== */

function getAadhaarFile(
    applicationId
) {

    return new Promise(
        async function(resolve, reject) {

            try {

                const db =
                    await openAadhaarDatabase();

                const transaction =
                    db.transaction(
                        SURYA_AADHAAR_STORE,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        SURYA_AADHAAR_STORE
                    );

                const request =
                    store.get(
                        applicationId
                    );

                request.onsuccess =
                    function() {

                        db.close();

                        resolve(
                            request.result ||
                            null
                        );

                    };

                request.onerror =
                    function() {

                        db.close();

                        reject(
                            new Error(
                                "Aadhaar could not be loaded."
                            )
                        );

                    };

            }

            catch (error) {

                reject(error);

            }

        }
    );

}


/* ==================================================
   DELETE AADHAAR
================================================== */

function deleteAadhaarFile(
    applicationId
) {

    return new Promise(
        async function(resolve, reject) {

            try {

                const db =
                    await openAadhaarDatabase();

                const transaction =
                    db.transaction(
                        SURYA_AADHAAR_STORE,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        SURYA_AADHAAR_STORE
                    );

                store.delete(
                    applicationId
                );

                transaction.oncomplete =
                    function() {

                        db.close();

                        resolve(true);

                    };

                transaction.onerror =
                    function() {

                        db.close();

                        reject(
                            new Error(
                                "Aadhaar could not be deleted."
                            )
                        );

                    };

            }

            catch (error) {

                reject(error);

            }

        }
    );

}


console.log(
    "SURYA AADHAAR MANAGER v3.0.0 READY!"
);
