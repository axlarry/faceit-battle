
import { DISCORD_CONFIG } from './constants';
import { setupDiscordErrorHandling } from './errorHandling';

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

  // Add Discord-compatible error handling using ES6 import
  setupDiscordErrorHandling();
};
