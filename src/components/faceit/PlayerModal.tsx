
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Player, Match } from "@/types/Player";
import { useState, useEffect } from "react";
import { PasswordDialog } from "./PasswordDialog";
import { useFaceitApi } from "@/hooks/useFaceitApi";
import { PlayerHeader } from "./PlayerHeader";
import { PlayerStatsCards } from "./PlayerStatsCards";
import { MatchesTable } from "./MatchesTable";
import { PlayerActions } from "./PlayerActions";

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  isFriend: boolean;
}

export const PlayerModal = ({ 
  player, 
  isOpen, 
  onClose, 
  onAddFriend, 
  onRemoveFriend, 
  isFriend 
}: PlayerModalProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'remove' | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesStats, setMatchesStats] = useState<{[key: string]: any}>({});
  const { getPlayerMatches, getMatchDetails, getMatchStats } = useFaceitApi();

  // Load matches when player changes and modal is open
  useEffect(() => {
    if (player && isOpen) {
      loadPlayerMatches();
    }
  }, [player, isOpen]);

  const loadPlayerMatches = async () => {
    if (!player) return;
    
    setLoadingMatches(true);
    
    try {
      console.log('Loading matches for player:', player.player_id);
      
      const matchesData = await getPlayerMatches(player.player_id, 10);
      console.log('Matches data received:', matchesData);
      setMatches(matchesData);

      // Load detailed stats for each match
      if (matchesData.length > 0) {
        const statsPromises = matchesData.map(async (match: Match) => {
          try {
            console.log('Loading stats for match:', match.match_id);
            
            // Try to get match stats first
            const matchStats = await getMatchStats(match.match_id);
            if (matchStats) {
              console.log('Match stats response:', matchStats);
              return { [match.match_id]: matchStats };
            }
            
            // Fallback to match details
            const matchDetail = await getMatchDetails(match.match_id);
            if (matchDetail) {
              console.log('Match detail response:', matchDetail);
              return { [match.match_id]: matchDetail };
            }
          } catch (error) {
            console.error('Error loading match data:', error);
          }
          return {};
        });

        const statsResults = await Promise.all(statsPromises);
        const combinedStats = statsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        console.log('Combined match stats:', combinedStats);
        setMatchesStats(combinedStats);
      }

    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  if (!player) return null;

  const handleFriendAction = () => {
    if (isFriend) {
      setPendingAction('remove');
    } else {
      setPendingAction('add');
    }
    setShowPasswordDialog(true);
  };

  const confirmAction = () => {
    if (pendingAction === 'add') {
      onAddFriend(player);
    } else if (pendingAction === 'remove') {
      onRemoveFriend(player.player_id);
    }
    setPendingAction(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Profil Jucător - Detalii Complete
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Informații detaliate despre jucător și istoricul meciurilor recente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <PlayerHeader player={player} />
            <PlayerStatsCards player={player} />
            <MatchesTable 
              player={player} 
              matches={matches} 
              matchesStats={matchesStats} 
              loadingMatches={loadingMatches} 
            />
            <PlayerActions 
              player={player} 
              isFriend={isFriend} 
              onFriendAction={handleFriendAction} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPendingAction(null);
        }}
        onConfirm={confirmAction}
        title={pendingAction === 'add' ? 'Adaugă Prieten' : 'Șterge Prieten'}
        description={
          pendingAction === 'add' 
            ? `Vrei să adaugi ${player.nickname} în lista de prieteni?`
            : `Vrei să ștergi ${player.nickname} din lista de prieteni?`
        }
      />
    </>
  );
};
