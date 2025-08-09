
import { useState, useEffect } from "react";
import { Crown, Zap, TrendingUp, Users } from "lucide-react";

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

  const particles = [
    { icon: Crown, color: "text-accent", delay: "0s" },
    { icon: Zap, color: "text-secondary", delay: "0.5s" },
    { icon: TrendingUp, color: "text-primary", delay: "1s" },
    { icon: Users, color: "text-foreground/70", delay: "1.5s" }
  ];

  return (
    <div className="relative bg-gradient-to-br from-background via-background/95 to-background border-b border-border overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 opacity-30 bg-grid"></div>
      <div className="absolute inset-0 app-aurora"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-accent/15 via-transparent to-accent/15"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle, index) => (
          <div
            key={index}
            className={`absolute transition-all duration-1000 ${
              activeParticle === index ? 'opacity-100 scale-110' : 'opacity-30 scale-90'
            }`}
            style={{
              left: `${20 + index * 20}%`,
              top: `${30 + (index % 2) * 40}%`,
              animationDelay: particle.delay,
            }}
          >
            <particle.icon 
              size={16 + (activeParticle === index ? 8 : 0)} 
              className={`${particle.color} animate-bounce`}
              style={{ animationDelay: particle.delay }}
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          {/* Logo Section with Enhanced Animation */}
          <div className="flex items-center justify-center gap-6 mb-6">
            {/* Animated Logo Container */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff6500] to-[#ff8533] rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#ff6500] to-[#ff8533] rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                <div className="absolute inset-1 bg-gradient-to-br from-[#ff7700] to-[#ff6500] rounded-xl opacity-80"></div>
                {!faviconError ? (
                  <img 
                    src="/favicon.ico" 
                    alt="Site Icon" 
                    onError={handleFaviconError} 
                    onLoad={() => console.log('✅ Favicon loaded successfully from /favicon.ico')} 
                    className="relative z-10 w-12 h-12 drop-shadow-lg transform group-hover:rotate-12 transition-transform duration-300" 
                  />
                ) : (
                  <div className="relative z-10 text-white text-2xl font-bold">F</div>
                )}
                
                {/* Orbital Ring */}
                <div className="absolute inset-0 border-2 border-[#ff6500]/30 rounded-2xl animate-spin" style={{ animationDuration: '8s' }}></div>
              </div>
            </div>

            {/* Title with Modern Typography */}
            <div className="flex flex-col items-start">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary mb-2 tracking-tight">
                FACEIT
                {!faceitIconError && (
                  <img 
                    src="/faceit-icons/faceit_icon.png" 
                    alt="Faceit" 
                    className="inline-block w-12 h-12 ml-3 animate-bounce" 
                    onError={handleFaceitIconError} 
                    onLoad={() => console.log('✅ Faceit icon loaded successfully from /faceit-icons/faceit_icon.png')} 
                  />
                )}
              </h1>
              
              {/* Animated Subtitle */}
              <div className="relative overflow-hidden">
                <p className="text-xl text-muted-foreground font-medium transform translate-y-full animate-[slide-up_1s_ease-out_0.5s_forwards]">
                  Clasament Global cu Prieteni
                </p>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent transform scale-x-0 animate-[scale-x_1s_ease-out_1s_forwards]"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="flex justify-center gap-6 mt-8">
            <div className="glass-card rounded-xl p-4 border border-border backdrop-blur-sm transform hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                  <Crown size={20} className="text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Competiție</p>
                  <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">Elite</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 border border-border backdrop-blur-sm transform hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <p className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors">Live</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 border border-border backdrop-blur-sm transform hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Prieteni</p>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Activi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80"></div>
    </div>
  );
};
