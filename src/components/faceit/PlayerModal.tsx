
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Player } from '@/types/Player';
import { PlayerHeader } from './PlayerHeader';
import { PlayerStatsCards } from './PlayerStatsCards';
import { MatchesTable } from './MatchesTable';
import { PlayerAnalyticsTab } from './PlayerAnalyticsTab';
import { PlayerGraphsTab } from './PlayerGraphsTab';
import { PlayerMapStatsTab } from './PlayerMapStatsTab';
import { Button } from '@/components/ui/button';
import { PasswordDialog } from './PasswordDialog';
import { useFaceitAnalyser } from '@/hooks/useFaceitAnalyser';
import { usePlayerMatches } from '@/hooks/usePlayerMatches';
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
  const [activeTab, setActiveTab] = useState('overview');

  // Use the new Faceit Analyser hook
  const { analyserData, isLoading: isLoadingAnalyser, error: analyserError, refetch } = useFaceitAnalyser(player);
  
  // Use the new player matches hook
  const { matches, isLoadingMatches, matchStats, playerStats, isLoadingStats, reloadMatches } = usePlayerMatches(player, isOpen);
  
  console.log('🎯 PlayerModal: player data for analyser:', { playerId: player?.player_id, nickname: player?.nickname, isOpen });


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
                    onClick={() => {
                      refetch();
                      reloadMatches();
                    }}
                    disabled={isLoadingAnalyser || isLoadingMatches}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAnalyser || isLoadingMatches ? 'animate-spin' : ''}`} />
                    Refresh Data
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
                        <PlayerStatsCards player={player} playerStats={playerStats} isLoading={isLoadingStats} />
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
