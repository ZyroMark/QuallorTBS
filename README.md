# Quallor TBS — Taxi Booking System

A Next.js 16 prototype for the Eastern Cape digital taxi network. Supports passenger booking, driver management, and operator fleet oversight — including full offline functionality.

---

## Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Test Accounts

All accounts are stored in your browser's **localStorage** — no server or database needed.

**Create accounts** at [/auth/signup](http://localhost:3000/auth/signup) by selecting a role (Passenger / Driver / Operator), filling in the form, and submitting.

After signing up, you are automatically logged in and redirected to the correct dashboard:
- **Passenger** → `/dashboard`
- **Driver** → `/driver/dashboard`
- **Operator** → `/operator/dashboard`

> To reset all accounts, open DevTools → Application → Local Storage → delete `quallor_users` and `quallor_current_user`.

---

## Running Offline

Quallor is a **Progressive Web App (PWA)**. Once you have loaded the app at least once while online, the following works without an internet connection:

### What works offline

| Feature | Notes |
|---|---|
| Login / logout | Uses localStorage — no network needed |
| View booked tickets | Previously viewed tickets are cached |
| Digital QR ticket | Fully available offline |
| Driver walk-up booking | Create cash bookings without connectivity |
| Offline ticket queue | Walk-up tickets are stored with `pending-sync` status |
| `/offline` page | Shown automatically by the service worker when offline |

### What requires internet

| Feature | Notes |
|---|---|
| Map tiles (Leaflet) | CartoDB tiles need network; map won't render offline |
| Unsplash images | Route/destination card photos won't load |
| Google Fonts | Falls back to system serif/sans if not cached |

### How the offline detection works

1. The **service worker** (`public/sw.js`) caches all app shell files on install.
2. When the browser is offline and a navigation request fails, the SW intercepts it and serves `/offline` instead.
3. The `/offline` page shows cached links to **My Tickets** and **Dashboard**.
4. The red pulsing dot labelled "Waiting for connection..." monitors network state.
5. When connectivity is restored, the browser resumes normal navigation automatically.

### Installing as a PWA (mobile / desktop)

1. Open the app in Chrome or Edge.
2. Click the **Install** icon in the address bar (desktop), or use **Add to Home Screen** on mobile.
3. The app launches in standalone mode with no browser chrome, just like a native app.

---

## Project Structure

```
src/
  app/
    auth/           login, signup pages
    dashboard/      passenger home
    commute/        local route booking flow
    hiking/         long-distance booking flow
    trips/          booking history
    profile/        user profile
    wallet/         balance & transactions
    driver/         driver dashboard, scan, walk-up booking
    operator/       fleet management dashboard
    partner/        partner fleet overview
    safety/         safety & security settings
    onboarding/     app intro screen
    offline/        shown when network is unavailable
    context/        AuthContext, BookingContext (localStorage-backed)
  components/
    layout/         AppLayout, Sidebar, BottomNav
    AuthGuard       role-based route protection
    TrackingMap     Leaflet map with animated taxi marker
```

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + TypeScript
- **Tailwind CSS v4** — design tokens in `globals.css` `@theme` block
- **Leaflet.js** — live taxi tracking map
- **react-qr-code** — digital ticket QR codes
- **PWA** — `public/manifest.json` + `public/sw.js` service worker

---

## Design Tokens (quick reference)

| Token | Value | Usage |
|---|---|---|
| `q-brown` | `#8C6A4A` | Primary accent — buttons, links, icons |
| `q-brown-50/100/200/300` | Tints | Backgrounds, borders, hover states |
| `q-stone-900` | `#1C1917` | Headings |
| `q-stone-500` | `#78716C` | Body text |
| `q-bg-page` | `#FAF7F2` | Page background |
| `q-bg-section` | `#F0EBE3` | Panel / section background |
| `font-display` | Playfair Display | All headings |
| `font-sans` | DM Sans | All body / UI text |
