# StitchTrack — Tailor Clothing-Order Tracker

A lightweight, responsive, accessible, and offline-first clothing order management web application designed specifically for independent tailors and fashion designers. Built with 100% vanilla HTML5, CSS3, and modern JavaScript without external dependencies.

---

## 1. What the Project Is
**StitchTrack** is a focused order tracking workspace that allows independent tailors to record, monitor, update, and manage active client clothing orders on any device. It operates entirely on client-side storage, ensuring instant loading and complete privacy.

---

## 2. Who It Is Designed For
Independent tailors, seamstresses, bespoke fashion creators, and small apparel atelier owners who need an uncluttered, reliable digital workspace to manage their client orders without dealing with complicated software, subscription fees, or internet dependencies.

---

## 3. The Problem It Solves
Tailors frequently juggle order information across paper notebooks, loose WhatsApp messages, physical measurement slips, and memory. This leads to:
- Missed delivery deadlines
- Confusion over agreed pricing and deposit balances
- Difficulty tracking production stages (Pending, In Progress, Ready, Delivered)
- Lost records when physical notebooks are misplaced or damaged

StitchTrack provides a single, structured digital home for all active orders, automatically sorting them by closest delivery date so tailors always know what needs to be sewn next.

---

## 4. Core Features
- **Order Creation & Instant Validation**: Enter client name, garment description, agreed price (₦), delivery date, and production status with inline validation feedback.
- **Automated Delivery Date Sorting**: Orders are automatically ordered by nearest delivery date first to keep upcoming deadlines front and center.
- **Card-Based Visual Tracking**: Clean order cards displaying client names, garments, formatted Nigerian Naira pricing, formatted dates, and status badges.
- **One-Click Status Updating**: Update an order’s production lifecycle directly on its card between `Pending`, `In Progress`, `Ready`, and `Delivered`.
- **Accessible Deletion with Confirmation**: Protects against accidental clicks with an accessible, keyboard-trapped confirmation modal.
- **Local Persistence (`localStorage`)**: Automatic saving and instant data retrieval upon page reload with defensive corruption recovery.
- **Helpful Empty State**: Clear guidance for new users when no orders are recorded.
- **Screen Reader Announcements**: Dynamic `aria-live` region keeps assistive technology users informed of all actions (creation, status update, deletion).

---

## 5. Technologies Used
- **HTML5**: Semantic tags (`<header>`, `<main>`, `<section>`, `<form>`, `<fieldset>`, `<button>`, `<dialog>` pattern, ARIA live regions).
- **CSS3**: Vanilla CSS with CSS Custom Properties (design tokens), CSS Grid, Flexbox, high-contrast states, and responsive media queries.
- **JavaScript (ES6+)**: Vanilla JavaScript organizing state management, safe DOM creation (`document.createElement`, `textContent`), `Intl.NumberFormat` for currency, and event-driven architecture.
- **No external frameworks, libraries, CDNs, or fonts**: 100% offline-ready and lightweight.

---

## 6. How to Run Locally

### Prerequisites
Any modern web browser (Chrome, Firefox, Edge, Safari, Opera).

### Steps
1. Clone or download the project directory:
   ```bash
   git clone <repository-url>
   cd "Clothin-order tracker"
   ```
2. Open `index.html` directly in your browser:
   - **Windows**: Double-click `index.html` or run `start index.html` in PowerShell/Command Prompt.
   - **macOS**: `open index.html`
   - **Linux**: `xdg-open index.html`
   - Alternatively, serve with any local HTTP server (such as Python `python -m http.server 3000` or VS Code Live Server).

---

## 7. Important Product and Design Decisions
- **Atelier-Inspired Warm Palette**: Styled with warm stone (`#f7f5f0`), dark charcoal text (`#1c1a17`), and a warm terracotta/tailor bronze accent (`#a84b16`) reminiscent of classic fashion workshops.
- **System Font Stack**: Uses high-performance native system typography (`system-ui`, Apple, Segoe UI, Roboto) to prevent layout shifts (CLS) and eliminate external font loading latency.
- **Safe DOM Injection**: Strictly avoids `innerHTML` interpolation of user-provided strings, preventing XSS vulnerabilities.
- **Non-Modal Confirmation Dialog**: Created a custom accessible modal dialog instead of disruptive native browser `window.confirm()` or `window.alert()`.
- **Mobile-First Layout**: Sized touch targets (minimum 44px) and fluid single-column flow on mobile, expanding to a sticky 2-column workspace on desktop.

---

## 8. Accessibility Considerations
- **Semantic Structure**: Meaningful heading hierarchy (`h1`, `h2`, `h3`), landmarks (`header`, `main`, `section`, `footer`), and form labels linked with `for`/`id`.
- **Screen Reader Announcements**: Live region (`#live-announcer`) with `aria-live="polite"` broadcasts status changes, order creation, and deletion notices.
- **Color Independence**: Status badges communicate state using clear text labels and shape indicators, not color alone.
- **High Contrast**: All text and interface components surpass WCAG 2.1 AA standards with contrast ratios of 5.3:1 to 16.5:1.
- **Keyboard Navigation & Trapping**: Full tab order support, visible `:focus-visible` outlines, Escape key modal closure, and focus trapping inside the deletion modal.
- **Reduced Motion**: Supports `prefers-reduced-motion` media query to respect users sensitive to animations.

---

## 9. Challenges Encountered and How They Were Resolved
1. **Timezone Shifts on Date Inputs**:
   - *Problem*: Passing ISO date strings directly into `new Date("YYYY-MM-DD")` causes date shifts depending on UTC offsets.
   - *Resolution*: Split the date string into explicit `[year, month, day]` integers to ensure timezone-independent rendering.
2. **Accessible Form Error Feedback**:
   - *Problem*: Standard HTML5 validation tooltips differ across browsers and can be inaccessible.
   - *Resolution*: Used `novalidate` on the form and built inline accessible error containers with `aria-describedby`, `aria-invalid`, and programmatic focus movement to the first invalid field.
3. **Corrupted Local Storage Resilience**:
   - *Problem*: Unexpected data types or malformed JSON in `localStorage` could crash the interface on launch.
   - *Resolution*: Wrapped retrieval in a `try...catch` and validated every record against strict schema type predicates before committing to the application state.

---

## 10. Current Limitations
- **Device-Bound Storage**: Orders are stored in the browser’s `localStorage`. Clearing browser site data or switching devices will not carry over saved records.
- **Single Currency**: Formatted specifically for Nigerian Naira (NGN / ₦) per initial business requirements.
- **Single User Context**: Designed for individual tailor workspaces rather than multi-user team workflows.

---

## 11. Possible Future Improvements
- **Data Export & Backup**: Export orders to JSON or CSV for accounting backups.
- **Printable Invoices / Slips**: Dedicated printable order receipt view formatted for receipt printers.
- **Measurement Recording**: Expand order forms to include custom tailoring measurements (chest, waist, hip, length, shoulder).
- **Search & Filter Controls**: Quick search by client name or status filtering tabs (e.g. view only "In Progress" orders).
