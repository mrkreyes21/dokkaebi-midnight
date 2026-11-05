# DOKKAEBI: The Midnight Game 도깨비

> *One village. Thirty seconds. How many mischievous spirits can you catch?*

A casual Korean folklore–inspired cute horror game built as a Facebook Instant Game (Meta Instant Games). Tap glowing Dokkaebi spirits before they vanish, avoid the cursed ones, and compete on the global leaderboard.

---

## Table of Contents

- [Game Overview](#game-overview)
- [Gameplay Rules & Scoring](#gameplay-rules--scoring)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [Database Migrations](#database-migrations)
- [Backend Deployment](#backend-deployment)
- [Facebook Instant Games Setup & Staging](#facebook-instant-games-setup--staging)
- [Score Validation Approach & Limitations](#score-validation-approach--limitations)
- [Asset Credits](#asset-credits)
- [Known Issues & Trade-offs](#known-issues--trade-offs)
- [AI-Assisted Development Notes](#ai-assisted-development-notes)

---

## Game Overview

**DOKKAEBI: The Midnight Game** is a 30-second reflex tapper set in a haunted Korean midnight village. Circular spirit targets appear on screen, shrink as their time runs out, and vanish if untouched. Click or tap them to earn points. The game runs inside Facebook Instant Games and stores scores on a server-side validated backend.

| Feature | Status |
|---|---|
| 30-second round | ✅ |
| Shrinking circular targets | ✅ |
| Touch and mouse input | ✅ |
| Score feedback + combo | ✅ |
| Game-over screen with leaderboard | ✅ |
| Share action with generated image | ✅ |
| Personal best persisted between sessions | ✅ |
| Backend score validation | ✅ |
| Facebook Instant Games platform adapter | ✅ |
| Public HTTPS backend deployment | ⚙️ See [Backend Deployment](#backend-deployment) |
| Facebook staging link | ⚙️ See [Facebook Setup](#facebook-instant-games-setup--staging) |

---

## Gameplay Rules & Scoring

### Target Types

| Spirit | Points | Lifetime | Colour | Notes |
|---|---|---|---|---|
| **Baby Dokkaebi** | +1 | 2.0s | Cyan | Most common, spawns from the start |
| **Golden Dokkaebi** | +5 | 1.5s | Gold | Rare, appears after 5 seconds |
| **Fire Spirit** | +3 | 1.5s | Teal | Medium rarity, appears after 8 seconds |
| **Cursed Dokkaebi** | **−2** | 1.8s | Crimson | Penalty trap, avoid! Appears after 10 seconds |
| **Ancient Dokkaebi** | +10 | 1.2s | Purple | Very rare, appears after 20 seconds |

### Scoring Rules

- Tapping a target within its shrinking lifetime awards its point value.
- **Combo Bonus:** Every 5 consecutive positive catches awards +2 bonus points.
- Tapping a Cursed Dokkaebi resets your combo streak and deducts 2 points.
- Missed targets do not penalise; only tapped cursed targets do.
- Final score minimum is 0 (cannot go negative).
- **Difficulty Progression:** Spawn rate increases over the 30 seconds, with a "Final Frenzy" in the last 5 seconds (40% faster spawning).

### Deterministic Schedule

The server generates a **deterministic target schedule** from a session seed using a mulberry32 PRNG. The same seed always produces the same sequence of targets, positions, and timings. This allows the backend to replay and validate every tap the client reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Game engine** | Phaser 3 (v3.90+) |
| **Game language** | TypeScript (ES2022) |
| **Game bundler** | Vite (v6+) |
| **Backend runtime** | Node.js 20+ |
| **Backend framework** | Express (v4) |
| **Backend language** | TypeScript (ESM) |
| **Database** | PostgreSQL 15+ |
| **Validation library** | Zod |
| **Test runner** | Vitest |
| **Platform SDK** | Meta Instant Games SDK 7.1 |
| **Package manager** | npm workspaces (monorepo) |

---

## Repository Structure

```
dokkaebi-midnight/
├── game/                        # Phaser 3 game client (Vite)
│   ├── src/
│   │   ├── config/              # Game constants, Phaser config
│   │   ├── entities/            # DokkaebiTarget game object
│   │   ├── scenes/              # Boot, Preload, Menu, Game, GameOver scenes
│   │   ├── services/
│   │   │   ├── platform/        # IPlatformService, Facebook, Mock adapters
│   │   │   ├── ApiService.ts    # Backend HTTP client
│   │   │   ├── AudioService.ts  # Web Audio API sound effects
│   │   │   └── ShareCardService.ts  # Canvas-generated share image
│   │   └── systems/             # GameClock, ScoreTracker, TargetSpawnManager
│   ├── public/
│   │   └── fbapp-config.json    # Facebook Instant Games bundle config (copied into dist)
│   └── index.html               # Loads FB Instant SDK + game module
│
├── backend/                     # Express REST API
│   ├── src/
│   │   ├── config/env.ts        # Zod-validated environment config
│   │   ├── database/
│   │   │   ├── pool.ts          # PostgreSQL connection pool
│   │   │   ├── migrate.ts       # Migration runner
│   │   │   └── migrations/      # Versioned .sql migration files
│   │   ├── middleware/          # auth, error handling, rate limiting
│   │   ├── routes/              # /api/game, /api/leaderboard, /api/players
│   │   ├── services/            # identity, session, validation, score, leaderboard
│   │   └── tests/               # Vitest test suite
│   ├── Procfile                 # Heroku/Render start command
│   └── railway.json             # Railway deployment config
│
├── shared/                      # Shared TypeScript types (npm workspace)
│   └── src/
│       ├── game.types.ts        # TargetType, ScheduledTarget, event types
│       └── api.types.ts         # API request/response contracts
│
├── docs/
│   └── assets.md                # Asset inventory and licenses
│
├── .env.example                 # Environment variable template
└── package.json                 # Monorepo root (npm workspaces)
```

---

## Prerequisites

- **Node.js** >= 20 LTS
- **npm** >= 10 (comes with Node.js 20+)
- **PostgreSQL** >= 15 for local backend development
  - `brew install postgresql@15` on macOS, or use Docker
  - Or use a free-tier hosted instance (see [Backend Deployment](#backend-deployment))

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/<YOUR_USERNAME>/dokkaebi-midnight.git
cd dokkaebi-midnight

# 2. Install all workspace dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your actual values (see Environment Variables below)

# 4. Build the shared types package (required before game/backend can run)
npm run build:shared
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the following:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 3000) | Backend server port |
| `NODE_ENV` | No (default: development) | development / production |
| `CORS_ORIGIN` | No | Allowed CORS origin (e.g. http://localhost:5173) |
| `DATABASE_URL` | **Yes** (for backend) | PostgreSQL connection string |
| `FB_APP_ID` | For FB integration | Your Meta App ID |
| `FB_APP_SECRET` | For FB integration | Your Meta App Secret (private — backend only) |

> **Never commit `.env` to Git.** It is already in `.gitignore`.

> **Note on `FB_APP_SECRET`:** This is the **private App Secret** from Meta App Dashboard → Settings → Basic. It is used server-side only to validate signed player tokens. Never expose it in the game client bundle.

---

## Running Locally

### Game (Phaser client)

```bash
npm run dev:game
# Opens http://localhost:5173
```

The game runs in **mock mode** when `window.FBInstant` is not present (i.e. outside the Facebook iframe). A `MockPlatformService` provides a local player identity and simulates sharing.

### Backend (Express API)

```bash
# Ensure PostgreSQL is running and DATABASE_URL is set in .env

# Run migrations first (creates tables)
npm run migrate

# Start the backend with hot-reload
npm run dev:backend
# API available at http://localhost:3000
```

Health check: `GET http://localhost:3000/health`

### Full Production Build

```bash
npm run build
# game/dist/ contains the uploadable FB Instant Games bundle
# backend/dist/ contains the compiled server
```

---

## Running Tests

```bash
# Run all backend unit tests
npm --workspace=@dokkaebi/backend test

# Watch mode
cd backend && npx vitest
```

**Test suite (9 tests, all pass):**

| Test | Covers |
|---|---|
| Accepts legitimate taps with correct score | Happy path |
| Rejects duplicate taps on same target | Double-counting prevention |
| Rejects unknown / fabricated target IDs | Client injection |
| Rejects taps outside target availability window | Lifetime enforcement |
| Rejects sub-100ms superhuman reflex speed | Bot detection |
| Rejects expired sessions | Replay attack prevention |
| Rejects sessions submitted prematurely (<28s) | Speed-hack prevention |
| Verifies genuine Facebook signed player info | Identity verification |
| Rejects tampered / forged signatures | Forge prevention |

---

## Database Migrations

```bash
# Apply all pending migrations
npm run migrate
```

Migrations live in `backend/src/database/migrations/` and are applied in alphabetical order. Applied versions are tracked in a `schema_migrations` table.

| File | Description |
|---|---|
| `001_create_players.sql` | players table with id, display_name, best_score |
| `002_create_game_sessions.sql` | game_sessions with seed, status, timestamps |
| `003_create_scores.sql` | scores linking players to sessions |

---

## Backend Deployment

### Railway.app (Recommended — free tier)

1. Create a Railway project, add a service pointing to the `backend` directory.
2. Add a **PostgreSQL** plugin — Railway injects `DATABASE_URL` automatically.
3. Set environment variables in the Railway dashboard:
   - `NODE_ENV=production`
   - `FB_APP_ID=<your app id>`
   - `FB_APP_SECRET=<your app secret>`
   - `CORS_ORIGIN=https://www.facebook.com`
4. The migration runner executes automatically on server start.

**After deploying:** Update `window.__API_URL__` in `game/index.html` to your Railway URL before rebuilding the game bundle.

### Alternative: Render.com

- Build command: `cd backend && npm install && npm run build`
- Start command: `node backend/dist/server.js`
- Add a PostgreSQL instance, copy the connection string to `DATABASE_URL`.

> **Free-tier sleep warning:** Render.com free instances sleep after 15 minutes of inactivity. Use Railway or a paid tier for a review deployment that must remain responsive.

---

## Facebook Instant Games Setup & Staging

> Do **not** submit to production or request Meta App Review. Staging/testing only.

### Create the App

1. Go to developers.facebook.com → My Apps → Create App → Game type.
2. Add the **Instant Games** product.
3. Under **Instant Games → Web Hosting**, upload `game/dist/` as a zip.
4. Under **Instant Games → Details**, set orientation to **Portrait**, minimum SDK version **7.1**.

### Build & Upload

```bash
# Set the production API URL in game/index.html before building:
# window.__API_URL__ = 'https://<YOUR_BACKEND_URL>';

npm run build:game

# Package the dist folder
cd game/dist && zip -r ../dokkaebi-game.zip . && cd -
```

> `fbapp-config.json` must be present in the dist root alongside `index.html`.

### Staging Test Link

After uploading a build:

1. Set the build to **Staged** (not Live).
2. Add yourself under **Roles → Test Users** as an Instant Games Test User.
3. Test link: `https://www.facebook.com/gaming/play/<APP_ID>/`

---

## Score Validation Approach & Limitations

### How It Works

The backend uses **deterministic schedule replay**:

1. **Session creation:** Server generates a unique seed, stores it, returns it to client.
2. **Client gameplay:** Client uses the seed to generate the identical target schedule (same PRNG → same targets, positions, timings).
3. **Score submission:** Client POSTs all tap events (`targetId`, `action`, `elapsedMs`) to `POST /api/game/sessions/:id/finish`.
4. **Server validation:** Server reconstructs the schedule from the stored seed and validates each event (see checks below).
5. **Authoritative score:** Server calculates score from verified taps only. Client's `clientScore` is never trusted.

**Validation checks:**

- Target exists in the authoritative schedule
- Target not tapped before (no duplicates)
- Tap within target lifetime (±250ms network/frame tolerance)
- Inter-tap delay ≥ 100ms (human motor limit)
- Total events ≤ 100 (plausibility cap)
- Session not expired (45-second window)
- Session ran for ≥ 28 seconds (prevents speed-hacking)

### Limitations

| Limitation | Explanation |
|---|---|
| Cannot prove human input | Server verifies timing plausibility but cannot distinguish a human from a carefully-timed bot. Standard for casual games. |
| Network tolerance windows | ±250ms and ±80ms tolerances are necessary for fairness under variable conditions, but widen the exploitable margin slightly. |
| Seed exposure | The seed is sent to the client so it can generate the schedule. A determined attacker could use the seed to know exactly which targets appear and when. |
| Clock drift | Relies on wall-clock deltas; severely drifted client clocks produce unusual timestamps, but session expiry limits the attack surface. |

---

## Asset Credits

All visual assets are either procedurally generated using Phaser's Graphics API (circles, gradients, rings) or generated specifically for this project using AI image generation tools.

**Typography (SIL Open Font License):**
- Outfit — Google Fonts
- Noto Serif KR — Google Fonts

**Audio:** All sound effects are synthesised programmatically using the **Web Audio API** (`AudioService.ts`). No external audio files are used or bundled.

See [`docs/assets.md`](docs/assets.md) for the full asset inventory.

---

## Known Issues & Trade-offs

| Issue | Notes |
|---|---|
| Mock leaderboard on backend failure | Game Over screen shows an offline indicator with local best score. No crash. |
| No real-time leaderboard updates | Leaderboard data is fetched once on the Game Over screen. No live push. |
| LocalStorage for best score | Clearing browser site data resets local best; backend `best_score` persists separately. |
| Free-tier DB cold starts | First backend request after inactivity may take 1–2 seconds. |
| FB SDK unavailable in local dev | The CDN script 404s outside the FB iframe (expected). `onerror` handler suppresses it; MockPlatformService activates silently. |
| No offline queue | If a player completes a round while offline, the score is not persisted to the leaderboard. |
| Score ceiling | Theoretical maximum is capped at 160 points by the validator. Must be recalculated if the schedule is changed. |

---

## AI-Assisted Development Notes

This project was developed with **Google Antigravity** (Gemini-based AI coding agent). The agent's contributions and developer review are documented here for transparency.

### Agent contributions

- **Phase 0:** Repository inspection, dependency verification (Phaser version pinning, FB SDK version), architecture proposal, risk analysis.
- **Phase 1 & 2:** Full Phaser 3 scene graph, entity classes, game systems, procedural audio synthesis, share card canvas generator.
- **Phase 3:** Complete Express backend (routes, middleware, services), PostgreSQL migration SQL, Zod validation, rate limiting, deterministic replay validation, Vitest test suite.
- **Phase 4:** `fbapp-config.json`, FB SDK loading strategy in `index.html`, platform service abstraction.
- **Phase 5:** Deployment configuration, README.

### Developer review

- Gameplay feel and target sizing verified on actual mobile devices.
- Validation tolerance windows reviewed for reasonableness in a casual game context.
- Security boundary confirmed: `FB_APP_SECRET` is backend-only and never referenced in the client bundle.
- Database migration SQL reviewed for correctness and index usage.
- Seed determinism manually verified by running the same seed twice and comparing outputs.
- Facebook App Dashboard setup performed manually (agent documented steps, cannot access the dashboard).

### Key architectural decisions

| Decision | Rationale |
|---|---|
| **Phaser 3 (not 4)** | Phaser 4 was in alpha at build time with breaking API changes. Phaser 3.90+ is stable. |
| **Deterministic PRNG schedule** | Avoids a persistent WebSocket while enabling server-side validation. Trade-off: seed is visible to client. |
| **Platform adapter pattern** | Decouples game logic from the FB SDK. Same codebase runs in browser dev mode and FB iframe without scattered `if (fbInstant)` checks. |
| **npm workspaces** | Minimal tooling overhead; sufficient for a 3-package monorepo with no complex build graph. |
| **Zod for env + route validation** | Catches missing/malformed config at startup. Schema serves as inline documentation. |
