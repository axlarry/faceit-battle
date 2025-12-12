
import { useMemo } from "react";
import { Player } from "@/types/Player";
import { useLcryptApi } from "@/hooks/useLcryptApi";
import { ModernSkillCard } from "./ModernSkillCard";
import { ModernTodayCard } from "./ModernTodayCard";
import { getProxiedImageUrl } from "@/lib/discordProxy";

interface PlayerHeaderProps {
  player: Player;
  isFriend?: boolean;
}

export const PlayerHeader = ({ player, isFriend = false }: PlayerHeaderProps) => {
  const { data: lcryptData } = useLcryptApi(player.nickname);

  // Proxy images for Discord Activity
  const proxiedCoverImage = useMemo(() => {
    return player.cover_image ? getProxiedImageUrl(player.cover_image) : null;
  }, [player.cover_image]);

  const proxiedAvatar = useMemo(() => {
    return getProxiedImageUrl(player.avatar);
  }, [player.avatar]);

  return (
    <div className="relative text-center space-y-6 rounded-2xl overflow-hidden">
      {/* Background Cover Image */}
      {proxiedCoverImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${proxiedCoverImage})`,
            }}
          />
          {/* Uniform dark overlay - no gradient to avoid bright streak */}
          <div className="absolute inset-0 bg-black/75" />
        </>
      )}
      
      {/* Content - positioned above background */}
      <div className="relative z-10 p-6">
        <img
          src={proxiedAvatar}
          alt={player.nickname}
          loading="lazy"
          className="w-28 h-28 rounded-full border-4 border-orange-400 mx-auto animate-fade-in"
        />
        <div>
          <h2 className="text-3xl font-bold text-white">{player.nickname}</h2>
          {player.position && (
            <p className="text-orange-400 font-medium text-lg">#{player.position} în clasament</p>
          )}
        </div>
        
        {/* Modern Enhanced Cards */}
        {isFriend ? (
          <div className="grid grid-cols-2 gap-6">
            <ModernSkillCard player={player} lcryptData={lcryptData} />
            <ModernTodayCard player={player} lcryptData={lcryptData} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Level Card for non-friends */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
              <div className="text-3xl font-bold text-orange-400 mb-2">{player.level}</div>
              <div className="text-gray-400 text-base">Skill Level</div>
            </div>
            
            {/* Basic ELO Card for non-friends */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
              <div className="text-3xl font-bold text-blue-400 mb-2">{player.elo}</div>
              <div className="text-gray-400 text-base">ELO Points</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
