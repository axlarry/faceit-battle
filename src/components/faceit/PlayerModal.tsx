
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

  // Debug matches data
  useEffect(() => {
    console.log('🎯 Matches state updated:', { 
      matchesCount: matches.length, 
      matches: matches, 
      isLoadingMatches,
      player: player?.nickname 
    });
  }, [matches, isLoadingMatches]);

  const loadPlayerMatches = async () => {
    if (!player) return;
    
    console.log('🎯 Starting loadPlayerMatches for:', player.nickname, player.player_id);
    setIsLoadingMatches(true);
    
    try {
      // Fetch 10 matches instead of 5
      console.log('🎯 Calling playerMatchesService for 10 matches');
      const matchesData = await playerMatchesService.getPlayerMatches(player.player_id, 10);
      console.log('🎯 Raw service response:', matchesData);
      console.log('🎯 First match structure:', matchesData?.[0]);
      console.log('🎯 Response type and length:', { 
        isArray: Array.isArray(matchesData), 
        length: matchesData?.length,
        type: typeof matchesData 
      });

      // Check if we got the expected structure - API returns array directly
      if (!matchesData || !Array.isArray(matchesData) || matchesData.length === 0) {
        console.log('❌ No valid matches data received');
        setMatches([]);
        setMatchStats(null);
        return;
      }

      console.log('🎯 Processing matches data:', matchesData.length, 'matches');

      // Transform matches to the format expected by MatchesTable
      const transformedMatches = matchesData.map((match: any, index: number) => {
        console.log(`🎯 Processing match ${index}:`, match);
        
        try {
          let playerTeam, opponentTeam, playerStats;
          
          if (Array.isArray(match.teams)) {
            // Mock data format - teams as array
            console.log('🎯 Processing mock data format (teams as array)');
            playerTeam = match.teams?.find((team: any) => 
              team.players?.some((p: any) => p.player_id === player.player_id)
            );
            opponentTeam = match.teams?.find((team: any) => team.faction_id !== playerTeam?.faction_id);
            playerStats = playerTeam?.players?.find((p: any) => p.player_id === player.player_id)?.player_stats;
            console.log('🎯 Mock - Player stats found:', playerStats);
          } else if (match.teams && typeof match.teams === 'object') {
            // Real API format - teams as object with faction1/faction2
            console.log('🎯 Processing real API format (teams as object)');
            console.log('🎯 Match teams structure:', match.teams);
            
            const teamsArray = Object.values(match.teams);
            console.log('🎯 Teams array:', teamsArray);
            
            playerTeam = teamsArray.find((team: any) => 
              team.players?.some((p: any) => p.player_id === player.player_id)
            );
            console.log('🎯 Found player team:', playerTeam);
            
            opponentTeam = teamsArray.find((team: any) => team !== playerTeam);
            
            // For real API data, we need to get stats differently
            const playerData = playerTeam?.players?.find((p: any) => p.player_id === player.player_id);
            console.log('🎯 Found player data:', playerData);
            
            playerStats = playerData?.player_stats || {};
            console.log('🎯 API - Player stats found:', playerStats);
            console.log('🎯 API - Player stats keys:', Object.keys(playerStats));
          }
          
          // Get scores - handle both formats
          let playerScore = 0, opponentScore = 0;
          
          if (match.results?.score) {
            // Real API format
            const scores = Object.values(match.results.score);
            const factionKey = Object.keys(match.teams || {}).find(key => 
              (match.teams as any)[key].players?.some((p: any) => p.player_id === player.player_id)
            );
            
            if (factionKey && match.results.score[factionKey] !== undefined) {
              playerScore = match.results.score[factionKey];
              const opponentKey = Object.keys(match.results.score).find(k => k !== factionKey);
              opponentScore = opponentKey ? match.results.score[opponentKey] : 0;
            }
          } else {
            // Mock format
            playerScore = parseInt(playerTeam?.team_stats?.["Final Score"] || "0");
            opponentScore = parseInt(opponentTeam?.team_stats?.["Final Score"] || "0");
          }
          
          const won = playerScore > opponentScore;
          
          const transformed = {
            match_id: match.match_id,
            started_at: match.started_at,
            finished_at: match.finished_at,
            competition_name: match.competition_name || "Europe 5v5 Queue",
            competition_type: match.competition_type || "matchmaking",
            game_mode: match.game_mode || "5v5",
            max_players: match.max_players || 10,
            teams: match.teams || [],
            teams_size: match.teams_size || 5,
            status: match.status || "finished",
            results: {
              winner: won ? "faction1" : "faction2",
              score: {
                faction1: playerScore,
                faction2: opponentScore
              }
            },
            // Include specific player data in the transformed match for easy access
            playerStats: playerStats,
            // For compatibility with MatchRow utils
            i18: won ? "1" : "0", // Win/Loss
            i6: playerStats?.["Kills"] || playerStats?.kills || "0", // Kills
            i8: playerStats?.["Deaths"] || playerStats?.deaths || "0", // Deaths 
            i7: playerStats?.["Assists"] || playerStats?.assists || "0", // Assists
            i10: playerStats?.["K/D Ratio"] || playerStats?.kd_ratio || "0", // K/D Ratio
            i13: playerStats?.["Headshots %"] || playerStats?.headshots_percentage || "0", // HS%
            i14: playerStats?.["ADR"] || playerStats?.adr || "0", // ADR
            team_stats: {
              team1: playerScore,
              team2: opponentScore
            },
            map: match.voting?.map?.pick?.[0] || match.i1 || "de_unknown"
          } as Match;
          
          console.log(`✅ Transformed match ${index}:`, transformed);
          return transformed;
        } catch (error) {
          console.error('🚨 Error transforming match:', error, match);
          return null;
        }
      }).filter(Boolean); // Remove null entries

      // Filter out matches with obsolete maps that are no longer in CS2
      const obsoleteMaps = ['de_cache', 'de_cobblestone', 'de_cbble', 'cs_office', 'cs_agency', 'cs_italy'];
      const filteredMatches = transformedMatches.filter((match: any) => {
        const mapName = match.map || match.voting?.map?.pick?.[0] || match.i1 || '';
        const isObsolete = obsoleteMaps.includes(mapName?.toLowerCase());
        if (isObsolete) {
          console.log('❌ Filtering out match with obsolete map:', mapName, 'Match ID:', match.match_id);
        }
        return !isObsolete;
      });

      console.log('🎯 Final filtered matches:', filteredMatches.length, 'matches (filtered from', transformedMatches.length, ')');
      setMatches(filteredMatches);

      // Calculate match statistics on filtered matches
      if (filteredMatches.length > 0) {
        const stats = {
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: filteredMatches.length,
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

        filteredMatches.forEach((match: any) => {
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
        console.log('📊 Match statistics:', stats);
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
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="graphs">Graphs</TabsTrigger>
                    <TabsTrigger value="maps">Maps</TabsTrigger>
                    <TabsTrigger value="matches">Matches</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="overview" className="p-6 mt-0">
                    <div className="space-y-6">
                      {/* Quick Stats Cards */}
                      <div>
                        <h3 className="text-lg font-bold text-white mb-4">Quick Stats Overview</h3>
                        <PlayerStatsCards player={player} />
                      </div>
                      
                      {/* Recent Performance Summary */}
                      {matchStats && (
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-md font-semibold text-white mb-3">Recent Performance ({matchStats.totalMatches} matches)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400">{matchStats.wins}</div>
                              <div className="text-sm text-gray-400">Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-400">{matchStats.losses}</div>
                              <div className="text-sm text-gray-400">Losses</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-400">{matchStats.winRate.toFixed(1)}%</div>
                              <div className="text-sm text-gray-400">Win Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-400">{matchStats.avgKDRatio.toFixed(2)}</div>
                              <div className="text-sm text-gray-400">Avg K/D</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Recent Matches Preview (show last 3-5) */}
                      {matches.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-white mb-3">Recent Matches Preview</h4>
                          <MatchesTable 
                            matches={matches.slice(0, 5)}
                            player={player}
                            matchesStats={{}}
                            loadingMatches={isLoadingMatches}
                          />
                          {matches.length > 5 && (
                            <div className="text-center mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setActiveTab('matches')}
                              >
                                View All {matches.length} Matches
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
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
