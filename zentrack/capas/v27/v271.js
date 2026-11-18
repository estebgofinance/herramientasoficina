/* ===================================================================
   v2.7.1 · Solenium sin cobros dobles (radiografía del 11-nov-2026)
   - Componentes de un pedido (Jingwei, Wenzhong, Restar, Qiyuan) van con su fabricante: el tracker
     es un solo costo (Nexus + componentes). "Componentes" deja de ser un proveedor aparte (si no
     tiene plan propio guardado).
   - Préstamo de Finkargo que asume un cliente: el cargo completo se queda en su estado de cuenta y
     el capital que Finkargo le giró a China se le abona ("Pagado por Finkargo"), al más vencido
     primero y sin tocar el cargo de Finkargo. Ese abono (ECA con via:'finkargo') no es plata que
     entra: no cuenta en la Caja, en lo recibido ni en las promesas.
   - Sankey: lo que Finkargo paga directo a China se resta del pago a China (ver _z27SkCalc).
   =================================================================== */
const _cjPagosAntes271=cjPagos;
cjPagos=function(){ return _cjPagosAntes271.apply(this,arguments).map(p=>(p&&p.tipo==='otros'&&p.quien==='Proveedores de componentes')
  ?Object.assign({},p,{quien:(p.e&&p.e.mfg==='Eaglerise')?'Eaglerise':'Nexus (Singsun)'}):p); };
const _v3CpsAntes271=_v3Cps;
_v3Cps=function(){ return _v3CpsAntes271.apply(this,arguments).filter(c=>c.id!=='pago:comp'||(c.deudas||[]).length>0
  ||_v3Lin(c,'a').some(l=>l.m>0.005)||((c.p&&c.p.versiones)||[]).length>0); };
/* lo recibido de un cliente no incluye lo que pagó Finkargo por él */
_v2Recibido=function(c){ const g={}; (ECA||[]).filter(a=>a.cliente===c&&!a.via).forEach(a=>{ const d=_ecFecha(a.fecha); if(!d) return; const k=_p14Iso(_p14Lun(d)); g[k]=(g[k]||0)+(+a.usd||0); }); return g; };
_v3RecSem=function(c){ const L0=_v3L0(), fin=addD(L0,7); return (ECA||[]).filter(a=>a.cliente===c&&!a.via).filter(a=>{ const d=_ecFecha(a.fecha); return d&&d>=L0&&d<fin; }).reduce((s,a)=>s+(+a.usd||0),0); };
/* el capital de Finkargo se le abona al cliente que asume el préstamo */
function _fk271EsCargo(k){ const x=(ECX||[]).find(r=>r.id===k); return !!(x&&(x.fink||x.tipo==='cargo')); }
function _fk271Aplicar(c,a){ let resto=_r2(a.usd); a.aplicado=[];
  _ecUnidades(c).filter(u=>!_fk271EsCargo(u.k)).forEach(u=>{ if(resto<=0.005) return; const m=Math.min(resto,_r2(u.saldo)); if(m<=0.005) return;
    _ecSumar(u.k,u.i,m); a.aplicado.push({k:u.k,i:u.i,monto:m}); resto=_r2(resto-m); });
  if(resto>0.005){ const ult=a.aplicado[a.aplicado.length-1]||(()=>{ const f=ecFilas(c).filas.find(x=>x.tipo==='eq'); return f?{k:f.k,i:f.cuotas?0:-1}:null; })();
    if(ult){ _ecSumar(ult.k,ult.i,resto); a.aplicado.push({k:ult.k,i:ult.i,monto:resto}); } }
  return a; }
function _fk271Abonos(){ const ops=(FINK&&FINK.ops)||[]; let n=0;
  (ECA||[]).filter(a=>a.via==='finkargo').forEach(a=>{ const op=ops.find(o=>o.id===a.fink);
    if(op&&op.asume&&op.asume===a.cliente&&Math.abs(_r2(op.capital)-_r2(a.usd))<0.005) return;
    (a.aplicado||[]).forEach(p=>_ecSumar(p.k,p.i,-p.monto)); ECA=ECA.filter(x=>x!==a); n++; });
  ops.forEach(op=>{ if(!op.asume||!(+op.capital>0.005)||(ECA||[]).some(a=>a.via==='finkargo'&&a.fink===op.id)) return;
    if(!_ecClientes().includes(op.asume)&&!EQ.some(e=>e.cliente===op.asume)) return;
    const a={id:'ecafk'+op.id,cliente:op.asume,fecha:op.fecha||_ecISO(TODAY),usd:_r2(op.capital),cop:null,trm:null,
      nota:'Pagado por Finkargo a China · préstamo '+(op.orden||''),fink:op.id,via:'finkargo'};
    _fk271Aplicar(op.asume,a); ECA.push(a); n++; });
  return n; }
const _fkSyncAntes271=fkSync;
fkSync=function(){ const r=_fkSyncAntes271.apply(this,arguments); try{ _fk271Abonos(); }catch(e){ console.warn('v2.7.1 finkargo',e); } return r; };
const _appAntes271=applyState;
applyState=function(){ const r=_appAntes271.apply(this,arguments); try{ _fk271Abonos(); }catch(e){ console.warn('v2.7.1 finkargo',e); } return r; };
/* "Deshacer" de ese abono no aplica: se quita quitando el préstamo o a quién lo asume */
const _ecAbonoDeshacerAntes271=ecAbonoDeshacer;
ecAbonoDeshacer=function(id){ const a=(ECA||[]).find(x=>x.id===id); if(a&&a.via==='finkargo'){ toast('Este abono sale del préstamo de Finkargo: se quita en Proveedores › Finkargo'); return; } return _ecAbonoDeshacerAntes271.apply(this,arguments); };
