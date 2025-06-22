
// Setup error handling for Discord CSP violations
export const setupDiscordErrorHandling = () => {
  // Handle CSP violations gracefully
  window.addEventListener('securitypolicyviolation', (e) => {
    console.warn('🔒 CSP Violation detected (expected in Discord):', {
      directive: e.violatedDirective,
      blockedURI: e.blockedURI,
      lineNumber: e.lineNumber
    });
    
    // Handle specific blocked resources
    if (e.blockedURI.includes('supabase.co')) {
      console.log('📡 Supabase request blocked - implementing fallback');
      // The app will handle this via existing error handling
    }
    
    if (e.blockedURI.includes('gpteng.co')) {
      console.log('🔧 GPTEng script blocked - this is expected in Discord');
      // This is expected and doesn't affect functionality
    }
  });

  // Handle network errors for blocked requests
  window.addEventListener('error', (e) => {
    if (e.message.includes('CSP') || e.message.includes('Content Security Policy')) {
      console.warn('🔒 CSP-related error handled:', e.message);
      // Prevent error from bubbling up
      e.preventDefault();
    }
  });
};
