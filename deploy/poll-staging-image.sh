#!/usr/bin/env bash

set -Eeuo pipefail

readonly registry_image="${FRONTEND_REGISTRY_IMAGE:-ghcr.io/tahedig/too-good-to-go-front-end}"
readonly tracking_image="${registry_image}:develop"
readonly deploy_dir="${FRONTEND_DEPLOY_DIR:-/home/fpna/apps/frontend}"
readonly health_url="${STAGING_HEALTH_URL:-http://127.0.0.1:8080}"
readonly container_name="staging-frontend"

cd "$deploy_dir"

exec 8> .poll.lock
if ! flock -n 8; then
  echo "Another staging image check is already running"
  exit 0
fi

for required_file in .env compose.template.yaml deploy-staging.sh; do
  if [[ ! -f "$required_file" ]]; then
    echo "$deploy_dir/$required_file is missing" >&2
    exit 1
  fi
done

echo "Checking $tracking_image for a new staging image"
docker pull "$tracking_image"

candidate_sha="$(docker image inspect "$tracking_image" \
  --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}')"

if [[ ! "$candidate_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "$tracking_image does not contain a valid commit revision label" >&2
  exit 1
fi

candidate_image="${registry_image}:develop-${candidate_sha}"
docker pull "$candidate_image"

tracking_id="$(docker image inspect "$tracking_image" --format '{{.Id}}')"
candidate_id="$(docker image inspect "$candidate_image" --format '{{.Id}}')"
if [[ "$tracking_id" != "$candidate_id" ]]; then
  echo "Mutable and immutable image tags do not identify the same image" >&2
  exit 1
fi

current_sha="$(docker inspect "$container_name" \
  --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' \
  2>/dev/null || true)"

if [[ "$current_sha" == "$candidate_sha" ]]; then
  printf '%s\n' "$candidate_image" > .last-healthy-image
  printf '%s\n' "$candidate_sha" > .last-healthy-sha
  echo "Staging already runs commit $candidate_sha"
  exit 0
fi

cp -f compose.template.yaml compose.yaml.candidate
chmod 600 compose.yaml.candidate

deployment_started=false
rollback_if_needed() {
  local status=$?
  trap - ERR

  if [[ "$deployment_started" == true ]]; then
    echo "Post-deployment verification failed; restoring the previous image" >&2
    ./deploy-staging.sh rollback || true
  fi

  exit "$status"
}
trap rollback_if_needed ERR

./deploy-staging.sh deploy "$candidate_image" "$candidate_sha"
deployment_started=true

base_url="${health_url%/}"
curl --fail --silent --show-error --connect-timeout 5 --max-time 15 \
  "$base_url/healthz" >/dev/null
version_json="$(curl --fail --silent --show-error \
  --connect-timeout 5 --max-time 15 "$base_url/version.json")"
curl --fail --silent --show-error --connect-timeout 5 --max-time 15 \
  "$base_url/" >/dev/null

if [[ "$version_json" != *"\"commit\":\"$candidate_sha\""* ]]; then
  echo "Staging version does not match $candidate_sha: $version_json" >&2
  false
fi

./deploy-staging.sh confirm
deployment_started=false
trap - ERR

echo "Staging now runs $candidate_image"
