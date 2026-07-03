# Desktop Dev Cat Project Plan

## Project Summary

Desktop Dev Cat is a Windows desktop companion app that places a pixel-art cat above the user's desktop. The cat should feel alive, lightweight, and expressive while staying stable enough to become a real downloadable product.

This project should be built as a desktop-first application, not a browser-first product. We will use web technologies inside Electron so development stays fast, but the app itself will behave like a native desktop utility.

## Product Direction

- Primary platform: Windows
- Packaging target: downloadable `.exe`
- Architecture style: desktop shell with modular renderer and future integration hooks
- MVP focus: visual pet behavior, drag/stretch interactions, state system, settings, tray, and packaging
- Explicitly out of scope for MVP: AI, voice, cloud sync, analytics, Git automation, terminal parsing, and VS Code integrations

## Recommended Stack

- Desktop shell: Electron
- UI layer: React
- Language: TypeScript
- Rendering: PixiJS
- State management: Zustand
- Event system: EventEmitter-based event bus
- Local settings: Electron Store
- Logging: Pino
- Tooling: Vite, ESLint, Prettier
- Packaging: electron-builder

## Delivery Phases

## Phase 0: Product Foundation and Design Planning

Goal:
Define the MVP clearly before we start coding.

What we complete:

- Confirm feature boundaries for MVP
- Confirm art direction and animation needs
- Confirm architecture direction
- Define folder structure
- Define state machine boundaries
- Define technical risks and mitigation
- Write project documentation for execution

Deliverables:

- `PLAN.md`
- `PHASE-0.md`

Status:

- In progress now

## Phase 1: App Foundation

Goal:
Create the working Electron application shell and project structure.

What we build:

- Electron + React + TypeScript + Vite scaffold
- Main process, preload, and renderer separation
- Transparent frameless always-on-top window
- Base IPC structure
- Basic development scripts
- Linting and formatting setup
- Initial folder structure from the spec

Success criteria:

- App launches locally
- Transparent window appears correctly
- Window stays on top
- Renderer pipeline is ready for PixiJS integration

Complexity:

- Medium

## Phase 2: Cat Rendering MVP

Goal:
Get the cat visible on screen and make it movable.

What we build:

- PixiJS scene bootstrapping
- Placeholder sprite loading
- Cat component rendering
- Idle animation baseline
- Draggable cat behavior
- Size presets: small, medium, large

Success criteria:

- Cat renders on transparent background
- Dragging works smoothly
- No obvious flicker or broken hit area

Complexity:

- Medium

## Phase 3: Behavior Architecture

Goal:
Make the cat feel alive through controlled behavior.

What we build:

- Centralized state machine
- Zustand store for cat status and app settings
- Global event bus
- Animation manager
- State transitions for idle, happy, angry, sleep, curious, walking, dragging, stretching
- Cursor proximity awareness

Success criteria:

- Behavior changes are deterministic
- Invalid state transitions are blocked
- Animation changes are reusable and not hardcoded into one component

Complexity:

- Medium to high

## Phase 4: Signature Interaction Polish

Goal:
Implement the stretch-and-release feel that makes the app memorable.

What we build:

- Elastic body stretch during drag
- Smooth interpolation while pulling
- Spring-back animation on release
- Bounce settle behavior
- Better head/body/tail response
- Performance tuning for smooth motion

Success criteria:

- Dragging feels soft and responsive
- Return-to-idle motion feels natural
- Animation remains stable at target framerate

Complexity:

- High

## Phase 5: Productization and `.exe` Delivery

Goal:
Turn the MVP into a distributable Windows app.

What we build:

- System tray
- Show/hide/reset controls
- Persistent settings
- Logging to file
- Launch-on-startup option
- Windows packaging configuration
- Installer or portable `.exe` output
- Final smoke testing on Windows

Success criteria:

- Another user can install and run the app
- Settings persist correctly
- Tray controls work
- Logs are created correctly
- Packaged build is stable

Complexity:

- Medium

## Phase 6: Future Smart Integrations

Goal:
Extend the app beyond the MVP without destabilizing the base architecture.

Possible additions:

- Git reactions
- Terminal event reactions
- VS Code awareness
- Multiple pets
- Themes and skins
- Sound
- AI assistance

Complexity:

- High to very high

## Recommended Build Order

1. Finish Phase 0 documentation and decisions
2. Scaffold the desktop app in Phase 1
3. Render a placeholder cat in Phase 2
4. Add controlled behavior in Phase 3
5. Polish stretch interactions in Phase 4
6. Package and test in Phase 5

## Why We Are Not Starting as a Web App

A normal browser app cannot fully deliver the core product experience. The main value of this project is:

- always-on-top behavior
- transparent background
- frameless floating pet
- tray integration
- startup behavior
- desktop presence

We may still use browser-like workflows during development because Electron uses web technologies, but the real product should be desktop-first from the beginning.

## Estimated Effort

If we use placeholder art first and polish later:

- Phase 0: 1 to 2 days
- Phase 1: 2 to 4 days
- Phase 2: 3 to 5 days
- Phase 3: 4 to 7 days
- Phase 4: 5 to 10 days
- Phase 5: 3 to 5 days

Estimated MVP total:

- Rough prototype: 1 to 2 weeks
- Solid MVP: 3 to 5 weeks
- Polished release candidate: 5 to 7 weeks

## Main Risks

### 1. Transparent window quirks on Windows

Risk:
Transparent frameless Electron windows can behave inconsistently depending on GPU, DPI scaling, and monitor layout.

Mitigation:

- Test early on the target machine
- Keep the window architecture simple
- Avoid unnecessary window re-creation

### 2. Stretch animation becoming messy

Risk:
The signature drag/stretch effect can look unnatural if we overcomplicate it too early.

Mitigation:

- Start with simple squash-and-stretch math
- Use placeholder segmented sprites before advanced rigs
- Focus on feel before perfection

### 3. Performance regressions

Risk:
Idle animation and frequent cursor tracking can increase CPU usage.

Mitigation:

- Throttle non-critical updates
- Keep texture count low
- Avoid unnecessary React re-renders
- Let PixiJS own frame-based animation work

### 4. Feature creep

Risk:
It will be tempting to jump into Git, terminal, or AI integrations too early.

Mitigation:

- Keep MVP boundaries strict
- Only build extension hooks, not full integrations yet

## Definition of MVP Completion

The MVP is done when:

- Transparent window works reliably
- Cat appears and animates on screen
- Dragging works
- Stretch/release behavior feels good
- Core states work
- Cursor awareness works
- State machine exists
- Event bus exists
- Settings persist
- Tray works
- Logs work
- Windows build can be packaged into a usable `.exe`

## Immediate Next Step

Complete Phase 0 fully, then move to Phase 1 implementation by scaffolding the Electron project and creating the initial folder structure.
