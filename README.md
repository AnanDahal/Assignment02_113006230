# Web Mario – Assignment 02

**Student ID:** 113006230  
**Course:** CS2410 Software Studio – Spring 2026  
**Live URL:** https://webmario-113006230.web.app  
**GitHub:** https://github.com/AnanDahal/Assignment02_113006230

---

## How to Play

| Key | Action |
|-----|--------|
| ← / → | Move left / right |
| ↑ / Space | Jump |
| Shift | Run faster |
| P / Esc | Pause |
| C *(while paused)* | Toggle Cheat Mode |
| Enter | Confirm / Start |

---

## Features Implemented

### Complete Game Process (5%)
- **Start Menu** – animated title screen with background, animated Mario, and navigation
- **Level Select** – 3 worlds with mini-preview map cards and difficulty labels
- **Game View** – full gameplay with intro banner, HUD, and camera
- **Game Over** – score display with animated fade-in, return to menu
- **Level Clear** – celebration screen, score tally, next-world transition or win screen

### Basic Rules (50%)
- **World Map / Physics** – gravity, velocity cap, AABB tile collision (horizontal and vertical passes separated)
- **Camera** – follows player horizontally; clamps to level bounds
- **3 World Maps** with unique layouts, enemy placements, and pit patterns
- **Level Design** – ground, brick, question blocks, multi-height pipes, staircase, castle blocks, solid platforms
- **Player Physics** – gravity (0.35), max fall speed, walk/run speed distinction (2.2 / 3.8 px/frame)
- **Keyboard Control** – move (arrow keys), jump (↑/Space), run (Shift)
- **Enemy Damage** – touching enemy sides hurts player; Big Mario shrinks, Small Mario dies
- **Pit Death** – falling below level bounds triggers death
- **Respawn** – returns to level start with reduced lives; game over at 0 lives

### Enemies (15%)
- **Goomba** – walks, reverses at walls and platform edges, 2-frame walk animation
- **Turtle (Koopa)** – walks and flips sprite direction correctly; stomping creates a shell; shell can be kicked to defeat more enemies
- Stomp (landing on top) kills enemies and bounces player; side contact hurts player

### Question Blocks (5%)
- Hit from below: bounce animation, spawn item or coin
- **Super Mushroom blocks** – mushroom spawns above block and slides out (uses correct red mushroom sprite from items atlas)
- **Coin blocks** – coin animation + score popup
- Block turns to used (brown) state after being hit, cannot be hit again

### Animations (10%)
- **Small Mario** – idle, 3-frame walk, jump, skid frames; sprites face right, flip when moving left
- **Big Mario** – matching idle, walk, jump, duck, skid frames with correct flip direction
- **Goomba** – 2-frame walking cycle
- **Turtle** – 2-frame walk cycle; sprite correctly mirrors when changing direction; shell state frame

### Sound Effects (10%)
- **BGM** – 3 unique background tracks (one per world), looped, independent of SFX channel
- **Jump** – on every jump
- **Die / Lose Life** – on player death
- **Stomp** – enemy killed by stomp
- **Power-up appear** – mushroom spawning sound
- **Power-up collect** – mushroom picked up / grow
- **Power down** – Mario shrinks after hit
- **Coin** – collecting coin or hitting coin block
- **Kick** – kicking turtle shell / breaking brick
- **Level Clear** – course complete jingle
- **Game Over** – game over music

### UI (10%)
- **Score** – top-left, 6-digit zero-padded, "MARIO" label
- **Coin count** – center-top with animated coin icon and × counter
- **World** – center-top label (e.g. 1-1)
- **Timer** – top-right countdown; turns red at ≤ 100
- **Lives** – bottom-left with life icon and × count

### Appearance (10%)
- Classic Mario color palette (sky blue, orange/brown ground, golden ? blocks, green pipes)
- **Sky gradient** – deep blue at top fading to light blue at horizon
- **Parallax background hills** – two layers of rolling green hills scrolling at different speeds
- **Horizon bushes** – decorative dark-green bushes at ground level with parallax
- **Fluffy 3-circle clouds** – classic Mario-style clouds with soft shadow, parallax scrolling
- Animated intro banner per level (world name + lives remaining)
- Pause overlay with cheat mode toggle
- Loading screen with build number

---

## Bonus

### Firebase (5%)
- **Deployment** – hosted on Firebase Hosting at `webmario-113006230.web.app`
- **Firebase Auth** – email/password sign-up and login via modal
- **Guest play** – full game playable without an account
- **Score saving** – top scores saved to Firestore `leaderboard` collection on level clear or game over; guests saved with label "Guest"
- **Progress saving** – lives, score, current world saved per authenticated user in Firestore `progress` collection
- **Leaderboard** – viewable from main menu (top 10 scores), refreshes each time the panel is opened

### Multi-Level (bonus)
- 3 complete worlds with increasing difficulty
- Unique BGM per world
- Increasing enemy count and gap difficulty per level
- Each level has mushroom-giving Q-blocks, coin Q-blocks, multiple enemy types

### Cheat Mode (bonus)
- Press **P/Esc** to pause, then **C** to toggle
- **Effect:** enemies cannot hurt the player; falling into pits still causes death
- **Restriction:** score is **not** submitted to the leaderboard when cheat mode is active
- Green screen tint + "CHEAT MODE" label visible during gameplay when enabled

---

## Controls Reference

| Context | Key | Action |
|---------|-----|--------|
| Gameplay | ← → | Walk |
| Gameplay | ↑ / Space | Jump |
| Gameplay | Shift | Run |
| Gameplay | P / Esc | Pause |
| Pause menu | C | Toggle Cheat Mode |
| Pause menu | P / Esc | Resume |
| Menu | ↑ ↓ | Navigate |
| Menu | Enter / Space | Select |
| Leaderboard | Esc / B | Back |

---

## Technical Notes

Built with **vanilla HTML5 Canvas** and **ES6 JavaScript classes** — no game framework.  
Assets from the provided AS2_source package (Cocos2D TexturePacker `.plist` sprite sheets).  
Plist files are parsed at runtime using `DOMParser`.  
Audio via **Web Audio API** with separate BGM and SFX channels.  
Firebase SDK (compat v9.22) for auth and Firestore.

### Physics constants

| Constant | Value |
|----------|-------|
| Gravity | 0.35 px/frame² |
| Max fall speed | 11 px/frame |
| Walk speed | 2.2 px/frame |
| Run speed | 3.8 px/frame |
| Jump velocity | −9.5 px/frame |
| Enemy speed | 1.5 px/frame |

---

## File Structure

```
index.html              Main entry point
firebase.json           Firebase hosting + cache config
firestore.rules         Firestore security rules
README.md               This file
js/
  Constants.js          Game-wide constants, tile types, colors, physics
  Sprites.js            Plist parser + sprite sheet drawing (flipX support)
  Audio.js              Web Audio BGM + SFX manager
  Input.js              Keyboard input tracker (wasPressed support)
  Camera.js             Viewport / camera logic
  Level.js              Level data builder + TileMap class + tile renderer
  HUD.js                On-screen UI (score, lives, timer, coins)
  Firebase.js           Firebase Auth + Firestore manager
  Game.js               Main game loop + scene manager
  main.js               Bootstrap / asset loading with timeout
  entities/
    Player.js           Mario (small + big states, all animations)
    Goomba.js           Goomba + Turtle (Koopa) enemies
    Mushroom.js         Super mushroom, coin popup, score popup
    QuestionBlock.js    Question block bounce + hit logic
  scenes/
    MenuScene.js        Main menu + leaderboard panel
    LevelSelectScene.js World selector with mini-map previews
    GameScene.js        Core gameplay (physics, collisions, cheat mode)
    GameOverScene.js    Game over screen
    LevelClearScene.js  Level complete screen
assets/
  audio/                MP3/WAV sound files
  images/
    player/             mario_small.png/.plist, mario_big.png/.plist
    enemies/            Goomba.png/.plist, Turtle.png/.plist
    tiles/              items.png/.plist, effects.png/.plist, tileset.png
    ui/                 menu_bg.png, title_1.png, life.png, flag.png, etc.
```

---

## AI Usage

See `AI_reference.pdf` in the root directory for full AI tool usage documentation.
