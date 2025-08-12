import { 
  Map, 
  Clock, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { formatDate, formatMatchDuration } from "@/utils/matchUtils";
import { useState } from "react";

interface MatchInfoProps {
  mapName: string;
  startedAt: number;
  finishedAt: number;
  eloChange: any;
}

export const MatchInfo = ({ mapName, startedAt, finishedAt, eloChange }: MatchInfoProps) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  // Function to get map icon URL from local assets
  const getMapIconUrl = (mapName: string) => {
    if (!mapName || mapName === 'Unknown') return null;
    
    // Clean and normalize the map name
    const cleanMapName = mapName.toLowerCase().trim();
    
    // Common map name mappings for icon files
    const mapMappings: { [key: string]: string } = {
      'de_dust2': 'icon_de_dust2.png',
      'dust2': 'icon_de_dust2.png',
      'de_mirage': 'icon_de_mirage.png',
      'mirage': 'icon_de_mirage.png',
      'de_inferno': 'icon_de_inferno.png',
      'inferno': 'icon_de_inferno.png',
      'de_cache': 'icon_de_cache.png',
      'cache': 'icon_de_cache.png',
      'de_overpass': 'icon_de_overpass.png',
      'overpass': 'icon_de_overpass.png',
      'de_cobblestone': 'icon_de_cbble.png',
      'cobblestone': 'icon_de_cbble.png',
      'de_cbble': 'icon_de_cbble.png',
      'de_train': 'icon_de_train.png',
      'train': 'icon_de_train.png',
      'de_nuke': 'icon_de_nuke.png',
      'nuke': 'icon_de_nuke.png',
      'de_vertigo': 'icon_de_vertigo.png',
      'vertigo': 'icon_de_vertigo.png',
      'de_ancient': 'icon_de_ancient.png',
      'ancient': 'icon_de_ancient.png',
      'de_anubis': 'icon_de_anubis.png',
      'anubis': 'icon_de_anubis.png',
      'cs_office': 'icon_cs_office.png',
      'office': 'icon_cs_office.png',
      'cs_agency': 'icon_cs_agency.png',
      'agency': 'icon_cs_agency.png',
      'cs_italy': 'icon_cs_italy.png',
      'italy': 'icon_cs_italy.png'
    };
    
    const iconFileName = mapMappings[cleanMapName];
    if (iconFileName) {
      return `/faceit-icons/${iconFileName}`;
    }
    
    return null;
  };

  const mapIconUrl = getMapIconUrl(mapName);

  return (
    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700">
      <div className="flex items-center gap-2">
        <div className="w-10 h-7 rounded overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-700">
          {mapIconUrl && !imageLoadError ? (
            <img 
              src={mapIconUrl} 
              alt={mapName} 
              loading="lazy"
              onError={() => setImageLoadError(true)}
              className="w-full h-full object-scale-down" 
            />
          ) : (
            <Map className="w-4 h-4 text-orange-400" />
          )}
        </div>
        <div>
          <div className="text-slate-400 text-xs">Map</div>
          <div className="text-white font-semibold">{mapName}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-400" />
        <div>
          <div className="text-slate-400 text-xs">Date</div>
          <div className="text-white font-semibold text-sm">{formatDate(startedAt)}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-green-400" />
        <div>
          <div className="text-slate-400 text-xs">Duration</div>
          <div className="text-white font-semibold">{formatMatchDuration(startedAt, finishedAt)}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {eloChange && typeof eloChange.elo_change === 'number' ? (
          eloChange.elo_change > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : eloChange.elo_change < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-400" />
          ) : (
            <Minus className="w-4 h-4 text-slate-400" />
          )
        ) : (
          <Minus className="w-4 h-4 text-slate-400" />
        )}
        <div>
          <div className="text-slate-400 text-xs">ELO Change</div>
          <div className={`font-semibold ${
            eloChange && typeof eloChange.elo_change === 'number' ? (
              eloChange.elo_change > 0 ? 'text-green-400' : 
              eloChange.elo_change < 0 ? 'text-red-400' : 'text-slate-400'
            ) : 'text-slate-400'
          }`}>
            {eloChange && typeof eloChange.elo_change === 'number' ? (
              `${eloChange.elo_change > 0 ? '+' : ''}${eloChange.elo_change}`
            ) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};
