/* ==================================================
   SURYA COMPUTER OF EDUCATION CENTER
   File    : Helpers.gs
   Version : v1.0.0
   Purpose : Common Backend Helpers
================================================== */

"use strict";


/* ==================================================
   SPREADSHEET
================================================== */

const SURYA_SPREADSHEET_ID =
    "1x69PqcF9NNQ3yJbFmMyXyNyOWCZP8cRxbNQAEYcvn7A";


/* ==================================================
   GET SPREADSHEET
================================================== */

function getSuryaSpreadsheet() {

    return SpreadsheetApp.openById(
        SURYA_SPREADSHEET_ID
    );

}


/* ==================================================
   GET SHEET
================================================== */

function getSheet(
    sheetName
) {

    if (!sheetName) {

        throw new Error(
            "Sheet name is required."
        );

    }


    const spreadsheet =
        getSuryaSpreadsheet();


    const sheet =
        spreadsheet.getSheetByName(
            sheetName
        );


    if (!sheet) {

        throw new Error(
            "Sheet not found: " +
            sheetName
        );

    }


    return sheet;

}


/* ==================================================
   JSON RESPONSE
================================================== */

function jsonResponse(
    data
) {

    return ContentService

        .createTextOutput(
            JSON.stringify(data)
        )

        .setMimeType(
            ContentService.MimeType.JSON
        );

}


/* ==================================================
   GET HEADER INDEX
================================================== */

function getHeaderIndex(
    headers,
    headerName
) {

    return headers.indexOf(
        headerName
    );

}


/* ==================================================
   FIND ROW BY ID
================================================== */

function findRowById(

    sheet,
    id

) {

    const values =
        sheet
            .getDataRange()
            .getValues();


    if (
        values.length < 2
    ) {

        return -1;

    }


    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        if (
            String(
                values[i][0]
            )
                .trim()
                .toUpperCase()
            ===
            String(id)
                .trim()
                .toUpperCase()
        ) {

            return i + 1;

        }

    }


    return -1;

}


/* ==================================================
   NORMALIZE TEXT
================================================== */

function normalizeText(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


/* ==================================================
   DATE STRING
================================================== */

function getCurrentDate() {

    return Utilities.formatDate(

        new Date(),

        Session.getScriptTimeZone(),

        "dd MMMM yyyy"

    );

}


/* ==================================================
   DOCUMENT URL
================================================== */

function getDriveFileUrl(
    fileId
) {

    if (!fileId) {

        return "";

    }


    return (
        "https://drive.google.com/file/d/" +
        fileId +
        "/view"
    );

}


/* ==================================================
   HELPERS READY
================================================== */

console.log(
    "SURYA HELPERS v1.0.0 READY!"
);