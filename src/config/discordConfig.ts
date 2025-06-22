
export const DISCORD_CONFIG = {
  CLIENT_ID: '1386122028847331902',
  REDIRECT_URI: 'https://faceit-toolz.lovable.app/',
  SCOPES: ['identify', 'guilds'],
  
  // Activity assets
  ASSETS: {
    LARGE_IMAGE: 'faceit_logo',
    LIVE_ICON: 'live_icon',
    STATS_ICON: 'stats_icon',
  },
  
  // Pentru dezvoltare locală
  isDevelopment: import.meta.env.DEV,
  
  // URL-uri pentru Discord Activity
  ACTIVITY_URL: 'https://faceit-toolz.lovable.app',
  
  // Discord CSP compatible configuration
  DISCORD_CSP_CONFIG: {
    // Use Discord-allowed domains only
    ALLOWED_SCRIPT_DOMAINS: [
      'https://discord.com',
      'https://discordapp.com',
      'https://*.discordsays.com'
    ],
    ALLOWED_CONNECT_DOMAINS: [
      'https://discord.com',
      'https://discordapp.com',
      'https://*.discordsays.com',
      'wss://gateway.discord.gg'
    ]
  }
};

// Enhanced Discord environment detection that works with CSP
export const validateDiscordConfig = () => {
  const missingVars = [];
  
  if (!DISCORD_CONFIG.CLIENT_ID || DISCORD_CONFIG.CLIENT_ID === 'your_discord_client_id_here') {
    missingVars.push('DISCORD_CLIENT_ID');
  }
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing Discord configuration:', missingVars);
    return false;
  }
  
  // Enhanced Discord Activity detection
  const isInDiscord = 
    window.parent !== window ||
    window.location.href.includes('discord.com') ||
    window.location.href.includes('discordsays.com') ||
    window.location.href.includes('discordapp.com') ||
    document.referrer.includes('discord.com') ||
    document.referrer.includes('discordapp.com') ||
    window.location.search.includes('frame_id') ||
    window.location.search.includes('instance_id') ||
    window.location.hostname === 'faceit-toolz.lovable.app' ||
    window.location.hostname.includes('discordsays.com') ||
    window.location.hostname.includes('discordapp.com') ||
    navigator.userAgent.includes('Discord') ||
    window.top !== window.self ||
    window.location.search.includes('v=') ||
    window.location.search.includes('channel_id=') ||
    window.location.search.includes('guild_id=');
  
  if (isInDiscord) {
    console.log('✅ Discord Activity environment detected - Working within CSP constraints');
    console.log('🎮 Activity URL:', DISCORD_CONFIG.ACTIVITY_URL);
    
    // Initialize Discord-compatible mode
    initDiscordCompatibleMode();
  }
  
  return true;
};

// Initialize Discord-compatible mode that works with CSP
const initDiscordCompatibleMode = () => {
  console.log('🔧 Initializing Discord-compatible mode');
  
  // Set Discord-friendly styling without violating CSP
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.style.setProperty('background-color', '#0d1117', 'important');
    rootElement.style.setProperty('min-height', '100vh', 'important');
    rootElement.style.setProperty('width', '100%', 'important');
    rootElement.style.setProperty('color', 'white', 'important');
  }
  
  // Force proper iframe sizing
  document.body.style.setProperty('background-color', '#0d1117', 'important');
  document.documentElement.style.setProperty('background-color', '#0d1117', 'important');
  document.body.style.setProperty('margin', '0', 'important');
  document.body.style.setProperty('padding', '0', 'important');
  document.body.style.setProperty('width', '100%', 'important');
  document.body.style.setProperty('height', '100vh', 'important');
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('color', 'white', 'important');

  // Add Discord-compatible error handling
  setupDiscordErrorHandling();
};

// Setup error handling for Discord CSP violations
const setupDiscordErrorHandling = () => {
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

// Initialize Discord Activity specific styles that work with CSP
export const initDiscordStyles = () => {
  const isInDiscord = 
    window.parent !== window ||
    window.location.href.includes('discord.com') ||
    window.location.href.includes('discordsays.com') ||
    window.location.href.includes('discordapp.com') ||
    document.referrer.includes('discord.com') ||
    document.referrer.includes('discordapp.com') ||
    window.location.search.includes('frame_id') ||
    window.location.search.includes('instance_id') ||
    window.location.hostname === 'faceit-toolz.lovable.app' ||
    window.location.hostname.includes('discordsays.com') ||
    window.location.hostname.includes('discordapp.com') ||
    navigator.userAgent.includes('Discord') ||
    window.top !== window.self ||
    window.location.search.includes('v=') ||
    window.location.search.includes('channel_id=') ||
    window.location.search.includes('guild_id=');

  if (isInDiscord) {
    console.log('🎨 Initializing Discord-compatible styles');
    
    // Create and inject Discord Activity specific CSS (inline styles to avoid CSP issues)
    const discordStyles = document.createElement('style');
    discordStyles.setAttribute('type', 'text/css');
    discordStyles.innerHTML = `
      html, body {
        background-color: #0d1117 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: auto !important;
        color: white !important;
      }
      
      #root {
        width: 100% !important;
        height: 100% !important;
        min-height: 100vh !important;
        background-color: #0d1117 !important;
        color: white !important;
      }
      
      .min-h-screen {
        min-height: 100vh !important;
        background-color: #0d1117 !important;
        color: white !important;
      }
      
      * {
        box-sizing: border-box;
        color: inherit;
      }

      body, #root, .container {
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
      }
      
      .text-white {
        color: white !important;
      }
      
      button, input, select, textarea {
        background-color: rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
      }
    `;
    
    document.head.appendChild(discordStyles);
    
    // Apply immediate styles
    setTimeout(() => {
      document.body.style.setProperty('background-color', '#0d1117', 'important');
      document.documentElement.style.setProperty('background-color', '#0d1117', 'important');
      document.body.style.setProperty('color', 'white', 'important');
      
      const root = document.getElementById('root');
      if (root) {
        root.style.setProperty('background-color', '#0d1117', 'important');
        root.style.setProperty('color', 'white', 'important');
      }
    }, 100);
  }
};

// Export utility functions
export { setupDiscordErrorHandling };
