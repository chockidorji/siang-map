#!/usr/bin/env bash
# Restore the project to the state captured BEFORE the non-PFR location labels
# were added (i.e. roll back the work from 2026-05-13).
#
# Tag name: pre-non-pfr-labels-2026-05-13
# To restore manually instead of running this script:
#     git reset --hard pre-non-pfr-labels-2026-05-13
#
# This script is destructive — it discards every commit and every working-tree
# change made after the tag. You will lose the labels feature and any other
# uncommitted work. Use only if you want the map back the way it was.

set -euo pipefail

TAG="pre-non-pfr-labels-2026-05-13"

cd "$(dirname "$0")/.."

if ! git rev-parse --verify "$TAG" >/dev/null 2>&1; then
  echo "Error: tag '$TAG' not found in this repository." >&2
  echo "Available tags:" >&2
  git tag -l >&2
  exit 1
fi

echo "About to restore the project to tag: $TAG"
echo "Tag commit:    $(git rev-parse "$TAG")"
echo "Current HEAD:  $(git rev-parse HEAD)"
echo
COMMITS_AHEAD=$(git rev-list --count "$TAG..HEAD")
if [ "$COMMITS_AHEAD" -gt 0 ]; then
  echo "$COMMITS_AHEAD commit(s) will be discarded:"
  git log --oneline "$TAG..HEAD"
  echo
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "Working-tree changes will also be discarded:"
  git status --short
  echo
fi

read -r -p "Restore now? [y/N] " yn
case "$yn" in
  [yY]|[yY][eE][sS])
    git reset --hard "$TAG"
    echo
    echo "Restored to $TAG."
    ;;
  *)
    echo "Aborted. Nothing changed."
    exit 1
    ;;
esac
