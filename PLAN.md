# Project Plan — Baylor Nursing Grad Map

> **Status: MVP built locally.** Steps 1–9 in the build order below are done; step 10 (Vercel deploy) is next. See the README for local run + deploy instructions.

## What we're building
A small Next.js site, themed in Baylor green/gold, with:
- A home page map showing where nursing-school classmates currently work (pins on a US-scoped map).
- A log feed next to the map showing career changes (new unit, hospital, city, etc).
- A password-gated `/admin` page to add/edit log entries and nurse info.
- A GitHub-repo JSON file as the single source of truth — admin edits commit directly to the repo, and Vercel auto-redeploys.

## Decisions locked in
- **Repo**: this repo (`fastbacc`), **private**.
- **Location precision**: exact hospital address, geocoded server-side (free OpenStreetMap Nominatim API) and cached as lat/lng in the JSON — not re-geocoded on every page load.
- **Branding**: Baylor green `#154734` / gold `#FFB81C`, no official Baylor seal/logo/mascot art, footer disclaimer noting this is an independent, unaffiliated project.

## Tech stack
| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | One project serves the site and the admin API route; deploys to Vercel with zero config |
| Styling | Tailwind CSS | Fast to theme in Baylor colors |
| Map | react-leaflet + OpenStreetMap tiles | Free, no API key, no usage cap |
| Geocoding | OpenStreetMap Nominatim | Free, used once per address (cached), not client-side |
| Data store | `data/nurses.json`, `data/log.json` in this repo | Source of truth, versioned via git |
| Data read | GitHub Contents API, fetched fresh on every request (no caching) | Site always shows the latest commit — no redeploy needed to see an update |
| Admin → repo write | Octokit (GitHub API) + repo-scoped PAT | Admin form commits straight to `main`; the *next page load* picks it up immediately, code changes still need a redeploy |
| Admin auth | Single `ADMIN_PASSWORD` env var, httpOnly cookie, middleware on `/admin` + `/api/admin/*` | No user accounts needed — it's just you |

## Data model
```ts
type Nurse = {
  id: string
  name: string
  hospitalAddress: string   // e.g. "3500 Gaston Ave, Dallas, TX" — the only location field
  lat: number                // geocoded from hospitalAddress, cached
  lng: number
  hospital: string
  unit: string
}

type LogEntry = {
  id: string
  nurseId: string
  date: string    // ISO date
  change: string  // "Moved from Med-Surg to ICU at Baylor Scott & White"
}
```

## Pages / components
- **`/` (home)** — two-column layout. Left: Leaflet map, default view fit to continental US bounds, one pin per nurse. Right: scrollable log feed, newest first, each entry linked to its nurse.
- **Marker/name click** — popup or side panel with nurse detail (hospital, unit, city) plus that nurse's change history from the log.
- **`/admin`** — password-gated form: add a log entry, or update a nurse's current hospital/unit/city/address.
- **`/api/admin/update`** (POST) — checks the admin password, geocodes any new/changed address via Nominatim, then uses Octokit to commit the updated JSON to `main`.

## Build order
1. Scaffold Next.js + TypeScript + Tailwind in this repo.
2. Theme: Baylor colors, layout shell, disclaimer footer.
3. Define types; seed `data/nurses.json` / `data/log.json` with placeholder entries.
4. Map component reading pins from `nurses.json`.
5. Log feed component reading from `log.json`, cross-linked to map pins.
6. Nurse detail popup/panel on pin click.
7. `/admin` page + password gate + middleware.
8. API route: geocode + commit to GitHub via Octokit.
9. Wire admin form → API → confirm the live site picks up the new commit.
10. Connect repo to Vercel, set env vars (`ADMIN_PASSWORD`, `GITHUB_TOKEN`, repo owner/name), deploy, test end to end.

## Env vars needed on Vercel
- `ADMIN_PASSWORD` — your admin login password.
- `GITHUB_TOKEN` — a repo-scoped GitHub personal access token (contents: read/write) for this repo only.
- `GITHUB_OWNER` / `GITHUB_REPO` — this repo's owner/name.

## Open items to revisit later
- What "more info" shows when you click a classmate (bio? photo? certifications?) — TBD per the original ask.
- Whether classmates should be able to self-report changes eventually, vs. admin-only entry (current plan: admin-only).
