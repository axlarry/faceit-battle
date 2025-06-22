
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
  
  // Configurație specifică pentru Discord iframe - Updated for Activities
  IFRAME_CONFIG: {
    // Headers necesare pentru Discord Activities
    ALLOWED_ORIGINS: [
      'https://discord.com',
      'https://canary.discord.com',
      'https://ptb.discord.com',
      'https://*.discordsays.com',
      'https://1386122028167331902.discordsays.com',
      // Discord Activity specific origins
      'https://discordapp.com',
      'https://*.discordapp.com'
    ],
    // CSP pentru Discord Activities - More permissive for Activities
    CONTENT_SECURITY_POLICY: `
      default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co https://static.cloudflareinsights.com https: data: blob:;
      connect-src 'self' https://*.supabase.co https://rwizxoeyatdtggrpnpmq.supabase.co https: wss: data: blob:;
      style-src 'self' 'unsafe-inline' https: data: blob:;
      img-src 'self' data: https: blob:;
      font-src 'self' data: https: blob:;
      frame-src 'self' https: data: blob:;
      frame-ancestors 'self' https://*.discord.com https://discord.com https://*.discordsays.com https://discordapp.com https://*.discordapp.com;
      object-src 'none';
      base-uri 'self';
    `.replace(/\s+/g, ' ').trim(),
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
    console.log('✅ Discord Activity environment detected');
    console.log('🎮 Activity URL:', DISCORD_CONFIG.ACTIVITY_URL);
    
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

    // Add Discord Activity specific meta tags
    addDiscordActivityMeta();
  }
  
  return true;
};

// Add Discord Activity specific meta tags
const addDiscordActivityMeta = () => {
  console.log('🔧 Adding Discord Activity meta tags');
  
  // Remove existing CSP and add Activity-friendly one
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    existingCSP.remove();
  }

  // Add Activity-friendly CSP
  const cspMeta = document.createElement('meta');
  cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
  cspMeta.setAttribute('content', DISCORD_CONFIG.IFRAME_CONFIG.CONTENT_SECURITY_POLICY);
  document.head.appendChild(cspMeta);
  
  // Add X-Frame-Options to allow Discord framing
  const frameOptionsMeta = document.createElement('meta');
  frameOptionsMeta.setAttribute('http-equiv', 'X-Frame-Options');
  frameOptionsMeta.setAttribute('content', 'ALLOWALL');
  document.head.appendChild(frameOptionsMeta);
  
  console.log('🔒 Discord Activity meta tags added');
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
    console.log('🎨 Initializing Discord Activity styles');
    
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
