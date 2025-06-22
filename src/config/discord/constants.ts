
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
