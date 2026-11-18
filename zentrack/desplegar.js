/* Despliega Zentrack: arma los 8 archivos, los sube y actualiza la implementación.
   La URL de la web app no cambia. Doble clic en desplegar.bat */
const {correr, buscarPython, buscarClasp, tieneCodigoServidor, titulo, falla, fs} = require('./_comun');
process.chdir(__dirname);

titulo('Desplegando Zentrack');
if (!fs.existsSync('.clasp.json'))   falla(fs.existsSync('../../Zentrack_despliegue/Zentrack/.clasp.json')
  ? 'Esta es la carpeta de trabajo, no la de despliegue. Usa "Desplegar Zentrack" en el Escritorio (o Zentrack_despliegue > Zentrack > desplegar.bat).'
  : 'Esta carpeta no esta configurada. Primero doble clic en configurar.');
if (!fs.existsSync('deploy_id.txt')) falla('Falta deploy_id.txt. Primero doble clic en configurar.');
if (!tieneCodigoServidor())          falla('No encuentro el archivo del servidor (el que tiene doGet) en la carpeta appsscript. NO despliego, porque se borraria del lado de Google. Corre configurar otra vez.');
const py = buscarPython();     if (!py) falla('No encuentro Python 3.');
const clasp = buscarClasp();   if (!clasp) falla('No encuentro clasp. Corre configurar otra vez.');
const id = fs.readFileSync('deploy_id.txt', 'utf8').replace(/\s/g, '');

console.log('\n  1/3  Armando los 8 archivos...');
if (!correr(py.cmd + ' build.py').ok) falla('build.py fallo. Mandame lo que salio arriba.');
console.log('\n  2/3  Subiendo a Apps Script...');
/* Las cuentas de empresa (Google Workspace) piden volver a iniciar sesion cada cierto tiempo
   (invalid_grant / invalid_rapt). En vez de fallar, se abre el inicio de sesion y se reintenta. */
const subir = () => { const r = correr(clasp + ' push --force', {silencio: true}); if (r.salida) console.log(r.salida); return r; };
let sub = subir();
if (!sub.ok && /invalid_grant|invalid_rapt|reauth|login|credential|unauthenticated/i.test(sub.salida)) {
  console.log('\n  Google pide volver a iniciar sesion. Se abre el navegador:');
  console.log('  entra con la cuenta duena de la hoja de Zentrack y dale Permitir.\n');
  if (!correr(clasp + ' login').ok) falla('El inicio de sesion no termino. Vuelve a abrir desplegar.');
  console.log('\n  Listo, reintento la subida...');
  sub = subir();
}
if (!sub.ok) falla('No se pudo subir. Mandame lo que salio arriba.');
console.log('\n  3/3  Actualizando la implementacion...');
const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');
if (!correr(clasp + ' update-deployment ' + id + ' -d "Zentrack ' + fecha + '"').ok) falla('Se subio el codigo pero no se actualizo la implementacion. Mandame lo que salio arriba.');

titulo('LISTO');
console.log('  Abre la URL de siempre (Ctrl+Shift+R para recargar sin cache).');
console.log('  Revisa que arriba a la derecha diga la version nueva.');
