# Development Journal: StitchTrack Clothing-Order Tracker

An honest, stage-by-stage record of the design, architectural decisions, challenges, and solutions during development.

---

## Stage 1: Project Structure and Semantic HTML

### What Was Completed
- Created the project directory structure with discrete files (`index.html`, `styles.css`, `script.js`, `README.md`, and `journal.md`).
- Authored the complete semantic HTML5 document:
  - Accessible page header with a bespoke pure-SVG tailoring brand mark (no external icon dependencies).
  - Two-panel responsive container (`.form-section` and `.orders-section`).
  - Comprehensive `<form>` with visible `<label>` tags linked to form inputs via `for` and `id` attributes.
  - Dedicated field error containers (`div.field-error`) equipped with `role="alert"` and `aria-live="polite"` linked to each control via `aria-describedby`.
  - Accessible `<dialog>`-pattern confirmation overlay for destructive order deletion actions with ARIA modal attributes.
  - Global screen reader live region (`#live-announcer`) for real-time operation announcements.
  - Empty state container explaining how to record the tailor's first order.

### Decisions Made
- **Zero External Dependencies**: Decided to use pure SVG vectors and native HTML5 elements rather than CDN font libraries or icons to guarantee 100% offline availability and privacy.
- **Accessible Validation Architecture**: Paired all inputs with `aria-required="true"` and `aria-describedby` pointing directly to error containers so assistive technologies announce contextual errors immediately.
- **Modal Confirmation Over `window.confirm`**: Designed an accessible dialog container in HTML so confirmation can be operated with full keyboard trapping, readable typography, and visual consistency across browsers without blocking JavaScript execution.

### Challenges Encountered
- Ensuring that native HTML validation does not trigger default unstyled browser popups while still keeping semantics fully accessible.

### How the Challenges Were Handled
- Added the `novalidate` attribute to `<form>` so our custom, accessible, inline validation system can control user feedback precisely without jarring native browser alert bubbles.

### What Should Happen Next
- **Stage 2**: Build out the comprehensive responsive visual design and design system in `styles.css`.

---

## Stage 2: Responsive Visual Design

### What Was Completed
- Built the complete CSS design system using CSS Custom Properties (Tokens) for consistent palette, typography, radii, elevation shadows, and transitions.
- Designed an artisan-tailor theme:
  - Background: Warm natural workshop tone (`#f7f5f0`).
  - Text: High-contrast rich charcoal (`#1c1a17`) with secondary warm slate (`#5a544b`).
  - Accent: Single restrained warm terracotta / tailor bronze (`#a84b16`) for primary focus, highlights, and primary actions.
  - Status badges: Accessible, WCAG AA-compliant distinct color pairings (Pending: Amber, In Progress: Indigo/Blue, Ready: Emerald/Green, Delivered: Charcoal/Gray), each with a visible shape indicator and clear text representation.
- Implemented mobile-first responsive architecture:
  - Mobile layout: Fluid single-column with ample touch targets (minimum 44px for buttons and inputs).
  - Tablet/Desktop layout: 2-column workspace with a sticky order creation form panel and responsive auto-fill grid of cards.
- Implemented accessible `:focus-visible` ring styling and high contrast borders to ensure clear keyboard navigation.
- Included `prefers-reduced-motion` media query to respect users' vestibular motion preferences.

### Decisions Made
- **Avoided Frameworks and External CDNs**: Used native CSS Grid, Flexbox, and custom properties for fast performance and zero network dependencies.
- **Accessible Touch Target Sizes**: Standardized all clickable controls (buttons, inputs, selects) to 44px+ touch targets on mobile viewports.
- **Visual Status Redundancy**: Paired status badge background colors with solid border outlines, a small status dot indicator, and unambiguous textual labels to prevent reliance on color alone.

### Challenges Encountered
- Ensuring desktop stickiness of the form panel without causing scrolling overflow issues on short laptop screens.

### How the Challenges Were Handled
- Used `position: sticky; top: var(--space-6); align-items: start;` on the CSS Grid layout, ensuring the form panel remains anchored while the orders feed scrolls naturally.

### What Should Happen Next
- **Stage 3**: Implement order creation and field-level validation logic in `script.js` with dynamic inline error messaging and accessibility state management.

