# Desktop Dev Cat

Desktop Dev Cat is a desktop-first pet app for Windows built with Electron, React, TypeScript, and PixiJS.

The goal of the MVP is to create a small cat that lives above the desktop, feels expressive, and has strong interaction basics before we add advanced developer-aware features.

## Current Status

The project is in Phase 1 and has moved past the initial scaffold.

What already works:

- Electron app scaffold
- React and TypeScript setup
- PixiJS renderer bootstrapped
- transparent frameless always-on-top desktop window
- cat renderer moved into dedicated `src/cat` architecture
- downloaded frame-based cat asset pack integrated into the asset pipeline
- restored stable drag interaction path
- improved long-drag tracking from the Electron main process
- built-in stretch and coffee reminder popups
- custom reminder scheduling stored locally
- triple-tap happy reaction with jump mood and smile marker
- edge-hit smoke burst effect from the CraftPix smoke pack
- reminder popup smoke poof when a nudge appears
- softer idle breathing and release-settle motion polish
- hidden reminder launcher unlocked by tapping the cat 8 times quickly
- build and lint validation passing

What comes next:

- refine the imported cat asset style or swap to a closer Comnyang-like pack later
- improve motion quality without hurting drag stability
- continue polishing the hidden reminder mini-panel
- tray and settings
- packaging to Windows `.exe`

## Stack

- Electron
- React
- TypeScript
- PixiJS
- Zustand
- Electron Store
- Pino
- Vite

## Project Structure

```text
src/
  cat/
  main/
  window/
  ipc/
  renderer/
    components/
    hooks/
    stores/
    events/
    utils/
    animations/
    sprites/
  shared/
  assets/
public/
docs/
```

The new cat architecture is now split into:

- `src/cat/CatRenderer.tsx`
- `src/cat/CatStateMachine.ts`
- `src/cat/CatAnimationController.ts`
- `src/cat/CatAssetLoader.ts`
- `src/cat/CatEvents.ts`
- `src/cat/CatTypes.ts`

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app in development:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Lint the project:

```bash
npm run lint
```

## Important Note

Do not open the root `index.html` directly in the browser with `file:///`.

This app is meant to run through:

- the Vite dev server during development
- Electron when packaged or launched normally

Opening the raw HTML file directly will break module resolution for the renderer entry.

## Documentation

Planning and project notes:

- [PLAN.md](./PLAN.md)
- [PHASE-0.md](./PHASE-0.md)
- [PHASE-0-CHECKLIST.md](./PHASE-0-CHECKLIST.md)
- [ARCHITECTURE-DECISIONS.md](./ARCHITECTURE-DECISIONS.md)
- [ASSET-AND-ANIMATION-PREP.md](./ASSET-AND-ANIMATION-PREP.md)
- [docs/IMPLEMENTATION-LOG.md](./docs/IMPLEMENTATION-LOG.md)
- [docs/PHASE-1-IMPLEMENTATION-AND-EXECUTION-PLAN.md](./docs/PHASE-1-IMPLEMENTATION-AND-EXECUTION-PLAN.md)
- [docs/FUTURE-SUGGESTIONS.md](./docs/FUTURE-SUGGESTIONS.md)
- [docs/SPRITE-DIRECTION.md](./docs/SPRITE-DIRECTION.md)
- [docs/CAT-ASSET-PLAN.md](./docs/CAT-ASSET-PLAN.md)
- [docs/CRAFTPIX-ASSET-REVIEW.md](./docs/CRAFTPIX-ASSET-REVIEW.md)
- [src/assets/sprites/cat/meta/cat-sprite-manifest.json](./src/assets/sprites/cat/meta/cat-sprite-manifest.json)

## Product Direction

This is a desktop-first product, not a normal web app.

The MVP is intentionally focused on:

- cat rendering
- drag interaction
- stretch behavior
- animation feel
- settings and tray support
- Windows packaging

These are intentionally postponed until later phases:

- Git reactions
- terminal reactions
- VS Code awareness
- AI features
- sound
- cloud sync

## Reminder Controls

The reminder controls are intentionally hidden so the UI does not sit on top of the cat all the time.

Current access flow:

- click or tap the cat 8 times quickly
- a small corner launcher appears
- open the reminder panel only when you need it

Quick pet interaction:

- tap the cat 3 times quickly to trigger a happy reaction

Inside the panel you can:

- add your own reminder time and message
- enable or disable saved reminders
- delete reminders
- test popup, sparkle, and steam reactions manually

## Visual Direction

The project is now moving toward a sprite-based visual style instead of a fully code-drawn cat.

The current sprite direction is based on a local reference sheet:

- `1e9d280c-518d-400e-ae67-b8e2c36eb352.png`

That reference shows the style we want:

- black pixel-art cat
- bright white outline
- very simple silhouette
- separate reusable parts
- readable expressions for idle, sleep, happy, angry, stretch, and bounce

## Planned First Sprite Parts

The first sprite pieces we should prepare are:

- head
- body
- tail
- left paw
- right paw
- open-eyes face
- closed-eyes face
- happy face later

These will let us keep the current interaction logic while replacing the temporary vector-drawn cat with real art.
