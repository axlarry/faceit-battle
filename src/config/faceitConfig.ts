
export const FACEIT_CONFIG = {
  API_BASE: 'https://open.faceit.com/data/v4',
  API_KEYS: {
    FRIENDS_AND_TOOL: '67504c0b-4b7e-46c7-8227-1dd00f271614',
    LEADERBOARD: '4640b969-b9c4-4f35-a263-e0949fbe898e'
  },
  LIVE_MATCH_STATUSES: [
    'ONGOING',
    'IN_PROGRESS', 
    'LIVE',
    'VOTING',
    'CAPTAIN_PICK',
    'READY',
    'CONFIGURING',
    'PREPARING',
    'MANUAL_RESULT',
    'PAUSED'
  ]
} as const;
