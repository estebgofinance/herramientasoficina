# Zentrack · traspaso

Este documento es para quien siga el proyecto, sea una persona u otro Claude, y no estuvo en las conversaciones anteriores. Léelo completo antes de cambiar algo. La versión del repo es **v1.6.2**. **Esteban tiene desplegada la v1.6.1**: decidió no desplegar la v1.6.2, que solo corrige la columna de costo en Precios. Esa corrección se va con la próxima versión que despliegue.

## 1. Qué es

Zentrack importa trackers solares de **Singsun** (vía Nexus) y shelters de **Eaglerise**. Las compras se financian con crédito asegurado por **Sinosure**, y los equipos se venden a clientes, sobre todo a **Solenium**, que es un cliente interno. **Andrés** (en China) le manda a Esteban dos Excel en cada corte.

La herramienta lleva tres estados de cuenta:

| Estado de cuenta | Pregunta | De dónde sale |
|---|---|---|
| Nosotros → China | ¿Cuánto se le debe a cada fabricante y cuándo vence? | El detailed (hoja Summary) |
| Nosotros → Sinosure | ¿Cuánto cupo se usa y cuánto queda? | La hoja Sinosure del detailed, más la decisión de Esteban por pedido, más el techo que él pone |
| Clientes → nosotros | ¿Cuánto debe cada cliente? | Los precios, facturas y pagos que registra Esteban |

**Principio:** el archivo manda en los hechos (montos, saldos, estados). Esteban manda en las decisiones (cupo, derrames, nombres, clientes, precios). Ninguna carga puede pisar una decisión suya.

**Lo que más le importa a Esteban:** cargar los archivos y olvidarse. Todo lo que hace a mano tiene que sobrevivir a la siguiente carga, y los números tienen que cuadrar con la hoja de Andrés.

## 2. Plataforma

- Es una web app de **Google Apps Script** pegada a una Google Sheet de Esteban, en su cuenta personal de Google. Cambiar de cuenta de Claude no cambia nada de esto.
- `Code.gs` (en su proyecto se llama `Código.gs`) solo sirve el HTML con `doGet` e `include()`, y guarda y lee el estado. El estado es un JSON partido en trozos de 45k caracteres en la hoja `DB_State`. El servidor no calcula nada.
- Todo el cálculo vive en el navegador, en `master.html` (~410 KB, un solo archivo).
- `build.py` parte master.html en `appsscript/` (Estilos1-2, Motor1-6, Index), con un máximo de 62 KB por archivo, porque el editor de Apps Script trunca pegadas grandes. Después verifica que al rearmarlos salga idéntico. Ver `ARQUITECTURA.md`.
- **Despliegue:** `configurar.bat` se corrió una sola vez en el PC de Esteban: instaló clasp, hizo el login, clonó el proyecto a `appsscript/` y guardó el id de implementación en `deploy_id.txt`. Ahora cada versión es doble clic en `desplegar.bat`, que corre build, `clasp push --force` y `clasp update-deployment <id>`. La URL no cambia. Los scripts son `_comun.js`, `configurar.js` y `desplegar.js`. Ver `DESPLIEGUE.md`.
- En 2026-10 se decidió **no migrar a Python**: la lógica ya está probada y los fallos fueron de lógica, no de plataforma.

## 3. Cómo está escrito el código (léelo antes de editar)

master.html creció por **capas**. Cada versión agrega una sección al final del `<script>` que **reemplaza funciones existentes envolviéndolas**:

```js
const _wizApproveAntesX = wizApprove;
wizApprove = function(){ /* antes */ const r = _wizApproveAntesX.apply(this, arguments); /* después */ return r; };
```

Consecuencias:
- Una función puede tener 3 o 4 envolturas. Busca **todas** las asignaciones (`grep -n "wizApprove=function"`) para saber qué corre y en qué orden. La última definida es la de afuera.
- Un `const` o `let` de nivel superior no se puede redeclarar. Si un bloque viejo tiene uno que hay que cambiar, se edita en su sitio.
- Las secciones empiezan con `/* ==== TÍTULO ==== */`. build.py solo corta en esas fronteras, así que cada sección nueva debe llevar ese encabezado.
- Las funciones con nombre en español son de las capas nuevas. Las que vienen de v0.x (renderHoy, consumoEq, cargaViva…) siguen vivas debajo.

Capas principales, de abajo hacia arriba en el archivo:

| Sección | Qué hace |
|---|---|
| LECTOR PRINCIPAL (~L2876) | `parseReportV2`, `cargarDetailed`: leen el detailed y arman `WIZ.work` (los pedidos en edición) |
| Asistente de carga (~L3330) | `verifyOpen` y los 4 pasos (Recepción, Verificar y editar, Comparar, Resumen), más `wizApprove`, que pasa WIZ.work a ORD/EQ |
| PERSISTENCIA (~L4092) | `serializeState` / `applyState` / `saveToServer` / `loadFromServer` |
| CAPA SINOSURE MANUAL v1.1 (~L5021) | `SINO.ped`, el modo de cupo por pedido |
| PESTAÑA SINOSURE · DERROTERO | La pestaña Sinosure |
| LO QUE YO HICE A MANO v1.4 (~L5595) | `MIO`: derrames, nombres y clientes que sobreviven cargas |
| v1.5 LOS DOS ARCHIVOS JUNTOS | Cruce con el ORDER REPORT |
| SINOSURE · ¿COINCIDE CON LA HOJA? | Aviso e "Igualar a la hoja" |
| PRECIOS Y CLIENTES v1.5 | Grilla de precios, mover pedidos de cliente, repartir un precio total |
| v1.5.1 | MIO en borrador mientras el asistente está abierto |
| v1.6 | Empezar de cero, más respaldo y restauración .json |

## 4. Datos y estado

Variables globales: `ORD` (órdenes madre con `equipos[]`), `EQ` (todos los pedidos aplanados), `FACT`, `PAGOS`, `CLI`, `HIST` (cargas, cada una con `snapPrev`, la foto completa del estado anterior), `CUPO` (techos), `CONFIG`, `CONCILIA` (la última lectura de la hoja Sinosure), `GPRE` (grupos de precio), `SINO`, `MIO`, y `WIZ` (el asistente abierto; no se guarda).

**Las llaves del estado solo se agregan, nunca se renombran ni se borran.**

- **Identidad de un pedido:** `kOf(e)` = fabricante + número normalizado (`_poKey`) + sufijo de variante (`_poVarK`). "Pedido 7.2" en la hoja Sinosure es lo mismo que "PO#7-2" en el Summary. "CFM3-2" y "CFM3-2 INGEV2" son pedidos distintos (gemelos). PO#10 de Singsun y PO#10 de Eaglerise también son distintos.
- **Derrame:** partir un pedido en A, B, C… (`splitRow`). Las partes cumplen `/^(.*\d)([A-P])$/` y se agrupan con `_gruposDerrame`. Las partes llevan `splitDe` (el padre) y `_splitGroup`.
- **`SINO.ped[kOf]` = `{modo, fijo, nota, sug, mio}`.** El modo puede ser:
  - `saldo`: consume lo que falta pagarle al fabricante (columna O).
  - `monto`: consume el pedido completo (M) mientras tenga saldo.
  - `fijo`: consume la cifra fija menos lo girado desde entonces.
  - `fuera`: no consume.
  - `null`: sin clasificar, va a la bandeja.

  `mio=true` quiere decir que Esteban lo confirmó; `mio=false` es una propuesta sacada de la hoja y se ve como **"sin confirmar"**.
  - `_sinoPropuesta(O,M,d)` propone saldo si |d−O|≤2, monto si |d−M|≤2, y si no, fijo d.
  - `sinoMerge()` solo propone para pedidos sin `mio` y sin `modo`. Nunca reclasifica.
  - `sinoRegEf(e)`: una parte de un derrame hereda la decisión del padre, con su parte proporcional.
  - `consumoEq` aplica todo eso.
- **`MIO` = `{split:{kPadre:{partes:[{proj,cliente}]}}, proj:{k:nombre}, cli:{k:cliente}, v}`.** Son las recetas de lo manual.
  - `mioReaplicar()` las vuelve a aplicar sobre cada carga nueva, antes de que Esteban vea nada.
  - `mioRecuperar()` rescata derrames viejos desde `HIST[].snapPrev`.
  - Desde v1.5.1, MIO se toma en borrador al abrir el asistente (`_MIOBORR`) y se descarta si se cierra sin aprobar.

## 5. Flujo de una carga

1. Esteban selecciona **los dos archivos a la vez**: el detailed (tiene la hoja `Summary`) y el ORDER REPORT (tiene la hoja `ORDER REPORT`). El input `#reportFile` es múltiple y reconoce cada archivo por sus hojas.
2. Se lee el detailed, luego se aplica el ORDER REPORT encima (`aplicarOrderReport`), y luego MIO.
   - Del **ORDER REPORT** salen cliente, proyecto, cantidad, estado, fechas, BL, telex y fecha límite de pago.
   - Del **detailed** salen la plata con China y el cupo Sinosure.
   - Si los dos difieren, se lista en el paso 1 (lista para mandarle a Andrés).
3. **Paso 2:** derramar, nombrar, asignar cliente.
4. **Paso 3 (Comparar):** solo lo que cambió frente a lo ya cargado. Cargar dos veces el mismo archivo tiene que dar Comparar vacío.
5. **Paso 4 (Resumen y aprobar):** al aprobar, `wizApprove` pasa todo a ORD, registra MIO, corre `sinoMerge` y guarda.

Si se sube solo el detailed, cliente, estado y fechas salen del detailed y la lectura cambia. El paso 1 lo avisa en rojo.

## 6. Reglas de negocio que salieron de casos reales

- **Fila madre:** un bloque del Summary que repite su número y suma a sus hermanos no es un pedido. Ejemplo: PO#7-5 = 7-5…7-9.
- **Renglón repetido en la hoja Sinosure:** si apunta a una celda ya contada y hay un gemelo sin renglón, se le atribuye al gemelo (`_gemelosDeDup`). Caso: la celda E12 es de CFM 3-2 INGEV2.
- **Pedido cerrado:** sin saldo y sin renglón en la hoja, no se carga.
- **El techo del cupo** lo pone Esteban a mano en Ajustes o en Sinosure. Ninguna carga lo cambia.
- **La cifra de Sinosure que vale es la de la hoja Sinosure del detailed.** Si una decisión vieja la contradice, sale un aviso con "Igualar a la hoja".
- **Costo con China = fabricante + otros componentes** (`cupoMonto + otrosMonto`). No uses la columna "Total amount" del detailed (`totalChina`): en pedidos pagados vía Nexus (PO12 Solaris) Andrés pone ahí el precio de venta, y en 12-1/12-2 repite el total del par.
- **Solenium es cliente interno** (`CLI[x].interno`). Su estado de cuenta es un espejo del order report a precio de venta.

## 7. Pendiente

**Bug conocido, sin arreglar.** En el paso 4 del asistente, el "cupo Sinosure comprometido" (`cupoWork`, ~L3596) busca cada pedido por nombre exacto en la hoja. Las partes de un derrame (11-1A…) no están en la hoja y suman 0. Por eso ese resumen sale más bajo que el tablero, y la diferencia es exactamente lo que el tablero muestra como "sin confirmar". **El tablero es el correcto.** La solución es que `cupoWork` use la misma herencia que `sinoRegEf`/`consumoEq`. A Esteban ya se le explicó y se le ofreció arreglarlo.

Funcionalidad que falta:
1. Link de la factura en cada grupo de precio.
2. Consolidar varios grupos en uno nuevo con su factura.
3. Volver los tres estados de cuenta vistas de primer nivel.

Decisiones que Esteban todavía no ha tomado:
- ¿Sinosure cubre solo al fabricante o el costo total a China (que incluye Jingwei, Wenzhong y Restar)?
- ¿Se le piden a Andrés dos columnas nuevas en el ORDER REPORT: "Cupo Sinosure" y "Entra a Sinosure Sí/No"?

**Diseño pendiente: pago directo del cliente al fabricante.** En PO12 Solaris (Eaglerise, cliente Ingenio Verde) el detailed dice "Payment via: Nexus", con "Total amount" 111,701 y "Manufacturer amount" 72,240. Esteban explicó que el 111,701 es lo que **Ingenio Verde le tiene que pagar a Eaglerise**, o sea su precio de venta. Es el único shelter con "Payment via" Nexus; los demás dicen Zentrack, y en los trackers Nexus es lo normal. Hoy la herramienta lo trata como deuda propia: suma a "Vencido con China" y consume cupo.

Propuesta hecha a Esteban, **sin construir**: una marca por pedido, "lo paga el cliente directo al fabricante", que se pone una vez y persiste en una llave nueva del estado. Con la marca:
- El saldo sale de lo que debe Zentrack y se muestra como deuda del cliente con el fabricante.
- El estado de cuenta del cliente muestra ese pago con su vencimiento.
- Sinosure sigue la hoja de Andrés, salvo que Esteban lo ponga en "fuera".

Antes de construir hay que preguntarle:
1. ¿Ingenio Verde le paga los 111,701 completos a Eaglerise y Eaglerise le devuelve la diferencia a Zentrack, o le paga 72,240 a Eaglerise y 39,461 a Zentrack?
2. ¿Ese pedido debe consumir cupo Sinosure?
3. ¿Es un caso único o va a repetirse (por ejemplo con PO14 Siliana)?

## 8. Errores que ya costaron caro (no los repitas)

- **Usar variables CSS que no existen.** `--card`, `--line` y `--hover` no estaban definidas, así que los menús salían transparentes y oscuros. Los tokens reales son los de `:root` al comienzo del `<style>`. La app es **solo clara**: no agregues reglas de modo oscuro.
- **Guardar en MIO al instante**, durante un asistente que después se cancela.
- **Ids de derrame** generados con ms + azar, que chocaban. Ahora se usa `_gidNuevo()` con contador.
- **Insertar CSS con `rindex('</style>')`:** caía dentro de una plantilla JS.
- **Pruebas con esperas fijas.** Usa `waitForFunction` (WIZ.loaded, el modal cerrado).
- **Repintar la pestaña en cada tecla:** el usuario pierde el foco del campo.
- **Proponer modos de cupo sobre pedidos ya clasificados.** Cambiaba decisiones del usuario.
- **Mostrar números sin verificar con los archivos reales.** Esteban compara contra su cálculo de cabeza y se frustra con razón.

## 9. Pruebas

`zentrack/pruebas/` tiene 17 suites de Chromium (Playwright) que cargan los Excel reales, hacen clic como el usuario y verifican números y persistencia. Son 188 verificaciones.

```
cd zentrack/pruebas
npm install
node correr.js              # todas
node correr.js zmio.js      # una
```

- Los Excel **no están en el repo** porque es público. Esteban tiene que adjuntarlos y se guardan en `zentrack/pruebas/` con estos nombres:
  - `DET.xlsx`: detailed viejo del corte 25-sep (110 filas en Summary).
  - `DET3.xlsx`: "Detailed order and operational fund report SEP252026 (3).xlsx".
  - `OR2.xlsx`: ORDER REPORT de una hoja.
- Chromium: `/opt/pw-browsers/chromium` en la nube de Claude Code, o la ruta en la variable `CHROMIUM`.
- `correr.js` copia `../master.html` a `ASM4.html` y saca las versiones viejas (V14/V141) del historial de git para la prueba de migración (`zrepro2`).

Las cifras de referencia para verificar están en `zentrack/privado/CIFRAS.md`. Esa carpeta no va al repo; Esteban la tiene.

## 10. Git

Se trabaja en la rama `claude/order-report-detailed-parsing-krkps6`, que hoy es también la rama por defecto del repo `estebgofinance/herramientasoficina`. Cada versión es un commit.
