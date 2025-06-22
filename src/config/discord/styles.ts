
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
