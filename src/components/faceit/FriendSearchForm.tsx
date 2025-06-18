
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

export const FriendSearchForm = React.memo(({ onPlayerFound }: FriendSearchFormProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { makeApiCall } = useFaceitApi();

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
        winRate: Math.round((parseInt(statsData.lifetime?.Wins) / parseInt(statsData.lifetime?.Matches)) * 100) || 0,
        hsRate: parseFloat(statsData.lifetime?.['Average Headshots %']) || 0,
        kdRatio: parseFloat(statsData.lifetime?.['Average K/D Ratio']) || 0,
      };

      onPlayerFound(player);
      setSearchTerm('');

    } catch (error) {
      toast({
        title: "Eroare la căutare",
        description: "Jucătorul nu a fost găsit sau a apărut o eroare.",
        variant: "destructive",
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
    <div className="mb-4 p-3 bg-[#2a2f36] rounded-lg border border-[#3a4048]">
      <div className="flex flex-col md:flex-row gap-3">
        <Input
          placeholder="Caută și adaugă prieteni..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="bg-[#1a1d21] border-[#3a4048] text-white placeholder:text-[#9f9f9f] focus:border-[#ff6500] rounded-lg h-8 text-sm"
        />
        <Button
          onClick={searchPlayer}
          disabled={loading || !searchTerm.trim()}
          size="sm"
          className="bg-[#ff6500] hover:bg-[#e55a00] text-white border-0 px-4 h-8 rounded-lg shadow-lg font-bold text-sm"
        >
          <UserPlus size={14} className="mr-2" />
          {loading ? 'Caută...' : 'Adaugă'}
        </Button>
      </div>
    </div>
  );
});

FriendSearchForm.displayName = 'FriendSearchForm';
