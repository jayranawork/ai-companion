# Sprite Direction

## Purpose

This file captures the new visual direction for Desktop Dev Cat as we move away from the temporary code-drawn prototype.

## Reference Image

Primary reference:

- `1e9d280c-518d-400e-ae67-b8e2c36eb352.png`

This reference shows the style we want to follow for the MVP:

- black pixel-art cat
- strong white outline
- compact and cute proportions
- small paws
- rounded head
- very readable expressions
- separate state frames for idle, sleep, happy, angry, stretch, and bounce

## Key Visual Learnings From the Reference

### 1. Simplicity matters more than detail

The cat works because the silhouette is very clean.

It is not a highly realistic cat. It is a small iconic cat shape with:

- rounded head
- soft body
- tiny paws
- curved tail
- minimal face detail

### 2. The outline is a major part of the style

The bright white outline is one of the most important identity elements.

That means future sprite assets should preserve:

- thick readable border
- clear shape separation from any background
- strong contrast even over messy desktop wallpapers

### 3. Expressions are tiny but readable

The eyes and mouth are extremely simple, but they change enough to communicate:

- idle
- blink
- sleep
- happy
- angry

That means we do not need dozens of animation frames to make the pet feel expressive.

### 4. Stretch is a special frame, not just a transform

The reference sheet suggests that stretch works best when the cat has a dedicated stretched version rather than only relying on scale transforms.

For the MVP, we can combine:

- transform-based motion
- a later dedicated stretch sprite when ready

## Recommended Asset Strategy

We should support both reusable parts and future state frames.

### Reusable parts for the first implementation

- head
- body
- tail
- left paw
- right paw
- face-open
- face-closed

### Additional state assets for later polish

- face-happy
- face-angry
- sleep frame
- stretch frame
- bounce frame

## Folder Plan

We created the following sprite structure:

```text
src/assets/sprites/cat/
  reference/
  parts/
  states/
  meta/
```

Meaning:

- `reference/`: source reference images and planning references
- `parts/`: reusable body-part sprite pieces
- `states/`: whole-state frames if we use them later
- `meta/`: manifest or config files that describe sprite usage

## Next Technical Step

The next implementation step should be:

1. define the sprite manifest
2. wire PixiJS to load part-based assets
3. replace the current code-drawn cat with sprite containers
4. keep blink and hover behavior
5. later add dedicated stretch and emotion sprites

## Important Constraint

The current reference is a style guide, not a direct production-ready asset pack.

So we should build the renderer so we can:

- drop in final PNGs later
- swap assets without rewriting the animation system
- keep part names stable even if art changes
