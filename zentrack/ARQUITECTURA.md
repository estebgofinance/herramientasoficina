# Zentrack · Control — cómo está armado

## Un solo archivo manda

`master.html` es la fuente de verdad. Ahí vive toda la herramienta y se
puede abrir con doble clic para probar sin desplegar nada.

Apps Script no deja pegar 320 KB de un golpe sin que la pegada se corte, y
si el corte cae dentro del `<style>` la página sale **en blanco** (sin
error, sin nada). Por eso se parte.

## El corte es automático

```
python3 build.py
```

Lee `master.html`, lo parte en los archivos de `appsscript/` y **verifica
que al rearmarlos vuelva a salir exactamente `master.html`**. Si no
coincide, falla y no entrega nada.

Reglas del corte:
- Ningún archivo pasa de 62 KB.
- El JS se corta solo en fronteras de sección (`/* ==== TÍTULO ==== */`),
  nunca a mitad de una función.
- El CSS se corta solo entre reglas, nunca dentro de una.
- Un `<style>` escrito dentro de una plantilla de JavaScript no se
  confunde con un bloque real: el escaneo es secuencial.

## Orden para pegar en Apps Script

Primero los motores y los estilos; **`Index` de último**, porque es el que
los llama con `include()` y si alguno falta, la página sale en blanco.

Después: Implementar → Administrar implementaciones → ✏️ → Nueva versión.

## Dónde viven tus datos

En la hoja `DB_State` de tu Google Sheet, **no en el HTML**. Reemplazar
archivos HTML no los toca.

El estado guardado es un JSON con estas llaves:

| Llave | Qué guarda |
|---|---|
| `ORD` | las órdenes madre y, dentro, cada pedido |
| `FACT` | las facturas leídas de los PDF |
| `PAGOS` | giros a China y cobros a clientes |
| `CLI` | clientes, su plazo y si son internos |
| `CUPO` | los techos de cupo por fabricante |
| `CONCILIA` | la hoja Sinosure leída del detailed y su mapeo |
| `GPRE` | los grupos de precio |
| `CONFIG`, `HIST` | reglas y el historial de cargues |

Al cambiar de versión **solo se agregan llaves, nunca se quitan ni se
renombran**: por eso lo ya cargado sobrevive.

## Qué hace cada pestaña

- **Tablero** — los cuatro números de control y los treemaps de cupo.
- **Pedidos** — cada orden se abre y muestra sus pedidos con el precio
  editable en la fila, el selector de cupo Sinosure, y casillas para
  escoger varios y ponerles un precio juntos.
- **Clientes** — el estado de cuenta y la previsualización en PDF/Excel.
- **Pagos** — registrar lo que entra y lo que se gira.
- **Precios** — grupos: varios pedidos bajo un precio total que se
  reparte. Es lo que manda sobre el precio individual.
- **Sinosure** — la hoja de Andrés tal como se ve en el detailed, con cada
  renglón abatible para ver los pedidos que lo componen; más el simulador
  de "¿me cabe?" y cuándo se libera cupo.
- **Ajustes** — techos de cupo, regla de conteo, clientes y plazos.

## Pruebas

En `scratchpad/t/` hay siete suites de Chromium que corren sobre el
ensamblado con el detailed real. La más importante es `zfinal.js`: mete un
estado guardado por la versión anterior y comprueba que no se pierda nada.
