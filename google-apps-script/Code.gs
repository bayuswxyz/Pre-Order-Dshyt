/**
 * Google Apps Script Web App for "Database Pesanan Kopi D'SHYT"
 *
 * Columns (A - K):
 * Timestamp | Nama | WhatsApp | Pesanan | Total | Pengiriman | Alamat | Catatan | Metode Pembayaran | Status Pembayaran | Bukti Pembayaran
 */

var SHEET_HEADERS = [
  'Timestamp',
  'Nama',
  'WhatsApp',
  'Pesanan',
  'Total',
  'Pengiriman',
  'Alamat',
  'Catatan',
  'Metode Pembayaran',
  'Status Pembayaran',
  'Bukti Pembayaran',
];

var DRIVE_FOLDER_ID = '1AaC0W21EWIVzxZAdu0lNLPumyN3eDJJH';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(rawBody);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SHEET_HEADERS);
    }

    var metodePembayaran = data.metodePembayaran || 'Cash';
    var statusPembayaran = '';
    var buktiUrl = data.buktiPembayaran || '-';

    if (metodePembayaran === 'QR') {
      statusPembayaran = data.statusPembayaran || 'Menunggu Konfirmasi';

      if (data.fileData) {
        buktiUrl = saveProofToDrive_(
          data.fileData,
          data.fileType || 'image/png',
          data.fileName || 'bukti-qr.png',
          data.nama || 'Pelanggan'
        );
      } else {
        buktiUrl = '-';
      }
    } else {
      metodePembayaran = 'Cash';
      statusPembayaran = 'Pending';
      buktiUrl = '-';
    }

    var rowValues = [
      data.timestamp ? new Date(data.timestamp) : new Date(),
      data.nama || '',
      data.whatsapp || '',
      data.pesanan || '',
      data.total || '',
      data.pengiriman || '',
      data.alamat || '',
      data.catatan || '',
      metodePembayaran,
      statusPembayaran,
      buktiUrl,
    ];

    sheet.appendRow(rowValues);

    return jsonResponse_({
      status: 'success',
      row: sheet.getLastRow(),
      metodePembayaran: metodePembayaran,
      statusPembayaran: statusPembayaran,
      buktiPembayaran: buktiUrl,
    });
  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: err && err.message ? err.message : String(err),
    });
  } finally {
    lock.releaseLock();
  }
}

function saveProofToDrive_(fileData, mimeType, fileName, customerName) {
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  var base64Part = fileData.indexOf(',') !== -1 ? fileData.split(',')[1] : fileData;
  var bytes = Utilities.base64Decode(base64Part.trim());
  var safeCustomer = String(customerName || 'customer').replace(/[^a-zA-Z0-9_-]/g, '_');
  var timestampTag = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss');
  var finalName = timestampTag + '_' + safeCustomer + '_' + fileName;

  var blob = Utilities.newBlob(bytes, mimeType, finalName);
  var file = folder.createFile(blob);

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    // Some Google Workspace domains restrict public link sharing; keep private Drive URL.
  }

  return file.getUrl();
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
