
import { Trophy, Crown } from 'lucide-react';

interface MatchHeaderProps {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  isWin: boolean;
  mapName: string;
}

export const MatchHeader = ({ 
  team1Name, 
  team2Name, 
  team1Score, 
  team2Score, 
  isWin,
  mapName 
}: MatchHeaderProps) => {
  const getMapImage = (mapName: string) => {
    if (!mapName || mapName === 'N/A') return '/faceit-icons/background.webp';
    
    const mapImages: { [key: string]: string } = {
      'de_dust2': '/faceit-icons/de_dust2.png',
      'de_mirage': '/faceit-icons/de_mirage.png',
      'de_inferno': '/faceit-icons/de_inferno.png',
      'de_cache': '/faceit-icons/de_cache.png',
      'de_overpass': '/faceit-icons/de_overpass.png',
      'de_train': '/faceit-icons/de_train.png',
      'de_nuke': '/faceit-icons/de_nuke.png',
      'de_vertigo': '/faceit-icons/de_vertigo.png',
      'de_ancient': '/faceit-icons/de_ancient.png',
      'de_anubis': '/faceit-icons/de_anubis.png',
      'cs_office': '/faceit-icons/cs_office.png',
      'cs_agency': '/faceit-icons/cs_agency.png'
    };
    
    return mapImages[mapName.toLowerCase()] || '/faceit-icons/background.webp';
  };

  return (
    <div className="relative rounded-2xl overflow-hidden h-32 md:h-40 flex items-center justify-center">
      {/* Background Image with improved visibility */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{
          backgroundImage: `url(${getMapImage(mapName)})`,
        }}
      />
      
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/70" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4">
        {/* Win/Loss Status */}
        <div className="flex items-center justify-center mb-2 md:mb-3">
          {isWin ? (
            <div className="flex items-center text-green-400">
              <Crown className="w-5 h-5 md:w-6 md:h-6 mr-2 animate-crown-bounce" />
              <span className="text-lg md:text-xl font-bold">VICTORIE</span>
              <Crown className="w-5 h-5 md:w-6 md:h-6 ml-2 animate-crown-bounce" />
            </div>
          ) : (
            <div className="flex items-center text-red-400">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              <span className="text-lg md:text-xl font-bold">ÎNFRÂNGERE</span>
              <Trophy className="w-5 h-5 md:w-6 md:h-6 ml-2" />
            </div>
          )}
        </div>
        
        {/* Team vs Team with Score */}
        <div className="text-xl md:text-3xl font-bold">
          <span className="text-blue-400">{team1Name}</span>
          <span className="mx-2 md:mx-4 text-orange-400">
            {team1Score} - {team2Score}
          </span>
          <span className="text-red-400">{team2Name}</span>
        </div>
        
        {/* Map Name */}
        <div className="text-sm md:text-base text-gray-300 mt-1 md:mt-2 capitalize">
          {mapName && mapName !== 'N/A' ? mapName.replace('de_', '').replace('cs_', '') : 'Hartă Necunoscută'}
        </div>
      </div>
    </div>
  );
};
