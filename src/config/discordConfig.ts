
export const DISCORD_CONFIG = {
  CLIENT_ID: '1386122028167331902', // Înlocuiește cu ID-ul real
  REDIRECT_URI: import.meta.env.VITE_DISCORD_REDIRECT_URI || '',
  SCOPES: ['identify', 'guilds'],
  
  // Activity assets - acestea vor trebui încărcate în Discord Developer Portal
  ASSETS: {
    LARGE_IMAGE: 'faceit_logo', // 512x512 PNG
    LIVE_ICON: 'live_icon',     // 256x256 PNG  
    STATS_ICON: 'stats_icon',   // 256x256 PNG
  },
  
  // Pentru dezvoltare locală
  isDevelopment: import.meta.env.DEV,
  
  // URL-uri pentru Discord Activity
  ACTIVITY_URL: import.meta.env.VITE_DISCORD_ACTIVITY_URL || 'https://your-app.lovable.app'
};

// Validare configurare
export const validateDiscordConfig = () => {
  const missingVars = [];
  
  if (!DISCORD_CONFIG.CLIENT_ID) {
    missingVars.push('DISCORD_CLIENT_ID');
  }
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing Discord configuration:', missingVars);
    return false;
  }
  
  return true;
};
