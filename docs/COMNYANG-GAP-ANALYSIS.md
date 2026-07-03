# Comnyang Gap Analysis

## Purpose

This document explains why the current Desktop Dev Cat prototype still feels far from Comnyang and what we need to build to close that gap.

## Reality Check

The current project is now structurally healthier than before:

- desktop shell works
- transparent always-on-top window works
- cat architecture is split into dedicated modules
- asset pipeline exists
- drag, hover, and basic state flow exist

But the experience is still not close to Comnyang because Comnyang is not just a sprite pack with drag behavior. It is a full desktop pet interaction system with custom art and custom behaviors.

## What Comnyang Is Actually Doing

Based on the Comnyang site, the product clearly includes several custom interaction systems:

- cursor following
- eye follow
- mochi-like drag stretch
- mouse hunting
- head petting reactions
- keyboard kneading
- overheat mode with steam
- paper unroll on scroll
- AI thinking and completion reactions

This means Comnyang is almost certainly built from:

1. custom-designed cat assets
2. a state machine and event system
3. transform-based interaction animation
4. effect overlays and prop systems
5. app-level desktop behavior triggers

## Current Gap Categories

### 1. Art Style Gap

Current state:

- we are using an imported grey cartoon cat pack
- the style is polished, but it is not visually close to Comnyang

Comnyang style:

- black cat
- thick white outline
- compact silhouette
- tiny paws
- pixel-art feel
- strong readability at small size

Conclusion:

We need a custom cat asset set closer to the target visual language.

### 2. Animation Logic Gap

Current state:

- we play prebuilt frame sequences
- we add some transform-based movement during drag

Problem:

- the frame pack was not made specifically for desktop dragging
- walk/run frames during drag looked visually wrong
- deformation and movement are not deeply integrated yet

Conclusion:

We need dedicated drag/stretch visuals or part-based deformation support.

### 3. Behavior System Gap

Current state:

- state machine exists in early form
- renderer and animation mapping are still relatively simple

Comnyang-like requirement:

- many small emotional states
- more triggers from desktop behavior
- much stronger event-driven transitions

Conclusion:

We need a richer state model and clearer event inputs.

### 4. Interaction Feature Gap

Current state:

- dragging
- hover looking
- idle
- basic sleep trigger

Comnyang-like feature level:

- petting reaction
- hunting reaction
- typing reaction
- overheat reaction
- scroll reaction
- AI/tool state reaction

Conclusion:

We need overlay, prop, and effect systems, not just sprite swapping.

## Most Important Technical Lessons

### Lesson 1

Perfect internet sprite packs will not solve this project by themselves.

Why:

- they usually do not match the target style
- they usually do not include our custom behaviors
- they are rarely designed for drag/stretch desktop interactions

### Lesson 2

We should use downloaded art packs only as temporary functional packs.

Why:

- they help us test architecture
- they help us test state transitions
- they do not define the final visual identity

### Lesson 3

To reach Comnyang quality, we need a hybrid system.

That means:

- frame animations for base states
- transform-based motion for life and responsiveness
- overlay/prop/effect layers for advanced behaviors

## Recommended Target Architecture

The project should keep evolving around:

- `CatRenderer`
- `CatStateMachine`
- `CatAnimationController`
- `CatAssetLoader`
- `CatEvents`
- `CatOverlayRenderer`
- `CatPropController`

Then later add:

- `CatEffectController`
- `CatBehaviorTriggers`
- `CatDesktopSignals`

## Recommended Asset Strategy

### Phase A: Temporary pack

Use the current downloaded pack for:

- idle
- curious
- basic movement test
- loading pipeline verification

### Phase B: Custom black cat pack

Create a new cat much closer to Comnyang with these first states:

- idle
- blink
- drag
- stretch
- sleep
- typing or kneading

### Phase C: Advanced states and effects

Add:

- happy
- angry
- overheat
- thinking
- bounce
- scroll paper interaction

## Best Next Execution Order

1. keep the new architecture
2. improve drag feel with a drag-specific visual mode
3. stop treating the grey cat pack as the target final look
4. build or source a custom black pixel-cat art set
5. wire custom states into the existing asset system
6. add prop/effect-driven features for writing, heat, sparkles, and future AI reactions

## Final Conclusion

We are no longer blocked by architecture.

We are now blocked mainly by:

- art direction mismatch
- missing custom state art
- missing prop/effect systems

That is good news, because those are solvable in a structured way.

The right path forward is not to keep forcing random downloaded sprites to become Comnyang.

The right path is:

- keep the current system as the engine
- create custom assets closer to the target style
- build desktop-pet behaviors on top of that engine
