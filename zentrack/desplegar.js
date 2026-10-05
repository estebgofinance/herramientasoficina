/* Despliega Zentrack: arma los 8 archivos, los sube y actualiza la implementación.
   La URL de la web app no cambia. Doble clic en desplegar.bat */
const {correr, buscarPython, buscarClasp, tieneCodigoServidor, titulo, falla, fs} = require('./_comun');
process.chdir(__dirname);

titulo('Desplegando Zentrack');
if (!fs.existsSync('.clasp.json'))   falla('Esta carpeta no esta configurada. Primero doble clic en configurar.');
if (!fs.existsSync('deploy_id.txt')) falla('Falta deploy_id.txt. Primero doble clic en configurar.');
if (!tieneCodigoServidor())          falla('No encuentro el archivo del servidor (el que tiene doGet) en la carpeta appsscript. NO despliego, porque se borraria del lado de Google. Corre configurar otra vez.');
const py = buscarPython();     if (!py) falla('No encuentro Python 3.');
const clasp = buscarClasp();   if (!clasp) falla('No encuentro clasp. Corre configurar otra vez.');
const id = fs.readFileSync('deploy_id.txt', 'utf8').replace(/\s/g, '');

console.log('\n  1/3  Armando los 8 archivos...');
if (!correr(py.cmd + ' build.py').ok) falla('build.py fallo. Mandame lo que salio arriba.');
console.log('\n  2/3  Subiendo a Apps Script...');
if (!correr(clasp + ' push --force').ok) falla('No se pudo subir. Mandame lo que salio arriba.');
console.log('\n  3/3  Actualizando la implementacion...');
const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');
if (!correr(clasp + ' update-deployment ' + id + ' -d "Zentrack ' + fecha + '"').ok) falla('Se subio el codigo pero no se actualizo la implementacion. Mandame lo que salio arriba.');

titulo('LISTO');
console.log('  Abre la URL de siempre (Ctrl+Shift+R para recargar sin cache).');
console.log('  Carga el detailed: la primera pantalla debe decir');
console.log('  trackers 1,413,028 y shelters 1,465,652.');
