/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   Product : CIMP — Computer Institute Management Platform
   Organization : SURYA COMPUTER OF EDUCATION CENTER
   Developer : Devendra Kumar
   Technical Advisor : AERON
   ================================================== */

/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : Documents.gs
   Version : v1.0.0
   Purpose : Student Document Upload Manager
================================================== */

"use strict";


/* ==================================================
   GOOGLE DRIVE FOLDER IDs
================================================== */

const SURYA_DRIVE_FOLDERS = {

    photo:
        "1ICINK33GdLxRkSpbwihvF1O9Z1pu-4gn",

    signature:
        "1dGMmNXgl5PXO1BQw4KIm2hFTHYiDIo0L",

    aadhaar:
        "1tO-kNZL_vZOwL9L8hxNfT1gsGY6WHACA",

    marksheet:
        "18BDVHSpoFNCw2GZLe6b7kBMfb0jFvpSo"

};


/* ==================================================
   SAVE ALL STUDENT DOCUMENTS
================================================== */

function saveStudentDocuments(
    applicationId,
    data
) {

    if (!applicationId) {

        throw new Error(
            "Application ID is required."
        );

    }


    if (!data) {

        throw new Error(
            "Student document data is missing."
        );

    }


    const result = {

        photoUrl: "",

        photoName: "",

        signatureUrl: "",

        signatureName: "",

        marksheetUrl: "",

        marksheetName: "",

        aadhaarUploaded: false,

        aadhaarMode: "",

        aadhaarName: "",

        aadhaarFrontName: "",

        aadhaarBackName: "",

        aadhaarBackUploaded: false,
        
        aadhaarFrontUrl: "",
                
        aadhaarBackUrl: ""

    };


    /* =========================================
       STUDENT PHOTO
    ========================================= */

    if (data.photo) {

        const photoFile =
            saveBase64File(

                data.photo,

                data.photoName ||
                    (
                        applicationId +
                        "_PHOTO"
                    ),

                data.photoType ||
                    "image/jpeg",

                SURYA_DRIVE_FOLDERS.photo

            );
            
            /* =========================================
   MAKE STUDENT PHOTO VIEWABLE
========================================= */

try {

    DriveApp
        .getFileById(
            photoFile.id
        )
        .setSharing(
            DriveApp.Access.ANYONE_WITH_LINK,
            DriveApp.Permission.VIEW
        );

} catch (error) {

    console.log(
        "Photo sharing update failed: " +
        error.message
    );

}


        result.photoUrl =
        "https://drive.google.com/uc?export=view&id=" +
            photoFile.id;


        result.photoName =
            photoFile.name;

    }


    /* =========================================
       STUDENT SIGNATURE
    ========================================= */

    if (data.signature) {

        const signatureFile =
            saveBase64File(

                data.signature,

                data.signatureName ||
                    (
                        applicationId +
                        "_SIGNATURE"
                    ),

                data.signatureType ||
                    "image/png",

                SURYA_DRIVE_FOLDERS.signature

            );


        result.signatureUrl =
            signatureFile.url;


        result.signatureName =
            signatureFile.name;

    }


    /* =========================================
       MARKSHEET
    ========================================= */

    if (data.marcsheet) {

        const marksheetFile =
            saveBase64File(

                data.marcsheet,

                data.marcsheetName ||
                    (
                        applicationId +
                        "_MARKSHEET"
                    ),

                data.marcsheetType ||
                    "image/jpeg",

                SURYA_DRIVE_FOLDERS.marksheet

            );


        result.marksheetUrl =
            marksheetFile.url;


        result.marksheetName =
            marksheetFile.name;

    }


    /* =========================================
       AADHAAR
    ========================================= */

    if (
        data.aadhaarData
    ) {

        const aadhaar =
            data.aadhaarData;


        result.aadhaarMode =
            aadhaar.mode || "";


        /* =====================================
           AADHAAR PDF
        ===================================== */

        if (
            aadhaar.mode === "pdf" &&
            aadhaar.frontData
        ) {

            const aadhaarPdf =
                saveBase64File(

                    aadhaar.frontData,

                    aadhaar.frontName ||
                        (
                            applicationId +
                            "_AADHAAR.pdf"
                        ),

                    aadhaar.frontType ||
                        "application/pdf",

                    SURYA_DRIVE_FOLDERS.aadhaar

                );


            result.aadhaarUploaded =
                true;


            result.aadhaarName =
                aadhaarPdf.name;


            result.aadhaarFrontName =
                aadhaarPdf.name;
                
            result.aadhaarFrontUrl =
                aadhaarPdf.url;

        }


        /* =====================================
           AADHAAR FRONT + BACK
        ===================================== */

        else if (
            aadhaar.mode === "image"
        ) {

            if (
                !aadhaar.frontData
            ) {

                throw new Error(
                    "Aadhaar front image is missing."
                );

            }
            


            const frontFile =
                saveBase64File(

                    aadhaar.frontData,
                
                        applicationId +
                        "_AADHAAR_FRONT",
                                       
                    aadhaar.frontType ||
                        "image/jpeg",

                    SURYA_DRIVE_FOLDERS.aadhaar

                );


            result.aadhaarUploaded =
                true;


            result.aadhaarFrontName =
                frontFile.name;


            result.aadhaarName =
                frontFile.name;
                
            result.aadhaarFrontUrl =
                frontFile.url;


            /* =============================
               AADHAAR BACK
            ============================= */

            if (
                aadhaar.backData
            ) {

                const backFile =
                    saveBase64File(

                        aadhaar.backData,
                 
                            applicationId +
                            "_AADHAAR_BACK",
                            
                        aadhaar.backType ||
                            "image/jpeg",

                        SURYA_DRIVE_FOLDERS.aadhaar

                    );


                result.aadhaarBackName =
                    backFile.name;
                    
                result.aadhaarBackUrl =
                    backFile.url;


                result.aadhaarBackUploaded =
                    true;

            }

        }

    }


    return result;

}


/* ==================================================
   SAVE BASE64 FILE TO GOOGLE DRIVE
================================================== */

function saveBase64File(

    dataUrl,

    fileName,

    mimeType,

    folderId

) {

    if (!dataUrl) {

        throw new Error(
            "File data is empty."
        );

    }


    if (!folderId) {

        throw new Error(
            "Google Drive folder ID is missing."
        );

    }


    /* =========================================
       REMOVE DATA URL PREFIX
    ========================================= */

    let base64Data =
        String(dataUrl);


    if (
        base64Data.indexOf(
            "base64,"
        ) !== -1
    ) {

        base64Data =
            base64Data.split(
                "base64,"
            )[1];

    }


    /* =========================================
       CLEAN BASE64
    ========================================= */

    base64Data =
        base64Data
            .replace(
                /\s/g,
                ""
            );


    if (!base64Data) {

        throw new Error(
            "Invalid Base64 file data."
        );

    }


    /* =========================================
       DECODE
    ========================================= */

    const bytes =
        Utilities.base64Decode(
            base64Data
        );


    const blob =
        Utilities.newBlob(

            bytes,

            mimeType ||
                "application/octet-stream",

            fileName

        );


    /* =========================================
       GET DRIVE FOLDER
    ========================================= */

    const folder =
        DriveApp.getFolderById(
            folderId
        );


    /* =========================================
       CREATE FILE
    ========================================= */

    const file =
        folder.createFile(
            blob
        );


    return {

        id:
            file.getId(),

        name:
            file.getName(),

        url:
            file.getUrl(),

        mimeType:
            file.getMimeType(),

        size:
            file.getSize()

    };

}


/* ==================================================
   DOCUMENTS MODULE READY
================================================== */

console.log(
    "SURYA DOCUMENTS MANAGER v1.0.0 READY!"
);