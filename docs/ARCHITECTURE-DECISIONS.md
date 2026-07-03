# Architecture Decisions

## Purpose

This document records the main technical decisions for the MVP so we do not keep reopening the same architecture questions in later phases.

## Decision 1: Build as a Desktop-First App

Decision:

Use Electron from the start instead of building a browser-only app first.

Why:

- the product depends on transparent desktop presence
- always-on-top behavior is a core feature
- tray integration is a core feature
- startup behavior is desktop-specific

Tradeoff:

- desktop setup is slightly heavier than a plain web app
- but it avoids rebuilding core architecture later

## Decision 2: Use React for Structure, Not for Per-Frame Animation

Decision:

React will own application structure, but PixiJS will own frame-level animation work.

Why:

- React is good for app structure and maintainability
- PixiJS is better for smooth sprite motion and rendering performance

Tradeoff:

- some logic will live outside normal React component patterns
- but this keeps animation smoother and CPU usage lower

## Decision 3: Use PixiJS for Visual Rendering

Decision:

Use PixiJS as the primary renderer for the cat scene.

Why:

- better fit for sprite animation than plain DOM/CSS
- easier future path for particles, scene layering, and advanced effects
- clearer separation between app UI and animated pet scene

Tradeoff:

- slightly more setup than basic HTML elements
- but more appropriate for the product we are making

## Decision 4: Keep Main, Preload, and Renderer Separated

Decision:

Separate Electron responsibilities cleanly across:

- main process
- preload bridge
- renderer

Why:

- keeps window logic out of animation code
- keeps renderer safer and easier to reason about
- improves extensibility for future OS-level features

Tradeoff:

- requires explicit IPC boundaries
- but prevents messy coupling later

## Decision 5: Start with a Single Main Cat Window

Decision:

The MVP will have one primary transparent cat window.

Why:

- reduces window-management complexity
- simplifies drag, position reset, and tray behavior
- keeps debugging focused

Tradeoff:

- no multi-pet support in MVP
- but that is acceptable and preferred

## Decision 6: Use a Centralized State Machine

Decision:

All cat behavior states must pass through a centralized transition layer.

Why:

- prevents conflicting states
- makes future automated triggers safer
- improves debugging and logging

Tradeoff:

- requires a little more discipline up front
- but prevents fragile behavior later

## Decision 7: Use a Global Event Bus for Decoupling

Decision:

Use an EventEmitter-based bus for system-wide cat events.

Why:

- future integrations should be able to trigger reactions without reaching directly into components
- keeps event producers and consumers loosely coupled

Tradeoff:

- must be documented carefully to avoid event sprawl
- but is still lighter than adopting a much heavier event system

## Decision 8: Use Placeholder Art First

Decision:

Build the core animation and behavior system using placeholder art before final polished sprites.

Why:

- keeps engineering unblocked
- lets us validate proportions and motion early
- reduces dependency on perfect asset readiness

Tradeoff:

- visuals will be rough in early builds
- but development speed stays much higher

## Decision 9: Fake Elasticity Before Trying Full Physics

Decision:

Implement drag stretch using controlled interpolation and spring math, not a full physics engine.

Why:

- the MVP only needs convincing feel, not simulation realism
- easier to tune
- lower performance cost

Tradeoff:

- not physically accurate
- but more than enough for the intended user experience

## Decision 10: Design for Packaging Early

Decision:

Keep packaging and Windows distribution in mind from the first scaffold.

Why:

- desktop products often fail late because packaging was ignored early
- asset paths, logs, tray icons, and settings behavior can differ in packaged builds

Tradeoff:

- slightly more discipline during setup
- much less pain when generating the `.exe`

## Decision 11: Keep Future Integrations Behind Clear Boundaries

Decision:

Future developer-aware features should plug into the event system and state machine rather than directly manipulating renderer code.

Why:

- makes Git, terminal, and VS Code integrations safer to add later
- preserves the cleanliness of the MVP architecture

Tradeoff:

- requires some foresight now
- but avoids a rewrite later

## Working Rule for Future Changes

If a new idea makes the current architecture more fragile, we should not add it to the MVP.

The MVP should stay focused on:

- stable desktop behavior
- expressive cat interaction
- strong project structure
