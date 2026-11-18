/* ===================================================================
   v2.13.1 · Marcar pagado o cobrado desde Planes: el mismo registro que las otras pantallas
   Esteban (17-nov-2026): "Quiero poder modificar desde planes tambien. Que todo sea la misma tabla pero vista de otra
   forma… poder marcar desde cualquiera de las vistas y que se sincronice".
   - Cada cuota pendiente trae su botón: "Cobrado" (cliente) o "Pagado" (proveedor). No hay registro aparte:
     · Cobrado = un abono del estado de cuenta del cliente (ECA), lo mismo que "Registrar abono" allá. El plan lo tacha
       (lo más viejo primero) y el estado de cuenta lo muestra. Si ya está registrado (mismo monto, ±7 días), no se repite.
     · Pagado = el pago con fecha y medio (PLANES.reg), el mismo del panel y de la tabla de 12 semanas. Lo que el detailed
       muestre después no se cuenta dos veces.
     · Magnum y TIBA se ven factura por factura, como en Proveedores: "Pagada" y la fecha de pago son las mismas marcas
       (CXPMIO.pagada / planFecha).
   - "Desmarcar" quita lo marcado: el abono hecho desde esa cuota, los pagos registrados, la factura pagada. Deshacer.
   - El abono hecho desde una cuota queda con ella (ECA[].cuota) para poder desmarcarlo.
   - "Registrar abono" en el estado de cuenta pregunta antes de repetir un abono igual (mismo monto, ±7 días).
   Estado: solo agrega el campo "cuota" a un abono. Nada se renombra ni se borra.
   =================================================================== */
/* el abono que sale de una cuota queda amarrado a ella */
const _z27CobrarAntes2131=z27Cobrar;
z27Cobrar=function(cpId,o){ const a=_z27CobrarAntes2131.apply(this,arguments);
  try{ if(a&&Z27.pg&&Z27.pg.cp===cpId&&Z27.pg.id&&Z27.pg.id!=='*'&&!/^b\|/.test(Z27.pg.id)) a.cuota=Z27.pg.id; }catch(e){} return a; };
function _z2131Abonos(c,id){ return (ECA||[]).filter(a=>!a.via&&a.cliente===c.n&&a.cuota===id); }
function _z2131Regs(id){ return ((_z27Reg()[id])||[]).length>0||(+(((PLANES&&PLANES.real)||{})[id])||0)>0.005; }

/* ---- botones de cada cuota ---- */
_z213Acc=function(c,l,e,done,edit){ const id=esc4(l.id), cobro=c.dir==='c';
  if(!edit) return cobro&&c.tipo==='Contrato'&&l.m>0.5?'<button type="button" class="z-btn sm" data-h="cob" data-id="'+id+'">Cobrado</button>':'';
  const des=cobro?_z2131Abonos(c,l.id).length>0:_z2131Regs(l.id);
  return (!done?'<button type="button" class="z-btn sm" data-h="'+(cobro?'cob':'pag')+'" data-id="'+id+'">'+(cobro?'Cobrado':'Pagado')+'</button>':'')
    +(des?'<button type="button" class="z-btn sm q" data-h="desm" data-id="'+id+'">Desmarcar</button>':'')
    +(!done?'<button type="button" class="z-btn sm q" data-h="correr" data-id="'+id+'" title="Una semana más tarde">Correr</button>':'')
    +'<button type="button" class="z-btn sm q z13-x" data-h="del" data-id="'+id+'" aria-label="Quitar la cuota del '+esc4(_z213Fd(l.f))+'">✕</button>'; };
function _z2131Desm(c,id){
  if(c.dir==='c'){ const L=_z2131Abonos(c,id); if(!L.length) return; const t=L.reduce((a,x)=>a+(+x.usd||0),0);
    L.forEach(a=>_z27DesCobrar(a));
    return _z27HechoFn('Cobro desmarcado: '+_z26m(t)+' sale también del estado de cuenta de '+c.n,()=>{ L.forEach(a=>{ (a.aplicado||[]).forEach(p=>_ecSumar(p.k,p.i,+p.monto)); ECA.push(a); }); }); }
  const s=_z26Snap(), G=_z27Reg(); let k=0; while((G[id]||[]).length&&k++<200) z27Quitar(id,0); if(PLANES.real) delete PLANES.real[id];
  return _z26Hecho('Pago desmarcado',s); }

/* ---- Magnum y TIBA: factura por factura, con las mismas marcas de Proveedores ---- */
function _z2131Fx(c){ const acre=c.prov, F=((CXP[acre]&&CXP[acre].facturas)||[]);
  return F.map(f=>{ const m=CXPMIO[_mioK(acre,f)]||{}, d=cxpFecha(acre,f,'pago');
      return {f,id:''+f.id,pag:!!m.pagada,fuera:!!m.fuera,plan:m.planFecha||'',iso:d?_p14Iso(d):'',usd:_z213r2(_cxpUSD(f)),cop:f.moneda!=='USD'?+f.saldo:null,partes:!!(m.partes&&m.partes.length),vence:f.vence||''}; })
    .filter(x=>!x.fuera&&(+x.f.saldo||0)>0.005).sort((a,b)=>a.iso<b.iso?-1:(a.iso>b.iso?1:(a.id<b.id?-1:1))); }
function _z2131FxHTML(c,r){ const X=_z2131Fx(c), P=X.filter(x=>!x.pag), Pg=X.filter(x=>x.pag), tot=P.reduce((a,x)=>a+x.usd,0);
  let h='<div class="z13-dh"><div class="rw"><h3>'+esc4(c.n)+'</h3>'+_z26tag('info','Le pago')+(c.enCaja?_z26tag('idle','Automático · '+(c.baseT||'')):_z26tag('idle','Fuera de la Caja'))+'<span class="z-sp"></span>'
    +'<button type="button" class="z-btn sm" data-h="propio">Hacer plan propio</button><button type="button" class="z-btn sm" data-h="dr">Historial y más</button></div>'
    +'<div class="z13-kp"><span>Por pagar <b>'+_z26m(tot)+'</b></span><span>'+P.length+' factura'+(P.length===1?'':'s')+'</span>'+(Pg.length?'<span>marcadas pagadas '+Pg.length+'</span>':'')+'</div>'
    +'<p class="z13-auto">Sale de su estado de cuenta y de la regla. Aquí marcas las pagadas y cambias la fecha de pago: es lo mismo que en Proveedores.</p></div>';
  const fila=x=>{ const id=esc4(x.id), w=_v3Wk(x.iso), est=x.pag?['ok','Pagada']:(w===0?['info','Esta semana']:['idle','Programada']);
    return '<tr class="'+(x.pag?'done':'')+'" data-id="'+id+'"><td class="ck"></td>'
      +'<td>'+(x.pag||x.partes?esc4(_z213Fd(x.iso)):'<input class="z-in" type="date" data-h="fxf" data-id="'+id+'" value="'+esc4(x.iso)+'" aria-label="Fecha de pago de la factura '+id+'">')+'</td>'
      +'<td class="z13-c">Factura '+id+'<span class="z13-nota">vence '+esc4(_z213Fd(x.vence))+(x.plan&&!x.pag?' · fecha a mano':'')+(x.partes?' · en partes (ver Proveedores)':'')+'</span></td>'
      +'<td class="n">'+(x.cop!=null?'COP '+_z213Cop(x.cop):'')+'</td><td class="n"><b>'+_z26m(x.usd)+'</b></td>'
      +'<td class="z13-e">'+_z26tag(est[0],est[1])+'</td>'
      +'<td class="n"><span class="z-acc">'+(x.pag?'<button type="button" class="z-btn sm q" data-h="fxp" data-on="0" data-id="'+id+'">Desmarcar</button>'
        :'<button type="button" class="z-btn sm" data-h="fxp" data-on="1" data-id="'+id+'">Pagada</button>')+'</span></td></tr>'; };
  let b='', wk=null;
  P.forEach(x=>{ const d=_p14D(x.iso), w=d?_p14Iso(_p14Lun(d)):'';
    if(w!==wk){ wk=w; const S=P.filter(y=>{ const dy=_p14D(y.iso); return (dy?_p14Iso(_p14Lun(dy)):'')===w; }).reduce((a,y)=>a+y.usd,0), i=w?_v3Wk(w):null;
      b+='<tr class="wk"><td></td><td colspan="3">'+(w?'Semana del '+_z213Fd(w)+(i===0?' · esta semana':''):'Sin fecha')+'</td><td class="n">'+_z26m(S)+'</td><td colspan="2"></td></tr>'; }
    b+=fila(x); });
  if(Pg.length) b+='<tr class="wk"><td></td><td colspan="3">Marcadas pagadas (no salen en la Caja)</td><td class="n">'+_z26m(Pg.reduce((a,x)=>a+x.usd,0))+'</td><td colspan="2"></td></tr>'+Pg.map(fila).join('');
  if(!X.length) b='<tr><td colspan="7" class="z13-vacio">Sin facturas. Carga su estado de cuenta.</td></tr>';
  return h+'<div class="z-wrap"><table class="z-t z13-t"><thead><tr><th class="ck"></th><th>Fecha de pago</th><th>Factura</th><th class="n">Monto</th><th class="n">US$</th><th>Estado</th><th></th></tr></thead><tbody>'+b+'</tbody></table></div>'
    +'<div class="z13-f"><span>Por pagar <b>'+_z26m(tot)+'</b></span><span class="z-sp"></span><span>Se guarda solo · todo tiene Deshacer</span></div>'; }
const _z213DetHTMLAntes2131=_z213DetHTML;
_z213DetHTML=function(c,r){ if(c&&c.tipo==='Regla'&&c.act==='base'&&(c.prov==='magnum'||c.prov==='tiba')) return _z2131FxHTML(c,r); return _z213DetHTMLAntes2131.apply(this,arguments); };
function _z2131FxPag(c,id,on){ const acre=c.prov; cxpPagada(acre,id,on);
  return _z27HechoFn((on?'Factura '+id+' pagada':'Factura '+id+' vuelve a por pagar')+' · igual en Proveedores y la Caja',()=>cxpPagada(acre,id,!on)); }
function _z2131FxFecha(c,id,val){ const acre=c.prov, antes=(CXPMIO[acre+':'+id]||{}).planFecha||'';
  if(!val||val===antes){ renderPlanes(); return; } cxpPlan(acre,id,val);
  return _z27HechoFn('Factura '+id+': se paga el '+_z213Fd(val)+' · igual en Proveedores y la Caja',()=>cxpPlan(acre,id,antes)); }

/* ---- clics y cambios nuevos ---- */
const _z213ClickAntes2131=_z213Click;
_z213Click=function(e,v){ const t=e.target.closest('[data-h]'); if(!t||!v.contains(t)) return; const h=t.dataset.h;
  if(h==='pag'||h==='desm'||h==='fxp'){ const c=_z213C(); if(!c) return;
    if(h==='pag'){ Z27.gen=null; Z27.pg={cp:c.id,id:t.dataset.id}; renderPlanes(); const i=v.querySelector('.z-reg input[data-yr="m"]'); if(i){ i.focus(); i.select(); } return; }
    if(h==='desm') return _z2131Desm(c,t.dataset.id);
    return _z2131FxPag(c,t.dataset.id,t.dataset.on==='1'); }
  return _z213ClickAntes2131.apply(this,arguments); };
const _z213ChangeAntes2131=_z213Change;
_z213Change=function(e,v){ const t=e.target;
  if(t&&t.dataset&&t.dataset.h==='fxf'&&v.contains(t)){ const c=_z213C(); if(c) _z2131FxFecha(c,t.dataset.id,t.value); return; }
  return _z213ChangeAntes2131.apply(this,arguments); };

/* ---- "Registrar abono" en el estado de cuenta: no repetir sin querer lo que ya se marcó (p. ej. desde Planes) ---- */
const _ecAbonoAntes2131=ecAbono;
ecAbono=function(c){ const args=arguments, self=this;
  try{ const g=id=>{ const n=document.getElementById(id); return n?n.value:''; }, mon=g('ecaMon')||'USD', monto=_ecNum(g('ecaMonto'),0), trm=_ecNum(g('ecaTrm'),0), fecha=g('ecaFecha')||_ecISO(TODAY);
    const usd=mon==='COP'?(trm>0?Math.round(monto/trm*100)/100:0):monto, y=usd>0?_zcDup(c,usd,fecha):null;
    if(y) return z26Dialogo({t:'¿Registrar otro abono igual?',x:'Ya hay un abono de US$ '+_ec2(+y.usd)+' de '+c+' del '+_p14F(_ecFecha(y.fecha))+(y.cuota?' (marcado desde Planes)':'')+'. Si es otro pago, regístralo; si es el mismo, no.',ok:'Registrar otro'})
      .then(ok=>{ if(ok) return _ecAbonoAntes2131.apply(self,args); });
  }catch(e){ console.warn('v2.13.1 abono',e); }
  return _ecAbonoAntes2131.apply(this,arguments); };
