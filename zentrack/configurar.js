/* Configura clasp para Zentrack. Se corre UNA sola vez: doble clic en configurar.bat */
const {correr, buscarPython, buscarClasp, tieneCodigoServidor, abrir, titulo, falla, fs, path, os} = require('./_comun');
const readline = require('readline');
const rl = readline.createInterface({input: process.stdin, output: process.stdout});
/* cola de líneas: si pegas rápido o varias cosas seguidas, ninguna se pierde */
const cola = [], esperando = [];
rl.on('line', l => { const w = esperando.shift(); if (w) w(l.trim()); else cola.push(l.trim()); });
rl.on('close', () => { while (esperando.length) esperando.shift()(''); });
const preguntar = q => { process.stdout.write(q); return new Promise(r => cola.length ? r(cola.shift()) : esperando.push(r)); };

(async () => {
  process.chdir(__dirname);

  titulo('Paso 1 de 6 · Node.js');
  console.log('  OK, tienes Node ' + process.version);

  titulo('Paso 2 de 6 · Python');
  const py = buscarPython();
  if (!py) falla('No encuentro Python 3. Instalalo desde https://www.python.org/downloads/ ,\n     marca la casilla "Add python.exe to PATH" en la primera pantalla del instalador,\n     cierra esta ventana y vuelve a abrir configurar.');
  console.log('  OK, ' + py.version + '  (se usa con: ' + py.cmd + ')');

  titulo('Paso 3 de 6 · clasp');
  let clasp = buscarClasp();
  if (!clasp) {
    console.log('  No esta instalado. Instalandolo (tarda un minuto)...\n');
    if (!correr('npm install -g @google/clasp').ok) falla('No se pudo instalar clasp. Copia el error de arriba y mandamelo.');
    clasp = buscarClasp();
    if (!clasp) falla('clasp se instalo pero esta ventana no lo encuentra. Cierrala y vuelve a abrir configurar.');
  }
  console.log('  OK, ' + correr(clasp + ' --version', {silencio: true}).salida);

  titulo('Paso 4 de 6 · Activar la API de Apps Script');
  console.log('  Se va a abrir una pagina de Google en tu navegador.');
  console.log('  Busca "API de Google Apps Script" (o "Google Apps Script API")');
  console.log('  y ponla en ACTIVADA. Luego vuelve a esta ventana.');
  abrir('https://script.google.com/home/usersettings');
  await preguntar('\n  Cuando la hayas activado, presiona Enter... ');

  titulo('Paso 5 de 6 · Iniciar sesion en Google');
  if (fs.existsSync(path.join(os.homedir(), '.clasprc.json'))) {
    console.log('  Ya habias iniciado sesion antes. Sigo.');
  } else {
    console.log('  Se va a abrir el navegador. Entra con la cuenta de Google DUEÑA');
    console.log('  del proyecto de Apps Script y acepta los permisos.\n');
    if (!correr(clasp + ' login').ok) falla('El inicio de sesion no termino. Vuelve a abrir configurar.');
  }

  titulo('Paso 6 de 6 · Conectar con tu proyecto');
  if (fs.existsSync('.clasp.json')) {
    console.log('  Esta carpeta ya estaba conectada a un proyecto (.clasp.json). No la vuelvo a bajar.');
  } else {
    console.log('  Abre tu proyecto de Apps Script en el navegador (el editor de codigo).');
    console.log('  Copia la direccion COMPLETA de la barra de arriba y pegala aqui.');
    console.log('  (Tambien sirve el "ID de la secuencia de comandos" de Configuracion del proyecto.)\n');
    const txt = await preguntar('  Pega aqui y presiona Enter: ');
    const m = txt.match(/\/(?:d|projects)\/([A-Za-z0-9_-]{20,})/) || txt.match(/^([A-Za-z0-9_-]{20,})$/);
    if (!m) falla('Eso no parece la direccion ni el ID del proyecto. Vuelve a abrir configurar y pega la direccion completa.');
    console.log('\n  Bajando tu proyecto real (incluye tu Code.gs)...');
    if (!correr(clasp + ' clone ' + m[1] + ' --rootDir appsscript').ok) falla('No se pudo bajar el proyecto. Revisa que la API este ACTIVADA (paso 4) y que entraste con la cuenta dueña.');
  }
  if (!tieneCodigoServidor()) falla('No llego tu Code.gs a la carpeta appsscript. NO despliegues: mandame una captura de esta ventana.');
  console.log('  OK, tu Code.gs esta en la carpeta.');

  if (fs.existsSync('deploy_id.txt')) {
    console.log('\n  Ya tenias guardada la implementacion: ' + fs.readFileSync('deploy_id.txt', 'utf8').trim());
  } else {
    console.log('\n  Buscando tu implementacion (la URL que ya usas)...');
    const lista = correr(clasp + ' deployments', {silencio: true}).salida;
    const deps = [...lista.matchAll(/(AKfyc[\w-]+)\s+@(\d+)\s*-?\s*(.*)/g)].map(x => ({id: x[1], ver: x[2], desc: x[3]}));
    let elegido = null;
    if (deps.length === 1) {
      console.log('  Encontre una: version ' + deps[0].ver + (deps[0].desc ? ' (' + deps[0].desc + ')' : ''));
      elegido = deps[0].id;
    } else if (deps.length > 1) {
      console.log('  Encontre varias:');
      deps.forEach((d, i) => console.log('    ' + (i + 1) + ') version ' + d.ver + (d.desc ? ' · ' + d.desc : '') + '\n       ' + d.id));
      console.log('  La correcta es la que tiene la URL que abres siempre (Implementar > Administrar implementaciones).');
      const n = parseInt(await preguntar('\n  Escribe el numero y Enter: '), 10);
      if (!(n >= 1 && n <= deps.length)) falla('Numero no valido. Vuelve a abrir configurar.');
      elegido = deps[n - 1].id;
    } else {
      console.log('  No la encontre sola. En Apps Script: Implementar > Administrar implementaciones,');
      console.log('  copia el "ID de implementacion" (empieza por AKfycb).');
      elegido = (await preguntar('\n  Pegalo aqui y Enter: ')).replace(/\s/g, '');
      if (!/^AKfyc/.test(elegido)) falla('Eso no parece un ID de implementacion. Vuelve a abrir configurar.');
    }
    fs.writeFileSync('deploy_id.txt', elegido + '\n');
  }

  titulo('LISTO');
  console.log('  Todo configurado. Desde ahora, para desplegar una version nueva:');
  console.log('  doble clic en  desplegar' + (process.platform === 'win32' ? '.bat' : '.sh'));
  rl.close();
})();
