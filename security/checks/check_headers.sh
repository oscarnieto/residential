#!/usr/bin/env bash
# Comprueba las cabeceras de seguridad contra un despliegue preview.
# Uso: PREVIEW_URL=https://mi-preview  bash check_headers.sh   (o pasar la URL como argumento)
set -uo pipefail
URL="${PREVIEW_URL:-${1:-}}"
if [ -z "$URL" ]; then
  echo "[headers] SKIP - no hay PREVIEW_URL. Para APP este check debe ejecutarse contra el preview."
  exit 0
fi

# El fallo de red NO puede pasar por cumplimiento: sin respuesta, las cabeceras
# "que no deberian aparecer" (INFO-01) tampoco aparecen y el check daria OK sobre
# una respuesta vacia. Se corta aqui con FAIL y el motivo.
H=$(curl -sSIL --max-time 20 "$URL" 2>&1 | tr -d '\r')
curl_rc=$?   # con 'pipefail' el fallo de curl gana al exito de tr
if [ "$curl_rc" -ne 0 ]; then
  echo "[headers] FAIL: no se ha podido contactar con '$URL' (curl $curl_rc). Sin respuesta no hay veredicto."
  echo "$H" | sed 's/^/[headers]   /' | head -n 5
  exit 1
fi
if ! echo "$H" | grep -qiE "^HTTP/"; then
  echo "[headers] FAIL: la respuesta de '$URL' no contiene ninguna linea de estado HTTP."
  exit 1
fi

rc=0
has(){ echo "$H" | grep -qiE "^$1:"; }
val(){ echo "$H" | grep -iE "^$1:" | head -n1; }

require(){ # id  cabecera
  if has "$2"; then echo "[headers] OK ($1): $(val "$2")"; else echo "[headers] FAIL ($1): falta '$2'"; rc=1; fi
}

# HDR-01 clickjacking: X-Frame-Options O CSP frame-ancestors
if has "X-Frame-Options" || echo "$H" | grep -qiE "frame-ancestors"; then
  echo "[headers] OK (HDR-01): anti-clickjacking presente"
else
  echo "[headers] FAIL (HDR-01): sin X-Frame-Options ni CSP frame-ancestors"; rc=1
fi
require "HDR-02" "Content-Security-Policy"
require "HDR-03" "X-Content-Type-Options"
require "HDR-04" "Referrer-Policy"
require "HDR-04" "Permissions-Policy"
require "HDR-05" "Strict-Transport-Security"

# INFO-01: NO deberian aparecer
for leak in "Server" "X-Powered-By"; do
  if has "$leak"; then echo "[headers] FAIL (INFO-01): expone '$leak': $(val "$leak")"; rc=1; else echo "[headers] OK (INFO-01): sin $leak"; fi
done

# SESS-01: si hay Set-Cookie, exigir flags
if has "Set-Cookie"; then
  c=$(val "Set-Cookie")
  for flag in "Secure" "HttpOnly" "SameSite"; do
    echo "$c" | grep -qi "$flag" && echo "[headers] OK (SESS-01): cookie con $flag" || { echo "[headers] FAIL (SESS-01): cookie sin $flag"; rc=1; }
  done
fi

[ "$rc" -eq 0 ] && echo "[headers] OK" || echo "[headers] FAIL"
exit "$rc"
