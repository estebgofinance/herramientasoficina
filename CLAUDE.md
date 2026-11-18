# Zentrack · instrucciones para Claude

Antes de tocar nada, lee `zentrack/TRASPASO.md`. Ahí está cómo funciona la herramienta, por qué está armada así y qué falta.

## Quién es el usuario
- Esteban, de Zentrack (Colombia). No programa. Escríbele en español, directo y corto ("sin verborrea"). Nada de código en el chat salvo que lo pida.
- Usa Windows y despliega con doble clic en "Desplegar Zentrack" del Escritorio (abre `Zentrack_despliegue\Zentrack\desplegar.bat`). Cuando haya que hacer algo en su máquina, dale pasos explícitos, uno por uno.
- Ya le han dañado cosas varias veces. Lo que más le importa es **no perder los datos que ya organizó** (derrames, nombres, clientes, precios, decisiones de Sinosure).

## Reglas que no se rompen
1. `zentrack/master.html` es la única fuente. Nunca edites `zentrack/appsscript/*.html` a mano: después de cambiar master corre `cd zentrack && python3 build.py`, que los regenera y verifica.
   Desde la v2.6, master.html se arma desde `zentrack/capas/` con `cd zentrack/capas && python armar.py` (ver TRASPASO §10): cada versión nueva es un archivo en `capas/v27/`. No edites master.html a mano porque el siguiente `armar.py` lo pisa.
2. El estado guardado (hoja `DB_State` de su Google Sheet) solo **agrega** llaves. Nunca renombres ni borres una (ORD, FACT, PAGOS, CONFIG, CLI, HIST, CUPO, CONCILIA, GPRE, SINO, MIO). Un estado viejo siempre tiene que abrir con la versión nueva.
3. Ninguna carga de archivos puede pisar una decisión manual del usuario.
4. Cada cambio sube la etiqueta de versión (`id="verTag">vX.Y<`) en master.html.
5. Antes de entregar: `cd zentrack/pruebas && npm install && node correr.js`. Todo tiene que salir en verde. Si agregas algo, agrega una prueba.
6. **El repo es público.** No subas los Excel de Andrés, cifras del negocio ni `zentrack/privado/`.
7. Cuando haya versión nueva, cópiala tú mismo a su carpeta de despliegue `Escritorio\Zentrack_despliegue\Zentrack` (antes guarda la actual como `master_vX_respaldo.html`) y corre `build.py` allí. A él solo le dices: doble clic en **"Desplegar Zentrack"** del Escritorio (llama al `desplegar.bat` de `Zentrack_despliegue\Zentrack`; el `desplegar.bat` del repo no está conectado a Google) → revisar que diga la versión nueva arriba.
