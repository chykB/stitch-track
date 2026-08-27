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
- **Stage 3**: Implement order creation and field-level validation logic in `script.js`.

---

## Stage 3: Order Creation and Validation

### What Was Completed
- Implemented robust, non-blocking field validation logic in `script.js`:
  - **Client Name**: Must not be empty or whitespace only.
  - **Clothing Item**: Must not be empty or whitespace only.
  - **Agreed Price**: Must be a valid positive numerical amount strictly greater than 0.
  - **Delivery Date**: Must be selected and valid.
- Built accessible error display mechanisms:
  - Toggled `aria-invalid="true|false"` dynamically on the input elements.
  - Rendered inline error messages directly into `#<field>-error` nodes without using browser alerts.
  - Added real-time `input` event listeners on all form controls to clear error states as soon as the user corrects their input.
- Added programmatic focus management to smoothly send focus to the first invalid field upon form submission failure.
- Implemented utility functions for collision-resistant unique ID generation (`ord_<timestamp>_<random>`) and international Nigerian Naira currency formatting (`Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`).

### Decisions Made
- **Real-Time Error Clearing**: Rather than waiting for another submit click, clearing error states on typing provides immediate feedback and reduces tailor frustration when entering rapid orders.
- **Strict Number and Whitespace Sanitization**: Added `.trim()` checks and `parseFloat() > 0` validation to prevent whitespace-only client entries or negative price anomalies.

### Challenges Encountered
- Ensuring that screen readers announce the exact reason a form failed validation when navigating directly to the first invalid input.

### How the Challenges Were Handled
- Connected each input to its dedicated error container with `aria-describedby` and marked the error container with `role="alert"` so assistive technology reads the error text as soon as the field is focused.

### What Should Happen Next
- **Stage 4**: Implement order rendering, delivery-date ascending sorting, empty state management, and robust `localStorage` persistence with error recovery.

---

## Stage 4: Order Persistence with localStorage

### What Was Completed
- Created defensive `localStorage` loading and saving layer under key `stitchtrack_orders_v1`.
- Built data sanity validation inside `loadOrdersFromStorage()` to handle missing, empty, or corrupt data without throwing runtime exceptions.
- Implemented ascending delivery date sorting (`sortOrders()`) ensuring orders due earliest are shown at the top of the feed, with creation timestamps as tiebreakers.
- Implemented safe DOM rendering in `createOrderCardElement()` and `renderOrders()` using `document.createElement`, `textContent`, and `setAttribute`, strictly avoiding any `innerHTML` interpolation of user-supplied text.
- Integrated Nigerian Naira currency formatting via `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`.
- Handled dynamic empty state toggling when no active orders exist.

### Decisions Made
- **Zero innerHTML Interpolation**: Ensured all user input fields (`clientName`, `clothingItem`, `price`, `date`) are safely bound via `textContent` to prevent script injection vulnerabilities.
- **Defensive Storage Schema Verification**: When loading from storage, each record is validated against field types and expected status values to prevent app crashes if localStorage was tampered with or corrupted.

### Challenges Encountered
- Preserving local date values without timezone conversion shifts (e.g., date input string `"2026-09-15"` turning into previous day in certain timezones if parsed via standard `new Date(string)`).

### How the Challenges Were Handled
- Deconstructed the date string into explicit year, month, and day components before passing into `Date.UTC` / custom date formatter, guaranteeing identical presentation across all international timezones.

### What Should Happen Next
- **Stage 5**: Verify and refine status updates and deletion workflows with accessible confirmation modals.



