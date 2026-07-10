<div align="center">

# 🐻💚 Baylor Nursing Grad Map

**See where the cohort landed.**

![Status](https://img.shields.io/badge/status-MVP%20built-FFB81C?style=for-the-badge&labelColor=154734)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/deploy-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)
![Private](https://img.shields.io/badge/repo-private-154734?style=for-the-badge)

</div>

---

A small map-first site tracking where nursing-school classmates ended up — what hospital, what unit, what city — built green-and-gold, Baylor-inspired.

Think *"Snapchat Map," but for tracking your cohort's careers* — pins on a US map, click one to see who's there, and a running log of moves right next to it.

## ✨ What it does

- 🗺️ **Live map** — one pin per classmate, scoped to the continental US by default, click a pin for their current hospital, unit, and city.
- 📜 **Change log** — a running feed next to the map: new units, new hospitals, new cities, timestamped.
- 🔐 **Admin view** — a password-gated page to update the log and everyone's info by hand.
- 🗃️ **Git as the database** — every update commits straight to this repo's `data/` files, so the repo itself is the source of truth and full history of everyone's moves.

## 🛠️ Built with

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript |
| **Styling** | Tailwind CSS, Baylor green (`#154734`) / gold (`#FFB81C`) |
| **Map** | react-leaflet + OpenStreetMap (free, no API key) |
| **Geocoding** | OpenStreetMap Nominatim |
| **Data** | JSON files in this repo, written via the GitHub API |
| **Hosting** | Vercel |

## 📋 Status

The MVP is built — map, log feed, nurse detail, and the admin flow all work locally. See **[PLAN.md](./PLAN.md)** for the full build plan and data model. Not yet deployed.

## 🚀 Running locally

```bash
npm install
cp .env.local.example .env.local   # fill in the values below
npm run dev
```

| Env var | What it's for |
|---|---|
| `ADMIN_PASSWORD` | Password for the `/admin` login form |
| `GITHUB_TOKEN` | GitHub PAT (fine-grained, scoped to this repo, contents read/write) — lets `/admin` commit changes to `data/*.json` |
| `GITHUB_OWNER` / `GITHUB_REPO` | This repo's owner/name, so the admin API knows where to commit |
| `GITHUB_BRANCH` | Defaults to `main` |

Without `GITHUB_TOKEN` set, the site itself still works fine (reads `data/*.json` straight off disk) — you just can't save changes from `/admin` until it's configured.

## ☁️ Deploying to Vercel

1. Push this repo to GitHub (already done — it's private).
2. Import the repo in Vercel.
3. Add the same env vars from the table above in the Vercel project settings.
4. Deploy. Every time `/admin` commits a change to `data/nurses.json` or `data/log.json`, Vercel's GitHub integration will pick up the new commit and auto-redeploy — the live site updates a minute or so after you save.

## ⚠️ Disclaimer

This is an independent, unofficial project made by a Baylor nursing alum to keep up with classmates. It is **not affiliated with, sponsored by, or endorsed by Baylor University**.
