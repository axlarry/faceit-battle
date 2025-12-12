import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Allowed image domains for security
const ALLOWED_DOMAINS = [
  'distribution.faceit-cdn.net',
  'assets.faceit-cdn.net',
  'cdn.faceit.com',
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the image URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Security check: only allow whitelisted domains
    const isAllowed = ALLOWED_DOMAINS.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain));
    if (!isAllowed) {
      console.log(`[proxy-image] Blocked request for non-allowed domain: ${parsedUrl.hostname}`);
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[proxy-image] Fetching: ${imageUrl}`);

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.log(`[proxy-image] Failed to fetch image: ${response.status}`);
      return new Response(JSON.stringify({ error: 'Failed to fetch image', status: response.status }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the image data
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`[proxy-image] Successfully fetched image, type: ${contentType}, size: ${imageData.byteLength}`);

    // Return the image with appropriate headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('[proxy-image] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
