# AI Tool Usage Reference

**Course:** CS2410 Software Studio – Spring 2026  
**Assignment:** Assignment 02 – Web Mario  
**Student ID:** 113006230

---

## Tools Used

| Tool | Provider | Purpose |
|------|----------|---------|
| Claude Code (claude-sonnet-4-6) | Anthropic | Primary AI coding assistant |

---

## Summary of AI Assistance

AI assistance was used throughout the development of this project for code generation, debugging, and problem-solving. All game design decisions, feature choices, and final review were made by the student.

---

## Detailed Usage Log

### 1. Game Architecture & Core Systems

**Task:** Design the overall class structure for a vanilla HTML5 Canvas Mario game.

**AI contribution:**
- Suggested splitting code into modules: `Game`, `Input`, `Camera`, `Level`, `HUD`, `Audio`, `Sprites`
- Designed the scene manager pattern (`changeScene` / `enter` / `exit` / `update` / `draw`)
- Wrote the main game loop with `requestAnimationFrame` and delta-time capping

**Student contribution:** Decided on the feature set, scene names, and overall game flow.

---

### 2. Physics & Collision Detection

**Task:** Implement Mario-accurate platformer physics with AABB tile collision.

**AI contribution:**
- Wrote gravity accumulation, velocity capping, and walk/run speed constants
- Implemented two-pass AABB collision (horizontal first, then vertical) to avoid corner-clipping
- Wrote pit death detection (player Y exceeds level bottom)
- Tuned physics constants (gravity 0.35, jump −9.5, max fall 11)

**Student contribution:** Tested and adjusted feel; identified edge cases (wall sticking, staircase clipping).

---

### 3. Sprite System

**Task:** Load and draw Cocos2D TexturePacker `.plist` sprite sheets.

**AI contribution:**
- Wrote the XML plist parser (`DOMParser` + recursive dict/array parsing)
- Implemented `drawFrame()` with 2× scaling, flipX support, and rotated-frame handling
- Added `img.complete && naturalWidth > 0` guards to prevent `drawImage` exceptions on broken images

**Student contribution:** Identified which sprite frame names mapped to which animations by inspecting the plist files.

---

### 4. Player Animations

**Task:** Map sprite frame names to Mario's idle, walk, jump, skid, and duck states.

**AI contribution:**
- Wrote the animation state machine in `Player.js` (idle → walk → jump → skid)
- Implemented 3-frame walk cycle with timer-based frame stepping
- Added `flipX` logic so Mario faces the direction of movement
- Handled big/small Mario state transitions on power-up and damage

**Student contribution:** Verified frame names against the plist file; decided animation timings.

---

### 5. Enemy AI

**Task:** Implement Goomba and Koopa Turtle behavior.

**AI contribution:**
- Wrote patrol-and-reverse logic (wall detection and platform-edge detection)
- Implemented stomp detection (player lands on top → enemy dies, player bounces)
- Implemented Koopa shell state (stomped → shell, kicked shell → hits other enemies)
- Wrote 2-frame walk animation with sprite flip on direction change

**Student contribution:** Chose enemy placement in each level; tuned enemy speed.

---

### 6. Question Blocks & Items

**Task:** Implement question blocks that spawn mushrooms or coins when hit from below.

**AI contribution:**
- Wrote bounce animation (block moves up 4px then returns)
- Implemented mushroom spawn: creates `Mushroom` entity above the block, slides right
- Wrote coin popup with score floating text
- Implemented used-block state (changes sprite, disables further hits)

**Student contribution:** Decided which blocks give mushrooms vs coins in each level.

---

### 7. Level Design

**Task:** Build 3 complete world maps.

**AI contribution:**
- Designed the tile-map encoding system (2D array with tile type constants)
- Wrote the `Level.js` builder with ground, bricks, question blocks, pipes, and castle tiles
- Generated the layout data for all 3 levels with increasing difficulty
- Wrote canvas fallback rendering for each tile type (colored rectangles with shading)

**Student contribution:** Reviewed layouts and requested adjustments to difficulty, gap sizes, and enemy placement.

---

### 8. HUD

**Task:** Draw score, coin count, world label, timer, and lives on screen.

**AI contribution:**
- Wrote all HUD draw calls in `HUD.js`
- Implemented 6-digit zero-padded score display
- Added timer countdown with red color at ≤ 100 seconds
- Drew animated coin icon using canvas shapes

**Student contribution:** Decided HUD layout positions and font style.

---

### 9. Audio System

**Task:** Implement BGM + SFX using Web Audio API.

**AI contribution:**
- Wrote `Audio.js` with separate BGM (looping) and SFX (one-shot) channels
- Implemented BGM track switching between worlds
- Added `AudioContext.resume()` call on first user interaction to comply with browser autoplay policy
- Mapped all sound effect names to their file paths

**Student contribution:** Chose which audio files to use from the provided asset pack.

---

### 10. Firebase Integration

**Task:** Add user authentication, leaderboard, and progress saving.

**AI contribution:**
- Wrote `Firebase.js` with Firebase Auth (email/password sign-up and login)
- Wrote Firestore read/write for `leaderboard` and `progress` collections
- Implemented the login modal HTML/CSS injected at runtime
- Added guest-play fallback (full game works without an account)
- Wrote leaderboard fetch and display in `MenuScene`

**Student contribution:** Set up the Firebase project in the Firebase console; configured Firestore security rules; decided the data schema.

---

### 11. Cocos Creator 2.4.8 Integration

**Task:** Wrap the vanilla HTML5 game in a valid CC 2.4.8 project for submission.

**AI contribution:**
- Created all CC project files: `project.json`, `settings/`, `assets/Script/MarioBundle.js.meta` (plugin), `assets/Scene/main.fire`
- Bundled all source JS into a single CC plugin script (`MarioBundle.js`) with a bootstrap IIFE
- Diagnosed CC preview server limitations (does not serve arbitrary directories as static files)
- Fixed canvas positioning by appending to `document.documentElement` instead of `document.body` (CC transforms body for its preview scaling)
- Fixed login modal z-index so it layers above the game canvas
- Created `res/` folder outside the CC asset pipeline for static asset serving
- Wrote `build-and-deploy.ps1` to copy assets and deploy to Firebase after CC build

**Student contribution:** Ran CC editor builds; tested in CC preview and Firebase; confirmed the deployed game worked.

---

### 12. Visual Polish

**Task:** Add parallax backgrounds, clouds, and hills.

**AI contribution:**
- Wrote parallax scrolling for hills (two layers at different speeds) and clouds
- Implemented sky gradient using `createLinearGradient`
- Added shadow effects to UI text for readability
- Wrote the animated intro banner (world name fade-in on level start)

**Student contribution:** Chose the color palette and overall visual style.

---

## What Was NOT AI-Generated

- Firebase project setup (console configuration, hosting setup, Firestore rules decisions)
- Selection of assets from the provided AS2_source pack
- Final tuning of level difficulty and enemy placement
- Submission packaging (ZIP, MD5, eeclass upload)
- Testing and bug identification (screenshots and descriptions provided to AI for diagnosis)
