
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { Globe, ChevronDown, Users, Search, Sparkles, Crown } from "lucide-react";

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
      color: 'from-violet-600 via-purple-600 to-indigo-600', 
      desc: 'European Championship' 
    },
    { 
      id: 'NA', 
      name: 'America de Nord', 
      flag: '/faceit-icons/us.svg', 
      color: 'from-blue-600 via-cyan-600 to-teal-600', 
      desc: 'North American League' 
    },
    { 
      id: 'SA', 
      name: 'America de Sud', 
      flag: '/faceit-icons/br.svg', 
      color: 'from-emerald-600 via-green-600 to-lime-600', 
      desc: 'South American Circuit' 
    },
    { 
      id: 'OCE', 
      name: 'Oceania', 
      flag: '/faceit-icons/au.svg', 
      color: 'from-orange-600 via-red-600 to-pink-600', 
      desc: 'Oceanic Pro Series' 
    },
  ];

  const specialTabs = [
    { 
      id: 'FRIENDS', 
      name: 'Prietenii Mei', 
      icon: Users, 
      gradient: 'from-orange-500/30 via-red-500/20 to-pink-500/30',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/30 hover:border-orange-400/60'
    },
    { 
      id: 'FACEIT_TOOL', 
      name: 'FACEIT Tool', 
      icon: Search, 
      gradient: 'from-purple-500/30 via-blue-500/20 to-cyan-500/30',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/30 hover:border-purple-400/60'
    },
  ];

  const handleRegionSelect = (regionId: string) => {
    onRegionChange(regionId);
    setIsOpen(false);
  };

  return (
    <div className="flex justify-center items-center p-6">
      <div className="flex gap-4 items-center">
        {/* Modern Special Tabs with UI/UX Design */}
        {specialTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = currentRegion === tab.id;
          
          return (
            <div key={tab.id} className="relative group">
              <Button
                onClick={() => onRegionChange(tab.id)}
                className={`
                  relative px-6 py-4 text-sm font-medium transition-all duration-300 rounded-2xl
                  border transform hover:scale-105 overflow-hidden backdrop-blur-sm
                  shadow-lg hover:shadow-xl
                  ${isActive 
                    ? `bg-gradient-to-br ${tab.gradient} text-white ${tab.borderColor.replace('hover:', '')} border-2 scale-105 shadow-xl` 
                    : `bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white ${tab.borderColor} border`
                  }
                `}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-700/50'} transition-all duration-300`}>
                    <IconComponent size={16} className={`${isActive ? 'text-white' : tab.iconColor} transition-all duration-300`} />
                  </div>
                  <span className="font-semibold tracking-wide hidden sm:inline">
                    {tab.name}
                  </span>
                  <span className="font-semibold sm:hidden">
                    {tab.id === 'FRIENDS' ? 'Prieteni' : 'Tool'}
                  </span>
                </div>

                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </Button>
            </div>
          );
        })}

        {/* Modern Global Rank Button with UI/UX Design */}
        <div className="relative group">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                className={`
                  relative px-8 py-4 text-sm font-medium transition-all duration-300 rounded-2xl
                  border-2 transform hover:scale-105 overflow-hidden backdrop-blur-sm
                  shadow-lg hover:shadow-xl
                  ${regions.some(r => r.id === currentRegion)
                    ? 'bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 text-white border-indigo-400/60 scale-105 shadow-xl' 
                    : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white border-slate-500/30 hover:border-indigo-400/60'
                  }
                `}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`p-2 rounded-lg ${regions.some(r => r.id === currentRegion) ? 'bg-white/20' : 'bg-slate-700/50'} transition-all duration-300`}>
                    <Globe 
                      size={16} 
                      className={`transition-all duration-300 ${isOpen ? 'rotate-180' : 'group-hover:rotate-12'} ${regions.some(r => r.id === currentRegion) ? 'text-white' : 'text-indigo-400'}`} 
                    />
                  </div>
                  
                  <span className="font-semibold tracking-wide">
                    Rank Global
                  </span>
                  
                  <ChevronDown 
                    size={16} 
                    className={`transition-all duration-300 ${isOpen ? 'rotate-180' : 'group-hover:scale-110'}`} 
                  />
                </div>

                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </Button>
            </PopoverTrigger>

            <PopoverContent 
              className="w-80 p-0 bg-slate-900/95 border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl border"
              align="center"
              side="bottom"
              sideOffset={12}
            >
              {/* Regions Grid with SVG Backgrounds */}
              <div className="p-6 grid grid-cols-2 gap-4">
                {regions.map((region, index) => (
                  <div
                    key={region.id}
                    className="relative group animate-bounce-in"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <button
                      onClick={() => handleRegionSelect(region.id)}
                      className={`
                        relative w-full p-5 rounded-xl transition-all duration-300 transform hover:scale-105
                        bg-gradient-to-br ${region.color} hover:shadow-xl overflow-hidden
                        border border-white/20 hover:border-white/40
                        ${currentRegion === region.id ? 'ring-2 ring-white/50 scale-105 shadow-xl' : ''}
                      `}
                    >
                      {/* SVG Flag Background */}
                      <div 
                        className="absolute inset-0 opacity-20 bg-center bg-contain bg-no-repeat"
                        style={{
                          backgroundImage: `url(${region.flag})`,
                          backgroundSize: '60%',
                          backgroundPosition: 'center'
                        }}
                      />
                      
                      {/* 3D depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl"></div>
                      
                      <div className="relative z-10 text-center">
                        <div className="text-white font-bold text-base mb-2 tracking-wide">
                          {region.name}
                        </div>
                        <div className="text-white/80 text-xs font-medium">
                          {region.desc}
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {currentRegion === region.id && (
                        <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full animate-pulse shadow-lg">
                          <div className="absolute inset-0 bg-white rounded-full animate-ping"></div>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Simple footer */}
              <div className="p-4 bg-slate-800/60 text-center border-t border-slate-700/50">
                <p className="text-sm text-slate-400">Select any region to explore rankings</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
