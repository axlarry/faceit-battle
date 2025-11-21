import { useState, useEffect } from "react";
import { Crown, Zap, TrendingUp, Users } from "lucide-react";
import faviconOptimized from "@/assets/favicon-optimized.webp";
export const Header = () => {
  const [faceitIconError, setFaceitIconError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [activeParticle, setActiveParticle] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveParticle(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  const handleFaceitIconError = () => {
    console.error('Failed to load Faceit icon from: /faceit-icons/faceit_icon.png');
    setFaceitIconError(true);
  };
  const handleFaviconError = () => {
    console.error('Failed to load favicon from: /favicon.ico');
    setFaviconError(true);
  };
  const particles = [{
    icon: Crown,
    color: "text-accent",
    delay: "0s"
  }, {
    icon: Zap,
    color: "text-secondary",
    delay: "0.5s"
  }, {
    icon: TrendingUp,
    color: "text-primary",
    delay: "1s"
  }, {
    icon: Users,
    color: "text-foreground/70",
    delay: "1.5s"
  }];
  return <div className="relative bg-gradient-to-br from-background via-background/95 to-background border-b border-border overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 opacity-30 bg-grid"></div>
      <div className="absolute inset-0 app-aurora"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-accent/15 via-transparent to-accent/15"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle, index) => <div key={index} className={`absolute transition-all duration-1000 ${activeParticle === index ? 'opacity-100 scale-110' : 'opacity-30 scale-90'}`} style={{
        left: `${20 + index * 20}%`,
        top: `${30 + index % 2 * 40}%`,
        animationDelay: particle.delay
      }}>
            <particle.icon size={16 + (activeParticle === index ? 8 : 0)} className={`${particle.color} animate-bounce`} style={{
          animationDelay: particle.delay
        }} />
          </div>)}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto py-10 max-w-7xl px-[16px]">
        <div className="flex flex-col items-center gap-8 rounded-none mx-[35px]">
          {/* Logo kept + new modern hero */}
          <div className="flex items-center justify-center gap-6">
            {/* Animated Logo Container */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff6500] to-[#ff8533] rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#ff6500] to-[#ff8533] rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                <div className="absolute inset-1 bg-gradient-to-br from-[#ff7700] to-[#ff6500] rounded-xl opacity-80"></div>
                {!faviconError ? <img src={faviconOptimized} alt="Site Icon" onError={handleFaviconError} onLoad={() => console.log('✅ Favicon loaded successfully')} className="relative z-10 w-12 h-12 drop-shadow-lg transform group-hover:rotate-12 transition-transform duration-300" width="48" height="48" /> : <div className="relative z-10 text-white text-2xl font-bold">F</div>}
                {/* Orbital Ring */}
                <div className="absolute inset-0 border-2 border-[#ff6500]/30 rounded-2xl animate-spin" style={{
                animationDuration: '8s'
              }}></div>
              </div>
            </div>

            {/* New hero copy */}
            <div className="flex flex-col items-start text-left">
              <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary tracking-tight">FACEIT LaCurte</h2>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground">Clasamente, prieteni și meciuri.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                
                
                
              </div>
            </div>
          </div>

          {/* Divider Glow */}
          <div className="h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-accent to-transparent opacity-70"></div>
        </div>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80"></div>
    </div>;
};