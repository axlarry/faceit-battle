
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { Globe, ChevronDown, Users, Search, Sparkles } from "lucide-react";

interface RegionTabsProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
}

export const RegionTabs = ({ currentRegion, onRegionChange }: RegionTabsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const regions = [
    { id: 'EU', name: 'Europa', flag: '🇪🇺', color: 'from-violet-600 via-purple-600 to-indigo-600', desc: 'European Championship' },
    { id: 'NA', name: 'America de Nord', flag: '🇺🇸', color: 'from-blue-600 via-cyan-600 to-teal-600', desc: 'North American League' },
    { id: 'SA', name: 'America de Sud', flag: '🇧🇷', color: 'from-emerald-600 via-green-600 to-lime-600', desc: 'South American Circuit' },
    { id: 'OCE', name: 'Oceania', flag: '🇦🇺', color: 'from-orange-600 via-red-600 to-pink-600', desc: 'Oceanic Pro Series' },
  ];

  const specialTabs = [
    { 
      id: 'FRIENDS', 
      name: 'Prietenii Mei', 
      icon: Users, 
      color: 'from-slate-700 via-slate-600 to-slate-500',
      gradient: 'from-orange-500/20 via-red-500/10 to-pink-500/20'
    },
    { 
      id: 'FACEIT_TOOL', 
      name: 'FACEIT Tool', 
      icon: Search, 
      color: 'from-slate-700 via-slate-600 to-slate-500',
      gradient: 'from-purple-500/20 via-blue-500/10 to-cyan-500/20'
    },
  ];

  const getCurrentRegionDisplay = () => {
    const region = regions.find(r => r.id === currentRegion);
    if (region) return `${region.flag} ${region.name}`;
    
    const special = specialTabs.find(t => t.id === currentRegion);
    if (special) return special.name;
    
    return 'Rank Global';
  };

  const handleRegionSelect = (regionId: string) => {
    onRegionChange(regionId);
    setIsOpen(false);
  };

  return (
    <div className="flex justify-center items-center p-6">
      <div className="flex gap-6 items-center">
        {/* Special tabs with modern 3D design */}
        {specialTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = currentRegion === tab.id;
          
          return (
            <div key={tab.id} className="relative group">
              {/* Glow effect backdrop */}
              <div className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-700 bg-gradient-to-r ${tab.gradient} animate-glow-pulse`}></div>
              
              <Button
                onClick={() => onRegionChange(tab.id)}
                className={`
                  relative px-6 py-4 text-sm font-bold transition-all duration-500 rounded-2xl
                  border-2 transform hover:scale-110 group overflow-hidden
                  backdrop-blur-xl shadow-2xl hover:shadow-3xl
                  ${isActive 
                    ? `bg-gradient-to-br ${tab.color} text-white border-white/20 shadow-2xl scale-105` 
                    : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-600/50 hover:border-slate-400/70'
                  }
                `}
              >
                {/* 3D depth layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 rounded-2xl"></div>
                
                {/* Animated particles */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white/40 rounded-full animate-orbital"
                      style={{
                        left: `${20 + i * 20}%`,
                        top: `${30 + (i % 2) * 40}%`,
                        animationDelay: `${i * 2}s`,
                        animationDuration: `${8 + i * 2}s`
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <IconComponent size={18} className="animate-micro-bounce" />
                  </div>
                  <span className="hidden sm:inline font-semibold tracking-wide">
                    {tab.name}
                  </span>
                  <span className="sm:hidden font-semibold">
                    {tab.id === 'FRIENDS' ? 'Prieteni' : 'Tool'}
                  </span>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </Button>
            </div>
          );
        })}

        {/* Revolutionary Global Rank Button */}
        <div className="relative group">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-700 animate-gradient-shift scale-110"></div>
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                className={`
                  relative px-8 py-5 text-base font-bold transition-all duration-500 rounded-3xl
                  border-2 transform hover:scale-110 group overflow-hidden
                  backdrop-blur-2xl shadow-2xl hover:shadow-4xl
                  ${regions.some(r => r.id === currentRegion)
                    ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white border-white/30 shadow-purple-500/50 scale-105' 
                    : 'bg-slate-800/90 hover:bg-slate-700/95 text-slate-200 hover:text-white border-slate-500/50 hover:border-indigo-400/70'
                  }
                `}
              >
                {/* 3D layered background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 rounded-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 rounded-3xl"></div>
                
                {/* Floating sparkles */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  {[...Array(6)].map((_, i) => (
                    <Sparkles
                      key={i}
                      size={12}
                      className="absolute text-white/30 animate-float-gentle"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 20}%`,
                        animationDelay: `${i * 0.8}s`,
                        animationDuration: `${4 + i * 0.5}s`
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl backdrop-blur-sm border border-white/20">
                      <Globe 
                        size={24} 
                        className={`transition-all duration-500 ${isOpen ? 'rotate-180 scale-110' : 'group-hover:rotate-12 group-hover:scale-105'}`} 
                      />
                    </div>
                    {/* Orbiting ring */}
                    <div className="absolute inset-0 border-2 border-white/20 rounded-2xl animate-rotate-slow"></div>
                  </div>
                  
                  <div className="flex flex-col items-start">
                    <span className="hidden md:inline text-lg font-bold tracking-wide">
                      Rank Global
                    </span>
                    <span className="md:hidden text-lg font-bold">Rank Global</span>
                    <span className="text-xs text-white/70 font-medium">
                      Select Region
                    </span>
                  </div>
                  
                  <ChevronDown 
                    size={20} 
                    className={`transition-all duration-500 ${isOpen ? 'rotate-180 scale-110' : 'group-hover:scale-110'}`} 
                  />
                </div>

                {/* Multi-layer shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1200"></div>
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-purple-300/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-800 delay-200"></div>
              </Button>
            </PopoverTrigger>

            <PopoverContent 
              className="w-96 p-0 bg-slate-900/95 border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-2xl border-2"
              align="center"
              side="bottom"
              sideOffset={12}
            >
              {/* Animated header with gradient */}
              <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-center overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-20"></div>
                
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-xl flex items-center justify-center gap-3 mb-2">
                    <Globe size={24} className="animate-spin" style={{ animationDuration: '8s' }} />
                    Choose Your Arena
                  </h3>
                  <p className="text-white/90 text-sm">Select your competitive battlefield</p>
                </div>
              </div>

              {/* Regions Grid with 3D cards */}
              <div className="p-6 grid grid-cols-2 gap-4 bg-slate-900/50">
                {regions.map((region, index) => (
                  <div
                    key={region.id}
                    className="relative group animate-bounce-in"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <button
                      onClick={() => handleRegionSelect(region.id)}
                      className={`
                        relative w-full p-5 rounded-2xl transition-all duration-500 transform hover:scale-110
                        bg-gradient-to-br ${region.color} hover:shadow-2xl overflow-hidden
                        border-2 border-white/20 hover:border-white/40
                        ${currentRegion === region.id ? 'ring-4 ring-white/50 scale-105 shadow-2xl' : ''}
                      `}
                    >
                      {/* 3D depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 rounded-2xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 rounded-2xl"></div>
                      
                      {/* Animated background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9IiNmZmYiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYikiLz48L3N2Zz4=')] animate-pulse"></div>
                      </div>

                      <div className="relative z-10 text-center">
                        <div className="text-4xl mb-3 group-hover:scale-125 transition-all duration-500 animate-float-gentle">
                          {region.flag}
                        </div>
                        <div className="text-white font-bold text-base mb-2 tracking-wide">
                          {region.name}
                        </div>
                        <div className="text-white/80 text-xs font-medium">
                          {region.desc}
                        </div>
                      </div>

                      {/* Hover effects */}
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>
                      
                      {/* Selected indicator with pulse */}
                      {currentRegion === region.id && (
                        <div className="absolute top-3 right-3 w-4 h-4 bg-white rounded-full animate-pulse shadow-lg">
                          <div className="absolute inset-0 bg-white rounded-full animate-ping"></div>
                        </div>
                      )}

                      {/* Shine effect */}
                      <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  </div>
                ))}
              </div>

              {/* Enhanced footer */}
              <div className="p-4 bg-slate-800/80 text-center border-t border-slate-700/50">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <Sparkles size={14} className="animate-pulse" />
                  <p className="text-sm">Select any region to explore rankings</p>
                  <Sparkles size={14} className="animate-pulse" />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
