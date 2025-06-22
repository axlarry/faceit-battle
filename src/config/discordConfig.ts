
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
  
  // Configurație specifică pentru Discord iframe - MAXIMUM PERMISSIVENESS
  IFRAME_CONFIG: {
    // Headers necesare pentru Discord Activities
    ALLOWED_ORIGINS: [
      '*' // Allow all origins for Discord compatibility
    ],
    // Completely permissive CSP for Discord Activities
    CONTENT_SECURITY_POLICY: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; font-src * data:; media-src * data: blob:; object-src *; child-src *; worker-src * blob: data:; base-uri *; form-action *; frame-ancestors *;",
  }
};

// Enhanced Discord environment detection for Activities with aggressive CSP removal
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
    console.log('✅ Discord Activity environment detected - REMOVING ALL CSP RESTRICTIONS');
    console.log('🎮 Activity URL:', DISCORD_CONFIG.ACTIVITY_URL);
    
    // Aggressively remove ALL CSP restrictions
    removeAllCSPRestrictions();
    
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

    // Set maximally permissive headers for Discord
    setMaximallyPermissiveHeaders();
  }
  
  return true;
};

// Aggressively remove ALL CSP restrictions
const removeAllCSPRestrictions = () => {
  console.log('🔧 AGGRESSIVELY removing ALL CSP restrictions for Discord');
  
  // Remove ALL existing CSP meta tags
  const allCSPTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="content-security-policy"]');
  allCSPTags.forEach(meta => {
    console.log('🗑️ Removing CSP tag:', meta.getAttribute('content'));
    meta.remove();
  });

  // Add maximally permissive CSP
  const permissiveCSP = document.createElement('meta');
  permissiveCSP.setAttribute('http-equiv', 'Content-Security-Policy');
  permissiveCSP.setAttribute('content', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; font-src * data:; media-src * data: blob:; object-src *; child-src *; worker-src * blob: data:; base-uri *; form-action *; frame-ancestors *;");
  document.head.appendChild(permissiveCSP);
  
  console.log('✅ Added maximally permissive CSP for Discord Activity');
};

// Set maximally permissive headers for Discord compatibility
const setMaximallyPermissiveHeaders = () => {
  console.log('🔧 Setting maximally permissive headers for Discord');
  
  // Set very permissive X-Frame-Options
  let frameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
  if (!frameOptionsMeta) {
    frameOptionsMeta = document.createElement('meta');
    frameOptionsMeta.setAttribute('http-equiv', 'X-Frame-Options');
    document.head.appendChild(frameOptionsMeta);
  }
  frameOptionsMeta.setAttribute('content', 'ALLOWALL');
  
  // Set permissive referrer policy
  let referrerMeta = document.querySelector('meta[name="referrer"]');
  if (!referrerMeta) {
    referrerMeta = document.createElement('meta');
    referrerMeta.setAttribute('name', 'referrer');
    document.head.appendChild(referrerMeta);
  }
  referrerMeta.setAttribute('content', 'unsafe-url');
  
  console.log('🔓 Maximally permissive headers set for Discord Activity');
};

// Initialize Discord Activity specific styles with CSP removal
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
    console.log('🎨 Initializing Discord Activity styles - REMOVING ALL CSP RESTRICTIONS');
    
    // Remove ALL CSP restrictions immediately
    removeAllCSPRestrictions();
    
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
    
    // Continuously remove CSP restrictions every 500ms for the first 5 seconds
    let attempts = 0;
    const maxAttempts = 10;
    const removeCSPInterval = setInterval(() => {
      removeAllCSPRestrictions();
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(removeCSPInterval);
        console.log('🏁 Finished aggressive CSP removal attempts');
      }
    }, 500);
  }
};

// Export the CSP removal function for use in other modules
export { removeAllCSPRestrictions };
