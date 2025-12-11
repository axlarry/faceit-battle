/**
 * Discord Activity Proxy Helper
 * 
 * Discord Activities have strict CSP that blocks external connections.
 * All external requests MUST go through Discord's proxy at /.proxy/
 * 
 * URL Mappings required in Discord Developer Portal → Activities → URL Mappings:
 * 
 * PREFIX          | TARGET
 * /supabase       | https://rwizxoeyatdtggrpnpmq.supabase.co
 * /lacurte        | https://faceit.lacurte.ro
 * 
 * In Discord, requests to /.proxy/supabase/* will be forwarded to the target.
 * The /.proxy/ prefix is REQUIRED by Discord's CSP.
 */

const SUPABASE_URL = "https://rwizxoeyatdtggrpnpmq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aXp4b2V5YXRkdGdncnBucG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2OTkwOTYsImV4cCI6MjA2NDI3NTA5Nn0.6Rpmb1a2iFqw2VZaHl-k-3otQlQuDpaxUPf28uOlLRU";

const LACURTE_URL = "https://faceit.lacurte.ro";

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
  
  // Check if we're on Discord's domain (*.discordsays.com for activities)
  const hostname = window.location.hostname;
  const isDiscordDomain = hostname.endsWith('.discordsays.com') ||
                          hostname.includes('discordsays.com');
  
  // Log for debugging
  console.log('🎮 Discord Activity Check:', {
    hostname,
    isDiscordDomain,
    href: window.location.href
  });
  
  _isDiscordActivity = isDiscordDomain;
  return _isDiscordActivity;
};

/**
 * Get the base URL for Supabase requests
 * Uses Discord proxy when running as Discord Activity
 */
export const getSupabaseBaseUrl = (): string => {
  if (isDiscordActivity()) {
    return '/.proxy/supabase';
  }
  return SUPABASE_URL;
};

/**
 * Get the base URL for faceit.lacurte.ro requests
 * Uses Discord proxy when running as Discord Activity
 */
export const getLacurteBaseUrl = (): string => {
  if (isDiscordActivity()) {
    return '/.proxy/lacurte';
  }
  return LACURTE_URL;
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
  
  const isDiscord = isDiscordActivity();
  
  console.log(`🎮 Discord proxy: Calling ${functionName}`, {
    isDiscord,
    baseUrl,
    fullUrl: url
  });
  
  try {
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
      console.error(`❌ Edge function ${functionName} error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url
      });
      return {
        data: null,
        error: new Error(`${response.status}: ${errorText}`),
      };
    }

    const data = await response.json();
    console.log(`✅ Edge function ${functionName} success`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ Edge function ${functionName} fetch error:`, {
      error,
      url,
      isDiscord
    });
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Get anon key for direct usage
 */
export const getSupabaseAnonKey = (): string => SUPABASE_ANON_KEY;

// Log environment on load
if (typeof window !== 'undefined') {
  // Defer logging to avoid blocking
  setTimeout(() => {
    const isDiscord = isDiscordActivity();
    console.log('🎮 Discord Activity Environment:', {
      detected: isDiscord,
      hostname: window.location.hostname,
      proxyUrl: isDiscord ? getSupabaseBaseUrl() : 'N/A (direct)',
    });
  }, 100);
}
