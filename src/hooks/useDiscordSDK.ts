
import { useState, useEffect } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';

interface DiscordAuth {
  access_token: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    global_name?: string;
    public_flags?: number;
  } | null;
}

export const useDiscordSDK = () => {
  const [discordSdk, setDiscordSdk] = useState<DiscordSDK | null>(null);
  const [auth, setAuth] = useState<DiscordAuth | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInDiscord, setIsInDiscord] = useState(false);

  useEffect(() => {
    const initializeDiscord = async () => {
      try {
        console.log('🎮 Initializing Discord SDK...');
        
        // Verificare îmbunătățită pentru mediul Discord
        const isDiscordEnvironment = 
          window.location.href.includes('discord.com') || 
          window.parent !== window ||
          document.referrer.includes('discord.com') ||
          window.location.hostname.includes('discord.com') ||
          window.location.search.includes('frame_id') ||
          window.location.search.includes('instance_id') ||
          // Verificare pentru iframe Discord
          (window.frameElement && window.frameElement.getAttribute('src')?.includes('discord.com')) ||
          // Verificare pentru user agent Discord
          navigator.userAgent.includes('Discord');

        console.log('🔍 Discord environment check:', {
          isDiscordEnvironment,
          hostname: window.location.hostname,
          referrer: document.referrer,
          search: window.location.search,
          userAgent: navigator.userAgent,
          isIframe: window.parent !== window,
          hasFrameId: window.location.search.includes('frame_id'),
          hasInstanceId: window.location.search.includes('instance_id')
        });

        setIsInDiscord(isDiscordEnvironment);

        if (!isDiscordEnvironment) {
          console.log('🔍 Not running in Discord environment, skipping SDK initialization');
          setIsReady(true);
          return;
        }

        // Folosește configurația din discordConfig
        const { DISCORD_CONFIG } = await import('@/config/discordConfig');
        const clientId = DISCORD_CONFIG.CLIENT_ID;
        
        if (!clientId || clientId === 'your_discord_client_id_here') {
          throw new Error('Discord Client ID not configured properly');
        }

        console.log('🔧 Initializing Discord SDK with Client ID:', clientId);
        const sdk = new DiscordSDK(clientId);
        
        await sdk.ready();
        console.log('✅ Discord SDK ready');
        
        // Authenticate with Discord if needed
        try {
          const authResponse = await sdk.commands.authenticate({
            access_token: undefined
          });
          
          if (authResponse) {
            // Map the Discord response to our interface
            const mappedAuth: DiscordAuth = {
              access_token: authResponse.access_token,
              user: authResponse.user ? {
                id: authResponse.user.id,
                username: authResponse.user.username,
                discriminator: authResponse.user.discriminator,
                avatar: authResponse.user.avatar || undefined,
                global_name: authResponse.user.global_name || undefined,
                public_flags: authResponse.user.public_flags || undefined,
              } : null
            };
            
            setAuth(mappedAuth);
            console.log('🔐 Discord authentication successful:', authResponse.user?.username);
          }
        } catch (authError) {
          console.warn('⚠️ Discord authentication failed:', authError);
          // Continue without auth - app can still work
        }

        setDiscordSdk(sdk);
        setIsReady(true);
        
      } catch (err) {
        console.error('❌ Discord SDK initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsReady(true); // Allow app to continue without Discord
      }
    };

    initializeDiscord();
  }, []);

  const updateActivity = async (activity: {
    state?: string;
    details?: string;
    timestamps?: {
      start?: number;
      end?: number;
    };
    assets?: {
      large_image?: string;
      large_text?: string;
      small_image?: string;
      small_text?: string;
    };
  }) => {
    if (!discordSdk || !isInDiscord) {
      console.log('💭 Skipping activity update - not in Discord or SDK not ready');
      return;
    }

    try {
      await discordSdk.commands.setActivity({
        activity: activity
      });
      console.log('🎯 Discord activity updated:', activity);
    } catch (err) {
      console.warn('⚠️ Failed to update Discord activity:', err);
    }
  };

  return {
    discordSdk,
    auth,
    isReady,
    error,
    isInDiscord,
    updateActivity
  };
};
