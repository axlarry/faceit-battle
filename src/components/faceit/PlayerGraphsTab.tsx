import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaceitAnalyserPlayerData } from "@/types/FaceitAnalyser";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { format, parseISO } from 'date-fns';

interface PlayerGraphsTabProps {
  analyserData: FaceitAnalyserPlayerData | null;
  isLoading: boolean;
}

export const PlayerGraphsTab = ({ analyserData, isLoading }: PlayerGraphsTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analyserData?.graphs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">No graph data available</div>
          <div className="text-sm text-muted-foreground">
            Advanced statistics will appear here when available
          </div>
        </div>
      </div>
    );
  }

  const { graphs } = analyserData;

  // Format data for charts
  const formatDateData = (data: any[]) => {
    return data.map(point => ({
      ...point,
      formattedDate: format(parseISO(point.date), 'MMM dd'),
      date: point.date
    }));
  };

  const eloData = formatDateData(graphs.eloHistory);
  const ratingData = formatDateData(graphs.ratingTrend);
  const kdData = formatDateData(graphs.kdTrend);
  const winRateData = formatDateData(graphs.winRateTrend);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ELO Evolution */}
      {eloData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>ELO Evolution</span>
              <span className="text-sm text-muted-foreground font-normal">
                Last {eloData.length} matches
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={eloData}>
                <defs>
                  <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="formattedDate" 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#eloGradient)"
                  name="ELO"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating Trend */}
        {ratingData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rating Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ratingData}>
                  <XAxis 
                    dataKey="formattedDate" 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2 }}
                    name="Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* K/D Ratio Trend */}
        {kdData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">K/D Ratio Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={kdData}>
                  <XAxis 
                    dataKey="formattedDate" 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
                    name="K/D Ratio"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Win Rate Trend */}
      {winRateData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Win Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={winRateData}>
                <defs>
                  <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="formattedDate" 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Win Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#winRateGradient)"
                  name="Win Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance Heatmap */}
      {graphs.performanceHeatmap.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Map Performance Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {graphs.performanceHeatmap.map((mapData, index) => {
                const performance = mapData.performance;
                const intensity = Math.min(performance / 1.5, 1); // Normalize to 0-1
                
                return (
                  <div
                    key={index}
                    className="relative p-4 rounded-lg border text-center transition-all hover:scale-105"
                    style={{
                      backgroundColor: `hsla(var(--primary), ${intensity * 0.3})`,
                      borderColor: `hsla(var(--primary), ${intensity * 0.5})`
                    }}
                  >
                    <div className="text-sm font-medium text-foreground mb-1">
                      {mapData.map.replace('de_', '').toUpperCase()}
                    </div>
                    <div className="text-lg font-bold text-primary mb-1">
                      {performance.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {mapData.matches} matches
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};