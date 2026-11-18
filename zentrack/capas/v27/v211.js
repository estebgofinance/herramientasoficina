/* ===================================================================
   v2.11 · Caja viva: corre sola con la fecha, los estados de cuenta y los planes
   Esteban (17-nov-2026): "la herramienta no tiene una fecha embebida, las semanas no van corriendo";
   "no quiero registrar giros manuales de nada: cargo los estados de cuenta de vez en vez y, con los planes
   que ya tengo definidos, me sacan la caja que se actualiza cada día".
   1. Fecha viva. TODAY se fijaba al abrir la página: con la pestaña abierta desde el viernes, el lunes la Caja
      seguía en la semana anterior. Ahora, cada minuto y al volver a la pestaña, si cambió el día TODAY se
      mueve (el mismo objeto, así todo lo que lo lee ve la fecha nueva), se repinta y se trae la TRM del día.
      Arriba, junto a la versión, queda la fecha con la que calcula.
   2. Sin registrar giros:
      - Plan a China: lo que el detailed de Andrés muestra pagado a cada proveedor en las cargas con corte posterior
        a la primera cuota del plan se descuenta solo, a la cuota más vieja primero (menos lo que ya esté registrado, para
        no contarlo dos veces). Solo se cancelan cuotas con fecha ya pasada; las que vienen quedan como estaban. Cuenta
        la fecha de corte del detailed (la del nombre del archivo). Lo atrasado que el detailed no muestra pagado sigue
        saliendo en la semana actual.
      - Fijos, impuestos y cuotas de contrato (Finkargo y otros cargos) se dan por pagados en su fecha: lo de
        semanas pasadas ya no se arrastra a la semana actual. Lo de esta semana (lunes a hoy) sí cuenta.
      - Magnum y TIBA ya salían de su estado de cuenta (la factura que no viene, no sale).
   3. Gráfica de control en la Caja, debajo de la tabla: entra arriba, sale abajo por rubro, y el acumulado.
   Sin llaves nuevas: lo automático se calcula al vuelo y no se guarda.
   =================================================================== */
var ZD={pend:false,ultimo:null}, ZA={raw:0,cache:null,info:{}};
const _ZD_DIA=['dom','lun','mar','mié','jue','vie','sáb'], _ZD_DIAL=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
function _zdHoyReal(){ const n=new Date(); return new Date(n.getFullYear(),n.getMonth(),n.getDate()); }
function _zdLargo(d){ return _ZD_DIAL[d.getDay()]+' '+d.getDate()+'-'+_p14Mes[d.getMonth()]+'-'+d.getFullYear(); }
function _zdCorto(d){ return _ZD_DIA[d.getDay()]+' '+d.getDate()+'-'+_p14Mes[d.getMonth()]; }

/* ---- 1. fecha viva ---- */
function _zdChip(){ const v=document.getElementById('verTag'); if(!v||!v.parentNode) return;
  let c=document.getElementById('zdFecha'); if(!c){ c=document.createElement('span'); c.id='zdFecha'; c.className='zd-chip'; v.parentNode.insertBefore(c,v); }
  c.textContent='Hoy · '+_zdCorto(TODAY)+'-'+TODAY.getFullYear(); c.title='Fecha con la que calcula la herramienta. Cambia sola cuando cambia el día.'; }
function _zdOcupado(){ if(document.querySelector('.z-scrim')) return true; const a=document.activeElement;
  return !!(a&&a!==document.body&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
function _zdRepintar(){ ZD.pend=false;
  try{ refreshAll(); }catch(e){ console.warn('v2.11 refresh',e); }
  try{ const b=document.querySelector('nav.tabs button.on'); if(b&&b.dataset.v) navTo(b.dataset.v); }catch(e){ console.warn('v2.11 pestaña',e); }
  _zdChip(); }
function zdRevisarDia(){ const h=_zdHoyReal();
  if(h.getTime()===TODAY.getTime()){ if(ZD.pend&&!_zdOcupado()) _zdRepintar(); return false; }
  const antes=_p14Iso(TODAY); TODAY.setTime(h.getTime()); ZD.ultimo={antes,ahora:_p14Iso(h)}; ZA.cache=null;
  _zdChip();
  if(_zdOcupado()) ZD.pend=true; else _zdRepintar();
  try{ if(typeof _neTrmTraer==='function'&&typeof google!=='undefined'&&google.script) _neTrmTraer().then(o=>{ if(o&&o._nueva&&!_zdOcupado()) _zdRepintar(); }).catch(()=>{}); }catch(e){}
  try{ z26Aviso('Nuevo día: '+_zdLargo(h)+'. La Caja se recalculó.'); }catch(e){}
  return true; }
setInterval(zdRevisarDia,60000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) zdRevisarDia(); });
window.addEventListener('focus',()=>zdRevisarDia());
window.addEventListener('pageshow',()=>zdRevisarDia());
try{ _zdChip(); }catch(e){}

/* ---- 2a. fijos, impuestos y cuotas de contrato: lo de semanas pasadas se da por pagado ---- */
const _zdL0=()=>_p14Lun(TODAY);
const _gastoFechasAntes211=gastoFechas;
gastoFechas=function(){ const L0=_zdL0(); return _gastoFechasAntes211.apply(this,arguments).filter(d=>!(d<L0)); };
const _cjTercerosAntes211=cjPagosTerceros;
cjPagosTerceros=function(){ const L0=_zdL0(); return _cjTercerosAntes211.apply(this,arguments).filter(p=>!(p&&p.fecha instanceof Date&&p.fecha<L0)); };

/* ---- 2b. plan a China: lo que el detailed muestra pagado se descuenta solo ---- */
function _zaPagado(ord){ const o={eagle:0,nexus:0,comp:0};
  (ord||[]).forEach(r=>(r&&r.equipos||[]).forEach(e=>{ const m=(e&&e.mfg)||r.mfg||'', k=/Eagle/i.test(m)?'eagle':(/Singsun|Nexus/i.test(m)?'nexus':null);
    if(k) o[k]+=+e.cupoPagado||0; o.comp+=+e.otrosPagado||0; })); return o; }
/* fecha de corte de una carga: la del nombre del detailed de Andrés ("…report NOV172026.xlsx"); una carga sin fecha en el nombre no se usa */
const _ZA_MES={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11,ENE:0,ABR:3,AGO:7,DIC:11};
function _zaCorte(h){ const m=/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|ENE|ABR|AGO|DIC)[ _-]?(\d{1,2})[ _-]?(\d{4})/i.exec((h&&h.fuente)||'');
  if(m){ const d=new Date(+m[3],_ZA_MES[m[1].toUpperCase()],+m[2]); if(!isNaN(d)&&d.getDate()===+m[2]) return _p14Iso(d); }
  return null; }
function _zaAuto(){ if(ZA.cache) return ZA.cache; const out={}; ZA.cache=out; ZA.info={}; ZA.lin=[];
  Promise.resolve().then(()=>{ ZA.cache=null; });
  ZA.raw++;
  try{
    const H=(Array.isArray(HIST)?HIST:[]).filter(h=>h&&h.ts&&h.tipo!=='facturas'&&h.snapPrev&&Array.isArray(h.snapPrev.ORD)).map(h=>({iso:_zaCorte(h),t:+new Date(h.ts),h})).filter(x=>x.iso).sort((a,b)=>a.t-b.t);
    if(!H.length) return out;
    const ahora=_zaPagado(ORD), R=PLANES.real||{}, ult=H[H.length-1].iso, hoy=_p14Iso(TODAY);
    _v3Cps().filter(c=>c.dir==='p'&&_V3PROV[c.prov]&&c.act&&c.act!=='base').forEach(c=>{
      const L=_v3Lin(c,c.act).filter(l=>l.f&&+l.m>0.005).sort(_v3PorF); if(!L.length) return;
      const D=L[0].f, h0=H.find(x=>x.iso>D);   /* desde la primera cuota del plan, aunque el acuerdo cambie de versión */
      const info={desde:D,carga:h0?ult:null,pagado:0,registrado:0,auto:0}; ZA.info[c.prov]=info; if(!h0) return;
      const antes=_zaPagado(h0.h.snapPrev.ORD), pag=Math.max(0,(ahora[c.prov]||0)-(antes[c.prov]||0));
      const reg=L.reduce((a,l)=>a+(+R[l.id]||0),0); let pool=Math.max(0,pag-reg);
      info.pagado=_z27r2(pag); info.registrado=_z27r2(reg);
      L.forEach(l=>{ if(pool<0.005||!(l.f<hoy)) return;   /* solo cuotas con fecha ya pasada: las que vienen siguen como estaban */ const falta=Math.max(0,l.m-(+R[l.id]||0)), a=Math.min(falta,pool); if(a>0.005){ out[l.id]=_z27r2(a); pool-=a; info.auto+=a; ZA.lin.push({prov:c.prov,n:c.n,id:l.id,f:l.f,a:_z27r2(a),carga:ult}); } });
      info.auto=_z27r2(info.auto); });
  }catch(e){ console.warn('v2.11 plan automático',e); }
  finally{ ZA.raw--; }
  return out; }
const _v3RealAntes211=_v3Real;
_v3Real=function(){ const t=_v3RealAntes211.apply(this,arguments); if(ZA.raw) return t;
  const A=_zaAuto(); if(!Object.keys(A).length) return t;
  return new Proxy(t,{get(o,k){ const v=o[k]; return (typeof k==='string'&&A[k])?_z27r2((+v||0)+A[k]):v; }}); };
/* registrar o quitar un pago a mano trabaja sobre lo registrado, sin lo automático */
['z27Pagar','z27Quitar'].forEach(n=>{ const f=window[n]; if(typeof f!=='function') return;
  window[n]=function(){ ZA.raw++; try{ return f.apply(this,arguments); } finally{ ZA.raw--; ZA.cache=null; } }; });
try{ z27Pagar=window.z27Pagar; z27Quitar=window.z27Quitar; }catch(e){}

/* lo que el detailed muestra pagado de un giro con fecha de esta semana sigue en esta semana, como "ya salió"
   (igual que si se hubiera registrado); lo de semanas pasadas ya no sale */
const _p14CalcAntes211=p14Calc;
p14Calc=function(){ const X=_p14CalcAntes211.apply(this,arguments);
  try{ if(X&&X.R&&X.W&&X.modo==='pago'){ _zaAuto(); const L0=X.W[0], fin=addD(L0,6), N=X.W.length; let hay=false;
      (ZA.lin||[]).forEach(o=>{ const d=_p14D(o.f); if(!d||d<L0||d>fin) return;
        X.R.china.v[0]+=o.a; X.R.china.it[0].push({txt:'Ya salió · '+o.n+' · giro del '+_p14F(d)+' · según el detailed del '+_p14F(_p14D(o.carga)),usd:o.a});
        X.chPlan=X.chPlan||{}; (X.chPlan[o.prov]=X.chPlan[o.prov]||new Array(N).fill(0))[0]+=o.a; if(X.ya){ X.ya.sale+=o.a; (X.ya.itS=X.ya.itS||[]).push({n:o.n,usd:o.a,d}); } hay=true; });
      if(hay){ const R=X.R; let s=0; X.ini=[]; X.neto=[]; X.cierre=[];
        for(let i=0;i<N;i++){ X.ini.push(s); const n=R.ext.v[i]+R.sole.v[i]-R.china.v[i]-R.mag.v[i]-R.tiba.v[i]-R.otros.v[i]-R.fij.v[i]-R.imp.v[i]; X.neto.push(n); s+=n; X.cierre.push(s); } } } }
  catch(e){ console.warn('v2.11 ya salió',e); }
  return X; };

/* ---- 3. gráfica de control: entra y sale semana a semana, y el acumulado ---- */
const _ZG_S=[{k:'entra',t:'Entra',c:'#2a78d6'},{k:'china',t:'China',c:'#eb6834'},{k:'log',t:'Magnum y TIBA',c:'#1baf7a'},{k:'fij',t:'Nómina, fijos e impuestos',c:'#eda100'},{k:'otros',t:'Finkargo y otros cargos',c:'#e87ba4'}];
function _zgDatos(X){ const R=X.R; return X.W.map((w,i)=>{ const x=v=>_p14X(v);
  return {w,entra:x(R.ext.v[i]+R.sole.v[i]),china:x(R.china.v[i]),log:x(R.mag.v[i]+R.tiba.v[i]),fij:x(R.fij.v[i]+R.imp.v[i]),otros:x(R.otros.v[i]),acu:x(X.cierre[i]),neto:x(X.neto[i])}; }); }
function _zgK(v){ const cop=P14.mon==='cop', a=Math.abs(v); if(a<0.5) return '0';
  if(cop) return (v<0?'−':'')+(a/1e6>=100?Math.round(a/1e6).toLocaleString('en-US'):(Math.round(a/1e5)/10))+' M';
  return (v<0?'−':'')+(a>=1e5?Math.round(a/1000).toLocaleString('en-US'):(Math.round(a/100)/10))+'k'; }
function _zgN(v){ return (v<-0.5?'−':'')+(P14.mon==='cop'?'COP ':'US$ ')+fmtUSDs(Math.abs(v)); }
function _zgHTML(X){
  const G=_zgDatos(X), N=G.length; if(!N) return '';
  const W=1180, H=330, Lm=64, Rm=16, T=18, B=40, pw=W-Lm-Rm, ph=H-T-B, sal=g=>g.china+g.log+g.fij+g.otros;
  const mx=Math.max(1,...G.map(g=>g.entra),...G.map(g=>g.acu)), mn=Math.min(-1,...G.map(g=>-sal(g)),...G.map(g=>g.acu));
  const st=(()=>{ const r=(mx-mn)/5, p=Math.pow(10,Math.floor(Math.log10(r))), m=r/p; return (m<=1?1:(m<=2?2:(m<=5?5:10)))*p; })();
  const top=Math.ceil(mx/st)*st, bot=Math.floor(mn/st)*st, y=v=>T+(top-v)/(top-bot)*ph, y0=y(0);
  const slot=pw/N, bw=Math.min(24,slot*.42), cx=i=>Lm+slot*i+slot/2;
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Entra y sale por semana, por rubro, y el acumulado">';
  for(let t=bot;t<=top+0.5;t+=st){ const yy=y(t).toFixed(1); s+='<line x1="'+Lm+'" x2="'+(W-Rm)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+(Math.abs(t)<0.5?'#A2A7AD':'#E4E6E9')+'" stroke-width="1"/><text x="'+(Lm-8)+'" y="'+(+yy+4)+'" text-anchor="end" font-size="13" fill="#6A6E73">'+_zgK(t)+'</text>'; }
  /* barra con la punta redondeada (4px) lejos de la base */
  const barra=(x,ya,yb,col,arriba)=>{ const h=Math.abs(yb-ya); if(h<0.5) return ''; const r=Math.min(4,h,bw/2), x1=x-bw/2, x2=x+bw/2;
    if(arriba){ const yt=Math.min(ya,yb), yB=Math.max(ya,yb); return '<path d="M'+x1+' '+yB+'V'+(yt+r)+'Q'+x1+' '+yt+' '+(x1+r)+' '+yt+'H'+(x2-r)+'Q'+x2+' '+yt+' '+x2+' '+(yt+r)+'V'+yB+'Z" fill="'+col+'"/>'; }
    const yt=Math.min(ya,yb), yB=Math.max(ya,yb); return '<path d="M'+x1+' '+yt+'V'+(yB-r)+'Q'+x1+' '+yB+' '+(x1+r)+' '+yB+'H'+(x2-r)+'Q'+x2+' '+yB+' '+x2+' '+(yB-r)+'V'+yt+'Z" fill="'+col+'"/>'; };
  const recta=(x,ya,yb,col)=>{ const h=Math.abs(yb-ya); if(h<0.5) return ''; return '<rect x="'+(x-bw/2).toFixed(1)+'" y="'+Math.min(ya,yb).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" fill="'+col+'"/>'; };
  G.forEach((g,i)=>{ const x=cx(i); s+='<g class="zg-c">';
    if(g.entra>0.5) s+=barra(x,y0-1,y(g.entra),_ZG_S[0].c,true);
    let acc=0; const segs=_ZG_S.slice(1).map(o=>({o,v:Math.max(0,g[o.k])})).filter(q=>q.v>0.5);
    segs.forEach((q,j)=>{ const ya=y(-acc)+(j===0?1:2), yb=y(-(acc+q.v)); acc+=q.v; if(yb-ya<0.5) return; s+=j===segs.length-1?barra(x,ya,yb,q.o.c,false):recta(x,ya,yb,q.o.c); });
    s+='</g>'; });
  /* acumulado: línea de 2px y marcas de 8px */
  const pts=G.map((g,i)=>cx(i).toFixed(1)+','+y(g.acu).toFixed(1));
  s+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="#17181A" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  let mi=0; G.forEach((g,i)=>{ if(g.acu<G[mi].acu) mi=i; });
  G.forEach((g,i)=>{ s+='<circle cx="'+cx(i).toFixed(1)+'" cy="'+y(g.acu).toFixed(1)+'" r="4" fill="#17181A" stroke="#FFFFFF" stroke-width="2"/>'; });
  const lab=(i,t)=>{ const yy=y(G[i].acu), der=i<N-1, x=der?cx(i)+bw/2+6:cx(i)+4, ty=der?yy+4:(yy-12>T+10?yy-12:yy+22);
    return '<text x="'+x.toFixed(1)+'" y="'+ty.toFixed(1)+'" text-anchor="'+(der?'start':'end')+'" font-size="13" font-weight="600" fill="#17181A" paint-order="stroke" stroke="#FFFFFF" stroke-width="3">'+t+'</text>'; };
  s+=lab(mi,_zgK(G[mi].acu)); if(N-1!==mi) s+=lab(N-1,_zgK(G[N-1].acu));
  /* eje x y zonas de hover (más grandes que la barra) */
  G.forEach((g,i)=>{ s+='<text x="'+cx(i).toFixed(1)+'" y="'+(H-14)+'" text-anchor="middle" font-size="13" font-weight="'+(i===0?700:400)+'" fill="'+(i===0?'#7A4A00':'#6A6E73')+'">'+_p14F(g.w)+'</text>'
    +'<rect class="zg-hit" data-i="'+i+'" x="'+(Lm+slot*i).toFixed(1)+'" y="'+T+'" width="'+slot.toFixed(1)+'" height="'+ph+'" fill="transparent" tabindex="0" aria-label="Semana del '+_p14F(g.w)+': entra '+_zgN(g.entra)+', sale '+_zgN(sal(g))+', acumulado '+_zgN(g.acu)+'"/>'; });
  s+='</svg>';
  const ley='<div class="zg-ley" aria-hidden="true">'+_ZG_S.map(o=>'<span><i style="background:'+o.c+'"></i>'+esc4(o.t)+'</span>').join('')+'<span><i class="ln"></i>Acumulado</span></div>';
  let mxS=0; G.forEach((g,i)=>{ if(sal(g)>sal(G[mxS])) mxS=i; });
  const gS=G[mxS], pr=_ZG_S.slice(1).map(o=>({o,v:gS[o.k]})).sort((a,b)=>b.v-a.v)[0], neg=G.filter(g=>g.neto<-0.5).length;
  const pie='Semana con más salida: <b>'+_p14F(gS.w)+'</b> · sale '+_zgN(sal(gS))+(pr&&sal(gS)>0.5?' ('+esc4(pr.o.t)+' '+Math.round(pr.v/sal(gS)*100)+' %)':'')
    +' · acumulado más bajo: <b style="color:'+(G[mi].acu<-0.5?'var(--z-crit)':'var(--ink)')+'">'+_zgN(G[mi].acu)+'</b> el '+_p14F(G[mi].w)+' · '+neg+' de '+N+' semanas sale más de lo que entra';
  ZG.G=G;
  return '<section class="z-box zg" id="zgGraf"><div class="z-bh"><h3>Entra y sale · '+N+' semanas</h3><span class="z-def">'+(P14.mon==='cop'?'COP':'US$')+' · barras: entra arriba, sale abajo por rubro · línea: acumulado (entra − sale desde esta semana) · clic en una semana la marca en la tabla</span></div>'
    +ley+'<div class="zg-cv">'+s+'<div class="zg-tt" id="zgTT" role="tooltip" hidden></div></div><div class="z-bf">'+pie+'</div></section>'; }
var ZG={G:null};
function _zgTT(i,ev){ const t=document.getElementById('zgTT'), g=ZG.G&&ZG.G[i]; if(!t||!g) return;
  const fil=(n,v,c)=>'<div class="r">'+(c?'<i style="background:'+c+'"></i>':'<i class="ln"></i>')+'<span>'+esc4(n)+'</span><b>'+_zgN(v)+'</b></div>', sal=g.china+g.log+g.fij+g.otros;
  t.innerHTML='<div class="h">Semana del '+_p14F(g.w)+'</div>'+fil('Entra',g.entra,_ZG_S[0].c)+_ZG_S.slice(1).map(o=>fil(o.t,g[o.k],o.c)).join('')
    +'<div class="r tot"><span>Sale</span><b>'+_zgN(sal)+'</b></div><div class="r tot"><span>Entra − sale</span><b>'+_zgN(g.neto)+'</b></div>'+fil('Acumulado',g.acu,null);
  t.hidden=false; const cv=t.parentNode.getBoundingClientRect(), hit=ev.target.getBoundingClientRect();
  let x=hit.left-cv.left+hit.width+8; if(x+t.offsetWidth>cv.width) x=hit.left-cv.left-t.offsetWidth-8; t.style.left=Math.max(0,x)+'px'; t.style.top='8px'; }
document.addEventListener('mouseover',e=>{ const h=e.target&&e.target.closest&&e.target.closest('.zg-hit'); if(h) _zgTT(+h.dataset.i,e); });
document.addEventListener('focusin',e=>{ const h=e.target&&e.target.closest&&e.target.closest('.zg-hit'); if(h) _zgTT(+h.dataset.i,e); });
document.addEventListener('mouseout',e=>{ const h=e.target&&e.target.closest&&e.target.closest('.zg-hit'); if(h){ const t=document.getElementById('zgTT'); if(t) t.hidden=true; } });
document.addEventListener('click',e=>{ const h=e.target&&e.target.closest&&e.target.closest('.zg-hit'); if(h){ const i=+h.dataset.i; Z26.sem=Z26.sem===i?null:i; P14.det=null; renderCaja(); } });

/* ---- la Caja: la tabla de siempre arriba, la gráfica debajo ---- */
const _p14CajaAntes211=_p14Caja;
_p14Caja=function(){ let h=_p14CajaAntes211.apply(this,arguments);
  h=h.replace('<h2>Caja</h2>','<h2>Caja</h2><span class="zd-hoy">Hoy · '+esc4(_zdLargo(TODAY))+'</span>');
  h=h.replace('Lo atrasado que tiene plan sale en la semana actual. Lo vencido sin plan y lo atrasado de clientes no cuentan hasta que los programes en Planes.',
    'Lo atrasado del plan sale en la semana actual hasta que el detailed lo muestre pagado. Fijos, impuestos y cuotas de contrato de semanas pasadas se dan por pagados. Lo vencido sin plan y lo atrasado de clientes no cuentan hasta que los programes en Planes.');
  let g=''; try{ if(EQ.length||_ecClientes().length) g=_zgHTML(p14Calc('pago')); }catch(e){ console.warn('v2.11 gráfica',e); }
  return h+g; };
/* v2.11.1 · un estado de cuenta de Magnum o TIBA con el mismo corte que el que ya está, pero con otras facturas, sí entra
   desde un paquete de datos (TIBA mandó el 17-nov el SOA del 10-nov con una factura más). Solo se descarta si es más
   viejo o si trae exactamente las mismas facturas. */
_pk24Viejo=function(a,r){ const ant=CXP&&CXP[a]; if(!(ant&&ant.corte&&r&&r.corte)) return false;
  if(ant.corte!==r.corte) return ant.corte>r.corte;
  const k=f=>f.id+'|'+f.moneda+'|'+Math.round((+f.saldo||0)*100), A=(ant.facturas||[]).map(k).sort().join(','), B=(r.facturas||[]).map(k).sort().join(',');
  return A===B; };
/* v2.11.2 · plan de cobro: un abono adelantado tacha la cuota
   Un cliente pagó el viernes 13-nov (registrado en su estado de cuenta) la cuota del 18-nov de su
   "Acuerdo 11-nov", y el plan no la tachaba: solo contaba abonos desde el lunes de la semana de la primera cuota
   (16-nov). Ahora cuenta desde lo que llegue primero: ese lunes o la fecha del acuerdo. Un plan con "desde" propio
   (Enexa) sigue usándolo. Además, cobrar desde Planes o el Excel lo que ya está registrado como abono (mismo cliente,
   mismo monto, menos de 7 días de diferencia) no lo vuelve a sumar al estado de cuenta. */
_z27Cob=function(c){ const vacio={map:{},ab:0,desde:null,abonos:[],sobra:0};
  if(!c||c.dir!=='c'||c.act==='base') return vacio;
  const L=_v3Lin(c,c.act).filter(l=>!l.cump&&!l.sint&&l.m>0.005&&l.f).sort(_v3PorF); if(!L.length) return vacio;
  const v=_z293Ver(c); let desde=_p14Lun(_p14D(L[0].f));
  const fa=v&&v.fecha?_p14D(v.fecha):null; if(fa&&fa<desde) desde=fa;
  const d2=v&&v.desde?_p14D(v.desde):null; if(d2&&d2>desde) desde=d2;
  const abonos=(ECA||[]).filter(a=>a.cliente===c.n&&!a.via).filter(a=>{ const d=_ecFecha(a.fecha); return d&&d>=desde; });
  let ab=abonos.reduce((s,a)=>s+(+a.usd||0),0); const tot=ab, map={};
  L.forEach(l=>{ const t=Math.min(l.m,ab); map[l.id]=t; ab-=t; });
  return {map,ab:tot,desde,abonos,sobra:ab}; };
function _zcDup(cli,usd,f){ const d=_ecFecha(f)||TODAY;
  return (ECA||[]).find(a=>!a.via&&a.cliente===cli&&Math.abs((+a.usd||0)-(+usd||0))<0.01&&(()=>{ const x=_ecFecha(a.fecha); return x&&Math.abs(days(x,d))<7; })())||null; }
const _z27CobrarAntes2112=z27Cobrar;
z27Cobrar=function(cpId,o){ const c=_v3Cp(cpId); o=o||{};
  if(c&&c.dir==='c'){ const y=_zcDup(c.n,_z27r2(o.m),o.f||_p14Iso(TODAY));
    if(y){ try{ z26Aviso('Ya está registrado: abono de US$ '+fmtUSDs(+y.usd)+' de '+c.n+' del '+_p14F(_ecFecha(y.fecha))+'. No lo sumo otra vez.'); }catch(e){} return null; } }
  return _z27CobrarAntes2112.apply(this,arguments); };
/* v2.11.2 · TRM oficial también por el servidor
   En la herramienta real (Apps Script) el navegador no estaba trayendo la TRM de datos.gov.co: el respaldo del 17-nov
   no tenía ninguna guardada y la Caja convertía con 3,250 (saldos del 5-nov). Ahora, si el navegador no puede, la pide
   al servidor (trmOficial en Code.gs, UrlFetchApp). Mientras no haya oficial guardada, usa la TRM más reciente que
   conozca: la del último abono en pesos si es más nueva que la de los saldos. La Caja dice qué TRM usa y de dónde. */
function _zdTrmServidor(){ return new Promise((res,rej)=>{ try{
    if(!(typeof google!=='undefined'&&google.script&&google.script.run)) return rej(new Error('sin servidor'));
    const r=google.script.run.withSuccessHandler(t=>{ try{ res(JSON.parse(t||'[]')); }catch(e){ rej(e); } }).withFailureHandler(e=>rej(e));
    if(typeof r.trmOficial!=='function') return rej(new Error('el servidor no tiene trmOficial')); r.trmOficial(); }catch(e){ rej(e); } }); }
function _zdTrmGuardar(L){ const hoy=_p14Iso(TODAY);
  const x=(Array.isArray(L)?L:[]).find(y=>(''+y.vigenciadesde).slice(0,10)<=hoy&&(''+y.vigenciahasta).slice(0,10)>=hoy);
  if(!x||!(+x.valor>1000)) throw new Error('no hay TRM oficial publicada para hoy');
  const o={v:Math.round(+x.valor*100)/100,f:'oficial',desde:(''+x.vigenciadesde).slice(0,10),hasta:(''+x.vigenciahasta).slice(0,10)};
  const antes=TRMOF[hoy]; TRMOF[hoy]=o; const nueva=!antes||antes.v!==o.v||antes.f!==o.f; if(nueva) guardar4();
  return Object.assign({fecha:hoy,_nueva:nueva},o); }
const _neTrmTraerAntes2112=_neTrmTraer;
_neTrmTraer=function(){ return _neTrmTraerAntes2112.apply(this,arguments).catch(()=>_zdTrmServidor().then(_zdTrmGuardar)); };
const _p16TrmFuenteAntes2112=_p16TrmFuente;
_p16TrmFuente=function(){ if(_neTrmDe(_p14Iso(TODAY))) return _p16TrmFuenteAntes2112.apply(this,arguments);
  const u=_saldoUlt(), ab=(ECA||[]).filter(a=>!a.via&&+a.trm>1000&&a.fecha&&a.fecha<=_p14Iso(TODAY)).sort((a,b)=>a.fecha<b.fecha?1:(a.fecha>b.fecha?-1:0))[0];
  if(ab&&!(u&&+u.trm>0&&u.fecha&&u.fecha>=ab.fecha)) return {trm:+ab.trm,de:'abono en pesos del '+_p14F(_p14D(ab.fecha))};
  return _p16TrmFuenteAntes2112.apply(this,arguments); };
/* la Caja dice qué TRM usa */
const _p14CajaAntes2112=_p14Caja;
_p14Caja=function(){ const h=_p14CajaAntes2112.apply(this,arguments); let f=null; try{ f=_p16TrmFuente(); }catch(e){}
  if(!f||!(+f.trm>0)) return h; const of=/^oficial/.test(f.de||'');
  return h.replace(/(<span class="zd-hoy">[^<]*<\/span>)/,'$1<span class="zd-trm'+(of?'':' warn')+'" title="'+(of?'TRM oficial (Superfinanciera)':'No hay TRM oficial guardada para hoy: se usa la más reciente que conoce la herramienta')+'">TRM '+_ec2(+f.trm)+' · '+esc4(f.de||'')+'</span>'); };
/* v2.11.3 · paso "reaplicar" en una actualización preparada: mueve parte de un abono ya registrado de una línea (o cuota)
   a otra del mismo cliente, sin tocar el total del abono. Caso real (17-nov): del abono de un cliente del 13-nov, una parte
   había caído en el inversor (hoy en standby) y Esteban pidió pasarla a los trackers. Si el abono o lo aplicado ya no
   están como se espera, no hace nada. */
function _ztpReaplicar(paso){ const m=_z27r2(paso.monto), de=paso.de||{}, a=paso.a||{};
  const ab=(ECA||[]).find(x=>!x.via&&x.cliente===paso.cliente&&x.fecha===paso.fecha&&Math.abs((+x.usd||0)-(+paso.usd||0))<0.01); if(!ab||!(m>0)) return false;
  const e=(ab.aplicado||[]).find(p=>p.k===de.k&&(+p.i)===(+de.i)&&(+p.monto)>=m-0.005); if(!e) return false;
  const r=_ecReg(a.k), okA=r&&(a.i<0||(r.cuotas&&r.cuotas[a.i])); if(!okA) return false;
  _ecSumar(de.k,de.i,-m); e.monto=_z27r2(e.monto-m); if(Math.abs(e.monto)<0.005) ab.aplicado=ab.aplicado.filter(p=>p!==e);
  _ecSumar(a.k,a.i,m); const y=ab.aplicado.find(p=>p.k===a.k&&(+p.i)===(+a.i)); if(y) y.monto=_z27r2(+y.monto+m); else ab.aplicado.push({k:a.k,i:a.i,monto:m});
  return true; }
_ztpUno=async function(P,hecho){
  for(const paso of (P.pasos||[])){
    if(paso.tipo==='json'){ PKPREV=Object.assign(pkLeer(paso.obj),{archivo:paso.nombre}); pkAplicar(); hecho.push(paso.nombre); }
    else if(paso.tipo==='abono'){ _ztpAbono(paso); hecho.push(paso.nombre); }
    else if(paso.tipo==='reaplicar'){ _ztpReaplicar(paso); hecho.push(paso.nombre); }
    else if(paso.tipo==='excel'){
      const files=(paso.archivos||[]).map(a=>new File([_ztpB64(a.b64)],a.nombre,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      WIZ.loaded=false; WIZ.work=null; WIZ.err=null; await v2CargarArchivos({files});
      await _ztpEsperar(()=>WIZ&&(WIZ.err||(WIZ.loaded&&WIZ.work&&WIZ.work.length)),90000);
      if(WIZ.err) throw new Error(WIZ.err);
      wizGo(2); wizGo(3); wizGo(4); wizApprove(); await new Promise(r=>setTimeout(r,700)); hecho.push(paso.nombre); }
  }
  CONFIG.cambios[_ztpLlave(P)]={f:new Date().toISOString(),titulo:P.titulo||'',pasos:hecho.slice()}; };
