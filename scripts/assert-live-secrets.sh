#!/usr/bin/env bash
# Read-only assert: production Fly runtime env + /health. Never sets secrets or deploys.
set -euo pipefail

APP="${FLY_APP:-mcfly-analytics}"
HEALTH_URL="${HEALTH_URL:-https://mcfly-analytics.fly.dev/health}"

expect_sample="${EXPECT_MCFLY_SAMPLE_ONLY:-false}"
expect_stage="${EXPECT_MCFLY_LIVE_STAGE:-overview_orders}"
print_fix=0

usage() {
  cat <<'EOF'
Usage: assert-live-secrets.sh [options] [expected_sample_only] [expected_live_stage]

Read-only checks against production (never sets secrets):
  - GET /health → HTTP 200
  - flyctl ssh printenv MCFLY_SAMPLE_ONLY MCFLY_LIVE_STAGE

Options:
  --print-fix     Echo the flyctl secrets set command only; do not run checks
  --sample-only V Expected MCFLY_SAMPLE_ONLY (default: false)
  --live-stage V  Expected MCFLY_LIVE_STAGE (default: overview_orders)
  -h, --help      Show this help

Environment (same defaults):
  EXPECT_MCFLY_SAMPLE_ONLY   default false
  EXPECT_MCFLY_LIVE_STAGE    default overview_orders
  FLY_APP                    default mcfly-analytics
  HEALTH_URL                 default https://mcfly-analytics.fly.dev/health
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --print-fix)
      print_fix=1
      shift
      ;;
    --sample-only)
      expect_sample="${2:?--sample-only requires a value}"
      shift 2
      ;;
    --live-stage)
      expect_stage="${2:?--live-stage requires a value}"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --*)
      echo "assert-live-secrets.sh: unknown option: $1" >&2
      exit 2
      ;;
    *)
      if [[ $# -ge 1 && -z "${positional_sample+x}" ]]; then
        positional_sample="$1"
        expect_sample="$1"
        shift
      elif [[ $# -ge 1 && -z "${positional_stage+x}" ]]; then
        positional_stage="$1"
        expect_stage="$1"
        shift
      else
        echo "assert-live-secrets.sh: unexpected argument: $1" >&2
        exit 2
      fi
      ;;
  esac
done

if [[ "$print_fix" -eq 1 ]]; then
  printf 'flyctl secrets set MCFLY_SAMPLE_ONLY=%s MCFLY_LIVE_STAGE=%s -a %s\n' \
    "$expect_sample" "$expect_stage" "$APP"
  exit 0
fi

fail=0

pass_line() {
  echo "$1: PASS"
}

fail_line() {
  echo "$1: FAIL" >&2
  fail=1
}

http_code="000"
if http_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$HEALTH_URL")"; then
  :
else
  http_code="000"
fi

if [[ "$http_code" == "200" ]]; then
  pass_line "health"
else
  fail_line "health"
fi

fly_out=""
fly_ok=0
if ! fly_out="$(flyctl ssh console -a "$APP" -C 'printenv MCFLY_SAMPLE_ONLY MCFLY_LIVE_STAGE' 2>/dev/null)"; then
  fly_ok=$?
fi

actual_sample=""
actual_stage=""
value_lines=()
while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    MCFLY_SAMPLE_ONLY=*)
      actual_sample="${line#MCFLY_SAMPLE_ONLY=}"
      ;;
    MCFLY_LIVE_STAGE=*)
      actual_stage="${line#MCFLY_LIVE_STAGE=}"
      ;;
    '' | 'No machine specified,'* | Connecting\ to*)
      ;;
    *)
      value_lines+=("$line")
      ;;
  esac
done <<<"$fly_out"

if [[ -z "$actual_sample" && ${#value_lines[@]} -ge 1 ]]; then
  actual_sample="${value_lines[0]}"
fi
if [[ -z "$actual_stage" && ${#value_lines[@]} -ge 2 ]]; then
  actual_stage="${value_lines[1]}"
fi

if [[ "$fly_ok" -ne 0 ]]; then
  fail_line "MCFLY_SAMPLE_ONLY"
  fail_line "MCFLY_LIVE_STAGE"
elif [[ "$actual_sample" == "$expect_sample" ]]; then
  pass_line "MCFLY_SAMPLE_ONLY"
else
  fail_line "MCFLY_SAMPLE_ONLY"
fi

if [[ "$fly_ok" -eq 0 ]]; then
  if [[ "$actual_stage" == "$expect_stage" ]]; then
    pass_line "MCFLY_LIVE_STAGE"
  else
    fail_line "MCFLY_LIVE_STAGE"
  fi
fi

exit "$fail"
