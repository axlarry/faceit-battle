
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
  
  // Configurație specifică pentru Discord iframe
  IFRAME_CONFIG: {
    // Headers necesare pentru Discord
    ALLOWED_ORIGINS: [
      'https://discord.com',
      'https://canary.discord.com',
      'https://ptb.discord.com'
    ],
    // CSP pentru Discord
    CONTENT_SECURITY_POLICY: "frame-ancestors 'self' https://*.discord.com;",
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
  
  // Verifică dacă rulează în Discord
  const isInDiscord = 
    window.parent !== window ||
    window.location.href.includes('discord.com') ||
    document.referrer.includes('discord.com') ||
    window.location.search.includes('frame_id') ||
    window.location.search.includes('instance_id');
  
  if (isInDiscord) {
    console.log('✅ Discord environment detected');
    console.log('🎮 Discord Activity URL:', DISCORD_CONFIG.ACTIVITY_URL);
  }
  
  return true;
};
