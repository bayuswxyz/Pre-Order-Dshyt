const EXTENSION_PREFIXES = [
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
];

export function isBrowserExtensionError(details: {
  filename?: unknown;
  message?: unknown;
  stack?: unknown;
}): boolean {
  const filename = typeof details.filename === 'string' ? details.filename : '';
  const stack = typeof details.stack === 'string' ? details.stack : '';
  const message = typeof details.message === 'string' ? details.message : '';

  if (EXTENSION_PREFIXES.some((prefix) => filename.startsWith(prefix) || stack.includes(prefix))) {
    return true;
  }

  return message.includes('Failed to connect to MetaMask');
}

export function installExtensionErrorGuard(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason as { message?: unknown; stack?: unknown } | string | undefined;
      const message = typeof reason === 'string' ? reason : reason?.message;
      const stack = typeof reason === 'object' && reason !== null ? reason.stack : undefined;

      if (isBrowserExtensionError({ message, stack })) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      const err = event.error as { message?: unknown; stack?: unknown } | undefined;
      if (
        isBrowserExtensionError({
          filename: event.filename,
          message: event.message ?? err?.message,
          stack: err?.stack,
        })
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}
