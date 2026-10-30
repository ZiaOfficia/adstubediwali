/* =========================================================
   AdsTube · Diwali form receiver — Google Apps Script
   ---------------------------------------------------------
   Paste into the Apps Script project opened from your Google
   Sheet (Extensions → Apps Script). Leads go to a "Leads" tab
   and quote requests to a "Queries" tab; new payload fields
   get their own column automatically. Each submission is also
   emailed to NOTIFY_EMAIL.
   ========================================================= */
const NOTIFY_EMAIL = 'adstubeindia@gmail.com';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const name = data.lead_type === 'query' ? 'Queries' : 'Leads';
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(name) || book.insertSheet(name);

    const keys = Object.keys(data);
    const headers = sheet.getLastColumn()
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];
    keys.filter(k => !headers.includes(k)).forEach(k => headers.push(k));
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Leading ' stops Sheets treating +91… numbers and formula-like input as formulas
    const row = headers.map(h => (h in data ? "'" + data[h] : ''));
    sheet.appendRow(row);
    notify(name, data);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// The row is already saved by now, so a mail failure must not fail the form
function notify(tab, data) {
  try {
    const lines = Object.keys(data).map(k => k + ': ' + data[k]);
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New Diwali ' + (tab === 'Queries' ? 'query' : 'lead') + ' — ' + data.name + ' · ' + data.service,
      body: lines.join('\n')
    });
  } catch (err) {
    console.error(err);
  }
}

// Run from the editor: asks for mail permission and shows any error notify() hides
function testMail() {
  MailApp.sendEmail(NOTIFY_EMAIL, 'AdsTube form mail test', 'Mail from the Apps Script is working.');
  console.log('Sent. Quota left today: ' + MailApp.getRemainingDailyQuota());
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
