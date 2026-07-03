# Cat Asset Plan

This is the practical sprite plan for moving from a temporary internet cat pack to a more intentional desktop pet set.

## Required State Sets

- `idle`
Purpose: default desktop presence, breathing-friendly loop
Need: 6-10 frames

- `walk`
Purpose: light drag movement
Need: 6-10 frames

- `run`
Purpose: strong drag / stretch movement
Need: 6-10 frames

- `sleep`
Purpose: idle after 30 seconds
Need: 4-8 frames

- `happy`
Purpose: triple-tap reaction, positive reminders, playful reaction
Need: 4-8 frames

- `stretch`
Purpose: strong pull / squash reaction
Need: 4-8 frames

## Nice To Have Later

- `blink`
Only if it comes from real matching cat frames

- `angry`
For edge-hit or failed action reactions

- `typing`
For future developer-aware reactions

- `fall`
For future gravity or jump systems

## Technical Rules

- Keep all states in the same art style and scale
- Use transparent PNG frames
- Keep the cat centered consistently across frames
- Match left/right direction either with true left assets or horizontal flip support
- Avoid mixing unrelated sprite packs for main body animation

## Current Recommendation

For now:

- keep the current cat pack for body animation
- do not fake blink with overlays
- add only secondary effects from other packs

That is safer than mixing body frames from a different art language.
