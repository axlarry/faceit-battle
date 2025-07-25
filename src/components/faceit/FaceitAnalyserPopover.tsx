import { useState } from 'react';
import { Player } from '@/types/Player';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Zap, Trophy, Calendar, MapPin, Users, Star, History, User, Clock } from 'lucide-react';
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
        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-orange-500/30 text-white w-[95vw] max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-orange-400 flex items-center gap-2">
              <Target className="h-6 w-6" />
              FaceitAnalyser - {player.nickname}
            </DialogTitle>
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
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-8 bg-gray-800/50 text-xs">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="stats">Statistici</TabsTrigger>
                  <TabsTrigger value="matches">Meciuri</TabsTrigger>
                  <TabsTrigger value="maps">Hărți</TabsTrigger>
                  <TabsTrigger value="hubs">Hub-uri</TabsTrigger>
                  <TabsTrigger value="highlights">Highlights</TabsTrigger>
                  <TabsTrigger value="names">Nume</TabsTrigger>
                  <TabsTrigger value="graphs">Grafice</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  {data.overview && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">{data.overview.elo || 'N/A'}</div>
                            <div className="text-sm text-gray-400">ELO Current</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{data.overview.lvl || 'N/A'}</div>
                            <div className="text-sm text-gray-400">Level</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400">{data.overview.region || 'N/A'}</div>
                            <div className="text-sm text-gray-400">Region</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-400">{data.overview.country || 'N/A'}</div>
                            <div className="text-sm text-gray-400">Country</div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-gray-800/50 border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                              <User className="h-5 w-5" />
                              Informații Profil
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Nume:</span>
                              <span className="text-white">{data.overview.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Activ:</span>
                              <Badge variant={data.overview.active ? "default" : "destructive"}>
                                {data.overview.active ? "Activ" : "Inactiv"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Steam ID:</span>
                              <span className="text-white text-sm">{data.overview.steam_id}</span>
                            </div>
                            {data.overview.streaming?.twitch_id && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Twitch:</span>
                                <span className="text-purple-400">{data.overview.streaming.twitch_id}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-800/50 border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                              <Trophy className="h-5 w-5" />
                              Bans & Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-400">VAC Ban:</span>
                              <Badge variant={data.overview.vac_ban ? "destructive" : "default"}>
                                {data.overview.vac_ban ? "Da" : "Nu"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Game Ban:</span>
                              <Badge variant={data.overview.game_ban ? "destructive" : "default"}>
                                {data.overview.game_ban ? "Da" : "Nu"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Economy Ban:</span>
                              <Badge variant={data.overview.economy_ban ? "destructive" : "default"}>
                                {data.overview.economy_ban ? "Da" : "Nu"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total Bans:</span>
                              <span className="text-white">{data.overview.bans?.length || 0}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="space-y-6 mt-6">
                  {data.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">{formatNumber(data.stats.current_elo)}</div>
                          <div className="text-sm text-gray-400">ELO Current</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400">{formatDecimal(data.stats.wr, 1)}%</div>
                          <div className="text-sm text-gray-400">Win Rate</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-400">{formatDecimal(data.stats.real_kdr)}</div>
                          <div className="text-sm text-gray-400">K/D Ratio</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-400">{formatDecimal(data.stats.hsp, 1)}%</div>
                          <div className="text-sm text-gray-400">Headshot %</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="md:col-span-2 lg:col-span-4 bg-gray-800/50 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            Statistici Complete
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm text-gray-400">Meciuri</div>
                            <div className="text-xl text-white">{formatNumber(data.stats.m)}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-400">Kills</div>
                            <div className="text-xl text-green-400">{formatNumber(data.stats.k)}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-400">Deaths</div>
                            <div className="text-xl text-red-400">{formatNumber(data.stats.d)}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-400">Assists</div>
                            <div className="text-xl text-blue-400">{formatNumber(data.stats.a)}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Matches Tab */}
                <TabsContent value="matches" className="space-y-6 mt-6">
                  {data.matches && (data.matches as any).segments && Array.isArray((data.matches as any).segments) && (data.matches as any).segments.length > 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Istoric Meciuri ({(data.matches as any).segments.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {(data.matches as any).segments.slice(0, 20).map((match: any, index: number) => (
                            <div key={match.matchId || index} className="p-4 bg-gray-700/50 rounded border-l-4 border-orange-500/50">
                              <div className="flex flex-wrap items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={match.w === 1 ? "default" : "destructive"}>
                                    {match.w === 1 ? "WIN" : "LOSE"}
                                  </Badge>
                                  <span className="text-white font-medium">{match.map || match.i1}</span>
                                  <span className="text-gray-400">({match.s || match.i18})</span>
                                </div>
                                <div className="text-gray-400 text-sm flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {match.date} - {match.hour}:00
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-400">K/D/A:</span>
                                  <span className="text-white ml-1">{match.k || match.i6}/{match.d || match.i8}/{match.a || match.i7}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">K/D:</span>
                                  <span className="text-purple-400 ml-1">{formatDecimal(match.kdr || match.c2)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">HLTV:</span>
                                  <span className="text-cyan-400 ml-1">{formatDecimal(match.hltv)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">HS:</span>
                                  <span className="text-yellow-400 ml-1">{match.hs || match.i13}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">ELO:</span>
                                  <span className={`ml-1 ${(match.elod && match.elod.includes('+')) ? 'text-green-400' : 'text-red-400'}`}>
                                    {match.elod || `${match.elo || 'N/A'}`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Hub:</span>
                                  <span className="text-orange-400 ml-1 text-xs">{(match.hn || match.id || 'N/A').slice(0, 15)}</span>
                                </div>
                              </div>
                              
                              {match.url && (
                                <div className="mt-2">
                                  <a 
                                    href={match.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                                  >
                                    Vezi meciul pe FACEIT
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <div className="text-gray-400">Nu sunt disponibile date despre meciuri</div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Maps Tab */}
                <TabsContent value="maps" className="space-y-6 mt-6">
                  {data.maps && (data.maps as any).segments && Array.isArray((data.maps as any).segments) && (data.maps as any).segments.length > 0 ? (
                    <div className="space-y-4">
                      {(data.maps as any).segments.map((mapData: any, index: number) => (
                        <Card key={index} className="bg-gray-800/50 border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                              <MapPin className="h-5 w-5" />
                              {mapData.segment_value || mapData.map || `Hartă ${index + 1}`}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{formatNumber(mapData.m)}</div>
                                <div className="text-sm text-gray-400">Meciuri</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{formatNumber(mapData.w)}</div>
                                <div className="text-sm text-gray-400">Victorii</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-400">{formatNumber(mapData.l)}</div>
                                <div className="text-sm text-gray-400">Înfrângeri</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">{formatDecimal(mapData.wr, 1)}%</div>
                                <div className="text-sm text-gray-400">Win Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">{formatDecimal(mapData.real_kdr)}</div>
                                <div className="text-sm text-gray-400">K/D</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">{formatDecimal(mapData.hsp, 1)}%</div>
                                <div className="text-sm text-gray-400">HS%</div>
                              </div>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400">Kills:</span>
                                <span className="text-green-400 ml-1">{formatNumber(mapData.k)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Deaths:</span>
                                <span className="text-red-400 ml-1">{formatNumber(mapData.d)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Assists:</span>
                                <span className="text-blue-400 ml-1">{formatNumber(mapData.a)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">ELO Avg:</span>
                                <span className="text-orange-400 ml-1">{formatNumber(mapData.avg_elo)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">HLTV:</span>
                                <span className="text-cyan-400 ml-1">{formatDecimal(mapData.avg_hltv)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Diff:</span>
                                <span className={`ml-1 ${mapData.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {mapData.diff >= 0 ? '+' : ''}{formatNumber(mapData.diff)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">ELO Înalt:</span>
                                <span className="text-green-400 ml-1">{formatNumber(mapData.highest_elo)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">ELO Scăzut:</span>
                                <span className="text-red-400 ml-1">{formatNumber(mapData.lowest_elo)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Prima Dată:</span>
                                <span className="text-white ml-1">{mapData.first_occurrence}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Ultima Dată:</span>
                                <span className="text-white ml-1">{mapData.last_occurrence}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <div className="text-gray-400">Nu sunt disponibile statistici pentru hărți</div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Hubs Tab */}
                <TabsContent value="hubs" className="space-y-6 mt-6">
                  {data.hubs && (data.hubs as any).segments && Array.isArray((data.hubs as any).segments) && (data.hubs as any).segments.length > 0 ? (
                    <div className="space-y-4">
                      {(data.hubs as any).segments.map((hubData: any, index: number) => (
                        <Card key={index} className="bg-gray-800/50 border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              {hubData.segment_value || hubData.hn || `Hub ${index + 1}`}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{formatNumber(hubData.m)}</div>
                                <div className="text-sm text-gray-400">Meciuri</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{formatNumber(hubData.w)}</div>
                                <div className="text-sm text-gray-400">Victorii</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-400">{formatNumber(hubData.l)}</div>
                                <div className="text-sm text-gray-400">Înfrângeri</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">{formatDecimal(hubData.wr, 1)}%</div>
                                <div className="text-sm text-gray-400">Win Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">{formatDecimal(hubData.real_kdr)}</div>
                                <div className="text-sm text-gray-400">K/D</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">{formatDecimal(hubData.hsp, 1)}%</div>
                                <div className="text-sm text-gray-400">HS%</div>
                              </div>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400">Kills:</span>
                                <span className="text-green-400 ml-1">{formatNumber(hubData.k)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Deaths:</span>
                                <span className="text-red-400 ml-1">{formatNumber(hubData.d)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Assists:</span>
                                <span className="text-blue-400 ml-1">{formatNumber(hubData.a)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">ELO Avg:</span>
                                <span className="text-orange-400 ml-1">{formatNumber(hubData.avg_elo)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">HLTV:</span>
                                <span className="text-cyan-400 ml-1">{formatDecimal(hubData.avg_hltv)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Tip:</span>
                                <span className="text-white ml-1">{hubData.ht || 'N/A'}</span>
                              </div>
                            </div>

                            {hubData.ha && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <img 
                                  src={hubData.ha} 
                                  alt="Hub Avatar" 
                                  className="w-16 h-16 rounded object-cover mx-auto"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <div className="text-gray-400">Nu sunt disponibile date despre hub-uri</div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Highlights Tab */}
                <TabsContent value="highlights" className="space-y-6 mt-6">
                  {data.highlights && (data.highlights as any).k && Array.isArray((data.highlights as any).k) && (data.highlights as any).k.length > 0 ? (
                    <div className="space-y-6">
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Top Kills Highlights ({(data.highlights as any).k.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {(data.highlights as any).k.slice(0, 10).map((highlight: any, index: number) => (
                              <div key={index} className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded border-l-4 border-yellow-500">
                                <div className="flex flex-wrap items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={highlight.w === 1 ? "default" : "destructive"}>
                                      {highlight.w === 1 ? "WIN" : "LOSE"}
                                    </Badge>
                                    <span className="text-white font-medium">{highlight.map}</span>
                                    <span className="text-gray-400">({highlight.s})</span>
                                  </div>
                                  <div className="text-gray-400 text-sm">{highlight.date}</div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                  <div>
                                    <span className="text-yellow-400 font-bold">K/D/A:</span>
                                    <span className="text-white ml-1">{highlight.k}/{highlight.d}/{highlight.a}</span>
                                  </div>
                                  <div>
                                    <span className="text-purple-400">K/D:</span>
                                    <span className="text-white ml-1">{formatDecimal(highlight.kdr)}</span>
                                  </div>
                                  <div>
                                    <span className="text-cyan-400">HLTV:</span>
                                    <span className="text-white ml-1">{formatDecimal(highlight.hltv)}</span>
                                  </div>
                                  <div>
                                    <span className="text-yellow-400">HS:</span>
                                    <span className="text-white ml-1">{highlight.hs}</span>
                                  </div>
                                  <div>
                                    <span className="text-orange-400">ELO:</span>
                                    <span className={`ml-1 ${(highlight.elod && highlight.elod.includes('+')) ? 'text-green-400' : 'text-red-400'}`}>
                                      {highlight.elod}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {(data.highlights as any).kdr && Array.isArray((data.highlights as any).kdr) && (data.highlights as any).kdr.length > 0 && (
                        <Card className="bg-gray-800/50 border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              Best K/D Highlights ({(data.highlights as any).kdr.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                              {(data.highlights as any).kdr.slice(0, 10).map((highlight: any, index: number) => (
                                <div key={index} className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded border-l-4 border-purple-500">
                                  <div className="flex flex-wrap items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={highlight.w === 1 ? "default" : "destructive"}>
                                        {highlight.w === 1 ? "WIN" : "LOSE"}
                                      </Badge>
                                      <span className="text-white font-medium">{highlight.map}</span>
                                      <span className="text-gray-400">({highlight.s})</span>
                                    </div>
                                    <div className="text-gray-400 text-sm">{highlight.date}</div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                    <div>
                                      <span className="text-purple-400 font-bold">K/D:</span>
                                      <span className="text-white ml-1">{formatDecimal(highlight.kdr)}</span>
                                    </div>
                                    <div>
                                      <span className="text-green-400">K/D/A:</span>
                                      <span className="text-white ml-1">{highlight.k}/{highlight.d}/{highlight.a}</span>
                                    </div>
                                    <div>
                                      <span className="text-cyan-400">HLTV:</span>
                                      <span className="text-white ml-1">{formatDecimal(highlight.hltv)}</span>
                                    </div>
                                    <div>
                                      <span className="text-yellow-400">HS:</span>
                                      <span className="text-white ml-1">{highlight.hs}</span>
                                    </div>
                                    <div>
                                      <span className="text-orange-400">ELO:</span>
                                      <span className={`ml-1 ${(highlight.elod && highlight.elod.includes('+')) ? 'text-green-400' : 'text-red-400'}`}>
                                        {highlight.elod}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <div className="text-gray-400">Nu sunt disponibile highlights</div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Names Tab */}
                <TabsContent value="names" className="space-y-6 mt-6">
                  {data.names && (data.names as any).segments && Array.isArray((data.names as any).segments) && (data.names as any).segments.length > 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Istoric Nume ({(data.names as any).segments.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {(data.names as any).segments.map((nameData: any, index: number) => (
                            <div key={index} className="p-4 bg-gray-700/50 rounded text-center border border-gray-600">
                              <div className="text-white font-medium text-lg">{nameData.segment_value || nameData.nickname}</div>
                              <div className="text-sm text-gray-400 mt-1">
                                {nameData.first_occurrence && (
                                  <div>Prima dată: {nameData.first_occurrence}</div>
                                )}
                                {nameData.last_occurrence && (
                                  <div>Ultima dată: {nameData.last_occurrence}</div>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                {nameData.m && <span>Meciuri: {nameData.m}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <div className="text-gray-400">Nu sunt disponibile date despre istoric nume</div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Graphs Tab */}
                <TabsContent value="graphs" className="space-y-6 mt-6">
                  {data.playerGraphs && (data.playerGraphs as any).graph_data ? (
                    <div className="space-y-6">
                      {(data.playerGraphs as any).graph_data.elo && (
                        <Card className="bg-gray-800/50 border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              Progresie ELO
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center p-3 bg-gray-700/50 rounded">
                                <div className="text-2xl font-bold text-green-400">{(data.playerGraphs as any).graph_data.elo.max}</div>
                                <div className="text-sm text-gray-400">ELO Maxim</div>
                              </div>
                              <div className="text-center p-3 bg-gray-700/50 rounded">
                                <div className="text-2xl font-bold text-red-400">{(data.playerGraphs as any).graph_data.elo.min}</div>
                                <div className="text-sm text-gray-400">ELO Minim</div>
                              </div>
                              <div className="text-center p-3 bg-gray-700/50 rounded">
                                <div className="text-2xl font-bold text-blue-400">{(data.playerGraphs as any).graph_data.elo.values?.length || 0}</div>
                                <div className="text-sm text-gray-400">Total Puncte</div>
                              </div>
                              <div className="text-center p-3 bg-gray-700/50 rounded">
                                <div className="text-2xl font-bold text-purple-400">
                                  {(data.playerGraphs as any).graph_data.elo.values?.length > 0 ? 
                                    formatNumber((data.playerGraphs as any).graph_data.elo.values[(data.playerGraphs as any).graph_data.elo.values.length - 1]) 
                                    : 'N/A'}
                                </div>
                                <div className="text-sm text-gray-400">ELO Curent</div>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-400 max-h-40 overflow-y-auto">
                              <div className="mb-2 font-medium">Ultimele 10 valori ELO:</div>
                              <div className="grid grid-cols-5 gap-2">
                                {(data.playerGraphs as any).graph_data.elo.values?.slice(-10).map((value: number, index: number) => (
                                  <div key={index} className="p-2 bg-gray-600/50 rounded text-center">
                                    <div className="text-white">{formatNumber(value)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {(data.playerGraphs as any).graph_data.kdr && (
                        <Card className="bg-gray-800/50 border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Progresie K/D Ratio
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center p-3 bg-gray-700/50 rounded">
                                <div className="text-2xl font-bold text-green-400">{formatDecimal((data.playerGraphs as any).graph_data.kdr.max)}</div>
                                <div className="text-sm text-gray-400">K/D Maxim</div>
                              </div>
                              <div className="text-center p-3 bg-gray-700/50 rounded">
                                <div className="text-2xl font-bold text-red-400">{formatDecimal((data.playerGraphs as any).graph_data.kdr.min)}</div>
                                <div className="text-sm text-gray-400">K/D Minim</div>
                              </div>
                              <div className="text-center p-3 bg-gray-700/50 rounded">
                                <div className="text-2xl font-bold text-blue-400">{(data.playerGraphs as any).graph_data.kdr.values?.length || 0}</div>
                                <div className="text-sm text-gray-400">Total Puncte</div>
                              </div>
                              <div className="text-center p-3 bg-gray-700/50 rounded">
                                <div className="text-2xl font-bold text-purple-400">
                                  {(data.playerGraphs as any).graph_data.kdr.values?.length > 0 ? 
                                    formatDecimal((data.playerGraphs as any).graph_data.kdr.values[(data.playerGraphs as any).graph_data.kdr.values.length - 1]) 
                                    : 'N/A'}
                                </div>
                                <div className="text-sm text-gray-400">K/D Curent</div>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-400 max-h-40 overflow-y-auto">
                              <div className="mb-2 font-medium">Ultimele 10 valori K/D:</div>
                              <div className="grid grid-cols-5 gap-2">
                                {(data.playerGraphs as any).graph_data.kdr.values?.slice(-10).map((value: number, index: number) => (
                                  <div key={index} className="p-2 bg-gray-600/50 rounded text-center">
                                    <div className="text-white">{formatDecimal(value)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <div className="text-gray-400">Nu sunt disponibile grafice de progres</div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 text-lg">Nu s-au putut încărca datele FaceitAnalyser pentru acest jucător.</div>
                  <p className="text-gray-500 mt-2">Verifică dacă nickname-ul este corect și încearcă din nou.</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};