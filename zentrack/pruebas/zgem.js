/* El renglón de la hoja que repite una celda NO se descarta: cae sobre el gemelo. */
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

  console.log('\n— el renglon E12 ya no se tira a la basura —');
  const r1=await p.evaluate(()=>({
    reat:(WIZ.concilia.reatribuidos||[]).map(x=>({celda:x.celda,val:Math.round(x.valor),a:x.aPedido,gem:x.gemelo})),
    dup:(WIZ.concilia.duplicados||[]).map(x=>x.celda),
    sueltos:(WIZ.concilia.sueltos||[]).map(x=>x.celda),
    txt:document.getElementById('reconBody').innerText}));
  T(r1.reat.length===1&&r1.reat[0].celda==='E12','E12 se reasigno en vez de descartarse');
  T(r1.reat[0].gem&&/INGEV2/.test(r1.reat[0].gem.poRaw),'se lo quedo el PO CFM3-2 INGEV2 de la fila '+(r1.reat[0].gem||{}).fila);
  T(r1.reat[0].val===103040,'con los 103,040 que escribio Andres');
  T(r1.dup.length===0,'ya no queda ningun renglon marcado como repetido');
  T(r1.sueltos.length===0,'ni ninguno sin pedido');
  T(/reasignado al pedido gemelo/.test(r1.txt),'y el informe de carga lo explica');

  console.log('\n— el pedido gemelo entra a la lista aunque este pagado —');
  const g=await p.evaluate(()=>{const w=WIZ.work.find(x=>/INGEV2/.test(x.derrame||''));
    return w?{der:w.derrame,saldo:Math.round(+w.cupoSaldo||0),monto:Math.round(+w.cupoMonto||0)}:null;});
  T(g!=null,'el CFM 3-2 de INGEV2 ya es un pedido: '+(g?g.der:'NO APARECE'));
  T(g&&g.saldo===0,'con saldo 0 (esta pagado) pero igual presente');

  console.log('\n— y el total cuadra con la hoja de Andres —');
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(4200);
  const r2=await p.evaluate(()=>{
    const w=EQ.find(x=>/INGEV2/.test(x.derrame||''));
    return {E:Math.round(cargaViva('Eaglerise')), S:Math.round(cargaViva('Singsun')),
      modo:w?(SINO.ped[kOf(w)]||{}).modo:null, fijo:w?(SINO.ped[kOf(w)]||{}).fijo:null,
      cons:w?Math.round(consumoEq(w,'Eaglerise')):null,
      hoja:CONCILIA.sino?Math.round(CONCILIA.sino.totalEagle):null};});
  T(r2.modo==='fijo'&&r2.fijo===103040,'el gemelo quedo sembrado en modo fijo con 103,040');
  T(r2.cons===103040,'y si consume cupo aunque figure pagado (el modo fijo manda)');
  T(r2.E===1465652,'Eaglerise da 1,465,652 — el mismo total que declara la hoja');
  T(r2.E===r2.hoja,'motor y hoja coinciden exactamente');
  T(Math.abs(r2.S-1413028)<=2,'y Singsun sigue en '+r2.S);

  console.log('\n— sigue siendo MIO: lo puedo poner en cero —');
  await p.evaluate(()=>{const w=EQ.find(x=>/INGEV2/.test(x.derrame||''));snSet(kOf(w),'modo','fuera');});
  await p.waitForTimeout(500);
  T((await p.evaluate(()=>Math.round(cargaViva('Eaglerise'))))===1362612,'sacarlo del cupo lo devuelve a 1,362,612');

  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`);
  await b.close(); process.exit(mal?1:0);
})();
