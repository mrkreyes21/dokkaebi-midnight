# DOKKAEBI: The Midnight Game

## Product Concept, Technical Plan, and AI Agent Build Instructions

**Project type:** Facebook Instant Game\
**Working title:** DOKKAEBI: The Midnight Game\
**Genre:** Casual arcade / reflex / cute horror\
**Core session:** 30 seconds\
**Recommended stack:** Phaser 3 + TypeScript, Node.js + Express,
PostgreSQL\
**Repository:** One monorepo containing the game and backend

------------------------------------------------------------------------

# 1. Purpose of This Document

This document is the product brief and implementation plan for the Tap
Rush take-home challenge. It is intended to be provided to an AI coding
agent (such as Antigravity) as the source of truth for planning and
implementation.

The agent must preserve the required gameplay and deliverables. It may
suggest improvements, but must not silently remove requirements or add
unnecessary complexity.

## Instructions to the AI coding agent

1.  Read this entire document before changing files.
2.  Inspect the existing repository and report its current state before
    making changes.
3.  If the repository is empty, propose and create the monorepo
    structure below.
4.  Work in small, reviewable phases. Do not generate the entire
    application in one step.
5.  Before each phase, state the files to be created or changed and the
    acceptance criteria.
6.  After each phase, run the relevant checks and report what passed,
    failed, or remains incomplete.
7.  Do not claim that Facebook Instant Games integration, deployment,
    security, or tests work unless they have actually been configured
    and verified.
8.  Prefer simple, maintainable solutions over speculative abstractions.
9.  Do not introduce paid services or external dependencies without
    explaining why they are needed.
10. Ask for clarification when a required credential, Meta app setting,
    deployment decision, or product decision is unavailable. Never
    invent credentials or IDs.

------------------------------------------------------------------------

# 2. Challenge Requirements (Non-Negotiable)

The finished project must satisfy all of the following:

## Game

-   A round lasts exactly 30 seconds of active gameplay.
-   Circular targets appear in the play area and shrink over time.
-   Tapping or clicking a valid target awards points.
-   The game-over screen displays:
    -   The current round's score.
    -   The player's best score.
    -   A Share action that shares an image.
    -   A Play Again action.
    -   A top-10 leaderboard.
-   The game supports touch and mouse input.
-   The game layout works on phone and desktop.
-   The player's best score persists between sessions.
-   The game runs as a Facebook Instant Game, staged for testing only.

## Backend

-   The backend stores leaderboard scores.
-   The backend must not blindly trust a score value supplied by the
    client.
-   The backend must validate submitted game results using a documented
    validation approach.
-   The backend must be deployed to a public HTTPS URL and remain
    available during review.

## Hand-in

-   A Facebook Instant Game play link in the form:
    `https://www.facebook.com/gaming/play/<APP_ID>/`
-   One GitHub repository containing both game and backend.
-   A clear README explaining setup, architecture, decisions, testing,
    deployment, and limitations.

Do not submit the game to production or request Meta app review. Use the
testing/staging flow required by the challenge.

------------------------------------------------------------------------

# 3. Game Concept

## Title

**DOKKAEBI: THE MIDNIGHT GAME**

Korean title treatment: **도깨비**

**Tagline:** One village. Thirty seconds. How many spirits can you
catch?

## High-level concept

The player has wandered into a mysterious Korean village during a
full-moon night. Mischievous Dokkaebi have appeared throughout the
village and challenge the player to a fast 30-second catching game.

The player taps or clicks the spirits before their circular timers
shrink away. Some spirits are worth more points; a cursed spirit is
dangerous and should be avoided.

The experience combines: - The instantly understandable reflex loop of a
casual tapping arcade game. - Cute, expressive supernatural
characters. - A cinematic night-time setting inspired by Korean
traditional architecture and folklore. - A competitive leaderboard and
shareable score card.

Dokkaebi are varied supernatural beings in Korean folklore, not simply
interchangeable with Western goblins. The game's creatures are original,
playful interpretations inspired by the folklore. Avoid presenting
invented game mechanics as authentic folklore.

## Tone and audience

-   Cute horror rather than graphic horror.
-   Mysterious, playful, magical, and slightly spooky.
-   Suitable for a broad casual-game audience.
-   No gore, disturbing imagery, or intense jump scares.
-   Clear visual feedback and short sessions that encourage replay.

## Art direction

**Visual style:** Cinematic dark fantasy with cute character designs.

**Environment:** A traditional Korean village at night, with hanok
rooftops, wooden gates, lanterns, a large moon, distant mountains,
drifting mist, and floating fireflies.

**Character style:** Original rounded Dokkaebi characters with
expressive eyes, small horns, readable silhouettes, and magical effects.
Each target type must be distinguishable by both shape/animation and
color so color alone is not required to identify it.

**Suggested palette:**

  Purpose            Color           Hex
  ------------------ --------------- -----------
  Main background    Midnight plum   `#171326`
  Deep environment   Night navy      `#263C61`
  Common spirit      Spirit cyan     `#58C9ED`
  Bonus spirit       Warm gold       `#D7AD66`
  Hazard             Muted crimson   `#C76E7E`
  Main text          Warm ivory      `#F4EBDD`

Use readable typography. A Korean-inspired display treatment may be used
for the title, but all gameplay instructions, controls, scores, and
buttons must remain easy to understand in English.

Avoid excessive particles, blur, or screen effects that reduce target
visibility or hurt performance on mobile devices.

------------------------------------------------------------------------

# 4. Core Gameplay Specification

## Round flow

1.  The player opens the game and sees the main menu.
2.  The player taps/clicks **Play**.
3.  The game starts a 30-second round after any brief ready/countdown
    transition.
4.  Targets spawn at safe positions inside the play area.
5.  Each target has a visible shrinking lifetime indicator.
6.  The player taps/clicks targets before they disappear.
7.  The game ends when the 30-second timer reaches zero.
8.  The game-over screen displays the score, personal best, share
    action, replay action, and top-10 leaderboard.

The timer must be based on elapsed time, not on counting frame updates,
so it remains accurate if frame rate changes.

## Target types and proposed scoring

  ------------------------------------------------------------------------
  Target                Visual direction                      Score effect
  --------------------- --------------------- ----------------------------
  Baby Dokkaebi         Small cyan/blue                                 +1
                        friendly spirit       

  Golden Dokkaebi       Gold body or gold                               +5
                        aura                  

  Fire Spirit           Distinct floating                               +3
                        blue flame            

  Cursed Dokkaebi       Purple/red-accented                             -2
                        mischievous spirit    

  Ancient Dokkaebi      Rare ornate spirit                             +10
                        with a distinct       
                        silhouette            
  ------------------------------------------------------------------------

These are original game characters and proposed scoring rules, not
claims about traditional folklore.

## Initial balancing values

Treat these values as configurable constants and tune them during
playtesting.

  Parameter                                         Initial value
  ------------------------------ --------------------------------
  Round duration                                       30 seconds
  Common target lifetime                              2.0 seconds
  Golden target lifetime                              1.5 seconds
  Fire Spirit lifetime                                1.5 seconds
  Cursed target lifetime                              1.8 seconds
  Ancient target lifetime                             1.2 seconds
  Initial spawn interval                                   850 ms
  Minimum spawn interval                                   450 ms
  Maximum simultaneous targets                                  5
  Combo threshold                  5 consecutive positive catches

Do not spawn targets under HUD controls, outside the playable area, or
so close together that they are difficult to distinguish. Prevent
accidental double scoring for one target.

## Difficulty progression

-   **0--10 seconds --- Warm-up:** Mostly common targets; comfortable
    spawn interval.
-   **10--20 seconds --- The Hunt:** Slightly faster spawning; introduce
    more special and hazard targets.
-   **20--30 seconds --- Midnight Frenzy:** Faster spawning, more visual
    energy, and a subtle red-moon atmosphere.

Difficulty must increase gradually. Do not make the game unfair by
spawning targets faster than the player can reasonably interact with
them.

## Combo system

Every five consecutive positive catches trigger a combo reward or a
short multiplier. A missed target should not automatically punish the
player unless that behavior is deliberately tested and documented.

Keep the combo UI compact and readable. The scoring logic must be
deterministic and testable.

## Optional power-up

**Moon Blessing:** A rare blue-flame event that briefly slows target
shrinking. This is optional and should only be added after the required
gameplay, game-over screen, leaderboard, and Facebook integration work.

## Input and accessibility

-   Use a unified pointer-input approach that supports mouse and touch.
-   Targets must have generous hit areas.
-   Do not rely only on color to distinguish target types.
-   Avoid tiny text and controls.
-   Respect reduced-motion preferences where practical.
-   Provide sound on/off control.
-   Audio must not be required to understand the game.
-   Prevent browser gestures or page scrolling from interfering with
    gameplay where appropriate.

------------------------------------------------------------------------

# 5. Screen and UX Requirements

## A. Loading screen

-   Show the game logo and a simple loading indicator.
-   Preload only required assets.
-   Show loading progress where supported by the Instant Games SDK.
-   Handle asset-loading failures gracefully with a retry or fallback
    message.

## B. Main menu

Must include: - Game title: DOKKAEBI: THE MIDNIGHT GAME. - A visible
Play button. - Player's best score. - Leaderboard entry point or
preview. - Sound toggle. - A short instruction such as: "Catch the
spirits before they disappear!"

Visual direction: - Full-moon Korean village background. - One animated
Dokkaebi mascot. - Subtle lantern/firefly animation. - Clear contrast
around the Play button.

## C. Gameplay screen

Must include: - 30-second countdown. - Current score. - Optional combo
indicator. - Play area containing targets. - Visible target
shrink/lifetime feedback. - Pause/resume behavior if supported by the
platform and chosen design.

HUD controls must not overlap target spawn areas. The game must handle
tab/app backgrounding and resuming without accidentally granting extra
time.

## D. Game-over screen

Must include all challenge-required elements: - Final score. - Best
score. - Share action with an image. - Play Again action. - Top-10
leaderboard.

Also include: - New personal best treatment when applicable. - Loading,
empty, and error states for leaderboard retrieval. - A retry option if
score submission fails. - Clear distinction between a locally achieved
score and a server-accepted leaderboard score.

Do not show a score as submitted successfully until the backend confirms
acceptance.

## E. Leaderboard

Display: - Rank. - Player display name. - Score. - Current player's row
when available.

Requirements: - Show the top 10 accepted scores. - Handle ties
consistently. - Handle empty leaderboard and network errors. - Do not
expose private player information. - Do not trust a client-provided
display name or player ID without server-side identity verification.

## F. Share image

Generate a share image from a local template/canvas or another reliable
client-side rendering approach. Do not require an image-generation API
for each share.

The image should include: - Game title/logo. - Player's achieved
score. - Best score, if useful. - Dokkaebi mascot. - Korean-inspired
night background. - A short challenge message, for example: "I caught 87
spirits in 30 seconds. Can you beat me?"

Use the official Instant Games sharing mechanism supported by the
current SDK. Verify the correct payload and image requirements against
current Meta documentation. Provide a graceful fallback if sharing is
unavailable in the test environment.

------------------------------------------------------------------------

# 6. Technical Stack and Architecture

## Recommended stack

  -----------------------------------------------------------------------
  Layer                   Technology              Reason
  ----------------------- ----------------------- -----------------------
  Game                    Phaser 3 + TypeScript   2D browser game engine
                                                  with input, scenes,
                                                  timing, and animation
                                                  support

  Build tooling           Vite                    Fast local development
                                                  and production bundling

  Backend                 Node.js + TypeScript +  Familiar, lightweight
                          Express                 API

  Database                PostgreSQL              Persistent player,
                                                  session, and score
                                                  records

  Validation              Server-side             Do not trust final
                          session/event           client score
                          validation              

  Hosting                 Any reliable public     Required public backend
                          HTTPS host              URL

  Platform                Facebook Instant Games  Facebook player,
                          SDK                     lifecycle, and sharing
                                                  integration
  -----------------------------------------------------------------------

Use compatible, maintained package versions. Check the current Phaser
and Meta Instant Games documentation rather than copying deprecated
examples.

## Monorepo structure

``` text
dokkaebi-midnight/
├── game/
│   ├── public/
│   │   ├── assets/
│   │   │   ├── backgrounds/
│   │   │   ├── characters/
│   │   │   ├── effects/
│   │   │   ├── audio/
│   │   │   └── ui/
│   │   └── fbapp-config.json
│   ├── src/
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   ├── PreloadScene.ts
│   │   │   ├── MenuScene.ts
│   │   │   ├── GameScene.ts
│   │   │   ├── GameOverScene.ts
│   │   │   └── LeaderboardScene.ts
│   │   ├── entities/
│   │   │   └── Dokkaebi.ts
│   │   ├── systems/
│   │   │   ├── SpawnManager.ts
│   │   │   ├── ScoreManager.ts
│   │   │   ├── ComboManager.ts
│   │   │   └── GameClock.ts
│   │   ├── services/
│   │   │   ├── FacebookService.ts
│   │   │   ├── ApiService.ts
│   │   │   └── ShareService.ts
│   │   ├── config/
│   │   └── main.ts
│   ├── index.html
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── game.routes.ts
│   │   │   └── leaderboard.routes.ts
│   │   ├── services/
│   │   │   ├── session.service.ts
│   │   │   ├── score.service.ts
│   │   │   └── validation.service.ts
│   │   ├── middleware/
│   │   ├── database/
│   │   ├── config/
│   │   └── server.ts
│   ├── migrations/
│   └── package.json
├── shared/
│   └── types/
│       └── api.types.ts
├── docs/
│   ├── architecture.md
│   └── score-validation.md
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

The exact structure may be adjusted if there is a strong reason. Avoid
creating empty files or unnecessary layers.

------------------------------------------------------------------------

# 7. Backend and Score Integrity

This is a high-priority engineering requirement. Never accept a request
containing only `{ playerId, score }` as proof of a legitimate game
result.

## Proposed session-based validation

1.  The client asks the backend to create a game session.
2.  The backend creates a random session ID, a server-generated seed,
    server start time, expiry time, and a deterministic target schedule
    or event-validation parameters.
3.  The client starts the round and uses the session's game
    configuration.
4.  During the round, the client records target interactions with target
    IDs and elapsed timestamps.
5.  At completion, the client submits the session ID and ordered
    interaction events.
6.  The backend validates session ownership, duration, event ordering,
    target IDs, target spawn/lifetime windows, duplicate taps, score
    rules, and maximum plausible score.
7.  The backend calculates the score itself and stores the accepted
    result.
8.  The backend updates the player's personal best and leaderboard data.

The backend must be the authority for the accepted score.
Client-reported score can be included for diagnostics but must not
determine the stored score.

## Important security limitation

A client event log is not cryptographic proof that a human tapped the
screen. A modified client can fabricate plausible events. Session-based
deterministic validation, server-issued session data, rate limits,
replay protection, and server-side score calculation make casual
manipulation harder, but do not guarantee perfect anti-cheat.

Document this limitation honestly. Do not claim the game is cheat-proof.

## API proposal

### `POST /api/game/sessions`

Creates a new session.

Example response:

``` json
{
  "sessionId": "server-generated-uuid",
  "seed": "server-generated-seed",
  "startedAt": "ISO-8601 timestamp",
  "expiresAt": "ISO-8601 timestamp",
  "gameConfigVersion": 1
}
```

Do not expose secrets or signing keys in this response.

### `POST /api/game/sessions/:sessionId/finish`

Submits a completed session's interaction events.

Example request:

``` json
{
  "events": [
    {
      "targetId": "target-001",
      "action": "tap",
      "elapsedMs": 1420
    },
    {
      "targetId": "target-004",
      "action": "tap",
      "elapsedMs": 2310
    }
  ]
}
```

The server must derive target properties and score from its session
configuration. Validate payload size, event count, types, timestamps,
and session state.

Example response:

``` json
{
  "accepted": true,
  "score": 24,
  "personalBest": 87,
  "isNewBest": false
}
```

### `GET /api/leaderboard?limit=10`

Returns the top 10 accepted scores, with a hard server-side maximum
limit.

### `GET /api/players/me`

Returns the authenticated player's best score and rank where available.

## Identity

Use the current official Meta Instant Games identity/authentication
flow. The backend must verify the relevant signed player identity or
authentication data using the documented server-side method. Never trust
a Facebook player ID sent by the client without verification.

If Meta identity verification cannot be completed during local
development, use a clearly separated development-only identity adapter.
Do not allow that adapter in production deployment.

## Database tables

### players

-   `id` UUID primary key
-   `facebook_player_id` unique verified platform identifier
-   `display_name`
-   `best_score`
-   `created_at`
-   `updated_at`

### game_sessions

-   `id` UUID primary key
-   `player_id` foreign key
-   `seed`
-   `started_at`
-   `expires_at`
-   `completed_at`
-   `status`
-   `config_version`

### scores

-   `id` UUID primary key
-   `player_id` foreign key
-   `session_id` unique foreign key
-   `score`
-   `created_at`

Use migrations and database constraints. Use transactions when accepting
a result and updating a personal best.

## Backend safeguards

-   Validate request schemas.
-   Verify player identity.
-   Enforce session ownership and expiry.
-   Make session completion idempotent or reject duplicate completion.
-   Reject duplicate target interactions.
-   Enforce plausible event timing and score limits.
-   Rate-limit session creation and score submission.
-   Apply appropriate CORS policy.
-   Keep secrets in environment variables.
-   Never commit `.env` files.
-   Log validation failures without logging secrets or sensitive
    authentication tokens.
-   Return useful error codes and messages without exposing internal
    stack traces.

------------------------------------------------------------------------

# 8. Facebook Instant Games Integration

The game must run as a Facebook Instant Game, not merely as a normal
website.

Implement a platform adapter so the core game does not depend directly
on Facebook SDK calls.

The adapter should support: - SDK initialization. - Loading progress. -
Starting the game after platform initialization. - Retrieving player
identity through the supported SDK flow. - Sharing through the supported
Instant Games API. - Handling unavailable platform capabilities. -
Pause/resume and lifecycle behavior where applicable.

For local development, provide a mock adapter so the game can be tested
in a normal browser. The mock must be visibly development-only and must
not be mistaken for production identity or score validation.

Before implementation, verify current Meta documentation and
developer-dashboard requirements for: - Instant Games app setup. - Test
users and staged builds. - Required configuration files. - Game URL and
HTTPS hosting. - SDK version and initialization. - Player
identity/authentication. - Share payload and image format. - Facebook
play-link availability.

Do not assume an older SDK example still works. Do not submit the app
for production review; the challenge requests testing/staging only.

The final README must clearly list the Meta dashboard steps that the
reviewer or developer must complete manually.

------------------------------------------------------------------------

# 9. Responsive Layout and Performance

Design portrait-first, but ensure the game also looks intentional on
desktop.

## Mobile

-   Use a portrait-oriented logical play area.
-   Make targets large enough for touch.
-   Keep score and timer away from the target spawn region.
-   Prevent accidental page scrolling during gameplay.
-   Keep buttons comfortably tappable.

## Desktop

-   Center the game area within the browser viewport.
-   Use decorative side space rather than stretching the playfield.
-   Support mouse clicks.
-   Ensure text and controls remain readable.

## Technical requirements

-   Use Phaser's scale manager and a deliberate resize strategy.
-   Preserve aspect ratio and avoid distorted sprites.
-   Use elapsed-time-based game timing.
-   Clean up scene timers, event listeners, and tweens.
-   Avoid excessive particle counts and expensive per-frame work.
-   Preload and reuse assets.
-   Handle visibility changes and platform interruptions.
-   Test at multiple viewport sizes and device pixel ratios.

------------------------------------------------------------------------

# 10. Testing Plan

## Game tests

-   Round ends at 30 seconds of active gameplay.
-   Tapping a valid target awards the correct score.
-   One target cannot score more than once.
-   Targets disappear after their lifetime.
-   Targets do not spawn outside safe play boundaries.
-   Hazard targets apply the correct penalty.
-   Combo logic works and resets correctly.
-   Replay starts a fresh round with no stale targets or timers.
-   Touch and mouse both work.
-   Resize does not break the game.
-   Backgrounding/resuming does not grant extra time.

## Backend tests

-   Valid session can be created.
-   Unauthenticated or unverified player cannot submit a ranked score.
-   Expired session is rejected.
-   Unknown target ID is rejected.
-   Duplicate tap is rejected.
-   Events outside target availability windows are rejected.
-   Impossible timestamps or event order are rejected.
-   Duplicate session completion is rejected.
-   Excessive payloads are rejected.
-   Score is calculated on the server.
-   Personal best updates only when appropriate.
-   Leaderboard returns no more than 10 entries.
-   Ties are handled consistently.
-   Database/network failure produces a safe error.

## Integration tests

-   Game can initialize through the Instant Games SDK.
-   Game can start and finish a round.
-   Accepted score appears in leaderboard.
-   Personal best persists after reload/new session.
-   Share action produces the expected image/payload.
-   API outage does not crash the game.
-   A failed score submission is communicated clearly and can be retried
    safely.

------------------------------------------------------------------------

# 11. Development Phases and Acceptance Criteria

Build in this order. Do not begin later phases until the current phase's
acceptance criteria pass, unless a dependency requires a small
preparatory task.

## Phase 0 --- Repository inspection and project plan

Tasks: - Inspect repository, package manager, existing code, and Git
status. - Confirm no existing work will be overwritten. - Check current
Meta Instant Games documentation and SDK status. - Propose final
architecture and dependency versions. - Identify required credentials
and manual dashboard tasks.

Acceptance: - Architecture and risks are documented. - No files are
overwritten without inspection. - The developer understands what must be
configured outside the codebase.

## Phase 1 --- Playable browser MVP

Tasks: - Set up Phaser, TypeScript, and Vite. - Build loading and main
menu scenes. - Implement the 30-second round. - Implement circular
targets, shrinking lifetime indicators, and pointer input. - Implement
scoring, game over, and replay. - Add a temporary local best score.

Acceptance: - A complete round can be played in a normal browser. -
Mouse and touch/pointer input work. - Timer and scoring behave
correctly. - Replay works without stale state.

## Phase 2 --- Visual polish

Tasks: - Add original or properly licensed environment and character
assets. - Add target spawn/catch/disappear animations. - Add score
feedback and combo. - Add sound toggle and sound effects. - Add
difficulty progression and final frenzy.

Acceptance: - Game has a coherent Korean folklore visual identity. -
Targets remain readable and tappable. - Performance is acceptable on a
typical mobile device. - No required gameplay behavior is obscured by
effects.

## Phase 3 --- Backend and persistence

Tasks: - Set up Express and PostgreSQL. - Add migrations and database
access. - Implement verified player identity flow. - Implement session
creation and server-side score validation. - Implement score submission,
personal best, and top-10 leaderboard. - Add rate limiting and safe
error handling.

Acceptance: - Scores are calculated by the backend, not trusted from the
client. - Valid scores persist. - Invalid/replayed/expired sessions are
rejected. - Leaderboard and personal best survive reloads.

## Phase 4 --- Facebook Instant Games

Tasks: - Implement the platform adapter. - Integrate the current
supported Instant Games SDK. - Configure app and game settings. -
Implement sharing with a generated image. - Test using the Meta
testing/staging process.

Acceptance: - Game launches from the Facebook Instant Games testing
link. - Player identity and sharing work in the supported test
environment. - The game handles platform lifecycle and failures
gracefully. - No production submission or app review is performed.

## Phase 5 --- Deployment, QA, and hand-in

Tasks: - Deploy backend to public HTTPS hosting. - Configure production
environment variables. - Apply database migrations. - Upload/stage the
game build. - Test mobile and desktop. - Test backend failure and score
abuse scenarios. - Complete README and architecture/security
documentation. - Confirm GitHub repository contains game and backend.

Acceptance: - Backend public HTTPS URL is live. - Staged Facebook play
link works. - Monorepo is complete. - README allows another developer to
run and understand the project. - Known limitations and manual setup
steps are documented.

------------------------------------------------------------------------

# 12. Scope Prioritization

## Must-have

-   30-second round.
-   Shrinking circular targets.
-   Touch and mouse input.
-   Correct scoring.
-   Game-over screen.
-   Personal best persistence.
-   Share action with image.
-   Top-10 leaderboard.
-   Backend score validation.
-   Facebook Instant Games staged build.
-   Public HTTPS backend.
-   Single GitHub monorepo.
-   README and testing instructions.

## Should-have

-   Original Dokkaebi mascot and target art.
-   Korean village background.
-   Combo feedback.
-   Difficulty progression.
-   Sound effects and sound toggle.
-   Polished loading and error states.

## Could-have

-   Moon Blessing power-up.
-   Spirit collection/journal.
-   Daily challenge.
-   Additional game modes.
-   Cosmetic unlocks.

Do not implement optional features until all must-have requirements work
end to end.

------------------------------------------------------------------------

# 13. Risks and Decisions to Verify

1.  **Meta platform access:** Verify Instant Games app creation,
    testing, staging, and play-link availability early. This is a
    project-critical dependency.
2.  **Meta SDK changes:** Use current official documentation, not
    unverified old tutorials.
3.  **Identity verification:** Confirm the current server-side
    verification mechanism before designing the production
    authentication flow.
4.  **Score integrity:** Be precise about what the backend can validate.
    Do not claim perfect proof of human input.
5.  **Hosting:** Keep the backend and database available throughout
    review. Confirm free-tier sleep/usage limitations if using a free
    host.
6.  **Assets:** Use original, generated, or properly licensed assets.
    Track asset sources and licenses in `docs/assets.md`.
7.  **Share image:** Verify actual Instant Games sharing support and
    required image dimensions/payload in the current SDK.
8.  **Time:** Protect the core gameplay and required integrations from
    optional feature creep.

------------------------------------------------------------------------

# 14. README Requirements

The final repository README must include:

-   Game overview and screenshots.
-   Gameplay rules and scoring.
-   Tech stack.
-   Repository structure.
-   Prerequisites.
-   Local setup commands.
-   Environment variable reference.
-   How to run game and backend locally.
-   How to run tests.
-   Database migration instructions.
-   Backend deployment URL.
-   Facebook Instant Games setup and staging instructions.
-   Facebook play link and app ID (once configured).
-   Score-validation approach and limitations.
-   Asset credits/licenses.
-   Known issues and trade-offs.
-   AI-assisted development notes describing where the agent helped and
    what was reviewed or changed by the developer.

Never put secrets, access tokens, private keys, or database credentials
in the README or repository.

------------------------------------------------------------------------

# 15. First Task for Antigravity

Start by doing **Phase 0 only**.

Your first response should contain:

1.  A concise summary of the requirements you understood.
2.  An inspection report of the current repository.
3.  A proposed architecture and directory structure.
4.  A list of technical decisions that need verification.
5.  A list of credentials and external dashboard setup that will be
    required.
6.  A prioritized implementation plan with acceptance criteria.
7.  The main risks, especially Meta Instant Games availability and score
    validation.

Do not implement the entire game yet. Do not invent app IDs,
credentials, API URLs, or deployment status. Wait for approval before
making broad structural changes.

After Phase 0 is reviewed, proceed one phase at a time. Keep the project
runnable and tested at every meaningful milestone.
