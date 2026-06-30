#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

PILOT_FRONTEND_HOME="${PILOT_FRONTEND_HOME:-/home/cv/autodrome-pilot-frontend}"
FRONTEND_ROOT="${FRONTEND_ROOT:-$PILOT_FRONTEND_HOME/source}"
FRONTEND_PUBLIC_PORT="${FRONTEND_PUBLIC_PORT:-13000}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-autodrome-frontend-pilot}"

compose() {
  env \
    -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy \
    -u ALL_PROXY -u all_proxy \
    COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" docker compose \
    --env-file "$ENV_FILE" \
    -f "$SCRIPT_DIR/docker-compose.yml" "$@"
}

ensure_env() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"
  fi
}

install() {
  ensure_env
  mkdir -p "$PILOT_FRONTEND_HOME" "$FRONTEND_ROOT"
  printf '%s\n' "Autodrome frontend pilot env: $ENV_FILE"
  printf '%s\n' "Autodrome frontend source: $FRONTEND_ROOT"
}

update() {
  ensure_env
  compose build --pull frontend
}

build() {
  ensure_env
  compose build frontend
}

start() {
  ensure_env
  compose up -d frontend
}

stop() {
  ensure_env
  compose stop frontend
}

status() {
  ensure_env
  compose ps
}

smoke() {
  ensure_env
  url="http://127.0.0.1:$FRONTEND_PUBLIC_PORT"
  printf '%s\n' "Checking frontend: $url"
  curl -fsS "$url" >/dev/null
  printf '%s\n' "Frontend ok"
}

logs() {
  ensure_env
  compose logs --tail=200 -f frontend
}

case "${1:-}" in
  install) install ;;
  update) update ;;
  build) build ;;
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  smoke) smoke ;;
  logs) logs ;;
  *)
    printf '%s\n' "Usage: $0 {install|update|build|start|stop|restart|status|smoke|logs}" >&2
    exit 2
    ;;
esac
