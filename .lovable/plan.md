
## Fix: 401 Errors and lcrypt Data Display

### Problem Analysis

There are **two separate issues**:

1. **401 Unauthorized errors flooding the console**: The `sync_nickname` action in `friendDataProcessor.ts` sends requests to `friends-gateway` with `password: ""` (empty string from localStorage). The edge function correctly rejects these with 401. Although the error is caught silently in code, the browser still logs the HTTP 401 in the console/network tab, which triggers the "Try to fix" error overlay.

2. **lcrypt data IS working correctly**: The console logs confirm data is being fetched and rendered (ELO=1445 for Neiikkusss, ELO=2399 for skar, etc.). The "No data" shown under "Today" is correct behavior - `today.present` is `false` for these players because they haven't played any matches today. The ranking data (country_ranking, region_ranking) is available in the lcrypt response but is **not displayed** in the UI because `FriendInfo.tsx` only shows ELO, level, and today's change.

### Fix Plan

**Step 1: Skip sync_nickname when no password is stored**

File: `src/services/friendDataProcessor.ts`

Before attempting the `sync_nickname` call, check if a password is actually stored. If `storedPassword` is empty/null, skip the entire sync request. This eliminates all 401 errors.

```
const storedPassword = localStorage.getItem('faceit_friends_password') || '';

// Only sync if password is available
if (storedPassword) {
  // ... invoke sync_nickname
}
```

**Step 2: Display lcrypt ranking data in the UI**

File: `src/components/faceit/FriendInfo.tsx`

Add country flag, country ranking, and region ranking from `lcryptData` below the ELO display. This will show the data that is already being fetched but not displayed:

- Country flag emoji (e.g., flag from lcryptData.country_flag)
- Country ranking (e.g., "#12,629")
- Region ranking (e.g., "EU #767,762")

### Technical Details

- `friendDataProcessor.ts` line ~83: Add guard `if (storedPassword)` around the sync block
- `FriendInfo.tsx` lines 56-59: Add a new row showing country flag + rankings from lcryptData when available
- No edge function changes needed - the functions are working correctly
- No database changes needed
