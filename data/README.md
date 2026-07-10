# Data

`nurses.json` and `log.json` are the site's source of truth. The app fetches them live from GitHub on every page load (not from a local copy baked into the build), and they're updated either by hand or through the `/admin` page, which commits changes here via the GitHub API. Either way, the live site picks up the change on the next page load — no redeploy needed.

Multiple nurses can share the same `hospitalAddress`/coordinates — the map groups same-location pins into a single numbered marker, and clicking it lists everyone there.
