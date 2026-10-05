/* Utilidades compartidas por configurar.js y desplegar.js */
const {spawnSync} = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const WIN = process.platform === 'win32';

function correr(cmd, {silencio = false} = {}) {
  const r = spawnSync(cmd, {shell: true, stdio: silencio ? 'pipe' : 'inherit', encoding: 'utf8'});
  return {ok: r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim()};
}
function hay(cmd) { return correr(cmd, {silencio: true}).ok; }

/* Python: en Windows el lanzador "py" funciona aunque Python no esté en el PATH */
function buscarPython() {
  for (const c of (WIN ? ['py -3', 'python', 'python3'] : ['python3', 'python'])) {
    const r = correr(c + ' --version', {silencio: true});
    if (r.ok && /Python 3/.test(r.salida)) return {cmd: c, version: r.salida};
  }
  return null;
}
/* clasp: si npm lo instaló pero esta ventana no ve el PATH nuevo, lo busca donde npm lo deja */
function buscarClasp() {
  if (hay('clasp --version')) return 'clasp';
  if (WIN && process.env.APPDATA) {
    const p = path.join(process.env.APPDATA, 'npm', 'clasp.cmd');
    if (fs.existsSync(p)) return '"' + p + '"';
  }
  return null;
}
function tieneCodigoServidor() {
  return ['Code.js', 'Code.gs'].some(f => fs.existsSync(path.join('appsscript', f)));
}
function abrir(url) {
  correr((WIN ? 'start "" ' : process.platform === 'darwin' ? 'open ' : 'xdg-open ') + '"' + url + '"', {silencio: true});
}
function titulo(t) { console.log('\n' + '='.repeat(60) + '\n  ' + t + '\n' + '='.repeat(60)); }
function falla(msg) { console.log('\n  >> ' + msg + '\n'); process.exit(1); }

module.exports = {correr, hay, buscarPython, buscarClasp, tieneCodigoServidor, abrir, titulo, falla, WIN, fs, path, os};
