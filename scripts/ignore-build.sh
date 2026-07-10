#!/bin/sh
# Vercel "Ignored Build Step" — exit 0 skips the deploy, any other exit builds it.
#
# Admin edits (add/update/delete a nurse or log entry) only ever touch files
# under data/, and the app reads those live from GitHub on every request, so
# a data-only commit doesn't need a rebuild. Anything else (real code changes)
# should always build. If the git comparison itself fails for any reason
# (e.g. an unresolvable ref), fall back to building rather than erroring out.

BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"

git diff --quiet "$BASE" HEAD -- . ':(exclude)data' 2>/dev/null || exit 1
exit 0
