/**
 * Google Apps Script Web App for "Database Pesanan Kopi D'SHYT"
 *
 * Columns (A - L):
 * Timestamp | Nama | WhatsApp | Pesanan | Total | Pengiriman | Alamat | Catatan | Metode Pembayaran | Status Pembayaran | Bukti Pembayaran | Preview Gambar
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
  'Preview Gambar',
];

var DRIVE_FOLDER_ID = '1AaC0W21EWIVzxZAdu0lNLPumyN3eDJJH';
var DRIVE_FOLDER_NAME = 'bukti pembayaran';

function doGet() {
  return ContentService.createTextOutput("Kopi D'SHYT Order & QRIS Webhook is active.").setMimeType(
    ContentService.MimeType.TEXT
  );
}

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
    } else if (!sheet.getRange(1, 12).getValue()) {
      sheet.getRange(1, 12).setValue('Preview Gambar');
    }

    var metodePembayaran = data.metodePembayaran || 'Cash';
    var isQr = metodePembayaran === 'QR' || metodePembayaran === 'QRIS';
    var statusPembayaran = '';
    var buktiUrl = data.buktiPembayaran || '-';
    var previewFormula = '-';

    if (isQr) {
      metodePembayaran = 'QR';
      statusPembayaran = data.statusPembayaran || 'Menunggu Konfirmasi';

      if (data.fileData) {
        var savedFile = saveProofToDrive_(
          data.fileData,
          data.fileType || 'image/png',
          data.fileName || 'bukti-qr.png',
          data.nama || 'Pelanggan',
          data.driveFolderId || DRIVE_FOLDER_ID,
          data.driveFolderName || DRIVE_FOLDER_NAME
        );
        buktiUrl = savedFile.url;
        previewFormula = '=IMAGE("' + savedFile.directImageUrl + '")';
      } else {
        buktiUrl = '-';
        previewFormula = '-';
      }
    } else {
      metodePembayaran = 'Cash';
      statusPembayaran = 'Pending';
      buktiUrl = '-';
      previewFormula = '-';
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
      previewFormula,
    ];

    sheet.appendRow(rowValues);
    var newRow = sheet.getLastRow();

    if (previewFormula !== '-') {
      sheet.setRowHeight(newRow, 96);
    }

    return jsonResponse_({
      status: 'success',
      row: newRow,
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

function getTargetDriveFolder_(preferredId, preferredName) {
  if (preferredId) {
    try {
      return DriveApp.getFolderById(preferredId);
    } catch (idErr) {
      // Fallback ke pencarian / pembuatan folder berdasarkan nama "bukti pembayaran"
    }
  }

  var folderName = preferredName || DRIVE_FOLDER_NAME;
  var folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

function saveProofToDrive_(
  fileData,
  mimeType,
  fileName,
  customerName,
  preferredFolderId,
  preferredFolderName
) {
  var folder = getTargetDriveFolder_(preferredFolderId, preferredFolderName);

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

  return {
    id: file.getId(),
    url: file.getUrl(),
    directImageUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
  };
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
