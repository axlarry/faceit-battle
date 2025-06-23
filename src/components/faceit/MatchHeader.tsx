
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { useState } from "react";

interface MatchHeaderProps {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  isWin: boolean | null;
  mapName?: string;
}

export const MatchHeader = ({ 
  team1Name, 
  team2Name, 
  team1Score, 
  team2Score, 
  isWin,
  mapName = 'Unknown'
}: MatchHeaderProps) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  // Function to get large map image URL from local assets
  const getMapImageUrl = (mapName: string) => {
    if (!mapName || mapName === 'Unknown') return null;
    
    // Clean and normalize the map name
    const cleanMapName = mapName.toLowerCase().trim();
    
    // Common map name mappings for large map images
    const mapMappings: { [key: string]: string } = {
      'de_dust2': 'de_dust2.png',
      'dust2': 'de_dust2.png',
      'de_mirage': 'de_mirage.png',
      'mirage': 'de_mirage.png',
      'de_inferno': 'de_inferno.png',
      'inferno': 'de_inferno.png',
      'de_cache': 'de_cache.png',
      'cache': 'de_cache.png',
      'de_overpass': 'de_overpass.png',
      'overpass': 'de_overpass.png',
      'de_cobblestone': 'de_cbble.png',
      'cobblestone': 'de_cbble.png',
      'de_cbble': 'de_cbble.png',
      'de_train': 'de_train.png',
      'train': 'de_train.png',
      'de_nuke': 'de_nuke.png',
      'nuke': 'de_nuke.png',
      'de_vertigo': 'de_vertigo.png',
      'vertigo': 'de_vertigo.png',
      'de_ancient': 'de_ancient.png',
      'ancient': 'de_ancient.png',
      'de_anubis': 'de_anubis.png',
      'anubis': 'de_anubis.png',
      'cs_office': 'cs_office.png',
      'office': 'cs_office.png',
      'cs_agency': 'cs_agency.png',
      'agency': 'cs_agency.png'
    };
    
    const imageFileName = mapMappings[cleanMapName];
    if (imageFileName) {
      return `/faceit-icons/${imageFileName}`;
    }
    
    return null;
  };

  const mapImageUrl = getMapImageUrl(mapName);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Map Background Image */}
      {mapImageUrl && !imageLoadError && (
        <div className="relative h-32 overflow-hidden">
          <img 
            src={mapImageUrl}
            alt={mapName}
            className="w-full h-full object-cover opacity-30"
            onError={() => setImageLoadError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-800/90 to-transparent" />
          <div className="absolute top-4 left-6">
            <span className="text-white font-bold text-lg bg-black/50 px-3 py-1 rounded">
              {mapName.toUpperCase()}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          {/* Team 1 */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-white mb-1">{team1Name}</div>
              <div className="text-slate-400 text-sm">Team</div>
            </div>
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-slate-400" />
            </div>
          </div>

          {/* Match Score & Status */}
          <div className="text-center px-8">
            <div className="flex items-center gap-4 mb-2">
              <div className={`text-4xl font-bold ${team1Score > team2Score ? 'text-green-400' : 'text-red-400'}`}>
                {team1Score}
              </div>
              <div className="text-2xl text-slate-400">:</div>
              <div className={`text-4xl font-bold ${team2Score > team1Score ? 'text-green-400' : 'text-red-400'}`}>
                {team2Score}
              </div>
            </div>
            <Badge className={`${
              isWin 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            } border font-semibold px-4 py-1`}>
              {isWin ? 'VICTORY' : 'DEFEAT'}
            </Badge>
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white mb-1">{team2Name}</div>
              <div className="text-slate-400 text-sm">Team</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
