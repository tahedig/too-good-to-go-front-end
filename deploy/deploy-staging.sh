#!/usr/bin/env bash

set -Eeuo pipefail

readonly container_name="staging-frontend"
readonly compose_file="compose.yaml"
readonly candidate_file="compose.yaml.candidate"
readonly env_file=".env"
readonly env_backup=".env.rollback"
readonly compose_backup="compose.yaml.rollback"
readonly pending_image_file=".pending-image"
readonly pending_sha_file=".pending-sha"

exec 9> .deploy.lock
if ! flock -n 9; then
  echo "Another frontend deployment is already running" >&2
  exit 1
fi

wait_for_health() {
  local status

  for _ in {1..30}; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_name" 2>/dev/null || true)"
    if [[ "$status" == "healthy" ]]; then
      return 0
    fi
    if [[ "$status" == "unhealthy" ]]; then
      docker logs --tail 100 "$container_name" >&2 || true
      return 1
    fi
    sleep 2
  done

  docker logs --tail 100 "$container_name" >&2 || true
  echo "Timed out waiting for $container_name to become healthy" >&2
  return 1
}

restore_previous() {
  set +e

  if [[ -f "$env_backup" ]]; then
    mv -f "$env_backup" "$env_file"
  fi
  if [[ -f "$compose_backup" ]]; then
    mv -f "$compose_backup" "$compose_file"
  fi

  if [[ -f "$env_file" && -f "$compose_file" ]]; then
    docker compose --env-file "$env_file" -f "$compose_file" up \
      --detach --no-build --force-recreate frontend
    wait_for_health
  else
    docker rm --force "$container_name" >/dev/null 2>&1 || true
  fi

  rm -f "$candidate_file" "$pending_image_file" "$pending_sha_file"
}

update_image() {
  local image="$1"
  local temp_file
  temp_file="$(mktemp .env.XXXXXX)"

  awk -v image="$image" '
    BEGIN { replaced = 0 }
    /^FRONTEND_IMAGE=/ {
      print "FRONTEND_IMAGE=" image
      replaced = 1
      next
    }
    { print }
    END {
      if (!replaced) {
        print "FRONTEND_IMAGE=" image
      }
    }
  ' "$env_file" > "$temp_file"

  chmod 600 "$temp_file"
  mv -f "$temp_file" "$env_file"
}

deploy() {
  local new_image="${1:?New image is required}"
  local expected_sha="${2:?Expected commit SHA is required}"
  local version_json

  if [[ ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Expected SHA must be a full 40-character Git commit SHA" >&2
    return 1
  fi
  if [[ "$new_image" != *":develop-$expected_sha" ]]; then
    echo "Image tag does not match the expected commit SHA" >&2
    return 1
  fi
  if [[ ! -f "$env_file" ]]; then
    echo "$env_file is missing on the staging server" >&2
    return 1
  fi
  if [[ ! -f "$candidate_file" ]]; then
    echo "$candidate_file was not uploaded" >&2
    return 1
  fi
  if [[ -e "$env_backup" || -e "$compose_backup" ]]; then
    echo "An earlier deployment is still pending confirmation or rollback" >&2
    return 1
  fi

  cp -p "$env_file" "$env_backup"
  if [[ -f "$compose_file" ]]; then
    cp -p "$compose_file" "$compose_backup"
  fi

  trap 'status=$?; trap - ERR; echo "Deployment failed; rolling back" >&2; restore_previous; exit "$status"' ERR

  docker compose --env-file "$env_file" -f "$candidate_file" config >/dev/null
  docker pull "$new_image"

  mv -f "$candidate_file" "$compose_file"
  update_image "$new_image"

  docker compose --env-file "$env_file" -f "$compose_file" up \
    --detach --no-build --force-recreate frontend
  wait_for_health

  docker exec "$container_name" wget --quiet --tries=1 --spider http://127.0.0.1/
  docker exec "$container_name" wget --quiet --tries=1 --spider http://127.0.0.1/healthz
  version_json="$(docker exec "$container_name" wget --quiet -O - http://127.0.0.1/version.json)"

  if [[ "$version_json" != *"\"commit\":\"$expected_sha\""* ]]; then
    echo "Container version does not match $expected_sha: $version_json" >&2
    return 1
  fi

  printf '%s\n' "$new_image" > "$pending_image_file"
  printf '%s\n' "$expected_sha" > "$pending_sha_file"
  trap - ERR

  echo "Deployment is healthy and awaiting external confirmation"
}

confirm() {
  if [[ ! -s "$pending_image_file" || ! -s "$pending_sha_file" ]]; then
    echo "There is no pending deployment to confirm" >&2
    return 1
  fi

  if [[ -f "$env_backup" ]]; then
    awk -F= '/^FRONTEND_IMAGE=/ { print $2 }' "$env_backup" > .previous-healthy-image
  fi
  cp "$pending_image_file" .last-healthy-image
  cp "$pending_sha_file" .last-healthy-sha

  rm -f "$env_backup" "$compose_backup" "$pending_image_file" "$pending_sha_file"
  echo "Deployment confirmed as healthy"
}

rollback() {
  if [[ ! -f "$env_backup" ]]; then
    echo "There is no previous deployment state to restore" >&2
    return 1
  fi

  restore_previous
  echo "Previous frontend image restored"
}

case "${1:-}" in
  deploy)
    shift
    deploy "$@"
    ;;
  confirm)
    confirm
    ;;
  rollback)
    rollback
    ;;
  *)
    echo "Usage: $0 {deploy <image> <commit-sha>|confirm|rollback}" >&2
    exit 2
    ;;
esac
