# Desplegar Zentrack sin pegar archivos

Se configura una sola vez con `configurar.bat`. Desde ahí, cada versión nueva es
doble clic en `desplegar.bat`, y la URL de la herramienta no cambia.

## A. Configurar (una sola vez, ~10 minutos)

### 1. Descomprimir
Clic derecho sobre `Zentrack_despliegue.zip` → **Extraer todo…** → **Extraer**.
Queda una carpeta `Zentrack`. Muévela a *Documentos* si quieres.
No abras los archivos desde dentro del ZIP sin extraer: no funcionan ahí.

### 2. Abrir el instalador
Entra a la carpeta `Zentrack` y haz doble clic en **configurar.bat**.

Si Windows muestra *"Windows protegió su PC"*: clic en **Más información** →
**Ejecutar de todas formas**. Se abre una ventana negra con 6 pasos.

### 3. Lo que hace cada paso

| Paso | Qué pasa | Qué haces tú |
| --- | --- | --- |
| 1 · Node.js | Revisa que esté instalado | Nada |
| 2 · Python | Lo busca, esté o no en el PATH | Nada. Si dice que no lo encuentra, mira el recuadro de abajo |
| 3 · clasp | Si no está, lo instala solo (~1 min) | Esperar |
| 4 · Activar la API | Abre una página de Google | Pon **API de Google Apps Script** en *Activada*, vuelve a la ventana negra y presiona **Enter** |
| 5 · Iniciar sesión | Abre el navegador | Entra con la cuenta dueña del proyecto y clic en **Permitir**. Cuando diga *"Logged in"*, vuelve a la ventana negra |
| 6 · Conectar | Te pide la dirección del proyecto | Ver abajo |

**Paso 6 en detalle:** abre tu Google Sheet → **Extensiones → Apps Script**. Se abre
el editor de código. Haz clic en la barra de direcciones del navegador, **Ctrl+C**
para copiar la dirección completa. Vuelve a la ventana negra, **clic derecho** para
pegar (en esa ventana Ctrl+V a veces no funciona) y **Enter**.

Luego busca solo tu implementación. Si encuentra varias, te muestra una lista con su
número de versión: elige la que coincide con la que ves en Apps Script →
**Implementar → Administrar implementaciones**.

Cuando diga **LISTO**, presiona cualquier tecla para cerrar.

> **Si en el paso 2 dice que no encuentra Python:** entra a python.org → Downloads,
> descarga e instala. En la **primera pantalla del instalador**, abajo, marca la
> casilla **"Add python.exe to PATH"** antes de darle *Install Now*. Cierra la
> ventana negra y vuelve a abrir `configurar.bat`.

## B. Desplegar (cada versión nueva)

1. Reemplaza `master.html` en la carpeta por el nuevo que te mande.
2. Doble clic en **desplegar.bat**.
3. Abre la URL de siempre con **Ctrl+Shift+R** y carga el detailed. La primera
   pantalla debe decir trackers **1,413,028** y shelters **1,465,652**.

`desplegar.bat` se niega a subir nada si no encuentra tu `Code.gs` en la carpeta
`appsscript`, porque subir sin él lo borraría del lado de Google.

## Mac
Lo mismo con `configurar.sh` y `desplegar.sh`, pero desde la Terminal: escribe `cd `,
arrastra la carpeta `Zentrack` a la ventana, Enter, y luego `bash configurar.sh`
(para desplegar: `bash desplegar.sh`).

## Si algo falla
Copia todo lo que salió en la ventana negra (clic derecho → *Seleccionar todo*,
Enter para copiar) y mándamelo tal cual.
