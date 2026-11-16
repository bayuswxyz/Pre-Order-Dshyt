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

    // Buat header jika spreadsheet masih kosong
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
          data.fileType || 'image/jpeg',
          data.fileName || 'bukti-qr.jpg',
          data.nama || 'Pelanggan',
          data.driveFolderId || DRIVE_FOLDER_ID,
          data.driveFolderName || DRIVE_FOLDER_NAME
        );
        buktiUrl = savedFile.url;
        previewFormula = '=IMAGE("' + savedFile.directImageUrl + '")';
      } else if (data.buktiPembayaran && String(data.buktiPembayaran).indexOf('http') === 0) {
        buktiUrl = String(data.buktiPembayaran);
        var idMatch = buktiUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        previewFormula = idMatch
          ? '=IMAGE("https://lh3.googleusercontent.com/d/' + idMatch[1] + '")'
          : '-';
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

    // Masukkan data baris baru ke spreadsheet
    sheet.appendRow([
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
    ]);

    var newRow = sheet.getLastRow();
    if (previewFormula !== '-') {
      sheet.setRowHeight(newRow, 96); // Atur tinggi baris agar preview gambar muat
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

function getOrCreateNamedDriveFolder_(preferredName) {
  var folderName = preferredName || DRIVE_FOLDER_NAME;
  var folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

function getTargetDriveFolder_(preferredId, preferredName) {
  if (preferredId) {
    try {
      return DriveApp.getFolderById(preferredId);
    } catch (idErr) {
      // Fallback jika ID gagal dicari
    }
  }

  return getOrCreateNamedDriveFolder_(preferredName);
}

function createFileWithFallback_(blob, preferredFolderId, preferredFolderName) {
  var folder = getTargetDriveFolder_(preferredFolderId, preferredFolderName);
  try {
    return folder.createFile(blob);
  } catch (createErr) {
    // Jika akun tidak punya akses tulis ke folder ID tujuan, fallback ke folder 'bukti pembayaran' di Drive sendiri
    var fallbackFolder = getOrCreateNamedDriveFolder_(preferredFolderName);
    return fallbackFolder.createFile(blob);
  }
}

function saveProofToDrive_(
  fileData,
  mimeType,
  fileName,
  customerName,
  preferredFolderId,
  preferredFolderName
) {
  var rawStr = String(fileData || '').trim();
  var commaIndex = rawStr.indexOf(',');
  var headerMime = '';
  if (commaIndex !== -1) {
    var header = rawStr.slice(0, commaIndex);
    var mimeMatch = /^data:([^;]+);base64$/i.exec(header);
    if (mimeMatch && mimeMatch[1]) {
      headerMime = mimeMatch[1];
    }
  }

  var base64Part = (commaIndex !== -1 ? rawStr.slice(commaIndex + 1) : rawStr).replace(/\s+/g, '');
  var resolvedMime = mimeType && mimeType !== 'application/octet-stream'
    ? mimeType
    : headerMime || 'image/jpeg';

  var bytes = Utilities.base64Decode(base64Part);
  var safeCustomer = String(customerName || 'customer').replace(/[^a-zA-Z0-9_-]/g, '_');
  var timestampTag = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss');
  var finalName = timestampTag + '_' + safeCustomer + '_' + (fileName || 'bukti-qr.jpg');

  var blob = Utilities.newBlob(bytes, resolvedMime, finalName);
  var file = createFileWithFallback_(blob, preferredFolderId, preferredFolderName);

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    // Lanjutkan jika ada batasan akses sharing
  }

  return {
    id: file.getId(),
    url: file.getUrl(),
    directImageUrl: 'https://lh3.googleusercontent.com/d/' + file.getId(),
  };
}

function authorizePermissions() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  var folder = getTargetDriveFolder_(DRIVE_FOLDER_ID, DRIVE_FOLDER_NAME);
  Logger.log('Izin Spreadsheet & Google Drive aktif. Folder: ' + folder.getName());
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}