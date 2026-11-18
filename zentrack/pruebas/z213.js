/* v2.13 · Planes por cuotas.
   Hoy fijado en 30-oct-2026 (viernes). Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo). Cifras inventadas.
   - Planes abre en "Cuotas": lista de clientes y proveedores y las cuotas del que tiene la pendiente más vieja; 12 semanas a un clic.
   - Agregar una cuota (fecha, concepto, monto, Enter) la pone en la Caja.
   - Una cuota en pesos vale en US$ con la TRM del día (y cambia si cambia la TRM).
   - Moverla corrige el mismo acuerdo y deja nota ("12-nov → 19-nov · cambiado el 30-oct"); Deshacer la devuelve.
   - Marcar varias y correrlas una semana; quitar con ✕; Deshacer.
   - China: solo en dólares; un automático se ve sin editar y se puede volver plan propio.
   - Desde otras pantallas, "Abrir en Planes" cae en las cuotas de esa contraparte.
   - Excel: bajar y subir sin cambios no cambia nada aunque la TRM se mueva; subir con cambios conserva concepto y pesos.
   - Paso "cuotaCop" de una actualización preparada; estado viejo abre; sin llaves nuevas. */
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
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} TRMOF['2026-10-30']={v:3500.25,f:'oficial',desde:'2026-10-30',hasta:'2026-11-03'}; }); await p.waitForTimeout(200);
  const llaves0=await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','));
  await p.evaluate(()=>{ window._q=id=>'[data-id="'+CSS.escape(id)+'"]'; window._w=()=>new Promise(r=>setTimeout(r,60)); });

  /* ---- abre en Cuotas ---- */
  await p.evaluate(()=>navTo('planes')); await p.waitForTimeout(250);
  const a=await p.evaluate(()=>{ const M=_v3Fichas(); let best=null;
    M.C.forEach(c=>{ const r=_z213Res(c); if(r.V.edit&&r.prox&&(!best||r.prox.l.f<best.f)) best={id:c.id,f:r.prox.l.f}; });
    return {hub:!!document.getElementById('z13Hub'),grid:!!document.getElementById('z26Plan'),n:document.querySelectorAll('.z13-cp').length,nC:M.C.length,
      grupos:[...document.querySelectorAll('.z13-g')].map(x=>x.textContent).join('|'),sel:Z213.cp,best:best&&best.id,on:(document.querySelector('.z13-cp.on')||{dataset:{}}).dataset.cp}; });
  ok('Planes abre en Cuotas: '+a.n+' contrapartes en '+a.grupos+', sin la tabla de 12 semanas',a.hub&&!a.grid&&a.n===a.nC&&a.grupos==='Me pagan|Le pago');
  ok('abre en la que tiene la cuota pendiente más vieja ('+a.sel+')',!!a.sel&&a.sel===a.best&&a.on===a.sel);
  await p.click('#v-planes [data-h="vista"][data-v="12"]'); await p.waitForTimeout(200);
  const t12=await p.evaluate(()=>({grid:!!document.getElementById('z26Plan'),hub:!!document.getElementById('z13Hub'),seg:!!document.querySelector('#v-planes [data-h="vista"][data-v="cuotas"]')}));
  await p.click('#v-planes [data-h="vista"][data-v="cuotas"]'); await p.waitForTimeout(200);
  ok('la tabla de 12 semanas queda a un clic, y se vuelve',t12.grid&&!t12.hub&&t12.seg&&await p.evaluate(()=>!!document.getElementById('z13Hub')));

  /* ---- agregar una cuota ---- */
  await p.click('.z13-cp[data-cp="cobro:Solenium"]'); await p.waitForTimeout(150);
  const s0=await p.evaluate(()=>{ window._sole=()=>p14Calc('pago').R.sole.v.slice(); window._t0=_sole(); window._dif=()=>_sole().map((v,i)=>Math.round((v-window._t0[i])*100)/100);
    return {planes:PLANES.planes.length,vers:JSON.stringify((_v2Plan('cobro:Solenium')||{}).versiones||[])}; });
  await p.fill('form[data-h="add"] [data-a="f"]','2026-11-12');
  await p.fill('form[data-h="add"] [data-a="c"]','Trackers de prueba');
  await p.fill('form[data-h="add"] [data-a="m"]','1000');
  await p.press('form[data-h="add"] [data-a="m"]','Enter'); await p.waitForTimeout(200);
  const ad=await p.evaluate(()=>{ const c=_v3Cp('cobro:Solenium'), l=_v3Lin(c,c.act).find(x=>x.c==='Trackers de prueba'); window._lid=l&&l.id;
    return {l:!!l&&l.f==='2026-11-12'&&Math.abs(l.m-1000)<0.01,d:_dif(),fila:!!(l&&document.querySelector('#z13Det tr'+_q(l.id)))}; });
  ok('agregar con fecha, concepto, monto y Enter: la cuota aparece y la Caja suma 1,000 en su semana ('+ad.d.join(',')+')',ad.l&&ad.fila&&ad.d[2]===1000&&ad.d.filter(x=>Math.abs(x)>0.005).length===1);

  /* ---- en pesos ---- */
  await p.evaluate(async()=>{ const s=document.querySelector('#z13Det select[data-h="mon"]'+_q(window._lid)); s.value='COP'; s.dispatchEvent(new Event('change',{bubbles:true})); await _w(); });
  const c1=await p.evaluate(()=>{ const x=PROM.find(y=>y.id===window._lid), l=_v3Lin(_v3Cp('cobro:Solenium'),'a').find(y=>y.id===window._lid), i=document.querySelector('#z13Det input[data-h="m"]'+_q(window._lid));
    return {mon:x.mon,cop:x.cop,usd:l.m,txt:i&&i.value}; });
  ok('pasar a pesos: COP '+c1.txt+' (1,000 × TRM 3,500.25) y sigue valiendo US$ '+c1.usd,c1.mon==='COP'&&c1.cop===3500250&&Math.abs(c1.usd-1000)<0.01&&c1.txt==='3,500,250');
  await p.evaluate(async()=>{ const i=document.querySelector('#z13Det input[data-h="m"]'+_q(window._lid)); i.value='7.000.500'; i.dispatchEvent(new Event('change',{bubbles:true})); await _w(); });
  const c2=await p.evaluate(()=>{ const u=()=>_v3Lin(_v3Cp('cobro:Solenium'),'a').find(y=>y.id===window._lid).m, usd1=u(), d1=_dif()[2];
    TRMOF['2026-10-30'].v=3000.5; const usd2=u(), d2=_dif()[2]; TRMOF['2026-10-30'].v=3500.25;
    const tx=document.querySelector('#z13Det tr'+_q(window._lid)).textContent;
    return {usd1,d1,usd2,d2,esp2:Math.round(7000500/3000.5*100)/100,trm:/TRM 3,500\.25/.test(tx)}; });
  ok('COP 7,000,500 = US$ '+c2.usd1+' en la Caja; si la TRM del día baja a 3,000.50 vale '+c2.usd2,Math.abs(c2.usd1-2000)<0.01&&Math.abs(c2.d1-2000)<0.01&&Math.abs(c2.usd2-c2.esp2)<0.01&&Math.abs(c2.d2-c2.esp2)<0.02&&c2.trm);

  /* ---- mover: el mismo acuerdo, con nota ---- */
  await p.evaluate(async()=>{ const i=document.querySelector('#z13Det input[data-h="f"]'+_q(window._lid)); i.value='2026-11-19'; i.dispatchEvent(new Event('change',{bubbles:true})); await _w(); });
  const mv=await p.evaluate(s0=>{ const c=_v3Cp('cobro:Solenium'), l=_v3Lin(c,c.act).find(y=>y.id===window._lid), d=_dif();
    const tr=document.querySelector('#z13Det tr'+_q(window._lid)), nota=tr&&tr.querySelector('.z13-nota'), lg=document.querySelector('#z13Det details.z13-log');
    return {f:l&&l.f,act:c.act,igual:PLANES.planes.length===s0.planes&&JSON.stringify((_v2Plan('cobro:Solenium')||{}).versiones||[])===s0.vers,d2:d[2],d3:d[3],
      nota:nota&&nota.textContent,log:lg&&lg.textContent,toast:(document.getElementById('z26Toast')||{}).textContent||''}; },s0);
  ok('mover la fecha corrige el mismo acuerdo (sin versión nueva) y la Caja pasa la cuota de semana ('+mv.d2+' → '+mv.d3+')',mv.f==='2026-11-19'&&mv.act==='a'&&mv.igual&&Math.abs(mv.d2)<0.01&&Math.abs(mv.d3-2000)<0.01);
  ok('queda la nota debajo de la cuota ("'+mv.nota+'") y en Cambios',mv.nota==='12-nov → 19-nov · cambiado el 30-oct'&&/Cambios \(\d+\)/.test(mv.log||'')&&/cuota nueva/.test(mv.log||'')&&/pasó a pesos/.test(mv.log||''));
  await p.evaluate(async()=>{ z26Deshacer(); await _w(); });
  ok('Deshacer la devuelve al 12-nov',/Deshacer/.test(mv.toast)&&await p.evaluate(()=>_v3Lin(_v3Cp('cobro:Solenium'),'a').find(y=>y.id===window._lid).f==='2026-11-12'));

  /* ---- marcar varias ---- */
  const bk=await p.evaluate(async()=>{ const c=_v3Cp('cobro:Solenium'), fut=_z27Vista(c).L.filter(x=>x.e.pend>0.5&&!x.e.past).slice(0,2).map(x=>({id:x.l.id,f:x.l.f}));
    for(const o of fut){ document.querySelector('#z13Det input[data-h="mk"]'+_q(o.id)).click(); await _w(); }
    const bar=document.querySelector('#z13Det .z13-bulk'), txt=bar&&bar.textContent; document.querySelector('#z13Det [data-h="b"][data-b="c7"]').click(); await _w();
    const L=_v3Lin(_v3Cp('cobro:Solenium'),'a'), nf=fut.map(o=>(L.find(y=>y.id===o.id)||{}).f), esp=fut.map(o=>_p14Iso(addD(_p14D(o.f),7)));
    z26Deshacer(); await _w(); const L2=_v3Lin(_v3Cp('cobro:Solenium'),'a');
    return {n:fut.length,txt,bien:nf.join()===esp.join(),nf,back:fut.every(o=>(L2.find(y=>y.id===o.id)||{}).f===o.f),marc:Object.keys(Z213.marc).length}; });
  ok('marcar 2 y "Correr 1 semana": las dos pasan una semana ('+bk.nf.join(', ')+'); Deshacer las devuelve',bk.n===2&&/2 marcadas/.test(bk.txt||'')&&bk.bien&&bk.back&&bk.marc===0);
  const dl=await p.evaluate(async()=>{ document.querySelector('#z13Det [data-h="del"]'+_q(window._lid)).click(); await _w();
    const fuera=!PROM.some(y=>y.id===window._lid)&&!document.querySelector('#z13Det tr'+_q(window._lid)); z26Deshacer(); await _w(); const x=PROM.find(y=>y.id===window._lid);
    return {fuera,vuelve:!!x&&x.mon==='COP'&&x.cop===7000500}; });
  ok('✕ quita la cuota y Deshacer la trae con sus pesos',dl.fuera&&dl.vuelve);
  const sb=await p.evaluate(()=>{ const rows=[...document.querySelectorAll('#z13Det table.z13-t tbody tr')], num=t=>+(''+(t||'')).replace(/[^\d.-]/g,'')||0; let bad=0, cur=null, s=0, k=0;
    const fin=()=>{ if(cur!=null&&Math.abs(cur-s)>1+k*0.5) bad++; };
    rows.forEach(tr=>{ if(tr.classList.contains('wk')){ fin(); cur=num(tr.querySelector('td.n').textContent); s=0; k=0; } else if(tr.dataset.id){ s+=num(tr.querySelectorAll('td.n')[1].querySelector('b').textContent); k++; } }); fin();
    return {bad,wk:rows.filter(r=>r.classList.contains('wk')).length}; });
  ok('cada semana trae su subtotal en US$ ('+sb.wk+' semanas)',sb.wk>1&&sb.bad===0);
  await p.click('#z13Det [data-h="dr"]'); await p.waitForTimeout(150);
  ok('"Historial y más" abre el panel del acuerdo',await p.evaluate(()=>{ const d=document.getElementById('z26Dr'), r=!!d&&/Solenium/.test(d.textContent); z26Cerrar(); return r; }));

  /* ---- China: solo en dólares; mover un giro ---- */
  await p.click('.z13-cp[data-cp="pago:eagle"]'); await p.waitForTimeout(150);
  const eg=await p.evaluate(async()=>{ const det=document.getElementById('z13Det'), sinCop=!det.querySelector('select[data-h="mon"]')&&!det.querySelector('select[data-a="mon"]')&&!!det.querySelector('.z13-usd'), sinCon=!det.querySelector('input[data-h="c"]');
    const c=_v3Cp('pago:eagle'), x=_z27Vista(c).L.find(y=>y.e.pend>0.5&&!y.e.past); if(!x) return {sinCop,sinCon};
    const n2=_p14Iso(addD(_p14D(x.l.f),7)), i=det.querySelector('input[data-h="f"]'+_q(x.l.id)); i.value=n2; i.dispatchEvent(new Event('change',{bubbles:true})); await _w();
    const pcOk=+(_pcVal(n2)[c.prov]||0)>=x.l.m-0.01, nota=[...document.querySelectorAll('#z13Det .z13-nota')].some(y=>/→/.test(y.textContent)&&/cambiado el 30-oct/.test(y.textContent));
    z26Deshacer(); await _w(); return {sinCop,sinCon,pcOk,nota,x:true}; });
  ok('Eaglerise (giros a China): solo en dólares y sin concepto; mover un giro lo pasa de fecha con su nota',eg.x&&eg.sinCop&&eg.sinCon&&eg.pcOk&&eg.nota);
  await p.click('.z13-cp[data-cp="cobro:Enexa S.A.S"]'); await p.waitForTimeout(150);
  const au=await p.evaluate(async()=>{ const det=document.getElementById('z13Det'), ro=!det.querySelector('input[data-h="f"]')&&!det.querySelector('form[data-h="add"]'), bt=det.querySelector('[data-h="propio"]'); if(!bt) return {ro};
    bt.click(); await _w(); const ed=_v3Cp('cobro:Enexa S.A.S').act!=='base'&&!!document.querySelector('#z13Det input[data-h="f"]')&&!!document.querySelector('#z13Det form[data-h="add"]');
    z26Deshacer(); await _w(); return {ro,bt:true,ed,back:_v3Cp('cobro:Enexa S.A.S').act==='base'}; });
  ok('un automático (contrato de Enexa) se ve sin editar; "Hacer plan propio" lo vuelve editable; Deshacer',au.ro&&au.bt&&au.ed&&au.back);
  const va=await p.evaluate(()=>{ navTo('caja'); v3Abrir('pago:nexus'); const on=document.querySelector('.z13-cp.on');
    return {vis:document.getElementById('v-planes').classList.contains('on'),sel:Z213.cp,on:on&&on.dataset.cp,dr:!!document.getElementById('z26Dr')}; });
  ok('"Abrir en Planes" desde otra pantalla cae en las cuotas de esa contraparte',va.vis&&va.sel==='pago:nexus'&&va.on==='pago:nexus'&&!va.dr);

  /* ---- Excel de planes ---- */
  const xl=await p.evaluate(()=>{ const wb=XLSX.read(new Uint8Array(XLSX.write(zpxLibro(),{type:'array',bookType:'xlsx'})),{type:'array'});
    TRMOF['2026-10-30'].v=3400; const X=zpxComparar(wb); TRMOF['2026-10-30'].v=3500.25; return {n:X.n,pl:X.planes.map(P=>P.c.id).join(',')}; });
  ok('Excel: bajarlo y subirlo sin cambios no cambia nada aunque la TRM se mueva entre tanto ('+xl.n+' '+xl.pl+')',xl.n===0);
  const xc=await p.evaluate(()=>{ const wb=XLSX.read(new Uint8Array(XLSX.write(zpxLibro(),{type:'array',bookType:'xlsx'})),{type:'array'});
    const Co=XLSX.utils.sheet_to_json(wb.Sheets['Cobros'],{header:1,raw:true,defval:''}), cod=r=>(''+r[9]).split('|').slice(2).join('|');
    const otra=Co.find((r,i)=>i>0&&r[0]==='Solenium'&&r[2]&&cod(r)!==window._lid&&r[2]>_zpxSerial(_p14Iso(TODAY))); otra[2]+=7; wb.Sheets['Cobros']=XLSX.utils.aoa_to_sheet(Co);
    const X=zpxComparar(wb); ZPX.prev=X; zpxAplicar(); const c=_v3Cp('cobro:Solenium'), v=((_v2Plan('cobro:Solenium')||{}).versiones||[]).find(y=>y.id===c.act), raw=v&&v.lineas.find(y=>y.id===window._lid);
    return {act:c.act,mon:raw&&raw.mon,cop:raw&&raw.cop,dest:raw&&raw.dest}; });
  ok('Excel con otra cuota movida: acuerdo nuevo ('+xc.act+'); la cuota en pesos sigue en pesos y con su concepto',xc.act!=='a'&&xc.mon==='COP'&&xc.cop===7000500&&xc.dest==='Trackers de prueba');

  /* ---- actualización preparada: cuotaCop ---- */
  const cc=await p.evaluate(()=>{ const c=_v3Cp('cobro:Solenium'), l=_v3Lin(c,c.act).find(y=>y.mon!=='COP'&&y.f>_p14Iso(TODAY)); const paso={cp:c.id,v:c.act,id:l.id,cop:5000000,con:'Magnum y TIBA'};
    const r1=_ztpCuotaCop(paso), r2=_ztpCuotaCop(paso), l2=_v3Lin(_v3Cp(c.id),c.act).find(y=>y.id===l.id); return {r1,r2,mon:l2.mon,cop:l2.cop,c:l2.c,m:l2.m,esp:Math.round(5000000/3500.25*100)/100}; });
  ok('paso "cuotaCop" de una actualización: pasa la cuota a pesos una sola vez (US$ '+cc.m+')',cc.r1===true&&cc.r2===false&&cc.mon==='COP'&&cc.cop===5000000&&cc.c==='Magnum y TIBA'&&Math.abs(cc.m-cc.esp)<0.01);

  /* ---- lo de siempre ---- */
  const fz=await p.evaluate(()=>{ navTo('planes'); const bad=[]; document.querySelectorAll('#v-planes *').forEach(e=>{ if(e.closest('svg')||e.childElementCount) return; const s=parseFloat(getComputedStyle(e).fontSize); if(e.textContent.trim()&&s<13) bad.push(e.tagName+':'+e.textContent.slice(0,20)); }); return bad; });
  ok('letra mínima 13 px en Planes'+(fz.length?' · '+fz.slice(0,3).join(' · '):''),fz.length===0);
  ok('sin llaves nuevas en el estado',await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','))===llaves0);
  ok('un estado viejo abre igual en Planes',await p.evaluate(s=>{ try{ applyState(JSON.parse(s)); refreshAll(); navTo('planes'); return !!document.getElementById('z13Hub'); }catch(e){ return false; } },fs.readFileSync(__dirname+'/RESP.json','utf8')));
  ok('sin errores de página'+(errs.length?' · '+errs.slice(0,2).join(' · '):''),errs.length===0);
  console.log('\n'+n+' OK'+(f?' · '+f+' con falla':''));
  await b.close(); process.exit(f?1:0);
})();
