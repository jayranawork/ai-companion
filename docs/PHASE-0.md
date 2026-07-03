# Phase 0: Product Foundation

## Purpose of Phase 0

Phase 0 is where we make the project understandable before we make it complex.

This phase is not about writing app code yet. It is about making sure:

- the MVP scope is clear
- the architecture is realistic
- the visual direction is known
- the risks are understood
- future phases have a clean path

If we skip this phase, the project can still start quickly, but it is much more likely to grow messy later.

## What Phase 0 Must Achieve

By the end of Phase 0, we should be able to answer these questions with confidence:

1. What exactly are we building in the MVP?
2. What are we intentionally not building yet?
3. Why is Electron the right choice?
4. How should the app be structured?
5. What will be the hardest technical areas?
6. How do we keep this extensible for future Git, terminal, and AI features?

## Product Definition

Desktop Dev Cat is a desktop utility, not a normal business app.

Its purpose is to create a small emotional and interactive layer on top of the desktop, especially for developers. The product should feel:

- cute
- expressive
- lightweight
- responsive
- always present but not annoying

The MVP should prove one thing:

Can we create a desktop pet that already feels good to use before adding any smart integrations?

That is the real objective of the first version.

## Why the MVP Scope Is Good

The original idea is strong because it already excludes many dangerous sources of complexity.

Not included in MVP:

- AI assistant behavior
- speech or sound systems
- cloud sync
- analytics pipelines
- Git command monitoring
- terminal output parsing
- VS Code activity detection

This is the correct decision.

These are all useful later, but they would slow down the first release and make debugging much harder. A desktop pet becomes interesting only if the basic visual interaction already feels delightful.

## Final MVP Scope

The MVP should include:

- Electron desktop shell
- transparent always-on-top frameless window
- pixel-art cat rendered on screen
- idle state
- sleep state
- happy state
- angry state
- curious state
- walking state
- dragging
- stretch while dragging
- smooth release and bounce
- cursor awareness
- centralized state machine
- event bus
- local settings
- system tray
- file logging

The MVP should not include:

- auto-detection of developer tools
- notifications
- AI reactions
- online accounts
- asset marketplace
- themes beyond basic size settings

## Why We Should Build Desktop-First

This project is fundamentally tied to desktop behavior.

A browser-only version cannot truly support:

- always-on-top window behavior
- tray controls
- startup launch behavior
- transparent floating desktop presence
- per-window OS-level behavior

So even though React and PixiJS are web technologies, the real product should start inside Electron.

Useful mental model:

- Electron gives us the operating-system shell
- React gives us component structure
- PixiJS gives us animation/rendering power
- TypeScript keeps the project maintainable

## Architecture Thinking

We should keep the architecture modular from the beginning because this project will probably expand later.

The app has three main layers:

### 1. Main process

This handles desktop-native responsibilities:

- window creation
- tray
- app lifecycle
- settings persistence bridge
- log setup
- future OS integrations

### 2. Preload / IPC layer

This is the safe bridge between Electron internals and the renderer.

It should expose only controlled APIs such as:

- get settings
- save settings
- reset cat position
- show/hide app
- emit app events

### 3. Renderer layer

This handles the visible cat and user interactions:

- PixiJS canvas
- animation logic
- cursor reaction logic
- drag/stretch behavior
- local view state
- state machine integration

## Suggested Folder Meaning

The spec already gives a good structure. Here is what each area should mean in practice.

### `src/main`

Electron main-process files:

- app bootstrap
- tray setup
- window manager
- logging startup

### `src/window`

Window-specific logic:

- create main cat window
- restore position
- enforce window options

### `src/ipc`

IPC channel definitions and handlers.

### `src/renderer`

React and PixiJS renderer entrypoint.

### `src/components/cat`

Cat rendering units:

- sprite container
- body parts
- interaction layer

### `src/components/ui`

UI panels if we later add settings overlays or debug controls.

### `src/animations`

Animation manager, timelines, and per-state animation definitions.

### `src/sprites`

Sprite metadata, atlas references, and scaling helpers.

### `src/hooks`

Reusable renderer-side hooks such as cursor tracking and idle timers.

### `src/stores`

Zustand stores for app settings and cat state.

### `src/events`

Global event bus and event constants.

### `src/utils`

Shared helper functions for math, interpolation, throttling, and geometry.

### `src/shared`

Types and constants used across multiple layers.

### `src/assets`

Cat art, icons, sprite sheets, and related media.

## State Design Strategy

The state machine is one of the most important decisions.

We should keep it strict enough to avoid chaos, but not so rigid that simple animation work becomes painful.

Recommended states:

- `idle`
- `sleep`
- `happy`
- `angry`
- `curious`
- `walking`
- `dragging`
- `stretching`

Important rule:

The user should never be able to push the cat into conflicting behavior states at the same time.

For example:

- the cat cannot be sleeping and dragging
- the cat cannot be angry and idle at the same moment

This is why a centralized transition layer matters.

## Animation Strategy

We should not start with highly advanced animation tech.

For MVP, a practical approach is:

- use sprite sheets or segmented body parts
- animate with position, scale, rotation, and interpolation
- fake elasticity through math rather than full skeletal rigs

This is enough to achieve:

- blinking
- tail motion
- head tilt
- jump/stomp loops
- stretch and bounce

That gives us a good-looking MVP without turning animation into a research project.

## Stretch Feature Strategy

This feature deserves special attention because it is the emotional center of the product.

What the user should feel:

- the cat is soft
- the cat has weight
- the cat resists slightly while being pulled
- the cat settles naturally after release

Good first implementation approach:

1. Track drag origin
2. Measure pull distance
3. Convert pull distance into vertical scale stretch
4. Slightly offset head, body, limbs, and tail
5. Apply spring-back motion on release

This does not need advanced physics at first.

A convincing illusion is more important than physical realism.

## Cursor Awareness Strategy

The cat should react to cursor proximity without looking jittery.

Good behavior design:

- if cursor enters a radius around the cat, move to `curious`
- rotate or offset head toward cursor
- if cursor leaves the radius, smoothly return to `idle`

Important implementation note:

Cursor tracking should be throttled or smoothed so it does not cause noisy animation updates.

## Performance Thinking

The app should feel tiny and calm.

That means:

- low CPU while idle
- low memory usage
- smooth motion under normal desktop usage

Practical performance rules for this project:

- avoid re-rendering React components every frame
- use PixiJS for frame-level animation
- throttle expensive cursor calculations
- keep textures compact
- keep logging lightweight

## Art Direction Notes

The cat should be:

- black with white outline
- retro pixel-art style
- cute and expressive
- readable at small size

Recommended path:

- start with placeholder art in the same proportions as final art
- build the behavior system around correct scale assumptions
- replace placeholder sprites with final art later

This is much safer than waiting for perfect art before coding.

## Windows Product Considerations

Because the first release target is Windows, we should design for these realities early:

- DPI scaling can affect positioning
- transparent windows can behave differently across machines
- tray behavior should be tested on actual Windows builds
- unsigned `.exe` files may trigger SmartScreen warnings

This does not block the MVP, but it matters when we prepare the packaged app.

## Risks We Need to Respect

### Risk 1: Over-engineering too early

If we design for every future idea now, the MVP will stall.

Correct approach:

- build extension points
- do not build full integrations yet

### Risk 2: Making the animation system too complicated

If we jump to advanced rigs or too many body parts immediately, progress slows down.

Correct approach:

- start simple
- improve feel gradually

### Risk 3: Blending desktop logic and renderer logic

If Electron window control and cat behavior become tightly mixed, maintenance becomes difficult.

Correct approach:

- keep main-process responsibilities separate
- expose a small preload bridge
- let renderer own animation behavior

## Phase 0 Deliverables

This phase is complete when we have:

- a full project roadmap
- a written MVP boundary
- technical architecture direction
- known phase order
- known risk areas
- clear go-ahead for scaffolding

## What Happens Next

After Phase 0, we move to Phase 1 and begin implementation.

Phase 1 will focus on:

- creating the project scaffold
- setting up Electron + React + TypeScript + Vite
- configuring the transparent desktop window
- preparing the folder structure for cat rendering work

## Simple Summary

Phase 0 answers:

"What are we building, why are we building it this way, and what is the safest path to make it real?"

The answer is:

We are building a desktop-first Windows pet app with a strong visual-interaction MVP, using Electron for the shell and PixiJS for the cat. We will keep the first release focused, extensible, and realistic so it can later grow into a full `.exe` product with smarter developer-aware features.
