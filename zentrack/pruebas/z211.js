/* v2.11 · Caja viva: la fecha corre sola; la Caja sale de los estados de cuenta y los planes, sin registrar giros.
   Hoy fijado en 30-oct-2026 (viernes) y luego movido. Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo). Cifras inventadas.
   - Fecha viva: con la página abierta, al cambiar el día TODAY se mueve y la Caja queda igual que si se abriera ese día.
   - Plan a China: lo que el detailed muestra pagado al proveedor después del acuerdo se descuenta solo, a la cuota
     más vieja; lo registrado a mano no se cuenta dos veces; lo automático no se guarda.
   - Fijos, impuestos y cuotas de contrato de semanas pasadas se dan por pagados (no se arrastran).
   - Gráfica de control debajo de la tabla: mismas cifras que la Caja, con hover y clic. Sin tabla día a día. */
const {chromium}=require('playwright-core');const fs=require('fs');
const ruta=async ctx=>ctx.route('**/*',r=>{const u=r.request().url();
  if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
  if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
const foto=()=>{ const X=p14Calc('pago'), r=x=>Math.round(x*100)/100, o={W0:_p14Iso(X.W[0]),neto:X.neto.map(r)};
  Object.keys(X.R).forEach(k=>{ o[k]=X.R[k].v.map(r); o[k+'_it']=X.R[k].it.map(a=>a.map(i=>i.txt+'|'+r(i.usd)).sort()); }); return o; };
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const ctx=await b.newContext({viewport:{width:1440,height:900}}); await ruta(ctx); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(new Date(2026,9,30,10,0,0));
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  ok('versión v2.13.2 arriba',await p.evaluate(()=>document.getElementById('verTag').textContent.trim()==='v2.13.2'));
  ok('arriba se ve la fecha con la que calcula',await p.evaluate(()=>document.getElementById('zdFecha').textContent==='Hoy · vie 30-oct-2026'));
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(100);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV&&PKPREV.res,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  await p.setInputFiles('#v2File',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  await p.evaluate(()=>{ WIZ.work.forEach(w=>{ if(!(''+w.proj).trim()) w.proj='(sin nombre)'; }); wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(800);
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} }); await p.waitForTimeout(200);
  const llaves0=await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','));

  /* ---- fijos, impuestos y cuotas de contrato de semanas pasadas no se arrastran ---- */
  const fi=await p.evaluate(()=>{ const L0=_p14Lun(TODAY), X=p14Calc('pago');
    const viejas=(GASTOS||[]).reduce((a,g)=>a+_gastoFechasAntes211(g,TODAY).filter(d=>d<L0).length,0);
    const fecha=t=>{ const m=(''+t).match(/· (\d{1,2})-([a-zé]{3}) ·/); if(!m) return null; const mo=_p14Mes.indexOf(m[2]); let best=null; [-1,0,1].forEach(dy=>{ const d=new Date(TODAY.getFullYear()+dy,mo,+m[1]); if(!best||Math.abs(d-TODAY)<Math.abs(best-TODAY)) best=d; }); return best; };
    const enCaja=X.R.fij.it[0].concat(X.R.imp.it[0]).map(i=>fecha(i.txt)).filter(Boolean);
    const terA=_cjTercerosAntes211().filter(q=>q.fecha&&q.fecha<L0).length, terD=cjPagosTerceros().filter(q=>q.fecha&&q.fecha<L0).length;
    return {viejas,antesL0:enCaja.filter(d=>d<L0).length,n:enCaja.length,terA,terD}; });
  ok('fijos e impuestos de semanas pasadas ('+fi.viejas+' fechas) ya no salen en la semana actual',fi.viejas>0&&fi.antesL0===0);
  ok('cuotas de contrato de semanas pasadas tampoco ('+fi.terA+' antes → '+fi.terD+')',fi.terD===0);

  /* ---- plan a China: lo que el detailed muestra pagado se descuenta solo ---- */
  /* cuotas: 21-oct (semana pasada) 10,000 · 27-oct (esta semana) 50,000 · 6-nov 50,000; el detailed muestra 30,000 pagados después del acuerdo */
  const pl=await p.evaluate(()=>{ const c=_v3Cp('pago:eagle'), pe=_v3PlanDe(c);
    pe.versiones=pe.versiones||[]; pe.versiones.push({id:'zt',nombre:'Prueba',fecha:'2026-10-20',origen:'Acordado',estado:'activo',lineas:[{id:'zt-0',sem:'2026-10-19',fecha:'2026-10-21',monto:10000,dest:'china'},{id:'zt-1',sem:'2026-10-26',fecha:'2026-10-27',monto:50000,dest:'china'},{id:'zt-2',sem:'2026-11-02',fecha:'2026-11-06',monto:50000,dest:'china'}]});
    pe.activa='zt'; pe.enCaja=true;
    const snap=JSON.parse(JSON.stringify(ORD)); let quita=30000;
    snap.forEach(o=>(o.equipos||[]).forEach(e=>{ if(quita>0&&/Eagle/i.test(e.mfg||o.mfg||'')&&(+e.cupoPagado||0)>0){ const q=Math.min(quita,+e.cupoPagado); e.cupoPagado-=q; quita-=q; } }));
    HIST.push({id:'ZT',ts:new Date(2026,9,29,12),autor:'prueba',nEq:EQ.length,fuente:'ORDER_REPORT.xlsx + Detailed order and operational fund report OCT292026.xlsx',snapPrev:{ORD:snap}}); ZA.cache=null;
    const X=p14Calc('pago'), it=X.R.china.it[0].map(i=>i.txt);
    return {quita,a0:_v3Real()['zt-0'],a1:_v3Real()['zt-1'],g:JSON.stringify(PLANES.real||{}),w0:X.chPlan.eagle[0],w1:X.chPlan.eagle[1],ya:it.filter(t=>/^Ya salió · Eaglerise · giro del 27-oct · según el detailed/.test(t)).length,
      viejo:it.filter(t=>/21-oct/.test(t)&&!/^Ya/.test(t)).length,tot:Math.round(X.R.china.v[0])}; });
  ok('lo que el detailed muestra pagado a Eaglerise (30,000) se descuenta solo, cuota más vieja primero (21-oct 10,000 · 27-oct 20,000)',pl.quita===0&&pl.a0===10000&&pl.a1===20000);
  ok('la cuota de la semana pasada ya pagada no sale; la de esta semana queda 30,000 por pagar + 20,000 ya salió',pl.viejo===0&&pl.ya===1&&pl.w0===50000&&pl.w1===50000);
  ok('lo automático no se guarda en el estado',!/zt-/.test(pl.g));
  const rg=await p.evaluate(()=>{ const r0=z27Pagar('pago:eagle','zt-0',{m:10000,f:'2026-10-22',medio:'banco'}), r1=z27Pagar('pago:eagle','zt-1',{m:20000,f:'2026-10-28',medio:'banco'}); ZA.cache=null;
    const n0=((PLANES.reg||{})['zt-0']||[]).length, n1=((PLANES.reg||{})['zt-1']||[]).length, X=p14Calc('pago'), v0=_v3Real()['zt-0'], v1=_v3Real()['zt-1'];
    z27Quitar('zt-1',0); z27Quitar('zt-0',0); ZA.cache=null; const X2=p14Calc('pago');
    return {r:r0&&r1,n0,n1,v0,v1,w0:X.chPlan.eagle[0],w02:X2.chPlan.eagle[0],a1:_v3Real()['zt-1'],g:JSON.stringify(PLANES.real||{})}; });
  ok('si además se registra a mano, no se cuenta dos veces (misma semana: 50,000)',rg.r&&rg.n0===1&&rg.n1===1&&rg.v0===10000&&rg.v1===20000&&rg.w0===50000);
  ok('al quitar los registros vuelve lo automático y no queda nada guardado',rg.w02===50000&&rg.a1===20000&&!/zt-/.test(rg.g));
  const est=await p.evaluate(()=>{ const c=_v3Cp('pago:eagle'), L=_v3Lin(c,c.act); return _z27Est(c,L.find(l=>l.id==='zt-1'),null,true); });
  ok('en Planes la cuota sale con lo pagado y lo que falta ('+est.t+')',Math.abs(est.pag-20000)<0.01&&Math.abs(est.pend-30000)<0.01);
  const sin=await p.evaluate(()=>{ const z=HIST.find(h=>h.id==='ZT'); z.fuente='OR.xlsx + DET.xlsx'; ZA.cache=null; const a=_v3Real()['zt-0'], X=p14Calc('pago');
    z.fuente='ORDER_REPORT.xlsx + Detailed order and operational fund report OCT202026.xlsx'; ZA.cache=null; const b2=_v3Real()['zt-0'];
    HIST=HIST.filter(h=>h.id!=='ZT'); ZA.cache=null; return {a,b2,w0:X.chPlan.eagle[0]}; });
  ok('sin un detailed con corte posterior a la primera cuota no se descuenta nada (sin fecha en el nombre o corte anterior)',!sin.a&&!sin.b2&&sin.w0===60000);
  const fut=await p.evaluate(()=>{ const snap=JSON.parse(JSON.stringify(ORD)); let quita=200000;
    snap.forEach(o=>(o.equipos||[]).forEach(e=>{ if(quita>0&&/Eagle/i.test(e.mfg||o.mfg||'')&&(+e.cupoPagado||0)>0){ const q=Math.min(quita,+e.cupoPagado); e.cupoPagado-=q; quita-=q; } }));
    HIST.push({id:'ZT2',ts:new Date(2026,9,29,12),fuente:'Detailed order and operational fund report OCT292026.xlsx',snapPrev:{ORD:snap}}); ZA.cache=null;
    const r={quita,a0:_v3Real()['zt-0'],a1:_v3Real()['zt-1'],a2:_v3Real()['zt-2']}; HIST=HIST.filter(h=>h.id!=='ZT2'); ZA.cache=null; return r; });
  ok('lo pagado de más no toca las cuotas que vienen (6-nov sigue completa)',fut.quita<200000&&fut.a0===10000&&fut.a1===50000&&!fut.a2);
  await p.evaluate(()=>{ const pe=_v2Plan('pago:eagle'); pe.versiones=pe.versiones.filter(x=>x.id!=='zt'); pe.activa='a'; ZA.cache=null; });

  /* ---- gráfica de control debajo de la tabla ---- */
  await p.evaluate(()=>navTo('caja')); await p.waitForTimeout(300);
  const g=await p.evaluate(()=>{ const X=p14Calc('pago'), G=ZG.G, r=x=>Math.round(x*100)/100, t=document.getElementById('z26Caja'), gr=document.getElementById('zgGraf');
    return {hay:!!gr, despues:!!(t&&gr&&(t.compareDocumentPosition(gr)&Node.DOCUMENT_POSITION_FOLLOWING)), n:G.length, sinDia:!document.getElementById('zdSemana')&&!document.getElementById('zdTabla'),
      ok:G.every((x,i)=>Math.abs(x.entra-(X.R.ext.v[i]+X.R.sole.v[i]))<0.01&&Math.abs(x.china+x.log+x.fij+x.otros-(X.R.china.v[i]+X.R.mag.v[i]+X.R.tiba.v[i]+X.R.otros.v[i]+X.R.fij.v[i]+X.R.imp.v[i]))<0.01&&Math.abs(x.acu-X.cierre[i])<0.01),
      ley:gr?gr.querySelectorAll('.zg-ley span').length:0, hits:gr?gr.querySelectorAll('.zg-hit').length:0, hoy:document.querySelector('#v-caja .zd-hoy').textContent}; });
  ok('la gráfica va debajo de la tabla de 12 semanas y no hay tabla día a día',g.hay&&g.despues&&g.sinDia);
  ok('la gráfica tiene las mismas cifras que la Caja (entra, sale y acumulado, 12 semanas)',g.n===12&&g.ok);
  ok('leyenda con 5 rubros y el acumulado; una zona de hover por semana',g.ley===6&&g.hits===12);
  ok('la Caja dice qué día es hoy ('+g.hoy+')',g.hoy==='Hoy · viernes 30-oct-2026');
  await p.hover('#zgGraf .zg-hit[data-i="1"]'); await p.waitForTimeout(100);
  const tt=await p.evaluate(()=>{ const t=document.getElementById('zgTT'); return t&&!t.hidden?t.innerText.replace(/\s+/g,' '):''; });
  ok('al pasar el mouse muestra la semana con cada rubro',/Semana del 2-nov/.test(tt)&&/Acumulado/.test(tt)&&/Entra − sale/.test(tt));
  await p.click('#zgGraf .zg-hit[data-i="2"]'); await p.waitForTimeout(150);
  ok('clic en una semana la marca en la tabla',await p.evaluate(()=>Z26.sem===2&&document.querySelectorAll('#z26Caja th.sel').length===1));
  await p.evaluate(()=>{ Z26.sem=null; P14.mon='cop'; renderCaja(); }); await p.waitForTimeout(100);
  ok('en COP también se arma',await p.evaluate(()=>!!document.getElementById('zgGraf')&&/COP/.test(document.querySelector('#zgGraf .z-def').textContent)));
  await p.evaluate(()=>{ P14.mon='usd'; renderCaja(); });

  /* ---- fecha viva: el lunes con la página abierta desde el viernes ---- */
  const est0=await p.evaluate(()=>serializeState());
  await p.clock.setFixedTime(new Date(2026,10,2,8,0,0));
  await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange'))); await p.waitForTimeout(200);
  const dv=await p.evaluate(()=>({hoy:_p14Iso(TODAY),W0:_p14Iso(p14Calc('pago').W[0]),chip:document.getElementById('zdFecha').textContent,
    cab:document.querySelector('#v-caja .zd-hoy').textContent,th:document.querySelector('#z26Caja thead th.hoy').textContent,toast:(document.getElementById('z26Toast')||{}).textContent||''}));
  ok('al volver a la pestaña el lunes, la fecha pasa sola al 2-nov',dv.hoy==='2026-11-02'&&dv.chip==='Hoy · lun 2-nov-2026');
  ok('la Caja arranca en la semana nueva ('+dv.th+') y lo avisa',dv.W0==='2026-11-02'&&dv.th==='2-nov'&&dv.cab==='Hoy · lunes 2-nov-2026'&&/Nuevo día/.test(dv.toast));
  const a=await p.evaluate(foto);
  const p2=await ctx.newPage(); p2.on('dialog',d=>d.accept()); await p2.clock.setFixedTime(new Date(2026,10,2,8,0,0));
  await p2.goto('file://'+__dirname+'/ASM4.html'); await p2.waitForTimeout(400); await p2.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},est0);
  const fr=await p2.evaluate(foto); const dif=Object.keys(fr).filter(k=>JSON.stringify(fr[k])!==JSON.stringify(a[k]));
  ok('la Caja queda igual que si la abriera ese día'+(dif.length?' (difiere: '+dif.join(', ')+')':''),dif.length===0);
  await p2.close();
  /* si hay un diálogo abierto, espera a que se cierre para repintar */
  await p.evaluate(()=>{ z26Dialogo({t:'Prueba',x:'x',ok:'Listo'}); }); await p.waitForTimeout(100);
  await p.clock.setFixedTime(new Date(2026,10,3,8,0,0));
  const oc=await p.evaluate(()=>{ const r=zdRevisarDia(); return {r,hoy:_p14Iso(TODAY),pend:ZD.pend,cab:document.querySelector('#v-caja .zd-hoy').textContent}; });
  await p.evaluate(()=>{ const d=document.getElementById('z26Dlg'); if(d) d.remove(); zdRevisarDia(); }); await p.waitForTimeout(100);
  const oc2=await p.evaluate(()=>({pend:ZD.pend,cab:document.querySelector('#v-caja .zd-hoy').textContent}));
  ok('con un diálogo abierto mueve la fecha pero no repinta hasta cerrarlo',oc.r&&oc.hoy==='2026-11-03'&&oc.pend&&/lunes 2-nov/.test(oc.cab)&&!oc2.pend&&/martes 3-nov/.test(oc2.cab));
  ok('el Excel de planes se nombra con la fecha nueva',await p.evaluate(()=>_p14Iso(TODAY)==='2026-11-03'));
  ok('sin llaves nuevas en el estado',await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','))===llaves0);
  /* v2.11.1: un estado de cuenta con el mismo corte pero otras facturas sí entra desde un paquete; idéntico o más viejo, no */
  const vj=await p.evaluate(()=>{ const s=JSON.stringify(CXP.tiba||null); CXP.tiba={corte:'2026-11-10',tipo:'Excel',facturas:[{id:'A1',moneda:'USD',saldo:100,vence:'2026-11-03'}],anticipos:[]};
    const igual={corte:'2026-11-10',facturas:[{id:'A1',moneda:'USD',saldo:100}]}, otra={corte:'2026-11-10',facturas:[{id:'A1',moneda:'USD',saldo:100},{id:'A2',moneda:'COP',saldo:5000}]}, vieja={corte:'2026-11-03',facturas:otra.facturas};
    const r={igual:_pk24Viejo('tiba',igual),otra:_pk24Viejo('tiba',otra),vieja:_pk24Viejo('tiba',vieja)}; const ap=_pk24CxpAplicar('tiba',otra); r.n=CXP.tiba.facturas.length; r.ap=ap;
    CXP.tiba=JSON.parse(s); return r; });
  ok('estado de cuenta con el mismo corte y una factura más sí entra; igual o más viejo no',vj.igual&&!vj.otra&&vj.vieja&&vj.ap&&vj.n===2);
  /* v2.11.2: un abono adelantado (antes de la semana de la cuota, después del acuerdo) tacha la cuota; cobrar otra vez lo mismo no duplica */
  const ad=await p.evaluate(()=>{ const n='Cliente Prueba ZT'; const cps=_v3Cps(); const ext=cps.find(c=>c.dir==='c'&&c.tipo==='Contrato'); if(!ext) return {sin:true};
    const pe=_v3PlanDe(ext); pe.versiones=pe.versiones||[]; const antes=pe.activa;
    pe.versiones.push({id:'zc',nombre:'Acuerdo prueba',fecha:'2026-11-04',origen:'Acordado',estado:'activo',lineas:[{id:'zc-1',sem:'2026-11-09',fecha:'2026-11-11',monto:1234.56,dest:''}]}); pe.activa='zc'; pe.enCaja=true;
    const a={id:'ecazt1',cliente:ext.n,fecha:'2026-11-06',usd:1234.56,nota:'prueba'}; ecAbonoAplicar(ext.n,a,null); ECA.push(a);
    const c=_v3Cp(ext.id), k=_z27Cob(c), e=_z27Est(c,_v3Lin(c,'zc')[0],k,true);
    const n0=ECA.length, dup=z27Cobrar(ext.id,{m:1234.56,f:'2026-11-10'}), n1=ECA.length, otro=z27Cobrar(ext.id,{m:1234.56,f:'2026-11-20'}), n2=ECA.length;
    if(otro) _z27DesCobrar(otro); (a.aplicado||[]).forEach(x=>_ecSumar(x.k,x.i,-x.monto)); ECA=ECA.filter(x=>x.id!=='ecazt1');
    pe.versiones=pe.versiones.filter(v=>v.id!=='zc'); pe.activa=antes; return {t:e.t,pag:e.pag,dup:!!dup,n0,n1,otro:!!otro,n2,cli:ext.n}; });
  ok('un abono adelantado (6-nov, acuerdo del 4-nov, cuota del 11-nov) tacha la cuota ('+ad.t+')',!ad.sin&&ad.t==='Cobrada'&&Math.abs(ad.pag-1234.56)<0.01);
  ok('cobrar desde Planes lo mismo 4 días después no lo duplica; 14 días después sí es otro cobro',!ad.dup&&ad.n1===ad.n0&&ad.otro&&ad.n2===ad.n0+1);
  /* v2.11.2: si el navegador no trae la TRM oficial, la pide al servidor; sin oficial, usa la del abono en pesos más reciente si es más nueva que la de saldos */
  const tr=await p.evaluate(async()=>{ const hoy=_p14Iso(TODAY), sT=TRMOF; TRMOF={};
    const u=_saldoUlt(), ab=(ECA||[]).filter(a=>!a.via&&+a.trm>1000&&a.fecha&&a.fecha<=hoy).sort((a,b)=>a.fecha<b.fecha?1:-1)[0];
    const esperaAbono=!!(ab&&!(u&&+u.trm>0&&u.fecha&&u.fecha>=ab.fecha)), sin=_p16TrmFuente();
    window.google={script:{run:{withSuccessHandler(fn){ this._s=fn; return this; },withFailureHandler(fn){ this._f=fn; return this; },
      trmOficial(){ const s=this._s; setTimeout(()=>s(JSON.stringify([{valor:'3400.5',unidad:'COP',vigenciadesde:hoy+'T00:00:00.000',vigenciahasta:hoy+'T00:00:00.000'}])),10); },
      saveState(){ const s=this._s; setTimeout(()=>{ if(s) s(); },10); }, loadState(){} }}};
    let o=null, err=null; try{ o=await _neTrmTraer(); }catch(e){ err=''+e; }
    const f=_p16TrmFuente(); navTo('caja'); const cab=(document.querySelector('#v-caja .zd-trm')||{}).textContent||'';
    await new Promise(r=>setTimeout(r,50)); delete window.google; const g=TRMOF[hoy]; TRMOF=sT; ZA.cache=null;
    return {esperaAbono,sin,o,err,f,g,cab,ab:ab&&ab.trm}; });
  ok('sin TRM oficial usa la más reciente que conoce ('+tr.sin.trm+' · '+tr.sin.de+')',tr.sin.trm>1000&&(!tr.esperaAbono||(/^abono en pesos/.test(tr.sin.de)&&tr.sin.trm===+tr.ab)));
  ok('si el navegador no puede, la TRM oficial llega por el servidor y se guarda ('+(tr.o&&tr.o.v)+')',!tr.err&&tr.o&&tr.o.v===3400.5&&tr.g&&tr.g.f==='oficial'&&tr.f.trm===3400.5&&/^oficial/.test(tr.f.de));
  ok('la Caja dice qué TRM usa ('+tr.cab+')',/^TRM 3,400\.50 · oficial/.test(tr.cab));
  /* v2.11.3: paso "reaplicar" de una actualización preparada: mueve parte de un abono de una línea a otra del mismo cliente */
  const ra=await p.evaluate(()=>{ const c=_ecClientes().find(n=>_ecUnidades(n).length>=3); if(!c) return {sin:true};
    const U=_ecUnidades(c), r2=x=>Math.round(x*100)/100, a={id:'ecazt3',cliente:c,fecha:'2026-11-02',usd:r2(U[0].saldo+50),nota:'prueba'};
    ecAbonoAplicar(c,a,null); ECA.push(a); const t0=ecTotales(c).abonado, ab=k=>{ const r=_ecReg(k.k); return k.i>=0&&r.cuotas?+r.cuotas[k.i].abonado||0:+r.abonado||0; };
    const de={k:U[1].k,i:U[1].i}, hacia={k:U[2].k,i:U[2].i}, d0=ab(de), h0=ab(hacia);
    const ok1=_ztpReaplicar({cliente:c,fecha:'2026-11-02',usd:a.usd,de,a:hacia,monto:50}), d1=ab(de), h1=ab(hacia), t1=ecTotales(c).abonado;
    const ok2=_ztpReaplicar({cliente:c,fecha:'2026-11-02',usd:a.usd,de,a:hacia,monto:50});
    const ap=JSON.stringify(a.aplicado); (a.aplicado||[]).forEach(x=>_ecSumar(x.k,x.i,-x.monto)); ECA=ECA.filter(x=>x.id!=='ecazt3');
    return {ok1,ok2,dd:r2(d0-d1),dh:r2(h1-h0),t:r2(t1-t0),ap,usd:a.usd}; });
  ok('mover 50 de un abono de una línea a otra: el total del abono y lo pagado no cambian; no se repite',!ra.sin&&ra.ok1&&!ra.ok2&&ra.dd===50&&ra.dh===50&&Math.abs(ra.t)<0.01);
  ok('sin errores de página',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK'+(f?' · '+f+' con falla':'')); await b.close(); process.exitCode=f?1:0;
})();
