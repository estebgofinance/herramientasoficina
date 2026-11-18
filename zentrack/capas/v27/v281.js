/* ===================================================================
   v2.8.1 · Actualización preparada: lo que Esteban aprueba se aplica solo al abrir la herramienta desplegada.
   - La carpeta de despliegue puede traer window.ZT_PENDIENTE = {id, titulo, resumen, pasos:[
       {tipo:'json', nombre, obj}                                  (datos preparados: se aplican como "Agregar datos preparados")
       {tipo:'excel', nombre, archivos:[{nombre, b64}]}            (detailed + ORDER REPORT: pasa por el asistente y se aprueba)
     ]}. Esos datos NO van en el repo (son del negocio): los pone Claude solo en la copia de despliegue.
   - Corre una sola vez, justo después de cargar el estado del servidor (nunca con el estado vacío ni si el
     servidor no respondió). Queda anotado en CONFIG.cambios['pendiente:'+id]. Todos los pasos se pueden repetir
     sin duplicar nada, así que si algo falla a mitad se reintenta la próxima vez que se abra.
   =================================================================== */
var ZTP={corre:false,ultimo:null};
function _ztpB64(b){ const s=atob(b), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; }
function _ztpEsperar(fn,ms){ return new Promise((res,rej)=>{ const t0=Date.now(); (function mira(){ let v=false; try{ v=fn(); }catch(e){} if(v) return res(v); if(Date.now()-t0>ms) return rej(new Error('el asistente no terminó de leer los archivos')); setTimeout(mira,150); })(); }); }
function _ztpLlave(P){ return 'pendiente:'+P.id; }
function _ztpLista(){ const P=window.ZT_PENDIENTE; return (Array.isArray(P)?P:(P?[P]:[])).filter(p=>p&&p.id); }
/* v2.9.2: un paso "abono" registra un cobro del cliente (no se repite si ya está con la misma fecha y monto) */
function _ztpAbono(paso){ const c=_v3Cp('cobro:'+paso.cliente); if(!c) throw new Error('no encuentro al cliente '+paso.cliente);
  const usd=_z27r2(paso.usd), dup=(ECA||[]).some(a=>!a.via&&a.cliente===paso.cliente&&a.fecha===paso.fecha&&Math.abs((+a.usd||0)-usd)<0.01);
  if(!dup) z27Cobrar(c.id,{m:usd,f:paso.fecha,cop:paso.cop||null,trm:paso.trm||null,nota:paso.nota||''}); return !dup; }
async function _ztpUno(P,hecho){
  for(const paso of (P.pasos||[])){
    if(paso.tipo==='json'){ PKPREV=Object.assign(pkLeer(paso.obj),{archivo:paso.nombre}); pkAplicar(); hecho.push(paso.nombre); }
    else if(paso.tipo==='abono'){ _ztpAbono(paso); hecho.push(paso.nombre); }
    else if(paso.tipo==='excel'){
      const files=(paso.archivos||[]).map(a=>new File([_ztpB64(a.b64)],a.nombre,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      WIZ.loaded=false; WIZ.work=null; WIZ.err=null; await v2CargarArchivos({files});
      await _ztpEsperar(()=>WIZ&&(WIZ.err||(WIZ.loaded&&WIZ.work&&WIZ.work.length)),90000);
      if(WIZ.err) throw new Error(WIZ.err);
      wizGo(2); wizGo(3); wizGo(4); wizApprove(); await new Promise(r=>setTimeout(r,700)); hecho.push(paso.nombre); }
  }
  CONFIG.cambios[_ztpLlave(P)]={f:new Date().toISOString(),titulo:P.titulo||'',pasos:hecho.slice()}; }
async function ztPendiente(){
  if(ZTP.corre) return null; const L=_ztpLista(); if(!L.length) return null;
  CONFIG.cambios=CONFIG.cambios||{}; const faltan=L.filter(P=>!CONFIG.cambios[_ztpLlave(P)]); if(!faltan.length||!EQ.length) return null;
  ZTP.corre=true; const hecho=[], listos=[];
  try{
    if(typeof toast==='function') toast('Aplicando la actualización preparada…');
    for(const P of faltan){ await _ztpUno(P,hecho); listos.push(P); }
    ZTP.ultimo={ok:true,hecho}; guardar4(); try{ refreshAll(); }catch(e){ console.warn(e); }
    z26Dialogo(listos.length===1?{t:listos[0].titulo||'Actualización aplicada',x:(listos[0].resumen||'')+' Ya quedó guardado.',ok:'Listo'}
      :{t:'Actualizaciones aplicadas ('+listos.length+')',x:listos.map(P=>(P.titulo||'')+': '+(P.resumen||'')).join(' · ')+' Ya quedó guardado.',ok:'Listo'});
  }catch(err){ console.warn('actualización preparada',err); ZTP.ultimo={ok:false,hecho,err:String(err&&err.message||err)};
    guardar4(); z26Dialogo({t:'La actualización preparada no terminó',x:'Se aplicó: '+(hecho.join(', ')||'nada')+'. Falló: '+(err&&err.message||err)+'. Nada se duplica: se reintenta la próxima vez que abras la herramienta. Avísale a Claude.',ok:'Entendido'}); }
  finally{ ZTP.corre=false; }
  return hecho; }
/* solo después de leer el estado del servidor (loadFromServer → applyState) */
const _appAntesZtp=applyState;
applyState=function(){ const r=_appAntesZtp.apply(this,arguments);
  if(typeof google!=='undefined'&&google.script){ ZTP.estado=true; setTimeout(()=>{ if(window.ZT_PENDIENTE) ztPendiente(); },1500); }
  return r; };
/* el paquete puede terminar de llegar después del estado: entonces se aplica al llegar */
function _ztpAlLlegar(){ if(ZTP.estado) setTimeout(()=>{ ztPendiente(); },800); }
