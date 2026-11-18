/* v2.9.3 · Lo que necesitó el plan de Enexa.
   Hoy fijado en 30-oct-2026. Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo). Cifras inventadas.
   - Un acuerdo con "desde" no cuenta los abonos de antes de esa fecha.
   - Paso "abono" de la actualización preparada: a un pedido y sin repetir uno parecido.
   - Standby para líneas sueltas del estado de cuenta (ECX), con Reactivar en Clientes › Precios. */
const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const p=await b.newPage({viewport:{width:1440,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(new Date(2026,9,30,10,0,0));
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('pdf.worker.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.worker.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('pdf.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  ok('versión v2.13.2 arriba',await p.evaluate(()=>document.getElementById('verTag').textContent.trim()==='v2.13.2'));
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(100);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV&&PKPREV.res,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  await p.setInputFiles('#v2File',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  await p.evaluate(()=>{ WIZ.work.forEach(w=>{ if(!(''+w.proj).trim()) w.proj='(sin nombre)'; }); wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(800);
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} }); await p.waitForTimeout(200);
  const cli=await p.evaluate(()=>{ const c=_v3Cps().find(x=>x.dir==='c'&&x.tipo==='Contrato'); const e=EQ.filter(x=>x.cliente===(c&&c.n)); return c?{id:c.id,n:c.n,p1:e[0]&&e[0].derrame,p2:e[1]&&e[1].derrame}:null; });
  ok('hay un cliente con contrato para probar ('+(cli&&cli.n)+')',!!cli&&!!cli.p1&&!!cli.p2);

  /* ---- un acuerdo con "desde" ---- */
  const de=await p.evaluate(c=>{ ECA.push({id:'ecaz1',cliente:c.n,fecha:'2026-10-27',usd:500,nota:'antes',aplicado:[]});
    PKPREV=Object.assign(pkLeer({tipo:'zentrack-datos',version:2,datos:{PLANES_V:[{cp:c.id,ref:'p293',nombre:'Plan prueba',fecha:'2026-10-30',origen:'Acordado',activar:true,desde:'2026-10-30',lineas:[{fecha:'2026-10-30',monto:1000,dest:'A'},{fecha:'2026-11-20',monto:2000,dest:'B'}]}]}}),{archivo:'x'}); pkAplicar();
    const cc=_v3Cp(c.id), v=_z293Ver(cc), L=_v3Lin(cc,cc.act).sort(_v3PorF), k0=_z27Cob(cc).map[L[0].id]||0;
    ECA.push({id:'ecaz2',cliente:c.n,fecha:'2026-10-30',usd:300,nota:'después',aplicado:[]}); const k1=_z27Cob(_v3Cp(c.id)).map[L[0].id]||0;
    return {desde:v&&v.desde,k0,k1}; },cli);
  ok('el acuerdo guarda "desde" ('+de.desde+') y no cuenta el abono de antes; sí el de después',de.desde==='2026-10-30'&&de.k0===0&&de.k1===300);

  /* ---- paso "abono": a un pedido y sin repetir ---- */
  const ab=await p.evaluate(async c=>{ const n0=ECA.length; CONFIG.cambios=CONFIG.cambios||{};
    const dup={desde:'2026-10-26',hasta:'2026-10-30',usd:1000,cop:3000000};
    window.ZT_PENDIENTE=[{id:'ab1',titulo:'a',resumen:'',pasos:[{tipo:'abono',nombre:'parte 1',cliente:c.n,fecha:'2026-10-28',usd:700,cop:2100000,trm:3000,nota:'Abono 3 M · parte 1',ped:c.p1,dup},
      {tipo:'abono',nombre:'parte 2',cliente:c.n,fecha:'2026-10-28',usd:300,cop:900000,trm:3000,nota:'Abono 3 M · parte 2',ped:c.p2,dup}]}];
    await ztPendiente(); const n1=ECA.length, a=ECA[ECA.length-2], k1=(EQ.find(e=>e.cliente===c.n&&e.derrame===c.p1));
    const apl=(a.aplicado||[]).every(q=>q.k===kOf(k1));
    window.ZT_PENDIENTE=[{id:'ab2',titulo:'a',resumen:'',pasos:window.ZT_PENDIENTE[0].pasos}]; await ztPendiente(); const n2=ECA.length;
    ECA.push({id:'ecaz3',cliente:c.n,fecha:'2026-10-29',usd:999,cop:5000000,nota:'ya registrado a mano',aplicado:[]});
    window.ZT_PENDIENTE=[{id:'ab3',titulo:'a',resumen:'',pasos:[{tipo:'abono',nombre:'otro',cliente:c.n,fecha:'2026-10-30',usd:1500,nota:'Abono 5 M',dup:{desde:'2026-10-26',hasta:'2026-10-30',cop:5000000}}]}]; await ztPendiente();
    const d=document.querySelector('#z26Dlg [data-r="1"]'); if(d) d.click();
    return {nuevos:n1-n0,apl,repite:n2-n1,cop:ECA.length-(n2+1),flags:['ab1','ab2','ab3'].every(k=>CONFIG.cambios['pendiente:'+k])}; },cli);
  ok('el abono preparado va al pedido indicado ('+ab.nuevos+' partes)',ab.nuevos===2&&ab.apl);
  ok('volverlo a correr no lo repite',ab.repite===0);
  ok('si ya hay uno parecido (mismo monto en pesos, en el rango de fechas), no se registra',ab.cop===0&&ab.flags);

  /* ---- standby para una línea suelta ---- */
  const sx=await p.evaluate(()=>{ let x=(ECX||[]).find(r=>!r.fink&&r.cliente&&(r.pedido||r.equipo)); if(!x){ x={id:'ecxz',cliente:'Solenium',pedido:'Línea prueba',equipo:'Prueba',proyecto:'',etd:'',valor:1000,abonado:0,vence:'',nota:''}; ECX.push(x); }
    const t=x.pedido||x.equipo, en0=ecFilas(x.cliente).filas.some(f=>f.k===x.id);
    PKPREV=Object.assign(pkLeer({tipo:'zentrack-datos',version:2,datos:{PRECIOS:[{ecx:t,cliente:x.cliente,standby:true}]}}),{archivo:'x'}); const txt=PKPREV.res[0]; pkAplicar();
    const en1=ecFilas(x.cliente).filas.some(f=>f.k===x.id); return {id:x.id,cli:x.cliente,en0,en1,txt,st:!!x.standby}; });
  ok('una línea suelta queda en standby y sale del estado de cuenta ('+sx.txt+')',sx.en0&&!sx.en1&&sx.st&&/^Standby · /.test(sx.txt));
  await p.evaluate(c=>{ navTo('clientes'); selCliData(c); },sx.cli); await p.waitForTimeout(300);
  const re=await p.evaluate(id=>{ const b=document.querySelector('.pr28 [data-pax="'+id+'"]'); if(!b) return {boton:false}; b.click(); const x=ECX.find(r=>r.id===id); return {boton:true,st:!!x.standby,en:ecFilas(x.cliente).filas.some(f=>f.k===id)}; },sx.id);
  ok('en Clientes › Precios sale con Reactivar, y vuelve al estado de cuenta',re.boton&&!re.st&&re.en);
  ok('sin errores de página',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exit(f?1:0);
})();
