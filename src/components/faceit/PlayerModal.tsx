import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Player, Match } from "@/types/Player";
import { useState, useEffect } from "react";
import { PasswordDialog } from "./PasswordDialog";
import { useFaceitApi } from "@/hooks/useFaceitApi";
import { PlayerHeader } from "./PlayerHeader";
import { PlayerStatsCards } from "./PlayerStatsCards";
import { MatchesTable } from "./MatchesTable";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  isFriend: boolean;
  liveMatchInfo?: any;
}
export const PlayerModal = ({
  player,
  isOpen,
  onClose,
  onAddFriend,
  onRemoveFriend,
  isFriend,
  liveMatchInfo
}: PlayerModalProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'remove' | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesStats, setMatchesStats] = useState<{
    [key: string]: any;
  }>({});
  const {
    getPlayerMatches,
    getMatchDetails,
    getMatchStats,
    checkPlayerLiveMatch
  } = useFaceitApi();

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

      // First check if player has a live match
      const liveInfo = await checkPlayerLiveMatch(player.player_id);
      let allMatches = [];

      // If player is live, add the live match at the beginning
      if (liveInfo.isLive && liveInfo.liveMatch) {
        console.log('Adding live match to matches list:', liveInfo.liveMatch);
        allMatches.push({
          ...liveInfo.liveMatch,
          isLiveMatch: true,
          // Mark as live match
          liveMatchDetails: liveInfo.matchDetails
        });
      }

      // Load regular match history from FaceitAnalyser
      const matchesData = await getPlayerMatches(player.player_id, 10);
      console.log('Matches data received:', matchesData);

      // Transform FaceitAnalyser match data to our format
      const transformedMatches = matchesData.map((match: any) => ({
        match_id: match.matchId || match._id?.matchId,
        status: match.status || 'finished',
        started_at: match.date ? new Date(match.date).getTime() : Date.now(),
        finished_at: match.updated_at || Date.now(),
        
        // Add FaceitAnalyser fields directly to match object
        k: match.k || match.i6,
        d: match.d || match.i8,
        a: match.a || match.i7,
        kdr: match.kdr || match.c3,
        i6: match.i6, // kills
        i7: match.i7, // assists  
        i8: match.i8, // deaths
        i9: match.i9, // mvps
        i13: match.i13, // headshots
        c2: match.c2, // krr
        c3: match.c3, // kdr
        c4: match.c4, // headshot %
        
        // Map data
        match_details: {
          map: match.map || match.i1,
          score_team1: parseInt(match.i3 || '0'),
          score_team2: parseInt(match.i4 || '0'),
          rounds_played: parseInt(match.i12 || '0')
        },
        
        // ELO data
        elo_change: {
          player_id: player.player_id,
          elo_before: 0,
          elo_after: 0,
          elo_change: parseInt(match.elod || '0')
        }
      }));

      // Filter out the live match if it's already in history to avoid duplicates
      const filteredMatches = liveInfo.isLive ? transformedMatches.filter((match: Match) => match.match_id !== liveInfo.matchId) : transformedMatches;

      // Combine live match with history
      allMatches = [...allMatches, ...filteredMatches];
      setMatches(allMatches);

      // For FaceitAnalyser, we already have the stats in the match data
      // No need to make additional API calls for match stats
      const combinedStats = allMatches.reduce((acc, match) => {
        if (match.isLiveMatch) {
          return {
            ...acc,
            [match.match_id]: {
              isLive: true,
              ...match.liveMatchDetails
            }
          };
        }
        
        // Create stats object from FaceitAnalyser match data
        return {
          ...acc,
          [match.match_id]: {
            // Mock stats object that matches expected format
            rounds: [{
              teams: {
                team1: {
                  players: [{
                    player_id: player.player_id,
                    player_stats: {
                      Kills: match.k || match.i6 || '0',
                      Deaths: match.d || match.i8 || '0',
                      Assists: match.a || match.i7 || '0',
                      'K/D Ratio': match.kdr || match.c3 || '0',
                      'K/R Ratio': match.c2 || '0',
                      'Headshots %': match.c4 || '0',
                      Headshots: match.i13 || '0',
                      MVPs: match.i9 || '0',
                      'Average Damage per Round': '0' // Not available in FaceitAnalyser
                    }
                  }]
                }
              }
            }]
          }
        };
      }, {});
      
      console.log('Combined match stats from FaceitAnalyser:', combinedStats);
      setMatchesStats(combinedStats);
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
  return <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-orange-500/30 text-white w-[95vw] max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl shadow-orange-500/20 rounded-2xl">
          
          
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 pb-6 scrollbar-hide">
            <div className="space-y-4 sm:space-y-6 py-4">
              <PlayerHeader player={player} />
              <PlayerStatsCards player={player} />
              <MatchesTable player={player} matches={matches} matchesStats={matchesStats} loadingMatches={loadingMatches} />
              
              {/* Friend Action Button */}
              <div className="flex justify-center pt-4">
                <Button onClick={handleFriendAction} className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base w-full sm:w-auto ${isFriend ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} text-white border-0 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105`}>
                  {isFriend ? <>
                      <UserMinus size={16} className="mr-2" />
                      Șterge din Prieteni
                    </> : <>
                      <UserPlus size={16} className="mr-2" />
                      Adaugă la Prieteni
                    </>}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordDialog isOpen={showPasswordDialog} onClose={() => {
      setShowPasswordDialog(false);
      setPendingAction(null);
    }} onConfirm={confirmAction} title={pendingAction === 'add' ? 'Adaugă Prieten' : 'Șterge Prieten'} description={pendingAction === 'add' ? `Vrei să adaugi ${player.nickname} în lista de prieteni?` : `Vrei să ștergi ${player.nickname} din lista de prieteni?`} />
    </>;
};