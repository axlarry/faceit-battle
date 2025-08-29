import React from 'react';
import { Player } from "@/types/Player";

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

interface TeamGroup {
  id: string;
  players: FriendWithLcrypt[];
  matchCriteria: any;
  color: string;
}

interface TeamConnectionOverlayProps {
  teams: TeamGroup[];
}

export const TeamConnectionOverlay = ({ teams }: TeamConnectionOverlayProps) => {
  const [playerPositions, setPlayerPositions] = React.useState<Record<string, { top: number; left: number }>>({});

  React.useEffect(() => {
    // Find positions of all team players' avatars
    const positions: Record<string, { top: number; left: number }> = {};
    
    teams.forEach(team => {
      team.players.forEach(player => {
        const playerElement = document.querySelector(`[data-player-id="${player.player_id}"]`);
        if (playerElement) {
          const rect = playerElement.getBoundingClientRect();
          const container = document.querySelector('.relative.space-y-3.px-1');
          const containerRect = container?.getBoundingClientRect();
          
          if (containerRect) {
            // Get avatar position relative to the friends list container
            const avatarElement = playerElement.querySelector('[data-avatar]');
            const avatarRect = avatarElement?.getBoundingClientRect();
            
            if (avatarRect) {
              positions[player.player_id] = {
                top: avatarRect.top - containerRect.top + avatarRect.height / 2,
                left: avatarRect.left - containerRect.left + avatarRect.width / 2
              };
            }
          }
        }
      });
    });
    
    setPlayerPositions(positions);
  }, [teams]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <svg className="w-full h-full">
        {teams.map(team => {
          const teamPositions = team.players
            .map(player => ({
              id: player.player_id,
              position: playerPositions[player.player_id]
            }))
            .filter(p => p.position);

          if (teamPositions.length < 2) return null;

          // Generate lines connecting all team members
          const lines = [];
          for (let i = 0; i < teamPositions.length - 1; i++) {
            const start = teamPositions[i].position;
            const end = teamPositions[i + 1].position;
            
            lines.push(
              <line
                key={`${team.id}-${i}`}
                x1={start.left}
                y1={start.top}
                x2={end.left}
                y2={end.top}
                stroke="rgb(34, 197, 94)"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="animate-pulse"
                opacity="0.8"
              />
            );
          }

          // Add glowing dots at each player position
          const dots = teamPositions.map(({ id, position }) => (
            <circle
              key={`dot-${id}`}
              cx={position.left}
              cy={position.top}
              r="4"
              fill="rgb(34, 197, 94)"
              className="animate-pulse"
              opacity="0.9"
            />
          ));

          return (
            <g key={team.id}>
              {lines}
              {dots}
            </g>
          );
        })}
      </svg>
    </div>
  );
};