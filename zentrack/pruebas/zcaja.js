/* v1.12 · Caja: pagos a China y cobros de clientes, semana a semana.
   Todo lo que se debe a China cae en algún cajón (y suma exacto); lo que no tiene fecha no se
   cuenta "para hoy"; las cuatro vistas pintan; cobros de clientes del grupo fuera por defecto. */
const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const p=await b.newPage({viewport:{width:1400,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['DET3.xlsx','OR2.xlsx']);
  await p.waitForFunction(()=>WIZ.loaded&&WIZ.work&&WIZ.work.length,null,{timeout:60000});
  await p.evaluate(()=>{wizGo(2);wizApprove();CLI['Solenium'].interno=true;}); await p.waitForTimeout(300);
  await p.click('nav.tabs button[data-v="caja"]'); await p.waitForTimeout(250);
  ok('la pestaña Caja existe y pinta la tabla semana a semana (v2.6: solo lee)',await p.evaluate(()=>document.getElementById('v-caja').classList.contains('on')&&!!document.querySelector('#z26Caja')&&!document.querySelector('#z26Caja input')));
  const s=await p.evaluate(()=>{const K=cjCajones(),S=K.S;
    const tot=S(K.C.atras)+S(K.C.reciente)+S(K.C.ya)+K.sem.reduce((a,x)=>a+x.pago,0)+S(K.C.despues)+S(K.C.sinf);
    const pp=pagosPend().reduce((a,x)=>a+x.monto,0);
    const sinf=K.C.sinf.every(x=>!x.fecha), ya=K.C.ya.every(x=>x.tipo==='otros');
    return {tot,pp,sinf,ya,nsinf:K.C.sinf.length,hoy:S(K.C.atras)+S(K.C.reciente)+S(K.C.ya),debo:puenteTot(null).debo};});
  ok('todo lo que debes a China cae en algún cajón y suma exacto ('+Math.round(s.tot)+')',Math.abs(s.tot-s.pp)<1&&Math.abs(s.pp-s.debo)<1);
  ok('lo que no tiene fecha va a "Sin fecha todavía", no a hoy ('+s.nsinf+')',s.sinf&&s.nsinf>0);
  ok('"Componentes: pagar ya" son solo componentes',s.ya);
  /* v2.3: las vistas de la v1.12 se quitaron de la pantalla; los cajones siguen (Tablero, Cuentas › Debo) */
  ok('cada semana suma exacto los pedidos que la forman',await p.evaluate(()=>{const K=cjCajones();return K.sem.length===CJ.semanas&&K.sem.every(s=>Math.abs(s.pago-s.pagos.reduce((a,x)=>a+x.monto,0))<0.01&&Math.abs(s.cobro-s.cobros.reduce((a,x)=>a+x.monto,0))<0.01);}));
  /* desde v1.13: de un cliente del grupo solo cuentan sus promesas de pago, no su estado de cuenta */
  ok('los clientes del grupo (Solenium) entran a la Caja solo por sus promesas',await p.evaluate(()=>{
    const e=EQ.find(x=>x.cliente==='Solenium'&&x.etd); e.precioVenta=50000; refreshAll();
    const sin=cjCobros().some(c=>c.cliente==='Solenium');
    PROM.push({id:'prmt',cliente:'Solenium',fecha:'2030-01-01',monto:1000,nota:'',cumplida:false});
    const con=cjCobros().some(c=>c.cliente==='Solenium'&&c.pedido==='Promesa de pago'); PROM=[]; e.precioVenta=0; return !sin&&con;}));
  ok('quitar los cobros deja solo pagos',await p.evaluate(()=>{CJ.cobros=false;const K=cjCajones();const r=K.sem.every(s=>!s.cobros.length)&&K.sem.some(s=>s.pagos.length);CJ.cobros=true;return r;}));
  ok('sin errores de JS',errs.length===0);
  if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
