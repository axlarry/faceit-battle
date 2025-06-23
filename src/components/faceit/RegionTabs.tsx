
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
    { id: 'EU', name: 'Europa', flag: '🇪🇺', color: 'from-blue-500 to-purple-600', desc: 'European Servers' },
    { id: 'NA', name: 'America de Nord', flag: '🇺🇸', color: 'from-red-500 to-blue-600', desc: 'North American Servers' },
    { id: 'SA', name: 'America de Sud', flag: '🇧🇷', color: 'from-green-500 to-yellow-500', desc: 'South American Servers' },
    { id: 'OCE', name: 'Oceania', flag: '🇦🇺', color: 'from-orange-500 to-red-500', desc: 'Oceanic Servers' },
  ];

  const specialTabs = [
    { id: 'FRIENDS', name: 'Prietenii Mei', icon: Users, color: 'from-[#ff6500] to-[#ff8533]' },
    { id: 'FACEIT_TOOL', name: 'FACEIT Tool', icon: Search, color: 'from-purple-500 to-pink-500' },
  ];

  const getCurrentRegionDisplay = () => {
    const region = regions.find(r => r.id === currentRegion);
    if (region) return `${region.flag} ${region.name}`;
    
    const special = specialTabs.find(t => t.id === currentRegion);
    if (special) return special.name;
    
    return 'Global Rank';
  };

  const handleRegionSelect = (regionId: string) => {
    onRegionChange(regionId);
    setIsOpen(false);
  };

  return (
    <div className="flex justify-center items-center p-4">
      <div className="flex gap-4 items-center">
        {/* Special tabs (always visible) */}
        {specialTabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={currentRegion === tab.id ? "default" : "outline"}
              onClick={() => onRegionChange(tab.id)}
              className={`
                px-4 py-3 text-sm font-bold transition-all duration-300 rounded-xl
                border-2 transform hover:scale-105 hover:shadow-lg
                ${currentRegion === tab.id 
                  ? `bg-gradient-to-r ${tab.color} text-white border-transparent shadow-lg hover:shadow-xl` 
                  : 'bg-[#2a2f36] hover:bg-[#363c45] text-[#b3b3b3] hover:text-white border-[#3a4048] hover:border-[#ff6500]/50'
                }
              `}
            >
              <IconComponent size={16} className="mr-2" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.id === 'FRIENDS' ? 'Prieteni' : 'Tool'}</span>
            </Button>
          );
        })}

        {/* Modern Global Rank Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={regions.some(r => r.id === currentRegion) ? "default" : "outline"}
              className={`
                relative px-6 py-3 text-sm font-bold transition-all duration-300 rounded-xl
                border-2 transform hover:scale-105 group overflow-hidden
                ${regions.some(r => r.id === currentRegion)
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-transparent shadow-xl hover:shadow-2xl' 
                  : 'bg-[#2a2f36] hover:bg-[#363c45] text-[#b3b3b3] hover:text-white border-[#3a4048] hover:border-indigo-500/50'
                }
              `}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
                    style={{
                      left: `${20 + i * 30}%`,
                      top: `${30 + i * 15}%`,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: '3s'
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10 flex items-center gap-2">
                <Globe 
                  size={18} 
                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'group-hover:rotate-12'}`} 
                />
                <span className="hidden md:inline">
                  {getCurrentRegionDisplay()}
                </span>
                <span className="md:hidden">Global</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                />
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </Button>
          </PopoverTrigger>

          <PopoverContent 
            className="w-80 p-0 bg-[#1a1d21] border-[#2a2f36] shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl"
            align="center"
            side="bottom"
            sideOffset={8}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4 text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <Globe size={20} className="animate-spin" style={{ animationDuration: '8s' }} />
                Select Global Region
              </h3>
              <p className="text-white/80 text-sm mt-1">Choose your preferred leaderboard</p>
            </div>

            {/* Regions Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {regions.map((region, index) => (
                <button
                  key={region.id}
                  onClick={() => handleRegionSelect(region.id)}
                  className={`
                    group relative p-4 rounded-xl transition-all duration-300 transform hover:scale-105
                    bg-gradient-to-br ${region.color} hover:shadow-lg overflow-hidden
                    ${currentRegion === region.id ? 'ring-2 ring-white/50 scale-105' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9IiNmZmYiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')]"></div>
                  </div>

                  <div className="relative z-10 text-center">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {region.flag}
                    </div>
                    <div className="text-white font-bold text-sm mb-1">
                      {region.name}
                    </div>
                    <div className="text-white/80 text-xs">
                      {region.desc}
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  
                  {/* Selected indicator */}
                  {currentRegion === region.id && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer tip */}
            <div className="p-3 bg-[#2a2f36] text-center">
              <p className="text-xs text-gray-400">
                💡 Tip: Click any region to view their leaderboard
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
