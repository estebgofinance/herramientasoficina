/* ===================================================================
   v2.6 · CAPA 1 ORDENADA: SISTEMA VISUAL, TABLERO, CAJA Y PLANES
   Esteban aceptó (10-nov-2026) ordenar la base antes de sumar la capa 2
   (la v2.5 queda en espera). Cada pantalla tiene un tipo: el Tablero es
   para vigilar, la Caja para analizar y Planes para operar.
   - Menú: Tablero · Caja · Planes · Clientes · Proveedores · Pedidos ·
     Ajustes. Cuentas se parte en Clientes (me deben) y Proveedores
     (debo); Salidas entra a Pedidos; la conciliación con Andrés, a Cupo
     Sinosure; lo que sale y llega esta semana, a Pedidos › Por estado.
   - Tablero: fuentes con fecha; tira con bancos, me deben vencido, debo
     vencido y los dos cupos; tabla "Requiere atención" (estado, qué,
     contraparte, monto, cuándo y un botón para resolverlo); la única
     gráfica de saldo de la herramienta (clic en una barra: la Caja).
   - Caja: la tabla semana a semana (entra, sale, neto, saldo) con su
     definición; clic en una cifra abre el detalle al lado.
   - Planes: una tabla contraparte × semana con las mismas cifras de la
     Caja (fijos e impuestos incluidos); clic en una cifra: marcar pagado,
     mover, cambiar monto, borrar, agregar; clic en un nombre: su
     cronograma en un panel lateral, que también se abre desde Clientes,
     Proveedores, la Caja y el Tablero.
   - "Pagado" (antes "Real") es lo que registraste tú. Cada cambio de un
     plan avisa y ofrece Deshacer; borrar una versión pide confirmación.
   - Letra mínima 13 px, radios 4 y 8, "Guardado hh:mm" junto a la versión.
   Sin llaves nuevas: usa PLANES, PLANCHINA, PROM y SALDOS como estaban.
   =================================================================== */
var Z26={dr:null,pop:null,sem:null,undo:null,tt:null,bancos:false,q:'',G:null,M:null};
const _z26Col=()=>(REGLAS&&+REGLAS.colchon)||21500;
function _z26m(v){ return Math.abs(v)<0.5?'—':(v<0?'−':'')+fmtUSDs(Math.abs(v)); }
function _z26c(v){ const a=_p14X(v); if(Math.abs(a)<0.5) return '—';
  if(P14.mon==='cop') return (a<0?'−':'')+(Math.abs(a)/1e6).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1});
  return (a<0?'−':'')+fmtUSDs(Math.abs(a)); }
function _z26k(v){ if(Math.abs(v)<0.5) return '0'; const a=Math.abs(v)/1000; return (v<0?'−':'')+(a>=100?Math.round(a).toLocaleString('en-US'):(Math.round(a*10)/10))+'k'; }
function _z26tag(c,t){ return '<span class="z-tag '+c+'">'+esc4(t)+'</span>'; }
function _z26Sem(i){ return _p14F(addD(_v3L0(),7*i)); }

/* ---- deshacer, avisos, diálogo y guardado ---- */
function _z26Snap(){ return JSON.stringify({PLANES:PLANES,PLANCHINA:PLANCHINA,PROM:PROM}); }
function _z26Repintar(){
  try{ _p14Repintar(); }catch(e){ console.warn(e); }
  try{ const v=document.getElementById('v-planes'); if(v&&v.classList.contains('on')) renderPlanes(); }catch(e){ console.warn(e); }
  try{ const c=document.getElementById('v-clientes'); if(c&&c.classList.contains('on')&&ECLADO!=='debo') renderClientes(); }catch(e){ console.warn(e); }
  try{ _z26DrPintar(); }catch(e){ console.warn(e); } }
function _z26Hecho(msg,snap){ Z26.undo=snap||null; guardar4(); _z26Repintar(); if(msg) z26Aviso(msg,!!snap); }
function z26Deshacer(){ if(!Z26.undo) return; const o=JSON.parse(Z26.undo); PLANES=o.PLANES; PLANCHINA=o.PLANCHINA; PROM=o.PROM; Z26.undo=null; _z26Hecho('Cambio deshecho'); }
function z26Aviso(msg,undo){ let t=document.getElementById('z26Toast');
  if(!t){ t=document.createElement('div'); t.id='z26Toast'; t.className='z-toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.innerHTML='<span>'+esc4(msg)+'</span>'+(undo?'<button type="button" onclick="z26Deshacer()">Deshacer</button>':'');
  t.classList.add('on'); clearTimeout(Z26.tt); Z26.tt=setTimeout(()=>t.classList.remove('on'),undo?6000:3500); }
function z26Dialogo(o){ return new Promise(res=>{ let s=document.getElementById('z26Dlg'); if(s) s.remove();
  s=document.createElement('div'); s.id='z26Dlg'; s.className='z-scrim';
  s.innerHTML='<div class="z-dlg" role="dialog" aria-modal="true" aria-labelledby="z26DlgT"><h3 id="z26DlgT">'+esc4(o.t)+'</h3>'+(o.x?'<p>'+esc4(o.x)+'</p>':'')
    +'<div class="z-dlg-f"><button type="button" class="z-btn" data-r="0">Cancelar</button><button type="button" class="z-btn '+(o.peligro?'dng':'pri')+'" data-r="1">'+esc4(o.ok||'Aceptar')+'</button></div></div>';
  const kd=e=>{ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); fin(false); } };
  const fin=r=>{ s.remove(); document.removeEventListener('keydown',kd,true); res(r); };
  s.addEventListener('click',e=>{ const b=e.target.closest('[data-r]'); if(b) fin(b.dataset.r==='1'); else if(e.target===s) fin(false); });
  document.addEventListener('keydown',kd,true); document.body.appendChild(s); const f=s.querySelector('[data-r="1"]'); if(f) f.focus(); }); }
function _z26G(st,msg){ let g=document.getElementById('z26Gu'); const vt=document.getElementById('verTag');
  if(!g&&vt){ g=document.createElement('span'); g.id='z26Gu'; g.setAttribute('role','status'); vt.parentNode.insertBefore(g,vt); } if(!g) return;
  const h=new Date(), hh=String(h.getHours()).padStart(2,'0')+':'+String(h.getMinutes()).padStart(2,'0');
  g.className=st==='mal'?'mal':''; g.title=st==='mal'?(msg||''):'';
  g.innerHTML=st==='ok'?'Guardado '+hh:(st==='mal'?'No se guardó · <button type="button" onclick="saveToServer()">reintentar</button>':'Guardando…'); }
saveToServer=function(){
  if(typeof google==='undefined'||!google.script) return;
  clearTimeout(_saveTimer); _z26G('va');
  _saveTimer=setTimeout(function(){
    google.script.run
      .withSuccessHandler(function(){ _z26G('ok'); })
      .withFailureHandler(function(err){ _z26G('mal',err&&err.message); if(typeof toast==='function') toast('No se pudo guardar: '+(err&&err.message)); })
      .saveState(serializeState());
  },600); };
/* nada por debajo de 13 px; radios 4 u 8 */
function _z26Css(){ try{ [...document.styleSheets].forEach(ss=>{ let L; try{ L=ss.cssRules; }catch(e){ return; }
  const walk=R=>[...R].forEach(r=>{ if(r.cssRules&&!r.style){ walk(r.cssRules); return; } if(!r.style) return;
    const fs=r.style.fontSize; if(fs&&/^[\d.]+px$/.test(fs)&&parseFloat(fs)<13) r.style.fontSize='13px';
    const br=r.style.borderRadius; if(br&&/^[\d.]+px$/.test(br)){ const n=parseFloat(br); if(n>0&&n<=5) r.style.borderRadius='4px'; else if(n>5&&n<=16) r.style.borderRadius='8px'; } });
  walk(L); }); }catch(e){ console.warn('z26 css',e); } }

/* ---- menú: Clientes y Proveedores; Salidas dentro de Pedidos ---- */
function _z26CtaTitulo(){ const t=document.querySelector('#v-clientes .ma-top h2.title'); if(t) t.textContent=ECLADO==='debo'?'Proveedores':'Clientes'; }
function _z26Nav(){
  const nav=document.querySelector('nav.tabs'); if(!nav) return; const q=v=>nav.querySelector('button[data-v="'+v+'"]');
  const sal=q('salidas'); if(sal) sal.style.display='none';
  const cli=q('clientes'); if(!cli) return; cli.textContent='Clientes';
  let pr=q('proveedores');
  if(!pr){ pr=document.createElement('button'); pr.dataset.v='proveedores'; pr.textContent='Proveedores'; cli.insertAdjacentElement('afterend',pr);
    pr.addEventListener('click',()=>{ nav.querySelectorAll('button').forEach(x=>x.classList.remove('on')); pr.classList.add('on');
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('on')); const v=document.getElementById('v-clientes'); if(v) v.classList.add('on');
      ecLado('debo'); _z26CtaTitulo(); }); }
  cli.addEventListener('click',()=>{ ecLado('me'); try{ renderClientes(); }catch(e){ console.warn(e); } _z26CtaTitulo(); });
  nav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ if(b.dataset.v==='salidas'){ const p=q('pedidos'); if(p) p.classList.add('on'); } Z26.pop=null; }));
}
const _navToAntes26=navTo;
navTo=function(v){ if(v==='porpagar'||v==='proveedores'){ const b=document.querySelector('nav.tabs button[data-v="proveedores"]'); if(b){ b.click(); return; } }
  return _navToAntes26.apply(this,arguments); };
const _renderClientesAntes26=renderClientes;
renderClientes=function(){ const r=_renderClientesAntes26.apply(this,arguments);
  try{ document.querySelectorAll('#clList .v2-cl').forEach(x=>{ if(x.querySelector('.v2-acr')) x.remove(); }); _z26CtaTitulo(); }catch(e){ console.warn(e); } return r; };
const _renderPorPagarAntes26=renderPorPagar;
renderPorPagar=function(){ const r=_renderPorPagarAntes26.apply(this,arguments);
  try{ document.querySelectorAll('#v-porpagar .v2-lc .v2-cl').forEach(x=>{ if(!x.querySelector('.v2-acr')) x.remove(); }); _z26CtaTitulo(); }catch(e){ console.warn(e); } return r; };
/* en Clientes, el plan del cliente del grupo queda en una línea que abre su cronograma */
_promHTML=function(c){ try{
  const cp=_v3Cp('cobro:'+c); if(!cp) return '';
  const v=_v3Vers(cp).find(x=>x.id===cp.act), n=_v3Act(cp).filter(l=>{ const d=_p14D(l.f); return d&&d>=TODAY; }).length, q=_z26Prom(cp);
  return '<div class="z-plink" id="z26PlanCli"><span class="z-cap">Plan de pagos</span><b>'+esc4(cp.enCaja?(v?v.t:'—')+' · cuenta en la Caja':'fuera de la Caja')+'</b>'
    +'<span class="z-mut">'+n+' pago'+(n===1?'':'s')+' por venir'+(q.sin>0.5?' · '+_z26m(q.sin)+' vencido sin recibir':'')+'</span><span class="z-sp"></span>'
    +'<button type="button" class="z-btn sm" onclick="z26Abrir(\''+_maQ(cp.id)+'\')">Abrir cronograma</button></div>';
}catch(err){ console.warn(err); return ''; } };

/* ---- Pedidos: Salidas, lo que sale y llega, y la conciliación con Andrés en Cupo Sinosure ---- */
_v2PdNav=function(act){
  const n=(CONCILIA&&typeof snConciliar==='function')?snConciliar().filter(x=>x.pend).length:0;
  const b=(k,t,fn)=>'<button class="'+(act===k?'on':'')+'" onclick="'+fn+'">'+t+'</button>', pv=k=>"navTo('pedidos');pdVista('"+k+"')";
  return '<div class="v2-top"><h2>Pedidos</h2><div class="v2-seg">'+b('estado','Por estado',pv('estado'))+b('or','Order report',pv('or'))+b('maestro','Fichas',pv('maestro'))+b('salidas','Salidas',"navTo('salidas')")
    +b('cupo','Cupo Sinosure'+(n?' <span class="v2-chip ya">'+n+'</span>':''),"navTo('sinosure')")+'</div><span class="v2-sp"></span>'
    +'<span class="v2-mut" style="font-size:14px">'+(CONCILIA&&CONCILIA.ts?'Order report '+fmtD(new Date(CONCILIA.ts))+' · ':'')+EQ.length+' pedidos</span></div>'; };
function _z26SemanaHTML(){
  const S=_v2EstaSemana(); if(!S.sale.length&&!S.llega.length) return '';
  const it=l=>l.length?l.map(x=>'<div class="it"><span>'+esc4(x.b+' · '+[...x.p].filter(Boolean).join(', '))+'</span><span class="v2-mut">'+_p14F(x.d)+'</span></div>').join(''):'<div class="v2-mut" style="font-size:14px">—</div>';
  return '<div class="z-sem" id="z26Sem"><div class="v2-card"><h3>Sale de China</h3><div class="v2-list">'+it(S.sale)+'</div></div><div class="v2-card"><h3>Llega a Colombia</h3><div class="v2-list">'+it(S.llega)+'</div></div></div>'; }
const _v2PdEstadoAntes26=_v2PdEstado;
_v2PdEstado=function(){ const h=_v2PdEstadoAntes26.apply(this,arguments); let s=''; try{ s=_z26SemanaHTML(); }catch(err){ console.warn(err); } return s+h; };
function _z26ConcHTML(){
  const cc=_v2Conciliacion(), n=fmtUSDs;
  return '<section class="v2-card" id="z26Conc" style="margin:14px 0"><div class="v2-sec"><h3>Conciliación con Andrés</h3><span class="v2-mut" style="font-size:13px">US$ · pagos prioritarios y hoja Sinosure</span><span class="v2-sp"></span>'
    +(cc.length?'<button class="v2-b" onclick="v2CopiarConciliacion()">Copiar preguntas para Andrés</button>':'')+'</div><div class="v2-wrap"><table class="v2-t"><thead><tr><th>Concepto</th><th class="r">Andrés</th><th class="r">Zentrack</th><th class="r">Diferencia</th><th>Causa</th><th>Estado</th></tr></thead><tbody>'
    +(cc.length?cc.map(x=>'<tr'+(x.sn?' class="clic" onclick="SNPC=true;navTo(\'sinosure\')"':'')+'><td><b>'+esc4(x.q)+'</b></td><td class="r">'+(x.a!=null?n(x.a):'—')+'</td><td class="r">'+(x.z!=null?n(x.z):'—')+'</td><td class="r neg"><b>'+(x.d!=null?(x.d<0?'−':'')+n(Math.abs(x.d)):'—')+'</b></td><td class="v2-mut">'+esc4(x.causa||'')+'</td><td>'+_z26tag('warn',x.est)+'</td></tr>').join('')
      :'<tr><td colspan="6" class="v2-mut">Sin diferencias.</td></tr>')+'</tbody></table></div></section>'; }
const _pintarSinoAntes26=pintarSino;
pintarSino=function(){ const r=_pintarSinoAntes26.apply(this,arguments);
  try{ const v=document.getElementById('v-sinosure'); if(v){ const o=document.getElementById('z26Conc'); if(o) o.remove();
      const t=document.createElement('div'); t.innerHTML=_z26ConcHTML(); const nav=v.querySelector(':scope>.v2-top'); v.insertBefore(t.firstChild,nav?nav.nextSibling:v.firstChild); } }catch(err){ console.warn(err); }
  return r; };
const _renderSalidasAntes26=renderSalidas;
renderSalidas=function(){ const r=_renderSalidasAntes26.apply(this,arguments);
  try{ const v=document.getElementById('v-salidas'); if(v){ const t=document.createElement('div'); t.innerHTML=_v2PdNav('salidas'); const nav=t.firstChild; nav.classList.add('z-pdnav'); v.insertBefore(nav,v.firstChild);
      const h=v.querySelector(':scope>.v2-top:not(.z-pdnav) h2'); if(h) h.classList.add('z-pdsub'); } }catch(err){ console.warn(err); }
  return r; };

/* ---- promesas de un cliente del grupo: lo vencido sin recibir ---- */
function _z26Prom(c){
  const L=_v3Lin(c,c.act).filter(l=>!l.cump&&l.m>0.005&&l.f), venc=L.filter(l=>{ const d=_p14D(l.f); return d&&d<TODAY; });
  if(!venc.length) return {sin:0,n:0,desde:null,primera:null,plan:0,rec:0};
  const primera=new Date(Math.min(...venc.map(l=>_p14D(l.f).getTime()))), desde=_p14Lun(primera), plan=venc.reduce((a,l)=>a+l.m,0);
  const rec=(ECA||[]).filter(a=>a.cliente===c.n).filter(a=>{ const d=_ecFecha(a.fecha); return d&&d>=desde&&d<=TODAY; }).reduce((a,x)=>a+(+x.usd||0),0);
  return {sin:Math.max(0,plan-rec),n:venc.length,desde,primera,plan,rec}; }

/* ================= TABLERO (vigilar) ================= */
function _z26Fuentes(){
  const ch=(t,d)=>{ if(!d) return _z26tag('crit',t+' · sin cargar'); const n=days(d,TODAY); return '<span title="'+esc4(t+' · '+_p14F(d))+'">'+_z26tag(n<=7?'ok':(n<=14?'warn':'crit'),t+' · '+(n<=7?_p14F(d):n+' d'))+'</span>'; };
  const u=_saldoUlt();
  return ch('China',CONCILIA&&CONCILIA.ts?new Date(CONCILIA.ts):null)+ch('Magnum',CXP.magnum?_p14D(CXP.magnum.corte):null)+ch('TIBA',CXP.tiba?_p14D(CXP.tiba.corte):null)+ch('Bancos',u?_p14D(u.fecha):null); }
function _z26Atencion(){
  const out=[], add=(g,q,cp,m,f,a,fn)=>out.push({g,q,cp,m,f,a,fn}), u=_saldoUlt(), Q=s=>"'"+_maQ(s)+"'";
  if(!u) add(3,'Saldo sin registrar','Bancos · 4 cuentas',null,'—','Registrar saldos','z26Bancos(true)');
  else { const d=_p14D(u.fecha), n=d?days(d,TODAY):99; if(n>7) add(3,'Saldo de hace '+n+' días','Bancos · 4 cuentas',null,d?_p14F(d):'—','Registrar saldos','z26Bancos(true)'); }
  const M=_v3Fichas(), Re=_v3Real();
  M.C.filter(c=>c.dir==='c'&&c.tipo==='Negociado'&&c.enCaja).forEach(c=>{ const q=_z26Prom(c); if(q.sin>0.5) add(2,'Promesas vencidas sin recibir ('+q.n+')',c.n,q.sin,'desde '+_p14F(q.primera),'Ver plan','z26Abrir('+Q(c.id)+')'); });
  M.C.filter(c=>c.dir==='p'&&(c.sinPlan||0)>0.5).forEach(c=>add(2,'Vencido sin plan',c.n,c.sinPlan,'—','Hacer plan','z26Abrir('+Q(c.id)+')'));
  const g={}; M.F.filter(x=>x.c.dir==='p'&&!x.lock&&x.l&&x.l.f&&_p14D(x.l.f)<TODAY&&(Re[x.l.id]==null||Re[x.l.id]==='')).forEach(x=>{
    const o=(g[x.c.id]=g[x.c.id]||{c:x.c,n:0,m:0,d0:null,d1:null}), d=_p14D(x.l.f); o.n++; o.m+=x.m; if(!o.d0||d<o.d0) o.d0=d; if(!o.d1||d>o.d1) o.d1=d; });
  Object.values(g).forEach(o=>add(1,'Pagos vencidos sin registrar ('+o.n+')',o.c.n,o.m,o.d0.getTime()===o.d1.getTime()?_p14F(o.d0):_p14F(o.d0)+' a '+_p14F(o.d1),'Registrar','z26Abrir('+Q(o.c.id)+')'));
  [['China',CONCILIA&&CONCILIA.ts?new Date(CONCILIA.ts):null],['Magnum',CXP.magnum?_p14D(CXP.magnum.corte):null],['TIBA',CXP.tiba?_p14D(CXP.tiba.corte):null]].forEach(([t,d])=>{
    const n=d?days(d,TODAY):0; if(d&&n>14) add(1,'Archivo de hace '+n+' días',t,null,_p14F(d),'Cargar','v2Cargar()'); });
  const cc=EQ.length?_v2Conciliacion():[]; if(cc.length) add(1,'Diferencias con Andrés ('+cc.length+')','Order report y hoja Sinosure',null,CONCILIA&&CONCILIA.ts?_p14F(new Date(CONCILIA.ts)):'—','Revisar',"navTo('sinosure')");
  const sinP=EQ.filter(e=>!(precioVenta(e)>0)&&cobroModo(e)!=='especial').length, sinC=EQ.filter(e=>!e.cliente||e.cliente==='Por asignar').length;
  if(sinP) add(1,'Pedidos sin precio',sinP+' pedido'+(sinP===1?'':'s'),null,'—','Completar',"navTo('pedidos');pdVista('maestro');maFiltro('solo','sinprecio')");
  if(sinC) add(1,'Pedidos sin cliente',sinC+' pedido'+(sinC===1?'':'s'),null,'—','Completar',"navTo('pedidos');pdVista('maestro');maFiltro('solo','sincliente')");
  ['Singsun','Eaglerise'].forEach(m=>{ const q=cupoConcilia(m), cu=+q.cupo||0; if(!cu) return; const d=cu-(+q.usado||0), pct=Math.round((+q.usado||0)/cu*100);
    if(d<0) add(2,'Cupo excedido','Sinosure · '+m,-d,pct+' % usado','Ver cupo',"navTo('sinosure')");
    else if(pct>=90) add(1,'Cupo casi lleno · disponible','Sinosure · '+m,d,pct+' % usado','Ver cupo',"navTo('sinosure')"); });
  return out.sort((a,b)=>(b.g-a.g)||((+b.m||0)-(+a.m||0))); }
function _z26AtencionHTML(){
  const L=_z26Atencion();
  const fila=a=>'<tr><td>'+_z26tag(a.g>=2?'crit':'warn',a.g>=2?'Crítico':'Atención')+'</td><td>'+esc4(a.q)+'</td><td>'+esc4(a.cp)+'</td><td class="n">'+(a.m==null?'—':_z26m(a.m))+'</td><td>'+esc4(a.f||'—')+'</td>'
    +'<td class="n"><button type="button" class="z-btn sm" onclick="'+a.fn+'">'+esc4(a.a)+'</button></td></tr>';
  return '<section class="z-box" id="z26Atn"><div class="z-bh"><h3>Requiere atención</h3><span class="z-def">'+(L.length?L.length+' · por gravedad y monto':'nada pendiente')+'</span></div>'
    +(L.length?'<div class="z-wrap"><table class="z-t z-atn"><thead><tr><th>Estado</th><th>Qué</th><th>Contraparte</th><th class="n">US$</th><th>Cuándo</th><th></th></tr></thead><tbody>'+L.map(fila).join('')+'</tbody></table></div>'
      :'<div class="z-bf">Todo al día.</div>')+'</section>'; }
function _z26Tira(){
  const D=_v2DeboEdades(), M=_v2MeDebenEdades(), u=_saldoUlt(), s0=_saldoHoyUSD();
  const dB=[0,1,2,3,4].map(i=>Object.values(D).reduce((a,p)=>a+p.b[i],0)), dV=dB[1]+dB[2]+dB[3]+dB[4];
  const mB=[0,1,2,3,4].map(i=>M.reduce((a,x)=>a+x.b[i],0)), mV=mB[2]+mB[3]+mB[4];
  const bar=(a,t)=>'<div class="z-ages" aria-hidden="true">'+(t>0.5?a.map((x,i)=>x>0.5?'<i class="z-a'+(i+1)+'" style="flex:'+Math.round(x)+'"></i>':'').join(''):'')+'</div>';
  const txt=(a,et)=>a.map((x,i)=>x>0.5?et[i]+' '+_z26m(x):'').filter(Boolean).join(' · ')||'al día';
  const fu=u?_p14D(u.fecha):null, nd=fu?days(fu,TODAY):null;
  const cup=m=>{ const q=cupoConcilia(m), cu=+q.cupo||0, d=cu-(+q.usado||0); return {d,cu,pct:cu?Math.round((+q.usado||0)/cu*100):0}; }, cs=cup('Singsun'), ce=cup('Eaglerise');
  const cupH=(t,o)=>'<div><span class="z-cap">'+t+' · US$</span><a href="#" class="z-go" onclick="navTo(\'sinosure\');return false"><span class="v'+(o.d<0?' crit':'')+'">'+_z26m(o.d)+'</span></a><span class="s">'+(o.cu?'disponible · '+o.pct+' % usado':'sin techo')+'</span></div>';
  return '<div class="z-strip" id="z26Tira">'
    +'<div><span class="z-cap">Plata en bancos · US$</span><span class="v'+(u?'':' mut')+'">'+(u?_z26m(s0).replace('—','0'):'Sin registrar')+'</span><span class="s">'+(u?(nd===0?'hoy':'del '+_p14F(fu)+(nd>1?' · hace '+nd+' d':'')):'sin saldo registrado')+'</span>'
      +'<span><button type="button" class="z-btn sm" onclick="z26Bancos()" aria-expanded="'+!!Z26.bancos+'">Registrar saldos</button></span></div>'
    +'<div><span class="z-cap">Me deben vencido · US$</span><a href="#" class="z-go" onclick="navTo(\'clientes\');return false"><span class="v ok">'+_z26m(mV)+'</span></a>'+bar([mB[2],mB[3],mB[4]],mV)+'<span class="s">'+esc4(txt([mB[2],mB[3],mB[4]],['1-30','31-60','+60']))+'</span></div>'
    +'<div><span class="z-cap">Debo vencido · US$</span><a href="#" class="z-go" onclick="navTo(\'proveedores\');return false"><span class="v crit">'+_z26m(dV)+'</span></a>'+bar([dB[1]+dB[2],dB[3],dB[4]],dV)+'<span class="s">'+esc4(txt([dB[1]+dB[2],dB[3],dB[4]],['hasta 30 d','31-60','+60']))+'</span></div>'
    +cupH('Cupo Singsun',cs)+cupH('Cupo Eaglerise',ce)+'</div>'; }
function z26Bancos(on){ Z26.bancos=on==null?!Z26.bancos:!!on;
  if(Z26.bancos){ const h=document.querySelector('nav.tabs button[data-v="hoy"]'); if(h&&!h.classList.contains('on')) navTo('hoy'); }
  _v2Tablero(); if(Z26.bancos){ const i=document.querySelector('.z-bancos input'); if(i) i.focus(); } }
function _z26BancosHTML(){ const u=_saldoUlt()||{cuentas:{}};
  return '<div class="z-bancos" role="group" aria-label="Saldos de hoy">'+_P14_CUENTAS.map(([k,n,m])=>'<label>'+esc4(n)+' · '+m+'<input class="z-in n" style="width:150px" data-foco="sal-'+k+'" inputmode="decimal" value="'+(u.cuentas&&u.cuentas[k]!=null?fmtUSDs(u.cuentas[k]):'')+'" placeholder="0" onchange="saldoSet(\''+k+'\',this.value)"></label>').join('')
    +'<label>TRM<input class="z-in n" style="width:100px" data-foco="sal-trm" inputmode="decimal" value="'+(u.trm?u.trm:'')+'" placeholder="'+_p14Trm()+'" onchange="saldoSet(\'trm\',this.value)"></label>'
    +'<button type="button" class="z-btn" onclick="z26Bancos(false)">Listo</button></div>'; }
function _z26GrafHTML(X){
  const C=X.cierre, N=C.length, col=_z26Col(), W=1180, H=250, L=60, Rr=12, T=24, B=44, ph=H-T-B, pw=W-L-Rr;
  const mx=Math.max(col,0,...C), mn=Math.min(0,...C), rg=Math.max(1,mx-mn), y=v=>T+(mx-v)/rg*ph;
  const st=(()=>{ const r=rg/4, p=Math.pow(10,Math.floor(Math.log10(r))), m=r/p; return (m<=1?1:(m<=2?2:(m<=5?5:10)))*p; })();
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Saldo al cierre de cada semana, en dólares">';
  for(let t=Math.ceil(mn/st)*st;t<=mx+0.5;t+=st){ const yy=y(t).toFixed(1); s+='<line x1="'+L+'" x2="'+(W-Rr)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+(Math.abs(t)<0.5?'#A2A7AD':'#E4E6E9')+'"/><text x="'+(L-8)+'" y="'+(+yy+4)+'" text-anchor="end" font-size="13" fill="#7D838A">'+_z26k(t)+'</text>'; }
  const yc=y(col).toFixed(1); s+='<line x1="'+L+'" x2="'+(W-Rr)+'" y1="'+yc+'" y2="'+yc+'" stroke="#17181A" stroke-opacity=".55" stroke-dasharray="5 4"/><text x="'+(W-Rr)+'" y="'+(+yc-6)+'" text-anchor="end" font-size="13" fill="#565B61">colchón '+fmtUSDs(col)+'</text>';
  let mi=0; C.forEach((v,i)=>{ if(v<C[mi]) mi=i; });
  const slot=pw/N, bw=Math.min(40,slot*.62), y0=y(0);
  C.forEach((v,i)=>{ const x=L+slot*i+(slot-bw)/2, yt=Math.min(y(v),y0), h=Math.max(2,Math.abs(y(v)-y0)), cl=v<0?'#B3261E':(v<col?'#C87A00':'#2E6E5A');
    s+='<g class="bar" data-i="'+i+'" onclick="z26IrSemana('+i+')"><title>'+_p14F(X.W[i])+' · '+_z26m(v)+'</title><rect x="'+x.toFixed(1)+'" y="'+yt.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="2" fill="'+cl+'" opacity="'+(i===mi?1:.72)+'"/>'
      +'<text x="'+(x+bw/2).toFixed(1)+'" y="'+(v<0?yt+h+15:yt-6).toFixed(1)+'" text-anchor="middle" font-size="13" font-weight="'+(i===mi?700:500)+'" fill="'+(v<0?'#B3261E':'#17181A')+'">'+_z26k(v)+'</text>'
      +'<text x="'+(x+bw/2).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle" font-size="13" font-weight="'+(i===0?700:400)+'" fill="'+(i===0?'#7A4A00':'#7D838A')+'">'+_p14F(X.W[i])+'</text></g>'; });
  s+='</svg>';
  const bajo=C.filter(v=>v<col).length, u=_saldoUlt();
  return '<section class="z-box z-graf" id="z26Graf"><div class="z-bh"><h3>Saldo al cierre · 12 semanas</h3><span class="z-def">US$ · con tu plan de pagos · arranca en bancos '+(u?'del '+_p14F(_p14D(u.fecha)):'sin registrar')+' ('+_z26m(X.s0).replace('—','0')+')</span></div>'
    +'<div style="padding:8px 12px 0">'+s+'</div><div class="z-bf">Más bajo: <b style="color:'+(C[mi]<0?'var(--z-crit)':'var(--ink)')+'">'+_z26m(C[mi])+'</b> el '+_p14F(X.W[mi])+' · '+bajo+' de '+N+' semanas bajo el colchón · clic en una barra abre la Caja en esa semana</div></section>'; }
function z26IrSemana(i){ Z26.sem=i; P14.det=null; navTo('caja'); }
_v2Tablero=function(){
  const v=document.getElementById('v-hoy'); if(!v) return;
  let c=document.getElementById('tb2'); if(!c){ c=document.createElement('div'); c.id='tb2'; v.insertBefore(c,v.firstChild); }
  v.classList.add('v2-tb');
  const top='<div class="z-ph"><h2>Tablero</h2><span class="z-mut">'+_p14F(TODAY)+'-'+TODAY.getFullYear()+'</span><span class="z-sp"></span><div class="z-src">'+_z26Fuentes()+'</div></div>';
  if(!(EQ.length||_ecClientes().length)){ c.innerHTML=top+'<div class="ec8-vacio">Carga el detailed y el order report con <b>Cargar archivo</b>.</div>'; return; }
  const X=p14Calc('pago');
  c.innerHTML=top+_z26Tira()+(Z26.bancos?_z26BancosHTML():'')+'<div class="z-stack">'+_z26AtencionHTML()+_z26GrafHTML(X)+'</div>'; };

/* ================= CAJA (analizar) ================= */
_p14Caja=function(){
  P14.vista='plan'; if(!P14.abre) P14.abre={entra:true,sale:true};
  const X=p14Calc('pago'), N=X.W.length, R=X.R, col=_z26Col(), S=a=>a.reduce((x,y)=>x+y,0), ab=P14.abre, cop=P14.mon==='cop', det=P14.det, sel=Z26.sem;
  X.chPlan=X.chPlan||{}; X.natProv=X.natProv||{};
  const ent=X.W.map((w,i)=>R.ext.v[i]+R.sole.v[i]), sal=X.W.map((w,i)=>R.china.v[i]+R.mag.v[i]+R.tiba.v[i]+R.otros.v[i]+R.fij.v[i]+R.imp.v[i]), net=ent.map((v,i)=>v-sal[i]);
  let mi=0; X.cierre.forEach((v,i)=>{ if(v<X.cierre[mi]) mi=i; });
  const u=_saldoUlt(), seg=(v,t)=>'<button type="button" class="'+(P14.mon===v?'on':'')+'" onclick="p14Vista(\'mon\',\''+v+'\')">'+t+'</button>';
  const top='<div class="z-ph"><h2>Caja</h2><span class="z-def">'+(cop?'COP en millones · TRM '+fmtUSDs(_p14Trm()):'US$')+' · semanas de lunes a domingo · con tu plan de pagos · saldo inicial: bancos '+(u?'del '+_p14F(_p14D(u.fecha)):'sin registrar')+' ('+_p14Full(X.s0)+') · colchón '+_p14Full(col)+'</span><span class="z-sp"></span>'
    +'<div class="z-seg" role="group" aria-label="Moneda">'+seg('usd','US$')+seg('cop','COP')+'</div><button type="button" class="z-btn" onclick="v2CajaExportar()">Exportar</button></div>';
  const C=(X.v3&&X.v3.cps)||[], cpOf=id=>C.find(c=>c.id===id);
  const verT=c=>!c?'':(!c.enCaja?'fuera de la Caja':((c.tipo==='Negociado'&&!_v3Act(c).length)?'sin plan':(c.act==='base'?(c.tipo==='Negociado'?'sin plan':(c.tipo==='Regla'?'regla '+((REGLAS&&REGLAS[c.prov]&&REGLAS[c.prov].dias)||30)+' d':'cuotas')):'plan '+c.act)));
  const fte=c=>c?' <button type="button" class="z-btn q sm" onclick="event.stopPropagation();z26Abrir(\''+_maQ(c.id)+'\')">'+esc4(verT(c))+'</button>':'';
  const td=(v,i,fila)=>{ const hay=fila&&Math.abs(v)>0.5&&R[fila]&&R[fila].it[i]&&R[fila].it[i].length, on=det&&det.fila===fila&&det.i===i;
    return '<td class="n'+(i===0?' hoy':'')+(sel===i?' sel':'')+(Math.abs(v)<0.5?' z':(v<0?' neg':''))+(hay?' clk':'')+(on?' on':'')+'"'+(hay?' onclick="p14Det(\''+fila+'\','+i+')"':'')+'>'+_z26c(v)+'</td>'; };
  const tg=(k,t)=>'<button type="button" class="z-nm" onclick="v3CajaTg(\''+k+'\')" aria-expanded="'+!!ab[k]+'">'+(ab[k]?'▾ ':'▸ ')+t+'</button>';
  const fila=(t,arr,o)=>{ o=o||{}; return '<tr class="'+(o.cls||'')+'"><td class="cp"'+(o.pad?' style="padding-left:'+o.pad+'px"':'')+'>'+t+(o.fte||'')+'</td>'+arr.map((v,i)=>td(v,i,o.fila)).join('')+'<td class="n">'+(o.sinT?'':_z26c(S(arr)))+'</td></tr>'; };
  let rows=fila('Saldo al empezar',X.ini,{sinT:1});
  rows+=fila(tg('entra','Entra'),ent,{cls:'tot'});
  if(ab.entra){ const cli=(X.v3&&X.v3.cli)||{}; Object.keys(cli).sort((a,b)=>S(cli[b])-S(cli[a])).forEach(n=>{ rows+=fila(esc4(n),cli[n],{cls:'kid',fila:esInterno(n)?'sole':'ext',fte:fte(cpOf('cobro:'+n))}); }); }
  rows+=fila(tg('sale','Sale'),sal,{cls:'tot'});
  if(ab.sale){
    rows+=fila(tg('china','China'),R.china.v,{cls:'kid',fila:'china'});
    if(ab.china){ const ks=['eagle','nexus','comp'], Z=()=>new Array(N).fill(0), nat=X.W.map((w,i)=>ks.reduce((a,k)=>a+((X.natProv[k]||[])[i]||0),0));
      const resto=X.W.map((w,i)=>R.china.v[i]-nat[i]-ks.reduce((a,k)=>a+((X.chPlan[k]||[])[i]||0),0));
      ks.forEach(k=>{ rows+=fila(esc4(_V3PROV[k]),X.chPlan[k]||Z(),{cls:'kid',pad:48,fte:fte(cpOf('pago:'+k))}); });
      rows+=fila('Vence según Andrés y el plan no cubre',nat,{cls:'kid',pad:48});
      if(resto.some(v=>Math.abs(v)>0.5)) rows+=fila('Sin asignar y lo que paga Finkargo',resto,{cls:'kid',pad:48}); }
    rows+=fila('Magnum',R.mag.v,{cls:'kid',fila:'mag',fte:fte(cpOf('pago:magnum'))})+fila('TIBA',R.tiba.v,{cls:'kid',fila:'tiba',fte:fte(cpOf('pago:tiba'))});
    if(R.otros.v.some(v=>v>0.5)||cpOf('pago:otros')) rows+=fila('Finkargo y otros cargos',R.otros.v,{cls:'kid',fila:'otros',fte:fte(cpOf('pago:otros'))});
    rows+=fila('Nómina y fijos',R.fij.v,{cls:'kid',fila:'fij'})+fila('Impuestos y 4x1000',R.imp.v,{cls:'kid',fila:'imp'}); }
  rows+=fila('Neto',net,{cls:'tot'});
  rows+='<tr class="tot" id="z26Cierre"><td class="cp">Saldo al cerrar</td>'+X.cierre.map((v,i)=>'<td class="n'+(i===0?' hoy':'')+(sel===i?' sel':'')+(v<0?' neg':'')+(i===mi?' low':'')+'"'+(v<col?' title="bajo el colchón"':'')+'>'+_z26c(v)+'</td>').join('')+'<td></td></tr>';
  const head='<thead><tr><th>Concepto</th>'+X.W.map((w,i)=>'<th class="n'+(i===0?' hoy':'')+(sel===i?' sel':'')+'"'+(i===0?' title="esta semana"':'')+'>'+_p14F(w)+'</th>').join('')+'<th class="n">'+N+' sem</th></tr></thead>';
  const tabla='<section class="z-box"><div class="z-wrap"><table class="z-t" id="z26Caja">'+head+'<tbody>'+rows+'</tbody></table></div>'
    +'<div class="z-bf">Lo atrasado que tiene plan sale en la semana actual. Lo vencido sin plan y lo atrasado de clientes no cuentan hasta que los programes en Planes. Clic en una cifra: su detalle.</div></section>';
  let side='';
  if(det&&R[det.fila]){ const nom={ext:'Clientes externos',sole:'Cliente del grupo',china:'China',mag:'Magnum',tiba:'TIBA',otros:'Finkargo y otros cargos',fij:'Nómina y fijos',imp:'Impuestos y 4x1000'}[det.fila]||'';
    const it=(R[det.fila].it[det.i]||[]).slice().sort((a,b)=>b.usd-a.usd), tot=it.reduce((a,x)=>a+x.usd,0);
    const ir=(det.fila==='mag'||det.fila==='tiba')?'<button type="button" class="z-btn sm" onclick="P14.acre=\''+(det.fila==='mag'?'magnum':'tiba')+'\';navTo(\'proveedores\')">Decidir factura por factura</button>'
      :((det.fila==='fij'||det.fila==='imp')?'<button type="button" class="z-btn sm" onclick="P14.acre=\'fijos\';navTo(\'proveedores\')">Ver en Proveedores</button>':'<button type="button" class="z-btn sm" onclick="navTo(\'planes\')">Abrir en Planes</button>');
    side='<aside class="z-side" id="z26Det" aria-label="Detalle de la cifra"><div class="z-sh"><div class="rw"><h3>'+esc4(nom)+' · semana del '+_p14F(X.W[det.i])+'</h3><span class="z-sp"></span><button type="button" class="z-btn q sm" onclick="p14Det(\''+det.fila+'\','+det.i+')">Cerrar</button></div>'
      +'<span class="z-mut" style="font-size:13px">'+it.length+' partida'+(it.length===1?'':'s')+' · '+_p14Full(tot)+'</span></div>'
      +'<div class="z-sb"><table class="z-t"><tbody>'+it.map(x=>'<tr><td style="white-space:normal;position:static">'+esc4(x.txt)+(x.plan?' '+_z26tag('info','Programado'):'')+'</td><td class="n"><b>'+_z26c(x.usd)+'</b></td></tr>').join('')+'</tbody></table></div>'
      +'<div class="z-sf">'+ir+'</div></aside>'; }
  return top+'<div class="z-caja'+(side?' det':'')+'">'+tabla+side+'</div>'; };
const _renderCajaAntes26=renderCaja;
renderCaja=function(){ const r=_renderCajaAntes26.apply(this,arguments);
  try{ const th=document.querySelector('#z26Caja th.sel'), w=th&&th.closest('.z-wrap'); if(th&&w) w.scrollLeft=Math.max(0,th.offsetLeft-w.clientWidth/2); }catch(e){} return r; };

/* ================= PLANES (operar) ================= */
function _z26VerT(c){ if(!c) return ''; if(!c.enCaja) return 'fuera de la Caja'; if(c.act==='base') return c.tipo==='Negociado'?'sin plan':(c.baseT||'automático');
  const v=_v3Vers(c).find(x=>x.id===c.act); return 'plan '+(v?v.t:c.act); }
function _z26Grilla(){
  const X=p14Calc('pago'), N=X.W.length, R=X.R, M=_v3Fichas(), C=M.C, Re=_v3Real(), Z=()=>new Array(N).fill(0), nz=a=>a.some(v=>Math.abs(v)>0.5);
  X.chPlan=X.chPlan||{}; X.natProv=X.natProv||{};
  const cli=(X.v3&&X.v3.cli)||{}, filas=[], it=k=>(i=>(R[k]&&R[k].it[i])||[]);
  const editable=c=>!!(c&&c.id&&(c.tipo==='Negociado'||c.act!=='base'));
  C.filter(c=>c.dir==='c').forEach(c=>{ const w=cli[c.n]?cli[c.n].slice():Z(); let atr=0, atrT='';
    if(c.tipo==='Negociado'){ const q=_z26Prom(c); atr=q.sin; atrT=q.n?q.n+' vencida'+(q.n===1?'':'s'):''; }
    else { atr=M.F.filter(x=>x.c===c&&x.w===-1).reduce((a,x)=>a+x.m,0); atrT=atr>0.5?'vencido':''; }
    filas.push({c,dir:'c',n:c.n,sub:_z26VerT(c),w,atr,atrT,atrC:'neg',auto:!editable(c),ed:editable(c)}); });
  Object.keys(cli).forEach(n=>{ if(!C.some(c=>c.dir==='c'&&c.n===n)&&nz(cli[n])) filas.push({c:null,dir:'c',n,sub:'',w:cli[n].slice(),atr:0,auto:true,items:it(esInterno(n)?'sole':'ext')}); });
  const E=X.W.map((w,i)=>R.ext.v[i]+R.sole.v[i]), sE=X.W.map((w,i)=>filas.reduce((a,f)=>a+f.w[i],0));
  if(sE.some((v,i)=>Math.abs(v-E[i])>0.5)) filas.push({c:null,dir:'c',n:'Otros cobros',sub:'',w:E.map((v,i)=>v-sE[i]),atr:0,auto:true,items:it('ext')});
  const nC=filas.length, ks=['eagle','nexus','comp'];
  ks.forEach(k=>{ const c=C.find(x=>x.id==='pago:'+k); const pl=(X.chPlan[k]||Z()).slice(), na=(X.natProv[k]||Z()).slice(), w=pl.map((v,i)=>v+na[i]);
    if(!c&&!nz(w)) return;
    const at=c?M.F.filter(x=>x.c===c&&!x.lock&&x.l&&x.w===-1):[], atr=at.reduce((a,x)=>a+Math.max(0,x.m-(+Re[x.l.id]||0)),0), sinReg=at.filter(x=>Re[x.l.id]==null||Re[x.l.id]==='').length;
    filas.push({c,dir:'p',n:c?c.n:_V3PROV[k],sub:_z26VerT(c),w,atr,atrT:atr>0.5?(sinReg?sinReg+' sin registrar':'pendiente'):'',atrC:'pend',sin:(c&&c.sinPlan)||0,
      kids:(nz(pl)&&nz(na))?[{n:'Tu plan',w:pl},{n:'Fechas de Andrés',w:na,au:1}]:null,auto:!nz(pl)&&nz(na),ed:editable(c),items:it('china')}); });
  const resto=X.W.map((w,i)=>R.china.v[i]-ks.reduce((a,k)=>a+((X.chPlan[k]||[])[i]||0)+((X.natProv[k]||[])[i]||0),0));
  if(nz(resto)) filas.push({c:null,dir:'p',n:(X.chPlan.sin&&nz(X.chPlan.sin))?'Sin asignar y lo que paga Finkargo':'Lo paga Finkargo',sub:'no sale de tus bancos',w:resto,atr:0,auto:true,items:i=>(R.china.it[i]||[]).filter(x=>/Finkargo|sin asignar/i.test(x.txt||''))});
  [['magnum','mag'],['tiba','tiba'],['otros','otros']].forEach(([k,f])=>{ const c=C.find(x=>x.id==='pago:'+k), w=R[f].v.slice(); if(!c&&!nz(w)) return;
    filas.push({c,dir:'p',n:c?c.n:(k==='otros'?'Finkargo y otros cargos':k),sub:_z26VerT(c),w,atr:0,auto:!editable(c),ed:editable(c),items:it(f)}); });
  filas.push({c:null,dir:'p',n:'Fijos e impuestos',sub:'automático',w:X.W.map((w,i)=>R.fij.v[i]+R.imp.v[i]),atr:0,auto:true,fijos:true,items:i=>(R.fij.it[i]||[]).concat(R.imp.it[i]||[])});
  const Sa=X.W.map((w,i)=>R.china.v[i]+R.mag.v[i]+R.tiba.v[i]+R.otros.v[i]+R.fij.v[i]+R.imp.v[i]), sS=X.W.map((w,i)=>filas.slice(nC).reduce((a,f)=>a+f.w[i],0));
  if(sS.some((v,i)=>Math.abs(v-Sa[i])>0.5)) filas.push({c:null,dir:'p',n:'Otros pagos',sub:'',w:Sa.map((v,i)=>v-sS[i]),atr:0,auto:true});
  Z26.M=M;
  return {X,N,filas,nC,E,Sa,Ne:E.map((v,i)=>v-Sa[i]),atrSale:filas.slice(nC).reduce((a,f)=>a+(f.atr||0),0)}; }
function _z26PlHTML(){
  const G=_z26Grilla(); Z26.G=G; const {X,N,filas,nC}=G, S=a=>a.reduce((x,y)=>x+y,0);
  const cel=(f,r,v,i)=>{ const vacio=Math.abs(v)<0.5, puede=!vacio||f.ed, mk=(i===0&&f.dir==='p'&&(f.atr||0)>0.5)?'<span class="z-mk">1</span>':'';
    const cls='n'+(i===0?' hoy':'')+(vacio?' z':(v<0?' neg':''))+(f.auto&&!vacio?' au':'')+((Z26.pop&&Z26.pop.r===r&&Z26.pop.i===i)?' on':'');
    return '<td class="'+cls+'" data-r="'+r+'" data-i="'+i+'">'+(puede?'<button type="button" class="z-cell" data-z="cel" data-r="'+r+'" data-i="'+i+'" aria-label="'+esc4(f.n+' · '+_z26Sem(i))+'">'+_z26m(v)+mk+'</button>':_z26m(v)+mk)+'</td>'; };
  const atrCel=(f,r)=>{ const a=f.atr||0, s=f.sin||0; if(a<0.5&&s<0.5) return '<td class="n z">—</td>';
    const cls=a<0.5?' sinp':(f.atrC==='pend'?' pend':' neg');
    return '<td class="n'+cls+'" data-r="'+r+'" data-i="-1"><button type="button" class="z-cell" data-z="cel" data-r="'+r+'" data-i="-1">'+(a>0.5?_z26m(a)+(f.atrT?'<span class="z-sub">'+esc4(f.atrT)+'</span>':''):'')
      +(s>0.5?(a>0.5?'<span class="z-sub" style="color:var(--z-crit)">+ '+_z26m(s)+'</span>':_z26m(s))+'<span class="z-sub" style="color:var(--z-crit)">sin plan</span>':'')+'</button></td>'; };
  const nom=f=>f.c&&f.c.id?'<button type="button" class="z-nm" data-z="nm" data-cp="'+esc4(f.c.id)+'"><b>'+esc4(f.n)+'</b><small>'+esc4(f.sub)+'</small></button>':'<b>'+esc4(f.n)+'</b>'+(f.sub?'<small>'+esc4(f.sub)+'</small>':'');
  const fila=(f,r)=>{ let h='<tr data-n="'+esc4(f.n.toLowerCase())+'"><td class="cp">'+nom(f)+'</td>'+atrCel(f,r)+f.w.map((v,i)=>cel(f,r,v,i)).join('')+'<td class="n"><b>'+_z26m(S(f.w))+'</b></td></tr>';
    (f.kids||[]).forEach(k=>{ h+='<tr class="kid" data-n="'+esc4(f.n.toLowerCase())+'"><td>'+esc4(k.n)+'</td><td></td>'+k.w.map((v,i)=>'<td class="n'+(i===0?' hoy':'')+(Math.abs(v)<0.5?' z':(k.au?' au':''))+'">'+_z26m(v)+'</td>').join('')+'<td class="n">'+_z26m(S(k.w))+'</td></tr>'; });
    return h; };
  const tot=(t,arr,atr,id,neg)=>'<tr class="tot"'+(id?' id="'+id+'"':'')+'><td class="cp">'+t+'</td><td class="n'+(atr==null?'':' z')+'">'+(atr==null?'':atr)+'</td>'+arr.map((v,i)=>'<td class="n'+(i===0?' hoy':'')+(neg&&v<0?' neg':'')+'">'+_z26m(v)+'</td>').join('')+'<td class="n">'+(id==='z26Saldo'?'':_z26m(S(arr)))+'</td></tr>';
  const head='<thead><tr><th>Contraparte</th><th class="n">Atrasado</th>'+X.W.map((w,i)=>'<th class="n'+(i===0?' hoy':'')+'"'+(i===0?' title="esta semana"':'')+'>'+_p14F(w)+'</th>').join('')+'<th class="n">12 sem</th></tr></thead>';
  let b='<tr class="sec"><td colspan="'+(N+3)+'">Me pagan</td></tr>'+filas.slice(0,nC).map((f,r)=>fila(f,r)).join('')
    +tot('Entra',G.E,'no cuenta','z26Entra')
    +'<tr class="sec"><td colspan="'+(N+3)+'">Yo pago</td></tr>'+filas.slice(nC).map((f,r)=>fila(f,r+nC)).join('')
    +tot('Sale',G.Sa,G.atrSale>0.5?_z26m(G.atrSale)+'<span class="z-mk">1</span>':'—','z26Sale')
    +tot('Neto',G.Ne,null,'z26Neto',true)
    +tot('Saldo al cerrar = Caja',X.cierre,null,'z26Saldo',true);
  const head2='<div class="z-ph"><h2>Planes</h2><span class="z-def">US$ · semanas de lunes a domingo · mismas cifras de la Caja · gris = automático (regla, cuotas o fechas de Andrés)</span><span class="z-sp"></span>'
    +'<input class="z-in" style="width:220px" type="search" data-z="q" placeholder="Buscar contraparte" aria-label="Buscar contraparte" value="'+esc4(Z26.q||'')+'"></div>';
  return head2+'<section class="z-box"><div class="z-wrap" id="z26PlW"><table class="z-t z-dense" id="z26Plan">'+head+'<tbody>'+b+'</tbody></table></div>'
    +'<div class="z-bf"><span class="z-mk">1</span> Esta semana incluye lo atrasado que tiene plan: sale ya. Lo vencido sin plan (contorno rojo) y lo atrasado de clientes no cuentan hasta que los programes. Clic en una cifra para moverla, cambiarla o marcarla pagada; clic en un nombre para su cronograma.</div></section>'; }
renderPlanes=function(){
  const v=document.getElementById('v-planes'); if(!v) return;
  if(!EQ.length&&!_ecClientes().length){ v.innerHTML='<div class="z-ph"><h2>Planes</h2></div><div class="ec8-vacio">Carga el detailed y el order report con <b>Cargar archivo</b>.</div>'; return; }
  _z26PlEventos(v);
  const w0=document.getElementById('z26PlW'), sx=w0?w0.scrollLeft:0;
  v.innerHTML=_z26PlHTML();
  const w=document.getElementById('z26PlW'); if(w) w.scrollLeft=sx;
  _z26Filtro(); if(Z26.pop) _z26PopPintar(); };
function _z26Filtro(){ const q=(Z26.q||'').trim().toLowerCase(); document.querySelectorAll('#z26Plan tbody tr[data-n]').forEach(tr=>{ tr.hidden=!!q&&tr.dataset.n.indexOf(q)<0; }); }
_v3Hecho=function(){ guardar4(); _z26Repintar(); };
const _v2ListoAntes26=_v2Listo;
_v2Listo=function(){ const r=_v2ListoAntes26.apply(this,arguments); try{ _z26DrPintar(); }catch(e){ console.warn(e); } return r; };

/* ---- la ventanita de una cifra ---- */
function _z26Opts(sel){ let h=''; for(let i=0;i<12;i++) h+='<option value="'+i+'"'+(i===sel?' selected':'')+'>'+(i===0?'Esta semana · ':'')+_z26Sem(i)+'</option>'; return (sel<0?'<option value="-1" selected disabled>Atrasado</option>':'')+h; }
function _z26PopHTML(f,i){
  const c=f.c, Re=_v3Real(), M=Z26.M||_v3Fichas(), lab=i<0?'Atrasado':'Semana del '+_z26Sem(i), cid=c&&c.id?esc4(c.id):'';
  let h='<div class="hd"><b>'+esc4(f.n)+' · '+lab+'</b><span class="z-sp"></span><button type="button" class="z-btn q sm" data-z="popx">Cerrar</button></div>';
  const L=c&&c.id?M.F.filter(x=>x.c.id===c.id&&!x.lock&&x.l&&(x.w===i||(i===0&&f.dir==='p'&&x.w===-1))).sort((a,b)=>_v3PorF(a.l,b.l)):[];
  L.forEach(x=>{ const l=x.l, d=_p14D(l.f), r=Re[l.id], rv=r==null||r===''?null:+r, prov=f.dir==='p', past=d&&d<TODAY;
    let est; if(prov) est=rv!=null&&rv>=l.m-0.5?['ok','Pagado']:(rv>0.5?['warn','Parcial '+Math.round(rv/Math.max(1,l.m)*100)+' %']:(past?['warn','Sin registrar']:['info','Programado']));
    else est=past?['crit','Vencida']:['info','Programado'];
    h+='<div class="ln"><div class="rw"><b style="color:var(--ink)">'+(d?_p14F(d):'sin fecha')+'</b><span>'+esc4(f.sub)+'</span><span class="z-sp"></span>'+_z26tag(est[0],est[1])+'</div>'
      +'<div class="rw"><label>Monto<input class="z-in n" data-z="m" data-cp="'+cid+'" data-id="'+esc4(l.id)+'" value="'+fmtUSDs(l.m)+'" inputmode="decimal"></label>'
      +'<label>Semana<select class="z-in" data-z="w" data-cp="'+cid+'" data-id="'+esc4(l.id)+'">'+_z26Opts(x.w)+'</select></label></div>'
      +'<div class="rw">'+(prov?'<label>Pagado<input class="z-in n" data-z="pg" data-id="'+esc4(l.id)+'" value="'+(rv==null?'':fmtUSDs(rv))+'" placeholder="—" inputmode="decimal"></label>'
        +(rv==null||rv<l.m-0.5?'<button type="button" class="z-btn sm pri" data-z="mp" data-id="'+esc4(l.id)+'" data-m="'+l.m+'">Marcar pagado</button>':''):'')
      +'<span class="z-sp"></span><button type="button" class="z-btn q sm" data-z="del" data-cp="'+cid+'" data-id="'+esc4(l.id)+'">Borrar</button></div></div>'; });
  const A=c&&c.id?M.F.filter(x=>x.c.id===c.id&&x.lock&&x.w===i):[];
  A.forEach(x=>{ h+='<div class="it"><span>'+esc4(x.nat?'Fechas de Andrés · '+x.n+' pago'+(x.n===1?'':'s'):((c.baseT||'Automático')+(x.n?' · '+x.n:'')))+' '+_z26tag('idle','Automático')+'</span><b>'+_z26m(x.m)+'</b></div>'; });
  if(!L.length&&!A.length&&f.items&&i>=0){ const it=f.items(i)||[]; it.forEach(x=>{ h+='<div class="it"><span>'+esc4(x.txt)+'</span><b>'+_z26m(x.usd)+'</b></div>'; }); if(!it.length&&!f.ed) h+='<div class="rw">Nada esta semana.</div>'; }
  if(i===-1&&(f.sin||0)>0.5) h+='<div class="rw">'+_z26tag('out','Sin plan')+'<b>'+_z26m(f.sin)+'</b><span>vencido según Andrés, sin giro programado</span></div>';
  if(i===-1&&f.dir==='c'&&c&&c.tipo==='Negociado'){ const q=_z26Prom(c); if(q.n) h+='<div class="rw">Prometido '+_z26m(q.plan)+' · recibido '+_z26m(q.rec)+' · desde '+_p14F(q.primera)+'</div>'; }
  if(f.ed&&i>=0) h+='<div class="rw" style="border-top:1px solid var(--rule);padding-top:8px"><label>+ Pago esta semana<input class="z-in n" data-z="addm" placeholder="US$" inputmode="decimal"></label><button type="button" class="z-btn sm pri" data-z="add" data-cp="'+cid+'" data-i="'+i+'">Agregar</button></div>';
  if(c&&c.id) h+='<div class="rw">'+(f.ed?'':(c.tipo!=='Regla'?'<button type="button" class="z-btn sm" data-z="neg" data-cp="'+cid+'">Hacer plan propio</button>':''))+'<span class="z-sp"></span><button type="button" class="z-btn q sm" data-z="nm" data-cp="'+cid+'">Ver cronograma</button></div>';
  return h; }
function _z26PopPintar(){
  const v=document.getElementById('v-planes'); let p=document.getElementById('z26Pop'); if(p) p.remove(); const P=Z26.pop; if(!P||!v) return;
  const f=Z26.G&&Z26.G.filas[P.r], cell=v.querySelector('#z26Plan td[data-r="'+P.r+'"][data-i="'+P.i+'"]'); if(!f||!cell){ Z26.pop=null; return; }
  cell.classList.add('on');
  p=document.createElement('div'); p.id='z26Pop'; p.className='z-pop'; p.setAttribute('role','dialog'); p.setAttribute('aria-label',f.n); p.innerHTML=_z26PopHTML(f,P.i); v.appendChild(p);
  const vr=v.getBoundingClientRect(), cr=cell.getBoundingClientRect(), W=p.offsetWidth||360;
  let left=cr.right-vr.left-W; if(left<0) left=cr.left-vr.left; left=Math.max(0,Math.min(left,v.clientWidth-W)); p.style.left=left+'px'; p.style.top=(cr.bottom-vr.top+6)+'px'; }
function z26CerrarPop(){ Z26.pop=null; const p=document.getElementById('z26Pop'); if(p) p.remove(); document.querySelectorAll('#z26Plan td.on').forEach(x=>x.classList.remove('on')); }
function _z26PlEventos(v){
  if(v._z26) return; v._z26=true;
  v.addEventListener('click',e=>{ const t=e.target.closest('[data-z]'); if(!t||!v.contains(t)) return; const z=t.dataset.z, D=t.dataset;
    if(z==='cel'){ const r=+D.r, i=+D.i; if(Z26.pop&&Z26.pop.r===r&&Z26.pop.i===i){ z26CerrarPop(); return; } z26CerrarPop(); Z26.pop={r,i}; _z26PopPintar(); const f=document.querySelector('#z26Pop input,#z26Pop button'); if(f) f.focus(); return; }
    if(z==='nm'){ z26Abrir(D.cp); return; }
    if(z==='popx'){ z26CerrarPop(); return; }
    const c=D.cp?_v3Cp(D.cp):(Z26.pop&&Z26.G&&Z26.G.filas[Z26.pop.r]?Z26.G.filas[Z26.pop.r].c:null);
    if(z==='mp'){ const s=_z26Snap(); _v3Real()[D.id]=+D.m; return _z26Hecho('Marcado pagado',s); }
    if(z==='del'&&c){ const s=_z26Snap(); _v3LinDel(c,c.act,D.id); return _z26Hecho('Pago borrado',s); }
    if(z==='add'&&c){ const inp=document.querySelector('#z26Pop [data-z="addm"]'), m=_v3Num(inp?inp.value:''); if(!(m>0)){ z26Aviso('Escribe el monto'); if(inp) inp.focus(); return; }
      const s=_z26Snap(); let vid=c.act; if(vid==='base'&&c.tipo==='Negociado'){ vid='a'; v2PlActivar(_v3PlanDe(c).id,'a'); }
      if(vid==='base') return; _v3LinAdd(c,vid,_v3FechaSem(+D.i),m,(c.dir==='c'&&c.tipo==='Negociado')?'china':''); return _z26Hecho('Pago agregado: '+_z26m(m)+' la semana del '+_z26Sem(+D.i),s); }
    if(z==='neg'&&c){ const s=_z26Snap(); const nv=v3Negociar(c.id,'base'); if(nv) v3Activar(c.id,nv.id); z26CerrarPop(); z26Abrir(c.id); return _z26Hecho('Plan propio: cuenta en la Caja',s); } });
  v.addEventListener('change',e=>{ const t=e.target.closest('[data-z]'); if(!t||!v.contains(t)) return; const z=t.dataset.z, D=t.dataset, val=t.value;
    const c=D.cp?_v3Cp(D.cp):null;
    if(z==='pg'){ const s=_z26Snap(), R=_v3Real(); if((''+val).trim()==='') delete R[D.id]; else R[D.id]=_v3Num(val); return _z26Hecho('Pagado registrado',s); }
    if(z==='m'&&c){ const s=_z26Snap(); _v3LinSet(c,c.act,D.id,'m',_v3Num(val)); return _z26Hecho('Monto cambiado',s); }
    if(z==='w'&&c){ const l=_v3Lin(c,c.act).find(x=>x.id===D.id); if(!l) return; const s=_z26Snap(); _v3LinSet(c,c.act,D.id,'f',_v3Mover(l.f,+val)); z26CerrarPop(); return _z26Hecho('Pago movido a la semana del '+_z26Sem(+val),s); } });
  v.addEventListener('input',e=>{ const t=e.target; if(t&&t.dataset&&t.dataset.z==='q'){ Z26.q=t.value; _z26Filtro(); } });
  v.addEventListener('keydown',e=>{ const t=e.target; if(e.key==='Enter'&&t&&t.dataset&&t.dataset.z==='addm'){ const b=document.querySelector('#z26Pop [data-z="add"]'); if(b) b.click(); } });
}

/* ---- el cronograma en un panel lateral ---- */
function z26Abrir(cpId){ Z26.dr={cp:cpId,tool:null,ren:false}; _z26DrPintar(); const d=document.getElementById('z26Dr'); if(d){ const b=d.querySelector('[data-z="drx"]'); if(b) b.focus(); } }
function z26Cerrar(){ Z26.dr=null; _z26DrPintar(); }
v3Abrir=function(cpId){ navTo('planes'); z26Abrir(cpId); };
function _z26DrPintar(){
  let d=document.getElementById('z26Dr'); if(!Z26.dr){ if(d) d.remove(); return; }
  const c=_v3Cp(Z26.dr.cp); if(!c){ Z26.dr=null; if(d) d.remove(); return; }
  if(!d){ d=document.createElement('aside'); d.id='z26Dr'; d.className='z-drawer'; d.setAttribute('role','complementary'); document.body.appendChild(d); _z26DrEventos(d); }
  d.setAttribute('aria-label','Cronograma de '+c.n);
  const b0=d.querySelector('.db'), sc=b0?b0.scrollTop:0; d.innerHTML=_z26DrHTML(c); const b=d.querySelector('.db'); if(b) b.scrollTop=sc; }
function _z26DrHTML(c){
  const cobro=c.dir==='c', china=!!_V3PROV[c.prov], vers=_v3Vers(c), vk=c.act, edit=vk!=='base', Re=_v3Real(), dr=Z26.dr;
  const Lc=_v3Lin(c,vk).filter(l=>!l.sint).sort(_v3PorF), tot=Lc.reduce((a,l)=>a+l.m,0);
  let linea;
  if(cobro){ const t=ecTotales(c.n)||{}; linea='Te debe '+_z26m(t.saldo||0)+' · vencido '+_z26m(t.vencido||0)+' · en este plan '+_z26m(tot); }
  else if(china){ const D=c.deudas||[], v=D.filter(x=>x.venc).reduce((a,x)=>a+x.m,0), T=D.reduce((a,x)=>a+x.m,0); linea='Le debes '+_z26m(T)+' según Andrés · vencido '+_z26m(v)+' · en este plan '+_z26m(tot); }
  else linea=(c.baseT||'')+' · en este plan '+_z26m(tot);
  const opt=vers.map(o=>'<option value="'+esc4(o.id)+'"'+(c.enCaja&&o.id===vk?' selected':'')+'>'+esc4(o.t+(o.id===vk&&c.enCaja?' · cuenta en la Caja':''))+'</option>').join('')
    +'<option value="__fuera"'+(!c.enCaja?' selected':'')+'>Fuera de la Caja</option><option value="__nueva">+ Versión nueva, copia de esta</option>';
  const recW=cobro?_v2Recibido(c.n):{}, usado={}; let tRec=0;
  const filas=Lc.map(l=>{ const d=_p14D(l.f), past=d&&d<TODAY; let c3, est, extra='';
    if(cobro){ const k=d?_p14Iso(_p14Lun(d)):''; let rec=0; if(k&&!usado[k]){ rec=+recW[k]||0; usado[k]=1; } tRec+=rec;
      est=l.cump?['ok','Cobrado']:(past?(rec>=l.m-0.5?['ok','Cobrado']:(rec>0.5?['warn','Parcial · '+_z26m(rec)]:['crit','Incumplida '+days(d,TODAY)+' d'])):(rec>0.5?['ok','Recibido '+_z26m(rec)]:['info','Programado']));
      c3='<td>'+(edit?'<select class="z-in" data-z="pc" data-id="'+esc4(l.id)+'" aria-label="Destino">'+_V3DEST.map(o=>'<option value="'+esc4(o[0])+'"'+(o[0]===(l.c||'')?' selected':'')+'>'+esc4(o[1])+'</option>').join('')+'</select>':esc4(_v3DestLab(l.c)||'—'))+'</td>'; }
    else { const r=Re[l.id], rv=r==null||r===''?null:+r; tRec+=rv||0;
      est=rv!=null&&rv>=l.m-0.5?['ok','Pagado']:(rv>0.5?['warn','Parcial '+Math.round(rv/Math.max(1,l.m)*100)+' %']:(past?['warn','Sin registrar']:['info','Programado']));
      c3='<td class="n">'+(edit?'<input class="z-in n" style="width:96px" data-z="pg" data-id="'+esc4(l.id)+'" value="'+(rv==null?'':fmtUSDs(rv))+'" placeholder="—" inputmode="decimal" aria-label="Pagado el '+(d?_p14F(d):'')+'">':(rv==null?'—':_z26m(rv)))+'</td>';
      if(edit&&past&&est[1]!=='Pagado') extra=' <button type="button" class="z-btn sm" data-z="mp" data-id="'+esc4(l.id)+'" data-m="'+l.m+'">Marcar pagado</button>'; }
    return '<tr><td>'+(edit?'<input class="z-in" type="date" data-z="f" data-id="'+esc4(l.id)+'" value="'+esc4(l.f)+'" aria-label="Fecha">':(d?_p14F(d):'—'))+'</td>'
      +'<td class="n">'+(edit?'<input class="z-in n" data-z="m" data-id="'+esc4(l.id)+'" value="'+fmtUSDs(l.m)+'" inputmode="decimal" aria-label="Monto">':_z26m(l.m))+'</td>'+c3
      +'<td style="white-space:normal">'+_z26tag(est[0],est[1])+extra+'</td>'
      +'<td>'+(edit?'<button type="button" class="z-btn q sm" data-z="del" data-id="'+esc4(l.id)+'" aria-label="Borrar pago">✕</button>':'')+'</td></tr>'; }).join('');
  const tp=V3.tp, o12=v=>[...Array(12)].map((x,i)=>'<option value="'+i+'"'+(String(i)===String(v)?' selected':'')+'>'+_z26Sem(i)+'</option>').join('');
  let tool='';
  if(edit&&dr.tool==='rep') tool='<div class="z-tool"><label>Monto total<input class="z-in n" data-z="tp-monto" value="'+esc4(tp.monto)+'" inputmode="decimal"></label><label>Desde<select class="z-in" data-z="tp-a">'+o12(tp.a)+'</select></label><label>Hasta<select class="z-in" data-z="tp-b">'+o12(tp.b)+'</select></label><button type="button" class="z-btn pri" data-z="rep">Poner en el cronograma</button></div>';
  if(edit&&dr.tool==='cuo') tool='<div class="z-tool"><label>Cuota<input class="z-in n" data-z="tp-monto" value="'+esc4(tp.monto)+'" inputmode="decimal"></label><label>Desde<select class="z-in" data-z="tp-a">'+o12(tp.a)+'</select></label><label>Cada<select class="z-in" data-z="tp-k"><option value="1"'+(tp.k==='1'?' selected':'')+'>semana</option><option value="2"'+(tp.k==='2'?' selected':'')+'>2 semanas</option><option value="4"'+(tp.k==='4'?' selected':'')+'>4 semanas</option></select></label><label>Veces<input class="z-in n" style="width:70px" data-z="tp-v" value="'+esc4(tp.v)+'" inputmode="numeric"></label><button type="button" class="z-btn pri" data-z="cuo">Poner en el cronograma</button></div>';
  const pv=c.p&&(c.p.versiones||[]).find(v=>v.id===vk), borrable=edit&&!(vk==='a'&&c.tipo==='Negociado')&&!!pv;
  const ren=edit&&pv&&dr.ren?'<label class="z-mut" style="display:flex;gap:8px;align-items:center;font-size:13px">Nombre<input class="z-in" data-z="vnom" value="'+esc4(pv.nombre||'')+'"></label>':'';
  let ped='';
  if(china&&edit){ const Fi=_v3Fifo(c.deudas||[],Lc.filter(l=>l.m>0.005&&l.f)); if(Fi&&Fi.R.length) ped='<details><summary>Qué pedidos paga cada giro</summary><div class="z-wrap" style="margin-top:8px"><table class="z-t"><thead><tr><th>Pedido</th><th class="n">US$</th><th>Fecha límite</th><th>Lo paga</th></tr></thead><tbody>'
    +Fi.R.map(r=>'<tr><td><b>'+esc4(r.d.ped)+'</b> <span class="z-mut3">'+esc4(r.d.tipo||'')+'</span></td><td class="n">'+_z26m(r.d.m)+'</td><td>'+(r.d.f?_p14F(_p14D(r.d.f)):(r.d.venc?'pagar ya':'sin BL'))+'</td><td>'+_z26tag(r.rest<0.5?'ok':(r.por.length?'warn':'crit'),r.rest<0.5?r.por.join(' + '):(r.por.length?'parcial · falta '+_z26m(r.rest):'sin cubrir'))+'</td></tr>').join('')+'</tbody></table></div></details>'; }
  const ir=cobro?'<button type="button" class="z-btn sm" data-z="ec">Ver estado de cuenta</button>':(c.tipo==='Regla'||c.prov==='otros'?'<button type="button" class="z-btn sm" data-z="fxf">'+(c.tipo==='Regla'?'Factura por factura':'Ver en Proveedores')+'</button>':'');
  return '<div class="dh"><div class="rw"><h3>'+esc4(c.n)+'</h3>'+_z26tag(cobro?'ok':'idle',cobro?'Me paga':'Le pago')+'<span class="z-sp"></span><button type="button" class="z-btn q sm" data-z="drx">Cerrar</button></div>'
    +'<span class="z-mut" style="font-size:13px">'+esc4(linea)+'</span>'
    +'<div class="rw"><label class="z-mut" style="display:flex;gap:8px;align-items:center;font-size:13px">Versión<select class="z-in" data-z="ver" aria-label="Versión del plan">'+opt+'</select></label>'+ren+'</div></div>'
    +'<div class="db">'+(edit?'':'<div class="rw" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'+_z26tag('idle','Automático')+'<span class="z-mut">'+esc4(c.baseT||'se calcula solo')+'</span><span class="z-sp"></span><button type="button" class="z-btn sm" data-z="neg">Hacer plan propio</button></div>')
    +tool+'<div class="z-wrap"><table class="z-t"><thead><tr><th>Fecha</th><th class="n">US$</th>'+(cobro?'<th>Destino</th>':'<th class="n">Pagado</th>')+'<th>Estado</th><th></th></tr></thead><tbody>'
    +(filas||'<tr><td colspan="5" class="z">Sin pagos todavía. Usa + Pago.</td></tr>')
    +'<tr class="tot"><td>Total</td><td class="n">'+_z26m(tot)+'</td>'+(cobro?'<td colspan="3">recibido '+_z26m(tRec)+'</td>':'<td class="n">'+_z26m(tRec)+'</td><td colspan="2"></td>')+'</tr></tbody></table></div>'+ped+'</div>'
    +'<div class="df">'+(edit?'<button type="button" class="z-btn" data-z="padd">+ Pago</button><details class="z-menu"><summary class="z-btn">Más ▾</summary><div class="z-mn">'
      +'<button type="button" data-z="tool" data-t="rep">Repartir un monto</button><button type="button" data-z="tool" data-t="cuo">Cuotas iguales</button>'
      +(pv?'<button type="button" data-z="ren">Renombrar versión</button>':'')+(borrable?'<button type="button" class="dng" data-z="vdel">Borrar esta versión</button>':'')+'</div></details>':'')
    +ir+'<span class="z-sp"></span><span>Se guarda al salir de cada campo</span></div>'; }
function _z26DrEventos(d){
  d.addEventListener('click',e=>{ const t=e.target.closest('[data-z]'); if(!t||!d.contains(t)) return; const z=t.dataset.z, D=t.dataset;
    if(z==='drx'){ z26Cerrar(); return; }
    const c=_v3Cp(Z26.dr&&Z26.dr.cp); if(!c) return;
    if(z==='padd'){ const s=_z26Snap(), L=_v3Lin(c,c.act).filter(l=>!l.sint&&l.f).map(l=>l.f).sort(), last=L.pop();
      let f=last?_p14Iso(addD(_p14D(last),7)):_v3FechaSem(1); if(_p14D(f)<TODAY) f=_p14Iso(TODAY);
      _v3LinAdd(c,c.act,f,0,c.dir==='c'?'china':''); return _z26Hecho('Pago agregado el '+_p14F(_p14D(f))+': escribe el monto',s); }
    if(z==='del'){ const s=_z26Snap(); _v3LinDel(c,c.act,D.id); return _z26Hecho('Pago borrado',s); }
    if(z==='mp'){ const s=_z26Snap(); _v3Real()[D.id]=+D.m; return _z26Hecho('Marcado pagado',s); }
    if(z==='neg'){ const s=_z26Snap(), nv=v3Negociar(c.id,'base'); if(nv) v3Activar(c.id,nv.id); return _z26Hecho('Plan propio: cuenta en la Caja',s); }
    if(z==='tool'){ Z26.dr.tool=Z26.dr.tool===D.t?null:D.t; const m=t.closest('details'); if(m) m.open=false; _z26DrPintar(); return; }
    if(z==='ren'){ Z26.dr.ren=true; _z26DrPintar(); const i=d.querySelector('[data-z="vnom"]'); if(i) i.focus(); return; }
    if(z==='rep'||z==='cuo'){ const tp=V3.tp, pares=[];
      if(z==='rep'){ const a=Math.min(+tp.a,+tp.b), b=Math.max(+tp.a,+tp.b), n=b-a+1, m=_v3Num(tp.monto); if(!(m>0)){ z26Aviso('Escribe el monto'); return; }
        const q=Math.round(m/n/100)*100; for(let w=a;w<=b;w++) pares.push([w,w===b?m-q*(n-1):q]); }
      else { const m=_v3Num(tp.monto); if(!(m>0)){ z26Aviso('Escribe la cuota'); return; } for(let w=+tp.a,i=0;i<Math.max(0,Math.round(_v3Num(tp.v)))&&w<12;w+=Math.max(1,+tp.k),i++) pares.push([w,m]); }
      const s=_z26Snap(); pares.forEach(([w,m])=>{ if(m>0.005) _v3LinAdd(c,c.act,_v3FechaSem(w),m,c.dir==='c'?'china':''); }); Z26.dr.tool=null; return _z26Hecho(pares.length+' pagos agregados',s); }
    if(z==='vdel'){ const m=t.closest('details'); if(m) m.open=false; const pv=c.p&&(c.p.versiones||[]).find(x=>x.id===c.act); if(!pv) return;
      z26Dialogo({t:'¿Borrar la versión '+pv.id+' · '+(pv.nombre||'')+'?',x:'Sus pagos dejan de contar en la Caja y queda '+(c.tipo==='Negociado'?'el plan a':'la base')+'. Puedes deshacerlo justo después.',ok:'Borrar versión',peligro:true}).then(ok=>{ if(!ok) return;
        const s=_z26Snap(), p=_v2Plan(c.id); if(!p) return; p.versiones=(p.versiones||[]).filter(x=>x.id!==pv.id); p.activa=c.tipo==='Negociado'?'a':'base'; _z26Hecho('Versión borrada',s); }); return; }
    if(z==='ec'){ navTo('clientes'); selCliData(c.n); return; }
    if(z==='fxf'){ P14.acre=c.prov==='otros'?'finkargo':c.prov; navTo('proveedores'); renderPorPagar(); return; } });
  d.addEventListener('change',e=>{ const t=e.target.closest('[data-z]'); if(!t||!d.contains(t)) return; const z=t.dataset.z, D=t.dataset, val=t.value, c=_v3Cp(Z26.dr&&Z26.dr.cp); if(!c) return;
    if(z==='ver'){ const s=_z26Snap();
      if(val==='__fuera'){ v3EnCaja(c.id,false); return _z26Hecho(c.n+' queda fuera de la Caja',s); }
      if(val==='__nueva'){ const nv=v3Negociar(c.id,c.act); if(nv) v3Activar(c.id,nv.id); if(!c.enCaja) v3EnCaja(c.id,true); return _z26Hecho('Versión nueva: cuenta en la Caja',s); }
      if(!c.enCaja) v3EnCaja(c.id,true); v3Activar(c.id,val); return _z26Hecho('Cuenta en la Caja: '+((_v3Vers(c).find(x=>x.id===val)||{t:val}).t),s); }
    if(z==='f'){ if(!val||+(''+val).slice(0,4)<2000) return; const s=_z26Snap(); _v3LinSet(c,c.act,D.id,'f',val); return _z26Hecho('Fecha cambiada',s); }
    if(z==='m'){ const s=_z26Snap(); _v3LinSet(c,c.act,D.id,'m',_v3Num(val)); return _z26Hecho('Monto cambiado',s); }
    if(z==='pc'){ const s=_z26Snap(); _v3LinSet(c,c.act,D.id,'c',val); return _z26Hecho('Destino: '+(_v3DestLab(val)||'ninguno'),s); }
    if(z==='pg'){ const s=_z26Snap(), R=_v3Real(); if((''+val).trim()==='') delete R[D.id]; else R[D.id]=_v3Num(val); return _z26Hecho('Pagado registrado',s); }
    if(z==='vnom'){ const p=_v2Plan(c.id), v=p&&(p.versiones||[]).find(x=>x.id===c.act); if(!v) return; const s=_z26Snap(); v.nombre=(''+val).trim()||v.nombre; Z26.dr.ren=false; return _z26Hecho('Versión renombrada',s); }
    if(z.indexOf('tp-')===0){ V3.tp[z.slice(3)]=val; _z26DrPintar(); } });
}

/* ---- teclado: Esc cierra, Ctrl K busca; clic afuera cierra la ventanita ---- */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!document.getElementById('z26Dlg')){ if(Z26.pop){ z26CerrarPop(); return; } if(Z26.dr){ z26Cerrar(); return; } }
  if((e.ctrlKey||e.metaKey)&&(e.key==='k'||e.key==='K')){ const i=document.getElementById('cmd'); if(i){ e.preventDefault(); i.focus(); } } });
document.addEventListener('click',e=>{ if(!Z26.pop) return; if(e.target.closest('#z26Pop')||e.target.closest('[data-z="cel"]')) return; z26CerrarPop(); });

/* ---- arranque ---- */
(function z26Init(){ try{ _z26Css(); _z26Nav(); _z26CtaTitulo(); if(typeof google!=='undefined'&&google.script) _z26G('ok'); }catch(err){ console.warn('v2.6 init',err); } })();
