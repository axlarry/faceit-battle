
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
  
  // Configurație specifică pentru Discord iframe - Updated CSP
  IFRAME_CONFIG: {
    // Headers necesare pentru Discord - Enhanced for CSP
    ALLOWED_ORIGINS: [
      'https://discord.com',
      'https://canary.discord.com',
      'https://ptb.discord.com',
      'https://*.discordsays.com',
      'https://1386122028167331902.discordsays.com'
    ],
    // CSP pentru Discord - Updated pentru iframe + script sources
    CONTENT_SECURITY_POLICY: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co https://static.cloudflareinsights.com;
      connect-src 'self' https://*.supabase.co https://rwizxoeyatdtggrpnpmq.supabase.co;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      frame-ancestors 'self' https://*.discord.com https://discord.com https://*.discordsays.com;
    `.replace(/\s+/g, ' ').trim(),
  }
};

// Validare configurare specifică Discord
export const validateDiscordConfig = () => {
  const missingVars = [];
  
  if (!DISCORD_CONFIG.CLIENT_ID || DISCORD_CONFIG.CLIENT_ID === 'your_discord_client_id_here') {
    missingVars.push('DISCORD_CLIENT_ID');
  }
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing Discord configuration:', missingVars);
    return false;
  }
  
  // Verifică dacă rulează în Discord - Enhanced detection
  const isInDiscord = 
    window.parent !== window ||
    window.location.href.includes('discord.com') ||
    window.location.href.includes('discordsays.com') ||
    document.referrer.includes('discord.com') ||
    window.location.search.includes('frame_id') ||
    window.location.search.includes('instance_id') ||
    // Enhanced Discord detection
    window.location.hostname === 'faceit-toolz.lovable.app' ||
    window.location.hostname.includes('discordsays.com') ||
    navigator.userAgent.includes('Discord') ||
    window.top !== window.self;
  
  if (isInDiscord) {
    console.log('✅ Discord environment detected');
    console.log('🎮 Discord Activity URL:', DISCORD_CONFIG.ACTIVITY_URL);
    console.log('🔒 CSP Headers will be applied for Discord compatibility');
    
    // Force white background for Discord
    document.body.style.backgroundColor = '#0d1117';
    document.documentElement.style.backgroundColor = '#0d1117';
    
    // Ensure proper sizing in Discord iframe
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100vh';
    document.body.style.overflow = 'auto';

    // Add meta CSP tag for Discord
    addDiscordCSPMeta();
  }
  
  return true;
};

// Add CSP meta tag specifically for Discord
const addDiscordCSPMeta = () => {
  // Remove existing CSP meta tags
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    existingCSP.remove();
  }

  // Add Discord-compatible CSP
  const cspMeta = document.createElement('meta');
  cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
  cspMeta.setAttribute('content', DISCORD_CONFIG.IFRAME_CONFIG.CONTENT_SECURITY_POLICY);
  document.head.appendChild(cspMeta);
  
  console.log('🔒 Discord CSP meta tag added');
};

// Initialize Discord-specific styles
export const initDiscordStyles = () => {
  const isInDiscord = 
    window.parent !== window ||
    window.location.href.includes('discord.com') ||
    window.location.href.includes('discordsays.com') ||
    document.referrer.includes('discord.com') ||
    window.location.search.includes('frame_id') ||
    window.location.search.includes('instance_id') ||
    window.location.hostname === 'faceit-toolz.lovable.app' ||
    window.location.hostname.includes('discordsays.com') ||
    navigator.userAgent.includes('Discord') ||
    window.top !== window.self;

  if (isInDiscord) {
    console.log('🎨 Initializing Discord-specific styles');
    
    // Create and inject Discord-specific CSS
    const discordStyles = document.createElement('style');
    discordStyles.innerHTML = `
      html, body {
        background-color: #0d1117 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: auto !important;
      }
      
      #root {
        width: 100% !important;
        height: 100% !important;
        min-height: 100vh !important;
        background-color: #0d1117 !important;
      }
      
      /* Ensure all containers are visible */
      .min-h-screen {
        min-height: 100vh !important;
        background-color: #0d1117 !important;
      }
      
      /* Make sure content is visible */
      * {
        box-sizing: border-box;
      }

      /* Ensure visibility over Discord's dark theme */
      body, #root, .container {
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
      }
    `;
    
    document.head.appendChild(discordStyles);
    
    // Force immediate style application
    document.body.style.setProperty('background-color', '#0d1117', 'important');
    document.documentElement.style.setProperty('background-color', '#0d1117', 'important');
    document.body.style.setProperty('visibility', 'visible', 'important');
    document.body.style.setProperty('opacity', '1', 'important');
  }
};
