#!/usr/bin/env bash
# Orquesta todos los checks automatizables y devuelve un veredicto pass/fail.
# Este exit code es el contrato que consume el gate de CI.
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-.}"
overall=0

echo "=================================================="
echo " GATE DE SEGURIDAD - Politica de Aplicaciones"
echo "=================================================="

echo; echo "--- Secretos (INFO-06) ---"
bash "$DIR/check_secrets.sh" "$TARGET" || overall=1

echo; echo "--- Analisis estatico (INJ/AUTH/INFO-04) ---"
bash "$DIR/check_sast.sh" "$TARGET" || overall=1

echo; echo "--- Cabeceras (HDR/SESS/INFO-01) ---"
# El check de cabeceras usa PREVIEW_URL (env); si no hay preview, se salta.
bash "$DIR/check_headers.sh" || overall=1

echo
echo "=================================================="
if [ "$overall" -eq 0 ]; then
  echo " RESULTADO: PASS (checks automatizados)"
else
  echo " RESULTADO: FAIL - el merge/despliegue queda bloqueado"
fi
echo "--------------------------------------------------"
echo " RECORDATORIO: los controles [runtime] (AUTHZ-*, SESS-03/04/05,"
echo " INJ-01 de extremo a extremo, CSRF, SSRF, subida de ficheros) NO"
echo " se validan aqui. Requieren prueba dinamica y atestacion firmada"
echo " en security/attestation.md como requisito del gate de despliegue."
echo "=================================================="
exit "$overall"
