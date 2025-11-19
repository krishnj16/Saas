#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <target-url> [output-dir]"
  exit 1
fi

TARGET="$1"
OUTDIR="${2:-${SCAN_OUTPUT_DIR:-./scans}/wpscan}"
mkdir -p "$OUTDIR"

if [ -z "${WPSCAN_TOKEN:-}" ]; then
  echo "NOTE: WPSCAN_TOKEN not set. WPVulnDB lookups will be skipped; output will still contain enumerations."
else
  echo "Using WPSCAN_TOKEN from environment."
fi

WIN_OUTDIR=$(cd "$OUTDIR"; pwd -W | sed 's#^\([A-Z]\):#//\L\1#')

docker pull wpscanteam/wpscan:latest

DOCKER_ENV_ARGS=()
if [ -n "${WPSCAN_TOKEN:-}" ]; then
  DOCKER_ENV_ARGS+=(--env "WPSCAN_API_TOKEN=${WPSCAN_TOKEN}")
fi

docker run --rm "${DOCKER_ENV_ARGS[@]}" \
  --mount type=bind,source="$WIN_OUTDIR",target=/output \
  wpscanteam/wpscan:latest \
  --url "$TARGET" \
  --enumerate vp,vt,tt,u \
  --format json \
  -o /output/result.json

echo "Saved WPScan JSON to $OUTDIR/result.json"
