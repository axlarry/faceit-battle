/**
 * Discord Activity Proxy Helper
 * 
 * Discord Activities have strict CSP that blocks external connections.
 * We need to use URL mappings configured in Discord Developer Portal
 * and route requests through Discord's proxy at /.proxy/
 * 
 * URL Mapping required in Discord Developer Portal:
 * Prefix: /supabase -> Target: https://rwizxoeyatdtggrpnpmq.supabase.co
 */

const SUPABASE_URL = "https://rwizxoeyatdtggrpnpmq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aXp4b2V5YXRkdGdncnBucG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2OTkwOTYsImV4cCI6MjA2NDI3NTA5Nn0.6Rpmb1a2iFqw2VZaHl-k-3otQlQuDpaxUPf28uOlLRU";

// Cache the detection result
let _isDiscordActivity: boolean | null = null;

/**
 * Detect if running inside Discord Activity iframe
 */
export const isDiscordActivity = (): boolean => {
  if (_isDiscordActivity !== null) return _isDiscordActivity;
  
  if (typeof window === 'undefined') {
    _isDiscordActivity = false;
    return false;
  }
  
  // Check if we're on Discord's domain
  const isDiscordDomain = window.location.hostname.endsWith('.discordsays.com') ||
                          window.location.hostname.endsWith('.discord.com');
  
  // Check for Discord-specific indicators in iframe
  const isInIframe = window.self !== window.top;
  
  // Check for Discord referrer
  const hasDiscordReferrer = document.referrer.includes('discord.com');
  
  _isDiscordActivity = isDiscordDomain || (isInIframe && hasDiscordReferrer);
  return _isDiscordActivity;
};

/**
 * Get the base URL for Supabase requests
 * Uses Discord proxy when running as Discord Activity
 */
export const getSupabaseBaseUrl = (): string => {
  if (isDiscordActivity()) {
    // Use Discord's proxy path (configured in Developer Portal)
    return '/.proxy/supabase';
  }
  return SUPABASE_URL;
};

/**
 * Invoke a Supabase Edge Function with Discord proxy support
 */
export const invokeEdgeFunction = async (
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: unknown; error: Error | null }> => {
  const baseUrl = getSupabaseBaseUrl();
  const url = `${baseUrl}/functions/v1/${functionName}`;
  
  try {
    console.log(`🎮 Discord proxy: Calling ${functionName} via ${isDiscordActivity() ? 'proxy' : 'direct'}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Edge function ${functionName} error:`, response.status, errorText);
      return {
        data: null,
        error: new Error(`${response.status}: ${errorText}`),
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error(`Edge function ${functionName} fetch error:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// Log environment on load
if (typeof window !== 'undefined') {
  // Defer logging to avoid blocking
  setTimeout(() => {
    console.log('🎮 Discord Activity detected:', isDiscordActivity());
    if (isDiscordActivity()) {
      console.log('🔗 Using Discord proxy for Supabase calls');
    }
  }, 100);
}
