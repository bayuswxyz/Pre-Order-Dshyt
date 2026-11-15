import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDriveListQuery,
  buildDriveListUrl,
  buildDriveMultipartBody,
  deleteDriveFile,
  DRIVE_SCOPES,
  DriveUnauthorizedError,
  listDriveFiles,
  PAYMENT_PROOF_DRIVE_FOLDER_ID,
  renameDriveFile,
} from './googleDrive';

test('DRIVE_SCOPES includes all requested Google Drive OAuth scopes', () => {
  assert.equal(DRIVE_SCOPES.length, 13);
  assert.ok(DRIVE_SCOPES.includes('https://www.googleapis.com/auth/drive'));
  assert.ok(DRIVE_SCOPES.includes('https://www.googleapis.com/auth/drive.file'));
  assert.ok(DRIVE_SCOPES.includes('https://www.googleapis.com/auth/drive.readonly'));
  assert.ok(DRIVE_SCOPES.includes('https://www.googleapis.com/auth/drive.scripts'));
});

test('buildDriveListQuery scopes to payment proof folder and escapes search terms', () => {
  const folderQuery = buildDriveListQuery('folder', '');
  assert.equal(
    folderQuery,
    `trashed = false and '${PAYMENT_PROOF_DRIVE_FOLDER_ID}' in parents`
  );

  const searchQuery = buildDriveListQuery('all', "Budi's QR");
  assert.equal(searchQuery, "trashed = false and name contains 'Budi\\'s QR'");

  const url = buildDriveListUrl({ scope: 'folder', searchQuery: 'bukti' });
  assert.match(url, /^https:\/\/www\.googleapis\.com\/drive\/v3\/files\?/);
  assert.match(url, /supportsAllDrives=true/);
});

test('buildDriveMultipartBody creates multipart/related payload with parent folder metadata', async () => {
  const bytes = new TextEncoder().encode('hello-image');
  const { body, contentType } = buildDriveMultipartBody({
    fileName: 'bukti-qris.png',
    mimeType: 'image/png',
    contentBytes: bytes,
    folderId: PAYMENT_PROOF_DRIVE_FOLDER_ID,
    boundary: 'test_boundary',
  });

  assert.equal(contentType, 'multipart/related; boundary=test_boundary');
  const text = await body.text();
  assert.match(text, /"name":"bukti-qris\.png"/);
  assert.match(text, new RegExp(`"parents":\\["${PAYMENT_PROOF_DRIVE_FOLDER_ID}"\\]`));
  assert.match(text, /Content-Type: image\/png/);
  assert.match(text, /hello-image/);
});

test('listDriveFiles, renameDriveFile, and deleteDriveFile handle responses and 401 cleanly', async () => {
  const files = await listDriveFiles(
    'token-123',
    { scope: 'folder' },
    async (input, init) => {
      assert.match(String(input), /googleapis\.com\/drive\/v3\/files/);
      assert.equal(
        (init?.headers as Record<string, string>)?.Authorization,
        'Bearer token-123'
      );
      return new Response(
        JSON.stringify({
          files: [{ id: 'file-1', name: 'bukti.jpg', mimeType: 'image/jpeg' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  );
  assert.equal(files.length, 1);
  assert.equal(files[0].id, 'file-1');

  await assert.rejects(
    () =>
      listDriveFiles(
        'expired',
        { scope: 'folder' },
        async () => new Response(JSON.stringify({ error: { message: 'Invalid Credentials' } }), { status: 401 })
      ),
    DriveUnauthorizedError
  );

  await assert.rejects(
    () => renameDriveFile('token-123', 'file-1', '   '),
    /Nama file baru tidak boleh kosong/
  );

  const renamed = await renameDriveFile('token-123', 'file-1', 'bukti-baru.jpg', async (input, init) => {
    assert.equal(init?.method, 'PATCH');
    assert.match(String(input), /files\/file-1\?/);
    return new Response(
      JSON.stringify({ id: 'file-1', name: 'bukti-baru.jpg', mimeType: 'image/jpeg' }),
      { status: 200 }
    );
  });
  assert.equal(renamed.name, 'bukti-baru.jpg');

  await deleteDriveFile('token-123', 'file-1', async (input, init) => {
    assert.equal(init?.method, 'DELETE');
    assert.match(String(input), /files\/file-1\?/);
    return new Response(null, { status: 204 });
  });
});
