/* Lo que hago a mano tiene que sobrevivir la siguiente carga. */
const {chromium}=require('playwright-core');const fs=require('fs');
let ok=0,mal=0;const T=(c,m)=>{if(c){ok++;console.log('  OK   '+m);}else{mal++;console.log('  FALLA '+m);}};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1000}});
  const errs=[];p.on('pageerror',e=>errs.push(''+e));p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);

  console.log('\n— PRIMERA CARGA: derramo el 16 y le pongo nombres a mano —');
  await p.evaluate(()=>{
    const w=WIZ.work.find(x=>x.derrame==='16'); splitRow(w._i);
    const nom=['Molino 1','Molino 2','Molino 3','Urumita','Heliconias 1','Heliconias 2','Heliconias 3','Villanueva'];
    WIZ.work.filter(x=>/^16[A-H]$/.test(x.derrame)).forEach((x,k)=>{ setW(x._i,'proj',nom[k]); setW(x._i,'cliente','Solenium'); });
  });
  await p.waitForTimeout(500);
  const c1=await p.evaluate(()=>({
    partes:WIZ.work.filter(x=>/^16[A-H]$/.test(x.derrame)).map(x=>x.derrame+'='+x.proj),
    split:Object.keys(MIO.split).length, proj:Object.keys(MIO.proj).length}));
  T(c1.partes.length===8,'quedaron los 8 derrames del PO#16');
  T(c1.split===1&&c1.proj>=8,'y quedaron registrados en MIO (split y nombres)');
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(4200);
  const eq1=await p.evaluate(()=>EQ.filter(e=>/^16[A-H]$/.test(e.derrame)).map(e=>e.derrame+'='+e.proj));
  T(eq1.length===8,'aprobado: los 8 viven en la herramienta');
  T(eq1[0]==='16A=Molino 1','con el nombre que escribí: '+eq1[0]);

  console.log('\n— SEGUNDA CARGA del MISMO archivo: no debo rehacer nada —');
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(2200);
  const c2=await p.evaluate(()=>({
    partes:WIZ.work.filter(x=>/^16[A-H]$/.test(x.derrame)).map(x=>x.derrame+'='+x.proj),
    hay16pelado:WIZ.work.some(x=>x.derrame==='16'),
    cambios:WIZ.work.filter(w=>_cambiosW(w).length).map(w=>w.derrame),
    idos:(typeof _wizDesaparecidos==='function')?_wizDesaparecidos().length:-1}));
  T(c2.partes.length===8,'el derrame se volvió a aplicar SOLO: '+c2.partes.length+' partes');
  T(!c2.hay16pelado,'y el PO#16 pelado ya no está (se partió otra vez)');
  T(c2.partes[3]==='16D=Urumita','los nombres volvieron: '+c2.partes[3]);
  T(c2.cambios.length===0,'el paso Comparar sale VACÍO: no hay nada que revisar'+(c2.cambios.length?' ('+c2.cambios.join(',')+')':''));
  T(c2.idos===0,'y ningún pedido figura como desaparecido');

  console.log('\n— sobrevive guardar y volver a abrir —');
  const json=await p.evaluate(()=>{wizGo(4);wizApprove();return null;});
  await p.waitForTimeout(4200);
  const st=await p.evaluate(()=>serializeState());
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  await p.evaluate(j=>applyState(JSON.parse(j)),st); await p.waitForTimeout(600);
  const c3=await p.evaluate(()=>({split:Object.keys(MIO.split).length,
    partes:EQ.filter(e=>/^16[A-H]$/.test(e.derrame)).length}));
  T(c3.split===1&&c3.partes===8,'tras cerrar y abrir, el derrame y su receta siguen ahí');

  console.log('\n— deshacer un derrame también se recuerda —');
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(2200);
  await p.evaluate(()=>{const w=WIZ.work.find(x=>x._splitGroup); if(w) unSplit(w._splitGroup);});
  await p.waitForTimeout(400);
  T((await p.evaluate(()=>Object.keys(MIO.split).length))===0,'al unir las partes, la receta se borra');
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(2200);
  T((await p.evaluate(()=>WIZ.work.filter(x=>/^16[A-H]$/.test(x.derrame)).length))===0,'y la siguiente carga ya no lo derrama');

  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`);
  await b.close(); process.exit(mal?1:0);
})();
