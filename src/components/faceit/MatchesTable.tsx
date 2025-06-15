
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

interface MatchesTableProps {
  player: Player;
  matches: Match[];
  matchesStats: {[key: string]: any};
  loadingMatches: boolean;
}

export const MatchesTable = ({ player, matches, matchesStats, loadingMatches }: MatchesTableProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-bold text-white">Meciurile Recente (Ultimele 10)</h3>
      </div>
      
      {loadingMatches ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
          <div className="text-gray-400 mt-3">Se încarcă meciurile...</div>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400">Nu s-au găsit meciuri recente</div>
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
                <TableHead className="text-gray-300 font-semibold">Durată</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <MatchRow
                  key={match.match_id}
                  match={match}
                  player={player}
                  matchesStats={matchesStats}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
