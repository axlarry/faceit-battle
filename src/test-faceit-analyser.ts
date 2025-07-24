// Test file to verify FaceitAnalyser API is working
import { faceitAnalyserApiClient } from './services/faceitAnalyserApiClient';

// Test with the player ID you mentioned (2uzeta) 
const testPlayerId = 'a3f8a844-34e4-46ed-833e-576ed5c5001b'; // 2uzeta player ID

export const testFaceitAnalyserApi = async () => {
  console.log('🧪 Testing FaceitAnalyser API...');
  
  try {
    console.log('Testing player stats...');
    const stats = await faceitAnalyserApiClient.getPlayerStats(testPlayerId);
    console.log('✅ Stats result:', stats);
    
    console.log('Testing player matches...');
    const matches = await faceitAnalyserApiClient.getPlayerMatches(testPlayerId);
    console.log('✅ Matches result:', matches);
    
    console.log('Testing player overview...');
    const overview = await faceitAnalyserApiClient.getPlayerOverview(testPlayerId);
    console.log('✅ Overview result:', overview);
    
  } catch (error) {
    console.error('❌ FaceitAnalyser API test failed:', error);
  }
};

// Auto-run test
if (typeof window !== 'undefined') {
  // Run in browser
  setTimeout(() => {
    testFaceitAnalyserApi();
  }, 1000);
}