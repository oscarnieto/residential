#!/usr/bin/env bash
# INFO-06 — No secretos, credenciales ni connection strings en el codigo fuente.
# Usa gitleaks si esta instalado (recomendado); si no, escaneo por patrones (fallback).
set -uo pipefail
TARGET="${1:-.}"
# Se excluye el propio framework de gobernanza (no es codigo de la aplicacion) y dependencias.
EX=(--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
    --exclude-dir=vendor --exclude-dir=.venv --exclude-dir=__pycache__ \
    --exclude-dir=.claude --exclude-dir=security)

if command -v gitleaks >/dev/null 2>&1; then
  echo "[secrets] gitleaks detectado"
  gitleaks detect --no-banner --redact -s "$TARGET" && { echo "[secrets] OK - INFO-06"; exit 0; } || { echo "[secrets] FAIL - INFO-06"; exit 1; }
fi

echo "[secrets] gitleaks no instalado -> escaneo por patrones (fallback heuristico)"
patterns=(
  'AKIA[0-9A-Z]{16}'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
  '(api[_-]?key|secret|access[_-]?key|token)[[:space:]]*[:=][[:space:]]*[A-Za-z0-9_/+-]{16,}'
  '(password|passwd|pwd)[[:space:]]*[:=][[:space:]]*[^[:space:]]{6,}'
  '(mongodb|postgres|postgresql|mysql|redis)://[^[:space:]]*:[^[:space:]]*@'
  'xox[baprs]-[0-9A-Za-z-]{10,}'
  'gh[pousr]_[0-9A-Za-z]{20,}'
)
found=0
for p in "${patterns[@]}"; do
  m=$(grep -rInEi "${EX[@]}" -e "$p" "$TARGET" 2>/dev/null | grep -v 'security:ignore' | head -n 20 || true)
  if [ -n "$m" ]; then echo "[secrets] POSIBLE SECRETO (patron: $p)"; echo "$m"; found=1; fi
done
if [ "$found" -ne 0 ]; then
  echo "[secrets] FAIL - INFO-06 (revisa; anota falsos positivos con  # security:ignore)"
  exit 1
fi
echo "[secrets] OK - INFO-06"
exit 0
