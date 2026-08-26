---
name: Trellis B2B CRM
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#47464b'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#77767b'
  outline-variant: '#c8c5cb'
  surface-tint: '#5f5e61'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1e'
  on-primary-container: '#858387'
  inverse-primary: '#c8c5ca'
  secondary: '#5d5e60'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe0'
  on-secondary-container: '#616364'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b16'
  on-tertiary-container: '#88837c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e1e6'
  primary-fixed-dim: '#c8c5ca'
  on-primary-fixed: '#1b1b1e'
  on-primary-fixed-variant: '#47464a'
  secondary-fixed: '#e2e2e3'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1d'
  on-secondary-fixed-variant: '#454748'
  tertiary-fixed: '#e8e2d9'
  tertiary-fixed-dim: '#cbc6bd'
  on-tertiary-fixed: '#1d1b16'
  on-tertiary-fixed-variant: '#494640'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 2rem
  gutter: 1rem
  section-gap: 1.5rem
  stack-compact: 0.5rem
  stack-default: 0.75rem
  base-unit: 4px
---

## Brand & Style
This design system is built for high-density food manufacturing logistics, prioritizing clarity, calm, and utility. The aesthetic is a refined interpretation of the "New York" style—clean, monochrome-first, and structurally rigorous. It avoids the typical "SaaS Blue" in favor of a warm, architectural palette that feels stable and professional.

The design movement is **Minimalist / Corporate Modern**, drawing inspiration from tools like Linear and Notion. It utilizes heavy whitespace within containers, precise hairlines, and a sophisticated neutral-gray foundation to ensure that complex data remains legible and non-fatiguing for long-term daily use.

## Colors
The palette is strictly monochrome and neutral-first to reduce visual noise. 
- **Primary Surfaces:** Use a warm neutral gray (#FAFAF9) for the main application background to reduce eye strain compared to pure white.
- **Action Elements:** Primary buttons and active states use near-black (#18181B) with white text.
- **Borders:** Every UI boundary is defined by a 1px hairline (#E4E4E7), creating a clear but unobtrusive grid.
- **Status Indicators:** Only status badges depart from the monochrome theme, using desaturated pastel backgrounds with high-contrast text for immediate recognition without breaking the calm atmosphere.

## Typography
The system uses a pairing of **Hanken Grotesk** for headlines to provide a modern, geometric character, and **Inter** for all functional and body text to ensure maximum legibility at small sizes.

- **Scale:** Font sizes are kept tight to allow for high data density. 14px is the standard for most interface interactions.
- **Weight:** Use SemiBold (600) for headers to create hierarchy against the monochrome UI. Use Medium (500) for labels to ensure they stand out against the background without being as heavy as primary text.
- **Letter Spacing:** Apply slight negative tracking to headlines for a premium, "editorial" feel.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Navigation sidebars are fixed-width (240px or 280px), while the main content area expands to fill the viewport, utilizing a multi-column grid for dashboard widgets and table data.

- **Density:** This design system favors a "compact" density. Standard vertical spacing between elements in a form or list should be 12px (stack-default).
- **Grid:** Use a 12-column system for page-level layouts.
- **Margins:** Main application padding should be 32px (container-margin) on desktop to provide "breathing room" that offsets the high-density data tables.

## Elevation & Depth
In line with the "New York" style, depth is primarily communicated through **low-contrast outlines** rather than heavy shadows.

- **Layer 0 (Background):** #FAFAF9 (The canvas).
- **Layer 1 (Cards/Containers):** Pure white (#FFFFFF) with a 1px #E4E4E7 border.
- **Shadows:** Use a single, extremely soft "flat" shadow for floating elements like dropdowns or modals: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`.
- **Interactivity:** On hover, cards may shift from a neutral border to a slightly darker gray (#D4D4D8) rather than lifting with a shadow.

## Shapes
The design system uses a **Soft Rounded** language (10px / 0.625rem) across all interactive elements.

- **Inputs & Buttons:** 0.5rem (8px) to 0.625rem (10px) creates a modern, approachable feel that softens the "coldness" of the monochrome palette.
- **Large Cards:** Use 10px (rounded-lg) for main content containers.
- **Outer Containers:** Modals and large sections should use 1.5rem (rounded-xl) for a distinct layered look.
- **Icons:** Use Lucide-style icons with a 1.5pt or 2pt stroke weight and rounded caps to match the UI's geometry.

## Components
- **Buttons:** Primary buttons are near-black with white text. Secondary buttons use a white background with a 1px gray border. Ghost buttons are reserved for low-priority toolbar actions.
- **Inputs:** Backgrounds must be pure white to contrast against the off-white page background. Focus states use a 1px near-black ring.
- **Status Badges:** Use a "capsule" shape (full rounded). Colors are muted: 
  - *Active:* Light Green BG / Dark Green Text.
  - *Pending:* Light Amber BG / Dark Amber Text.
  - *Urgent:* Light Red BG / Dark Red Text.
- **Data Tables:** Use thin 1px horizontal dividers only; avoid vertical lines unless separating pinned columns. Row hover states should use a subtle #F4F4F5 background tint.
- **Cards:** Cards should have no shadow by default, relying solely on the 1px #E4E4E7 border for definition.
- **Navigation:** The sidebar should use a subtle wash of the background gray (#F4F4F5) to differentiate it from the primary workspace.