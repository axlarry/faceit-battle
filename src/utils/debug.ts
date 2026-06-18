/**
 * Debug utility — toggle console logging without code changes.
 *
 * Activate via:
 *   - URL param:  ?debug=true
 *   - localStorage: localStorage.setItem('debug', 'true')
 *   - Console:   window.enableDebug() / window.disableDebug()
 *
 * Usage:
 *   debugLog('[Feature]', 'message', data)
 *   debugWarn('[Feature]', 'warning')
 *   debugError('[Feature]', 'error', err)
 */

let debugEnabled = false;

function checkDebug(): void {
  // Check URL param
  if (typeof URLSearchParams !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      debugEnabled = true;
    }
  }
  // Check localStorage
  if (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') {
    debugEnabled = true;
  }
}

// Listen for localStorage changes (cross-tab toggle)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e?.key === 'debug') {
      debugEnabled = e.newValue === 'true';
    }
  });
}

export function isDebugEnabled(): boolean {
  checkDebug();
  return debugEnabled;
}

export function enableDebug(): void {
  debugEnabled = true;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('debug', 'true');
  }
  console.log('%c[DEBUG] Debug ENABLED — console will show debug logs', 'color: orange; font-weight: bold');
}

export function disableDebug(): void {
  debugEnabled = false;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('debug');
  }
  console.log('%c[DEBUG] Debug DISABLED', 'color: gray; font-weight: bold');
}

// Expose on window for console access
if (typeof window !== 'undefined') {
  (window as any).enableDebug = enableDebug;
  (window as any).disableDebug = disableDebug;
  (window as any).isDebugEnabled = isDebugEnabled;
}

/** Log only when debug is enabled. Usage: debugLog('[Feature]', 'msg', data) */
export function debugLog(...args: unknown[]): void {
  if (!isDebugEnabled()) return;
  console.log('[DEBUG]', ...args);
}

/** Warn only when debug is enabled */
export function debugWarn(...args: unknown[]): void {
  if (!isDebugEnabled()) return;
  console.warn('[DEBUG]', ...args);
}

/** Error only when debug is enabled */
export function debugError(...args: unknown[]): void {
  if (!isDebugEnabled()) return;
  console.error('[DEBUG]', ...args);
}
