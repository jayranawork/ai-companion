# Phase 1 Implementation And Execution Plan

## Purpose

This document defines the next implementation phase for Desktop Dev Cat after the initial scaffold and live cat prototype.

The immediate goal is to turn the current app into a cleaner, more reliable base for product work, then build the desktop pet and developer-assistant features in a controlled order.

Current focus:

- Phase 1.1 repo cleanup is complete
- Phase 1.2 core hardening is now the active implementation pass
- Phase 1.3 app controls and settings is the next section to complete

## Current Baseline

Already working:

- Electron desktop shell
- Transparent frameless always-on-top window
- React and TypeScript renderer
- PixiJS cat scene
- Cat asset loading
- Dragging and stretch behavior
- Cat state machine
- Reminder scheduler
- Local reminder storage
- Hidden reminder launcher
- Simple overlay effects

Current cleanup targets:

- remove generated build output from the repo workspace
- remove stale prototype files
- keep one source of truth for cat behavior
- keep curated runtime assets separate from raw source packs

## Phase 1.1: Repo Cleanup And Source Of Truth

Goal:
Make the repository easier to understand and safer to extend.

Work:

- delete generated output folders from the workspace
- remove duplicate or unused prototype files
- keep `src/cat` as the active cat system
- keep `src/shared` limited to shared constants and shared runtime types
- keep `src/assets` as the runtime asset source
- archive or delete raw source-pack folders that are no longer needed for active development

Done when:

- the repo has one obvious active rendering path
- there are no obvious duplicate cat implementations
- generated build output is not sitting in the working tree

## Phase 1.2: Product Core Hardening

Goal:
Make the current cat feel stable and intentional.

Work:

- improve idle motion
- add more natural blinking and tail motion
- refine drag and release feel
- improve edge collision reactions
- polish reminder presentation
- keep animation logic separated from UI logic

Done when:

- the cat feels alive even when idle
- dragging remains stable
- reminder bubbles and reaction effects feel consistent

## Phase 1.3: App Controls And Settings

Goal:
Turn the prototype into a usable desktop product surface.

Work:

- add settings storage
- add tray integration
- add in-app settings panel
- add show, hide, pause, and reset actions
- add focus mode controls
- add startup behavior controls
- add build and runtime info inside the controls panel

Done when:

- the user can control the app without relying on hidden gestures
- key preferences persist between launches
- tray controls are available for show, hide, pause, reset, and startup toggles
- an in-app settings panel is available for the same core controls
- a small build info section is available for packaged-build checks

## Phase 1.4: Developer Awareness Layer

Goal:
Let the cat react to real development activity.

Work:

- detect terminal commands
- detect build start and build finish
- detect Git actions
- detect editor focus and long coding sessions
- emit cat reactions based on those signals
- add lightweight session awareness and long-session nudges inside the app
- add dev build-status awareness for the live Electron watch loop
- add a terminal command wrapper that can publish activity from any project
- add an opt-in edge-walking mode that moves the cat across the desktop

Done when:

- the cat responds to development activity without being noisy
- the behavior layer stays modular and opt-in
- the app can show a gentle session-aware nudge during long work periods
- the app can reflect build activity while the Electron watch loop is compiling or ready
- the app can reflect terminal command activity from a shared signal source
- the user can toggle a roaming mode that walks the cat from edge to edge

## Phase 1.5: Optional AI Companion Layer

Goal:
Add intelligence only after the base product is trustworthy.

Work:

- create a modular AI provider interface
- support one or more AI backends
- summarize compiler and terminal output
- explain stack traces
- suggest fixes and next actions
- keep AI optional and switchable

Done when:

- the app still works well with AI disabled
- AI features are isolated from the core pet loop

## Execution Order

1. clean up the repository and confirm the active code paths
2. stabilize cat motion and interaction feel
3. add settings and tray controls
4. add developer awareness signals
5. package and harden the app for Windows delivery
6. add optional AI features behind a modular interface

## Success Criteria For This Phase

This phase is successful when:

- the codebase is clean and easy to navigate
- the cat experience is polished enough for daily use
- settings and tray support exist
- the app is ready to be packaged as a usable Windows product
- future developer and AI features can plug in without restructuring the whole app
