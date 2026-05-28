# AI Tool Usage Reference – Assignment 02

**Course:** CS2410 Software Studio – Spring 2026 | **Student ID:** 113006230

---

## 1. AI Tool(s) Used

| Tool | Model | Provider |
|------|-------|----------|
| Claude Code | claude-sonnet-4-6 | Anthropic |

Claude Code was used as a debugging and problem-solving assistant. The student wrote the majority of the game code independently and consulted the AI when specific bugs or unfamiliar platform issues arose.

---

## 2. Scope of AI Usage

### Entry 1 – Two-pass AABB Tile Collision
**Location:** `assets/Script/MarioBundle.js`, lines 891–960 (`_moveX()` and `_moveY()`)

**Problem:** Mario got stuck in corners when running against walls due to single-pass X+Y collision resolution.

**Prompt:** *"I have a Mario game where the player uses AABB tile collision. When running against a wall and jumping, Mario sometimes gets stuck at the corner of a tile. I'm currently applying both X and Y position corrections in a single pass. How should I fix this?"*

**AI Response:** Separate into two passes — move X and resolve horizontal collisions first, then move Y and resolve vertical collisions independently.

**Refinement:** I split my existing collision code into `_moveX()` and `_moveY()`. I kept my own tile-boundary math and only restructured to two sequential passes. The question block and brick-breaking triggers in `_moveY()` (lines 939–944) were written by me.

---

### Entry 2 – Rotated Sprite Frame Rendering
**Location:** `assets/Script/MarioBundle.js`, lines 196–199 (`drawFrame()`, rotated branch)

**Problem:** Frames with `textureRotated: true` in the plist were rendering stretched/wrong.

**Prompt:** *"In my Cocos2D plist sprite sheet, some frames have textureRotated = true. My drawImage call uses sw and sh from the plist rect, but the rotated sprites look wrong. What's the correct way to draw a rotated sprite frame using canvas?"*

**AI Response:** Swap `sw`/`sh` in the source params, translate to bottom-left, rotate canvas by `-Math.PI/2`, then draw.

**Refinement:** Added the rotated branch only. The rest of `drawFrame()` including flipX support, scaling, and save/restore was written by me.

---

### Entry 3 – Web Audio API Autoplay Policy
**Location:** `assets/Script/MarioBundle.js`, line 333 (`resumeCtx()`), lines 1652 and 1800 (call sites)

**Problem:** BGM silent on page load — no error, just no sound.

**Prompt:** *"My Web Audio API BGM doesn't play on page load in Chrome. I create an AudioContext and call start() but nothing plays."*

**AI Response:** Chrome's autoplay policy suspends `AudioContext` until a user gesture. Call `audioContext.resume()` inside a user input handler.

**Refinement:** Added `resumeCtx()` which calls `this.ctx.resume()`. Called at first Enter/Space keypress. The full Audio class (BGM loop, SFX channels, volume, file mapping) was written by me.

---

### Entry 4 – Firebase Firestore Security Rules
**Location:** `firestore.rules`

**Problem:** Firestore writes rejected with "Missing or insufficient permissions."

**Prompt:** *"My Firestore writes are being rejected. I have a leaderboard collection (public read, auth write) and a progress collection (user reads/writes own doc). What rules do I need?"*

**AI Response:** Explained Firestore rule syntax — `allow read` for leaderboard, `request.auth != null` for writes, `request.auth.uid == userId` for progress documents.

**Refinement:** Wrote the final rules myself using the explained structure. Added extra condition to prevent overwriting other users' leaderboard entries (check doc ID == UID). Made rules more restrictive than Claude's initial suggestion.

---

### Entry 5 – Cocos Creator 2.4.8 Project Wrapping
**Location:** `assets/Script/MarioBundle.js` lines 2611–2650, `project.json`, `assets/Scene/main.fire`, `assets/Script/MarioBundle.js.meta`

**Problem:** Assignment required CC 2.4.8 project. Unfamiliar with CC's internal file format. After opening in CC, two bugs: canvas offset downward, login modal not clickable.

**Prompt 1:** *"I have a vanilla JS canvas game and need to wrap it in Cocos Creator 2.4.8. What files are required? I want my JS to run as a plugin script before CC initializes."*

**AI Response 1:** Described required file structure. A script in `assets/Script/` with `"isPlugin": true` in its `.meta` runs before CC. Explained minimal `.fire` scene format.

**Prompt 2:** *"In CC preview my canvas is too low — big black gap above it. I'm using position:fixed;top:50%;transform:translate(-50%,-50%) but it won't center."*

**AI Response 2:** CC applies CSS `transform` to `<body>` for preview scaling. `position:fixed` children of a transformed element are positioned relative to that ancestor, not the viewport. Fix: append to `document.documentElement` instead.

**Prompt 3:** *"My login modal appears but I can't click buttons inside it — clicks go to the canvas."*

**AI Response 3:** Canvas has higher z-index than modal. Raise modal z-index above canvas wrapper.

**Refinement:** Changed `document.body.appendChild` → `document.documentElement.appendChild` at lines 2591, 2599, 2608, 2630. Raised `#loginModal` z-index to 9999999 at line 2554. All game logic, auth UI HTML/CSS, and modal interaction code (lines 1593–1660) were written by me.

---

## 3. Summary — What the Student Wrote Without AI

- All game architecture: scene manager, game loop, input system, camera
- Level data for all 3 worlds (tile layouts, enemy placement, difficulty tuning)
- Player physics: gravity, jump, walk/run, pit death, respawn
- Enemy AI: Goomba and Koopa patrol, stomp, shell kick
- Question block bounce, mushroom spawn, coin popup
- Full HUD: score, timer, lives, coin counter
- Background rendering: sky gradient, parallax hills, clouds
- All animation state machines (Mario, Goomba, Turtle)
- Firebase project setup in console, Firestore schema, score saving
- All sprite frame name mapping (identified by inspecting plist files)
- Audio structure (BGM + SFX channels), file mapping
- All scenes: menu, level select, game over, level clear, leaderboard
