
import { Button } from "@/components/ui/button";
import { Player } from "@/types/Player";
import { UserPlus, UserMinus, ExternalLink } from "lucide-react";

interface PlayerActionsProps {
  player: Player;
  isFriend: boolean;
  onFriendAction: () => void;
}

export const PlayerActions = ({ player, isFriend, onFriendAction }: PlayerActionsProps) => {
  return (
    <div className="flex gap-3 justify-center">
      <Button
        onClick={onFriendAction}
        className={`px-4 py-2 font-medium text-sm ${
          isFriend
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
        } text-white border-0`}
      >
        {isFriend ? (
          <>
            <UserMinus size={14} className="mr-2" />
            Șterge din Prieteni
          </>
        ) : (
          <>
            <UserPlus size={14} className="mr-2" />
            Adaugă la Prieteni
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white px-4 py-2 text-sm"
        onClick={() => window.open(`https://www.faceit.com/en/players/${player.nickname}`, '_blank')}
      >
        <ExternalLink size={14} className="mr-2" />
        Vezi pe FACEIT
      </Button>
    </div>
  );
};
