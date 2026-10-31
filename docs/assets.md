# Asset Credits, Provenance & Audio Architecture

This document tracks all visual and audio assets utilized in **DOKKAEBI: The Midnight Game (도깨비)**, their cultural inspirations, implementation details, and licensing status.

---

## 1. Visual Design & Art Direction

### Korean Folklore Inspiration
- **Dokkaebi (도깨비)**: Supernatural beings from Korean folklore known for their mischievous nature, magical powers, and playful interactions with humans. The character designs in this game are original, stylized interpretations created for a "cute horror" casual reflex game.
- **Hanok (한옥) Architecture**: The background silhouettes represent traditional Korean Hanok roofs with their iconic gently curved eaves, ridge tiles, and warm glowing lanterns.
- **Midnight Full Moon**: A recurring motif in Korean night legends, transitioning from an ivory-gold aura into a blood-red moon during the final 10 seconds ("Midnight Frenzy").

### Target Character Designs
All spirit characters are procedurally generated vector designs rendered via HTML5 Canvas / WebGL graphics:
1. **Baby Dokkaebi (+1 pt)**:
   - *Colors*: Cyan `#58C9ED`, Ring `#8BE4FF`.
   - *Design*: Small rounded spirit body, two miniature hornlets, blushing cheeks, friendly curved smile, and sparkling eyes.
2. **Golden Dokkaebi (+5 pts)**:
   - *Colors*: Warm Gold `#D7AD66`, Ring `#FFE29A`.
   - *Design*: Single curved golden horn, sparkling star eyes, wide grin, surrounded by an ambient golden shimmer.
3. **Fire Spirit (+3 pts)**:
   - *Colors*: Teal/Aqua `#3BE0B8`, Ring `#8CFFE3`.
   - *Design*: Teardrop flame silhouette with flickering inner core, representing dancing Korean will-o'-the-wisps ("dokkaebi-bul").
4. **Cursed Dokkaebi (-2 pts Hazard)**:
   - *Colors*: Muted Crimson/Purple `#C76E7E`, Ring `#FF8FA3`.
   - *Design*: Jagged horns, dark crimson brow, slanted menacing eyes, sharp protruding fangs, and a sinister jagged outline.
5. **Ancient Dokkaebi (+10 pts Rare)**:
   - *Colors*: Royal Violet `#B47BFF`, Ring `#ECD7FF`.
   - *Design*: Crowned dual horns, mystical third golden forehead eye, regal ancient silhouette.

### Typography
- **Noto Serif KR** (Google Fonts): Used for Korean title treatment (`도깨비`). Licensed under the [SIL Open Font License](http://scripts.sil.org/OFL).
- **Outfit** (Google Fonts): Modern, legible sans-serif used for HUD, timers, instructions, buttons, and leaderboard. Licensed under the [SIL Open Font License](http://scripts.sil.org/OFL).

---

## 2. Audio Architecture & Synthesis

### Procedural Web Audio API Engine
To ensure 100% reliability, instant load times, and zero external network dependencies, all game audio is generated in real-time using the **Web Audio API** (`AudioContext` oscillators, biquad filters, and gain envelopes):

1. **Spirit Catch Chimes**:
   - *Baby Dokkaebi*: High sine wave frequency sweep (659Hz $\rightarrow$ 880Hz, E5 to A5) with rapid 250ms decay.
   - *Golden Dokkaebi*: Dual harmonic golden bell shimmer (880Hz and 1318.5Hz, A5 and E6) with 450ms sustained resonance.
   - *Fire Spirit*: Triangle wave multi-pitch burst (440Hz $\rightarrow$ 740Hz $\rightarrow$ 520Hz) simulating a crackling wisp catch.
   - *Cursed Dokkaebi*: Dissonant dual sawtooth cluster (146.8Hz and 155.5Hz, semitone clash) with descending lowpass filter.
   - *Ancient Dokkaebi*: Triadic temple chime (C5 523Hz, G5 784Hz, C6 1046Hz) with a 650ms serene decay.
2. **Combo Fanfare**:
   - Ascending 4-note Korean pentatonic fanfare (C5 $\rightarrow$ E5 $\rightarrow$ G5 $\rightarrow$ C6) triggered every 5 consecutive catches.
3. **Midnight Frenzy Temple Gong**:
   - Deep Korean Buddhist temple bell (*Bome-jong*, 범종) synthesis using 5 low harmonic partials (110Hz, 220Hz, 330Hz, 440Hz, 587Hz) with an organic 2.2-second acoustic reverberation.
4. **Time's Up Clapper**:
   - Dual wooden clapper strike (inspired by the traditional Korean wooden temple bell, *moktak* / 목탁).
5. **UI & Button Taps**:
   - Soft, crisp wooden click.

### License & Compliance
- All audio synthesized directly by code (`AudioService.ts`).
- No copyrighted third-party audio files or external royalty licenses required.
- Sound on/off state respected via `AudioService` and persisted in `localStorage`.
