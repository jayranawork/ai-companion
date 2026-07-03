# Phase 0 Completion Checklist

## Purpose

This file turns Phase 0 from a general idea into a practical readiness checklist.

We should only start Phase 1 after most of the items below are understood and accepted.

## Product Scope Checklist

- [x] Confirm the app is desktop-first, not browser-first
- [x] Confirm the primary release target is Windows
- [x] Confirm the MVP excludes AI, voice, cloud sync, analytics, Git monitoring, terminal parsing, and VS Code detection
- [x] Confirm the MVP includes drag, stretch, core states, tray, settings, and logging
- [x] Confirm the final delivery target includes a Windows `.exe`

## Technical Stack Checklist

- [x] Electron selected for desktop shell
- [x] React selected for UI structure
- [x] TypeScript selected for maintainability
- [x] PixiJS selected for rendering and animation
- [x] Zustand selected for state storage
- [x] EventEmitter-based event bus selected for internal events
- [x] Electron Store selected for local settings
- [x] Pino selected for logging
- [x] electron-builder selected for packaging

## Architecture Checklist

- [x] Main process responsibilities defined
- [x] Preload and IPC bridge responsibilities defined
- [x] Renderer responsibilities defined
- [x] Base folder structure defined
- [x] State machine direction defined
- [x] Event bus direction defined
- [x] Animation manager direction defined

## Interaction Design Checklist

- [x] Drag behavior identified as MVP
- [x] Stretch behavior identified as signature feature
- [x] Cursor awareness defined as proximity-based
- [x] Simple spring-back behavior chosen over advanced physics for first implementation
- [x] Placeholder art approved as acceptable for early development

## Performance Checklist

- [x] Idle CPU target identified
- [x] Memory target identified
- [x] Need to keep React out of frame-by-frame animation work identified
- [x] Need to throttle or smooth cursor updates identified

## Windows Delivery Checklist

- [x] Transparent frameless window risk identified
- [x] Multi-monitor behavior risk identified
- [x] DPI scaling risk identified
- [x] SmartScreen warning risk for unsigned `.exe` identified

## Phase 0 Output Checklist

- [x] `PLAN.md` created
- [x] `PHASE-0.md` created
- [x] `PHASE-0-CHECKLIST.md` created
- [x] `ARCHITECTURE-DECISIONS.md` created
- [x] `ASSET-AND-ANIMATION-PREP.md` created

## Decision Gate

Phase 0 should be treated as complete when:

- the scope still feels right after review
- the stack still feels right after review
- the risks feel acceptable
- we are ready to scaffold without changing direction again

## Next Step

If this checklist still looks correct after review, we begin Phase 1 by scaffolding the Electron app and setting up the transparent always-on-top window.
