# Web Mario – Assignment 02

**Student ID:** 113006230  
**Course:** CS2410 Software Studio – Spring 2026

## How to Play

| Key | Action |
|-----|--------|
| ← / → | Move left / right |
| ↑ / Space | Jump |
| Shift | Run faster |
| P / Esc | Pause |
| Enter | Confirm / Start |

## Features Implemented

### Complete Game Process (5%)
- **Start Menu** – animated title screen with background, Mario character, and navigation
- **Level Select** – 3 worlds with mini-preview cards
- **Game View** – full gameplay with start intro banner
- **Game Over** – score display and return to menu
- **Level Clear** – celebration screen, score tally, next world transition

### Basic Rules (50%)
- **World Map / Physics** – proper gravity, velocity, AABB tile collision
- **Camera** – follows player horizontally; background scrolls with parallax clouds
- **3 World Maps** with different layouts, enemies, and music
- **Level Design** – static walls, brick tiles, question blocks, pipes, staircases, castle blocks
- **Player Physics** – gravity, max-fall-speed, walk/run speed distinction
- **Keyboard Control** – move (arrow keys / WASD), jump (↑/Space), run (Shift)
- **Enemy Damage** – touching enemy sides hurts player; big Mario shrinks, small Mario dies
- **Out of Bounds** – falling into pit triggers death and life loss
- **Respawn** – player reborn at level start with life count reduced; game over at 0 lives

### Enemies (15%)
- **Goomba** – walks, turns at walls and platform edges, correct physics
- **Turtle (Koopa)** – walks, can become shell when stomped, shell can be kicked
- Only **landing on top** kills enemies (stomp); side contact hurts player

### Question Blocks (5%)
- Hit from below triggers bounce animation and item spawn
- Blocks with **Super Mushroom** spawn mushroom that slides out
- Blocks with **coin** give coin + score
- Block turns to used (brown) after being hit

### Animations (10%)
- **Player walk cycle** – 3-frame walk animation, speed-linked
- **Player jump** – distinct jump frame
- **Player skid** – when moving opposite direction
- **Big Mario** – separate larger sprite set with all above states
- **Goomba walk** – 2-frame animation
- **Turtle walk** – 2-frame animation with shell state

### Sound Effects (10%)
- **BGM** – 3 unique background tracks (one per world), looped, never stops on SFX
- **Jump** – plays on every jump
- **Die / Lose Life** – plays on player death
- **Stomp** – enemy killed
- **Power-up appear** – mushroom spawning
- **Power-up collect** – mushroom collected / grow
- **Power down** – Mario shrinks
- **Coin** – collecting coin or hitting coin block
- **Kick** – kicking shell / breaking brick
- **Level Clear** – course complete jingle
- **Game Over** – game over music

### UI (10%)
- **Score** – top-left, 6-digit, zero-padded
- **Coin count** – center-top with coin icon
- **World** – center-top label
- **Timer** – top-right countdown (turns red at 100)
- **Lives** – bottom-left with life icon and × count

### Appearance (10%)
- Classic NES Mario color palette (sky blue, orange ground, golden ? blocks, green pipes)
- Parallax cloud scrolling
- Animated intro banner per level
- Pause overlay
- Loading screen
- Leaderboard screen in menu
- Login modal with Firebase auth

## Bonus

### Firebase (5%)
- **Deployment** – hosted on Firebase Hosting at `webmario-113006230.web.app`
- **Firebase Auth** – email/password sign-up and login via modal
- **Guest play** – can play without account
- **Score saving** – top scores saved to Firestore `leaderboard` collection on level clear or game over
- **Game progress** – saved per user (lives, score, current world) in Firestore `progress` collection
- **Leaderboard** – viewable from main menu (top 10 scores)

### Multi-Level (bonus content)
- 3 complete worlds with increasing difficulty
- Unique BGM per world
- Enemy count and gap placement increases per level

## Technical Notes

Built with **vanilla HTML5 Canvas** + **JavaScript (ES6 classes)**.  
Assets from the provided AS2_source package (Cocos2D TexturePacker plist sprite sheets).  
Plist files parsed at runtime using DOMParser.  
Audio via Web Audio API.

## File Structure

```
index.html            Main entry point
firebase.json         Firebase hosting config
README.md             This file
js/
  Constants.js        Game-wide constants and colors
  Sprites.js          Plist parser + sprite sheet drawing
  Audio.js            Web Audio BGM + SFX manager
  Input.js            Keyboard input tracker
  Camera.js           Viewport / camera logic
  Level.js            Level data + TileMap renderer
  HUD.js              On-screen UI (score, lives, timer)
  Firebase.js         Firebase Auth + Firestore manager
  Game.js             Game loop + scene manager
  main.js             Bootstrap / asset loading
  entities/
    Player.js         Mario player (small + big states)
    Goomba.js         Goomba + Turtle enemies
    Mushroom.js       Super mushroom + coin + score popup
    QuestionBlock.js  Question block hit logic
  scenes/
    MenuScene.js      Main menu
    LevelSelectScene.js  World selector
    GameScene.js      Core gameplay
    GameOverScene.js  Game over screen
    LevelClearScene.js  Level complete screen
assets/
  audio/              MP3/WAV sound files
  images/
    player/           mario_small.png/.plist, mario_big.png/.plist
    enemies/          Goomba.png/.plist, Turtle.png/.plist
    tiles/            items.png/.plist, effects.png/.plist, tileset.png
    ui/               menu_bg.png, title_1.png, life.png, flag.png, etc.
```

## AI Usage

See `AI_reference.pdf` in the root directory for full AI tool usage documentation.
