// ============================================================
// FOOD Center — Form Submission Backend (Google Apps Script)
// ============================================================
// Receives form submissions via standard POST, validates reCAPTCHA,
// and logs entries to a Google Sheet.
//
// SETUP:
// 1. Open your Google Sheet > Extensions > Apps Script
// 2. Paste this entire file into the script editor
// 3. Deploy > Manage deployments > Edit (pencil icon) > New version > Deploy
//    (You must create a NEW version each time you update the code)
// ============================================================

var RECAPTCHA_SECRET = '6LeLnK0sAAAAAAcogU9tRCYZ001dKQn1AILGi6j4';
var MIN_SCORE = 0.3;

function doPost(e) {
  try {
    // Read form fields from standard form POST (e.parameter)
    var p = e.parameter;

    // ── Validate reCAPTCHA ──
    if (RECAPTCHA_SECRET && p.recaptcha_token) {
      var recaptchaResponse = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'post',
        payload: {
          secret: RECAPTCHA_SECRET,
          response: p.recaptcha_token
        }
      });
      var recaptchaResult = JSON.parse(recaptchaResponse.getContentText());

      if (!recaptchaResult.success || (recaptchaResult.score && recaptchaResult.score < MIN_SCORE)) {
        return HtmlService.createHtmlOutput('<html><body><script>window.top.postMessage("captcha_failed","*");</script></body></html>');
      }
    }

    // ── Log to Google Sheet ──
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Submissions') || ss.insertSheet('Submissions');

    // Add headers if first entry
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Name',
        'Email',
        'Organization',
        'Role',
        'Industry',
        'Biggest Barrier',
        'How Can We Help',
        'May Contact',
        'reCAPTCHA Score'
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date().toISOString(),
      p.name || '',
      p.email || '',
      p.organization || '',
      p.role || '',
      p.industry || '',
      p.pain_point || '',
      p.how_help || '',
      p.contact_ok === 'true' ? 'Yes' : 'No',
      p.recaptcha_score || 'N/A'
    ]);

    try { sheet.autoResizeColumns(1, 10); } catch(err) {}

    // Return a small HTML page that signals success to the parent window
    return HtmlService.createHtmlOutput('<html><body><script>window.top.postMessage("form_success","*");</script></body></html>');

  } catch (error) {
    return HtmlService.createHtmlOutput('<html><body><script>window.top.postMessage("form_error","*");</script></body></html>');
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'FOOD Center Form Backend is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
