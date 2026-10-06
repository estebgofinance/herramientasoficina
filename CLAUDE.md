# Zentrack · instrucciones para Claude

Antes de tocar nada, lee `zentrack/TRASPASO.md`. Ahí está cómo funciona la herramienta, por qué está armada así y qué falta.

## Quién es el usuario
- Esteban, de Zentrack (Colombia). No programa. Escríbele en español, directo y corto ("sin verborrea"). Nada de código en el chat salvo que lo pida.
- Usa Windows y despliega con doble clic en `zentrack\desplegar.bat`. Cuando haya que hacer algo en su máquina, dale pasos explícitos, uno por uno.
- Ya le han dañado cosas varias veces. Lo que más le importa es **no perder los datos que ya organizó** (derrames, nombres, clientes, precios, decisiones de Sinosure).

## Reglas que no se rompen
1. `zentrack/master.html` es la única fuente. Nunca edites `zentrack/appsscript/*.html` a mano: después de cambiar master corre `cd zentrack && python3 build.py`, que los regenera y verifica.
2. El estado guardado (hoja `DB_State` de su Google Sheet) solo **agrega** llaves. Nunca renombres ni borres una (ORD, FACT, PAGOS, CONFIG, CLI, HIST, CUPO, CONCILIA, GPRE, SINO, MIO). Un estado viejo siempre tiene que abrir con la versión nueva.
3. Ninguna carga de archivos puede pisar una decisión manual del usuario.
4. Cada cambio sube la etiqueta de versión (`id="verTag">vX.Y<`) en master.html.
5. Antes de entregar: `cd zentrack/pruebas && npm install && node correr.js`. Todo tiene que salir en verde. Si agregas algo, agrega una prueba.
6. **El repo es público.** No subas los Excel de Andrés, cifras del negocio ni `zentrack/privado/`.
7. Entrega `zentrack/master.html` al usuario con SendUserFile cuando haya versión nueva y dile: copiarlo sobre `zentrack\master.html` → `desplegar.bat` → revisar que diga la versión nueva arriba.
