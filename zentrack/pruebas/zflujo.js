/* Qué pasa de verdad al cargar el siguiente archivo. */
const {chromium}=require('playwright-core');const fs=require('fs');
let ok=0,mal=0;const T=(c,m)=>{if(c){ok++;console.log('  OK   '+m);}else{mal++;console.log('  FALLA '+m);}};
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1000}});
  const errs=[];p.on('pageerror',e=>errs.push(''+e));p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(4200);
  // dejar TODO configurado, como lo tendra el
  await p.evaluate(()=>{const w=EQ.find(x=>x.derrame==='16');snSet(kOf(w),'modo','monto');});
  await p.waitForTimeout(600);
  const base=await p.evaluate(()=>({E:Math.round(cargaViva('Eaglerise'))}));
  console.log('\nconfigurado y listo · Eaglerise =',base.E);

  // ===== llega el archivo nuevo =====
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  await p.evaluate(()=>{
    const c=WIZ.work.find(x=>x.derrame==='CFM 2-3');        // ya lo pagamos
    c.cupoSaldo=0; c.totalSaldo=0; c.cupoPagado=c.cupoMonto;
    const s=WIZ.work.find(x=>x.derrame==='16');             // entro una parte
    s.cupoSaldo=300000; s.cupoPagado=215200;
    const n=JSON.parse(JSON.stringify(WIZ.work.find(x=>x.derrame==='15')));
    n.derrame='17'; n.ordenId='17'; n.proj='Pedido nuevo de prueba'; n._i=WIZ.work.length;
    WIZ.work.push(n);                                        // y hay un pedido nuevo
  });
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(4200);

  const r=await p.evaluate(()=>{
    const g=d=>{const e=EQ.find(x=>x.derrame===d);if(!e)return null;
      const s=SINO.ped[kOf(e)]||{};
      return {modo:s.modo,fijo:s.fijo,saldo:Math.round(+e.cupoSaldo||0),cons:Math.round(consumoEq(e,e.mfg))};};
    return {cfm23:g('CFM 2-3'),p16:g('16'),p17:g('17'),ingev:g('CFM 3-2 INGEV2'),
      E:Math.round(cargaViva('Eaglerise'))};});

  console.log('\n— 1. un pedido que ya pagaste —');
  T(r.cfm23.cons===0,'CFM 2-3: saldo 0 → deja de consumir cupo SOLO (antes 123,200)');
  T(r.cfm23.modo==='saldo','y conserva su modo, no hay que volver a tocarlo');

  console.log('\n— 2. un pedido que ya clasificaste y le entro un abono —');
  T(r.p16.saldo===300000,'PO#16: el saldo baja a 300,000 con el archivo');
  T(r.p16.modo==='monto','conserva el modo que YO le puse');
  T(r.p16.cons===515200,'pero en modo "monto completo" sigue pesando el pedido entero');

  console.log('\n— 3. un pedido NUEVO que nunca habias visto —');
  T(r.p17&&!r.p17.modo,'PO#17 entra SIN clasificar');
  T(r.p17&&r.p17.cons===0,'y no consume cupo hasta que tu lo decidas');

  console.log('\n— 4. el que pusiste en monto fijo —');
  T(r.ingev.modo==='fijo'&&r.ingev.fijo===103040,'el INGEV2 se queda en los 103,040 que fijaste');

  console.log('\n   Eaglerise paso de '+base.E+' a '+r.E);
  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`);
  await b.close(); process.exit(mal?1:0);
})();
