
import { Button } from "@/components/ui/button";

interface RegionTabsProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
}

export const RegionTabs = ({ currentRegion, onRegionChange }: RegionTabsProps) => {
  const regions = [
    { id: 'EU', name: 'Europa', flag: '🇪🇺' },
    { id: 'NA', name: 'America de Nord', flag: '🇺🇸' },
    { id: 'SA', name: 'America de Sud', flag: '🇧🇷' },
    { id: 'OCE', name: 'Oceania', flag: '🇦🇺' },
    { id: 'FRIENDS', name: 'Prietenii Mei', flag: '👥' },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {regions.map((region) => (
        <Button
          key={region.id}
          variant={currentRegion === region.id ? "default" : "outline"}
          onClick={() => onRegionChange(region.id)}
          className={`
            px-6 py-3 text-sm font-medium transition-all duration-300 transform hover:scale-105
            ${currentRegion === region.id 
              ? region.id === 'FRIENDS'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg'
              : region.id === 'FRIENDS'
                ? 'border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white bg-white/5 backdrop-blur-sm'
                : 'border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white bg-white/5 backdrop-blur-sm'
            }
          `}
        >
          <span className="mr-2">{region.flag}</span>
          {region.name}
        </Button>
      ))}
    </div>
  );
};
