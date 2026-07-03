# Asset and Animation Preparation

## Purpose

This file explains what visual assets and animation pieces we should prepare before or during early implementation.

The goal is not to demand perfect final art immediately. The goal is to define what the codebase expects so engineering and art can move in parallel.

## Visual Direction

The cat should feel:

- black with white outline
- pixel-art inspired
- cute and readable at small size
- expressive without needing many frames

Recommended base size:

- default display size: `64x64`

Recommended support sizes:

- small
- medium
- large

## Recommended Early Asset Strategy

For development, use placeholder sprites first.

This means:

- same approximate body proportions as final cat
- simple readable silhouette
- enough separation between head, body, tail, and limbs if we use segmented animation

This lets us build motion logic without waiting for polished art.

## Two Viable MVP Art Approaches

## Option A: Full sprite-sheet animation

Description:

- each state has one or more complete cat frames

Good for:

- blink cycles
- happy and angry expressions
- simple walking loops

Limitations:

- harder to create convincing stretch from full-frame images alone

## Option B: Segmented body-part approach

Description:

- head, body, tail, and limbs are separate visual parts

Good for:

- drag stretch
- head tilt
- tail movement
- spring-back motion

Limitations:

- more setup work
- can look awkward if pivots are not chosen carefully

## Recommended MVP Direction

Use a hybrid approach:

- segmented body parts for interactive stretch behavior
- optional full-frame overlays or expressions for emotional states if needed later

This gives the best balance between expressiveness and engineering control.

## Minimum Placeholder Asset List

For early implementation, we should prepare:

- head sprite
- body sprite
- tail sprite
- front paw sprite
- back paw sprite
- eye-open variant
- eye-closed variant
- optional angry face variant
- optional happy face variant
- tray icon

## Animation List for MVP

These are the animation behaviors Phase 1 through Phase 4 will eventually need.

### Idle

- light breathing or body bob
- occasional blink
- slight tail motion
- occasional look-around

### Sleep

- eyes closed
- slow breathing
- optional tiny bob

### Happy

- small jump
- brighter expression
- faster tail wag

### Angry

- stomp or shake
- narrowed expression
- stronger body squash

### Curious

- head tilt toward cursor
- eye direction change if supported

### Walking

- left/right step cycle
- subtle body bounce

### Dragging / Stretching

- head follows pull direction
- body stretches vertically
- limbs extend slightly
- tail trails the movement

### Release

- spring return
- one or two settling bounces

## Pivot and Anchoring Notes

If we use segmented sprites, each part should have clear anchor expectations:

- head anchored near neck
- tail anchored at lower back
- paws anchored near shoulder/hip points
- body as the main transform reference

This will matter a lot when coding stretch motion.

## Naming Guidance

When we start adding assets, use clear names such as:

- `cat-head.png`
- `cat-body.png`
- `cat-tail.png`
- `cat-paw-front.png`
- `cat-paw-back.png`
- `cat-face-idle-open.png`
- `cat-face-idle-closed.png`
- `cat-face-happy.png`
- `cat-face-angry.png`
- `tray-icon.png`

## Engineering Assumption

The renderer should not assume final polished art exists.

It should be written so that:

- asset swaps are easy
- frame counts can change
- size presets are controlled by configuration

## What We Need Before Phase 2

Before we fully start cat rendering work, we should at least have:

- placeholder tray icon
- placeholder cat body-part assets or placeholder full frames
- rough scale assumptions for small, medium, and large
- a decision on whether the first rendering build uses segmented parts

## Recommendation

For this project, the safest path is:

1. use placeholder segmented sprites
2. build drag/stretch behavior around them
3. tune the feel
4. replace visuals later with polished pixel-art assets

That gives us the highest chance of building the signature interaction successfully.
