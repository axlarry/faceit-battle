
import { Button } from "@/components/ui/button";

interface RegionTabsProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
}

export const RegionTabs = ({ currentRegion, onRegionChange }: RegionTabsProps) => {
  const regions = [
    { id: 'FRIENDS', name: 'Prietenii Mei', flag: '👥', shortName: 'Prieteni' },
    { id: 'EU', name: 'Europa', flag: '🇪🇺', shortName: 'EU' },
    { id: 'NA', name: 'America de Nord', flag: '🇺🇸', shortName: 'NA' },
    { id: 'SA', name: 'America de Sud', flag: '🇧🇷', shortName: 'SA' },
    { id: 'OCE', name: 'Oceania', flag: '🇦🇺', shortName: 'OCE' },
    { id: 'FACEIT_TOOL', name: 'FACEIT Tool', flag: '🔍', shortName: 'Tool' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 justify-center p-2 sm:p-3 md:p-4 bg-[#1a1d21] rounded-lg sm:rounded-xl border border-[#2a2f36] shadow-xl">
      {regions.map((region) => (
        <Button
          key={region.id}
          variant={currentRegion === region.id ? "default" : "outline"}
          onClick={() => onRegionChange(region.id)}
          className={`
            px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-bold transition-all duration-200 
            rounded-md sm:rounded-lg border-2 min-h-[36px] sm:min-h-[42px] md:min-h-[48px] 
            min-w-[60px] sm:min-w-[80px] md:min-w-[120px] lg:min-w-[140px]
            ${currentRegion === region.id 
              ? 'bg-[#ff6500] hover:bg-[#e55a00] text-white border-[#ff6500] shadow-lg shadow-[#ff6500]/25' 
              : 'bg-[#2a2f36] hover:bg-[#363c45] text-[#b3b3b3] hover:text-white border-[#3a4048] hover:border-[#ff6500]/50'
            }
          `}
        >
          <span className="text-sm sm:text-base md:text-lg mr-1 sm:mr-2">{region.flag}</span>
          <span className="block sm:hidden text-[10px]">{region.shortName}</span>
          <span className="hidden sm:block md:hidden text-xs">{region.shortName}</span>
          <span className="hidden md:block">{region.name}</span>
        </Button>
      ))}
    </div>
  );
};
