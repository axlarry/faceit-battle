import { useState } from 'react';
import { Player } from '@/types/Player';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Zap, Trophy, Calendar } from 'lucide-react';
import { faceitAnalyserService, FaceitAnalyserData } from '@/services/faceitAnalyserService';

interface FaceitAnalyserPopoverProps {
  player: Player;
}

export const FaceitAnalyserPopover = ({ player }: FaceitAnalyserPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<FaceitAnalyserData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    if (!data) {
      setLoading(true);
      const analyserData = await faceitAnalyserService.getPlayerStats(player.nickname);
      setData(analyserData);
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
                  <p className="text-gray-400">Se încarcă statisticile...</p>
                </div>
              </div>
            ) : data ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
                  <TabsTrigger value="overview">Prezentare Generală</TabsTrigger>
                  <TabsTrigger value="performance">Performanță</TabsTrigger>
                  <TabsTrigger value="elo">ELO & Clasament</TabsTrigger>
                  <TabsTrigger value="stats">Statistici Avansate</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{formatNumber(data.current_elo)}</div>
                        <div className="text-sm text-gray-400">ELO Current</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{formatDecimal(data.wr, 1)}%</div>
                        <div className="text-sm text-gray-400">Win Rate</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{formatDecimal(data.real_kdr)}</div>
                        <div className="text-sm text-gray-400">K/D Ratio</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">{formatDecimal(data.hsp, 1)}%</div>
                        <div className="text-sm text-gray-400">Headshot %</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <Trophy className="h-5 w-5" />
                          Meciuri
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total:</span>
                          <span className="text-white">{formatNumber(data.m)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Victorii:</span>
                          <span className="text-green-400">{formatNumber(data.w)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Înfrângeri:</span>
                          <span className="text-red-400">{formatNumber(data.l)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Performanță
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Kills:</span>
                          <span className="text-white">{formatNumber(data.k)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Deaths:</span>
                          <span className="text-white">{formatNumber(data.d)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Assists:</span>
                          <span className="text-white">{formatNumber(data.a)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Perioada
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Prima:</span>
                          <span className="text-white">{data.first_occurrence}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ultima:</span>
                          <span className="text-white">{data.last_occurrence}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Runduri:</span>
                          <span className="text-white">{formatNumber(data.r)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400">Statistici Per Meci</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg. Kills:</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            {formatDecimal(data.avg_k)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg. Deaths:</span>
                          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                            {formatDecimal(data.avg_d)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg. K/D:</span>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            {formatDecimal(data.avg_kdr)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg. HLTV:</span>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                            {formatDecimal(data.avg_hltv)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400">Ratios Avansate</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">KRR (Real):</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            {formatDecimal(data.real_krr)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">DRR (Real):</span>
                          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                            {formatDecimal(data.real_drr)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">DIFFRR (Real):</span>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            {formatDecimal(data.real_diffrr)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">HLTV Rating:</span>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                            {formatDecimal(data.hltv / 1000)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="elo" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Informații ELO
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">ELO Actual:</span>
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-lg">
                            {formatNumber(data.current_elo)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">ELO Maxim:</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            {formatNumber(data.highest_elo)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">ELO Minim:</span>
                          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                            {formatNumber(data.lowest_elo)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">ELO Mediu:</span>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            {formatNumber(data.avg_elo)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400">Progres ELO</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total ELO Câștigat:</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            {formatNumber(data.total_elo)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Meciuri Contorizate:</span>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            {formatNumber(data.total_elo_m)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Diferență ELO:</span>
                          <Badge variant="secondary" className={`${data.diff >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {data.diff >= 0 ? '+' : ''}{formatNumber(data.diff)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg. Diferență:</span>
                          <Badge variant="secondary" className={`${data.avg_diff >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {data.avg_diff >= 0 ? '+' : ''}{formatDecimal(data.avg_diff)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400">Statistici Complete</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-gray-700/50 rounded">
                            <div className="text-xl font-bold text-white">{formatNumber(data.hs)}</div>
                            <div className="text-xs text-gray-400">Headshots</div>
                          </div>
                          <div className="text-center p-3 bg-gray-700/50 rounded">
                            <div className="text-xl font-bold text-white">{formatDecimal(data.hsp, 1)}%</div>
                            <div className="text-xs text-gray-400">HS %</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-gray-700/50 rounded">
                            <div className="text-xl font-bold text-white">{formatDecimal(data.krr)}</div>
                            <div className="text-xs text-gray-400">KRR</div>
                          </div>
                          <div className="text-center p-3 bg-gray-700/50 rounded">
                            <div className="text-xl font-bold text-white">{formatDecimal(data.drr)}</div>
                            <div className="text-xs text-gray-400">DRR</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-400">Rating & Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">HLTV Rating:</span>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                            {formatDecimal(data.hltv / 1000)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg. DIFFRR:</span>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            {formatDecimal(data.avg_diffrr)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg. KRR:</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            {formatDecimal(data.avg_krr)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg. DRR:</span>
                          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                            {formatDecimal(data.avg_drr)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <p>Nu s-au putut încărca datele FaceitAnalyser pentru acest jucător.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};