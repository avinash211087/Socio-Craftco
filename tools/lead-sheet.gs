// Google Apps Script: saves website enquiries to the "Leads" tab of the Google Sheet it is attached to,
// and builds a live "Dashboard" tab. Setup steps are in README.md ("Saving enquiries to a Google Sheet").

const FIELDS = ["source", "name", "business", "service", "budget", "timeline", "contact", "message"];
const HEADERS = ["Received", "Source", "Name", "Business", "Service", "Budget", "Timeline", "Contact", "Message", "Status", "Notes"];
const STATUSES = ["New", "Contacted", "Quoted", "Won", "Lost"];
const STATUS_COLORS = { New: "#FFF4CE", Contacted: "#E8EFFF", Quoted: "#EDE7FF", Won: "#DDF5E4", Lost: "#EEEEEE" };
const NAVY = "#0A1426", BLUE = "#0150FD", BLUE_SOFT = "#E8EFFF", MUTED = "#5B6476", LINE = "#E3E7EF";

function doPost(e) {
  const sheet = leadsSheet();
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

  const p = (e && e.parameter) || {};
  if (!p.name || !p.contact) return ContentService.createTextOutput("missing fields");

  sheet.appendRow([new Date()].concat(FIELDS.map((key) => clean(p[key])), ["New"]));
  return ContentService.createTextOutput("ok");
}

// Public endpoint, so cap length and stop values being run as spreadsheet formulas.
function clean(value) {
  const text = String(value || "").slice(0, 1000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function leadsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName("Leads") || ss.getSheets()[0];
}

// Run once from the Apps Script editor (select setupDashboard → Run). Safe to re-run: it rebuilds the Dashboard tab.
function setupDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  formatLeads(ss);
  buildDashboard(ss);
}

function formatLeads(ss) {
  const sheet = leadsSheet();
  sheet.setName("Leads");
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight("bold").setFontColor("#FFFFFF").setBackground(NAVY).setVerticalAlignment("middle");
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
  [150, 80, 150, 150, 170, 150, 120, 150, 320, 110, 240].forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  const body = sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length);
  body.setVerticalAlignment("top");
  sheet.getRange("A2:A").setNumberFormat("d mmm yyyy, h:mm am/pm");
  sheet.getRange("I2:I").setWrap(true);
  sheet.getRange("K2:K").setWrap(true);

  // Leads saved before the Status column existed count as New.
  const last = sheet.getLastRow();
  if (last > 1) {
    const status = sheet.getRange(2, 10, last - 1, 1);
    status.setValues(status.getValues().map((r) => [r[0] || "New"]));
  }

  sheet.getRange("J2:J").setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  sheet.setConditionalFormatRules(statusRules(sheet.getRange("J2:J")));
}

function statusRules(range) {
  return STATUSES.map((s) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(s).setBackground(STATUS_COLORS[s]).setRanges([range]).build());
}

function buildDashboard(ss) {
  const old = ss.getSheetByName("Dashboard");
  if (old) ss.deleteSheet(old);
  const d = ss.insertSheet("Dashboard", 0);
  const L = "Leads!";
  const has = L + "A2:A,\"<>\"";

  d.setHiddenGridlines(true);
  d.getRange("A1:Z200").setFontFamily("Arial").setFontColor(NAVY);
  [24, 150, 150, 160, 170, 150, 150, 120].forEach((w, i) => d.setColumnWidth(i + 1, w));

  // Title
  d.getRange("B1:H1").merge().setValue("Socio Craftco · Leads").setFontSize(20).setFontWeight("bold")
    .setFontColor("#FFFFFF").setBackground(NAVY).setVerticalAlignment("middle");
  d.getRange("A1").setBackground(NAVY);
  d.setRowHeight(1, 52);
  d.getRange("B2").setValue("Updates on its own as enquiries arrive. Track follow-ups in the Status column on the Leads tab.")
    .setFontColor(MUTED).setFontSize(10);

  // KPI tiles
  const tiles = [
    ["Total leads", "=COUNTA(" + L + "A2:A)", "0"],
    ["Last 7 days", "=COUNTIF(" + L + "A2:A,\">=\"&TODAY()-7)", "0"],
    ["This month", "=COUNTIF(" + L + "A2:A,\">=\"&EOMONTH(TODAY(),-1)+1)", "0"],
    ["Needs reply", "=COUNTIF(" + L + "J2:J,\"New\")", "0"],
    ["Won", "=COUNTIF(" + L + "J2:J,\"Won\")", "0"],
    ["Win rate", "=IFERROR(F5/B5,0)", "0%"]
  ];
  tiles.forEach(([label, formula, fmt], i) => {
    d.getRange(4, i + 2).setValue(label).setFontColor(MUTED).setFontSize(10);
    d.getRange(5, i + 2).setFormula(formula).setNumberFormat(fmt).setFontSize(26).setFontWeight("bold").setFontColor(BLUE);
  });
  d.getRange("B4:G5").setBackground(BLUE_SOFT).setHorizontalAlignment("center")
    .setBorder(true, true, true, true, true, false, "#FFFFFF", SpreadsheetApp.BorderStyle.SOLID_THICK);
  d.getRange("E5").setFontColor("#B26A00");
  d.getRange("F5").setFontColor("#1E7B3A");
  d.setRowHeight(4, 26);
  d.setRowHeight(5, 48);

  // Latest leads
  section(d, "B7", "Latest 10 leads");
  header(d, "B8:H8", ["Received", "Name", "Business", "Service", "Budget", "Contact", "Status"]);
  d.getRange("B9").setFormula("=IFERROR(QUERY(" + L + "A2:J,\"select A,C,D,E,F,H,J where A is not null order by A desc limit 10\",0),\"No leads yet\")");
  d.getRange("B9:B18").setNumberFormat("d mmm, h:mm am/pm").setHorizontalAlignment("left");
  d.getRange("B23:B34").setHorizontalAlignment("left");
  d.getRange("B9:H18").setBorder(null, null, true, null, null, true, LINE, SpreadsheetApp.BorderStyle.SOLID);
  d.setConditionalFormatRules(statusRules(d.getRange("H9:H18")));

  // Leads per week
  section(d, "B21", "Leads per week (last 12 weeks)");
  header(d, "B22:C22", ["Week of", "Leads"]);
  for (let i = 0; i < 12; i++) {
    const r = 23 + i;
    d.getRange(r, 2).setFormula("=TODAY()-WEEKDAY(TODAY(),2)+1-7*" + (11 - i)).setNumberFormat("d mmm");
    d.getRange(r, 3).setFormula("=COUNTIFS(" + L + "A2:A,\">=\"&B" + r + "," + L + "A2:A,\"<\"&B" + r + "+7)");
  }
  d.insertChart(d.newChart().setChartType(Charts.ChartType.COLUMN).addRange(d.getRange("B22:C34"))
    .setNumHeaders(1).setPosition(21, 5, 0, 0)
    .setOption("title", "Leads per week").setOption("legend", { position: "none" })
    .setOption("colors", [BLUE]).setOption("vAxis.format", "0").setOption("vAxis.viewWindow.min", 0).setOption("vAxis.gridlines.count", 3).setOption("width", 560).setOption("height", 300).build());

  // By service
  section(d, "B37", "By service");
  header(d, "B38:C38", ["Service", "Leads"]);
  d.getRange("B39").setFormula("=IFERROR(QUERY(" + L + "A2:E,\"select E, count(A) where A is not null group by E order by count(A) desc label count(A) ''\",0),\"—\")");
  const pieColors = [BLUE, "#5B8CFF", NAVY, "#9AA6BD", "#12224A", "#C9D6FF"];
  let pie = d.newChart().setChartType(Charts.ChartType.PIE);
  pieColors.forEach((c, i) => { pie = pie.setOption("series." + i + ".color", c).setOption("slices." + i + ".color", c); });
  d.insertChart(pie.addRange(d.getRange("B38:C46"))
    .setNumHeaders(1).setPosition(37, 5, 0, 0)
    .setOption("title", "Leads by service").setOption("pieHole", 0.5)
    .setOption("width", 560).setOption("height", 300).build());

  // Status, budget, source
  section(d, "B53", "Pipeline");
  header(d, "B54:C54", ["Status", "Leads"]);
  STATUSES.forEach((s, i) => {
    d.getRange(55 + i, 2).setValue(s).setBackground(STATUS_COLORS[s]);
    d.getRange(55 + i, 3).setFormula("=COUNTIF(" + L + "J2:J,\"" + s + "\")");
  });

  section(d, "E53", "Budget");
  header(d, "E54:F54", ["Budget", "Leads"]);
  ["Under ₹25,000", "₹25,000 – ₹75,000", "₹75,000 – ₹2,00,000", "Above ₹2,00,000"].forEach((b, i) => {
    d.getRange(55 + i, 5).setValue(b);
    d.getRange(55 + i, 6).setFormula("=COUNTIF(" + L + "F2:F,E" + (55 + i) + ")");
  });
  d.getRange("E59").setValue("Not shared");
  d.getRange("F59").setFormula("=COUNTIFS(" + has + "," + L + "F2:F,\"\")");

  section(d, "G53", "Came from");
  header(d, "G54:H54", ["Form", "Leads"]);
  [["Contact form", "contact"], ["Website preview", "preview"], ["Chat assistant", "chat"]].forEach(([label, key], i) => {
    d.getRange(55 + i, 7).setValue(label);
    d.getRange(55 + i, 8).setFormula("=COUNTIF(" + L + "B2:B,\"" + key + "\")");
  });

  d.setFrozenRows(2);
  d.activate();
}

function section(d, cell, title) {
  d.getRange(cell).setValue(title).setFontSize(13).setFontWeight("bold");
}

function header(d, a1, labels) {
  d.getRange(a1).setValues([labels]).setFontWeight("bold").setFontColor(MUTED).setFontSize(10)
    .setBorder(null, null, true, null, null, null, NAVY, SpreadsheetApp.BorderStyle.SOLID);
}
