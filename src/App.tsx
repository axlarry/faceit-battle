
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DiscordProvider } from "@/contexts/DiscordContext";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Force Discord-specific styling on mount
    const isInDiscord = 
      window.parent !== window ||
      window.location.href.includes('discord.com') ||
      document.referrer.includes('discord.com') ||
      window.location.search.includes('frame_id') ||
      window.location.search.includes('instance_id') ||
      window.location.hostname === 'faceit-toolz.lovable.app' ||
      navigator.userAgent.includes('Discord') ||
      window.top !== window.self;

    if (isInDiscord) {
      console.log('🎮 Discord environment detected in App component');
      document.body.style.setProperty('background-color', '#0d1117', 'important');
      document.documentElement.style.setProperty('background-color', '#0d1117', 'important');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DiscordProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DiscordProvider>
    </QueryClientProvider>
  );
};

export default App;
