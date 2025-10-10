import { useState, useMemo } from 'react';
import { Player } from '@/types/Player';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamBalancerProps {
  friends: Player[];
}

interface BalancedTeams {
  team1: Player[];
  team2: Player[];
  team1AvgElo: number;
  team2AvgElo: number;
}

function balanceTeams(selectedPlayers: Player[]): BalancedTeams | null {
  if (selectedPlayers.length !== 10) return null;

  // Sort by ELO descending
  const sorted = [...selectedPlayers].sort((a, b) => (b.elo || 0) - (a.elo || 0));
  
  const team1: Player[] = [];
  const team2: Player[] = [];
  
  // Snake draft: 1,2,2,1,1,2,2,1,1,2
  const draftOrder = [1, 2, 2, 1, 1, 2, 2, 1, 1, 2];
  
  draftOrder.forEach((teamNum, index) => {
    if (teamNum === 1) {
      team1.push(sorted[index]);
    } else {
      team2.push(sorted[index]);
    }
  });

  const team1AvgElo = team1.reduce((sum, p) => sum + (p.elo || 0), 0) / team1.length;
  const team2AvgElo = team2.reduce((sum, p) => sum + (p.elo || 0), 0) / team2.length;

  return { team1, team2, team1AvgElo, team2AvgElo };
}

export const TeamBalancer = ({ friends }: TeamBalancerProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [balancedTeams, setBalancedTeams] = useState<BalancedTeams | null>(null);

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));
  }, [friends]);

  const handleTogglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      if (newSelected.size < 10) {
        newSelected.add(playerId);
      }
    }
    setSelectedIds(newSelected);
    setBalancedTeams(null);
  };

  const handleScramble = () => {
    const selectedPlayers = sortedFriends.filter(f => selectedIds.has(f.player_id));
    const result = balanceTeams(selectedPlayers);
    setBalancedTeams(result);
  };

  const selectedCount = selectedIds.size;
  const canBalance = selectedCount === 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Team Balancer 5v5
        </h2>
        <p className="text-muted-foreground">
          Selectează 10 prieteni pentru a crea echipe echilibrate
        </p>
      </div>

      {/* Selection Counter */}
      <div className="flex justify-center">
        <Badge variant={selectedCount === 10 ? "default" : "secondary"} className="text-lg px-6 py-2">
          <Users className="mr-2 h-5 w-5" />
          {selectedCount} / 10 selectați
        </Badge>
      </div>

      {!canBalance && selectedCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selectează exact 10 jucători pentru a putea balansa echipele.
          </AlertDescription>
        </Alert>
      )}

      {/* Friends Selection */}
      {!balancedTeams && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedFriends.map((friend) => {
              const isSelected = selectedIds.has(friend.player_id);
              const isDisabled = !isSelected && selectedCount >= 10;

              return (
                <div
                  key={friend.player_id}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border transition-all
                    ${isSelected 
                      ? 'bg-primary/10 border-primary shadow-md' 
                      : isDisabled
                        ? 'bg-muted/30 border-border/50 opacity-50 cursor-not-allowed'
                        : 'bg-card border-border hover:border-primary/50 cursor-pointer'
                    }
                  `}
                  onClick={() => !isDisabled && handleTogglePlayer(friend.player_id)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => handleTogglePlayer(friend.player_id)}
                  />
                  
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={friend.avatar} alt={friend.nickname} />
                    <AvatarFallback>{friend.nickname[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="font-semibold">{friend.nickname}</div>
                    <div className="text-sm text-muted-foreground">
                      ELO: {friend.elo || 'N/A'} • Level {friend.level || 0}
                    </div>
                  </div>

                  {friend.level && (
                    <img
                      src={`/faceit-icons/skill-level-${friend.level}.png`}
                      alt={`Level ${friend.level}`}
                      className="h-8 w-8"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {canBalance && (
            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={handleScramble}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Shuffle className="mr-2 h-5 w-5" />
                Balansează Echipele
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Balanced Teams Display */}
      {balancedTeams && (
        <div className="space-y-6">
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              onClick={handleScramble}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Shuffle className="mr-2 h-5 w-5" />
              Re-Scramble
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setBalancedTeams(null)}
            >
              Selectare Nouă
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team 1 */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-blue-400">Team 1</h3>
                  <Badge variant="outline" className="text-lg border-blue-400 text-blue-400">
                    AVG ELO: {Math.round(balancedTeams.team1AvgElo)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {balancedTeams.team1.map((player, idx) => (
                    <div
                      key={player.player_id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-blue-500/20"
                    >
                      <div className="text-lg font-bold text-muted-foreground w-6">
                        {idx + 1}
                      </div>
                      
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={player.avatar} alt={player.nickname} />
                        <AvatarFallback>{player.nickname[0]}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="font-semibold">{player.nickname}</div>
                        <div className="text-sm text-muted-foreground">
                          ELO: {player.elo || 'N/A'}
                        </div>
                      </div>

                      {player.level && (
                        <img
                          src={`/faceit-icons/skill-level-${player.level}.png`}
                          alt={`Level ${player.level}`}
                          className="h-8 w-8"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Team 2 */}
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-orange-400">Team 2</h3>
                  <Badge variant="outline" className="text-lg border-orange-400 text-orange-400">
                    AVG ELO: {Math.round(balancedTeams.team2AvgElo)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {balancedTeams.team2.map((player, idx) => (
                    <div
                      key={player.player_id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-orange-500/20"
                    >
                      <div className="text-lg font-bold text-muted-foreground w-6">
                        {idx + 1}
                      </div>
                      
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={player.avatar} alt={player.nickname} />
                        <AvatarFallback>{player.nickname[0]}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="font-semibold">{player.nickname}</div>
                        <div className="text-sm text-muted-foreground">
                          ELO: {player.elo || 'N/A'}
                        </div>
                      </div>

                      {player.level && (
                        <img
                          src={`/faceit-icons/skill-level-${player.level}.png`}
                          alt={`Level ${player.level}`}
                          className="h-8 w-8"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* ELO Difference */}
          <div className="text-center">
            <Badge variant="secondary" className="text-base px-4 py-2">
              Diferență ELO: {Math.abs(Math.round(balancedTeams.team1AvgElo - balancedTeams.team2AvgElo))}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};
