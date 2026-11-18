/* v2.13.2 · Arreglos de la auditoría del 18-nov-2026 en Planes.
   Hoy fijado en 30-oct-2026 (viernes), TRM oficial 4,000. Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo). Cifras inventadas.
   - "Cobrado" en una cuota tacha esa cuota (no la más vieja) y no deja cobrarla dos veces.
   - Una cuota en pesos cobrada o pagada no vuelve a quedar pendiente si la TRM cambia (cliente y proveedor).
   - Correr varios giros de China no los junta; las acciones de varias no tocan las pagadas.
   - Una fecha escrita con el teclado se guarda una sola vez, al salir de la casilla.
   - Las cuotas en pesos no se vuelven dólares (fila de agregar, Excel, Acuerdo nuevo).
   - Desmarcar un abono registrado en el estado de cuenta; nota limpia en el PDF; avisos sin "Cancelar"; paso cuotaCop con guarda. */
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
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} TRMOF['2026-10-30']={v:4000,f:'oficial',desde:'2026-10-30',hasta:'2026-11-03'};
    window._q=id=>'[data-id="'+CSS.escape(id)+'"]'; window._w=()=>new Promise(r=>setTimeout(r,60));
    window._est=(cp,id)=>{ const x=_z27Vista(_v3Cp(cp)).L.find(y=>y.l.id===id); return x?{t:x.e.t,pag:Math.round(x.e.pag*100)/100,pend:Math.round(x.e.pend*100)/100,m:x.l.m,f:x.l.f}:null; }; });
  const llaves0=await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','));

  /* ---- "Cobrado" en una cuota que no es la más vieja: tacha esa ---- */
  const A=await p.evaluate(async()=>{ let c=_v3Cp('cobro:Solenium');
    const v=_z27Crear(c,[{f:'2026-10-27',m:5000,c:'A vieja'},{f:'2026-11-03',m:10000,c:'B'}],'prueba',true); c=_v3Cp('cobro:Solenium');
    window._A=v.lineas[0].id; window._B=v.lineas[1].id; const n0=ECA.length, s0=(ecTotales('Solenium')||{}).saldo;
    navTo('planes'); Z213.vista='cuotas'; Z213.cp=c.id; Z213.marc={}; renderPlanes(); await _w();
    document.querySelector('#z13Det [data-h="cob"]'+_q(_B)).click(); await _w();
    const m=document.querySelector('#z13Det .z-reg [data-yr="m"]').value;
    document.querySelector('#z13Det .z-reg [data-y="cbOk"]').click(); await _w(); await _w();
    const a=ECA[ECA.length-1];
    return {m,nuevos:ECA.length-n0,usd:a.usd,cuota:a.cuota===_B,nota:a.nota,A:_est(c.id,_A),B:_est(c.id,_B),btnB:!!document.querySelector('#z13Det [data-h="cob"]'+_q(_B)),
      baja:Math.round((s0-(ecTotales('Solenium')||{}).saldo)*100)/100}; });
  ok('"Cobrado" en la cuota B (con la A más vieja pendiente) tacha la B, no la A',A.B&&A.B.t==='Cobrada'&&A.A&&A.A.pend===5000&&A.cuota);
  ok('la B ya no trae "Cobrado": no se puede cobrar dos veces (un solo abono de 10,000)',!A.btnB&&A.nuevos===1&&A.usd===10000&&A.m==='10,000');
  ok('el estado de cuenta baja lo mismo (10,000) y la nota no dice "Cobro del plan"',A.baja===10000&&!/Cobro del plan/.test(A.nota||''));

  /* ---- cuota en pesos cobrada: la TRM que se mueve no la reabre ---- */
  const C=await p.evaluate(async()=>{ let c=_v3Cp('cobro:Solenium');
    window._C=_v3LinAdd(c,c.act,'2026-11-10',1,'en pesos'); _v3LinSet(c,c.act,_C,'cop',42000000);
    window._D=_v3LinAdd(c,c.act,'2026-11-17',5000,'D'); c=_v3Cp('cobro:Solenium'); renderPlanes(); await _w();
    document.querySelector('#z13Det [data-h="cob"]'+_q(_C)).click(); await _w();
    const g=k=>document.querySelector('#z13Det .z-reg [data-yr="'+k+'"]').value, form={m:g('m'),mon:g('mon'),trm:g('trm')};
    document.querySelector('#z13Det .z-reg [data-y="cbOk"]').click(); await _w(); await _w();
    const r0=_est(c.id,_C), cajaIds=()=>(_v3Act(_v3Cp('cobro:Solenium'))||[]).map(l=>l.id);
    TRMOF['2026-10-30'].v=3800; const r1=_est(c.id,_C), d1=_est(c.id,_D), k1=cajaIds();
    TRMOF['2026-10-30'].v=4400; const r2=_est(c.id,_C), d2=_est(c.id,_D), k2=cajaIds();
    TRMOF['2026-10-30'].v=4000;
    const ab=ECA[ECA.length-1];
    return {form,ab:{cop:ab.cop,trm:ab.trm,usd:ab.usd,cuota:ab.cuota===_C},r0,r1,r2,d1,d2,enCaja:k1.indexOf(_C)>=0||k2.indexOf(_C)>=0}; });
  ok('"Registrar cobro" de una cuota en pesos abre en pesos, con lo que falta y la TRM del día',C.form.mon==='COP'&&C.form.m==='42,000,000'&&+C.form.trm===4000);
  ok('el abono queda en pesos (COP 42,000,000 a 4,000 = US$ 10,500) y amarrado a la cuota',C.ab.cop===42000000&&C.ab.trm===4000&&C.ab.usd===10500&&C.ab.cuota);
  ok('con la TRM en 3,800 la cuota sigue Cobrada (no reabre US$ 553) y no vuelve a la Caja',C.r1.t==='Cobrada'&&C.r1.pend===0&&C.r1.m===10500&&!C.enCaja);
  ok('con la TRM en 4,400 la cuota sigue Cobrada y lo de más no tacha la cuota siguiente',C.r2.t==='Cobrada'&&C.d2.pag===0&&C.d1.pag===0);

  /* ---- cuota en pesos pagada a un proveedor: igual ---- */
  const P=await p.evaluate(async()=>{ let c=_v3Cp('pago:otros');
    const v=_z27Crear(c,[{f:'2026-11-04',m:10000,c:'Prueba'},{f:'2026-11-20',m:3000,c:'Otra'}],'t',true); c=_v3Cp('pago:otros');
    window._P=v.lineas[0].id; window._P2=v.lineas[1].id; _v3LinSet(c,c.act,_P,'cop',40000000); c=_v3Cp('pago:otros');
    const l0=_v3Lin(c,c.act).find(x=>x.id===_P); z27Pagar(c.id,_P,{m:l0.m,f:'2026-10-30',medio:'banco'});
    const reg=(PLANES.reg[_P]||[])[0]||{};
    TRMOF['2026-10-30'].v=3800; c=_v3Cp('pago:otros'); const r1=_est(c.id,_P), caja=(_v3Act(c)||[]).some(x=>x.id===_P);
    TRMOF['2026-10-30'].v=4000; return {trm:reg.trm,r1,caja}; });
  ok('un pago registrado guarda la TRM de su día',P.trm===4000);
  ok('cuota en pesos pagada al proveedor: con la TRM en 3,800 sigue Pagada y fuera de la Caja',P.r1.t==='Pagada'&&P.r1.pend===0&&!P.caja);

  /* ---- varias a la vez: no toca las pagadas; "Marcar todas" solo marca las pendientes ---- */
  const V=await p.evaluate(async()=>{ const c=_v3Cp('pago:otros'); Z213.cp=c.id; Z213.marc={}; renderPlanes(); await _w();
    document.querySelector('#z13Det input[data-h="all"]').click(); await _w(); await _w();
    const marc=Object.keys(Z213.marc), f0=_est(c.id,_P).f, g0=_est(c.id,_P2).f;
    Z213.marc[_P]=1; renderPlanes(); await _w();
    document.querySelector('#z13Det [data-h="b"][data-b="c7"]').click(); await _w(); await _w();
    const t=(document.getElementById('z26Toast')||{}).textContent||'';
    return {marcPag:marc.indexOf(_P)>=0,marcPend:marc.indexOf(_P2)>=0,fPag:_est(c.id,_P).f===f0,fPend:_est(c.id,_P2).f,g0,t}; });
  ok('"Marcar todas" no marca la cuota ya pagada',!V.marcPag&&V.marcPend);
  ok('"Correr 1 semana" con una pagada marcada: la pagada no se mueve y el aviso lo dice',V.fPag&&V.fPend==='2026-11-27'&&/ya pagada no se tocó/.test(V.t));

  /* ---- giros a China: correr varios no los junta ---- */
  const G=await p.evaluate(async()=>{ const p0=_v3PlanDe(_v3Cp('pago:eagle')); p0.activa='a';
    Object.keys(PLANCHINA).forEach(k=>{ const o=Object.assign({},_pcVal(k)); delete o.eagle; if(Object.keys(o).length) PLANCHINA[k]=o; else delete PLANCHINA[k]; });
    ['2026-11-02','2026-11-09','2026-11-16','2026-11-23'].forEach(iso=>{ const o=Object.assign({},_pcVal(iso)); o.eagle=50000; PLANCHINA[iso]=o; });
    Z213.cp='pago:eagle'; Z213.marc={}; renderPlanes(); await _w();
    const fot=()=>_v3Lin(_v3Cp('pago:eagle'),'a').map(l=>l.f+':'+l.m).sort().join(' ');
    const antes=fot(); document.querySelector('#z13Det input[data-h="all"]').click(); await _w(); await _w();
    document.querySelector('#z13Det [data-h="b"][data-b="c7"]').click(); await _w(); await _w(); const corr=fot();
    z26Deshacer(); await _w(); const des=fot();
    Z213.marc={}; _v3Lin(_v3Cp('pago:eagle'),'a').forEach(l=>{ Z213.marc[l.id]=1; }); renderPlanes(); await _w();
    document.querySelector('#z13Det [data-h="b"][data-b="c-7"]').click(); await _w(); await _w(); const adel=fot(); z26Deshacer(); await _w();
    return {antes,corr,des,adel}; });
  ok('correr 1 semana 4 giros de 50,000: quedan 4 giros (9, 16, 23 y 30-nov), no uno de 200,000',G.corr==='2026-11-09:50000 2026-11-16:50000 2026-11-23:50000 2026-11-30:50000');
  ok('adelantar 1 semana tampoco los junta (siguen 4 giros de 50,000) y Deshacer devuelve todo',G.des===G.antes&&G.adel.split(' ').length===4&&G.adel.split(' ').every(x=>/:50000$/.test(x)));

  /* ---- fecha escrita con el teclado: se guarda una vez, al salir ---- */
  await p.evaluate(async()=>{ const c=_v3Cp('pago:otros'); Z213.cp=c.id; Z213.marc={}; renderPlanes(); await _w();
    window._f0=_est(c.id,_P2).f; window._lg0=((_v2Plan(c.id)||{}).log||[]).length; });
  await p.focus('#z13Det input[data-h="f"]'+await p.evaluate(()=>_q(window._P2)));
  await p.keyboard.type('1'); await p.waitForTimeout(150); await p.keyboard.type('2'); await p.waitForTimeout(150);
  const K1=await p.evaluate(()=>{ const c=_v3Cp('pago:otros'), a=document.activeElement; return {f:_est(c.id,_P2).f,lg:((_v2Plan(c.id)||{}).log||[]).length-_lg0,foco:!!a&&a.dataset&&a.dataset.h==='f'}; });
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  const K2=await p.evaluate(()=>{ const c=_v3Cp('pago:otros'); return {f:_est(c.id,_P2).f,lg:((_v2Plan(c.id)||{}).log||[]).length-_lg0}; });
  const K3=await p.evaluate(async()=>{ z26Deshacer(); await _w(); return _est('pago:otros',_P2).f; });
  ok('escribiendo la fecha no se guarda nada a mitad (y el cursor sigue en la casilla)',K1.f===await p.evaluate(()=>_f0)&&K1.lg===0&&K1.foco);
  ok('con Enter (o al salir de la casilla) se guarda una sola vez, y Deshacer vuelve a la fecha de antes',K2.f!==await p.evaluate(()=>_f0)&&K2.lg===1&&K3===await p.evaluate(()=>_f0));

  await p.focus('#z13Det input[data-h="f"]'+await p.evaluate(()=>_q(window._P2)));
  await p.keyboard.type('1'); await p.waitForTimeout(100); await p.keyboard.type('5'); await p.waitForTimeout(100);
  await p.click('#z13Det h3'); await p.waitForTimeout(250);
  const K4=await p.evaluate(async()=>{ const c=_v3Cp('pago:otros'), r={f:_est(c.id,_P2).f,lg:((_v2Plan(c.id)||{}).log||[]).length-_lg0}; z26Deshacer(); await _w(); r.des=_est(c.id,_P2).f; return r; });
  ok('escribir la fecha y hacer clic en otra parte también la guarda una vez (Deshacer la devuelve)',K4.f!==await p.evaluate(()=>_f0)&&K4.lg===1&&K4.des===await p.evaluate(()=>_f0));

  /* ---- la fila de agregar recuerda la moneda ---- */
  const D=await p.evaluate(async()=>{ const c=_v3Cp('pago:otros'); renderPlanes(); await _w();
    const fm=document.querySelector('#z13Det form[data-h="add"]'); fm.querySelector('[data-a="mon"]').value='COP'; fm.querySelector('[data-a="m"]').value='20,000,000'; fm.querySelector('[data-a="c"]').value='uno';
    fm.requestSubmit(); await _w(); await _w(); return document.querySelector('#z13Det form[data-h="add"] [data-a="mon"]').value; });
  ok('después de agregar una cuota en pesos, la fila de agregar sigue en pesos',D==='COP');

  /* ---- Excel: cambiar la fecha de una cuota en pesos (con la TRM movida) la deja en pesos ---- */
  const E=await p.evaluate(async()=>{ let c=_v3Cp('pago:otros'); const x=_v3Lin(c,c.act).find(l=>l.mon==='COP'&&l.f==='2026-11-06');
    if(!x) return null; const wb=zpxLibro(), ws=wb.Sheets['Pagos'], rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:''});
    const ri=rows.findIndex(r=>r.some(v=>(''+v).endsWith('|'+x.id))); const a=XLSX.utils.encode_cell({r:ri,c:2}); ws[a].v=ws[a].v+7;
    TRMOF['2026-10-30'].v=3950; const X=zpxComparar(wb); ZPX.prev=X; zpxAplicar(); c=_v3Cp('pago:otros');
    const y=_v3Lin(c,c.act).find(l=>l.c==='uno'); TRMOF['2026-10-30'].v=4000; return y?{f:y.f,mon:y.mon,cop:y.cop}:'sin'; });
  ok('Excel: la cuota en pesos movida una semana sigue en pesos (COP 20,000,000)',!!E&&E.mon==='COP'&&E.cop===20000000&&E.f==='2026-11-13');

  /* ---- Acuerdo nuevo que conserva las que no vencen: las de pesos siguen en pesos ---- */
  const F=await p.evaluate(async()=>{ let c=_v3Cp('pago:otros'); const id=_v3LinAdd(c,c.act,'2026-12-10',1,'futura COP'); _v3LinSet(c,c.act,id,'cop',20000000); c=_v3Cp('pago:otros');
    _z27GenAbrir(c,'reneg'); const g=Z27.gen; g.n='1'; g.total=0; const L=_z27GenLin(c,g); _z27Crear(c,L,'nuevo',true); Z27.gen=null;
    c=_v3Cp('pago:otros'); const y=_v3Lin(c,c.act).find(l=>l.f==='2026-12-10'); return {keep:g.keep,mon:y&&y.mon,cop:y&&y.cop}; });
  ok('"Acuerdo nuevo" conservando las que no vencen: la cuota en pesos sigue en pesos',F.keep&&F.mon==='COP'&&F.cop===20000000);

  /* ---- Desmarcar un abono registrado en el estado de cuenta ---- */
  const J=await p.evaluate(async()=>{ const c=_v3Cp('cobro:Solenium'); Z213.cp=c.id; Z27.pg=null; renderPlanes(); await _w();
    const n0=ECA.length; z27Cobrar(c.id,{m:5000,f:'2026-10-30',nota:'transferencia'}); const a=ECA[ECA.length-1]; renderPlanes(); await _w();
    const est=_est(c.id,_A), btn=document.querySelector('#z13Det [data-h="desm"]'+_q(_A)); if(!btn) return {est,btn:false,sinAmarre:!a.cuota};
    btn.click(); await _w(); const dlg=document.querySelector('#z26Dlg'), txt=dlg?dlg.textContent:'';
    dlg.querySelector('[data-r="1"]').click(); await _w(); await _w();
    const despues=_est(c.id,_A), sale=!ECA.some(x=>x.id===a.id);
    z26Deshacer(); await _w(); return {est,btn:true,sinAmarre:!a.cuota,txt,despues,sale,vuelve:ECA.some(x=>x.id===a.id)&&_est(c.id,_A).t==='Cobrada'}; });
  ok('un abono registrado sin amarre tacha la cuota A y en Planes sale "Desmarcar"',J.sinAmarre&&J.est.t==='Cobrada'&&J.btn);
  ok('"Desmarcar" pregunta antes de quitarlo del estado de cuenta, lo quita y Deshacer lo devuelve',/estado de cuenta/.test(J.txt||'')&&J.sale&&J.despues.pend===5000&&J.vuelve);

  /* ---- el estado de cuenta vale las cuotas en pesos como la Caja ---- */
  const S=await p.evaluate(()=>{ const c=_v3Cp('cobro:Solenium'), id=_v3LinAdd(c,c.act,'2026-12-01',1,'S'); _v3LinSet(c,c.act,id,'cop',38000000);
    TRMOF['2026-10-30'].v=3800; const pl=_v2Plan('cobro:Solenium'), v=_v2Ver(pl), l=(v.lineas||[]).find(x=>x.id===id), lc=(v.lineas||[]).find(x=>x.id===_C);
    const raw=(pl.versiones||[]).find(x=>x.id===v.id).lineas.find(x=>x.id===id); TRMOF['2026-10-30'].v=4000; _v3LinDel(_v3Cp('cobro:Solenium'),c.act,id);
    return {m:l&&l.monto,cobrada:lc&&lc.monto,raw:raw&&raw.monto,mon:raw&&raw.mon}; });
  ok('"Plan en la Caja" del estado de cuenta vale la cuota en pesos como la Caja (38 M a 3,800 = 10,000; la cobrada sigue en 10,500)',S.m===10000&&S.cobrada===10500&&S.mon==='COP'&&S.raw===9500);

  /* ---- PDF del cliente: sin "Cobro del plan" ---- */
  const N=await p.evaluate(()=>{ ECA.push({id:'eca-prueba-nota',cliente:'Solenium',fecha:'2026-09-01',usd:1,cop:null,trm:null,nota:'Cobro del plan · cuota del 1-sep',aplicado:[]});
    const h=_ecPdfHTML('Solenium'); const guardada=ECA.find(x=>x.id==='eca-prueba-nota').nota; ECA=ECA.filter(x=>x.id!=='eca-prueba-nota');
    return {pdf:/Cobro del plan/.test(h),cuota:/Cuota del 1-sep/.test(h),guardada}; });
  ok('el PDF del estado de cuenta no muestra "Cobro del plan" (lo guardado no cambia)',!N.pdf&&N.cuota&&N.guardada==='Cobro del plan · cuota del 1-sep');

  /* ---- avisos de algo ya hecho: sin "Cancelar" ---- */
  const Q=await p.evaluate(async()=>{ z26Dialogo({t:'Actualización aplicada',x:'Ya quedó guardado.',ok:'Listo'}); await _w();
    const sin=!document.querySelector('#z26Dlg [data-r="0"]'); document.querySelector('#z26Dlg [data-r="1"]').click(); await _w();
    z26Dialogo({t:'¿Quitar?',ok:'Quitar'}); await _w(); const con=!!document.querySelector('#z26Dlg [data-r="0"]'); document.querySelector('#z26Dlg [data-r="0"]').click(); await _w();
    return {sin,con}; });
  ok('el aviso "Listo" no trae "Cancelar"; una pregunta sí',Q.sin&&Q.con);

  /* ---- paso cuotaCop: no pisa una cuota que cambió después del respaldo ---- */
  const T=await p.evaluate(()=>{ let c=_v3Cp('cobro:Solenium'); const x=_v3LinAdd(c,c.act,'2026-11-24',2000,'x'), y=_v3LinAdd(c,c.act,'2026-11-25',2500,'y'); c=_v3Cp('cobro:Solenium');
    const p1={tipo:'cuotaCop',nombre:'uno',cp:c.id,v:c.act,id:x,cop:8000000,con:'X en pesos',esperado:{f:'2026-11-24',m:2000}};
    const p2={tipo:'cuotaCop',nombre:'dos',cp:c.id,v:c.act,id:y,cop:12000000,con:'Y en pesos',esperado:{f:'2026-11-25',m:3000}};
    const r1=_ztpCuotaCop(p1), r2=_ztpCuotaCop(p2), r3=_ztpCuotaCop(p1); c=_v3Cp('cobro:Solenium');
    const lx=_v3Lin(c,c.act).find(l=>l.id===x), ly=_v3Lin(c,c.act).find(l=>l.id===y);
    return {r1,r2,r3,x:lx.mon+' '+lx.cop+' '+lx.c,y:(ly.mon||'USD')+' '+ly.m,n2:p2.nombre}; });
  ok('cuotaCop: la cuota igual al respaldo pasa a pesos; repetirlo no hace nada',T.r1===true&&T.r3===false&&T.x==='COP 8000000 X en pesos');
  ok('cuotaCop: la cuota que cambió después del respaldo no se toca y queda dicho',T.r2===false&&T.y==='USD 2500'&&/no se cambió/.test(T.n2));

  const Z=await p.evaluate(()=>{ const D=window.ZT_DEF; window.ZT_DEF=undefined; const G=_gastos0(), R=_reglas0(); window.ZT_DEF=D;
    return {n:G.length,montos:G.filter(x=>x.monto!=null).length,colchon:R.colchon}; });
  ok('el código público no trae cifras propias: sin privado/defaults.js los gastos van sin monto',Z.n>0&&Z.montos===0&&Z.colchon===20000);
  ok('no hay llaves nuevas en el estado',await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','))===llaves0);
  ok('sin errores de JS',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
