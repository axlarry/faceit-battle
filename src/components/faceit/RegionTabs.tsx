
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { Globe, ChevronDown, Users, Search } from "lucide-react";

interface RegionTabsProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
}

export const RegionTabs = ({ currentRegion, onRegionChange }: RegionTabsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const regions = [
    { 
      id: 'EU', 
      name: 'Europa', 
      flag: '/faceit-icons/eu.svg', 
      color: 'from-blue-600 via-indigo-600 to-purple-600', 
      desc: 'European Championship' 
    },
    { 
      id: 'NA', 
      name: 'America de Nord', 
      flag: '/faceit-icons/us.svg', 
      color: 'from-red-600 via-blue-600 to-white/20', 
      desc: 'North American League' 
    },
    { 
      id: 'SA', 
      name: 'America de Sud', 
      flag: '/faceit-icons/br.svg', 
      color: 'from-green-600 via-yellow-500 to-blue-600', 
      desc: 'South American Circuit' 
    },
    { 
      id: 'OCE', 
      name: 'Oceania', 
      flag: '/faceit-icons/au.svg', 
      color: 'from-blue-600 via-red-600 to-blue-800', 
      desc: 'Oceanic Pro Series' 
    },
  ];

  const specialTabs = [
    { 
      id: 'FRIENDS', 
      name: 'Prietenii Mei', 
      icon: Users, 
      gradient: 'from-accent to-primary',
      iconColor: 'text-primary-foreground',
      bgColor: 'bg-gradient-to-r from-accent to-primary',
      hoverBg: 'hover:from-accent hover:to-primary'
    },
    { 
      id: 'FACEIT_TOOL', 
      name: 'FACEIT Tool', 
      icon: Search, 
      gradient: 'from-primary to-secondary',
      iconColor: 'text-primary-foreground',
      bgColor: 'bg-gradient-to-r from-primary to-secondary',
      hoverBg: 'hover:from-primary hover:to-secondary'
    },
  ];

  const handleRegionSelect = (regionId: string) => {
    onRegionChange(regionId);
    setIsOpen(false);
  };

  return (
    <div className="flex justify-center items-center p-6">
      <div className="flex gap-4 items-center">
        {/* Modern Special Tabs */}
        {specialTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = currentRegion === tab.id;
          
          return (
            <div key={tab.id} className="relative">
              <Button
                onClick={() => onRegionChange(tab.id)}
                className={`
                  relative px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-xl
                  transform hover:scale-105 hover:shadow-lg
                  ${isActive 
                    ? `${tab.bgColor} text-primary-foreground shadow-lg scale-105` 
                    : `bg-card/40 backdrop-blur-sm text-foreground/80 hover:text-foreground border border-border ${tab.hoverBg}`
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <IconComponent size={18} className={isActive ? 'text-primary-foreground' : tab.iconColor} />
                  <span className="hidden sm:inline">
                    {tab.name}
                  </span>
                  <span className="sm:hidden">
                    {tab.id === 'FRIENDS' ? 'Prieteni' : 'Tool'}
                  </span>
                </div>
              </Button>
            </div>
          );
        })}

        {/* Global Rank Button */}
        <div className="relative">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                className={`
                  relative px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-xl
                  transform hover:scale-105 hover:shadow-lg
                  ${regions.some(r => r.id === currentRegion)
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105' 
                    : 'bg-white/10 backdrop-blur-sm text-slate-300 hover:text-white border border-white/20 hover:from-indigo-600 hover:to-purple-600'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Globe 
                    size={18} 
                    className={`transition-all duration-300 ${isOpen ? 'rotate-180' : ''} ${regions.some(r => r.id === currentRegion) ? 'text-primary-foreground' : 'text-primary'}`} 
                  />
                  
                  <span>Rank Global</span>
                  
                  <ChevronDown 
                    size={16} 
                    className={`transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                  />
                </div>
              </Button>
            </PopoverTrigger>

            <PopoverContent 
              className="w-80 p-0 bg-card/95 border-border shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl border"
              align="center"
              side="bottom"
              sideOffset={12}
            >
              {/* Regions Grid */}
              <div className="p-6 grid grid-cols-2 gap-4">
                {regions.map((region, index) => (
                  <div
                    key={region.id}
                    className="relative group"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <button
                      onClick={() => handleRegionSelect(region.id)}
                      className={`
                        relative w-full p-5 rounded-xl transition-all duration-300 transform hover:scale-105
                        bg-gradient-to-br ${region.color} hover:shadow-xl overflow-hidden
                        border-2 border-white/30 hover:border-white/50
                        ${currentRegion === region.id ? 'ring-2 ring-white/70 scale-105 shadow-xl' : ''}
                      `}
                    >
                      {/* Flag Background - Full visibility */}
                      <div 
                        className="absolute inset-0 opacity-90 bg-center bg-contain bg-no-repeat"
                        style={{
                          backgroundImage: `url(${region.flag})`,
                          backgroundSize: '80%',
                          backgroundPosition: 'center'
                        }}
                      />
                      
                      {/* Minimal overlay for text readability */}
                      <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
                      
                      <div className="relative z-10 text-center">
                         <div className="text-foreground font-bold text-base mb-2 tracking-wide drop-shadow-lg">
                          {region.name}
                         </div>
                         <div className="text-foreground/80 text-xs font-medium drop-shadow">
                           {region.desc}
                         </div>
                      </div>

                      {/* Selected indicator */}
                      {currentRegion === region.id && (
                         <div className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg">
                           <div className="absolute inset-0 bg-primary rounded-full animate-ping"></div>
                         </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 bg-card/60 text-center border-t border-border">
                <p className="text-sm text-muted-foreground">Select any region to explore rankings</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
