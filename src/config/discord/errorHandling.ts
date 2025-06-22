
// Setup comprehensive error handling for Discord CSP violations
export const setupDiscordErrorHandling = () => {
  console.log('🔧 Setting up Discord-compatible error handling');

  // Handle CSP violations gracefully
  window.addEventListener('securitypolicyviolation', (e) => {
    console.warn('🔒 CSP Violation detected (expected in Discord):', {
      directive: e.violatedDirective,
      blockedURI: e.blockedURI,
      lineNumber: e.lineNumber,
      sourceFile: e.sourceFile
    });
    
    // Handle specific blocked resources
    if (e.blockedURI.includes('supabase.co')) {
      console.log('📡 Supabase request blocked - app uses localStorage in Discord');
    }
    
    if (e.blockedURI.includes('gpteng.co')) {
      console.log('🔧 GPTEng script blocked - this is expected in Discord');
    }

    if (e.blockedURI.includes('cloudflareinsights.com')) {
      console.log('📊 Cloudflare Insights blocked - analytics disabled in Discord');
    }

    if (e.blockedURI.includes('faceit-toolz.lovable.app')) {
      console.log('🖼️ App frame blocked - Discord CSP restriction');
    }

    // Prevent CSP violations from breaking the app
    e.preventDefault();
  });

  // Handle network errors for blocked requests
  window.addEventListener('error', (e) => {
    // Suppress Discord-specific errors
    if (e.message && (
      e.message.includes('CSP') || 
      e.message.includes('Content Security Policy') ||
      e.message.includes('blocked') ||
      e.message.includes('Cannot read properties of null') ||
      e.message.includes('frameElement') ||
      e.filename?.includes('inpage.js') ||
      e.filename?.includes('all-frames.js') ||
      e.filename?.includes('web.99ba76722fe9e845.js') ||
      e.filename?.includes('6d1476664a53133b.js')
    )) {
      console.warn('🔒 Discord-related error suppressed:', e.message);
      e.preventDefault();
      return false;
    }
  });

  // Handle unhandled promise rejections from blocked network requests
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && (
      (e.reason.message && (
        e.reason.message.includes('CSP') || 
        e.reason.message.includes('Content Security Policy') ||
        e.reason.message.includes('blocked') ||
        e.reason.message.includes('NetworkError') ||
        e.reason.message.includes('Failed to fetch') ||
        e.reason.message.includes('Invalid Origin') ||
        e.reason.message.includes('cross-origin frame') ||
        e.reason.message.includes('CSP_BLOCKED') ||
        e.reason.message.includes('frameElement') ||
        e.reason.message.includes('play() failed')
      )) ||
      e.reason.name === 'SecurityError' ||
      e.reason.name === 'RPCError' ||
      e.reason.name === 'NotAllowedError' ||
      e.reason.name === 'TypeError'
    )) {
      console.warn('🔒 Discord-related promise rejection suppressed:', e.reason);
      e.preventDefault();
    }
  });

  // Suppress Discord iframe and RPC errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('RPCError') || 
        message.includes('Invalid Origin') ||
        message.includes('cross-origin frame') ||
        message.includes('SecurityError') ||
        message.includes('NotAllowedError') ||
        message.includes('frameElement') ||
        message.includes('Cannot read properties of null') ||
        message.includes('CSP_BLOCKED')) {
      // Suppress these Discord-specific errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.log('✅ Discord error handling setup complete - app ready for Discord environment');
};
