/* v1.13 · otros cargos (Finkargo, CPP…) y promesas de pago de los clientes del grupo.
   Un cargo suma a lo que el cliente debe; si hay un pago tuyo a un tercero, sale en la Caja
   hasta que lo marques pagado; de un cliente del grupo, en la Caja solo entran sus promesas. */
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
  await p.evaluate(()=>{wizGo(2);wizApprove();CLI['Solenium'].interno=true;navTo('clientes');selCliData('Solenium');}); await p.waitForTimeout(300);

  ok('el estado de cuenta tiene la sección "Otros cargos" con su botón',await p.evaluate(()=>[...document.querySelectorAll('#clDetail .ec8-sec')].some(s=>/Otros cargos/.test(s.textContent)&&/\+ cargo/.test(s.textContent))));
  const a=await p.evaluate(()=>{const t0=ecTotales('Solenium').saldo, cajaPagos0=cjCajones();
    [...document.querySelectorAll('#clDetail .ec8-sec')].find(s=>/Otros cargos/.test(s.textContent)).querySelector('button').click();
    const x=ECX[ECX.length-1]; ecSet(x.id,'pedido','Finkargo'); ecSet(x.id,'equipo','Préstamo capital de trabajo'); ecSet(x.id,'valor','30,000');
    ecCuotas(x.id); ecCuotaSet(x.id,0,'vence','2030-02-01'); ecCuotaSet(x.id,1,'vence','2030-03-01');
    return {id:x.id,tipo:x.tipo,suma:ecTotales('Solenium').saldo-t0,
      enSec:[...document.querySelectorAll('#clDetail .ec8-wrap')].some(w=>/Finkargo/.test(w.innerHTML)),
      placeholder:!!document.querySelector('#clDetail input[placeholder^="rubro"]')};});
  ok('"+ cargo" crea un cargo que suma a lo que el cliente debe (30,000)',a.tipo==='cargo'&&Math.abs(a.suma-30000)<0.01&&a.enSec&&a.placeholder);
  const t=await p.evaluate(id=>{ const antes=cjPagosTerceros().length; ecSet(id,'tercero','Finkargo');
    const l=cjPagosTerceros(); const K=cjCajones(); const enCaja=K.sem.concat([{pagos:K.C.despues}]).some(s=>s.pagos.some(q=>q.tipo==='tercero'));
    return {antes,n:l.length,monto:l.reduce((s,x)=>s+x.monto,0),quien:l[0]&&l[0].quien,enCaja};},a.id);
  ok('"yo le pago a Finkargo" saca las cuotas en la Caja como pagos tuyos',t.antes===0&&t.n===2&&Math.abs(t.monto-30000)<0.01&&t.quien==='Finkargo'&&t.enCaja);
  ok('marcar "ya le pagué" una cuota la saca de la Caja',await p.evaluate(id=>{ecPagoT(id,0,true);const l=cjPagosTerceros();return l.length===1&&Math.abs(l[0].monto-15000)<0.01;},a.id));
  ok('un cargo sin tercero (CPP que ya pagaste) solo suma a lo que te deben, no sale en la Caja',await p.evaluate(()=>{
    const n0=cjPagosTerceros().length; ecCargoAdd('Solenium'); const x=ECX[ECX.length-1]; ecSet(x.id,'pedido','CPP'); ecSet(x.id,'valor','2,000'); ecSet(x.id,'vence','2030-01-15');
    return cjPagosTerceros().length===n0&&ecFilas('Solenium').filas.some(f=>f.k===x.id&&f.valor===2000);}));
  /* promesas */
  ok('de Solenium, sin promesas, no entra nada a la Caja (aunque tenga saldo)',await p.evaluate(()=>{const e=EQ.find(x=>x.cliente==='Solenium'&&x.etd);e.precioVenta=80000;refreshAll();
    return !cjCobros().some(c=>c.cliente==='Solenium');}));
  const pr=await p.evaluate(()=>{selCliData('Solenium');promAdd('Solenium'); /* v2.1: las promesas son la versión "a" del plan de pagos */
    const q=PROM[PROM.length-1]; promSet(q.id,'monto','200,000'); q.fecha='2030-01-10'; promSet(q.id,'nota','giro de cartera');
    const c=cjCobros().filter(x=>x.cliente==='Solenium'); return {id:q.id,n:c.length,monto:c[0]&&c[0].monto,ped:c[0]&&c[0].pedido};});
  ok('una promesa de Solenium entra a la Caja como cobro en su fecha (200,000)',pr.n===1&&pr.monto===200000&&pr.ped==='Promesa de pago');
  ok('marcada cumplida, sale de la Caja',await p.evaluate(id=>{promCumplida(id,true);const r=!cjCobros().some(c=>c.cliente==='Solenium');promCumplida(id,false);return r;},pr.id));
  ok('si pasa la fecha sin cumplir, se ve "Incumplida"',await p.evaluate(id=>{const q=PROM.find(x=>x.id===id);q.fecha='2026-01-05';selCliData('Solenium');
    const r=/Incumplida/.test(document.getElementById('clDetail').textContent); q.fecha='2030-01-10'; return r;},pr.id));
  ok('apagar "Incluir promesas" saca a Solenium de la Caja',await p.evaluate(()=>{CJ.sole=false;const r=!cjCobros().some(c=>c.cliente==='Solenium');CJ.sole=true;return r;}));
  ok('un cliente externo sigue entrando por su estado de cuenta',await p.evaluate(()=>{const e=EQ.find(x=>x.cliente==='Ext');if(!e)return true;e.precioVenta=5000;refreshAll();return cjCobros().some(c=>c.cliente==='Ext');}));
  /* persistencia */
  ok('cargos, terceros y promesas se guardan y vuelven; un estado viejo sin PROM abre bien',await p.evaluate(()=>{
    const s=serializeState(),o=JSON.parse(s); applyState(JSON.parse(s));
    const r1=PROM.length===1&&ECX.some(x=>x.tipo==='cargo'&&x.tercero==='Finkargo'&&x.cuotas[0].pagoT===true);
    const v=JSON.parse(s); delete v.PROM; applyState(v); const r2=Array.isArray(PROM)&&PROM.length===0; applyState(o); return r1&&r2;}));
  ok('sin errores de JS',errs.length===0);
  if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
