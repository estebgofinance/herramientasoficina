/* ===================================================================
   v2.6.1 · PEDIDOS QUE ANDRÉS RENOMBRA Y AJUSTES DE PLAN DESDE DATOS PREPARADOS
   11-nov-2026. Andrés partió el PO 13 en 13-1/13-2 y el CFM 4 en CFM 4-1/4-2.
   La herramienta conservaba los viejos (con tus nombres, clientes y precios) y
   traía los nuevos sin nada: la deuda con Eaglerise quedaba doble y Solenium
   perdía esos precios. Datos preparados ahora también trae:
   - TRASPASO: [{a:'mfg|nuevo', de:['mfg|viejo',...], partes:[{proj,cliente,frac}]}]
       Antes de cargar el detailed deja la receta del pedido nuevo (una parte por
       cada viejo, con su nombre y cliente) sin pisar una receta que ya tengas.
       Al aprobar el detailed, cada parte nueva hereda del viejo lo que pusiste a
       mano: precio, costo, cómo se cobra, logística y lo cobrado al cliente (por
       la fracción "frac" si un viejo se reparte en varios nuevos). Lo abonado se
       re-apunta y el viejo sale (en Desaparecidos viene en "Quitar"; si lo pasas
       a "Conservar", se queda y no hereda nada).
   - PLAN_QUITAR: [{prov:'nexus'}] borra el plan de giros "a" de ese proveedor
       (y lo pagado que tenía registrado); lo que le debes queda sin plan.
   - GIROS: [{cp:'pago:eagle', fecha, monto, nota}] agrega un giro a la versión
       que cuenta en la Caja. Si ya está (misma fecha y monto), no se repite.
   Sin llaves nuevas: MIO gana "traspaso" (lo pendiente de heredar).
   =================================================================== */
const _TR261NUM=['precioVenta','logisticaFlete','logisticaCobertura','logPagado','antClientePagado','balClientePagado'];
const _TR261BOOL=['logPaid','antClientePaid','balClientePaid'];
function _tr261Src(k){ return EQ.filter(e=>kOf(e)===k); }
function _tr261Lab(k){ return (''+k).split('|').slice(1).join('|').replace(/^CFM/,'CFM '); }
function _tr261Partes(t){
  const de=t.de||[], P=t.partes||[];
  if(de.length>1) return de.map((s,i)=>{ const src=_tr261Src(s)[0]||{}, o=P[i]||{};
    return {key:t.a+_SUF[i], de:s, proj:o.proj||src.proj||'', cliente:o.cliente||src.cliente||'', frac:o.frac!=null?+o.frac:1}; });
  const s=de[0], src=_tr261Src(s)[0]||{}, o=P[0]||{};
  return [{key:t.a, de:s, proj:o.proj||src.proj||'', cliente:o.cliente||src.cliente||'', frac:o.frac!=null?+o.frac:1}];
}
function _tr261Ya(t,ps){ return ps.length>1?!!(MIO.split&&MIO.split[t.a]):!!(MIO.proj&&MIO.proj[t.a]); }
function _tr261Txt(t){
  if(!t||!t.a||!(t.de||[]).length) return 'Traspaso sin pedido nuevo o viejo: no se hace';
  const ps=_tr261Partes(t), ya=_tr261Ya(t,ps), n=_tr261Lab(t.a);
  const fp=p=>{ const src=_tr261Src(p.de), pv=src.reduce((a,x)=>a+(+x.precioVenta||0),0)*p.frac;
    return (p.proj||'(sin nombre)')+' ('+(p.cliente||'sin cliente')+(pv>0.5?' · precio '+fmtUSDs(pv):'')+(src.length?'':' · el viejo ya no está')+')'; };
  const viejos=[...new Set(ps.map(p=>_tr261Lab(p.de)))].join(', ');
  return n+(ps.length>1?' se reparte en '+ps.length+' partes: ':' = ')+ps.map(fp).join(' y ')+', desde '+viejos
    +(ya?' · ya tiene tus nombres: no se tocan; solo hereda lo que le falte':'')+' · se aplica al cargar el detailed y '+viejos+' sale de la herramienta';
}
function _tr261Aplicar(t){
  if(!t||!t.a||!(t.de||[]).length) return;
  const ps=_tr261Partes(t); MIO.traspaso=MIO.traspaso||{};
  if(!_tr261Ya(t,ps)){
    if(ps.length>1) mioRecordarSplit(t.a,ps.map(p=>({proj:p.proj,cliente:p.cliente})));
    else { mioNombre(t.a,ps[0].proj); mioCliente(t.a,ps[0].cliente); }
  }
  ps.forEach(p=>{ MIO.traspaso[p.key]={de:p.de,frac:p.frac}; });
}
function _pq261Giros(prov){ return Object.keys(PLANCHINA||{}).filter(iso=>{ const v=PLANCHINA[iso]; return v&&typeof v==='object'&&v[prov]!=null&&v[prov]!==''&&+v[prov]>0; }).sort(); }
function _pq261Txt(q){
  const prov=q&&q.prov, n=(_V3PROV||{})[prov]; if(!n) return 'Plan de giros: proveedor "'+prov+'" no existe: no se toca';
  const L=_pq261Giros(prov), tot=L.reduce((a,iso)=>a+(+PLANCHINA[iso][prov]||0),0), c=_v3Cp('pago:'+prov);
  if(!L.length) return n+' · no tiene plan de giros a: nada que borrar';
  return n+' · se borra su plan de giros a: '+L.length+' giro'+(L.length===1?'':'s')+' · US$ '+fmtUSDs(tot)+' ('+L.map(iso=>_v3F(iso)+' '+_v3k(+PLANCHINA[iso][prov])).join(', ')+'). Lo que le debes queda sin plan'
    +(c&&c.act!=='a'?' · ojo: hoy cuenta su versión '+c.act+', que no se toca':'');
}
function _pq261Aplicar(q){
  const prov=q&&q.prov; if(!(_V3PROV||{})[prov]) return; const R=_v3Real();
  _pq261Giros(prov).forEach(iso=>{ const v=Object.assign({},PLANCHINA[iso]); delete v[prov];
    const resto=['eagle','nexus','comp','sin'].reduce((a,k)=>a+(+v[k]||0),0);
    if(v.fuera!=null){ v.fuera=Math.min(+v.fuera||0,resto); if(!(v.fuera>0.005)) delete v.fuera; }
    if(Object.keys(v).length) PLANCHINA[iso]=v; else delete PLANCHINA[iso];
    delete R['pc|'+iso+'|'+prov]; });
}
function _gi261Info(g){
  const c=g&&_v3Cp(g.cp); if(!c) return {c:null}; const m=+g.monto||0, f=g.fecha&&_p14D(g.fecha)?_p14Iso(_p14D(g.fecha)):null;
  let vid=c.act; if(vid==='base') vid=c.tipo==='Negociado'?'a':null;
  const dup=!!(vid&&f&&_v3Lin(c,vid).some(l=>l.f===f&&Math.abs(l.m-m)<0.01));
  const vt=vid?((_v3Vers(c).find(x=>x.id===vid)||{t:vid}).t):'';
  return {c,m,f,vid,dup,vt};
}
function _gi261Txt(g){ const x=_gi261Info(g); if(!x.c) return 'Giro para "'+(g&&g.cp)+'": esa contraparte no existe: no se agrega';
  if(!x.vid||!x.f||!(x.m>0)) return x.c.n+' · giro sin fecha, sin monto o sin plan editable: no se agrega';
  return x.c.n+' · giro de US$ '+fmtUSDs(x.m)+' el '+_v3F(x.f)+' en el plan '+x.vt+(g.nota?' ('+g.nota+')':'')+(x.dup?' · ya estaba: no se repite':''); }
function _gi261Aplicar(g){ const x=_gi261Info(g); if(!x.c||!x.vid||!x.f||!(x.m>0)||x.dup) return;
  _v3LinAdd(x.c,x.vid,x.f,x.m,x.c.dir==='p'&&_V3PROV[x.c.prov]?'china':''); }

const _pkLeerAntes261=pkLeer;
pkLeer=function(obj){ const r=_pkLeerAntes261.apply(this,arguments), d=(obj&&obj.datos)||{}, mio=[];
  (d.TRASPASO||[]).forEach(t=>mio.push(_tr261Txt(t)));
  (d.PLAN_QUITAR||[]).forEach(q=>mio.push(_pq261Txt(q)));
  (d.GIROS||[]).forEach(g=>mio.push(_gi261Txt(g)));
  r.res=mio.concat(r.res); return r; };
const _pkAplicarAntes261=pkAplicar;
pkAplicar=function(){
  if(!PKPREV||!PKPREV.obj) return; const d=PKPREV.obj.datos||{};
  (d.TRASPASO||[]).forEach(t=>{ try{ _tr261Aplicar(t); }catch(err){ console.warn(err); } });
  (d.PLAN_QUITAR||[]).forEach(q=>{ try{ _pq261Aplicar(q); }catch(err){ console.warn(err); } });
  (d.GIROS||[]).forEach(g=>{ try{ _gi261Aplicar(g); }catch(err){ console.warn(err); } });
  return _pkAplicarAntes261.apply(this,arguments); };

/* un pedido que tenías entero y ahora llega en partes (receta de traspaso): el entero sale */
function _tr261Partidos(){ const T=(MIO&&MIO.traspaso)||{}, bases={}, ks=new Set((WIZ.work||[]).map(w=>kOf(w)));
  Object.keys(T).forEach(k=>{ if(/[A-P]$/.test(k)){ const b=k.slice(0,-1); if(MIO.split&&MIO.split[b]&&ks.has(k)&&!ks.has(b)&&_tr261Src(b).length) bases[b]=1; } });
  return Object.keys(bases); }
/* en el asistente: los viejos vienen en "Quitar" y un aviso dice a dónde van sus datos */
function _tr261Viejos(){ const T=(MIO&&MIO.traspaso)||{}, m={};
  Object.keys(T).forEach(k=>{ const s=T[k].de; if(_tr261Src(s).length) (m[s]=m[s]||[]).push(k); }); return m; }
const _renderWizAntes261=renderWiz;
renderWiz=function(){
  try{ if(WIZ&&WIZ.loaded){ WIZ.quitar=WIZ.quitar||{}; Object.keys(_tr261Viejos()).concat(_tr261Partidos()).forEach(s=>{ if(WIZ.quitar[s]===undefined) WIZ.quitar[s]=true; }); } }catch(err){ console.warn(err); }
  const r=_renderWizAntes261.apply(this,arguments);
  try{ const V=_tr261Viejos(), ks=Object.keys(V), b=document.getElementById('reconBody');
    if(WIZ&&WIZ.loaded&&ks.length&&b&&!b.querySelector('.tr261')){ const d=document.createElement('div'); d.className='cfgnote2 tr261';
      d.style.cssText='margin:0 0 12px;border-left:3px solid var(--z-info,#2B5C9E);padding-left:10px';
      d.innerHTML='<b>Andrés renombró '+ks.length+' pedido'+(ks.length===1?'':'s')+':</b> '+ks.map(s=>esc4(_tr261Lab(s))+' → '+[...new Set(V[s].map(k=>_tr261Lab(k).replace(/[A-P]$/,'')))].map(esc4).join(', ')).join(' · ')
        +'. Al aprobar, sus nombres, clientes, precios y costos pasan a los nuevos y los viejos salen.'
        +(_tr261Partidos().length?' '+_tr261Partidos().map(s=>esc4(_tr261Lab(s))).join(' y ')+' ya venían cargados enteros: salen, porque ahora llegan en partes.':'');
      b.insertBefore(d,b.firstChild); } }catch(err){ console.warn(err); }
  return r; };
const _wizApproveAntes261=wizApprove;
wizApprove=function(){
  const T=(MIO&&MIO.traspaso)||{}, ks=Object.keys(T);
  if(!ks.length) return _wizApproveAntes261.apply(this,arguments);
  const cp=o=>o==null?null:JSON.parse(JSON.stringify(o)), viejos={};
  ks.forEach(k=>{ const s=T[k].de; if(viejos[s]) return;
    viejos[s]={eq:_tr261Src(s).map(cp),costo:cp(COSTO&&COSTO[s]),cobro:cp(COBRO&&COBRO[s]),ecp:cp(ECP&&ECP[s])}; });
  WIZ.quitar=WIZ.quitar||{}; Object.keys(viejos).forEach(s=>{ if(viejos[s].eq.length&&WIZ.quitar[s]===undefined) WIZ.quitar[s]=true; });
  _tr261Partidos().forEach(b=>{ if(WIZ.quitar[b]===undefined) WIZ.quitar[b]=true; });
  const quita={}; Object.keys(viejos).forEach(s=>{ quita[s]=!!WIZ.quitar[s]; });
  const r=_wizApproveAntes261.apply(this,arguments);
  const hechos=[], primero={};
  try{
    EQ.forEach(e=>{ const k=kOf(e), t=T[k]; if(!t) return; const v=viejos[t.de]; if(!v||!v.eq.length||!quita[t.de]) return;
      const f=t.frac!=null?+t.frac:1, sum=fl=>v.eq.reduce((a,x)=>a+(+x[fl]||0),0);
      _TR261NUM.forEach(fl=>{ if(!(+e[fl]>0)){ const val=Math.round(sum(fl)*f*100)/100; if(val>0) e[fl]=val; } });
      _TR261BOOL.forEach(fl=>{ if(v.eq.every(x=>x[fl])) e[fl]=true; });
      if(!e.cliente||e.cliente==='Por asignar'){ const c=v.eq.find(x=>x.cliente&&x.cliente!=='Por asignar'); if(c){ e.cliente=c.cliente; e._cliCustom=true; } }
      if(v.costo&&!COSTO[k]){ COSTO[k]=cp(v.costo); if(COSTO[k].monto!=null&&f!==1) COSTO[k].monto=Math.round(COSTO[k].monto*f*100)/100; }
      if(v.cobro&&!COBRO[k]) COBRO[k]=cp(v.cobro);
      if(!primero[t.de]) primero[t.de]=k; hechos.push(k); });
    /* lo abonado o aplicado al viejo pasa al primer pedido nuevo; el viejo ya no existe */
    Object.keys(primero).forEach(s=>{ const k=primero[s];
      if(ECP&&ECP[s]){ if(!ECP[k]) ECP[k]=ECP[s]; delete ECP[s]; }
      (ECA||[]).forEach(a=>(a.aplicado||[]).forEach(p=>{ if(p.k===s) p.k=k; }));
      if(!EQ.some(e=>kOf(e)===s)){ delete COSTO[s]; if(COBRO) delete COBRO[s]; } });
    /* lo hecho, o lo que ya no tiene de dónde heredar, no se vuelve a aplicar */
    ks.forEach(k=>{ const s=T[k].de; if(hechos.indexOf(k)>=0||!viejos[s]||!viejos[s].eq.length||!quita[s]) delete T[k]; });
    if(hechos.length){ guardar4(); try{ refreshAll(); }catch(e){} toast('Pedidos renombrados: '+hechos.length+' parte(s) heredaron tus nombres, clientes y precios'); }
  }catch(err){ console.warn('v2.6.1 traspaso',err); }
  return r; };
