
import { Button } from "@/components/ui/button";

interface RegionTabsProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
}

export const RegionTabs = ({ currentRegion, onRegionChange }: RegionTabsProps) => {
  const regions = [
    { id: 'FRIENDS', name: 'Prietenii Mei', flag: '👥' },
    { id: 'EU', name: 'Europa', flag: '🇪🇺' },
    { id: 'NA', name: 'America de Nord', flag: '🇺🇸' },
    { id: 'SA', name: 'America de Sud', flag: '🇧🇷' },
    { id: 'OCE', name: 'Oceania', flag: '🇦🇺' },
    { id: 'FACEIT_TOOL', name: 'FACEIT Tool', flag: '🔍' },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center p-4 bg-[#1a1d21] rounded-xl border border-[#2a2f36] shadow-xl">
      {regions.map((region) => (
        <Button
          key={region.id}
          variant={currentRegion === region.id ? "default" : "outline"}
          onClick={() => onRegionChange(region.id)}
          className={`
            px-4 py-2.5 text-sm md:text-base font-bold transition-all duration-200 
            rounded-lg border-2 min-h-[48px] min-w-[120px] md:min-w-[140px]
            ${currentRegion === region.id 
              ? 'bg-[#ff6500] hover:bg-[#e55a00] text-white border-[#ff6500] shadow-lg shadow-[#ff6500]/25' 
              : 'bg-[#2a2f36] hover:bg-[#363c45] text-[#b3b3b3] hover:text-white border-[#3a4048] hover:border-[#ff6500]/50'
            }
          `}
        >
          <span className="mr-2 text-lg">{region.flag}</span>
          <span className="hidden sm:inline">{region.name}</span>
          <span className="sm:hidden">{region.name.split(' ')[0]}</span>
        </Button>
      ))}
    </div>
  );
};
