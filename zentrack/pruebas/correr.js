/* Corre las pruebas contra el master.html actual.
   Uso:  cd zentrack/pruebas && npm install && node correr.js [zmio.js zpc.js ...]
   Necesita en esta carpeta los archivos reales de Andrés (no van al repo):
     DET.xlsx   detailed viejo (corte 25-sep, 110 filas en Summary)
     DET3.xlsx  "Detailed order and operational fund report SEP252026 (3).xlsx"
     OR2.xlsx   ORDER_REPORT de una hoja (corte 25-sep)
   Chromium: usa /opt/pw-browsers/chromium (nube) o la ruta en la variable CHROMIUM. */
const fs=require('fs'),path=require('path'),{execSync,spawnSync}=require('child_process');
process.chdir(__dirname);
const faltan=['DET.xlsx','DET3.xlsx','OR2.xlsx','MAG.xlsx','MAG.pdf','TIBA.xlsx','RESP.json','V113.html','FINK.pdf','DATOS.json','DET23.xlsx','OR23.xlsx'].filter(f=>!fs.existsSync(f));
if(faltan.length){console.error('Faltan en zentrack/pruebas: '+faltan.join(', ')+' (ver README.md)');process.exit(2);}
{ /* los valores reales (colchón, gastos fijos) viven en privado/defaults.js, fuera del repo: si está, la prueba los trae */
  let h=fs.readFileSync('../master.html','utf8'); const D='../privado/defaults.js';
  if(fs.existsSync(D)) h=h.replace('<head>','<head><script>'+fs.readFileSync(D,'utf8')+'</script>');
  fs.writeFileSync('ASM4.html',h); }
/* versiones viejas para la prueba de migración de estado (zrepro2) */
fs.copyFileSync('V13_referencia.html','V13.html');
const git=c=>execSync('git show '+c+':zentrack/master.html',{maxBuffer:1<<26});
try{ fs.writeFileSync('V14.html',git('077ba5d')); fs.writeFileSync('V141.html',git('ed59b88')); }catch(e){ console.warn('sin historial git: se salta zrepro2'); }
const SUITE=['z22.js','z22b.js','zsino2.js','zmio.js','zdos.js','zpc.js','zderr.js','zwiz.js','zgem.js','zident.js',
  'zflujo.js','zgid.js','zrepro2.js','zcierre.js','zcero.js','zoscuro.js','zcosto.js','zcobro.js','zlugar.js','zcostomano.js','zec.js','zmaestro.js','zsino3.js','zcaja.js','zcargos.js','z14.js','z15.js','z16.js','z17.js','z171.js','z1172.js','z20.js','z23.js','z24.js','z26.js','z261.js','z27.js','z271.js','z28.js','z281.js','z29.js','z291.js','z293.js','z210.js','z211.js','z212.js','z213.js','z2131.js','z2132.js'];
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
