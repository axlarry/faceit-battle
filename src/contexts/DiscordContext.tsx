
import React, { createContext, useContext, ReactNode } from 'react';
import { useDiscordSDK } from '@/hooks/useDiscordSDK';

interface DiscordContextType {
  discordSdk: any;
  auth: any;
  isReady: boolean;
  error: string | null;
  isInDiscord: boolean;
  updateActivity: (activity: any) => Promise<void>;
}

const DiscordContext = createContext<DiscordContextType | undefined>(undefined);

export const useDiscord = () => {
  const context = useContext(DiscordContext);
  if (context === undefined) {
    throw new Error('useDiscord must be used within a DiscordProvider');
  }
  return context;
};

interface DiscordProviderProps {
  children: ReactNode;
}

export const DiscordProvider = ({ children }: DiscordProviderProps) => {
  const discordData = useDiscordSDK();

  return (
    <DiscordContext.Provider value={discordData}>
      {children}
    </DiscordContext.Provider>
  );
};
