/* Los dos archivos reales del usuario, seleccionados juntos. */
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
  const leido=async()=>{await p.waitForFunction(()=>WIZ&&WIZ.loaded&&WIZ.work&&WIZ.work.length>0,null,{timeout:60000});await p.waitForTimeout(400);};
  const aprobar=async()=>{await p.evaluate(()=>{wizGo(4);wizApprove();});await p.waitForFunction(()=>!document.getElementById('reconScrim').classList.contains('on'),null,{timeout:60000});await p.waitForTimeout(500);};

  console.log('\n— solo el ORDER REPORT: pide el detailed —');
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['OR2.xlsx']); await p.waitForTimeout(1500);
  T(/Falta el/.test(await p.evaluate(()=>document.getElementById('reconBody').innerText)),'avisa que falta el detailed');

  console.log('\n— los dos juntos —');
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['OR2.xlsx','DET3.xlsx']); await leido();
  const r=await p.evaluate(()=>({n:WIZ.work.length, or:WIZ.orNombre, difs:(WIZ.orDifs||[]).map(d=>d.tipo+':'+d.der),
    cli:[...new Set(WIZ.work.map(w=>w.cliente))], e93:(WIZ.work.find(w=>w.derrame==='9-3')||{}).st,
    p12:(WIZ.work.find(w=>w.mfg==='Eaglerise'&&w.derrame==='12')||{}),
    txt:document.getElementById('reconBody').innerText}));
  console.log('   pedidos',r.n,'· clientes',JSON.stringify(r.cli));
  console.log('   diferencias:',r.difs.length,JSON.stringify(r.difs));
  T(!!r.or,'se reconocieron los dos archivos');
  T(r.cli.includes('Solenium')&&r.cli.includes('Ingenio Verde'),'el cliente viene del ORDER REPORT');
  T(r.e93==='prod','el estado viene del ORDER REPORT (9-3: '+r.e93+')');
  T(Math.round(+r.p12.cupoSaldo)===57792,'la plata viene del detailed (PO 12: '+Math.round(+r.p12.cupoSaldo)+', no 97,253)');
  T(r.difs.includes('saldo:12'),'y la diferencia del PO 12 se avisa');
  T(r.difs.includes('sinMontos:12-1')&&r.difs.includes('sinMontos:12-2'),'avisa que 12-1 y 12-2 no tienen montos en el ORDER REPORT');
  T(!r.difs.some(d=>/^cantidad:12-/.test(d)),'y de una fila vacia no toma la cantidad');
  T(/diferencia\(s\) entre los dos archivos/.test(r.txt),'la lista de diferencias sale en pantalla');

  await aprobar();
  const c=await p.evaluate(()=>({S:Math.round(cargaViva('Singsun')),E:Math.round(cargaViva('Eaglerise')),pend:sinoPendientes().map(e=>e.derrame)}));
  console.log('   cupo',JSON.stringify(c));
  T(c.S===1413028||Math.abs(c.S-1413028)<=2,'Singsun = hoja Sinosure: '+c.S);
  T(c.E===1465652,'Eaglerise = hoja Sinosure: '+c.E);

  console.log('\n— recargar los mismos dos: nada que revisar —');
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['DET3.xlsx','OR2.xlsx']); await leido();
  const cam=await p.evaluate(()=>WIZ.work.filter(w=>_cambiosW(w).length).map(w=>w.derrame));
  T(cam.length===0,'Comparar vacío'+(cam.length?' ('+cam.join(',')+')':''));
  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`); await b.close(); process.exit(mal?1:0);
})();
