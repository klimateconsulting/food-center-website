// ============================================================
// FOOD Center — Form Submission Backend (Google Apps Script)
// ============================================================
// Receives form submissions via standard POST, validates reCAPTCHA,
// and logs entries to a Google Sheet with analytics metadata.
//
// TO UPDATE: Deploy > Manage deployments > Edit > New version > Deploy
// ============================================================

var RECAPTCHA_SECRET = '6LeLnK0sAAAAAAcogU9tRCYZ001dKQn1AILGi6j4';
var MIN_SCORE = 0.3;

function doPost(e) {
  try {
    var p = e.parameter;
    var recaptchaScore = 'N/A';

    // ── Validate reCAPTCHA and capture score ──
    if (RECAPTCHA_SECRET && p.recaptcha_token) {
      var recaptchaResponse = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'post',
        payload: {
          secret: RECAPTCHA_SECRET,
          response: p.recaptcha_token
        }
      });
      var recaptchaResult = JSON.parse(recaptchaResponse.getContentText());
      recaptchaScore = recaptchaResult.score || 'N/A';

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
        'reCAPTCHA Score',
        'Browser / User Agent',
        'Screen Size',
        'Language',
        'Timezone',
        'Referrer',
        'Page URL'
      ]);
      sheet.getRange(1, 1, 1, 16).setFontWeight('bold');
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
      recaptchaScore,
      p.user_agent || '',
      p.screen_size || '',
      p.language || '',
      p.timezone || '',
      p.referrer || '(direct)',
      p.page_url || ''
    ]);

    try { sheet.autoResizeColumns(1, 16); } catch(err) {}

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
