/* ===================================================================
   v2.9.3 · Plan de Enexa (solo trackers) y lo que necesita
   - Un acuerdo puede decir desde qué fecha cuenta los abonos (versión.desde): los abonos de antes ya están
     descontados en los saldos con que se armó el plan y no deben pagar sus cuotas.
   - Datos preparados PLANES_V: se copia "desde" a la versión.
   - Actualización preparada, paso "abono": puede ir a un pedido (ped) y no se repite si ya hay un abono
     parecido en un rango de fechas (dup: {desde, hasta, usd, cop}).
   - Standby también para líneas sueltas del estado de cuenta (ECX: el inversor de Enexa). Datos preparados
     PRECIOS acepta {ecx, cliente, standby}. En Clientes › Precios se ven y se reactivan.
   =================================================================== */
function _z293Ver(c){ const p=c&&(c.p||_v2Plan(c.id)); return p&&(p.versiones||[]).find(v=>v.id===c.act)||null; }
const _z27CobAntes293=_z27Cob;
_z27Cob=function(c){ const v=_z293Ver(c); if(!v||!v.desde) return _z27CobAntes293.apply(this,arguments);
  const vacio={map:{},ab:0,desde:null,abonos:[],sobra:0}; if(!c||c.dir!=='c'||c.act==='base') return vacio;
  const L=_v3Lin(c,c.act).filter(l=>!l.cump&&!l.sint&&l.m>0.005&&l.f).sort(_v3PorF); if(!L.length) return vacio;
  let desde=_p14Lun(_p14D(L[0].f)); const d2=_p14D(v.desde); if(d2&&d2>desde) desde=d2;
  const abonos=(ECA||[]).filter(a=>a.cliente===c.n&&!a.via).filter(a=>{ const d=_ecFecha(a.fecha); return d&&d>=desde; });
  let ab=abonos.reduce((s,a)=>s+(+a.usd||0),0); const tot=ab, map={};
  L.forEach(l=>{ const t=Math.min(l.m,ab); map[l.id]=t; ab-=t; });
  return {map,ab:tot,desde,abonos,sobra:ab}; };
const _pk24PlanAplicarAntes293=_pk24PlanAplicar;
_pk24PlanAplicar=function(x){ const r=_pk24PlanAplicarAntes293.apply(this,arguments);
  try{ if(x&&x.desde&&x.ref){ const c=_v3Cp(x.cp), p=c&&_v2Plan(c.id), v=p&&(p.versiones||[]).find(y=>y.ref===x.ref); if(v&&!v.desde) v.desde=x.desde; } }catch(e){ console.warn(e); }
  return r; };
/* paso "abono": a un pedido y sin repetir uno parecido */
_ztpAbono=function(paso){ const c=_v3Cp('cobro:'+paso.cliente); if(!c) throw new Error('no encuentro al cliente '+paso.cliente);
  const usd=_z27r2(paso.usd), A=(ECA||[]).filter(a=>!a.via&&a.cliente===paso.cliente);
  if(A.some(a=>a.fecha===paso.fecha&&Math.abs((+a.usd||0)-usd)<0.01)) return false;
  const D=paso.dup; if(D){ const R=A.filter(a=>a.fecha>=D.desde&&a.fecha<=D.hasta);
    /* ya está si: un abono con el mismo monto en pesos (el total o esta parte), uno solo por casi el total en dólares (±2%), o esta misma parte */
    if(R.some(a=>D.cop&&a.cop&&Math.abs(+a.cop-D.cop)<1)) return false;
    if(R.some(a=>paso.cop&&a.cop&&Math.abs(+a.cop-paso.cop)<1)) return false;
    if(D.usd&&R.some(a=>Math.abs((+a.usd||0)-D.usd)<=0.02*D.usd)) return false;
    if(R.some(a=>(a.nota||'')===(paso.nota||'')&&Math.abs((+a.usd||0)-usd)<0.01)) return false; }
  const e=paso.ped?EQ.find(x=>x.cliente===paso.cliente&&(x.derrame===paso.ped||x.ordenId===paso.ped)):null;
  const a={id:'eca'+((typeof _gidNuevo==='function')?_gidNuevo().replace(/^sp/,''):Date.now().toString(36)),cliente:c.n,fecha:paso.fecha,usd,cop:paso.cop||null,trm:paso.trm||null,nota:paso.nota||''};
  ecAbonoAplicar(c.n,a,e?kOf(e):null); ECA.push(a); return true; };
/* standby para líneas sueltas (ECX) */
function _z293Ecx(x){ const t=(''+(x.ecx||'')).trim().toLowerCase(); return (ECX||[]).find(r=>r.cliente===x.cliente&&!r.fink&&t&&[r.pedido,r.equipo,r.proyecto].some(s=>(''+(s||'')).toLowerCase().indexOf(t)>=0))||null; }
const _ecFilasAntes293=ecFilas;
ecFilas=function(c){ const r=_ecFilasAntes293.apply(this,arguments); r.filas=r.filas.filter(f=>!(f.tipo==='x'&&f.x&&f.x.standby)); return r; };
const _pr28TxtAntes293=_pr28Txt;
_pr28Txt=function(x,dd){ if(x&&x.ecx){ const r=_z293Ecx(x); if(!r) return 'Standby · "'+x.ecx+'" no está en el estado de cuenta de '+(x.cliente||'?')+': no se cambia';
  return 'Standby · '+(r.pedido||r.equipo||x.ecx)+' ('+x.cliente+'): sale del estado de cuenta'; } return _pr28TxtAntes293.apply(this,arguments); };
const _pr28AplicarAntes293=_pr28Aplicar;
_pr28Aplicar=function(x){ if(x&&x.ecx){ const r=_z293Ecx(x); if(r){ if(x.standby===false) delete r.standby; else r.standby=true; } return; } return _pr28AplicarAntes293.apply(this,arguments); };
/* en Clientes › Precios: las líneas sueltas en standby, con Reactivar */
const _prHTMLAntes293=_prHTML;
_prHTML=function(c){ let h=_prHTMLAntes293.apply(this,arguments); const X=(ECX||[]).filter(x=>x.cliente===c&&x.standby); if(!X.length) return h;
  const filas='<tr class="sec"><td colspan="6">Standby · líneas sueltas · '+X.length+'</td></tr>'+X.map(x=>'<tr class="pr28-standby"><td><b>'+esc4(x.pedido||'Línea')+'</b><small>'+esc4(x.equipo||'')+'</small></td><td class="w">'+esc4(x.proyecto||'')+'</td><td>'+_z26tag('idle','Standby')+'</td><td class="n">—</td><td class="n"><b>'+fmtUSDs(+x.valor||0)+'</b></td>'
    +'<td class="n"><span class="z-acc"><button type="button" class="z-btn sm" data-pax="'+esc4(x.id)+'">Reactivar</button></span></td></tr>').join('');
  if(!h) return '<details class="pr28" open><summary><b>Precios</b></summary><div class="z-wrap"><table class="z-t pr28-t"><tbody>'+filas+'</tbody></table></div></details>';
  const k=h.lastIndexOf('</tbody>'); return k<0?h:h.slice(0,k)+filas+h.slice(k); };
document.addEventListener('click',e=>{ const t=e.target.closest('[data-pax]'); if(!t) return; const x=(ECX||[]).find(r=>r.id===t.dataset.pax); if(!x) return;
  const antes=!!x.standby; delete x.standby; _z27HechoFn((x.pedido||'Línea')+' vuelve al estado de cuenta',()=>{ if(antes) x.standby=true; }); });
