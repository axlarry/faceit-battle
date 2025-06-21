
import { useState, useEffect } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';

interface DiscordAuth {
  access_token: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name: string | null;
  } | null;
}

export const useDiscordSDK = () => {
  const [discordSdk, setDiscordSdk] = useState<DiscordSDK | null>(null);
  const [auth, setAuth] = useState<DiscordAuth | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDiscord = async () => {
      try {
        console.log('🎮 Initializing Discord SDK...');
        
        // Check if we're running in Discord
        const isInDiscord = window.location.href.includes('discord.com') || 
                           window.parent !== window ||
                           document.referrer.includes('discord.com');

        if (!isInDiscord) {
          console.log('🔍 Not running in Discord environment, skipping SDK initialization');
          setIsReady(true);
          return;
        }

        const sdk = new DiscordSDK(process.env.VITE_DISCORD_CLIENT_ID || '');
        
        await sdk.ready();
        console.log('✅ Discord SDK ready');
        
        // Authenticate with Discord if needed
        try {
          const authResponse = await sdk.commands.authenticate({
            access_token: true,
          });
          
          if (authResponse) {
            setAuth(authResponse);
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
    if (!discordSdk) return;

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
    isInDiscord: !!discordSdk,
    updateActivity
  };
};
