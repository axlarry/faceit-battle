import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaceitAnalyserPlayerData } from "@/types/FaceitAnalyser";
import { Player } from "@/types/Player";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "./TrendIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PlayerAnalyticsTabProps {
  player: Player;
  analyserData: FaceitAnalyserPlayerData | null;
  isLoading: boolean;
}

export const PlayerAnalyticsTab = ({ player, analyserData, isLoading }: PlayerAnalyticsTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickStats = [
    {
      title: "Current ELO",
      value: player.elo || 0,
      change: analyserData?.stats ? "+25" : null,
      trend: "up" as const
    },
    {
      title: "Win Rate",
      value: `${player.winRate || 0}%`,
      change: analyserData?.stats ? "+2.5%" : null,
      trend: "up" as const
    },
    {
      title: "K/D Ratio",
      value: player.kdRatio || 0,
      change: analyserData?.stats ? "+0.15" : null,
      trend: "up" as const
    },
            {
              title: "Matches",
              value: Array.isArray(player.matches) ? player.matches.length : (player.matches || 0),
              change: analyserData?.stats ? "+3" : null,
              trend: "up" as const
            }
  ];

  const performanceData = analyserData?.mapStats?.slice(0, 5).map(map => ({
    name: map.mapName.replace('de_', '').toUpperCase(),
    performance: Math.round(map.avgRating * 100),
    matches: map.matches
  })) || [];

  const ratingData = [
    { name: 'Excellent', value: 25, color: 'hsl(var(--primary))' },
    { name: 'Good', value: 45, color: 'hsl(var(--secondary))' },
    { name: 'Average', value: 30, color: 'hsl(var(--muted))' }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-br from-card to-card/80 border-primary/20">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              {stat.change && (
                <div className="flex items-center space-x-1">
                  <TrendIndicator trend={stat.trend} />
                  <span className="text-xs text-primary font-medium">
                    {stat.change}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Stats Row */}
      {analyserData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Combat Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rating</span>
                <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
                  {analyserData.stats.rating.toFixed(2)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">KAST</span>
                <span className="font-medium">{analyserData.stats.kast.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ADR</span>
                <span className="font-medium">{analyserData.stats.adr.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Impact Score</span>
                <span className="font-medium">{analyserData.stats.impactScore.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Clutch & Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Clutch Success</span>
                <span className="font-medium">{analyserData.stats.clutchSuccess.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Entry Kill Rate</span>
                <span className="font-medium">{analyserData.stats.entryKillRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trade Kill Rate</span>
                <span className="font-medium">{analyserData.stats.tradeKillRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Multi-Kill Rounds</span>
                <span className="font-medium">{analyserData.stats.multiKillRounds}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Economy Rounds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pistol WR</span>
                <span className="font-medium">{analyserData.stats.pistolRoundWinRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Eco WR</span>
                <span className="font-medium">{analyserData.stats.ecoRoundWinRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Force WR</span>
                <span className="font-medium">{analyserData.stats.forceRoundWinRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Map Performance */}
        {performanceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Maps Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={performanceData}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Bar 
                    dataKey="performance" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ratingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ratingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {ratingData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};