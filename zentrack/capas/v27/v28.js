/* ===================================================================
   v2.8 · Precios provisionales y facturados (pedido por pedido)
   - Estados del precio de un pedido para su cliente:
       sin precio · provisional (cualquier precio que no tenga factura) · facturado (con número,
       fecha y valor de la factura) · standby (el pedido está detenido: no entra al estado de cuenta).
   - Precio provisional calculado: (costo China + flete + aduana) × (1 + margen) + Zentrack × (1 + margen
     Zentrack) (electrónica, estaciones, TCUs que pone Zentrack). Los márgenes por defecto no van en el
     código (el repo es público): llegan en los datos preparados y se guardan en PRECIO.__def.
   - Al registrar la factura el precio pasa al valor real; lo abonado se queda y el saldo se recalcula.
   - Todo cambio de precio queda en el historial del pedido. El PDF y el Excel que van al cliente no
     dicen qué es provisional (Esteban: "es para manejo interno").
   - Datos preparados: PRECIOS = [{def:{margen,mExtra}} | {ped, mfg, flete, aduana, extra, mExtra, margen, standby, nota}].
   Llave nueva del estado: PRECIO = {kOf: {est:'standby', calc:{flete,aduana,extra,mExtra,margen}, fac:{num,fecha,valor}, hist:[{f,de,a,por}]}}.
   =================================================================== */
var PRECIO={}, PR28={fac:null};
function _prDef(){ const d=(PRECIO&&PRECIO.__def)||{}; return {margen:+d.margen||0,mExtra:+d.mExtra||0}; }
const _serAntes28=serializeState;
serializeState=function(){ const o=JSON.parse(_serAntes28.apply(this,arguments)); o.PRECIO=PRECIO; return JSON.stringify(o); };
const _appAntes28=applyState;
applyState=function(s){ PRECIO=(s&&s.PRECIO&&typeof s.PRECIO==='object'&&!Array.isArray(s.PRECIO))?s.PRECIO:{}; return _appAntes28.apply(this,arguments); };
function _prEq(k){ return EQ.find(e=>kOf(e)===k)||null; }
function _prReg(e,crear){ const k=kOf(e); let r=PRECIO[k]; if(!r&&crear) r=PRECIO[k]={hist:[]}; return r||null; }
function prEstado(e){ const r=_prReg(e); if(r&&r.est==='standby') return 'standby'; if(r&&r.fac&&+r.fac.valor>0) return 'facturado'; return precioVenta(e)>0?'provisional':'sin'; }
function _prDespachado(e){ return (e.etd&&new Date(e.etd)<=TODAY)||e.st==='shipped'; }
function prCalc(e,calc){ const c=Object.assign({flete:0,aduana:0,extra:0},_prDef(),calc||{}), china=_pcCosto(e), base=china+(+c.flete||0)+(+c.aduana||0);
  return {china:_r2(china),flete:+c.flete||0,aduana:+c.aduana||0,base:_r2(base),margen:+c.margen||0,extra:+c.extra||0,mExtra:+c.mExtra||0,
    precio:_r2(base*(1+(+c.margen||0))+(+c.extra||0)*(1+(+c.mExtra||0)))}; }
function _prPoner(e,v,por){ const de=precioVenta(e); v=_r2(v); if(Math.abs(de-v)<0.005) return false; const r=_prReg(e,true);
  (r.hist=r.hist||[]).push({f:_p14Iso(TODAY),de:_r2(de),a:v,por:por||''}); e.precioVenta=v; return true; }
/* calcular el precio provisional (no toca uno facturado ni uno de grupo de precio) */
function prCalcSet(e,calc,por){ if(!e||prEstado(e)==='facturado'||(typeof gpDeEq==='function'&&gpDeEq(e))) return false;
  const r=_prReg(e,true); r.calc=Object.assign({},r.calc||{},calc); return _prPoner(e,prCalc(e,r.calc).precio,por||'Precio provisional calculado'), true; }
function prFacturar(e,o){ if(!e||!(+o.valor>0)) return false; const r=_prReg(e,true); delete r.est;
  r.fac={num:(''+(o.num||'')).trim(),fecha:o.fecha||_p14Iso(TODAY),valor:_r2(+o.valor),prov:_r2(precioVenta(e))};
  _prPoner(e,+o.valor,'Factura '+r.fac.num); return true; }
function prStandby(e,on){ if(!e) return; const r=_prReg(e,true); if(on) r.est='standby'; else delete r.est; }
/* deshacer: foto del registro y del precio */
function _prFoto(e){ const k=kOf(e), r=PRECIO[k]; return {k,r:r?JSON.stringify(r):null,p:precioVenta(e)}; }
function _prVolver(f){ const e=_prEq(f.k); if(f.r==null) delete PRECIO[f.k]; else PRECIO[f.k]=JSON.parse(f.r); if(e) e.precioVenta=f.p; }

/* el estado de cuenta no muestra lo que está en standby */
const _ecFilasAntes28=ecFilas;
ecFilas=function(c){ const r=_ecFilasAntes28.apply(this,arguments);
  r.filas=r.filas.filter(f=>!(f.tipo==='eq'&&f.e&&prEstado(f.e)==='standby'));
  if(r.sinPrecio) r.sinPrecio=r.sinPrecio.filter(e=>prEstado(e)!=='standby'); return r; };
/* en pantalla (solo para ti) el valor dice si es provisional */
const _ecFilaHTMLAntes28=_ecFilaHTML;
_ecFilaHTML=function(f){ let h=_ecFilaHTMLAntes28.apply(this,arguments);
  if(f&&f.tipo==='eq'&&f.e&&prEstado(f.e)==='provisional'){ const a='<td class="r">'+_ec2(f.valor)+'</td>'; h=h.replace(a,'<td class="r">'+_ec2(f.valor)+'<span class="pr28-p" title="Precio provisional: sin factura">provisional</span></td>'); }
  return h; };

/* ---- la tabla de precios del cliente ---- */
function _prFilas(c){ return EQ.filter(e=>e.cliente===c&&cobroModo(e)!=='especial'); }
function _prOrden(e){ const s=prEstado(e); return s==='sin'?0:(s==='provisional'&&_prDespachado(e)?1:(s==='provisional'?2:(s==='facturado'?3:4))); }
function _prTag(e){ const s=prEstado(e);
  if(s==='sin') return _z26tag('crit','Sin precio'); if(s==='standby') return _z26tag('idle','Standby'); if(s==='facturado') return _z26tag('ok','Facturado');
  return _prDespachado(e)?_z26tag('warn','Despachado · por facturar'):_z26tag('info','Provisional'); }
function _prHTML(c){ const L=_prFilas(c); if(!L.length) return '';
  const g={sin:[],provisional:[],facturado:[],standby:[]}; L.forEach(e=>g[prEstado(e)].push(e)); const S=a=>a.reduce((s,e)=>s+precioVenta(e),0);
  const desp=g.provisional.filter(_prDespachado), prov=g.provisional.filter(e=>!_prDespachado(e)), abierto=g.sin.length>0||desp.length>0||!!PR28.abierto;
  const inp=(e,campo,val,ph)=>'<label>'+ph+'<input class="z-in n pr28-in'+(campo==='margen'?' pct':'')+'" data-pr="'+campo+'" data-k="'+esc4(kOf(e))+'" data-foco="pr-'+campo+'-'+esc4(kOf(e))+'" value="'+(val==null||val===''?'':(campo==='margen'?Math.round(val*1000)/10:fmtUSDs(val)))+'" placeholder="'+(campo==='margen'?Math.round(_prDef().margen*1000)/10:'0')+'" inputmode="decimal"></label>';
  const fila=e=>{ const k=kOf(e), kq=esc4(k), s=prEstado(e), r=_prReg(e)||{}, cc=r.calc||null, fac=r.fac, x=prCalc(e,cc||{});
    const acc=s==='standby'?'<button type="button" class="z-btn sm" data-pa="activar" data-k="'+kq+'">Reactivar</button>'
      :(s==='facturado'?'<button type="button" class="z-btn sm q" data-pa="corregir" data-k="'+kq+'">Corregir factura</button>'
        :'<button type="button" class="z-btn sm'+(s==='sin'?' pri':'')+'" data-pa="calc" data-k="'+kq+'" aria-expanded="'+(PR28.calc===k)+'">Calcular</button>'
          +'<button type="button" class="z-btn sm'+(s!=='sin'?' pri':'')+'" data-pa="facturar" data-k="'+kq+'"'+(s==='sin'?' disabled title="Primero ponle un precio"':'')+'>Factura</button>');
    let h='<tr class="pr28-'+s+'"><td><b>'+esc4(e.derrame||e.ordenId)+'</b><small>'+esc4((e.mfg==='Singsun'?'Tracker':'Shelter')+((+e.qty||1)>1?' × '+e.qty:''))+'</small></td>'
      +'<td class="w">'+esc4(e.proj||'')+'</td><td>'+_prTag(e)+(fac?'<small>'+esc4(fac.num||'s/n')+' · '+_p14F(_p14D(fac.fecha))+(fac.prov&&Math.abs(fac.valor-fac.prov)>0.5?' · ajuste '+(fac.valor>fac.prov?'+':'−')+fmtUSDs(Math.abs(fac.valor-fac.prov)):'')+'</small>':'')+'</td>'
      +'<td class="n">'+fmtUSDs(x.china)+'</td><td class="n"><b>'+(precioVenta(e)>0?fmtUSDs(precioVenta(e)):'—')+'</b>'+(precioVenta(e)>0&&x.china>0?'<small>'+Math.round((precioVenta(e)/x.china-1)*100)+' % sobre China</small>':'')+'</td>'
      +'<td class="n"><span class="z-acc">'+acc+'</span></td></tr>';
    if(PR28.calc===k&&s!=='facturado'&&s!=='standby'){ const c2=Object.assign({},_prDef(),cc||{}), y=prCalc(e,c2);
      h+='<tr class="pr28-ff"><td colspan="6"><div class="z-reg">'+inp(e,'flete',c2.flete,'Flete')+inp(e,'aduana',c2.aduana,'Aduana')+inp(e,'extra',c2.extra,'Zentrack (+'+Math.round(y.mExtra*1000)/10+' %)')+inp(e,'margen',c2.margen,'Margen %')
        +'<div class="z-reg-b"><span>('+fmtUSDs(y.china)+' + '+fmtUSDs(y.flete)+' + '+fmtUSDs(y.aduana)+') × '+(1+y.margen).toFixed(2)+(y.extra?' + '+fmtUSDs(y.extra)+' × '+(1+y.mExtra).toFixed(2):'')+' = <b>'+fmtUSDs(y.precio)+'</b></span><span class="z-sp"></span>'
        +'<button type="button" class="z-btn sm pri" data-pa="usar" data-k="'+kq+'">Usar este precio</button><button type="button" class="z-btn sm q" data-pa="standby" data-k="'+kq+'">Poner en standby</button><button type="button" class="z-btn sm q" data-pa="calcX">Cerrar</button></div></div></td></tr>'; }
    if(PR28.fac===k){ const v=fac?fac.valor:precioVenta(e);
      h+='<tr class="pr28-ff"><td colspan="6"><div class="z-reg"><label>Factura n.º<input class="z-in" data-pf="num" value="'+esc4(fac?fac.num:'')+'" placeholder="número"></label>'
        +'<label>Fecha<input class="z-in" type="date" data-pf="fecha" value="'+esc4(fac?fac.fecha:_p14Iso(TODAY))+'"></label>'
        +'<label>Valor US$<input class="z-in n" data-pf="valor" value="'+fmtUSDs(v)+'" inputmode="decimal"></label>'
        +'<div class="z-reg-b"><span class="z-mut3">Precio actual '+fmtUSDs(precioVenta(e))+'. Lo abonado se queda y el saldo se recalcula.</span><span class="z-sp"></span>'
        +'<button type="button" class="z-btn sm pri" data-pa="facOk" data-k="'+kq+'">Guardar factura</button><button type="button" class="z-btn sm q" data-pa="facX">Cancelar</button></div></div></td></tr>'; }
    if(r.hist&&r.hist.length&&PR28.hist===k) h+='<tr class="pr28-h"><td colspan="6">'+r.hist.slice().reverse().map(x=>_p14F(_p14D(x.f))+' · '+fmtUSDs(x.de)+' → '+fmtUSDs(x.a)+(x.por?' · '+esc4(x.por):'')).join('<br>')+'</td></tr>';
    return h; };
  const ord=a=>a.slice().sort((p,q)=>(''+(p.derrame||'')).localeCompare(''+(q.derrame||''),undefined,{numeric:true}));
  const sec=(t,a,tot)=>a.length?'<tr class="sec"><td colspan="6">'+t+' · '+a.length+(tot?' · US$ '+fmtUSDs(S(a)):'')+'</td></tr>'+ord(a).map(fila).join(''):'';
  const res=[['Facturado',S(g.facturado),g.facturado.length],['Provisional',S(g.provisional),g.provisional.length],['Sin precio',null,g.sin.length],['Standby',null,g.standby.length]].filter(x=>x[2]>0)
    .map(x=>x[0]+' '+(x[1]!=null?fmtUSDs(x[1])+' ':'')+'('+x[2]+')').join(' · ');
  return '<details class="pr28"'+(abierto?' open':'')+'><summary><b>Precios</b><span class="pr28-res">'+esc4(res)+(desp.length?' · <b class="pr28-w">'+desp.length+' despachado'+(desp.length===1?'':'s')+' sin factura</b>':'')+'</span></summary>'
    +'<div class="z-wrap"><table class="z-t pr28-t"><thead><tr><th>Pedido</th><th>Proyecto</th><th>Estado</th><th class="n">Costo China</th><th class="n">Precio</th><th></th></tr></thead><tbody>'
    +sec('Sin precio',g.sin,false)+sec('Despachados sin factura',desp,true)+sec('Provisionales',prov,true)+sec('Facturados',g.facturado,true)+sec('Standby',g.standby,false)+'</tbody></table></div>'
    +'<div class="pr28-pie">Precio provisional = (costo China + flete + aduana) × (1 + margen) + Zentrack × (1 + su margen). Solo tú ves qué es provisional: el PDF y el Excel muestran el precio sin marca. Clic en un pedido para ver su historial.</div></details>'; }
const _ecHTMLAntes28=_ecHTML;
_ecHTML=function(c){ const h=_ecHTMLAntes28.apply(this,arguments); let p=''; try{ p=_prHTML(c); }catch(err){ console.warn('v2.8 precios',err); }
  if(!p) return h; const k=h.indexOf('<div class="ec8-sec'); return k>=0?h.slice(0,k)+p+h.slice(k):h+p; };
function _prListo(msg,f){ if(typeof _z27HechoFn==='function') _z27HechoFn(msg,()=>_prVolver(f)); else { guardar4(); refreshAll(); } }
document.addEventListener('change',e=>{ const t=e.target; if(!t||!t.dataset||!t.dataset.pr) return; const el=_prEq(t.dataset.k); if(!el) return;
  const campo=t.dataset.pr, raw=(''+t.value).trim(); let v=raw===''?0:(typeof _z27Num==='function'?_z27Num(raw):parseFloat(raw.replace(/,/g,'')));
  if(!isFinite(v)) v=0; if(campo==='margen') v=v/100; const r=_prReg(el,true);
  r.calc=Object.assign({},_prDef(),r.calc||{}); r.calc[campo]=v; PR28.calc=kOf(el); guardar4(); renderClientes(); });
document.addEventListener('click',e=>{ const t=e.target.closest('[data-pa]'); if(!t||t.disabled) return; const a=t.dataset.pa;
  if(a==='facX'){ PR28.fac=null; renderClientes(); return; }
  if(a==='calcX'){ PR28.calc=null; renderClientes(); return; }
  const el=_prEq(t.dataset.k); if(!el) return; const k=kOf(el);
  if(a==='calc'){ PR28.calc=PR28.calc===k?null:k; PR28.fac=null; PR28.abierto=true; renderClientes(); const i=document.querySelector('.pr28 [data-pr="flete"]'); if(i) i.focus(); return; }
  if(a==='usar'){ const f=_prFoto(el), r=_prReg(el,true); const ok=prCalcSet(el,Object.assign({},_prDef(),r.calc||{}),'Precio provisional calculado');
    if(!ok){ z26Aviso('Este pedido no se puede calcular aquí'); return; } PR28.calc=null; return _prListo('Precio provisional de '+(el.derrame||'')+': '+fmtUSDs(precioVenta(el)),f); }
  if(a==='facturar'||a==='corregir'){ PR28.calc=null; PR28.fac=k; PR28.abierto=true; renderClientes(); const i=document.querySelector('.pr28 [data-pf="num"]'); if(i) i.focus(); return; }
  if(a==='facOk'){ const b=t.closest('.z-reg'), v=n=>{ const x=b.querySelector('[data-pf="'+n+'"]'); return x?x.value:''; }, val=typeof _z27Num==='function'?_z27Num(v('valor')):parseFloat(v('valor'));
    if(!(val>0)){ z26Aviso('Escribe el valor de la factura'); return; } const f=_prFoto(el); prFacturar(el,{num:v('num'),fecha:v('fecha'),valor:val}); PR28.fac=null;
    return _prListo('Factura registrada: '+(el.derrame||'')+' · '+fmtUSDs(val),f); }
  if(a==='standby'||a==='activar'){ PR28.calc=null; const f=_prFoto(el); prStandby(el,a==='standby'); return _prListo((el.derrame||'')+(a==='standby'?' queda en standby: sale del estado de cuenta':' vuelve al estado de cuenta'),f); } });
document.addEventListener('click',e=>{ const t=e.target.closest('.pr28-t tbody tr:not(.pr28-ff):not(.pr28-h):not(.sec) td:first-child'); if(!t) return; const b=t.querySelector('b'); if(!b) return;
  const el=EQ.find(x=>(x.derrame||x.ordenId)===b.textContent&&_prReg(x)); if(!el) return; const k=kOf(el); PR28.hist=PR28.hist===k?null:k; PR28.abierto=true; renderClientes(); });

/* ---- datos preparados: PRECIOS ---- */
function _pr28Busca(x){ return EQ.find(e=>(e.derrame===x.ped||e.ordenId===x.ped)&&(!x.mfg||e.mfg===x.mfg))||null; }
function _pr28Txt(x,dd){ if(x&&x.def) return 'Márgenes por defecto · '+Math.round((+x.def.margen||0)*1000)/10+' % sobre el costo · Zentrack '+Math.round((+x.def.mExtra||0)*1000)/10+' %'; const e=_pr28Busca(x); if(!e) return 'Precio · '+(x.ped||'?')+' no está en la herramienta: no se cambia';
  const s=prEstado(e), n=(e.derrame||'')+' '+(e.proj||'');
  if(x.standby) return 'Standby · '+n+(e.cliente&&e.cliente!=='Por asignar'?': sale del estado de cuenta de '+e.cliente:': queda detenido');
  if(s==='facturado') return 'Precio · '+n+' ya está facturado: no se cambia';
  const d=dd||_prDef(), c=prCalc(e,Object.assign({margen:d.margen,mExtra:d.mExtra},x)); return 'Precio provisional · '+n+': (costo '+fmtUSDs(c.china)+' + flete '+fmtUSDs(c.flete)+' + aduana '+fmtUSDs(c.aduana)+') × '+(1+c.margen).toFixed(2)
    +(c.extra?' + Zentrack '+fmtUSDs(c.extra)+' × '+(1+c.mExtra).toFixed(2):'')+' = US$ '+fmtUSDs(c.precio)+' (antes '+(precioVenta(e)>0?fmtUSDs(precioVenta(e)):'sin precio')+')'; }
function _pr28Aplicar(x){ if(x&&x.def){ PRECIO.__def={margen:+x.def.margen||0,mExtra:+x.def.mExtra||0}; return; } const e=_pr28Busca(x); if(!e) return; if(x.standby){ prStandby(e,true); return; }
  if(prEstado(e)==='facturado') return; const d=_prDef(), c={flete:+x.flete||0,aduana:+x.aduana||0,extra:+x.extra||0,mExtra:x.mExtra!=null?+x.mExtra:d.mExtra,margen:x.margen!=null?+x.margen:d.margen};
  prCalcSet(e,c,'Datos preparados'+(x.nota?' · '+x.nota:'')); }
const _pkLeerAntes28=pkLeer;
pkLeer=function(obj){ const r=_pkLeerAntes28.apply(this,arguments), d=(obj&&obj.datos)||{}; const dd=((d.PRECIOS||[]).find(x=>x&&x.def)||{}).def; const df=dd?{margen:+dd.margen||0,mExtra:+dd.mExtra||0}:null; r.res=(d.PRECIOS||[]).map(x=>_pr28Txt(x,df)).concat(r.res); return r; };
const _pkAplicarAntes28=pkAplicar;
pkAplicar=function(){ if(PKPREV&&PKPREV.obj){ (((PKPREV.obj.datos||{}).PRECIOS)||[]).forEach(x=>{ try{ _pr28Aplicar(x); }catch(err){ console.warn(err); } }); }
  return _pkAplicarAntes28.apply(this,arguments); };
document.addEventListener('toggle',e=>{ const t=e.target; if(t&&t.classList&&t.classList.contains('pr28')) PR28.abierto=t.open; },true);
