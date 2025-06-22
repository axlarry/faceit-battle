
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
  
  // URL-uri pentru Discord Activity - FOARTE IMPORTANT!
  ACTIVITY_URL: 'https://faceit-toolz.lovable.app',
  
  // Configurație specifică pentru Discord iframe - NO CSP RESTRICTIONS
  IFRAME_CONFIG: {
    // Headers necesare pentru Discord Activities
    ALLOWED_ORIGINS: [
      '*' // Allow all origins for Discord compatibility
    ],
    // No CSP restrictions for Discord Activities
    CONTENT_SECURITY_POLICY: null,
  }
};

// Enhanced Discord environment detection for Activities
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
    // Additional Activity-specific detection
    window.location.search.includes('v=') ||
    window.location.search.includes('channel_id=') ||
    window.location.search.includes('guild_id=');
  
  if (isInDiscord) {
    console.log('✅ Discord Activity environment detected - NO CSP RESTRICTIONS');
    console.log('🎮 Activity URL:', DISCORD_CONFIG.ACTIVITY_URL);
    
    // Remove any existing CSP meta tags that might interfere
    const existingCSP = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    existingCSP.forEach(meta => meta.remove());
    
    // More aggressive styling for Discord Activities
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.setProperty('background-color', '#0d1117', 'important');
      rootElement.style.setProperty('min-height', '100vh', 'important');
      rootElement.style.setProperty('width', '100%', 'important');
    }
    
    // Force proper iframe sizing
    document.body.style.setProperty('background-color', '#0d1117', 'important');
    document.documentElement.style.setProperty('background-color', '#0d1117', 'important');
    document.body.style.setProperty('margin', '0', 'important');
    document.body.style.setProperty('padding', '0', 'important');
    document.body.style.setProperty('width', '100%', 'important');
    document.body.style.setProperty('height', '100vh', 'important');
    document.body.style.setProperty('overflow', 'auto', 'important');

    // Set permissive headers for Discord
    setDiscordHeaders();
  }
  
  return true;
};

// Set permissive headers for Discord compatibility
const setDiscordHeaders = () => {
  console.log('🔧 Setting permissive headers for Discord');
  
  // Remove any restrictive CSP
  const existingCSP = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
  existingCSP.forEach(meta => {
    console.log('🗑️ Removing restrictive CSP:', meta.getAttribute('content'));
    meta.remove();
  });

  // Add very permissive X-Frame-Options
  let frameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
  if (!frameOptionsMeta) {
    frameOptionsMeta = document.createElement('meta');
    frameOptionsMeta.setAttribute('http-equiv', 'X-Frame-Options');
    document.head.appendChild(frameOptionsMeta);
  }
  frameOptionsMeta.setAttribute('content', 'ALLOWALL');
  
  console.log('🔓 Permissive headers set for Discord Activity');
};

// Initialize Discord Activity specific styles
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
    console.log('🎨 Initializing Discord Activity styles - NO CSP RESTRICTIONS');
    
    // Create and inject Discord Activity specific CSS
    const discordStyles = document.createElement('style');
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
      
      /* Ensure all containers are visible in Discord */
      .min-h-screen {
        min-height: 100vh !important;
        background-color: #0d1117 !important;
        color: white !important;
      }
      
      /* Make sure content is visible */
      * {
        box-sizing: border-box;
        color: inherit;
      }

      /* Force visibility over Discord's theme */
      body, #root, .container {
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
      }
      
      /* Discord Activity specific overrides */
      .text-white {
        color: white !important;
      }
      
      /* Ensure buttons and interactive elements are visible */
      button, input, select, textarea {
        background-color: rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
      }
    `;
    
    document.head.appendChild(discordStyles);
    
    // Additional immediate style forcing
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
