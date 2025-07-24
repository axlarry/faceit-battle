import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Test FaceitAnalyser API
import './test-faceit-analyser';

createRoot(document.getElementById("root")!).render(<App />);
