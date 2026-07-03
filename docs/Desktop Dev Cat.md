# Desktop Dev Cat - MVP Specification v1

## Project Goal

Build a production-ready desktop companion cat application inspired by Comnyang.

The application should display a pixel-art cat on top of the user's desktop and react to developer activities such as coding, terminal output, Git operations, and user interactions.

This phase focuses ONLY on the foundation and core pet behavior.

DO NOT implement AI, voice, sound effects, cloud sync, analytics, or complex integrations yet.

The goal of this phase is to create a stable, extensible architecture that future features can plug into.

---

# Technology Stack

## Desktop Framework

Use:

* Electron
* React
* TypeScript

## Rendering

Use:

* PixiJS

Reason:

* Smooth sprite animation
* Future support for particle effects
* Future support for skeletal animation

## State Management

Use:

* Zustand

## Event System

Use:

* EventEmitter-based event bus

## Development

Use:

* Vite
* ESLint
* Prettier

---

# Core Requirements

The application must:

* Run as desktop application
* Always stay on top
* Transparent background
* Frameless window
* Draggable cat
* Low CPU usage
* Work when VS Code is open
* Work when terminal is open

---

# Folder Structure

```text
desktop-dev-cat/

src/

main/
window/
ipc/

renderer/

components/
cat/
ui/

animations/
sprites/

hooks/
stores/
events/
utils/

shared/

assets/

public/
```

---

# Cat Appearance

The cat should be visually similar to:

* Black pixel-art cat
* White outline
* Cute appearance
* Small body
* Big round eyes
* Tiny paws
* Curled tail

Visual Style:

* Retro pixel-art
* 16-bit game style
* Cute but expressive

Default size:

64x64

Scalable sizes:

* Small
* Medium
* Large

---

# Cat States

The cat is always in one state.

## Idle

Behavior:

* Blinks occasionally
* Tail moves slightly
* Looks around

Duration:

Default state

---

## Sleep

Trigger:

No interaction for 5 minutes

Behavior:

* Eyes closed
* Small sleeping animation

---

## Happy

Trigger:

Manual trigger

Future:

Build success

Behavior:

* Jump
* Tail wag
* Happy face

Duration:

3 seconds

---

## Angry

Trigger:

Manual trigger

Future:

Build failure

Behavior:

* Stomp
* Shake
* Angry face

Duration:

3 seconds

---

## Curious

Trigger:

Mouse nearby

Behavior:

* Looks toward cursor
* Head tilt

---

## Walking

Trigger:

Random intervals

Behavior:

* Walk left
* Walk right

---

# Stretch Feature

This is one of the most important features.

The cat must have elastic body behavior.

When user drags the cat:

* Head follows cursor
* Body stretches vertically
* Tail stretches slightly
* Limbs extend naturally

Visual effect:

Like pulling mochi.

Requirements:

* Smooth interpolation
* No instant snapping

When mouse released:

* Body returns smoothly
* Spring effect
* Small bounce

Pseudo flow:

Mouse Down
→ Grab Cat

Mouse Move
→ Stretch Body

Mouse Up
→ Release

Release
→ Bounce

Return To Normal

---

# Drag System

User can grab cat from any body part.

Requirements:

* Click and hold
* Drag freely
* Move across monitors
* No flickering

Future support:

Throwing physics

Not required in MVP.

---

# Cursor Awareness

Cat should know where cursor is.

Behavior:

Cursor Near:

* Look at cursor

Cursor Far:

* Return to idle

This should feel natural.

No sudden snapping.

---

# Window Requirements

Electron window:

```ts
transparent: true
frame: false
alwaysOnTop: true
resizable: false
```

Mouse interaction must remain enabled.

---

# State Machine

Create a centralized state machine.

States:

```text
idle
sleep
happy
angry
curious
walking
dragging
stretching
```

Allowed transitions:

```text
idle -> walking

idle -> curious

idle -> dragging

dragging -> stretching

stretching -> idle

idle -> happy

idle -> angry

idle -> sleep

sleep -> idle
```

Never allow invalid transitions.

---

# Event Bus

Create global event system.

Examples:

```ts
CAT_HAPPY

CAT_ANGRY

CAT_SLEEP

CAT_WAKE

CAT_DRAG_START

CAT_DRAG_END

CURSOR_NEAR

CURSOR_FAR
```

Future integrations will use this.

---

# Animation System

Create reusable animation manager.

Requirements:

* Play animation
* Stop animation
* Queue animation
* State-based animation switching

Future support:

* Git reactions
* Terminal reactions
* AI reactions

---

# Settings System

Create local settings storage.

Store:

```json
{
  "catSize": "medium",
  "alwaysOnTop": true,
  "autoSleep": true,
  "launchOnStartup": false
}
```

Use:

Electron Store

---

# System Tray

Create tray icon.

Menu:

* Show Cat
* Hide Cat
* Reset Position
* Settings
* Exit

---

# Logging

Create logging service.

Log:

* State changes
* Errors
* Window events

Use:

Pino

Log files:

```text
logs/app.log
```

---

# Performance Requirements

Target:

Idle CPU:
< 2%

Memory:
< 150 MB

No animation stutters.

60 FPS target.

---

# Future Features (DO NOT BUILD NOW)

These are phase 2 and later.

## Git Integration

Examples:

* Commit success
* Push success
* Merge conflict

Cat reactions:

Happy
Angry
Celebration

---

## Terminal Integration

Detect:

* npm run dev
* build success
* build failed

Cat reacts automatically.

---

## VS Code Integration

Detect:

* Active coding session
* Idle coding session

---

## AI Assistant

Future:

Codex integration

Examples:

Cat can say:

"You forgot to install express."

"Build failed because TypeScript found 3 errors."

Not required now.

---

# MVP Success Criteria

The MVP is complete when:

✓ Transparent desktop window works

✓ Cat appears on screen

✓ Cat can be dragged

✓ Stretch animation works

✓ Happy state works

✓ Angry state works

✓ Sleep state works

✓ Cursor tracking works

✓ State machine implemented

✓ Event bus implemented

✓ System tray implemented

✓ Logging implemented

✓ Stable architecture ready for future Git, Terminal, and AI integrations

END OF MVP SPECIFICATION
