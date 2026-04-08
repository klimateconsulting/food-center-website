// ============================================================
// FOOD Center — Form Submission Backend (Google Apps Script)
// ============================================================
// This script receives form submissions, validates reCAPTCHA,
// and logs entries to a Google Sheet.
//
// SETUP:
// 1. Create a Google Sheet named "FOOD Center Form Submissions"
// 2. Open Extensions > Apps Script
// 3. Paste this entire file into the script editor
// 4. Replace 6LeLnK0sAAAAAAcogU9tRCYZ001dKQn1AILGi6j4 below with your reCAPTCHA v3 secret key
// 5. Click Deploy > New deployment > Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy the deployment URL and paste it into index.html (APPS_SCRIPT_URL)
// ============================================================

// ⚠️ REPLACE with your reCAPTCHA v3 secret key
var RECAPTCHA_SECRET = '6LeLnK0sAAAAAAcogU9tRCYZ001dKQn1AILGi6j4';

// Minimum reCAPTCHA score to accept (0.0 - 1.0, higher = more likely human)
var MIN_SCORE = 0.3;

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // ── Validate reCAPTCHA ──
    if (RECAPTCHA_SECRET && data.recaptcha_token) {
      var recaptchaResponse = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'post',
        payload: {
          secret: RECAPTCHA_SECRET,
          response: data.recaptcha_token || ''
        }
      });
      var recaptchaResult = JSON.parse(recaptchaResponse.getContentText());

      if (!recaptchaResult.success || recaptchaResult.score < MIN_SCORE) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', message: 'reCAPTCHA verification failed' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ── Log to Google Sheet ──
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Submissions') || ss.insertSheet('Submissions');

    // Add headers if this is the first entry
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
        'IP (approximate)'
      ]);
      // Bold the header row
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
      // Freeze header row
      sheet.setFrozenRows(1);
    }

    // Append the submission
    sheet.appendRow([
      new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.organization || '',
      data.role || '',
      data.industry || '',
      data.pain_point || '',
      data.how_help || '',
      data.contact_ok ? 'Yes' : 'No',
      data.recaptcha_score || 'N/A',
      ''
    ]);

    // Auto-resize columns for readability
    try { sheet.autoResizeColumns(1, 11); } catch(err) {}

    // ── Send notification email (optional) ──
    // Uncomment and edit the line below to get email alerts on new submissions:
    // MailApp.sendEmail('arian@klimate.consulting', 'New FOOD Center Form Submission', 'Name: ' + data.name + '\nEmail: ' + data.email + '\nOrg: ' + data.organization + '\nIndustry: ' + data.industry);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Submission recorded' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'FOOD Center Form Backend is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
