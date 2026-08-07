#!/usr/bin/env bash
# Analisis estatico de patrones de riesgo en el CODIGO de la aplicacion.
# Con semgrep instalado, semgrep manda (autoritativo). Sin el, greps de alta confianza.
set -uo pipefail
TARGET="${1:-.}"
# Solo codigo de la aplicacion: se excluye el framework de gobernanza, la documentacion y la config.
EX=(--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
    --exclude-dir=vendor --exclude-dir=.venv --exclude-dir=__pycache__ \
    --exclude-dir=.claude --exclude-dir=security \
    --exclude=*.md --exclude=*.yml --exclude=*.yaml --exclude=*.txt)
rc=0

SEMGREP_RULES="$(dirname "$0")/../.semgrep.yml"
if command -v semgrep >/dev/null 2>&1 && [ -f "$SEMGREP_RULES" ]; then
  echo "[sast] semgrep detectado (autoritativo)"
  semgrep --error --quiet --config "$SEMGREP_RULES" "$TARGET" || rc=1
  [ "$rc" -eq 0 ] && echo "[sast] OK (semgrep)" || echo "[sast] FAIL (semgrep)"
  exit "$rc"
fi

echo "[sast] semgrep no instalado -> greps de alta confianza (recomendado instalar semgrep)"

# FALLA (alta confianza)
fail_patterns=(
  'INJ-05|os\.system\('
  'INJ-05|subprocess\.[A-Za-z_]+\([^)]*shell[[:space:]]*=[[:space:]]*True'
  'INJ-05|child_process\.exec\('
  'INJ-05|Runtime\.getRuntime\(\)\.exec'
  'INFO-04|DEBUG[[:space:]]*=[[:space:]]*True'
  'INFO-04|app\.run\([^)]*debug[[:space:]]*=[[:space:]]*True'
)
for entry in "${fail_patterns[@]}"; do
  id="${entry%%|*}"; p="${entry#*|}"
  m=$(grep -rInE "${EX[@]}" -e "$p" "$TARGET" 2>/dev/null | grep -v 'security:ignore' | head -n 10 || true)
  if [ -n "$m" ]; then echo "[sast] FAIL ($id): patron '$p'"; echo "$m"; rc=1; fi
done

# REVISAR (baja confianza, no bloquea; instala semgrep para veredicto fiable)
review_patterns=(
  'INJ-03|(execute|query)\([^)]*(\+|%s|format\(|f")'
  'AUTH-03|hashlib\.(md5|sha1)\('
  'HDR-06|Access-Control-Allow-Origin[^A-Za-z0-9]*\*'
  'INJ-02|\beval\('
)
for entry in "${review_patterns[@]}"; do
  id="${entry%%|*}"; p="${entry#*|}"
  m=$(grep -rInE "${EX[@]}" -e "$p" "$TARGET" 2>/dev/null | grep -v 'security:ignore' | head -n 5 || true)
  if [ -n "$m" ]; then echo "[sast] REVISAR ($id): posible hallazgo, confirmar"; echo "$m"; fi
done

[ "$rc" -eq 0 ] && echo "[sast] OK (sin hallazgos de alta confianza)"
exit "$rc"
