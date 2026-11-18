/* v2.13.1 · Marcar pagado o cobrado desde Planes, sincronizado con las demás pantallas.
   Hoy fijado en 30-oct-2026 (viernes). Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo). Cifras inventadas.
   - "Cobrado" en una cuota = un abono en el estado de cuenta del cliente (amarrado a la cuota); "Desmarcar" lo quita de ambos; Deshacer.
   - Un abono registrado en el estado de cuenta tacha la cuota en Planes; repetirlo igual pide confirmación.
   - "Pagado" en un giro a China = el pago con fecha y medio del panel; "Desmarcar" lo quita; Deshacer.
   - Magnum factura por factura: "Pagada" y la fecha de pago son las marcas de Proveedores y mueven la Caja.
   - Un contrato (automático) se puede cobrar desde Planes. */
const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const ctx=await b.newContext({viewport:{width:1440,height:900}}); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(new Date(2026,9,30,10,0,0));
  await ctx.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  ok('versión v2.13.2 arriba',await p.evaluate(()=>document.getElementById('verTag').textContent.trim()==='v2.13.2'));
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(100);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV&&PKPREV.res,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  await p.setInputFiles('#v2File',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  await p.evaluate(()=>{ WIZ.work.forEach(w=>{ if(!(''+w.proj).trim()) w.proj='(sin nombre)'; }); wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(800);
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} TRMOF['2026-10-30']={v:3500.25,f:'oficial',desde:'2026-10-30',hasta:'2026-11-03'};
    CXP.magnum=Object.assign({},CXP.magnum||{},{facturas:[{id:'M101',empresa:'Magnum',fecha:'2026-10-01',vence:'2026-10-20',saldo:3500250,moneda:'COP'},{id:'M102',empresa:'Magnum',fecha:'2026-10-05',vence:'2026-10-25',saldo:7000500,moneda:'COP'}]});
    window._q=id=>'[data-id="'+CSS.escape(id)+'"]'; window._w=()=>new Promise(r=>setTimeout(r,60)); }); await p.waitForTimeout(200);
  const llaves0=await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','));

  /* ---- cobrar una cuota desde Planes = un abono en el estado de cuenta ---- */
  await p.evaluate(()=>{ navTo('planes'); Z213.cp='cobro:Solenium'; renderPlanes(); }); await p.waitForTimeout(200);
  const c0=await p.evaluate(()=>{ const c=_v3Cp('cobro:Solenium'), x=_z27Vista(c).L.filter(y=>y.e.pend>0.5).sort((a,b)=>_v3PorF(a.l,b.l))[0];
    window._cu={id:x.l.id,pend:Math.round(x.e.pend*100)/100}; window._eca0=ECA.length; window._sal0=(ecTotales('Solenium')||{}).saldo;
    return {btn:!!document.querySelector('#z13Det [data-h="cob"]'+_q(x.l.id)),pend:window._cu.pend}; });
  ok('cada cuota pendiente de un cliente trae "Cobrado"',c0.btn);
  await p.click('#z13Det [data-h="cob"]'+(await p.evaluate(()=>_q(window._cu.id)))); await p.waitForTimeout(150);
  const form=await p.evaluate(()=>{ const r=document.querySelector('#z13Det .z-reg'); return !!r&&!!r.querySelector('[data-y="cbOk"]'); });
  await p.click('#z13Det .z-reg [data-y="cbOk"]'); await p.waitForTimeout(200);
  const c1=await p.evaluate(()=>{ const a=ECA[ECA.length-1], c=_v3Cp('cobro:Solenium'), x=_z27Vista(c).L.find(y=>y.l.id===window._cu.id), t=ecTotales('Solenium')||{};
    navTo('clientes'); selCliData('Solenium'); const ec=document.getElementById('clDetail').textContent; navTo('planes');
    return {n:ECA.length-window._eca0,cuota:a.cuota===window._cu.id,usd:a.usd,est:x.e.t,sal:Math.round((window._sal0-t.saldo)*100)/100,ec:ec.indexOf(fmtUSDs(a.usd))>=0,desm:!!document.querySelector('#z13Det [data-h="desm"]'+_q(window._cu.id))}; });
  ok('"Cobrado" abre el formulario en la línea y registra un abono amarrado a la cuota ('+c1.usd+')',form&&c1.n===1&&c1.cuota&&Math.abs(c1.usd-c0.pend)<0.01);
  ok('la cuota queda '+c1.est+' y el estado de cuenta de Solenium baja lo mismo ('+c1.sal+') y lo muestra',c1.est==='Cobrada'&&Math.abs(c1.sal-c1.usd)<0.02&&c1.ec);
  const dup=await p.evaluate(()=>{ const a=z27Cobrar('cobro:Solenium',{m:window._cu.pend,f:_p14Iso(TODAY)}); return {nulo:a===null,n:ECA.length-window._eca0,t:(document.getElementById('z26Toast')||{}).textContent||''}; });
  ok('marcarlo otra vez no lo repite: "'+dup.t.slice(0,40)+'…"',dup.nulo&&dup.n===1&&/Ya está registrado/.test(dup.t));
  await p.click('#z13Det [data-h="desm"]'+(await p.evaluate(()=>_q(window._cu.id)))); await p.waitForTimeout(200);
  const c2=await p.evaluate(()=>{ const c=_v3Cp('cobro:Solenium'), x=_z27Vista(c).L.find(y=>y.l.id===window._cu.id); return {n:ECA.length-window._eca0,sal:Math.round(((ecTotales('Solenium')||{}).saldo-window._sal0)*100)/100,pend:x.e.pend>0.5}; });
  ok('"Desmarcar" quita el abono del estado de cuenta y la cuota vuelve a pendiente',c2.n===0&&Math.abs(c2.sal)<0.02&&c2.pend);
  await p.evaluate(async()=>{ z26Deshacer(); await _w(); });
  const c3=await p.evaluate(()=>({n:ECA.length-window._eca0,sal:Math.round((window._sal0-(ecTotales('Solenium')||{}).saldo)*100)/100}));
  ok('Deshacer trae el abono de vuelta ('+c3.sal+')',c3.n===1&&Math.abs(c3.sal-c0.pend)<0.02);

  /* ---- al revés: abono en el estado de cuenta → la cuota se tacha en Planes ---- */
  const ec=await p.evaluate(async()=>{ const c=_v3Cp('cobro:Solenium'), x=_z27Vista(c).L.filter(y=>y.e.pend>0.5).sort((a,b)=>_v3PorF(a.l,b.l))[0];
    navTo('clientes'); selCliData('Solenium'); const set=(id,v)=>{ const n=document.getElementById(id); if(n) n.value=v; };
    set('ecaMon','USD'); set('ecaMonto',String(Math.round(x.e.pend*100)/100)); set('ecaFecha',_p14Iso(TODAY)); set('ecaNota','prueba EC');
    const n0=ECA.length; ecAbono('Solenium'); await _w(); navTo('planes'); renderPlanes(); await _w();
    const y=_z27Vista(_v3Cp('cobro:Solenium')).L.find(z=>z.l.id===x.l.id), tr=document.querySelector('#z13Det tr'+_q(x.l.id));
    /* otra vez lo mismo: pregunta antes */
    navTo('clientes'); selCliData('Solenium'); set('ecaMon','USD'); set('ecaMonto',String(Math.round(x.e.pend*100)/100)); set('ecaFecha',_p14Iso(TODAY));
    const n1=ECA.length; ecAbono('Solenium'); await _w(); const dlg=document.getElementById('z26Dlg'), txt=dlg&&dlg.textContent; const no=dlg&&[...dlg.querySelectorAll('button')].find(b2=>!/Registrar otro/.test(b2.textContent)); if(no) no.click(); await _w();
    navTo('planes');
    return {n:n1-n0,est:y.e.t,tachada:!!tr&&tr.classList.contains('done'),pide:!!txt&&/Ya hay un abono/.test(txt),n2:ECA.length-n1}; });
  ok('un abono registrado en el estado de cuenta tacha la cuota en Planes ('+ec.est+')',ec.n===1&&ec.est==='Cobrada'&&ec.tachada);
  ok('registrar otra vez el mismo abono pregunta antes y, si no, no lo suma',ec.pide&&ec.n2===0);

  /* ---- pagar un giro a China desde Planes ---- */
  await p.click('.z13-cp[data-cp="pago:eagle"]'); await p.waitForTimeout(150);
  const g0=await p.evaluate(()=>{ const c=_v3Cp('pago:eagle'), x=_z27Vista(c).L.find(y=>y.e.pend>0.5&&!y.e.past); window._gi={id:x.l.id,pend:Math.round(x.e.pend*100)/100}; return !!document.querySelector('#z13Det [data-h="pag"]'+_q(x.l.id)); });
  await p.click('#z13Det [data-h="pag"]'+(await p.evaluate(()=>_q(window._gi.id)))); await p.waitForTimeout(150);
  await p.click('#z13Det .z-reg [data-y="pgOk"][data-med="banco"]'); await p.waitForTimeout(200);
  const g1=await p.evaluate(()=>{ const G=PLANES.reg[window._gi.id]||[], x=_z27Vista(_v3Cp('pago:eagle')).L.find(y=>y.l.id===window._gi.id);
    z26Abrir('pago:eagle'); const dr=(document.getElementById('z26Dr')||{}).textContent||''; z26Cerrar();
    return {reg:G.length===1&&G[0].medio==='banco'&&Math.abs(G[0].m-window._gi.pend)<0.01,est:x.e.t,panel:/Pagos registrados \(1\)/.test(dr),desm:!!document.querySelector('#z13Det [data-h="desm"]'+_q(window._gi.id))}; });
  ok('"Pagado" en un giro de Eaglerise registra el pago con fecha y medio; queda '+g1.est+' y el panel lo muestra',g0&&g1.reg&&g1.est==='Pagada'&&g1.panel&&g1.desm);
  await p.click('#z13Det [data-h="desm"]'+(await p.evaluate(()=>_q(window._gi.id)))); await p.waitForTimeout(200);
  const g2=await p.evaluate(async()=>{ const sin=!(PLANES.reg[window._gi.id]||[]).length, est=_z27Vista(_v3Cp('pago:eagle')).L.find(y=>y.l.id===window._gi.id).e.t; z26Deshacer(); await _w(); return {sin,est,vuelve:(PLANES.reg[window._gi.id]||[]).length===1}; });
  ok('"Desmarcar" quita el pago ('+g2.est+'); Deshacer lo trae',g2.sin&&g2.est!=='Pagada'&&g2.vuelve);

  /* ---- Magnum factura por factura, igual que Proveedores ---- */
  await p.evaluate(()=>{ Z213.cp='pago:magnum'; renderPlanes(); }); await p.waitForTimeout(150);
  const m0=await p.evaluate(()=>{ const X=p14Calc('pago'); window._mag0=X.R.mag.v.slice(); const filas=[...document.querySelectorAll('#z13Det tr[data-id]')].map(t=>t.dataset.id);
    return {filas,en:!!document.querySelector('.z13-cp[data-cp="pago:magnum"]'),btn:!!document.querySelector('#z13Det [data-h="fxp"][data-id="M101"]')}; });
  ok('Magnum se ve factura por factura ('+m0.filas.join(', ')+') con "Pagada"',m0.en&&m0.filas.includes('M101')&&m0.filas.includes('M102')&&m0.btn);
  await p.click('#z13Det [data-h="fxp"][data-id="M101"]'); await p.waitForTimeout(200);
  const m1=await p.evaluate(()=>{ const X=p14Calc('pago'), d=X.R.mag.v.reduce((a,v,i)=>a+(window._mag0[i]-v),0);
    return {mio:!!(CXPMIO['magnum:M101']||{}).pagada,d:Math.round(d*100)/100,prov:/Marcadas como pagadas[^<]*<label[^>]*><input[^>]*checked[^>]*> M101/.test(_p14PanelCxp('magnum')),fila:(document.querySelector('#z13Det tr[data-id="M101"]')||{}).className}; });
  ok('"Pagada" es la misma marca de Proveedores: sale de la Caja ('+m1.d+' = COP 3,500,250 / 3,500.25) y Proveedores la muestra pagada',m1.mio&&Math.abs(m1.d-1000)<0.02&&m1.prov&&/done/.test(m1.fila||''));
  const m2=await p.evaluate(async()=>{ cxpPagada('magnum','M101',false); _z26Repintar(); await _w(); const vuelve=!!document.querySelector('#z13Det [data-h="fxp"][data-on="1"][data-id="M101"]');
    const i=document.querySelector('#z13Det input[data-h="fxf"][data-id="M102"]'), w0=_v3Wk(i.value), nueva=_p14Iso(addD(_p14D(i.value),14)); i.value=nueva; i.dispatchEvent(new Event('change',{bubbles:true})); await _w();
    const X=p14Calc('pago'), w1=_v3Wk(nueva), plan=(CXPMIO['magnum:M102']||{}).planFecha; z26Deshacer(); await _w();
    return {vuelve,plan:plan===nueva,mov:Math.round((X.R.mag.v[w1]-window._mag0[w1])*100)/100,back:!(CXPMIO['magnum:M102']||{}).planFecha}; });
  ok('desmarcar en Proveedores la devuelve en Planes; cambiar la fecha de pago en Planes es la "fecha a mano" de Proveedores y mueve la Caja (+'+m2.mov+'); Deshacer',m2.vuelve&&m2.plan&&Math.abs(m2.mov-2000)<0.02&&m2.back);

  /* ---- un contrato (automático) se cobra desde Planes ---- */
  await p.evaluate(()=>{ Z213.cp='cobro:Enexa S.A.S'; renderPlanes(); }); await p.waitForTimeout(150);
  const en=await p.evaluate(async()=>{ const b2=document.querySelector('#z13Det [data-h="cob"]'); if(!b2) return {};
    const s0=(ecTotales('Enexa S.A.S')||{}).saldo, n0=ECA.length; b2.click(); await _w(); const i=document.querySelector('#z13Det .z-reg input[data-yr="m"]'); i.value='1000'; document.querySelector('#z13Det .z-reg [data-y="cbOk"]').click(); await _w();
    return {b:true,n:ECA.length-n0,d:Math.round((s0-(ecTotales('Enexa S.A.S')||{}).saldo)*100)/100}; });
  ok('un contrato automático (Enexa) también se cobra desde Planes y baja su estado de cuenta ('+en.d+')',en.b&&en.n===1&&Math.abs(en.d-1000)<0.02);

  ok('sin llaves nuevas en el estado',await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','))===llaves0);
  ok('sin errores de página'+(errs.length?' · '+errs.slice(0,2).join(' · '):''),errs.length===0);
  console.log('\n'+n+' OK'+(f?' · '+f+' con falla':''));
  await b.close(); process.exit(f?1:0);
})();
