# Chive Design System & Style Guide

This document outlines the core design language, tokens, and interaction patterns for the Chive platform. It is intended to guide the frontend implementation (Preact + TypeScript) as a templating engine for ATProto/Bluesky data.

The aesthetic blends a "tactile, high-contrast" UI with "technical, terminal-inspired" data displays, bridged by a highly adaptable variable font.

---

## 1. Color Palette

The color system is built around a vibrant, approachable green, paired with sharp contrasts to maintain a structured, app-like feel.

### Primary Greens
* **Emerald (Primary Brand):** `#27ae60`  
  * *Usage:* Primary borders, main text accents, active states, solid primary buttons, icon colors.
* **Mint Wash (Background/Highlight):** `#ebf7ed`  
  * *Usage:* App backgrounds, card hover states, secondary button backgrounds, light shadow offsets.
* **Forest (Deep Accent/Shadows):** `#1e8449`  
  * *Usage:* Dark borders on inverted components, pressed states, deep hard-shadows on primary buttons.

### Neutrals
* **Ink/Slate (Primary Text):** `#1e293b`  
  * *Usage:* Main body text, dark terminal/AI node backgrounds.
* **Paper (Surface):** `#FDFDFD` to `#FFFFFF`  
  * *Usage:* Main app background, card base surfaces.
* **Muted Text:** `#64748b` (Slate 500) and `#94a3b8` (Slate 400)  
  * *Usage:* Descriptions, secondary metadata, unselected states.

---

## 2. Typography: The Recursive System

The entire typography system relies on **Recursive**, a variable font. This is critical to the app's identity. Do not use static font weights; instead, manipulate the CSS `font-variation-settings` axes.

**Base Font Import:** `family=Recursive:slnt,wght,CASL,MONO@-15..0,300..1000,0..1,0..1`

### Typographic Roles & Axes

| Role | Weight | CASL Axis | MONO Axis | Slant | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Body Copy** | 400-500 | 0 | 0 | 0 | Recipe steps, descriptions, general UI |
| **Headings** | 900 | 1 | 0 | 0 | Recipe titles, section headers |
| **Emphasis** | 900 | 1 | 0 | -15 | Key words in hero text or calls to action |
| **Technical** | 700-900 | 0 | 1 | 0 | DIDs, Tags, Metadata, AI Node text |
| **Brand Logo**| 900 | 1 | 1 | 0 | Main "CHIVE" brand treatment |

---

## 3. UI Primitives

The UI avoids soft, blurred shadows in favor of a "neo-brutalist" tactile technical aesthetic.

### Borders
* **Standard Outline:** `2px solid #27ae60`  
  * *Rule:* Almost all interactive surface elements (cards, input fields, badges, buttons) are encased in this sharp, 2px emerald border.
* **Heavy Dividers:** `4px solid #27ae60`  
  * *Rule:* Used for major layout delineations like the global navigation bar.

### Corner Radii
* **Badges/Tags:** `4px` to `8px`
* **Small UI (Buttons, Inputs):** `12px` to `16px`
* **Cards & Containers:** `24px` to `32px`

### Hard Shadows
Shadows are solid blocks of color with zero blur, creating a "stacked card" effect.
* **Standard Shadow:** `box-shadow: 4px 4px 0px #ebf7ed;`
* **Deep/Pressed Shadow:** `box-shadow: 4px 4px 0px #1e8449;` (Used for buttons and dark-mode elements)

---

## 4. Interaction & Motion

### Card Hover States
1. **Translate Y:** `transform: translateY(-4px);`
2. **Shadow Expansion:** `box-shadow: 12px 12px 0px #ebf7ed;`
3. **Image Scale:** `transform: scale(1.05);` (inside an `overflow-hidden` container)
4. **Transition:** `all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Button Active States
Buttons should feel like physical keys being pressed down.
* **On Active (Click):** `transform: translateY(2px);` and `box-shadow: 0px 0px 0px transparent;`

---

## 5. Component Signatures

### The "Data Manifest" Window
Used for Ingredients or Technical Data.
* **Container:** 2px Emerald border with an `overflow-hidden` header.
* **Header Bar:** Dark Green (`#1e8449`) background, featuring three small "window control" dots (simulating a terminal window) and a Monospaced title (e.g., `MANIFEST.V1`).
* **Body:** White or Mint Wash background with high-contrast text.

### AI Assistance Node
* **Visuals:** Dark Slate (`#1e293b`) background.
* **Accent:** Ghostly circuit-line SVG patterns at low opacity (5-10%).
* **Font:** Strictly `MONO: 1`. Every prompt or output should be preceded by a `$` command-line character.

### Step-by-Step Pipeline
* **Numerals:** Large, high-weight (900), low-contrast numbers (using `#ebf7ed`).
* **Connection:** A vertical 2px line connects steps to visually represent a "pipeline" or execution flow.