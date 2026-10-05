# Desplegar Zentrack con clasp

Una vez configurado, desplegar es un solo comando: `desplegar.bat` (Windows) o
`./desplegar.sh` (Mac). Arma los 8 archivos, los sube a Apps Script y actualiza la
implementación existente, así que **la URL no cambia**.

## Configuración (una sola vez)

1. **Node.js** (versión LTS) desde nodejs.org. Comprueba con `node -v`.
2. **Python 3** desde python.org. En Windows marca *Add python.exe to PATH*.
3. **clasp**: `npm install -g @google/clasp`. Comprueba con `clasp -v` (3.x).
4. **Activa la API**: entra a https://script.google.com/home/usersettings y pon
   *API de Google Apps Script* en **Activada**. Sin esto, `push` falla con
   "User has not enabled the Apps Script API".
5. **Inicia sesión**: `clasp login`, con la cuenta de Google dueña del proyecto.
6. **Baja el proyecto real** desde la carpeta `zentrack`:

   ```
   clasp clone <ID_DEL_SCRIPT> --rootDir appsscript
   ```

   El ID está en el editor de Apps Script → ⚙ *Configuración del proyecto* →
   *ID de la secuencia de comandos*. Esto crea `.clasp.json` y baja a `appsscript/`
   tu `Code.gs` (aparece como `Code.js`, es normal) y `appsscript.json`.
7. **Guarda el ID de la implementación** en un archivo `deploy_id.txt` dentro de
   `zentrack`. Está en *Implementar → Administrar implementaciones → ID de
   implementación* (empieza por `AKfycb`). También sale con `clasp deployments`.

## Antes del primer despliegue: un control

```
clasp status
```

Tiene que listar **10 archivos**: `Code.js`, `appsscript.json` y los 8 HTML.
**Si `Code.js` no aparece, no sigas**: `clasp push` reemplaza el proyecto entero
y borraría tu Code.gs del lado de Google.

## Cada vez que haya versión nueva

```
desplegar.bat        (Windows)
./desplegar.sh       (Mac)
```

Abre la URL de siempre y verifica en la primera pantalla del asistente:
trackers 1,413,028 y shelters 1,465,652.
