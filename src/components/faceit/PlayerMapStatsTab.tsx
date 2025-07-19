import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaceitAnalyserPlayerData } from "@/types/FaceitAnalyser";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PlayerMapStatsTabProps {
  analyserData: FaceitAnalyserPlayerData | null;
  isLoading: boolean;
}

export const PlayerMapStatsTab = ({ analyserData, isLoading }: PlayerMapStatsTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analyserData?.mapStats || analyserData.mapStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">No map statistics available</div>
          <div className="text-sm text-muted-foreground">
            Map performance data will appear here when available
          </div>
        </div>
      </div>
    );
  }

  const { mapStats } = analyserData;

  const getPerformanceColor = (rating: number) => {
    if (rating >= 1.2) return "text-green-500";
    if (rating >= 1.0) return "text-yellow-500";
    return "text-red-500";
  };

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 1.3) return { label: "Excellent", variant: "default" as const };
    if (rating >= 1.1) return { label: "Good", variant: "secondary" as const };
    if (rating >= 0.9) return { label: "Average", variant: "outline" as const };
    return { label: "Below Average", variant: "destructive" as const };
  };

  return (
    <div className="space-y-4">
      {mapStats.map((mapStat, index) => {
        const mapName = mapStat.mapName.replace('de_', '').toUpperCase();
        const performanceBadge = getPerformanceBadge(mapStat.avgRating);
        
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-3">
                  <div className="w-12 h-8 bg-gradient-to-r from-primary/20 to-primary/40 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {mapName.slice(0, 3)}
                    </span>
                  </div>
                  <span>{mapName}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={performanceBadge.variant}>
                    {performanceBadge.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {mapStat.matches} matches
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Rating</div>
                  <div className={`text-xl font-bold ${getPerformanceColor(mapStat.avgRating)}`}>
                    {mapStat.avgRating.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                  <div className="text-xl font-bold text-foreground">
                    {mapStat.winRate.toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">K/D</div>
                  <div className={`text-xl font-bold ${getPerformanceColor(mapStat.avgKD)}`}>
                    {mapStat.avgKD.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">KAST</div>
                  <div className="text-xl font-bold text-foreground">
                    {mapStat.avgKAST.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Kills</span>
                    <span className="font-medium">{mapStat.avgKills.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Deaths</span>
                    <span className="font-medium">{mapStat.avgDeaths.toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ADR</span>
                    <span className="font-medium">{mapStat.avgADR.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Matches</span>
                    <span className="font-medium">{mapStat.matches}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Win Rate</span>
                      <span className="text-sm font-medium">{mapStat.winRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={mapStat.winRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Performance</span>
                      <span className="text-sm font-medium">
                        {Math.round((mapStat.avgRating / 1.5) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((mapStat.avgRating / 1.5) * 100, 100)} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};