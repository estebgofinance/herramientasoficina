/**
 * Code.gs — Backend "base de datos tonta" para Zentrack · Control
 *
 * Reglas (innegociables):
 *  1. GAS SOLO almacena. No calcula nada: no recalcula cupos ni cruza facturas.
 *  2. Cero celda por celda: una sola lectura getValues() y una sola escritura setValues().
 *  3. Persistencia como JSON: el frontend serializa el estado y aquí se guarda como texto.
 *  4. La UI llama estas funciones con google.script.run (asíncrono).
 *
 * Instalación:
 *  - Crea una Hoja de cálculo de Google. Extensiones → Apps Script.
 *  - Pega este Code.gs.
 *  - Crea un archivo HTML llamado "Index" y pega ahí tu zentrack-control.html
 *    (el frontend), más el bloque de persistencia (zentrack-persistence.js).
 *  - Implementar → Nueva implementación → Aplicación web → ejecutar como tú,
 *    acceso "solo yo". Copia la URL /exec y ábrela.
 */

var DB_SHEET = 'DB_State';
var CHUNK    = 45000; // < 50.000 caracteres (límite de una celda de Sheets)

/** Sirve el frontend (tu HTML) como aplicación web. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Zentrack · Control')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/** Devuelve (o crea) la hoja donde vive el estado. */
function getDbSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(DB_SHEET);
  if (!sh) {
    sh = ss.insertSheet(DB_SHEET);
    sh.getRange(1, 1).setNote('Estado de la app en JSON. No editar a mano.');
  }
  return sh;
}

/**
 * Lee el estado guardado y lo devuelve como un solo string JSON.
 * Si nunca se ha guardado nada, devuelve '' (el frontend usará su semilla).
 * UNA sola lectura en bloque. No interpreta el contenido.
 */
function loadState() {
  var sh   = getDbSheet_();
  var last = sh.getLastRow();
  if (last < 1) return '';
  var values = sh.getRange(1, 1, last, 1).getValues(); // <-- única lectura
  var parts  = [];
  for (var i = 0; i < values.length; i++) parts.push(values[i][0]);
  return parts.join('');
}

/**
 * Recibe el estado completo ya serializado (string JSON) y lo guarda.
 * Lo parte en trozos < 50k y escribe TODO de una sola vez.
 * No parsea, no valida, no calcula: solo guarda.
 */
function saveState(payload) {
  payload = (payload == null) ? '' : String(payload);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // evita que dos guardados choquen
  try {
    var sh = getDbSheet_();
    var chunks = [];
    for (var i = 0; i < payload.length; i += CHUNK) {
      chunks.push([payload.substring(i, i + CHUNK)]); // arreglo 2D: una columna
    }
    if (chunks.length === 0) chunks = [['']];
    sh.clearContents();                                       // limpiar en bloque
    sh.getRange(1, 1, chunks.length, 1).setValues(chunks);    // <-- única escritura
    return 'OK:' + payload.length + ':' + chunks.length;
  } finally {
    lock.releaseLock();
  }
}