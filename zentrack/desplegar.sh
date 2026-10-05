#!/usr/bin/env bash
# Despliega Zentrack: arma los 8 archivos, los sube y actualiza la implementación.
# Uso: ./desplegar.sh        (desde la carpeta zentrack)
set -e
cd "$(dirname "$0")"
[ -f .clasp.json ]   || { echo "Falta .clasp.json: haz primero el paso 4 (clasp clone)."; exit 1; }
[ -f deploy_id.txt ] || { echo "Falta deploy_id.txt: haz primero el paso 5."; exit 1; }
python3 build.py
clasp push --force
clasp update-deployment "$(tr -d ' \r\n' < deploy_id.txt)" -d "Zentrack $(date '+%Y-%m-%d %H:%M')"
echo "Listo. La URL de siempre ya sirve la versión nueva."
