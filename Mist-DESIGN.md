# Design System Inspired by Mist Systems

## 1. Visual Theme & Atmosphere

Jupiter Mist embodies a clean, professional, and approachable digital ecosystem designed for collaborative enterprise environments. The design language balances minimalist aesthetics with functional clarity, using soft neutrals paired with vibrant teal accents to create a sense of calm innovation and connection. The atmosphere is welcoming yet authoritative—suitable for teams sharing ideas over coffee, emphasizing transparency and ease of use. The visual identity draws from contemporary SaaS design with generous whitespace, subtle depth via soft shadows, and a deliberate restraint in color to focus user attention on content and actionable elements.

**Key Characteristics:**
- Clean, minimal interface with generous whitespace and breathing room
- Teal and cyan primary colors suggesting trust and technological expertise
- Soft neutral palette anchoring the design with professional reliability
- Typography-driven hierarchy with restrained use of accent colors
- Subtle shadow elevation creating gentle depth without visual clutter
- Approachable and human-centered for team collaboration contexts
- Enterprise-grade polish paired with accessible, friendly interaction patterns

## 2. Color Palette & Roles

### Primary
- **Teal Brand** (`#1BB1F2`): Primary action CTAs, brand accent, interactive highlights—conveys innovation and connection
- **Navy Darkest** (`#171923`): Primary text for maximum contrast and readability on light backgrounds

### Accent Colors
- **Cyan Light** (`#1BB1F2`): Link text, secondary interactive states, accent highlights
- **Sky Hover** (`#E8F4F9`): Light background tint for hover or focus states on neutral elements

### Interactive
- **Teal Button Default** (`#A0AEC0`): Disabled or secondary button text
- **Link Teal** (`#1BB1F2`): Hyperlink default state

### Neutral Scale
- **Light Gray** (`#E2E8F0`): Used as primary neutral background, subtle dividers, borders (54 occurrences)
- **Medium Gray** (`#A7A9AA`): Secondary neutral text or subtle UI elements
- **Dark Gray** (`#606060`): Body text, secondary content, UI accents (44 occurrences)
- **Charcoal** (`#54595B`): Mid-tone text, secondary headings
- **Slate** (`#4A5568`): Deep neutral for text hierarchy
- **Graphite** (`#2D3748`): Dark neutral for emphasis
- **Gray 700** (`#718096`): Transitional neutral between dark and light
- **Dim Gray** (`#828384`): Subtle borders and weak text

### Surface & Borders
- **Pure White** (`#FFFFFF`): Primary surface, cards, input backgrounds
- **Off-White** (`#F7F8F9`): Secondary surface, subtle section dividers
- **Border Light** (`#E2E8F0`): Default border color for cards and containers

### Semantic / Status
- **Error Red** (`#E53E3E`): Alert, error messages, destructive actions
- **Error Dark Red** (`#C53030`): Error state hover or active states

## 3. Typography Rules

### Font Family
**Primary:** Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

**Secondary:** Open Sans (weight variations for hierarchy)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display / Hero | Open Sans | 28px | 600 | 36px | -0.5px | Page titles, main headings |
| Heading 1 | Open Sans | 24px | 600 | 32px | -0.25px | Section headings |
| Heading 2 | Open Sans | 20px | 500 | 28px | 0px | Subsection headings |
| Heading 3 | Open Sans | 16px | 500 | 24px | 0px | Card titles, prominent labels |
| Body | Open Sans | 16px | 300 | 24px | 0px | Standard paragraph text, primary content |
| Body Small | Open Sans | 14px | 300 | 20px | 0px | Secondary content, descriptions |
| Label | Open Sans | 12px | 300 | 18px | 0.5px | Form labels, captions, metadata |
| Label Strong | Open Sans | 12px | 500 | 18px | 0.5px | Required field indicators, emphasis |
| Span / Code Inline | Open Sans | 13px | 400 | 14px | 0px | Inline code, technical terms |
| Button Text | Open Sans | 14px | 500 | 14px | 0.25px | Button labels, interactive text |
| Input Placeholder | Open Sans | 14px | 300 | 20px | 0px | Input field text |
| Link | Open Sans | 16px | 300 | 24px | 0px | Hyperlinks, navigation text |

### Principles
- Open Sans is the single font family; weight variation (300, 400, 500, 600) drives hierarchy
- Line height increases proportionally with font size to maintain visual rhythm and readability
- Letter spacing is minimal (0–0.5px) to preserve Open Sans's clean proportions
- Body copy defaults to 300 weight; headings step up to 500–600 for distinction
- Labels and captions remain small (12px) and compact to reduce visual noise
- Buttons use 14px, 500 weight for clear, scannable call-to-action text

## 4. Component Stylings

### Buttons

**Primary Button (Default State)**
- Background: `#E8E8EB`
- Text Color: `#A7A9AA`
- Font Size: `14px`
- Font Weight: `500`
- Font Family: Open Sans
- Padding: `10px 24px`
- Border Radius: `18px`
- Border: `1px solid transparent`
- Box Shadow: `none`
- Height: `37px`
- Width: auto (min 150px)
- Line Height: `14px`

**Primary Button (Hover State)**
- Background: `#D0D0D2`
- Text Color: `#717173`
- Cursor: pointer
- Transition: all 200ms ease-in-out

**Primary Button (Disabled State)**
- Background: `#E8E8EB`
- Text Color: `#A7A9AA`
- Opacity: `0.6`
- Cursor: not-allowed

**Primary Button (Active/Teal CTA)**
- Background: `#1BB1F2`
- Text Color: `#FFFFFF`
- Font Weight: `500`
- Padding: `10px 24px`
- Border Radius: `18px`
- Box Shadow: `0px 2px 8px rgba(27, 177, 242, 0.2)`

**Secondary Button**
- Background: transparent
- Text Color: `#1BB1F2`
- Border: `1px solid #1BB1F2`
- Padding: `10px 24px`
- Border Radius: `18px`
- Font Weight: `500`
- Hover State: Background `#E8F4F9`, Text `#1BB1F2`

**Ghost Button**
- Background: transparent
- Text Color: `#606060`
- Border: `1px solid #E2E8F0`
- Padding: `10px 24px`
- Border Radius: `18px`
- Font Weight: `400`
- Hover State: Background `#F7F8F9`, Border `#A7A9AA`

### Cards & Containers

**Card (Primary Content)**
- Background: `#FFFFFF`
- Text Color: `#606060`
- Font Size: `16px`
- Font Weight: `300`
- Padding: `24px`
- Border Radius: `0px`
- Border: `1px solid #E2E8F0`
- Box Shadow: `0px 0px 50px rgba(0, 0, 0, 0.1)`
- Line Height: `24px`
- Min Height: `auto`

**Card (Subtle Background)**
- Background: `#F7F8F9`
- Text Color: `#828384`
- Font Size: `12px`
- Font Weight: `300`
- Padding: `12px`
- Border Radius: `0px`
- Border: `1px solid #E2E8F0`
- Box Shadow: `none`
- Line Height: `18px`

**Card (Divider/Separator)**
- Background: transparent
- Text Color: `#404244`
- Font Size: `11px`
- Font Weight: `300`
- Padding: `2px 9px`
- Border Radius: `0px`
- Border: `1px solid #E2E8F0`
- Box Shadow: `none`
- Height: `4px`
- Line Height: `16.5px`

**Container (Full Width)**
- Background: `#FFFFFF`
- Border: `1px solid #E2E8F0`
- Padding: `32px`
- Border Radius: `0px`
- Box Shadow: `0px 0px 50px rgba(0, 0, 0, 0.08)`

### Inputs & Forms

**Input Text (Default)**
- Background: `#FFFFFF`
- Text Color: `#000000`
- Font Size: `14px`
- Font Weight: `300`
- Font Family: Open Sans
- Padding: `8px 26px 8px 12px`
- Border Radius: `0px`
- Border: `1px solid #E2E8F0`
- Box Shadow: `none`
- Height: `36px`
- Width: `340px`
- Line Height: normal
- Placeholder Color: `#A7A9AA`

**Input Text (Focused)**
- Border: `2px solid #1BB1F2`
- Box Shadow: `0px 0px 0px 3px rgba(27, 177, 242, 0.1)`
- Background: `#FFFFFF`

**Input Text (Error)**
- Border: `2px solid #E53E3E`
- Box Shadow: `0px 0px 0px 3px rgba(229, 62, 62, 0.1)`

**Input Text (Disabled)**
- Background: `#F7F8F9`
- Text Color: `#A7A9AA`
- Border: `1px solid #E2E8F0`
- Cursor: not-allowed

**Label (Form)**
- Font Size: `12px`
- Font Weight: `300`
- Color: `#4A5568`
- Line Height: `18px`
- Margin Bottom: `8px`
- Display: block

### Navigation

**Link (Default)**
- Background: transparent
- Text Color: `#1BB1F2`
- Font Size: `16px`
- Font Weight: `300`
- Font Family: Open Sans
- Padding: `4px 4px`
- Border Radius: `0px`
- Border: none
- Box Shadow: none
- Line Height: `24px`
- Text Decoration: none

**Link (Hover)**
- Text Color: `#0D99D9`
- Text Decoration: underline
- Transition: all 150ms ease-in

**Link (Active)**
- Text Color: `#171923`
- Font Weight: `500`

**Navigation Item**
- Font Size: `14px`
- Font Weight: `400`
- Color: `#606060`
- Padding: `12px 16px`
- Hover: Background `#F7F8F9`, Color `#1BB1F2`

## 5. Layout Principles

### Spacing System

**Base Unit:** 4px

**Scale:**
- `4px`: Tight spacing between inline elements
- `8px`: Compact spacing within components
- `12px`: Standard padding within small containers, spacing between related items
- `16px`: Breathing room between sections
- `24px`: Default padding for cards and containers
- `32px`: Generous spacing between major sections
- `52px`: Large section margins
- `72px`: Page-level top/bottom margins
- `76px`: Large container offsets

**Usage Context:**
- Inputs and buttons: `8px` to `12px` internal padding
- Cards: `24px` to `32px` padding
- Section spacing: `32px` to `72px` margins between blocks
- Grid gaps: `16px` to `32px` depending on content density

### Grid & Container

**Max Width:** 1200px for primary content areas

**Column Strategy:**
- Desktop: 12-column grid, 16px gutter
- Tablet: 8-column grid, 12px gutter
- Mobile: 4-column grid, 8px gutter

**Section Patterns:**
- Hero/Auth sections: Full bleed with centered content card (440px wide)
- Content areas: Max-width container centered with 32px side margins
- Cards: 100% of container width or fixed widths (440px, 340px for inputs)

### Whitespace Philosophy

Whitespace is treated as a first-class element, not negative space. Generous margins and padding create calm, focused experiences. Content breathes through liberal use of 24–32px padding within cards and 32–72px margins between sections. This approach reduces cognitive load and guides the eye naturally through the interface hierarchy.

### Border Radius Scale

- `0px`: Primary border radius for cards, containers, inputs—clean, modern aesthetic aligned with enterprise design
- `18px`: Button border radius—distinctive and approachable, signals interactivity
- `4px`: Slight rounding for micro-interactions or nested elements (rare)

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Base / L0 | No shadow, `box-shadow: none` | Backgrounds, sections, flat UI elements |
| Raised / L1 | `0px 2px 8px rgba(0, 0, 0, 0.06)` | Input focus states, subtle hover cards |
| Card / L2 | `0px 0px 50px rgba(0, 0, 0, 0.1)` | Primary cards, containers, modal backgrounds |
| Modal / L3 | `0px 0px 50px rgba(0, 0, 0, 0.15)` | Overlay modals, dropdown menus |
| Floating / L4 | `0px 8px 24px rgba(0, 0, 0, 0.12)` | Tooltips, floating action buttons, popovers |

**Shadow Philosophy:**

Shadows are used sparingly and serve functional purposes: they elevate content off the background, create clear layering between interactive elements, and provide visual feedback on hover or focus states. The dominant shadow (`0px 0px 50px rgba(0, 0, 0, 0.1)`) is soft and diffuse, creating a gentle, approachable elevation rather than harsh depth. Shadow opacity scales with elevation level to reinforce hierarchy without overwhelming the clean aesthetic.

## 7. Do's and Don'ts

### Do
- Use the teal primary (`#1BB1F2`) for all primary CTAs and interactive highlights
- Maintain 24–32px padding inside cards and containers for breathing room
- Apply Open Sans at weight 500 or higher for all headings and button text
- Use the neutral light gray (`#E2E8F0`) as the default border and divider color
- Stack focus states with both border color and subtle shadow for accessibility
- Pair teal buttons with off-white (`#F7F8F9`) secondary actions for contrast
- Use rounded buttons (`18px` radius) to signal interactivity and approachability
- Leverage whitespace generously; err on the side of extra margin over compression
- Maintain consistent line heights (24px for 16px text, 18px for 12px text)
- Use 16px as the default body text size for readability at arm's length

### Don't
- Do not use sharp corners (0px radius) for buttons; always use `18px`
- Do not apply shadows to input fields in default state; reserve shadow for focus
- Do not exceed the 1200px max-width for primary content areas
- Do not mix font families; Open Sans only, varying by weight
- Do not use error red (`#E53E3E`) for any non-error UI elements
- Do not compress padding below 8px inside components; maintain breathing room
- Do not use font weights outside 300, 400, 500, 600
- Do not apply opacity or transparency to text; use explicit color values instead
- Do not create borders thinner than 1px; 1px is the minimum
- Do not add decorative shadows; all shadows must serve functional depth purposes

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Key Changes |
|-----------|-------|-------------|
| Mobile | 320px – 639px | Single column layout, full-width inputs (100% - 16px), 8px gutter, font sizes scale down 1–2px, button height 40px fixed |
| Tablet | 640px – 1023px | 2–4 column grid, 12px gutter, input width 100%, card width adjusts to container, padding scales to 16–20px |
| Desktop | 1024px – 1439px | 8–12 column grid, 16px gutter, max-width 1200px, fixed card widths (440px), input width 340px, padding 24–32px |
| Large | 1440px+ | 12 column grid, max-width 1200px centered, extra margins on sides, 32–52px section spacing |

### Touch Targets

- Minimum height: `44px` for all touch-interactive elements (buttons, inputs, links)
- Minimum width: `44px` for buttons and icon buttons
- Minimum padding: `8px` around interactive elements for adequate touch spacing
- Spacing between adjacent touch targets: minimum `8px` gap

### Collapsing Strategy

- **Navigation:** Collapses to hamburger menu below 640px; drawer opens from left with 100% width
- **Inputs:** Scale to 100% width on mobile, maintaining 8px horizontal margin; width: `calc(100% - 16px)`
- **Cards:** Stack vertically on tablet (640–1023px); switch to 1–2 columns; on mobile, single column full width
- **Buttons:** Stack vertically on mobile if side-by-side; use full width or maintain min 44px height
- **Padding:** Reduces from 32px (desktop) to 16px (tablet) to 12px (mobile) within cards and containers
- **Font Sizes:** Hold steady across breakpoints; line heights remain consistent
- **Shadows:** Maintained across all breakpoints; clarity over performance prioritized

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Teal Brand (`#1BB1F2`)
- **Secondary CTA:** Sky Hover (`#E8F4F9`) background with Teal text
- **Background:** Pure White (`#FFFFFF`)
- **Surface Tint:** Off-White (`#F7F8F9`)
- **Heading Text:** Navy Darkest (`#171923`)
- **Body Text:** Dark Gray (`#606060`)
- **Border:** Light Gray (`#E2E8F0`)
- **Disabled Text:** Medium Gray (`#A7A9AA`)
- **Error State:** Error Red (`#E53E3E`)
- **Link Text:** Cyan Light (`#1BB1F2`)

### Iteration Guide

1. **All buttons use `18px` border radius and Open Sans `500` weight**—no exceptions. Primary CTAs are teal (`#1BB1F2`), secondary actions use light blue background (`#E8F4F9`).

2. **Default padding inside cards and containers is 24–32px**—minimum 16px on tablet, 12px on mobile. Maximize whitespace; never compress to 8px unless spacing between tight inline elements.

3. **Text hierarchy relies solely on Open Sans weight variation (300, 400, 500, 600) and size scaling**—no other font families. Headings are 500–600 weight; body is 300 weight.

4. **Borders default to `#E2E8F0` light gray at 1px solid**. Only change border on focus (teal `#1BB1F2` at 2px) or error (red `#E53E3E` at 2px).

5. **Inputs are 36px tall, 340px wide on desktop**. On mobile and tablet, scale to `calc(100% - 16px)` maintaining 36px height. Placeholder color is `#A7A9AA`.

6. **Shadow elevation uses a single standard: `0px 0px 50px rgba(0, 0, 0, 0.1)` for cards**. No shadow on buttons or inputs in default state; apply shadow only on interactive hover/focus.

7. **Links are always `#1BB1F2` at 16px, 300 weight, Open Sans**. Hover state adds underline and darkens to `#0D99D9`. No underline on default state.

8. **Line heights scale proportionally: 24px for 16px text, 18px for 12px text, 14px for 13–14px text**. Maintain these ratios across all responsive breakpoints.

9. **Max-width for content is 1200px, centered on desktop**. On tablet (640–1023px), use full container width with 16px side margins. On mobile, 8px side margins.

10. **Error states use `#E53E3E` with a 2px border and light red shadow `rgba(229, 62, 62, 0.1)`**. Disabled states use `#A7A9AA` text on `#F7F8F9` background with 60% opacity.