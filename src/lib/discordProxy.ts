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

// Faceit CDN domains that need proxying in Discord
const FACEIT_CDN_DOMAINS = [
  'distribution.faceit-cdn.net',
  'assets.faceit-cdn.net'
];

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
  
  const hostname = window.location.hostname;
  _isDiscordActivity = hostname.endsWith('.discordsays.com') || hostname.includes('discordsays.com');
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

    const rawText = await response.text();

    // Check if it's HTML (Discord error page) instead of JSON
    if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html')) {
      return {
        data: null,
        error: new Error('Discord proxy returned HTML instead of JSON. Check URL mapping.'),
      };
    }

    if (!response.ok) {
      return {
        data: null,
        error: new Error(`${response.status}: ${rawText}`),
      };
    }

    const data = JSON.parse(rawText);
    return { data, error: null };
  } catch (error) {
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

/**
 * Proxy image URLs for Discord Activity
 * Discord's CSP blocks external images from faceit-cdn.net
 * We proxy them through our Supabase edge function
 */
export const getProxiedImageUrl = (imageUrl: string): string => {
  if (!imageUrl || !isDiscordActivity()) {
    return imageUrl;
  }
  
  // Check if this is a Faceit CDN URL that needs proxying
  const needsProxy = FACEIT_CDN_DOMAINS.some(domain => imageUrl.includes(domain));
  
  if (!needsProxy) {
    return imageUrl;
  }
  
  // Proxy through Supabase edge function via Discord proxy
  // Format: /.proxy/supabase/functions/v1/proxy-image?url=<encoded_url>
  const encodedUrl = encodeURIComponent(imageUrl);
  return `/.proxy/supabase/functions/v1/proxy-image?url=${encodedUrl}`;
};

// Backward compatibility alias
export const getProxiedAvatarUrl = getProxiedImageUrl;

