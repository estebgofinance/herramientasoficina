let p2;const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const abrir=async()=>{const p=await b.newPage({viewport:{width:1500,height:1000}});p.on('dialog',d=>d.accept());p.on('pageerror',e=>console.log('ERR',''+e));
    await p.route('**/*',r=>{const u=r.request().url();
      if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
      if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
    await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450); return p;};
  const cargar=async(p,arch)=>{await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',arch);
    await p.waitForFunction(()=>WIZ&&WIZ.loaded&&WIZ.work&&WIZ.work.length>0,null,{timeout:60000}); await p.waitForTimeout(400);};
  const foto=p=>p.evaluate(()=>WIZ.work.map(w=>[w.derrame,w.cliente,w.proj,w.st,w.qty,Math.round(+w.cupoSaldo||0)].join('|')).sort());
  const comparar=(a,b)=>{const sa=new Set(a),sb=new Set(b);return {soloA:a.filter(x=>!sb.has(x)),soloB:b.filter(x=>!sa.has(x))};};

  let p=await abrir(); await cargar(p,['DET3.xlsx','OR2.xlsx']); const limpia=await foto(p); await p.close();
  console.log('carga limpia:',limpia.length,'filas');

  // A) cargo, cierro sin tocar nada, vuelvo a cargar
  p=await abrir(); await cargar(p,['DET3.xlsx','OR2.xlsx']); await p.evaluate(()=>closeRecon());
  await cargar(p,['DET3.xlsx','OR2.xlsx']); let c=comparar(limpia,await foto(p)); await p.close();
  const ok=(n,c)=>{console.log((c?'OK  ':'FALLA ')+n); if(!c) process.exitCode=1;};
  ok('A) cerrar sin tocar nada → 0 diferencias',c.soloA.length+c.soloB.length===0);

  // B) cargo, en el paso 2 derramo y renombro, cierro SIN aprobar, vuelvo a cargar
  p=await abrir(); await cargar(p,['DET3.xlsx','OR2.xlsx']);
  await p.evaluate(()=>{wizGo(2);const w=WIZ.work.find(x=>x.derrame==='13');splitRow(w._i);
    const y=WIZ.work.find(x=>x.derrame==='9-2');setW(y._i,'proj','NOMBRE DE PRUEBA');});
  await p.evaluate(()=>closeRecon());
  await cargar(p,['DET3.xlsx','OR2.xlsx']); c=comparar(limpia,await foto(p)); await p.close();
  ok('B) derramar/renombrar y cerrar sin aprobar → 0 diferencias',c.soloA.length+c.soloB.length===0);
  c.soloB.slice(0,6).forEach(x=>console.log('     ahora aparece:',x)); c.soloA.slice(0,3).forEach(x=>console.log('     ya no está  :',x));

  // C) la segunda vez seleccionas solo el detailed
  p=await abrir(); await cargar(p,['DET3.xlsx','OR2.xlsx']); await p.evaluate(()=>closeRecon());
  await cargar(p,['DET3.xlsx']); c=comparar(limpia,await foto(p)); await p.close();
  console.log('C) solo el detailed → diferencias (esperado, con aviso):',c.soloA.length+c.soloB.length);
  // D) derramar, renombrar y APROBAR → la siguiente carga sí lo devuelve
  p=await abrir(); await cargar(p,['DET3.xlsx','OR2.xlsx']);
  await p.evaluate(()=>{wizGo(2);const w=WIZ.work.find(x=>x.derrame==='13');splitRow(w._i);
    const y=WIZ.work.find(x=>x.derrame==='9-2');setW(y._i,'proj','NOMBRE DE PRUEBA');wizApprove();});
  await cargar(p,['DET3.xlsx','OR2.xlsx']);
  const d=await p.evaluate(()=>({parts:WIZ.work.filter(x=>/^13[A-P]$/.test(x.derrame)).length,nom:(WIZ.work.find(x=>x.derrame==='9-2')||{}).proj}));
  ok('D) aprobado: 13 vuelve partido ('+d.parts+') y 9-2 con su nombre',d.parts>=2&&d.nom==='NOMBRE DE PRUEBA');
  // E) con lo aprobado, abrir otra carga, deshacer el derrame y cancelar → sigue partido
  await p.evaluate(()=>{const w=WIZ.work.find(x=>x.derrame==='13A');unSplit(w._splitGroup);closeRecon();});
  await cargar(p,['DET3.xlsx','OR2.xlsx']);
  const e=await p.evaluate(()=>WIZ.work.filter(x=>/^13[A-P]$/.test(x.derrame)).length);
  ok('E) deshacer y cancelar no borra lo aprobado ('+e+' partes)',e>=2);
  const aviso=await p.evaluate(()=>{closeRecon();return true;});
  p2=await abrir(); await cargar(p2,['DET3.xlsx']);
  ok('F) solo detailed → aviso visible',await p2.evaluate(()=>document.getElementById('reconBody').textContent.includes('Sin el ORDER REPORT')));
  await p2.close(); await p.close();
  await b.close();
})();
