// Google Apps Script: saves website enquiries to the Google Sheet it is attached to.
// Setup steps are in README.md ("Saving enquiries to a Google Sheet").

const FIELDS = ["source", "name", "business", "service", "budget", "timeline", "contact", "message"];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(["received"].concat(FIELDS));

  const p = (e && e.parameter) || {};
  if (!p.name || !p.contact) return ContentService.createTextOutput("missing fields");

  sheet.appendRow([new Date()].concat(FIELDS.map((key) => clean(p[key]))));
  return ContentService.createTextOutput("ok");
}

// Public endpoint, so cap length and stop values being run as spreadsheet formulas.
function clean(value) {
  const text = String(value || "").slice(0, 1000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
