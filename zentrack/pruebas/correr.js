/* Corre las pruebas contra el master.html actual.
   Uso:  cd zentrack/pruebas && npm install && node correr.js [zmio.js zpc.js ...]
   Necesita en esta carpeta los archivos reales de Andrés (no van al repo):
     DET.xlsx   detailed viejo (corte 25-sep, 110 filas en Summary)
     DET3.xlsx  "Detailed order and operational fund report SEP252026 (3).xlsx"
     OR2.xlsx   ORDER_REPORT de una hoja (corte 25-sep)
   Chromium: usa /opt/pw-browsers/chromium (nube) o la ruta en la variable CHROMIUM. */
const fs=require('fs'),path=require('path'),{execSync,spawnSync}=require('child_process');
process.chdir(__dirname);
const faltan=['DET.xlsx','DET3.xlsx','OR2.xlsx'].filter(f=>!fs.existsSync(f));
if(faltan.length){console.error('Faltan en zentrack/pruebas: '+faltan.join(', ')+' (ver README.md)');process.exit(2);}
fs.copyFileSync('../master.html','ASM4.html');
/* versiones viejas para la prueba de migración de estado (zrepro2) */
fs.copyFileSync('V13_referencia.html','V13.html');
const git=c=>execSync('git show '+c+':zentrack/master.html',{maxBuffer:1<<26});
try{ fs.writeFileSync('V14.html',git('077ba5d')); fs.writeFileSync('V141.html',git('ed59b88')); }catch(e){ console.warn('sin historial git: se salta zrepro2'); }
const SUITE=['z22.js','z22b.js','zsino2.js','zmio.js','zdos.js','zpc.js','zderr.js','zwiz.js','zgem.js','zident.js',
  'zflujo.js','zgid.js','zrepro2.js','zcierre.js','zcero.js','zoscuro.js'];
const lista=process.argv.slice(2).length?process.argv.slice(2):SUITE.filter(f=>f!=='zrepro2.js'||fs.existsSync('V141.html'));
let mal=0;
for(const f of lista){
  const r=spawnSync('node',[f],{encoding:'utf8',timeout:900000});
  const out=(r.stdout||'')+(r.stderr||'');
  const ok=(out.match(/^\s*OK\b/gm)||[]).length, falla=(out.match(/FALLA/g)||[]).length+((/pageerror|Error:/.test(out)&&!ok)?1:0);
  const bien=r.status===0&&falla===0&&ok>0;
  if(!bien) mal++;
  console.log((bien?'✓ ':'✗ ')+f.padEnd(14)+ok+' OK'+(falla?' · '+falla+' FALLA':'')+(r.status?' · salida '+r.status:''));
  if(!bien) console.log(out.split('\n').filter(l=>/FALLA|Error|ERR/.test(l)).slice(0,8).map(l=>'     '+l).join('\n'));
}
console.log(mal?'\n'+mal+' archivo(s) con fallas':'\nTodo en verde');
process.exitCode=mal?1:0;
