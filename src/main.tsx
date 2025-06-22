
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add debugging for environment
console.log('🚀 App starting...');
console.log('📍 Location:', window.location.href);

createRoot(document.getElementById("root")!).render(<App />);
