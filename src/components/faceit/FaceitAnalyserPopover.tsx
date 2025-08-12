import { useState } from 'react';
import { Player } from '@/types/Player';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { Target, Trophy, TrendingUp, TrendingDown, BarChart, MapPin, Clock } from 'lucide-react';
import { faceitAnalyserService, FaceitAnalyserComplete } from '@/services/faceitAnalyserService';

interface FaceitAnalyserPopoverProps {
  player: Player;
}

export const FaceitAnalyserPopover = ({ player }: FaceitAnalyserPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<FaceitAnalyserComplete | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    if (!data) {
      setLoading(true);
      const completeData = await faceitAnalyserService.getCompletePlayerData(player.nickname);
      setData(completeData);
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => num?.toLocaleString() || '0';
  const formatDecimal = (num: number, decimals: number = 2) => num?.toFixed(decimals) || '0.00';

  // Chart configuration
  const chartConfig = {
    elo: {
      label: "ELO",
      color: "hsl(var(--chart-1))",
    },
    kd: {
      label: "K/D",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50 text-orange-300 hover:bg-orange-500/30 hover:text-orange-200"
      >
        <Target className="mr-2 h-4 w-4" />
        FaceitAnalyser
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-orange-500/30 text-white w-[95vw] max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-orange-400 flex items-center gap-2">
              <Target className="h-6 w-6" />
              FaceitAnalyser - {player.nickname}
            </DialogTitle>
            <DialogDescription className="sr-only">Analiză completă Faceit pentru {player.nickname}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Se încarcă datele complete...</p>
                </div>
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Player Header with Avatar */}
                <div className="flex items-center gap-6 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{player.nickname.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">{player.nickname}</h2>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                        {data.stats ? `${formatNumber(data.stats.current_elo)} ELO` : 'N/A ELO'}
                      </Badge>
                      {data.overview?.region && (
                        <span className="text-gray-400">{data.overview.region}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Stats Grid - Similar to your images */}
                {data.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Avg. KDR */}
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm text-gray-400 mb-2">Avg. KDR</div>
                        <div className="text-3xl font-bold text-white">{formatDecimal(data.stats.real_kdr)}</div>
                      </CardContent>
                    </Card>

                    {/* FA Rating */}
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm text-gray-400 mb-2">FA Rating</div>
                        <div className="text-3xl font-bold text-red-400">{formatDecimal(data.stats.hltv)}</div>
                      </CardContent>
                    </Card>

                    {/* Winrate */}
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm text-gray-400 mb-2">Winrate</div>
                        <div className="text-3xl font-bold text-white">{formatDecimal(data.stats.wr, 1)}</div>
                      </CardContent>
                    </Card>

                    {/* ELO */}
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm text-gray-400 mb-2">ELO</div>
                        <div className="text-3xl font-bold text-yellow-400">{formatNumber(data.stats.current_elo)}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Additional Stats Grid */}
                {data.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Avg. KPR</div>
                      <div className="text-lg font-bold text-white">{formatDecimal(data.stats.avg_krr)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">HLTV</div>
                      <div className="text-lg font-bold text-white">{formatDecimal(data.stats.avg_hltv)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Matches</div>
                      <div className="text-lg font-bold text-white">{formatNumber(data.stats.m)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Highest ELO</div>
                      <div className="text-lg font-bold text-white">{formatNumber(data.stats.highest_elo)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Avg. Kills</div>
                      <div className="text-lg font-bold text-white">{formatDecimal(data.stats.avg_k)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Kills</div>
                      <div className="text-lg font-bold text-white">{formatNumber(data.stats.k)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Wins</div>
                      <div className="text-lg font-bold text-white">{formatNumber(data.stats.w)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Lowest ELO</div>
                      <div className="text-lg font-bold text-white">{formatNumber(data.stats.lowest_elo)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Avg. Deaths</div>
                      <div className="text-lg font-bold text-white">{formatDecimal(data.stats.avg_d)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Deaths</div>
                      <div className="text-lg font-bold text-white">{formatNumber(data.stats.d)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Losses</div>
                      <div className="text-lg font-bold text-white">{formatNumber(data.stats.l)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Avg. ELO</div>
                      <div className="text-lg font-bold text-white">{formatNumber(data.stats.avg_elo)}</div>
                    </div>
                  </div>
                )}

                {/* Comparison Text */}
                {data.stats && data.overview?.region && (
                  <div className="text-center p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30">
                    <div className="text-lg text-white">
                      {player.nickname} is better than <span className="text-orange-400 font-bold">
                        {((data.stats.current_elo / 3000) * 100).toFixed(2)}%
                      </span> of the {data.overview.region} players
                    </div>
                  </div>
                )}

                <Tabs defaultValue="matches" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 bg-gray-800/50">
                    <TabsTrigger value="matches">Meciuri</TabsTrigger>
                    <TabsTrigger value="maps">Hărți</TabsTrigger>
                    <TabsTrigger value="hubs">Hub-uri</TabsTrigger>
                    <TabsTrigger value="highlights">Highlights</TabsTrigger>
                    <TabsTrigger value="names">Nume</TabsTrigger>
                    <TabsTrigger value="graphs">Grafice</TabsTrigger>
                  </TabsList>

                  {/* Matches Tab */}
                  <TabsContent value="matches" className="space-y-4 mt-6">
                    {data.matches && (data.matches as any).segments && Array.isArray((data.matches as any).segments) ? (
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg text-orange-400">
                            Ultimele {(data.matches as any).segments.length} meciuri
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-700">
                                  <th className="text-left p-2 text-gray-400">Tournament</th>
                                  <th className="text-left p-2 text-gray-400">Maps</th>
                                  <th className="text-left p-2 text-gray-400">Wins</th>
                                  <th className="text-left p-2 text-gray-400">Losses</th>
                                  <th className="text-left p-2 text-gray-400">Winrate</th>
                                  <th className="text-left p-2 text-gray-400">Details</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(data.matches as any).segments.slice(0, 15).map((match: any, index: number) => (
                                  <tr key={match.matchId || index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                    <td className="p-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={match.w === 1 ? "default" : "destructive"} className="text-xs">
                                          {match.w === 1 ? "W" : "L"}
                                        </Badge>
                                        <span className="text-white text-xs">{(match.hn || 'CS2 5v5').slice(0, 20)}</span>
                                      </div>
                                    </td>
                                    <td className="p-2 text-white">{match.map || match.i1}</td>
                                    <td className="p-2 text-green-400">{match.w === 1 ? '1' : '0'}</td>
                                    <td className="p-2 text-red-400">{match.w === 0 ? '1' : '0'}</td>
                                    <td className="p-2">
                                      <span className={match.w === 1 ? 'text-green-400' : 'text-red-400'}>
                                        {match.w === 1 ? '100%' : '0%'}
                                      </span>
                                    </td>
                                    <td className="p-2">
                                      <div className="text-xs text-gray-400">
                                        <div>K/D/A: {match.k}/{match.d}/{match.a}</div>
                                        <div>Rating: {formatDecimal(match.hltv)}</div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center text-gray-400 p-8">Nu sunt disponibile date despre meciuri</div>
                    )}
                  </TabsContent>

                  {/* Maps Tab */}
                  <TabsContent value="maps" className="space-y-4 mt-6">
                    {data.maps && typeof data.maps === 'object' && Object.keys(data.maps).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(data.maps).map(([mapName, mapData]: [string, any]) => (
                          <Card key={mapName} className="bg-gray-800/50 border-gray-700">
                            <CardHeader>
                              <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                {mapName}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm text-gray-400">Meciuri</div>
                                  <div className="text-xl text-white">{mapData.m || 0}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-400">Win Rate</div>
                                  <div className="text-xl text-green-400">{formatDecimal(mapData.wr || 0, 1)}%</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-400">K/D</div>
                                  <div className="text-xl text-purple-400">{formatDecimal(mapData.kdr || 0)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-400">Rating</div>
                                  <div className="text-xl text-cyan-400">{formatDecimal(mapData.hltv || 0)}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 p-8">Nu sunt disponibile statistici pentru hărți</div>
                    )}
                  </TabsContent>

                  {/* Hubs Tab */}
                  <TabsContent value="hubs" className="space-y-4 mt-6">
                    {data.hubs && Array.isArray(data.hubs) && data.hubs.length > 0 ? (
                      <div className="space-y-4">
                        {data.hubs.map((hub: any, index: number) => (
                          <Card key={hub.id || index} className="bg-gray-800/50 border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg text-white font-medium">{hub.name || 'N/A'}</h3>
                                  <p className="text-gray-400 text-sm">{hub.description || 'Fără descriere'}</p>
                                </div>
                                <Badge variant="outline">
                                  {hub.members_count || 0} membri
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 p-8">Nu sunt disponibile date despre hub-uri</div>
                    )}
                  </TabsContent>

                  {/* Highlights Tab */}
                  <TabsContent value="highlights" className="space-y-4 mt-6">
                    {data.highlights && Array.isArray(data.highlights) && data.highlights.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.highlights.slice(0, 10).map((highlight: any, index: number) => (
                          <Card key={index} className="bg-gray-800/50 border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Trophy className="h-8 w-8 text-yellow-400" />
                                <div>
                                  <div className="text-white font-medium">
                                    {highlight.kills || highlight.k} Kills
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    K/D: {formatDecimal(highlight.kdr || highlight.kd_ratio || 0)}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {highlight.map || highlight.mapName || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 p-8">Nu sunt disponibile highlight-uri</div>
                    )}
                  </TabsContent>

                  {/* Names Tab */}
                  <TabsContent value="names" className="space-y-4 mt-6">
                    {data.names && Array.isArray(data.names) && data.names.length > 0 ? (
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg text-orange-400">Istoricul numelor</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.names.map((nameEntry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                                <span className="text-white font-medium">{nameEntry.name || nameEntry}</span>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <Clock className="h-4 w-4" />
                                  {nameEntry.date || 'Data necunoscută'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center text-gray-400 p-8">Nu sunt disponibile date despre istoric</div>
                    )}
                  </TabsContent>

                  {/* Graphs Tab */}
                  <TabsContent value="graphs" className="space-y-6 mt-6">
                    {data.playerGraphs && typeof data.playerGraphs === 'object' ? (
                      <div className="space-y-6">
                        {/* ELO Progress Chart */}
                        {data.playerGraphs.elo_data && Array.isArray(data.playerGraphs.elo_data) && (
                          <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader>
                              <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Progresul ELO
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={data.playerGraphs.elo_data.slice(-30)}>
                                    <XAxis 
                                      dataKey="date" 
                                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                      axisLine={{ stroke: '#4B5563' }}
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                      axisLine={{ stroke: '#4B5563' }}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line 
                                      type="monotone" 
                                      dataKey="elo" 
                                      stroke="hsl(var(--chart-1))" 
                                      strokeWidth={2}
                                      dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </ChartContainer>
                            </CardContent>
                          </Card>
                        )}

                        {/* K/D Progress Chart */}
                        {data.playerGraphs.kd_data && Array.isArray(data.playerGraphs.kd_data) && (
                          <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader>
                              <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                                <BarChart className="h-5 w-5" />
                                Progresul K/D
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={data.playerGraphs.kd_data.slice(-30)}>
                                    <XAxis 
                                      dataKey="date" 
                                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                      axisLine={{ stroke: '#4B5563' }}
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                      axisLine={{ stroke: '#4B5563' }}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line 
                                      type="monotone" 
                                      dataKey="kd" 
                                      stroke="hsl(var(--chart-2))" 
                                      strokeWidth={2}
                                      dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </ChartContainer>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 p-8">Nu sunt disponibile date pentru grafice</div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center text-gray-400 p-8">
                Nu s-au putut încărca datele FaceitAnalyser
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};