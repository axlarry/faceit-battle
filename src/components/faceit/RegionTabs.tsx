
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
    <div className="flex flex-wrap gap-4 justify-center p-6">
      {regions.map((region) => (
        <Button
          key={region.id}
          variant={currentRegion === region.id ? "default" : "outline"}
          onClick={() => onRegionChange(region.id)}
          className={`
            px-8 py-4 text-base font-semibold transition-all duration-300 transform hover:scale-105
            rounded-xl shadow-lg backdrop-blur-lg border-2
            ${currentRegion === region.id 
              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-transparent shadow-2xl shadow-purple-500/30' 
              : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-xl'
            }
          `}
        >
          <span className="mr-3 text-xl">{region.flag}</span>
          {region.name}
        </Button>
      ))}
    </div>
  );
};
