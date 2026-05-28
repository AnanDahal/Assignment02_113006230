# AI Tool Usage Reference

**Course:** CS2410 Software Studio – Spring 2026  
**Assignment:** Assignment 02 – Web Mario  
**Student ID:** 113006230

---

## Tools Used

| Tool | Provider | Purpose |
|------|----------|---------|
| Claude Code (claude-sonnet-4-6) | Anthropic | Debugging assistant and problem-solving reference |

---

## Overall Approach

The majority of this project — including architecture, all game logic, physics, rendering, level design, and Firebase integration — was written by the student. AI was used in a supporting role: as a debugging assistant when encountering hard-to-trace bugs, and as a reference when dealing with unfamiliar APIs or platform-specific quirks. In all cases the student identified the problem, provided context, evaluated the AI's suggestions, and integrated or modified the solution.

---

## Specific Areas Where AI Assistance Was Used

### 1. AABB Collision Corner Cases

The student implemented the two-pass AABB tile collision system independently. However, Mario was occasionally getting stuck on tile corners when moving diagonally along a wall. The student described the symptom to Claude and asked for help diagnosing it. Claude suggested separating the horizontal and vertical resolution passes and explained why the ordering matters. The student applied this fix to their existing collision code.

### 2. Sprite Sheet Parsing Bug

The student wrote the Cocos2D `.plist` XML parser. During testing, some sprite frames were drawing incorrectly (wrong position or size). The student asked Claude to review the `_parseRect` regex and the rotated-frame drawing logic. Claude identified that rotated frames needed the width and height dimensions swapped when calling `drawImage`. The student confirmed this matched the plist spec and applied the correction.

### 3. Web Audio API Autoplay Policy

Background music was silently failing to play on first load. The student was unfamiliar with the browser autoplay policy. Claude explained that `AudioContext` must be resumed after a user gesture. The student added a `resumeCtx()` call triggered on the first key press, which resolved the issue.

### 4. Firebase Firestore Rules

After setting up Firebase Auth and Firestore, write operations were being rejected. The student asked Claude to review the error message and explain what Firestore security rules were needed to allow authenticated users to write their own score while keeping leaderboard reads public. Claude explained the rule syntax; the student wrote and applied the final rules.

### 5. Cocos Creator 2.4.8 Project Setup

This was the most significant area of AI involvement. The student had a fully working vanilla HTML5 Canvas game but needed to wrap it in a valid CC 2.4.8 project for submission. The student was unfamiliar with CC's internal project file format (`project.json`, `.fire` scene files, `.meta` files, plugin scripts). Claude was used to understand the required CC project file structure and diagnose platform-specific issues:

- CC preview server returning 404 for asset files (CC intercepts `assets/` paths via its asset pipeline)
- Canvas positioning broken by CC's CSS `transform` on `<body>` for preview scaling — fixed by appending to `document.documentElement`
- Login modal z-index conflict with the game canvas
- Writing the `build-and-deploy.ps1` deployment script

The student's game logic was not changed during this process — only the CC wrapper and deployment configuration were affected.

### 6. General Debugging Reference

Throughout development, the student occasionally used Claude as a reference to look up specific canvas API behavior, JavaScript timing edge cases, or to get a second opinion on a logic bug before spending more time on it. In each case the student described the problem, assessed Claude's explanation, and decided whether to apply the suggestion.

---

## What Was Done Entirely by the Student

- Overall game architecture and scene management design
- Player physics, jump feel, and movement tuning
- All three level layouts (tile placement, enemy positioning, gap difficulty)
- Enemy AI behavior (patrol, reverse, stomp detection, Koopa shell mechanic)
- Question block logic (bounce animation, mushroom spawn, coin popup)
- HUD layout (score, timer, lives, coin counter)
- Parallax background rendering (hills, clouds, sky gradient)
- All animation state decisions (frame names, timing, transition conditions)
- Firebase project setup in the Firebase console
- Firestore data schema design (`leaderboard` and `progress` collections)
- Asset selection from the provided AS2_source pack
- Testing and bug identification throughout development
- Final submission packaging
