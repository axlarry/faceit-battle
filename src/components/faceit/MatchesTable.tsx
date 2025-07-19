
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Player, Match } from "@/types/Player";
import { Trophy } from "lucide-react";
import { MatchRow } from "./MatchRow";
import { MatchDetailsModal } from "./MatchDetailsModal";
import { useState } from "react";

interface MatchesTableProps {
  player: Player;
  matches: Match[];
  matchesStats: {[key: string]: any};
  loadingMatches: boolean;
}

export const MatchesTable = ({ player, matches, matchesStats, loadingMatches }: MatchesTableProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setShowMatchDetails(true);
  };

  const closeMatchDetails = () => {
    setShowMatchDetails(false);
    setSelectedMatch(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-bold text-white">Meciurile Recente (Ultimele 10)</h3>
        <span className="text-sm text-gray-400 ml-2">Click pe un meci pentru detalii</span>
      </div>
      
      {loadingMatches ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
          <div className="text-gray-400 mt-3">Se încarcă meciurile...</div>
        </div>
      ) : (!matches || matches.length === 0) ? (
        <div className="text-center py-8">
          <div className="text-gray-400">Nu s-au găsit meciuri recente pentru {player.nickname}</div>
          <div className="text-sm text-gray-500 mt-2">Datele de meciuri vor fi afișate aici când sunt disponibile</div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-300 font-semibold">Rezultat</TableHead>
                <TableHead className="text-gray-300 font-semibold">Hartă</TableHead>
                <TableHead className="text-gray-300 font-semibold">Scor</TableHead>
                <TableHead className="text-gray-300 font-semibold">K/D/A</TableHead>
                <TableHead className="text-gray-300 font-semibold">K/D</TableHead>
                <TableHead className="text-gray-300 font-semibold">HS%</TableHead>
                <TableHead className="text-gray-300 font-semibold">ADR</TableHead>
                <TableHead className="text-gray-300 font-semibold">ELO</TableHead>
                <TableHead className="text-gray-300 font-semibold">Data</TableHead>
                <TableHead className="text-gray-300 font-semibold">Demo</TableHead>
                <TableHead className="text-gray-300 font-semibold">Durată</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match, index) => (
                <MatchRow
                  key={match.match_id}
                  match={match}
                  player={player}
                  matchesStats={matchesStats}
                  onMatchClick={handleMatchClick}
                  matchIndex={index}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MatchDetailsModal
        match={selectedMatch}
        player={player}
        matchesStats={matchesStats}
        isOpen={showMatchDetails}
        onClose={closeMatchDetails}
      />
    </div>
  );
};
