/* ===================================================================
   v2.13.2 · Planes: arreglos de la auditoría del 18-nov-2026
   Todo lo encontrado se reprodujo antes de arreglarlo; z2132.js prueba cada punto.
   - "Cobrado" en una cuota tacha ESA cuota (el abono queda amarrado: ECA[].cuota) y lo que sobre pasa a las demás,
     lo más viejo primero. Antes tachaba la más vieja, la cuota marcada seguía con "Cobrado" y un segundo clic
     duplicaba el abono. El amarre sale solo del botón "Registrar cobro", no de Z27.pg (un formulario abierto ya no
     amarra los cobros que entran por el Excel).
   - Una cuota en pesos ya cobrada o pagada queda con la TRM del día del pago: lo cubierto se cuenta en pesos
     (abono en pesos: su TRM; abono en dólares: la TRM oficial de su fecha). Solo lo que falta se pasa a dólares con
     la TRM de hoy. Antes, si la TRM bajaba, una cuota cobrada volvía a salir con plata pendiente (y la Caja la
     contaba); si subía, lo de más tachaba la cuota siguiente sin que nadie hubiera pagado.
   - Correr o adelantar varios giros de China a la vez ya no los junta en uno (se mueven del último al primero).
     Las acciones de varias cuotas no tocan las ya pagadas ni cobradas, y "Marcar todas" solo marca las pendientes.
   - Una fecha escrita con el teclado se guarda al salir de la casilla o con Enter (una sola vez, un solo Deshacer).
     Elegida en el calendario, se guarda de una.
   - Las cuotas en pesos no se vuelven dólares: al subir el Excel de planes con la fecha cambiada, con "Acuerdo nuevo"
     conservando las que no vencen, ni en la fila de agregar (recuerda la moneda).
   - "Lo que te va a entrar" y "Plan en la Caja" (estado de cuenta) valen las cuotas en pesos como la Caja.
   - "Desmarcar" también sale cuando el abono se registró en el estado de cuenta: pregunta antes de quitarlo de allá.
   - "Registrar cobro" de una cuota en pesos abre en pesos, con lo que falta, y con la TRM oficial de la fecha.
   - La nota del abono ya no dice "Cobro del plan" (sale en el PDF y el Excel que ve el cliente).
   - El aviso de una actualización ya aplicada no trae "Cancelar".
   - Paso "cuotaCop" de la actualización preparada: no toca una cuota que cambió después del respaldo (paso.esperado).
   Estado: no agrega llaves; usa el campo "cuota" del abono (v2.13.1).
   =================================================================== */
var Z2132={cuota:null,enVer:0};
const _Z2132TOL=50;   /* pesos: por debajo de esto la cuota en pesos está completa (redondeo de centavos) */
/* TRM oficial de un día (la última conocida hasta ese día); hoy o sin fecha: la de la Caja */
function _z2132TrmDia(iso){ const hoy=_p14Iso(TODAY); if(!iso||iso>=hoy) return _z213Trm();
  let x=null; try{ x=_neTrmDe(iso); }catch(e){} return x&&+x.v>1000?+x.v:_z213Trm(); }
function _z2132Iso(f){ const d=_ecFecha(f); return d?_p14Iso(d):''; }
/* TRM con que entró un abono: la suya si fue en pesos; si fue en dólares, la oficial de su fecha */
function _z2132TrmAb(a){ const u=+a.usd||0, p=+a.cop||0; if(u>0.005&&p>0) return p/u; if(+a.trm>1000) return +a.trm; return _z2132TrmDia(_z2132Iso(a.fecha)); }
function _z2132EsCop(l){ return !!l&&l.mon==='COP'&&+l.cop>0; }

/* ---- cobros: qué abono cubre qué cuota (amarrados primero; lo demás, lo más viejo primero) ---- */
const _v3LinAntes2132=_v3Lin;
function _z2132Cobro(c){ const vacio={map:{},ab:0,desde:null,abonos:[],sobra:0,m:{},cov:{},de:{}};
  if(!c||c.dir!=='c'||!c.act||c.act==='base') return vacio;
  const L=_v3LinAntes2132(c,c.act).filter(l=>!l.cump&&!l.sint&&l.m>0.005&&l.f).sort(_v3PorF); if(!L.length) return vacio;
  const v=_z293Ver(c); let desde=_p14Lun(_p14D(L[0].f));
  const fa=v&&v.fecha?_p14D(v.fecha):null; if(fa&&fa<desde) desde=fa;
  const d2=v&&v.desde?_p14D(v.desde):null; if(d2&&d2>desde) desde=d2;
  const abonos=(ECA||[]).filter(a=>a.cliente===c.n&&!a.via).filter(a=>{ const d=_ecFecha(a.fecha); return d&&d>=desde; });
  const Q=abonos.map((a,i)=>({a,i,d:_ecFecha(a.fecha),r:_z213r2(+a.usd||0),trm:_z2132TrmAb(a)})).sort((x,y)=>(x.d-y.d)||(x.i-y.i));
  const t=_z213Trm(), cov={}, de={}, porId={};
  L.forEach(l=>{ cov[l.id]={usd:0,cop:0}; de[l.id]=[]; porId[l.id]=l; });
  const falta=l=>_z2132EsCop(l)?Math.max(0,l.cop-cov[l.id].cop):Math.max(0,l.m-cov[l.id].usd);
  const lleno=l=>_z2132EsCop(l)?falta(l)<_Z2132TOL:falta(l)<0.005;
  const tomar=(l,q)=>{ if(q.r<=0.005||lleno(l)) return; const k=cov[l.id]; let u;
    if(_z2132EsCop(l)){ const disp=q.r*q.trm, fp=falta(l), tc=Math.min(fp,disp); u=tc>=disp-0.5?q.r:tc/q.trm; k.cop=fp-tc<_Z2132TOL?+l.cop:k.cop+tc; }
    else u=Math.min(falta(l),q.r);
    u=_z213r2(u); if(u<=0) return; k.usd=_z213r2(k.usd+u); q.r=_z213r2(q.r-u); de[l.id].push({id:q.a.id,usd:u}); };
  Q.forEach(q=>{ const l=q.a.cuota&&porId[q.a.cuota]; if(l) tomar(l,q); });
  L.forEach(l=>{ for(const q of Q){ if(lleno(l)) break; tomar(l,q); } });
  const m={}, map={}; L.forEach(l=>{ const k=cov[l.id]; m[l.id]=_z2132EsCop(l)?_z213r2(k.usd+Math.max(0,l.cop-k.cop)/t):l.m; map[l.id]=k.usd; });
  return {map,ab:_z213r2(abonos.reduce((s,a)=>s+(+a.usd||0),0)),desde,abonos,sobra:_z213r2(Q.reduce((s,q)=>s+q.r,0)),m,cov,de}; }
/* una cuota en pesos vale: lo ya cubierto (a la TRM del día en que se cubrió) + lo que falta a la TRM de hoy */
_v3Lin=function(c,vid){ const L=_v3LinAntes2132.apply(this,arguments);
  if(!c||!L||!L.length||vid==='base'||vid!==c.act||!L.some(_z2132EsCop)) return L;
  try{
    if(c.dir==='c'){ const k=_z2132Cobro(c); L.forEach(l=>{ if(_z2132EsCop(l)&&k.m[l.id]!=null) l.m=k.m[l.id]; }); }
    else if(c.dir==='p'&&!_z213SoloUsd(c)){ const R=_v3Real(), G=_z27Reg(), t=_z213Trm();
      L.forEach(l=>{ if(!_z2132EsCop(l)) return; const pag=+R[l.id]||0; if(pag<=0.005) return;
        let usd=0, cp=0; (G[l.id]||[]).forEach(r=>{ const u=+r.m||0; usd+=u; cp+=u*(+r.trm>1000?+r.trm:_z2132TrmDia(r.f)); });
        if(pag>usd) cp+=(pag-usd)*t;
        const resto=Math.max(0,l.cop-cp); l.m=_z213r2(pag+(resto<_Z2132TOL?0:resto/t)); }); }
  }catch(e){ console.warn('v2.13.2 cuota en pesos',e); }
  return L; };
_z27Cob=function(c){ return _z2132Cobro(c); };
/* un pago registrado guarda la TRM de su día (sirve para las cuotas en pesos) */
const _z27PagarAntes2132=z27Pagar;
z27Pagar=function(cpId,id,o){ const r=_z27PagarAntes2132.apply(this,arguments);
  try{ if(r){ const L=_z27Reg()[id], x=L&&L[L.length-1]; if(x&&x.trm==null) x.trm=_z2132TrmDia(x.f); } }catch(e){} return r; };

/* ---- "Cobrado": el abono queda amarrado a la cuota del botón, y nada más ---- */
function _z2132Nota(s){ s=(''+(s||'')).replace(/^Cobro del plan( · )?/,''); return s?s.charAt(0).toUpperCase()+s.slice(1):''; }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-y="cbOk"]'); if(!t) return;
  const b=t.closest('.z-reg'); Z2132.cuota=(b&&b.dataset.id)||null; setTimeout(()=>{ Z2132.cuota=null; },0); },true);
const _z27CobrarAntes2132=z27Cobrar;
z27Cobrar=function(cpId,o){ const a=_z27CobrarAntes2132.apply(this,arguments);
  try{ if(a){ const id=Z2132.cuota, c=_v3Cp(cpId);
      if(id&&id!=='*'&&!/^b\|/.test(id)&&c&&c.act!=='base'&&_v3LinAntes2132(c,c.act).some(l=>l.id===id)) a.cuota=id; else delete a.cuota;
      if(typeof a.nota==='string'&&/^Cobro del plan/.test(a.nota)) a.nota=_z2132Nota(a.nota); } }catch(e){ console.warn('v2.13.2 cobro',e); }
  return a; };
/* lo que ve el cliente (PDF y Excel del estado de cuenta): sin "Cobro del plan" en las notas viejas */
function _z2132Limpio(fn){ return function(){ const s=ECA;
  ECA=(s||[]).map(a=>a&&typeof a.nota==='string'&&/^Cobro del plan/.test(a.nota)?Object.assign({},a,{nota:_z2132Nota(a.nota)}):a);
  try{ return fn.apply(this,arguments); } finally{ ECA=s; } }; }
const _ecPdfHTMLAntes2132=_ecPdfHTML; _ecPdfHTML=_z2132Limpio(_ecPdfHTMLAntes2132);
const _ecLibroAntes2132=_ecLibro; _ecLibro=_z2132Limpio(_ecLibroAntes2132);

/* ---- formulario de cobro de una cuota en pesos: en pesos, con lo que falta y la TRM oficial de la fecha ---- */
const _z27RegHTMLAntes2132=_z27RegHTML;
_z27RegHTML=function(c,l,e){ if(!(c&&c.dir==='c'&&_z2132EsCop(l))) return _z27RegHTMLAntes2132.apply(this,arguments);
  const k=_z27Cob(c), cv=(k.cov&&k.cov[l.id])||{cop:0}, pend=Math.max(0,Math.round(l.cop-cv.cop)), hoy=_p14Iso(TODAY);
  return '<div class="z-reg" data-cp="'+esc4(c.id)+'" data-id="'+esc4(l.id)+'">'
    +'<label>Fecha<input class="z-in" type="date" data-yr="f" value="'+hoy+'"></label>'
    +'<label>Monto<input class="z-in n" data-yr="m" value="'+_z213Cop(pend)+'" inputmode="decimal"></label>'
    +'<label>Moneda<select class="z-in" data-yr="mon"><option>USD</option><option selected>COP</option></select></label>'
    +'<label>TRM<input class="z-in n" style="width:80px" data-yr="trm" value="'+_z2132TrmDia(hoy)+'" inputmode="decimal"></label>'
    +'<div class="z-reg-b"><button type="button" class="z-btn sm pri" data-y="cbOk" data-cp="'+esc4(c.id)+'">Registrar cobro</button>'
    +'<button type="button" class="z-btn sm q" data-y="pgX">Cancelar</button></div></div>'; };
/* al cambiar la fecha de un cobro en pesos, la TRM pasa a la oficial de ese día */
document.addEventListener('change',e=>{ const t=e.target; if(!t||!t.dataset||(t.dataset.yr!=='f'&&t.dataset.yr!=='mon')) return;
  const b=t.closest&&t.closest('.z-reg'); if(!b) return; const tr=b.querySelector('[data-yr="trm"]'), mo=b.querySelector('[data-yr="mon"]'), f=b.querySelector('[data-yr="f"]');
  if(tr&&mo&&mo.value==='COP') tr.value=''+_z2132TrmDia(f&&f.value); });

/* ---- botones de cada cuota: "Desmarcar" también cuando el abono se registró en el estado de cuenta ---- */
function _z2132Cubre(c,id){ const k=_z27Cob(c), de=(k.de&&k.de[id])||[], ids=de.map(x=>x.id).filter(Boolean); return (ECA||[]).filter(a=>ids.indexOf(a.id)>=0); }
_z213Acc=function(c,l,e,done,edit){ const id=esc4(l.id), cobro=c.dir==='c';
  if(!edit) return cobro&&c.tipo==='Contrato'&&l.m>0.5?'<button type="button" class="z-btn sm" data-h="cob" data-id="'+id+'">Cobrado</button>':'';
  const des=cobro?(_z2131Abonos(c,l.id).length>0||_z2132Cubre(c,l.id).length>0):_z2131Regs(l.id);
  return (!done?'<button type="button" class="z-btn sm" data-h="'+(cobro?'cob':'pag')+'" data-id="'+id+'">'+(cobro?'Cobrado':'Pagado')+'</button>':'')
    +(des?'<button type="button" class="z-btn sm q" data-h="desm" data-id="'+id+'">Desmarcar</button>':'')
    +(!done?'<button type="button" class="z-btn sm q" data-h="correr" data-id="'+id+'" title="Una semana más tarde">Correr</button>':'')
    +'<button type="button" class="z-btn sm q z13-x" data-h="del" data-id="'+id+'" aria-label="Quitar la cuota del '+esc4(_z213Fd(l.f))+'">✕</button>'; };
const _z2131DesmAntes2132=_z2131Desm;
_z2131Desm=function(c,id){ if(!c||c.dir!=='c'||_z2131Abonos(c,id).length) return _z2131DesmAntes2132.apply(this,arguments);
  const L=_z2132Cubre(c,id); if(!L.length) return; const t=L.reduce((s,a)=>s+(+a.usd||0),0), uno=L.length===1;
  const k=_z27Cob(c), otras=Object.keys(k.de||{}).filter(x=>x!==id&&(k.de[x]||[]).some(y=>L.some(a=>a.id===y.id))).length;
  const txt=L.map(a=>'US$ '+_ec2(+a.usd)+' del '+_p14F(_ecFecha(a.fecha))).join(', ');
  return z26Dialogo({t:uno?'¿Quitar el abono del estado de cuenta?':'¿Quitar los abonos del estado de cuenta?',
      x:'Esta cuota la '+(uno?'tacha el abono':'tachan los abonos')+' de '+txt+', registrado'+(uno?'':'s')+' en el estado de cuenta de '+c.n+'. '
        +(uno?'Si lo quitas, sale':'Si los quitas, salen')+' de allá también'+(otras?' y '+(otras===1?'otra cuota vuelve':otras+' cuotas más vuelven')+' a quedar pendiente'+(otras===1?'':'s'):'')+'.',
      ok:'Quitar',peligro:true})
    .then(ok=>{ if(!ok) return; L.forEach(a=>_z27DesCobrar(a));
      _z27HechoFn('Cobro desmarcado: '+_z26m(t)+' sale también del estado de cuenta de '+c.n,()=>{ L.forEach(a=>{ (a.aplicado||[]).forEach(p=>_ecSumar(p.k,p.i,+p.monto)); ECA.push(a); }); }); }); };

/* ---- varias cuotas: sin juntar giros, sin tocar las pagadas ---- */
_z213Bulk=function(c,que,f){ const V=_z27Vista(c), E={}; V.L.forEach(x=>{ E[x.l.id]=x; });
  let ids=Object.keys(Z213.marc).filter(id=>E[id]); if(!ids.length) return;
  const pag=ids.filter(id=>V.edit&&E[id].e.pend<=0.5); ids=ids.filter(id=>!(V.edit&&E[id].e.pend<=0.5));
  if(!ids.length){ Z213.marc={}; z26Aviso(pag.length===1?'Esa cuota ya está pagada: no la toco':'Esas cuotas ya están pagadas: no las toco'); renderPlanes(); return; }
  /* en el plan de giros a China la cuota es la semana: se mueven del último al primero (o al revés) para no juntarlos */
  if(que==='c7'||que==='c-7') ids.sort((a,b)=>{ const fa=E[a].l.f||'', fb=E[b].l.f||'', r=fa<fb?-1:(fa>fb?1:0); return que==='c7'?-r:r; });
  const s=_z26Snap(); let n=0;
  ids.forEach(id=>{ const l=_v3Lin(c,c.act).find(x=>x.id===id); if(!l) return;
    if(que==='del'){ _v3LinDel(c,c.act,id); n++; return; }
    let iso=f;
    if(que==='c7'||que==='c-7'){ const d0=_p14D(l.f)||TODAY; let d=addD(que==='c7'&&d0<TODAY?TODAY:d0,que==='c7'?7:-7); if(d<TODAY) d=TODAY; iso=_p14Iso(d); }
    if(iso&&iso!==l.f){ _v3LinSet(c,c.act,id,'f',iso); n++; } });
  Z213.marc={};
  const np=pag.length?' · '+pag.length+' ya pagada'+(pag.length===1?'':'s')+' no se tocó'+(pag.length===1?'':'aron'):'';
  if(!n){ z26Aviso('No cambió nada'+np); renderPlanes(); return; }
  const t=que==='del'?n+' cuota'+(n===1?'':'s')+' quitada'+(n===1?'':'s'):(que==='c7'?n+' corrida'+(n===1?'':'s')+' una semana':(que==='c-7'?n+' adelantada'+(n===1?'':'s')+' una semana':n+' al '+_z213Fd(f)));
  _z26Hecho(t+np,s); };
const _z213ChangeAntes2132=_z213Change;
_z213Change=function(e,v){ const t=e.target; if(!t||!t.dataset||!v.contains(t)) return;
  if(t.dataset.a==='mon'){ const c=_z213C(); if(c) (Z213.monAdd=Z213.monAdd||{})[c.id]=t.value; return; }
  if(t.dataset.h==='all'){ const c=_z213C(); if(!c) return; Z213.marc={};
    if(t.checked){ const V=_z27Vista(c); V.L.forEach(x=>{ if(!(V.edit&&x.e.pend<=0.5)) Z213.marc[x.l.id]=1; }); }
    renderPlanes(); return; }
  return _z213ChangeAntes2132.apply(this,arguments); };
const _z213DetHTMLAntes2132=_z213DetHTML;
_z213DetHTML=function(c,r){ let h=_z213DetHTMLAntes2132.apply(this,arguments);
  try{ if(Z213.monAdd&&Z213.monAdd[c.id]==='COP') h=h.replace('<select class="z-in" data-a="mon" aria-label="Moneda de la cuota nueva"><option>USD</option><option>COP</option></select>',
      '<select class="z-in" data-a="mon" aria-label="Moneda de la cuota nueva"><option>USD</option><option selected>COP</option></select>');
    const P=r&&r.V&&r.V.edit?r.V.L.filter(x=>x.e.pend>0.5):[];
    if(P.length&&P.every(x=>Z213.marc[x.l.id])&&h.indexOf('data-h="all" checked')<0) h=h.replace('data-h="all" aria-label','data-h="all" checked aria-label'); }catch(e){ console.warn('v2.13.2',e); }
  return h; };

/* ---- fechas escritas con el teclado: se guardan al salir de la casilla o con Enter ---- */
const _z213EventosAntes2132=_z213Eventos;
_z213Eventos=function(v){
  if(v&&!v.dataset.z132){ v.dataset.z132='1';
    const esF=t=>!!t&&t.tagName==='INPUT'&&t.type==='date'&&!!t.dataset&&/^(f|bF|fxf)$/.test(t.dataset.h||'')&&!t.closest('form');
    v.addEventListener('keydown',e=>{ const t=e.target; if(!esF(t)) return;
      if(e.key==='Enter'){ e.preventDefault(); if(t._z2132p) t.blur(); return; }
      if(e.key!=='Tab'&&e.key!=='Shift'&&e.key!=='Escape') t._z2132k=1; },true);
    v.addEventListener('change',e=>{ const t=e.target; if(!esF(t)||!t._z2132k) return; e.stopImmediatePropagation(); t._z2132p=1; },true);
    v.addEventListener('focusout',e=>{ const t=e.target; if(!esF(t)) return; const p=t._z2132p; t._z2132k=0; t._z2132p=0; if(!p||!v.contains(t)) return;
      Z213.enCambio=1; try{ _z213Change({target:t},v); }catch(err){ console.warn('v2.13.2 fecha',err); } finally{ Z213.enCambio=0; } },true); }
  return _z213EventosAntes2132.apply(this,arguments); };

/* ---- la fila de agregar recuerda la moneda ---- */
const _z213AddAntes2132=_z213Add;
_z213Add=function(e,v){ try{ const fm=e.target&&e.target.closest&&e.target.closest('form[data-h="add"]'), s=fm&&fm.querySelector('[data-a="mon"]'), c=_z213C();
    if(s&&c) (Z213.monAdd=Z213.monAdd||{})[c.id]=s.value; }catch(err){}
  return _z213AddAntes2132.apply(this,arguments); };

/* ---- Excel de planes: una cuota en pesos que solo cambió de fecha sigue en pesos ---- */
_zpxCrear=function(c,P){ const viejo={}; try{ _v3Lin(c,c.act).forEach(l=>{ viejo[l.id]=l; }); }catch(e){}
  const v=_zpxCrearAntes213.apply(this,arguments);
  try{ (v&&v.lineas||[]).forEach(nl=>{ const x=P.filas.find(y=>y.nid===nl.id), o=x&&x.lid?viejo[x.lid]:null; if(!o) return;
    if(o.c&&!/^(china|magnum|nac)$/.test(o.c)) nl.dest=o.c;
    if(_z2132EsCop(o)&&Math.abs((+x.m||0)-o.m)<=Math.max(1,o.m*0.03)){ nl.mon='COP'; nl.cop=Math.round(+o.cop); nl.monto=_z213r2(o.m); } }); }catch(e){ console.warn('v2.13.2 excel',e); }
  return v; };

/* ---- "Acuerdo nuevo" que conserva las cuotas que no vencen: las de pesos siguen en pesos (con lo que falta) ---- */
const _z27GenAbrirAntes2132=_z27GenAbrir;
_z27GenAbrir=function(c,tipo){ const r=_z27GenAbrirAntes2132.apply(this,arguments);
  try{ const g=Z27.gen; if(g&&g.cp===c.id&&Array.isArray(g.fut)&&g.fut.length){ const V=_z27Vista(c), k=c.dir==='c'?_z27Cob(c):null;
      const F=V.edit?V.L.filter(x=>!x.e.past&&x.e.pend>0.5):[];
      if(F.length===g.fut.length) F.forEach((x,i)=>{ const l=x.l; if(!_z2132EsCop(l)) return; let cp=+l.cop;
        if(k&&k.cov&&k.cov[l.id]) cp-=k.cov[l.id].cop; else if(c.dir==='p'){ const pag=+_v3Real()[l.id]||0; cp-=pag*_z213Trm(); }
        cp=Math.round(cp); if(cp>=_Z2132TOL) Object.assign(g.fut[i],{mon:'COP',cop:cp}); }); } }catch(e){ console.warn('v2.13.2 acuerdo',e); }
  return r; };
const _z27CrearAntes2132=_z27Crear;
_z27Crear=function(c,L,nombre,activar){ const v=_z27CrearAntes2132.apply(this,arguments);
  try{ const S=(L||[]).filter(l=>+l.m>0.005&&l.f).sort(_v3PorF);
    if(v&&v.lineas&&S.length===v.lineas.length) v.lineas.forEach((nl,i)=>{ const s=S[i]; if(s&&s.mon==='COP'&&+s.cop>0){ nl.mon='COP'; nl.cop=Math.round(+s.cop); } }); }catch(e){ console.warn('v2.13.2 acuerdo',e); }
  return v; };

/* ---- estado de cuenta: las cuotas en pesos valen como en la Caja ---- */
const _v2VerAntes2132=_v2Ver;
_v2Ver=function(p,id){ const v=_v2VerAntes2132.apply(this,arguments);
  if(Z2132.enVer||!v||!Array.isArray(v.lineas)||!v.lineas.length||!p||!p.id) return v;
  const hay=v.lineas.some(_z2132EsCop)||(v.id==='a'&&(PROM||[]).some(x=>_z2132EsCop(x)&&v.lineas.some(l=>l.id===x.id))); if(!hay) return v;
  Z2132.enVer++;
  try{ const c=_v3Cp(p.id); if(!c) return v; const M={}; _v3Lin(c,v.id).forEach(l=>{ if(l.mon==='COP') M[l.id]=l.m; });
    if(!Object.keys(M).length) return v;
    return Object.assign({},v,{lineas:v.lineas.map(l=>M[l.id]!=null?Object.assign({},l,{monto:M[l.id]}):l)}); }
  catch(e){ console.warn('v2.13.2 plan en la Caja',e); return v; }
  finally{ Z2132.enVer--; } };
function _z2132PromM(x){ return _z2132EsCop({mon:x.mon,cop:x.cop})?_z213r2(+x.cop/_z213Trm()):+x.monto; }
ecEntra=function(c){
  const g={}; let venc=0;
  if(esInterno(c)) (PROM||[]).filter(p=>p.cliente===c&&!p.cumplida&&+p.monto>0).forEach(p=>{ const d=_p14D(p.fecha); if(!d) return; const m=_z2132PromM(p); if(d<TODAY){ venc+=m; return; } const k=_p14Iso(d); (g[k]=g[k]||{d,v:0,n:[]}).v+=m; g[k].n.push(p.nota||'promesa'); });
  else { const fs=ecFilas(c).filas; _ecUnidades(c).forEach(u=>{ const d=u.vence?_p14D(u.vence):null; if(!d) return; if(d<TODAY){ venc+=u.saldo; return; }
      const k=_p14Iso(d), f=fs.find(x=>x.k===u.k); (g[k]=g[k]||{d,v:0,n:[]}).v+=u.saldo; const nm=f?(f.pedido||f.equipo||''):''; if(nm&&g[k].n.indexOf(nm)<0) g[k].n.push(nm); }); }
  return {venc,fechas:Object.keys(g).sort().map(k=>g[k])};
};

/* ---- un aviso de algo ya hecho no trae "Cancelar" ---- */
const _z26DialogoAntes2132=z26Dialogo;
z26Dialogo=function(o){ const r=_z26DialogoAntes2132.apply(this,arguments);
  try{ if(o&&(o.ok==='Listo'||o.ok==='Entendido')&&!o.cancelar){ const b=document.querySelector('#z26Dlg [data-r="0"]'); if(b) b.remove(); } }catch(e){}
  return r; };

/* ---- actualización preparada: no pisar una cuota que cambió después del respaldo ---- */
const _ztpCuotaCopAntes2132=_ztpCuotaCop;
_ztpCuotaCop=function(paso){ const E=paso&&paso.esperado;
  if(E){ const c=_v3Cp(paso.cp), x=c?_z213Raw(c,paso.v,paso.id):null;
    if(x&&!_z213EsCop(x)){ const f=x.fecha||x.sem||'', mo=+x.monto||0;
      if((E.f&&f!==E.f)||(E.m&&Math.abs(mo-E.m)>Math.max(1,E.m*0.01))){
        if(!/no se cambió/.test(paso.nombre||'')) paso.nombre=(paso.nombre||'Cuota en pesos')+' (no se cambió: ya la habías modificado)'; return false; }
      if(E.dest!=null&&(x.dest||'')!==E.dest){ const p=Object.assign({},paso); delete p.con; return _ztpCuotaCopAntes2132.call(this,p); } } }
  return _ztpCuotaCopAntes2132.apply(this,arguments); };
