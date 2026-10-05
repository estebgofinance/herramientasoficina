@echo off
rem Despliega Zentrack: arma los 8 archivos, los sube y actualiza la implementacion.
rem Uso: doble clic, o "desplegar" desde la carpeta zentrack.
cd /d %~dp0
if not exist .clasp.json ( echo Falta .clasp.json: haz primero el paso 4 ^(clasp clone^). & pause & exit /b 1 )
if not exist deploy_id.txt ( echo Falta deploy_id.txt: haz primero el paso 5. & pause & exit /b 1 )
python build.py || ( pause & exit /b 1 )
call clasp push --force || ( pause & exit /b 1 )
set /p DEPID=<deploy_id.txt
call clasp update-deployment %DEPID% -d "Zentrack" || ( pause & exit /b 1 )
echo Listo. La URL de siempre ya sirve la version nueva.
pause
