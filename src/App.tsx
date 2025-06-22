
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DiscordProvider } from "@/contexts/DiscordContext";
import { DiscordErrorBoundary } from "@/components/discord/DiscordErrorBoundary";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Enhanced error handling for Discord CSP constraints
      retry: (failureCount, error: any) => {
        // Don't retry CSP-blocked requests or network errors in Discord
        if (error?.message && (
          error.message.includes('CSP') || 
          error.message.includes('blocked') ||
          error.message.includes('NetworkError') ||
          error.message.includes('Failed to fetch')
        )) {
          console.log('🔒 Not retrying CSP-blocked request:', error.message);
          return false;
        }
        return failureCount < 2; // Reduce retry attempts in Discord
      },
      staleTime: 30000, // Cache data longer in Discord to reduce network requests
      refetchOnWindowFocus: false, // Disable refetch on focus in Discord iframe
    },
  },
});

const App = () => {
  useEffect(() => {
    // Enhanced Discord environment detection and styling
    const isInDiscord = 
      window.parent !== window ||
      window.location.href.includes('discord.com') ||
      window.location.href.includes('discordsays.com') ||
      window.location.href.includes('discordapp.com') ||
      document.referrer.includes('discord.com') ||
      document.referrer.includes('discordapp.com') ||
      window.location.search.includes('frame_id') ||
      window.location.search.includes('instance_id') ||
      window.location.hostname === 'faceit-toolz.lovable.app' ||
      window.location.hostname.includes('discordsays.com') ||
      window.location.hostname.includes('discordapp.com') ||
      navigator.userAgent.includes('Discord') ||
      window.top !== window.self ||
      window.location.search.includes('v=') ||
      window.location.search.includes('channel_id=') ||
      window.location.search.includes('guild_id=');

    if (isInDiscord) {
      console.log('🎮 Discord environment detected in App component');
      console.log('🎨 Applying Discord-specific styling');
      
      // Apply Discord theme immediately
      document.body.style.setProperty('background-color', '#0d1117', 'important');
      document.documentElement.style.setProperty('background-color', '#0d1117', 'important');
      document.body.style.setProperty('color', 'white', 'important');
      document.body.style.setProperty('margin', '0', 'important');
      document.body.style.setProperty('padding', '0', 'important');

      // Additional error handling for Discord
      const handleDiscordError = (error: any) => {
        if (error?.message && (
          error.message.includes('CSP') || 
          error.message.includes('blocked') ||
          error.message.includes('Content Security Policy')
        )) {
          console.warn('🔒 Discord CSP error handled in App:', error.message);
          return true;
        }
        return false;
      };

      // Add global error handler
      window.addEventListener('error', (e) => {
        if (handleDiscordError(e.error)) {
          e.preventDefault();
        }
      });

      window.addEventListener('unhandledrejection', (e) => {
        if (handleDiscordError(e.reason)) {
          e.preventDefault();
        }
      });
    }
  }, []);

  return (
    <DiscordErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DiscordProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DiscordProvider>
      </QueryClientProvider>
    </DiscordErrorBoundary>
  );
};

export default App;
