
export const FACEIT_CONFIG = {
  API_BASE: 'https://open.faceit.com/data/v4',
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
    'PAUSED',
    'SUBSTITUTION',
    'WARMUP',
    'KNIFE_ROUND'
  ]
} as const;
