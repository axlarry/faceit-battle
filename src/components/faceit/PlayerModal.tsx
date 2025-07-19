import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Player, Match } from '@/types/Player';
import { PlayerHeader } from './PlayerHeader';
import { PlayerStatsCards } from './PlayerStatsCards';
import { MatchesTable } from './MatchesTable';
import { PlayerAnalyticsTab } from './PlayerAnalyticsTab';
import { PlayerGraphsTab } from './PlayerGraphsTab';
import { PlayerMapStatsTab } from './PlayerMapStatsTab';
import { Button } from '@/components/ui/button';
import { PasswordDialog } from './PasswordDialog';
import { useFaceitApi } from '@/hooks/useFaceitApi';
import { useFaceitAnalyser } from '@/hooks/useFaceitAnalyser';
import { playerMatchesService } from '@/services/playerMatchesService';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  isFriend: boolean;
  liveMatchInfo?: any;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  player,
  isOpen,
  onClose,
  onAddFriend,
  onRemoveFriend,
  isFriend,
  liveMatchInfo
}) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'remove' | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [matchStats, setMatchStats] = useState<{
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgKDRatio: number;
    avgHSPercentage: number;
  } | null>(null);

  const {
    getPlayerMatches,
    getMatchDetails,
    getMatchStats,
    checkPlayerLiveMatch
  } = useFaceitApi();

  // Use the new Faceit Analyser hook
  const { analyserData, isLoading: isLoadingAnalyser, error: analyserError, refetch } = useFaceitAnalyser(player);
  console.log('🎯 PlayerModal: player data for analyser:', { playerId: player?.player_id, nickname: player?.nickname, isOpen });

  // Load matches when player changes and modal is open
  useEffect(() => {
    if (player && isOpen) {
      loadPlayerMatches();
    }
  }, [player, isOpen]);

  const loadPlayerMatches = async () => {
    if (!player) return;
    setIsLoadingMatches(true);
    try {
      console.log('🎯 Loading matches for player:', player.player_id, player.nickname);

      // First check if player has a live match
      const liveInfo = await checkPlayerLiveMatch(player.player_id);
      let allMatches = [];

      // If player is live, add the live match at the beginning
      if (liveInfo.isLive && liveInfo.liveMatch) {
        console.log('Adding live match to matches list:', liveInfo.liveMatch);
        allMatches.push({
          ...liveInfo.liveMatch,
          isLiveMatch: true,
          liveMatchDetails: liveInfo.matchDetails
        });
      }

      // Load matches using the mock service since Faceit API is not working
      console.log('🎯 Using playerMatchesService for mock data');
      const matchesData = await playerMatchesService.getPlayerMatches(player.player_id, 10);
      console.log('🎯 Matches data received from service:', matchesData);

      // Transform mock data to the format expected by MatchesTable
      const transformedMatches = matchesData.map((match: any) => {
        const playerTeam = match.teams?.find((team: any) => 
          team.players?.some((p: any) => p.player_id === player.player_id)
        );
        const opponentTeam = match.teams?.find((team: any) => team.faction_id !== playerTeam?.faction_id);
        const playerStats = playerTeam?.players?.find((p: any) => p.player_id === player.player_id)?.player_stats;
        
        const playerScore = parseInt(playerTeam?.team_stats?.["Final Score"] || "0");
        const opponentScore = parseInt(opponentTeam?.team_stats?.["Final Score"] || "0");
        const won = playerScore > opponentScore;
        
        return {
          match_id: match.match_id,
          started_at: match.started_at,
          finished_at: match.finished_at,
          i18: won ? "1" : "0", // Win/Loss
          i6: playerStats?.["Kills"] || "0", // Kills
          i8: playerStats?.["Deaths"] || "0", // Deaths 
          i7: playerStats?.["Assists"] || "0", // Assists
          i10: playerStats?.["K/D Ratio"] || "0", // K/D Ratio
          i13: playerStats?.["Headshots %"] || "0", // HS%
          i14: playerStats?.["ADR"] || "0", // ADR
          team_stats: {
            team1: playerScore,
            team2: opponentScore
          },
          map: match.voting?.map?.pick?.[0] || "de_unknown"
        };
      });

      console.log('🎯 Transformed matches:', transformedMatches);

      // Filter out the live match if it's already in history to avoid duplicates
      const filteredMatches = liveInfo.isLive ? transformedMatches.filter((match: Match) => match.match_id !== liveInfo.matchId) : transformedMatches;

      // Combine live match with history
      allMatches = [...allMatches, ...filteredMatches];
      setMatches(allMatches);

      // Calculate match statistics
      if (allMatches.length > 0) {
        const stats = {
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: allMatches.length,
          winRate: 0,
          avgKills: 0,
          avgDeaths: 0,
          avgAssists: 0,
          avgKDRatio: 0,
          avgHSPercentage: 0
        };

        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;
        let totalHS = 0;
        let validMatches = 0;

        allMatches.forEach((match: any) => {
          if (match.isLiveMatch) return; // Skip live matches for stats

          if (match.i18 === '1') stats.wins++;
          else if (match.i18 === '0') stats.losses++;
          else stats.draws++;

          if (match.i6) {
            totalKills += parseInt(match.i6) || 0;
            validMatches++;
          }
          if (match.i8) totalDeaths += parseInt(match.i8) || 0;
          if (match.i7) totalAssists += parseInt(match.i7) || 0;
          if (match.i13) totalHS += parseFloat(match.i13) || 0;
        });

        if (validMatches > 0) {
          stats.avgKills = totalKills / validMatches;
          stats.avgDeaths = totalDeaths / validMatches;
          stats.avgAssists = totalAssists / validMatches;
          stats.avgKDRatio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
          stats.avgHSPercentage = totalHS / validMatches;
        }

        stats.winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;
        setMatchStats(stats);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('Failed to load player matches');
    } finally {
      setIsLoadingMatches(false);
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
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-y-auto">
          <DialogTitle className="sr-only">Player Details</DialogTitle>
          <div className="flex flex-col h-full">
            {/* Header Section */}
            <div className="flex-shrink-0 p-6 border-b bg-gradient-to-r from-background to-muted/20">
              <PlayerHeader player={player} />
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-3">
                  {analyserData && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Advanced Stats Available
                    </Badge>
                  )}
                  {analyserError && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Limited Stats
                    </Badge>
                  )}
                  {isLoadingAnalyser && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Loading Analytics
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {analyserData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetch}
                      disabled={isLoadingAnalyser}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAnalyser ? 'animate-spin' : ''}`} />
                      Refresh Analytics
                    </Button>
                  )}
                  <Button
                    variant={isFriend ? "destructive" : "default"}
                    onClick={handleFriendAction}
                    size="sm"
                  >
                    {isFriend ? "Remove Friend" : "Add Friend"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Tabs Section */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 pt-4 border-b">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="graphs">
                      Graphs
                    </TabsTrigger>
                    <TabsTrigger value="maps">
                      Maps
                    </TabsTrigger>
                    <TabsTrigger value="matches">Matches</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="overview" className="p-6 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                      <div>
                        <PlayerStatsCards 
                          player={player}
                        />
                      </div>
                      <div>
                        <PlayerAnalyticsTab 
                          player={player} 
                          analyserData={analyserData}
                          isLoading={isLoadingAnalyser}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="p-6 mt-0">
                    <PlayerAnalyticsTab 
                      player={player} 
                      analyserData={analyserData}
                      isLoading={isLoadingAnalyser}
                    />
                  </TabsContent>

                  <TabsContent value="graphs" className="p-6 mt-0">
                    <PlayerGraphsTab 
                      analyserData={analyserData}
                      isLoading={isLoadingAnalyser}
                    />
                  </TabsContent>

                  <TabsContent value="maps" className="p-6 mt-0">
                    <PlayerMapStatsTab 
                      analyserData={analyserData}
                      isLoading={isLoadingAnalyser}
                    />
                  </TabsContent>

                  <TabsContent value="matches" className="p-6 mt-0">
                    <MatchesTable 
                      matches={matches}
                      player={player}
                      matchesStats={{}}
                      loadingMatches={isLoadingMatches}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
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
        description={pendingAction === 'add' ? `Vrei să adaugi ${player.nickname} în lista de prieteni?` : `Vrei să ștergi ${player.nickname} din lista de prieteni?`} 
      />
    </>
  );
};