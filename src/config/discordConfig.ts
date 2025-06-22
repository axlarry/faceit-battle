
export const DISCORD_CONFIG = {
  CLIENT_ID: '1386122028847331902', // ID-ul corect din screenshot
  REDIRECT_URI: 'https://faceit-toolz.lovable.app/',
  SCOPES: ['identify', 'guilds'],
  
  // Activity assets - acestea trebuie să corespundă cu numele din Discord Developer Portal
  ASSETS: {
    LARGE_IMAGE: 'faceit_logo', // 512x512 PNG
    LIVE_ICON: 'live_icon',     // 256x256 PNG  
    STATS_ICON: 'stats_icon',   // 256x256 PNG
  },
  
  // Pentru dezvoltare locală
  isDevelopment: import.meta.env.DEV,
  
  // URL-uri pentru Discord Activity
  ACTIVITY_URL: 'https://faceit-toolz.lovable.app'
};

// Validare configurare
export const validateDiscordConfig = () => {
  const missingVars = [];
  
  if (!DISCORD_CONFIG.CLIENT_ID || DISCORD_CONFIG.CLIENT_ID === 'your_discord_client_id_here') {
    missingVars.push('DISCORD_CLIENT_ID');
  }
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing Discord configuration:', missingVars);
    return false;
  }
  
  return true;
};
