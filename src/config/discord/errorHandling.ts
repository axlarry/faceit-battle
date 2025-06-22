
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
      console.log('📡 Supabase request blocked - app will handle via Edge Functions');
    }
    
    if (e.blockedURI.includes('gpteng.co')) {
      console.log('🔧 GPTEng script blocked - this is expected in Discord');
    }

    if (e.blockedURI.includes('cloudflareinsights.com')) {
      console.log('📊 Cloudflare Insights blocked - analytics disabled in Discord');
    }

    // Prevent CSP violations from breaking the app
    e.preventDefault();
  });

  // Handle network errors for blocked requests
  window.addEventListener('error', (e) => {
    if (e.message && (e.message.includes('CSP') || 
                     e.message.includes('Content Security Policy') ||
                     e.message.includes('blocked'))) {
      console.warn('🔒 CSP-related error handled:', e.message);
      e.preventDefault();
      return false;
    }
  });

  // Handle unhandled promise rejections from blocked network requests
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message && 
        (e.reason.message.includes('CSP') || 
         e.reason.message.includes('Content Security Policy') ||
         e.reason.message.includes('blocked') ||
         e.reason.message.includes('NetworkError') ||
         e.reason.message.includes('Failed to fetch'))) {
      console.warn('🔒 CSP-related promise rejection handled:', e.reason.message);
      e.preventDefault();
    }
  });

  console.log('✅ Discord error handling setup complete');
};
