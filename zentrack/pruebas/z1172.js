/* v1.17.2 · Enexa: El Rosario 1, 2 y 3. Hoy fijado en 27-oct-2026.
   Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo).
   Esteban aprobó: 7-6 y 7-7 (Piojo 2 y 3, de Solenium) pasan a Enexa como El Rosario 1 y 2 con el precio y
   las cuotas de La Elvira 1 y 2 (12-1B, 12-2A); 7-3A se llama El Rosario 3; el PO 12 de trackers sale
   (ya no existe en China) y lo que Solenium tenía abonado en 12-1A pasa a lo que le vence primero.
   Nada se aplica solo: aviso con "Aplicar", y "Deshacer" en Ajustes. */
const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const errs=[];
  const abrir=async()=>{
    const p=await b.newPage({viewport:{width:1440,height:900}});
    p.on('pageerror',e=>errs.push(''+e)); p.on('console',m=>{ if(m.type()==='error'&&/v1\.17\.2/.test(m.text())) errs.push(m.text()); });
    p.on('dialog',d=>d.accept());
    await p.clock.setFixedTime(new Date(2026,9,27,10,0,0));
    await p.route('**/*',r=>{const u=r.request().url();
      if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
      if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
    await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
    await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
    await p.evaluate(()=>navTo('config')); await p.waitForTimeout(150);
    await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
    await p.evaluate(()=>navTo('hoy'));
    return p;
  };
  const foto=p=>p.evaluate(()=>{
    /* mismo contenido = mismo texto, sin importar el orden de las llaves */
    const est=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
    const ec={}; _ecClientes().forEach(c=>{const t=ecTotales(c);ec[c]={valor:Math.round(t.valor*100)/100,abonado:Math.round(t.abonado*100)/100,
      peds:ecFilas(c).filas.filter(x=>x.tipo==='eq').map(x=>x.pedido).sort().join(',')};});
    const sing=EQ.filter(e=>e.mfg==='Singsun');
    return {ec,nEq:EQ.length,deuda:Math.round(sing.reduce((a,e)=>a+(+e.totalSaldo||0),0)),
      doce:sing.filter(e=>/^12-/.test(e.derrame)).map(e=>e.derrame).sort().join(','),
      doceDeuda:Math.round(sing.filter(e=>/^12-/.test(e.derrame)).reduce((a,e)=>a+(+e.totalSaldo||0),0)),
      ecp:est(ECP), mio:est(MIO), eca:est(ECA), cobro:est(COBRO), costo:est(COSTO),
      sino:est(SINO.ped), cons:Math.round(EQ.filter(e=>e.mfg==='Singsun').reduce((a,e)=>a+consumoEq(e,'Singsun'),0)),
      cons79:Math.round(sing.filter(e=>/^7-[6-9]$/.test(e.derrame)).reduce((a,e)=>a+consumoEq(e,'Singsun'),0))};
  });

  /* ---------- aplicar ---------- */
  const p=await abrir();
  const s0=await foto(p);
  const antes=await p.evaluate(()=>({c1:JSON.stringify((ECP['Singsun|12-1B']||{}).cuotas),c2:JSON.stringify((ECP['Singsun|12-2A']||{}).cuotas),
    pv:precioVenta(EQ.find(e=>e.derrame==='12-1B')), ab:_ec2(_rosAbonado('Singsun|12-1A')), pvTxt:_ec2(precioVenta(EQ.find(e=>e.derrame==='12-1B'))), pv3:precioVenta(EQ.find(e=>e.derrame==='7-3A')),
    sale:['7-6','7-7','12-1A','12-2B'].reduce((a,d)=>a+precioVenta(EQ.find(e=>e.mfg==='Singsun'&&e.derrame===d)),0),
    primero:(function(){const fu=new Set(['Singsun|7-6','Singsun|7-7','Singsun|12-1A','Singsun|12-1B','Singsun|12-2A','Singsun|12-2B']);
      const u=_ecUnidades('Solenium').find(x=>!fu.has(x.k)); return u?_rosNombre(u.k):null;})()}));
  const aviso=await p.evaluate(()=>{const d=document.getElementById('rosAviso');return d?d.textContent.replace(/\s+/g,' '):'';});
  if(process.env.VER) console.log(aviso);
  ok('sale el aviso con el cambio: 7-6 → El Rosario 1 y 7-7 → El Rosario 2 de Enexa a '+antes.pv.toLocaleString('en-US'),
    aviso.indexOf('7-6 Piojo 2 (Solenium) → El Rosario 1 · Enexa S.A.S · '+antes.pvTxt+' en 3 cuotas')>=0&&/7-7 Piojo 3 \(Solenium\) → El Rosario 2/.test(aviso));
  ok('y que 7-3A pasa a El Rosario 3 y sale el PO 12 (los 4)',/7-3A La Elvira 3 → El Rosario 3/.test(aviso)&&/12-1A Heliconias 1, 12-1B La Elvira 1, 12-2A La Elvira 2, 12-2B Ponedera/.test(aviso));
  ok('dice a dónde va lo abonado por Solenium en 12-1A (a '+antes.primero+')',aviso.indexOf('Lo abonado por Solenium en 12-1A Heliconias 1 ('+antes.ab+') pasa a lo que le vence primero: ')>=0&&aviso.indexOf(antes.primero)>0);
  ok('nada cambió todavía (solo el aviso)',JSON.stringify(await foto(p))===JSON.stringify(s0));
  await p.evaluate(()=>rosAplicar()); await p.waitForTimeout(300);
  const s1=await foto(p);
  const r=await p.evaluate(()=>{const g=d=>EQ.find(e=>e.mfg==='Singsun'&&e.derrame===d);
    return {e6:{c:g('7-6').cliente,pr:g('7-6').proj,pv:precioVenta(g('7-6')),cu:JSON.stringify((ECP['Singsun|7-6']||{}).cuotas),mio:MIO.cli['Singsun|7-6']},
      e7:{c:g('7-7').cliente,pr:g('7-7').proj,pv:precioVenta(g('7-7')),cu:JSON.stringify((ECP['Singsun|7-7']||{}).cuotas)},
      e3:{pr:g('7-3A').proj,pv:precioVenta(g('7-3A'))},
      mio12:Object.keys(MIO.proj).concat(Object.keys(MIO.cli),Object.keys(MIO.split)).filter(k=>/^Singsun\|12-/.test(k)),
      sino6:(SINO.ped['Singsun|7-6']||{}).modo,
      ecaOk:ECA.every(a=>(a.aplicado||[]).every(x=>EQ.some(e=>kOf(e)===x.k)||ECX.some(y=>y.id===x.k))),
      pagosOk:PAGOS.every(pg=>(pg.aps||[]).every(a=>{const i=a.ieq!=null?a.ieq:a.eqI;return i==null||i<0||(EQ[i]&&(!a.ek||eqKey(EQ[i])===a.ek));})),
      aviso:!!document.getElementById('rosAviso'), hecho:!!(CONFIG.cambios&&CONFIG.cambios[ROS_ID])};});
  ok('7-6 queda El Rosario 1 de Enexa, con el precio y las cuotas de La Elvira 1',r.e6.c==='Enexa S.A.S'&&r.e6.pr==='El Rosario 1'&&r.e6.pv===antes.pv&&r.e6.cu===antes.c1&&r.e6.mio==='Enexa S.A.S');
  ok('7-7 queda El Rosario 2 de Enexa, con las cuotas de La Elvira 2',r.e7.c==='Enexa S.A.S'&&r.e7.pr==='El Rosario 2'&&r.e7.pv===antes.pv&&r.e7.cu===antes.c2);
  ok('7-3A se llama El Rosario 3 y conserva su precio ('+antes.pv3+')',r.e3.pr==='El Rosario 3'&&r.e3.pv===antes.pv3);
  ok('el PO 12 de trackers ya no está (ni sus nombres guardados)',s1.doce===''&&r.mio12.length===0&&s1.nEq===s0.nEq-4);
  ok('Enexa: mismo valor ('+s1.ec['Enexa S.A.S'].valor+') y ahora con 7-3A, 7-6 y 7-7',s1.ec['Enexa S.A.S'].valor===s0.ec['Enexa S.A.S'].valor
    &&['7-3A','7-6','7-7'].every(x=>s1.ec['Enexa S.A.S'].peds.split(',').includes(x))&&!/12-/.test(s1.ec['Enexa S.A.S'].peds));
  ok('Solenium: no pierde nada de lo abonado ('+s1.ec.Solenium.abonado+')',s1.ec.Solenium.abonado===s0.ec.Solenium.abonado);
  ok('Solenium: su valor baja '+Math.round(antes.sale*100)/100+' (Piojo 2, Piojo 3, Heliconias 1, Ponedera)',Math.abs((s0.ec.Solenium.valor-s1.ec.Solenium.valor)-antes.sale)<0.02);
  ok('la deuda con Singsun baja solo lo del PO 12 ('+s0.doceDeuda+')',s0.deuda-s1.deuda===s0.doceDeuda);
  ok('Sinosure no se tocó (no marqué la casilla): 7-6 a 7-9 siguen gastando '+s1.cons79,r.sino6==='saldo'&&s1.cons79===s0.cons79&&s1.sino===s0.sino);
  ok('los abonos registrados y los pagos siguen apuntando a pedidos que existen',r.ecaOk&&r.pagosOk);
  ok('el aviso se va y en Ajustes queda el cambio con "Deshacer"',!r.aviso&&r.hecho
    &&await p.evaluate(()=>{navTo('config');const d=document.getElementById('rosAjustes');return !!d&&/Deshacer este cambio/.test(d.textContent)&&/El Rosario 1/.test(d.textContent);}));
  ok('todo se guarda y vuelve, sin volver a mostrar el aviso',await p.evaluate(()=>{const s=serializeState(); applyState(JSON.parse(s)); refreshAll();
    return !!CONFIG.cambios[ROS_ID]&&!document.getElementById('rosAviso')&&EQ.find(e=>e.derrame==='7-6').cliente==='Enexa S.A.S';}));
  /* ---------- una carga nueva no lo pisa ---------- */
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  const idos=await p.evaluate(()=>_wizDesaparecidos().map(x=>x.clave));
  ok('al cargar el detailed del 23-oct ya no sale el PO 12 como desaparecido',!idos.some(k=>/12-/.test(k)));
  await p.evaluate(()=>{ wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(600);
  const r2=await p.evaluate(()=>{const g=d=>EQ.find(e=>e.mfg==='Singsun'&&e.derrame===d);
    return {c6:g('7-6').cliente,p6:g('7-6').proj,pv6:precioVenta(g('7-6')),cu6:JSON.stringify((ECP['Singsun|7-6']||{}).cuotas),p7:g('7-7').proj,p3:g('7-3A').proj,
      doce:EQ.filter(e=>e.mfg==='Singsun'&&/^12-/.test(e.derrame)).length};});
  ok('después de la carga: El Rosario 1, 2 y 3 siguen de Enexa con su precio y cuotas',r2.c6==='Enexa S.A.S'&&r2.p6==='El Rosario 1'&&r2.pv6===antes.pv&&r2.cu6===antes.c1
    &&r2.p7==='El Rosario 2'&&r2.p3==='El Rosario 3'&&r2.doce===0);
  await p.close();

  /* ---------- deshacer deja todo como estaba ---------- */
  const q=await abrir();
  const t0=await foto(q);
  await q.evaluate(()=>rosAplicar()); await q.waitForTimeout(200);
  await q.evaluate(()=>rosDeshacer()); await q.waitForTimeout(200);
  const t1=await foto(q);
  const dif=Object.keys(t0).filter(k=>JSON.stringify(t0[k])!==JSON.stringify(t1[k]));
  ok('"Deshacer" deja estados de cuenta, pedidos, precios, cuotas y abonos exactamente como estaban'+(dif.length?' (difiere: '+dif.join(', ')+')':''),dif.length===0);
  ok('y en esta sesión no vuelve a salir el aviso',await q.evaluate(()=>!document.getElementById('rosAviso')&&!(CONFIG.cambios||{})[ROS_ID]));
  await q.close();

  /* ---------- con la casilla de Sinosure ---------- */
  const s=await abrir();
  const u0=await foto(s);
  const fuera=await s.evaluate(()=>Math.round(['7-6','7-7','7-8','7-9'].reduce((a,d)=>a+consumoEq(EQ.find(e=>e.mfg==='Singsun'&&e.derrame===d),'Singsun'),0)));
  await s.evaluate(()=>{ document.getElementById('rosSino').click(); rosAplicar(); }); await s.waitForTimeout(200);
  const u1=await foto(s);
  ok('con la casilla: 7-6 a 7-9 quedan en "No entra" y el cupo usado de Singsun baja '+fuera,await s.evaluate(()=>['7-6','7-7','7-8','7-9'].every(d=>(SINO.ped['Singsun|'+d]||{}).modo==='fuera'))
    &&u0.cons-u1.cons===fuera&&fuera>200000);
  await s.evaluate(()=>rosDeshacer()); await s.waitForTimeout(200);
  const u2=await foto(s);
  ok('y "Deshacer" devuelve también las decisiones de Sinosure',u2.sino===u0.sino&&u2.cons===u0.cons);
  await s.close();

  /* ---------- al abrir de verdad (estado que llega del servidor, sin refreshAll) ---------- */
  const a=await b.newPage({viewport:{width:1440,height:900}});
  a.on('pageerror',e=>errs.push(''+e));
  await a.clock.setFixedTime(new Date(2026,9,27,10,0,0));
  await a.addInitScript(st=>{ const mk=()=>{ let ok=null; const o={withSuccessHandler(f){ok=f;return o;},withFailureHandler(){return o;},
      loadState(){ setTimeout(()=>ok&&ok(st),0); },saveState(){}}; return o; };
    window.google={script:{get run(){ return mk(); }}}; },fs.readFileSync(__dirname+'/RESP.json','utf8'));
  await a.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await a.goto('file://'+__dirname+'/ASM4.html'); await a.waitForTimeout(800);
  ok('al abrir la herramienta (datos del servidor) el aviso sale de una vez, sin tocar nada',await a.evaluate(()=>EQ.length>0&&!!document.getElementById('rosAviso')
    &&/El Rosario 1/.test(document.getElementById('rosAviso').textContent)));
  await a.close();

  ok('sin errores de JS',errs.length===0);
  if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
