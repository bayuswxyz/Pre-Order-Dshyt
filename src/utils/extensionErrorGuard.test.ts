import test from 'node:test';
import assert from 'node:assert/strict';
import { isBrowserExtensionError } from './extensionErrorGuard';

test('isBrowserExtensionError detects Chrome extension and MetaMask inpage errors', () => {
  assert.equal(
    isBrowserExtensionError({
      message: 'Failed to connect to MetaMask',
      stack:
        'i: Failed to connect to MetaMask\n    at Object.connect (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js:9:6166)',
    }),
    true
  );

  assert.equal(
    isBrowserExtensionError({
      filename: 'chrome-extension://abcdef/content.js',
      message: 'Extension context invalidated',
    }),
    true
  );
});

test('isBrowserExtensionError never swallows real application errors', () => {
  assert.equal(
    isBrowserExtensionError({
      filename: 'https://example.com/assets/index.js',
      message: 'Cannot read properties of undefined',
      stack: 'TypeError: Cannot read properties of undefined\n    at App (src/App.tsx:42:10)',
    }),
    false
  );
});
