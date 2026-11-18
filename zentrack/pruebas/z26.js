/* v2.6 · Capa 1 ordenada: sistema visual, Tablero (vigilar), Caja (analizar) y Planes (operar).
   Hoy fijado en 30-oct-2026. Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo).
   Las cifras esperadas salen del mismo cálculo de la Caja: aquí no hay cifras del negocio escritas.
   - Menú: Tablero · Caja · Planes · Clientes · Proveedores · Pedidos · Ajustes (Salidas dentro de Pedidos).
   - Tablero: tira de 5 cifras, tabla "Requiere atención" ordenada por gravedad, una sola gráfica de 12 barras.
   - Caja: solo la tabla (con Neto), definición visible, detalle al lado; sin tarjetas ni gráfica.
   - Planes: tabla contraparte × semana cuyas filas suman exactamente lo que entra y sale en la Caja.
   - Ventanita de una cifra: agregar, marcar pagado, mover; todo con Deshacer.
   - Cronograma en panel lateral: + Pago, fuera de la Caja, versión nueva y borrarla con diálogo propio.
   - Nada por debajo de 13 px; "Guardado hh:mm"; sin llaves nuevas en el estado. */
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
  const llaves0=await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','));

  /* ---- menú ---- */
  const tabs=await p.evaluate(()=>[...document.querySelectorAll('nav.tabs button')].filter(x=>x.offsetParent).map(x=>x.textContent.trim()));
  ok('menú: Tablero · Caja · Planes · Clientes · Proveedores · Pedidos · Ajustes ('+tabs.join(' · ')+')',tabs.join('|')==='Tablero|Caja|Planes|Clientes|Proveedores|Pedidos|Ajustes');

  /* ---- Tablero ---- */
  await p.evaluate(()=>navTo('hoy')); await p.waitForTimeout(200);
  const tb=await p.evaluate(()=>{ const t=document.getElementById('tb2'), A=[...document.querySelectorAll('#z26Atn tbody tr')];
    const g=A.map(r=>r.querySelector('.z-tag').classList.contains('crit')?2:1);
    return {tira:document.querySelectorAll('#z26Tira>div').length, atn:A.length, orden:g.every((x,i)=>i===0||x<=g[i-1]), botones:A.every(r=>!!r.querySelector('button')),
      barras:document.querySelectorAll('#z26Graf g.bar').length, graficas:t.querySelectorAll('svg').length, kpis:t.querySelectorAll('.v2-kpis,.v3-kpis').length,
      txt:t.textContent, fuentes:t.querySelectorAll('.z-src .z-tag').length, sk:!!document.getElementById('z27Sk')}; });
  ok('Tablero: tira de 5 cifras (bancos, me deben, debo y los dos cupos)',tb.tira===5);
  ok('Tablero (v2.7): el sankey ocupa el lugar de "Requiere atención"',tb.atn===0&&tb.sk);
  ok('Tablero: la gráfica de 12 barras y el sankey (v2.7), sin tarjetas de indicadores',tb.graficas===2&&tb.barras===12&&tb.kpis===0);
  ok('Tablero: sin edades, próximos 14 días ni conciliación (se mudaron)',!/Me deben por edades|Debo por edades|Próximos 14 días|Conciliación con Andrés/.test(tb.txt));
  ok('Tablero: 3 fuentes con su fecha (v2.9.1: sin bancos)',tb.fuentes===3);
  await p.evaluate(()=>z26IrSemana(3)); await p.waitForTimeout(200);
  ok('clic en una barra: la Caja marca esa semana',await p.evaluate(()=>document.getElementById('v-caja').classList.contains('on')&&[...document.querySelectorAll('#z26Caja thead th')].findIndex(x=>x.classList.contains('sel'))===4));

  /* ---- Caja ---- */
  const cj=await p.evaluate(()=>{ Z26.sem=null; P14.mon='usd'; renderCaja(); const v=document.getElementById('v-caja'), X=p14Calc('pago');
    const cel=[...document.querySelectorAll('#z26Cierre td.n')].map(x=>x.textContent.trim()), esp=X.cierre.map(_z26c);
    const filas=[...document.querySelectorAll('#z26Caja tbody tr td.cp')].map(x=>x.textContent.trim());
    return {igual:cel.join('|')===esp.join('|'), neto:filas.some(x=>/^Neto/.test(x)), def:/semanas de lunes a domingo/.test(v.querySelector('.z-def').textContent),
      kpis:v.querySelectorAll('.v3-ck,.v2-k,.v3-graf').length, vence:/Solo lo que vence/.test(v.textContent), mi:document.querySelectorAll('#z26Cierre td.low').length}; });
  ok('Caja: saldo al cerrar igual al cálculo, semana por semana',cj.igual);
  ok('Caja: fila Neto, definición visible y la semana más baja marcada',cj.neto&&cj.def&&cj.mi===1);
  ok('Caja: sin tarjetas, sin gráfica y sin "Solo lo que vence"',cj.kpis===0&&!cj.vence);
  const det=await p.evaluate(()=>{ const td=document.querySelector('#z26Caja td.clk'); if(!td) return null; td.click(); const s=document.getElementById('z26Det'); return s?s.querySelectorAll('tbody tr').length:0; });
  ok('Caja: clic en una cifra abre su detalle al lado ('+det+' partidas)',det>0);
  await p.evaluate(()=>{ P14.det=null; renderCaja(); });

  /* ---- Planes: las mismas cifras de la Caja ---- */
  await p.evaluate(()=>{ Z213.vista='12';navTo('planes'); }); await p.waitForTimeout(250);
  const pl=await p.evaluate(()=>{ const G=_z26Grilla(), X=G.X, S=(L,i)=>L.reduce((a,x)=>a+x.w[i],0);
    const dE=X.W.every((w,i)=>Math.abs(S(G.filas.slice(0,G.nC),i)-G.E[i])<0.5), dS=X.W.every((w,i)=>Math.abs(S(G.filas.slice(G.nC),i)-G.Sa[i])<0.5);
    let s=X.s0; const dC=X.W.every((w,i)=>{ s+=G.Ne[i]; return Math.abs(s-X.cierre[i])<0.5; });
    const caja=X.cierre.map(_z26m).join('|'), fila=[...document.querySelectorAll('#z26Saldo td.n')].slice(1,13).map(x=>x.textContent.trim()).join('|');
    return {dE,dS,dC,fila:fila===caja,fijos:G.filas.some(f=>f.n==='Fijos e impuestos'),kpis:document.querySelectorAll('#v-planes .v3-kpis').length,
      vistas:/Cronograma por contraparte|Semana a semana/.test(document.getElementById('v-planes').textContent)}; });
  ok('Planes: las filas de clientes suman lo que entra en la Caja',pl.dE);
  ok('Planes: las filas de proveedores (con fijos e impuestos) suman lo que sale en la Caja',pl.dS&&pl.fijos);
  ok('Planes: el saldo al cerrar es el de la Caja, cifra por cifra',pl.dC&&pl.fila);
  ok('Planes: una sola vista, sin indicadores',pl.kpis===0&&!pl.vistas);

  /* ---- ventanita de una cifra: agregar, marcar pagado, mover, deshacer ---- */
  const r0=await p.evaluate(()=>{ const G=Z26.G, r=G.filas.findIndex(x=>x.c&&x.c.id==='pago:nexus'&&x.ed); return r; });
  ok('Planes: Nexus es editable',r0>=0);
  const est0=await p.evaluate(()=>serializeState());
  await p.click('#z26Plan button[data-z="cel"][data-r="'+r0+'"][data-i="2"]'); await p.waitForTimeout(150);
  ok('clic en una cifra abre la ventanita',await p.evaluate(()=>!!document.getElementById('z26Pop')));
  await p.fill('#z26Pop [data-z="addm"]','1234'); await p.click('#z26Pop [data-z="add"]'); await p.waitForTimeout(250);
  const ag=await p.evaluate(()=>{ const c=_v3Cp('pago:nexus'), L=_v3Lin(c,c.act).filter(l=>Math.abs(l.m-1234)<0.01&&_v3Wk(l.f)===2); return {n:L.length,id:L[0]&&L[0].id,aviso:(document.getElementById('z26Toast')||{}).textContent||''}; });
  ok('+ Pago esta semana agrega el giro en la semana elegida, con Deshacer',ag.n===1&&/Deshacer/.test(ag.aviso));
  const c1=await p.evaluate(()=>{ const X=p14Calc('pago'); return {n0:X.neto[0],n2:X.neto[2]}; });
  await p.click('#z26Pop [data-y="pgAbrir"][data-id="'+ag.id+'"]'); await p.waitForTimeout(150); await p.click('#z26Dr .z-reg [data-y="pgOk"][data-med="banco"]'); await p.waitForTimeout(250);
  const mp=await p.evaluate(id=>{ const X=p14Calc('pago'); return {real:_v3Real()[id],n0:X.neto[0],n2:X.neto[2]}; },ag.id);
  ok('Registrar pago (v2.7: con fecha y medio): queda registrado: sale esta semana y no en la suya (no se cuenta dos veces)',Math.abs(mp.real-1234)<0.01&&Math.abs((mp.n2-c1.n2)-1234)<0.5&&Math.abs((c1.n0-mp.n0)-1234)<0.5);
  await p.evaluate(()=>z26Deshacer()); await p.waitForTimeout(200);
  ok('Deshacer quita el pagado',await p.evaluate(id=>_v3Real()[id]==null,ag.id));
  await p.evaluate(()=>{ Z26.pop={r:Z26.G.filas.findIndex(x=>x.c&&x.c.id==='pago:nexus'),i:2}; _z26PopPintar(); });
  await p.selectOption('#z26Pop select[data-z="w"][data-id="'+ag.id+'"]','4'); await p.waitForTimeout(250);
  ok('Mover a otra semana desde la ventanita',await p.evaluate(id=>{ const c=_v3Cp('pago:nexus'), l=_v3Lin(c,c.act).find(x=>Math.abs(x.m-1234)<0.01); return !!l&&_v3Wk(l.f)===4; },ag.id));
  await p.evaluate(()=>z26Deshacer()); await p.evaluate(()=>{ const c=_v3Cp('pago:nexus'), l=_v3Lin(c,c.act).find(x=>Math.abs(x.m-1234)<0.01); if(l) _v3LinDel(c,c.act,l.id); _z26Hecho(); });
  ok('después de deshacer y borrar, el estado queda como antes',await p.evaluate(s=>JSON.stringify(JSON.parse(serializeState()).PLANCHINA)===JSON.stringify(JSON.parse(s).PLANCHINA),est0));

  /* ---- cronograma en panel lateral ---- */
  await p.evaluate(()=>{ z26CerrarPop(); document.querySelector('#z26Plan [data-z="nm"][data-cp="pago:nexus"]').click(); }); await p.waitForTimeout(200);
  const dr=await p.evaluate(()=>{ const d=document.getElementById('z26Dr'); if(!d) return null; const o=[...d.querySelectorAll('[data-y]')].map(x=>x.dataset.y); return {o,filas:d.querySelectorAll('tbody tr').length,planes:document.getElementById('v-planes').classList.contains('on')}; });
  ok('clic en el nombre abre el cronograma al lado, sin salir de Planes',!!dr&&dr.planes&&dr.o.includes('enCaja')&&dr.o.includes('gen'));
  const n0=await p.evaluate(()=>{ const c=_v3Cp('pago:nexus'); return _v3Lin(c,c.act).length; });
  await p.click('#z26Dr [data-z="padd"]'); await p.waitForTimeout(200);
  ok('+ Pago en el cronograma agrega una línea',await p.evaluate(n=>{ const c=_v3Cp('pago:nexus'); return _v3Lin(c,c.act).length===n+1; },n0));
  await p.evaluate(()=>z26Deshacer()); await p.waitForTimeout(150);
  ok('y Deshacer la quita',await p.evaluate(n=>{ const c=_v3Cp('pago:nexus'); return _v3Lin(c,c.act).length===n; },n0));
  const cf=await p.evaluate(()=>p14Calc('pago').cierre[11]);
  await p.evaluate(()=>document.querySelector('#z26Dr [data-y="enCaja"]').click()); await p.waitForTimeout(250);
  const fu=await p.evaluate(()=>({en:_v3Cp('pago:nexus').enCaja,c:p14Calc('pago').cierre[11]}));
  ok('"Fuera de la Caja" saca el plan de la Caja',fu.en===false&&Math.abs(fu.c-cf)>0.5);
  await p.evaluate(()=>z26Deshacer()); await p.waitForTimeout(150);
  ok('y Deshacer lo devuelve',await p.evaluate(x=>_v3Cp('pago:nexus').enCaja&&Math.abs(p14Calc('pago').cierre[11]-x)<0.5,cf));
  await p.evaluate(()=>document.querySelector('#z26Dr [data-y="gen"]').click()); await p.waitForTimeout(250); await p.click('#z26Dr [data-y="genAct"]'); await p.waitForTimeout(250);
  const nv=await p.evaluate(()=>{ const c=_v3Cp('pago:nexus'); return {act:c.act,guardada:!!(c.p&&(c.p.versiones||[]).some(v=>v.id===c.act))}; });
  ok('acuerdo nuevo (v2.7: Renegociar): queda guardado y es el que cuenta en la Caja ('+nv.act+')',nv.act!=='a'&&nv.guardada);
  await p.evaluate(v=>{ document.querySelector('#z26Dr [data-y="hAct"][data-v="a"]').click(); document.querySelector('#z26Dr [data-y="hDel"][data-v="'+v+'"]').click(); },nv.act); await p.waitForTimeout(150);
  ok('borrar una versión abre un diálogo propio (no el del navegador)',await p.evaluate(()=>!!document.querySelector('#z26Dlg .z-dlg')));
  await p.click('#z26Dlg [data-r="0"]'); await p.waitForTimeout(100);
  ok('Cancelar no borra',await p.evaluate(v=>(_v3Cp('pago:nexus').p.versiones||[]).some(x=>x.id===v),nv.act));
  await p.evaluate(v=>document.querySelector('#z26Dr [data-y="hDel"][data-v="'+v+'"]').click(),nv.act); await p.waitForTimeout(100);
  await p.click('#z26Dlg [data-r="1"]'); await p.waitForTimeout(200);
  ok('historial (v2.7): volver al plan a y borrar el otro',await p.evaluate(v=>{ const c=_v3Cp('pago:nexus'); return c.act==='a'&&!(c.p.versiones||[]).some(x=>x.id===v); },nv.act));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok('Esc cierra el panel',await p.evaluate(()=>!document.getElementById('z26Dr')));

  /* ---- Clientes y Proveedores ---- */
  await p.evaluate(()=>navTo('clientes')); await p.waitForTimeout(200);
  const cl=await p.evaluate(()=>{ const g=_ecClientes().find(c=>esInterno(c)); if(g) selCliData(g);
    return {t:document.querySelector('#v-clientes h2.title').textContent.trim(), debo:document.querySelectorAll('#clList .v2-acr').length, plan:!!document.getElementById('z26PlanCli'), g}; });
  ok('Clientes: título y solo lo que te deben',cl.t==='Clientes'&&cl.debo===0);
  if(cl.g){ ok('Clientes: el plan del cliente del grupo es una línea',cl.plan);
    await p.evaluate(()=>document.querySelector('#z26PlanCli button').click()); await p.waitForTimeout(200);
    ok('"Abrir cronograma" abre el panel ahí mismo',await p.evaluate(()=>!!document.getElementById('z26Dr')&&document.getElementById('v-clientes').classList.contains('on')));
    await p.evaluate(()=>z26Cerrar()); }
  await p.evaluate(()=>navTo('proveedores')); await p.waitForTimeout(200);
  const pv=await p.evaluate(()=>({t:document.querySelector('#v-clientes h2.title').textContent.trim(), on:document.querySelector('nav.tabs button[data-v="proveedores"]').classList.contains('on'),
    acr:document.querySelectorAll('#v-porpagar .v2-acr').length, me:[...document.querySelectorAll('#v-porpagar .v2-lc .v2-cl .h')].some(h=>/Me deben/.test(h.textContent))}));
  ok('Proveedores: pestaña propia, solo lo que debes',pv.t==='Proveedores'&&pv.on&&pv.acr>0&&!pv.me);
  await p.evaluate(()=>{ P14.acre='magnum'; navTo('porpagar'); }); await p.waitForTimeout(150);
  ok('los enlaces viejos a "Debo" llegan a Proveedores',await p.evaluate(()=>document.querySelector('nav.tabs button[data-v="proveedores"]').classList.contains('on')));

  /* ---- Pedidos ---- */
  await p.evaluate(()=>{ navTo('pedidos'); pdVista('estado'); }); await p.waitForTimeout(200);
  ok('Pedidos: Salidas en su menú',await p.evaluate(()=>/Salidas/.test(document.querySelector('#v-pedidos .v2-seg').textContent)));
  await p.evaluate(()=>navTo('salidas')); await p.waitForTimeout(200);
  ok('Salidas queda dentro de Pedidos',await p.evaluate(()=>!!document.querySelector('#v-salidas .z-pdnav')&&document.querySelector('nav.tabs button[data-v="pedidos"]').classList.contains('on')));
  await p.evaluate(()=>navTo('sinosure')); await p.waitForTimeout(200);
  ok('la conciliación con Andrés está en Cupo Sinosure',await p.evaluate(()=>!!document.getElementById('z26Conc')));

  /* ---- sistema visual y guardado ---- */
  const dis=await p.evaluate(()=>{ let chica=0, rad=0; [...document.styleSheets].forEach(ss=>{ try{ const w=L=>[...L].forEach(r=>{ if(r.cssRules&&!r.style){ w(r.cssRules); return; } if(!r.style) return;
      const fs=r.style.fontSize; if(fs&&/^[\d.]+px$/.test(fs)&&parseFloat(fs)<13) chica++;
      const br=r.style.borderRadius; if(br&&/^[\d.]+px$/.test(br)){ const v=parseFloat(br); if(v>0&&v<=16&&v!==4&&v!==8) rad++; } }); w(ss.cssRules); }catch(e){} }); return {chica,rad}; });
  ok('nada por debajo de 13 px y radios de 4 u 8',dis.chica===0&&dis.rad===0);
  const gu=await p.evaluate(async()=>{ const mk=fallar=>({script:{run:{_ok:null,_mal:null,withSuccessHandler(f){ this._ok=f; return this; },withFailureHandler(f){ this._mal=f; return this; },saveState(){ const s=this; setTimeout(()=>fallar?s._mal({message:'sin red'}):s._ok(),10); }}}});
    window.google=mk(false); saveToServer(); await new Promise(r=>setTimeout(r,800)); const a=document.getElementById('z26Gu').textContent;
    window.google=mk(true); saveToServer(); await new Promise(r=>setTimeout(r,800)); const g=document.getElementById('z26Gu'), m=g.className==='mal'&&/No se guardó/.test(g.textContent);
    delete window.google; return {a,m}; });
  ok('"Guardado hh:mm" junto a la versión; si falla, queda en rojo con reintentar',/^Guardado \d\d:\d\d$/.test(gu.a)&&gu.m);
  const llaves1=await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','));
  ok('sin llaves nuevas en el estado',llaves1===llaves0);
  const viejo=await p.evaluate(s=>{ try{ applyState(JSON.parse(s)); refreshAll(); navTo('hoy'); navTo('caja'); Z213.vista='12';navTo('planes'); return !!document.getElementById('z26Plan'); }catch(e){ return 'ERR '+e; } },fs.readFileSync(__dirname+'/RESP.json','utf8'));
  ok('un estado viejo abre y pinta las tres pantallas',viejo===true);

  ok('sin errores de JS'+(errs.length?': '+errs.slice(0,3).join(' | '):''),!errs.length);
  console.log(n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
