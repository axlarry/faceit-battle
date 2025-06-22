
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initDiscordStyles, validateDiscordConfig } from './config/discordConfig'

// Initialize Discord-specific configurations
initDiscordStyles();
validateDiscordConfig();

// Add debugging for Discord environment
console.log('🚀 App starting...');
console.log('📍 Location:', window.location.href);
console.log('🔍 Referrer:', document.referrer);
console.log('🖼️ In iframe:', window.parent !== window);
console.log('👤 User agent:', navigator.userAgent);

createRoot(document.getElementById("root")!).render(<App />);
