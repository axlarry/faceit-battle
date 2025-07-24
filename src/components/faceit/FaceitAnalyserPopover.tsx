import { useState } from 'react';
import { Player } from '@/types/Player';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Zap, Trophy, Calendar, MapPin, Users, Star, History, User } from 'lucide-react';
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
                            <div className="text-2xl font-bold text-green-400">{data.overview.current_elo || 'N/A'}</div>
                            <div className="text-sm text-gray-400">ELO Current</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{data.overview.win_rate || 'N/A'}%</div>
                            <div className="text-sm text-gray-400">Win Rate</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400">{data.overview.kd_ratio || 'N/A'}</div>
                            <div className="text-sm text-gray-400">K/D Ratio</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-400">{data.overview.headshot_percentage || 'N/A'}%</div>
                            <div className="text-sm text-gray-400">Headshot %</div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg text-orange-400">Overview General</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto">
                            {JSON.stringify(data.overview, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
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
                  {data.matches && data.matches.length > 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Istoric Meciuri ({data.matches.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {data.matches.slice(0, 50).map((match: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-700/50 rounded border-l-4 border-orange-500/50">
                              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                {JSON.stringify(match, null, 2)}
                              </pre>
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
                  {data.maps ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Statistici Hărți
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-96">
                          {JSON.stringify(data.maps, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
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
                  {data.hubs && data.hubs.length > 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Hub-uri ({data.hubs.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {data.hubs.map((hub: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-700/50 rounded">
                              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                {JSON.stringify(hub, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
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
                  {data.highlights && data.highlights.length > 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Highlights ({data.highlights.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {data.highlights.map((highlight: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-700/50 rounded border-l-4 border-yellow-500/50">
                              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                {JSON.stringify(highlight, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
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
                  {data.names && data.names.length > 0 ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Istoric Nume ({data.names.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {data.names.map((name: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-700/50 rounded text-center">
                              <div className="text-white font-medium">{name.name || name}</div>
                              <div className="text-sm text-gray-400">{name.date || 'Data necunoscută'}</div>
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
                  {data.playerGraphs ? (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Grafice Progres
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-96">
                          {JSON.stringify(data.playerGraphs, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
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