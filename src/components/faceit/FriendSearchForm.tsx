import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { Player } from "@/types/Player";
import { toast } from "@/hooks/use-toast";
import { useFaceitApi } from "@/hooks/useFaceitApi";
interface FriendSearchFormProps {
  onPlayerFound: (player: Player) => void;
}
export const FriendSearchForm = React.memo(({
  onPlayerFound
}: FriendSearchFormProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    makeApiCall
  } = useFaceitApi();
  const searchPlayer = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const playerData = await makeApiCall(`/players?nickname=${encodeURIComponent(searchTerm.trim())}`);
      const statsData = await makeApiCall(`/players/${playerData.player_id}/stats/cs2`);
      const player: Player = {
        player_id: playerData.player_id,
        nickname: playerData.nickname,
        avatar: playerData.avatar || '/placeholder.svg',
        level: playerData.games?.cs2?.skill_level || 0,
        elo: playerData.games?.cs2?.faceit_elo || 0,
        wins: parseInt(statsData.lifetime?.Wins) || 0,
        winRate: Math.round(parseInt(statsData.lifetime?.Wins) / parseInt(statsData.lifetime?.Matches) * 100) || 0,
        hsRate: parseFloat(statsData.lifetime?.['Average Headshots %']) || 0,
        kdRatio: parseFloat(statsData.lifetime?.['Average K/D Ratio']) || 0
      };
      onPlayerFound(player);
      setSearchTerm('');
    } catch (error) {
      toast({
        title: "Eroare la căutare",
        description: "Jucătorul nu a fost găsit sau a apărut o eroare.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPlayer();
    }
  };
  return (
    <div className="flex w-full items-center gap-2">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Caută jucător FACEIT"
        aria-label="Caută jucător FACEIT"
        disabled={loading}
      />
      <Button
        onClick={searchPlayer}
        disabled={loading || !searchTerm.trim()}
        aria-label="Adaugă prieten"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {loading ? 'Caut...' : 'Adaugă'}
      </Button>
    </div>
  );
});
FriendSearchForm.displayName = 'FriendSearchForm';