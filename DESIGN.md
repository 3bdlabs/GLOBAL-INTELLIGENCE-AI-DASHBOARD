# Design System: Tactical Intelligence Interface

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Command Center."** 

This is not a static dashboard; it is a living, breathing tactical environment. We are moving away from the rigid, sharp-edged "hacker" tropes of the past and toward a high-end, bespoke editorial experience. By blending heavy, obsidian-like surfaces with fluid rounded geometries and neon accents, we create a UI that feels both indestructible and technologically advanced. 

The layout breaks the standard "web grid" by utilizing a massive, immersive map viewport as a foundation, while the operational layer consists of modular, draggable cards. We achieve depth not through lines, but through tonal layering, intentional asymmetry, and the juxtaposition of monospace technical data with sophisticated sans-serif headlines.

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule
Solid 1px borders are strictly prohibited for structural sectioning. Boundaries between the main viewport and secondary modules must be defined by shifts in the background tokens (e.g., a `surface-container-low` module resting on a `background` viewport).

### Surface Hierarchy & Nesting
Treat the interface as a physical stack of semi-transparent obsidian glass. 
- **The Base:** Use `background` (#0d0e10) for the deepest layer.
- **The Modules:** Use `surface-container` (#181a1c) for the primary draggable cards.
- **Internal Nesting:** For inner components (like a news feed inside a card), use `surface-container-highest` (#242629) to create natural elevation.

### The Glass & Gradient Rule
To achieve a "Tactical Neon" look, main Action buttons and critical status indicators should use subtle gradients:
- **Primary Action:** Linear gradient from `primary` (#8ff5ff) to `primary_container` (#00eefc) at a 135-degree angle.
- **Glassmorphism:** For floating overlays (like tooltips or temporary status bars), use `surface_variant` (#242629) at 60% opacity with a `20px` backdrop-blur.

---

## 3. Typography: Technical Authority
We use a high-contrast pairing to distinguish between "Command" (User UI) and "Intelligence" (Data).

*   **Display & Headlines (`Space Grotesk`):** This is our "Operational" font. Use `display-md` for high-level global stats and `headline-sm` for card titles. The wide aperture of this font provides a futuristic, legible character.
*   **Body & Titles (`Inter`):** Our "Analytic" font. Use `body-md` for intelligence reports and `label-sm` for technical metadata. Inter provides a neutral, high-legibility balance to the aggressive Space Grotesk.
*   **Case Styling:** Use `uppercase` with `0.1em` letter-spacing for `label-md` to mimic tactical military readouts.

---

## 4. Elevation & Depth: Tonal Layering

Traditional box shadows are replaced by **Ambient Glows** and **Tonal Stacking**.

*   **The Layering Principle:** Place a card with `surface-container-low` on top of the `background`. If a card is "Active" or "Selected," shift its background to `surface-bright`.
*   **Ambient Shadows:** For draggable cards in motion, apply a shadow: `0px 20px 40px rgba(0, 0, 0, 0.4)` and a subtle `primary` glow: `0px 0px 15px rgba(143, 245, 255, 0.05)`.
*   **The Ghost Border:** For accessibility within the dark aesthetic, use the `outline-variant` token (#47484a) at **15% opacity**. This creates a "hairline" suggestion of a border that only appears when the light hits it.
*   **Corner Radii:** Following the "Refined Command" request, we use a tiered scale:
    *   **Draggable Cards:** `lg` (1rem) for the main container to soften the tactical feel.
    *   **Inner Elements/Buttons:** `md` (0.75rem) or `sm` (0.25rem).
    *   **Status Indicators:** `full` (9999px) for pill-shaped chips.

---

## 5. Components

### Draggable Cards (Modular Units)
*   **Container:** `surface-container` background, `lg` (1rem) rounded corners.
*   **Header:** `headline-sm` typography, `uppercase`. Integrated drag-handle icon using `outline` color.
*   **Spacing:** Use `spacing-4` (0.9rem) for internal padding. No divider lines; use `surface-container-highest` for the header background to separate it from the body.

### Tactical Buttons
*   **Primary:** `primary` background with `on-primary` text. `sm` (0.25rem) corner radius for a "precision" feel.
*   **Secondary/Outlined:** No fill. `Ghost Border` (outline-variant @ 20%). On hover, transition to 10% `primary` opacity fill.

### Status Chips
*   **Active/Live:** `secondary_container` background with `secondary` text. Add a pulsing animation to a 4px dot using `secondary_dim`.
*   **Neutral:** `surface_variant` background with `on_surface_variant` text.

### Input Fields
*   **Base:** `surface_container_lowest` background. 
*   **Focus State:** The "Ghost Border" becomes 100% opaque `primary`. Add a subtle `primary` outer glow (4px blur).

---

## 6. Do's and Don'ts

### Do
*   **DO** use `spacing-10` and `spacing-12` for the margins between cards to let the map "breathe" through the gaps.
*   **DO** use `tertiary` (#f3ffca) for non-critical "Information" or "Legend" elements to distinguish them from "Action" items.
*   **DO** use `asymmetry`. A 3-column modular bottom section where one card is wider than the others creates a custom, editorial feel.

### Don't
*   **DON'T** use pure white (#FFFFFF). Always use `on_surface` (#fdfbfe) or `on_surface_variant` (#ababad) to prevent eye strain in high-contrast dark mode.
*   **DON'T** use standard 1px borders to separate list items. Use a `spacing-1` gap and a subtle background shift.
*   **DON'T** use "Drop Shadows" that are grey or black on top of the black background. Use the "Ambient Glow" method with a tint of the `primary` color.