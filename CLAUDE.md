# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Faceit Battle** — A React-based CS2 (Counter-Strike 2) friend tracker and leaderboard built with Vite, TypeScript, and shadcn/ui. The app runs as both a standalone web app and as a Discord Activity, fetching data from the FACEIT API via Supabase Edge Functions and persisting friend data in Supabase Postgres.

## Key Technologies

- **Frontend**: Vite 5, React 18, TypeScript 5, Tailwind CSS, shadcn/ui
- **Data**: @tanstack/react-query, @supabase/supabase-js (client)
- **Backend**: Supabase Edge Functions (Deno/TypeScript), Supabase Postgres
- **Routing**: react-router-dom 6
- **Forms**: react-hook-form + @hookform/resolvers + zod
- **3D**: @react-three/fiber + @react-three/drei + three.js
- **Streaming**: hls.js for video playback
- **Styling**: CSS variables (HSL), tailwindcss-animate, glass-card/neon-border utilities

## Development Commands

```bash
npm run dev          # Start dev server (port 8080, or $PORT env)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run preview      # Preview production build
```

## Project Structure

```
src/
  App.tsx                 # Root layout with QueryClient, TooltipProvider, Routes
  main.tsx                # Entry point
  index.css               # Tailwind + CSS variables + animations
  pages/
    Index.tsx             # Main page: Header + RegionTabs + content tabs
    Auth.tsx              # Authentication page
    NotFound.tsx
  components/
    faceit/               # Core app components (~50+ components)
    streaming/            # Live stream & recording components
    ui/                   # shadcn/ui primitives
    common/               # Shared utilities (LazyWrapper)
  hooks/
    useFriends.ts         # Core friend CRUD (add/update/remove)
    usePlayerModal.ts     # Player detail modal state
    useFaceitApi.ts       # FACEIT API hooks
    useLcryptApi.ts       # lcrypt.eu API hooks
    useLiveStreams.ts     # Live stream hooks
    useRecordings.ts      # Recording hooks
    useAuthSession.ts     # Auth persistence
    useFriendsAutoUpdate.ts
    useOptimizedFriendsManager.ts
    # ... more domain hooks
  services/
    faceitApiClient.ts    # Central FACEIT API client (deduped, cached, 90s TTL)
    apiService.ts
    friendDataProcessor.ts  # Nickname sync & lcrypt enrichment
    playerStatsService.ts
    playerMatchesService.ts
    leaderboardService.ts
    liveMatchService.ts
    faceitAnalyserService.ts
    faceitAnalyserTodayService.ts
    streamingService.ts
    recordingsService.ts
    playerService.ts
    playerTodayService.ts
    enrichedPlayerService.ts
    optimizedApiService.ts
    playerSearchService.ts
  types/
    Player.ts             # Player, Match interfaces
    streaming.ts          # Stream/Recording types
  lib/
    discordProxy.ts       # Discord Activity proxy helpers
    utils.ts              # Shared utilities
supabase/
  functions/              # Edge Functions (Deno/TS)
    friends-gateway/index.ts   # Friend CRUD + nickname sync + refresh_all
    proxy-faceit/index.ts      # FACEIT API proxy (rate-limited, allowlisted)
    get-faceit-analyser-data/
    proxy-image/
  migrations/             # Supabase SQL migrations
  config.toml
.env                      # Vite env vars (SUPABASE_URL, SUPABASE_ANON_KEY)
```

## Architecture

### API Flow

1. **Edge Function Proxy** (`proxy-faceit`): All FACEIT API calls route through this Deno edge function which:
   - Validates endpoints against an allowlist regex
   - Rate-limits per IP (60 req/min)
   - Retries with exponential backoff
   - Returns 429 on rate limit, 404→empty array for search
   - Supports two API keys (default + leaderboard)

2. **Friends Gateway** (`friends-gateway`): A monolithic edge function handling all friend operations:
   - `list` — fetches friends from Supabase (no password)
   - `add` / `update` / `remove` — mutations requiring password
   - `sync_nickname` — syncs FACEIT nickname changes
   - `refresh_all` — bulk refreshes ELO/level via FACEIT API
   - `update_cache` — high-throughput cache updates
   - `migrate_auto` — migrates from legacy owner_id

3. **Frontend Clients**:
   - `optimizedApiService.dedupedRequest()` — debounces and dedupes concurrent requests
   - `faceitApiClient.makeApiCall()` — calls `proxy-faceit` with 90s cache
   - `invokeEdgeFunction()` — invokes edge functions, with Discord Activity proxy when `isDiscordActivity()` is true

### Discord Activity Support

When running inside Discord's Activity iframe (hostname includes `discordsays.com`), the app proxies all external requests:
- Supabase: `/.proxy/supabase` → `https://rwizxoeyatdtggrpnpmq.supabase.co`
- FACEIT CDN images: proxied via `proxy-image` edge function
- lacurte.ro: proxied via `/.proxy/lacurte`

URL mappings are configured in Discord Developer Portal (see `src/lib/discordProxy.ts`).

### State Management

- **React Query** (`@tanstack/react-query`) manages server state with caching and background refetch
- **Friends state** is local to `useFriends()` hook, loaded from `friends-gateway` on mount
- **Player modal** state is managed by `usePlayerModal()` hook
- **Region tabs** state (`FRIENDS | LEADERBOARD | TEAM_BALANCER | FACEIT_TOOL | LIVE_STREAMS`) is local state in `Index.tsx`

### Key Components

- **Index.tsx** — Orchestrates the app: renders Header, RegionTabs, and the active tab's content (FriendsSection, LeaderboardTable, TeamBalancer, FaceitTool, LiveStreamsTab) plus PlayerModal
- **FriendsSection** — Displays the friends list with search, add, update, remove capabilities
- **LeaderboardTable** — Shows FACEIT leaderboard for a selected region
- **TeamBalancer** — Balances players into two teams
- **FaceitTool** — Player search and lookup
- **PlayerModal** — Detailed player view with stats, matches, and actions

## Running the Supabase Backend

The edge functions run on Supabase's hosting. To invoke them from the frontend, the `VITE_SUPABASE_*` env vars in `.env` must point to the correct project. The Supabase project is `rwizxoeyatdtggrpnpmq`.

To test edge functions locally:
```bash
npx supabase start
npx supabase functions serve
```

## Tailwind Configuration

- `tailwind.config.ts` extends theme with custom animations (float, orbital, shimmer, ELO state animations, holiday effects)
- `src/index.css` defines CSS variables and utility classes (glass-card, neon-border, bg-grid, app-aurora, cs2-animated-bg)
- Dark mode via class toggle (`dark` class on element)

## Key Files to Know

- `.env` — Vite environment variables (SUPABASE credentials)
- `.mcp.json` — MCP server config (Supabase)
- `tsconfig.json` — Base config with `@/*` path alias pointing to `src/`
- `vite.config.ts` — Vite config (port 8080, Lovable tagger in dev)
- `supabase/functions/friends-gateway/index.ts` — Monolithic friend CRUD edge function
- `supabase/functions/proxy-faceit/index.ts` — FACEIT API proxy with rate limiting
- `src/lib/discordProxy.ts` — Discord Activity proxy helpers
- `src/hooks/useFriends.ts` — Core friends hook
- `src/services/faceitApiClient.ts` — Central FACEIT client
- `src/services/friendDataProcessor.ts` — Nickname sync & lcrypt enrichment
- `.lovable/plan.md` — Current active development plan (fix 401 errors, display lcrypt rankings)
- `BACKEND_SETUP.md` — Romanian-language backend setup guide for MySQL (legacy reference)

## Style Notes

- Component files use `@/` path aliases consistently (e.g., `@/components/faceit/FriendInfo`)
- Tailwind classes use HSL variable syntax (e.g., `hsl(var(--primary))`)
- The app uses a holiday/winter theme by default (red/green/gold palette)
- Animations are defined in `tailwind.config.ts` and reused as utility classes in `index.css`
- Error boundaries use `ErrorBoundary` component (shadcn/ui)
- Toasts use `sonner` (via `use-toast` hook)
