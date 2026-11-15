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

  if (
    EXTENSION_PREFIXES.some(
      (prefix) =>
        filename.startsWith(prefix) || stack.includes(prefix) || message.includes(prefix)
    )
  ) {
    return true;
  }

  return (
    message.includes('Failed to connect to MetaMask') ||
    stack.includes('Failed to connect to MetaMask')
  );
}

export function isExtensionErrorValue(value: unknown, filename?: unknown): boolean {
  if (typeof value === 'string') {
    return isBrowserExtensionError({ filename, message: value });
  }
  if (value && typeof value === 'object') {
    const err = value as { message?: unknown; stack?: unknown };
    return isBrowserExtensionError({
      filename,
      message: err.message,
      stack: err.stack,
    });
  }
  return isBrowserExtensionError({ filename });
}

declare global {
  interface Window {
    __dshytExtensionErrorGuardInstalled?: boolean;
  }
}

export function installExtensionErrorGuard(): void {
  if (typeof window === 'undefined') return;
  if (window.__dshytExtensionErrorGuardInstalled) return;
  window.__dshytExtensionErrorGuardInstalled = true;

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isExtensionErrorValue(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      if (isExtensionErrorValue(event.error ?? event.message, event.filename)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (args.some((arg) => isExtensionErrorValue(arg))) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}
