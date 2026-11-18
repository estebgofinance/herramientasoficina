/* ===================================================================
   v2.9 · Excel de planes: pagos, cobros y precios en un solo archivo que se baja y se sube
   - Descargar (Planes › Descargar Excel): hojas Léeme, Pagos, Cobros y Precios. Cada fila trae un
     "Código (no tocar)" para saber qué cuota o pedido es.
   - Subir (Planes › Subir Excel o el botón "Cargar archivo"): muestra qué cambia y espera Aprobar.
     · Un plan que cambió queda como acuerdo nuevo vigente ("Excel dd-mmm"); el anterior pasa al historial.
       Las cuotas que ya existían conservan su identidad, así que lo pagado sigue con ellas.
     · Un plan automático (Magnum, TIBA, contrato de un cliente) que se cambia pasa a ser un plan propio.
     · Pagos: "Pagado US$" es el total pagado de la cuota; si sube, se registra la diferencia con su fecha y medio.
       Bajarlo no quita pagos (se avisa).
     · Cobros: "Nuevo cobro" registra un abono del cliente (no se repite si ya está).
     · Precios: el cálculo (flete, aduana, Zentrack, margen) o el precio escrito; factura; standby.
   - Todo con Deshacer (vuelve al estado de antes de aprobar). No hay llaves nuevas.
   =================================================================== */
var ZPX={prev:null};
const _ZPX_MARCA='Zentrack · Planes, cobros y precios';
const _zpxMed=s=>{ const t=(''+(s==null?'':s)).trim().toLowerCase(); if(!t) return ''; if(/fink/.test(t)) return 'finkargo'; if(/cruce/.test(t)) return 'cruce'; if(/banc/.test(t)) return 'banco'; return '?'; };
function _zpxSerial(iso){ const d=iso instanceof Date?iso:_p14D(iso); if(!d) return ''; return (Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(1899,11,30))/86400000; }
function _zpxFecha(v){ if(v==null||v==='') return '';
  if(typeof v==='number'){ if(v>20000&&v<80000){ const d=new Date(Math.round(v*86400000)+Date.UTC(1899,11,30)); return _p14Iso(new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())); } return '?'; }
  if(v instanceof Date&&!isNaN(v)) return _p14Iso(new Date(v.getFullYear(),v.getMonth(),v.getDate()));
  const F=_z27Fecha(''+v); return F&&!isNaN(F.d)?_p14Iso(F.d):'?'; }
function _zpxNum(v){ if(v==null||(''+v).trim()==='') return null; if(typeof v==='number') return v; const n=_z27Num(v); return isFinite(n)?n:NaN; }
const _zpxR=v=>v==null||v===''?'':_z27r2(v);

/* ---- armar el libro ---- */
function zpxLibro(){
  const wb=XLSX.utils.book_new(), C=_v3Cps(), Rg=_z27Reg(), R=_v3Real();
  const lee=[[_ZPX_MARCA],['Descargado el '+_p14F(TODAY)+'-'+TODAY.getFullYear()+' · versión '+((document.getElementById('verTag')||{}).textContent||'')],[],
    ['Cómo se usa'],
    ['1. Cambia fechas y montos. Para agregar una cuota, agrega una fila con el nombre exacto del proveedor o cliente (lista abajo) y deja vacío el Código.'],
    ['2. Para quitar una cuota, borra la fila. Un plan que cambie queda como acuerdo nuevo; el anterior queda en el historial.'],
    ['3. Pagos: en "Pagado US$" va el total pagado de esa cuota, con la fecha y el medio (Banco, Finkargo o Cruce).'],
    ['4. Cobros: en "Nuevo cobro" escribe lo que entró (fecha y US$). Se registra como abono del cliente.'],
    ['5. Precios: flete, aduana, Zentrack y margen calculan el precio provisional; o escribe el precio. Al facturar, llena número, fecha y valor de la factura. Standby: escribe "sí".'],
    ['6. No cambies la columna "Código (no tocar)".'],
    ['7. Sube el archivo con "Cargar archivo" o "Subir Excel" en Planes. Verás qué cambia antes de aprobar.'],[],
    ['Proveedores']].concat(C.filter(c=>c.dir==='p').map(c=>[c.n]),[[],['Clientes']],C.filter(c=>c.dir==='c').map(c=>[c.n]));
  const pag=[['Proveedor','Acuerdo','Fecha','Monto US$','Estado','Fecha de pago','Pagado US$','Medio','Nota','Código (no tocar)']];
  const cob=[['Cliente','Acuerdo','Fecha','Monto US$','Estado','Abonado US$','Nuevo cobro: fecha','Nuevo cobro: US$','Nota','Código (no tocar)']];
  C.forEach(c=>{ const V=_z27Vista(c), va=V.edit?((_v3Vers(c).find(v=>v.id===c.act)||{t:c.act}).t):'Automático · '+(c.baseT||''), cod=(c.dir==='p'?'p|':'c|')+c.id+'|';
    const nota=l=>(l.c&&!/^(china|magnum|nac)$/.test(l.c))?l.c:'';
    if(!V.L.length){ (c.dir==='p'?pag:cob).push(c.dir==='p'?[c.n,V.edit?'Sin cuotas':va,'','','Sin acuerdo','','','','',cod]:[c.n,V.edit?'Sin cuotas':va,'','','Sin acuerdo','','','','',cod]); return; }
    V.L.forEach(x=>{ const l=x.l;
      if(c.dir==='p'){ const G=Rg[l.id]||[], u=G.slice().reverse().find(r=>r.f||r.medio)||null, pg=V.edit?(+R[l.id]||0):0;
        pag.push([c.n,va,_zpxSerial(l.f),_z27r2(l.m),x.e.t,u&&u.f?_zpxSerial(u.f):'',pg>0.005?_z27r2(pg):'',u&&u.medio?_z27Med(u.medio):'',nota(l),cod+l.id]); }
      else cob.push([c.n,va,_zpxSerial(l.f),_z27r2(l.m),x.e.t,x.e.pag>0.005?_z27r2(x.e.pag):'','','',nota(l),cod+l.id]); }); });
  const pre=[['Cliente','Pedido','Proyecto','Equipo','Cant.','Estado','Costo China','Flete','Aduana','Zentrack','Margen %','Precio','Factura n.º','Fecha factura','Valor factura','Standby','Código (no tocar)']];
  const est={sin:'Sin precio',provisional:'Provisional',facturado:'Facturado',standby:'Standby'};
  EQ.filter(e=>cobroModo(e)!=='especial').slice().sort((a,b)=>(''+(a.cliente||'')).localeCompare(''+(b.cliente||''))||(''+(a.derrame||'')).localeCompare(''+(b.derrame||''),undefined,{numeric:true})).forEach(e=>{
    const r=_prReg(e)||{}, cc=r.calc||{}, f=r.fac||{}, s=prEstado(e);
    pre.push([e.cliente||'Por asignar',e.derrame||e.ordenId||'',e.proj||'',e.mfg==='Singsun'?'Tracker':'Shelter',+e.qty||1,est[s]+(s==='provisional'&&_prDespachado(e)?' · despachado':''),_z27r2(_pcCosto(e)),
      _zpxR(cc.flete),_zpxR(cc.aduana),_zpxR(cc.extra),cc.margen!=null?Math.round(cc.margen*1000)/10:'',precioVenta(e)>0?_z27r2(precioVenta(e)):'',f.num||'',f.fecha?_zpxSerial(f.fecha):'',f.valor?_z27r2(f.valor):'',s==='standby'?'sí':'','x|'+kOf(e)]); });
  const hoja=(rows,fechas,dinero,anchos)=>{ const ws=XLSX.utils.aoa_to_sheet(rows);
    for(let i=1;i<rows.length;i++){ fechas.forEach(j=>{ const a=XLSX.utils.encode_cell({r:i,c:j}); if(ws[a]&&ws[a].t==='n') ws[a].z='dd-mmm-yyyy'; });
      dinero.forEach(j=>{ const a=XLSX.utils.encode_cell({r:i,c:j}); if(ws[a]&&ws[a].t==='n') ws[a].z='#,##0.00'; }); }
    ws['!cols']=anchos.map(w=>({wch:w})); ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(1,rows.length-1),c:rows[0].length-1}})}; return ws; };
  const wl=XLSX.utils.aoa_to_sheet(lee); wl['!cols']=[{wch:120}];
  XLSX.utils.book_append_sheet(wb,wl,'Léeme');
  XLSX.utils.book_append_sheet(wb,hoja(pag,[2,5],[3,6],[26,30,13,14,22,13,14,10,26,34]),'Pagos');
  XLSX.utils.book_append_sheet(wb,hoja(cob,[2,6],[3,5,7],[26,30,13,14,22,13,14,14,26,34]),'Cobros');
  XLSX.utils.book_append_sheet(wb,hoja(pre,[13],[6,7,8,9,11,14],[20,12,34,9,6,22,13,11,11,11,10,13,13,13,13,9,30]),'Precios');
  return wb; }
function zpxDescargar(){ try{ XLSX.writeFile(zpxLibro(),'Zentrack_planes_'+_p14Iso(TODAY)+'.xlsx'); }catch(err){ console.warn(err); z26Aviso('No pude armar el Excel: '+(err&&err.message||err)); } }

/* ---- leer y comparar ---- */
function _zpxFilas(wb,nombre){ const ws=wb.Sheets[nombre]; if(!ws) return null; return XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:''}); }
function _zpxCol(H,n){ const t=n.toLowerCase(); return H.findIndex(h=>(''+h).trim().toLowerCase()===t); }
function _zpxPlanes(rows,dir,X){ if(!rows||!rows.length) return; const H=rows[0], hoja=dir==='p'?'Pagos':'Cobros';
  const iN=_zpxCol(H,dir==='p'?'Proveedor':'Cliente'), iF=_zpxCol(H,'Fecha'), iM=_zpxCol(H,'Monto US$'), iC=_zpxCol(H,'Código (no tocar)');
  const iFP=_zpxCol(H,'Fecha de pago'), iPg=_zpxCol(H,'Pagado US$'), iMe=_zpxCol(H,'Medio'), iNF=_zpxCol(H,'Nuevo cobro: fecha'), iNU=_zpxCol(H,'Nuevo cobro: US$');
  if(iF<0||iM<0||iC<0){ X.errores.push(hoja+': faltan columnas (Fecha, Monto US$ o Código). No se usa esta hoja.'); return; }
  const C=_v3Cps().filter(c=>c.dir===dir), G={}; C.forEach(c=>{ G[c.id]={c,filas:[]}; });
  rows.slice(1).forEach((r,k)=>{ const fila=k+2, cod=(''+(r[iC]||'')).trim(); let cpId=null, lid='';
    if(cod){ const ps=cod.split('|'); cpId=ps[1]; lid=ps.slice(2).join('|'); }
    else { const nom=(''+(iN>=0?r[iN]:'')).trim().toLowerCase(), c=C.find(x=>x.n.toLowerCase()===nom);
      if(!c){ if(nom||r[iF]!==''||r[iM]!=='') X.errores.push(hoja+' fila '+fila+': "'+(iN>=0?r[iN]:'')+'" no es un '+(dir==='p'?'proveedor':'cliente')+' de la herramienta.'); return; } cpId=c.id; }
    const g=G[cpId]; if(!g){ X.errores.push(hoja+' fila '+fila+': el código no corresponde a ningún '+(dir==='p'?'proveedor':'cliente')+'.'); return; }
    const f=_zpxFecha(r[iF]), m=_zpxNum(r[iM]);
    const x={fila,lid,f,m:m==null||isNaN(m)?m:_z27r2(m)};
    if(dir==='p'&&iPg>=0){ const pg=_zpxNum(r[iPg]); if(pg!=null){ if(isNaN(pg)) X.errores.push(hoja+' fila '+fila+': "Pagado US$" no es un número.'); else x.pago={m:pg,f:_zpxFecha(iFP>=0?r[iFP]:''),medio:_zpxMed(iMe>=0?r[iMe]:'')}; } }
    if(dir==='c'&&iNU>=0){ const u=_zpxNum(r[iNU]); if(u!=null){ if(isNaN(u)||u<=0) X.errores.push(hoja+' fila '+fila+': "Nuevo cobro: US$" no es un número.'); else X.cobros.push({c:g.c,usd:_z27r2(u),f:_zpxFecha(iNF>=0?r[iNF]:'')||_p14Iso(TODAY),fila}); } }
    if(!f&&(m==null)) return;                                  /* fila vacía o "sin cuotas" */
    if(f==='?'||!f||m==null||isNaN(m)||m<0){ X.errores.push(hoja+' fila '+fila+': falta la fecha o el monto, o no se entienden.'); return; }
    g.filas.push(x); });
  Object.values(G).forEach(({c,filas})=>{ const V=_z27Vista(c), cur=V.L.map(x=>({id:x.l.id,f:x.l.f,m:_z27r2(x.l.m),c:x.l.c})), ids=new Set(cur.map(o=>o.id)), usadas=new Set();
    filas.forEach(x=>{ if(x.lid&&!ids.has(x.lid)){ x.viejo=true; x.lid=''; }
      if(x.lid){ if(usadas.has(x.lid)) x.lid=''; else usadas.add(x.lid); } });
    /* una fila sin código que ya existe con la misma fecha y monto es esa cuota (subir dos veces no duplica) */
    filas.forEach(x=>{ if(x.lid) return; const o=cur.find(y=>!usadas.has(y.id)&&y.f===x.f&&Math.abs(y.m-x.m)<0.005); if(o){ x.lid=o.id; usadas.add(o.id); } });
    filas.forEach(x=>{ if(x.viejo&&!x.lid) X.avisos.push((dir==='p'?'Pagos':'Cobros')+' fila '+x.fila+': esa cuota ya no está en el plan vigente de '+c.n+'; entra como cuota nueva.'); });
    const mov=[], nue=[], bor=[]; filas.forEach(x=>{ if(!x.lid) nue.push(x); else { const o=cur.find(y=>y.id===x.lid); if(o.f!==x.f||Math.abs(o.m-x.m)>0.005) mov.push({o,x}); } });
    cur.forEach(o=>{ if(!usadas.has(o.id)) bor.push(o); });
    if(mov.length||nue.length||bor.length) X.planes.push({c,auto:!V.edit,filas,cur,mov,nue,bor});
    if(dir==='p') filas.forEach(x=>{ if(!x.pago) return; if(!V.edit&&!(mov.length||nue.length||bor.length)){ X.avisos.push('Pagos fila '+x.fila+': '+c.n+' es automático; lo pagado se ve cuando cargues su estado de cuenta.'); return; }
      const ya=x.lid?(+_v3Real()[x.lid]||0):0, d=_z27r2(x.pago.m-ya);
      if(d<-0.5){ X.avisos.push('Pagos fila '+x.fila+': el pagado de '+c.n+' bajó de '+fmtUSDs(ya)+' a '+fmtUSDs(x.pago.m)+'. Desde el Excel no se quitan pagos: hazlo en la herramienta.'); return; }
      if(d<=0.5) return; if(x.pago.f==='?'){ X.errores.push('Pagos fila '+x.fila+': no entiendo la fecha de pago.'); return; }
      if(x.pago.medio==='?'){ X.errores.push('Pagos fila '+x.fila+': el medio debe ser Banco, Finkargo o Cruce.'); return; }
      X.pagos.push({c,x,m:d,f:x.pago.f||_p14Iso(TODAY),medio:x.pago.medio||'banco',sinMedio:!x.pago.medio}); }); });
}
function _zpxPrecios(rows,X){ if(!rows||!rows.length) return; const H=rows[0], ix=n=>_zpxCol(H,n), iC=ix('Código (no tocar)'); if(iC<0){ X.errores.push('Precios: falta la columna Código.'); return; }
  const i={fl:ix('Flete'),ad:ix('Aduana'),ex:ix('Zentrack'),mg:ix('Margen %'),pr:ix('Precio'),fn:ix('Factura n.º'),ff:ix('Fecha factura'),fv:ix('Valor factura'),sb:ix('Standby')};
  const v=(r,j)=>j<0?'':r[j];
  rows.slice(1).forEach((r,k)=>{ const fila=k+2, cod=(''+(r[iC]||'')).trim(); if(!cod) return; const e=_prEq(cod.replace(/^x\|/,'')); if(!e){ X.avisos.push('Precios fila '+fila+': ese pedido ya no está en la herramienta.'); return; }
    const s=prEstado(e), r0=_prReg(e)||{}, c0=r0.calc||{}, d=_prDef(), n=j=>_zpxNum(v(r,j)), ch={e,fila};
    const sb=/^s[ií]?$/i.test((''+v(r,i.sb)).trim()); if(sb!==(s==='standby')) ch.standby=sb;
    const fv=n(i.fv), fnum=(''+v(r,i.fn)).trim(), ff=_zpxFecha(v(r,i.ff));
    if(fv!=null&&!isNaN(fv)&&fv>0){ const f0=r0.fac||{}; if(!f0.valor||Math.abs(f0.valor-fv)>0.005||(f0.num||'')!==fnum||(ff&&ff!=='?'&&f0.fecha!==ff)) ch.fac={num:fnum,fecha:ff&&ff!=='?'?ff:_p14Iso(TODAY),valor:_z27r2(fv)}; }
    const nums=[['flete',i.fl],['aduana',i.ad],['extra',i.ex]].map(([k2,j])=>[k2,n(j)]), mgx=n(i.mg);
    if(nums.some(([,x])=>x!=null&&isNaN(x))||(mgx!=null&&isNaN(mgx))){ X.errores.push('Precios fila '+fila+': flete, aduana, Zentrack o margen no son números.'); return; }
    const calc={}; nums.forEach(([k2,x])=>{ calc[k2]=x==null?0:x; }); calc.margen=mgx==null?(c0.margen!=null?c0.margen:d.margen):mgx/100;
    const habia=r0.calc!=null, escrito=nums.some(([,x])=>x!=null)||mgx!=null;
    const difCalc=escrito&&(!habia||['flete','aduana','extra'].some(k2=>Math.abs((+c0[k2]||0)-calc[k2])>0.005)||Math.abs((c0.margen!=null?c0.margen:d.margen)-calc.margen)>0.0005);
    const prx=n(i.pr);
    if(s!=='facturado'&&!ch.fac){ if(difCalc) ch.calc=Object.assign({mExtra:c0.mExtra!=null?c0.mExtra:d.mExtra},calc);
      else if(prx!=null&&!isNaN(prx)&&Math.abs(prx-precioVenta(e))>0.005) ch.precio=_z27r2(prx); }
    else if(s==='facturado'&&!ch.fac&&prx!=null&&!isNaN(prx)&&Math.abs(prx-precioVenta(e))>0.005) X.avisos.push('Precios fila '+fila+': '+(e.derrame||'')+' está facturado; su precio se cambia corrigiendo la factura.');
    if(ch.standby!=null||ch.fac||ch.calc||ch.precio!=null) X.precios.push(ch); }); }
function zpxComparar(wb){ const X={planes:[],pagos:[],cobros:[],precios:[],avisos:[],errores:[]};
  const L=_zpxFilas(wb,'Léeme'); if(!L||!L[0]||(''+L[0][0]).indexOf(_ZPX_MARCA)!==0) throw new Error('Este Excel no es el de planes de Zentrack (descárgalo desde Planes).');
  _zpxPlanes(_zpxFilas(wb,'Pagos'),'p',X); _zpxPlanes(_zpxFilas(wb,'Cobros'),'c',X); _zpxPrecios(_zpxFilas(wb,'Precios'),X);
  X.cobros=X.cobros.filter(o=>{ const dup=(ECA||[]).some(a=>a.cliente===o.c.n&&a.fecha===o.f&&Math.abs((+a.usd||0)-o.usd)<0.01&&!a.via);
    if(dup) X.avisos.push('Cobros fila '+o.fila+': ese cobro de '+o.c.n+' ('+fmtUSDs(o.usd)+' el '+_p14F(_p14D(o.f))+') ya está registrado; no se repite.'); return !dup; });
  X.n=X.planes.length+X.pagos.length+X.cobros.length+X.precios.length; return X; }

/* ---- aplicar ---- */
function _zpxCrear(c,P){ const p=_v3PlanDe(c), vid=_v3SigId(p), china=c.dir==='p'&&!!_V3PROV[c.prov], reusa=!P.auto;
  const L=P.filas.slice().sort((a,b)=>a.f<b.f?-1:(a.f>b.f?1:0));
  const v={id:vid,nombre:'Excel '+_p14F(TODAY),fecha:_p14Iso(TODAY),origen:'Excel',estado:'activo',lineas:L.map(x=>{ const o=x.lid?P.cur.find(y=>y.id===x.lid):null, d=_p14D(x.f), id=(reusa&&x.lid)?x.lid:_v3Nid(); x.nid=id;
    const dest=o&&o.c&&/^(china|magnum|nac)$/.test(o.c)?o.c:(china?'china':''); return {id,sem:d?_p14Iso(_p14Lun(d)):x.f,fecha:x.f,monto:_z27r2(x.m),dest}; })};
  p.versiones=p.versiones||[]; p.versiones.push(v); _z27Activar(c,vid); return v; }
function zpxAplicar(){ const X=ZPX.prev; if(!X||!X.n) return; const snap=serializeState(); let n=0;
  X.planes.forEach(P=>{ const c=_v3Cp(P.c.id); if(!c) return; _zpxCrear(c,P); n++; });
  X.pagos.forEach(o=>{ const c=_v3Cp(o.c.id), id=o.x.nid||o.x.lid; if(c&&id&&z27Pagar(c.id,id,{m:o.m,f:o.f,medio:o.medio,ref:'Excel'})) n++; });
  X.cobros.forEach(o=>{ if(z27Cobrar(o.c.id,{m:o.usd,f:o.f,nota:'Cobro (Excel)'})) n++; });
  X.precios.forEach(ch=>{ const e=_prEq(kOf(ch.e)); if(!e) return;
    if(ch.standby!=null) prStandby(e,ch.standby);
    if(ch.fac) prFacturar(e,ch.fac); else if(ch.calc) prCalcSet(e,ch.calc,'Excel'); else if(ch.precio!=null){ if(!(typeof gpDeEq==='function'&&gpDeEq(e))) _prPoner(e,ch.precio,'Excel'); }
    n++; });
  ZPX.prev=null; _zpxCerrar();
  _z27HechoFn('Excel aplicado: '+n+' cambio'+(n===1?'':'s'),()=>{ applyState(JSON.parse(snap)); try{ refreshAll(); }catch(e){} }); }

/* ---- la ventana "qué cambia" ---- */
function _zpxCerrar(){ const d=document.getElementById('zpxDlg'); if(d) d.remove(); }
function _zpxHTML(X){ const li=a=>'<ul>'+a.map(t=>'<li>'+t+'</li>').join('')+'</ul>', F=iso=>iso?_p14F(_p14D(iso)):'—';
  let h='';
  if(X.planes.length) h+='<h4>Planes ('+X.planes.length+')</h4>'+li(X.planes.map(P=>'<b>'+esc4(P.c.n)+'</b> · '+(P.auto?'pasa de automático a plan tuyo · ':'acuerdo nuevo · ')+[P.mov.length?P.mov.length+' cambiada'+(P.mov.length===1?'':'s'):'',P.nue.length?P.nue.length+' nueva'+(P.nue.length===1?'':'s'):'',P.bor.length?P.bor.length+' quitada'+(P.bor.length===1?'':'s'):''].filter(Boolean).join(', ')
    +'<small>'+P.mov.map(({o,x})=>F(o.f)+' '+fmtUSDs(o.m)+' → '+F(x.f)+' '+fmtUSDs(x.m)).concat(P.nue.map(x=>'+ '+F(x.f)+' '+fmtUSDs(x.m)),P.bor.map(o=>'− '+F(o.f)+' '+fmtUSDs(o.m))).slice(0,8).map(esc4).join(' · ')+'</small>'));
  if(X.pagos.length) h+='<h4>Pagos ('+X.pagos.length+')</h4>'+li(X.pagos.map(o=>'<b>'+esc4(o.c.n)+'</b> · cuota del '+F(o.x.f)+' · pagado '+fmtUSDs(o.m)+' el '+F(o.f)+' · '+esc4(_z27Med(o.medio))+(o.sinMedio?' <small>sin medio: queda Banco</small>':'')));
  if(X.cobros.length) h+='<h4>Cobros ('+X.cobros.length+')</h4>'+li(X.cobros.map(o=>'<b>'+esc4(o.c.n)+'</b> · abono de '+fmtUSDs(o.usd)+' el '+F(o.f)));
  if(X.precios.length) h+='<h4>Precios ('+X.precios.length+')</h4>'+li(X.precios.map(ch=>{ const e=ch.e, t=[];
    if(ch.standby!=null) t.push(ch.standby?'standby':'sale de standby');
    if(ch.fac) t.push('factura '+esc4(ch.fac.num||'s/n')+' · '+fmtUSDs(ch.fac.valor)+' (antes '+fmtUSDs(precioVenta(e))+')');
    else if(ch.calc) t.push('precio provisional '+fmtUSDs(precioVenta(e))+' → '+fmtUSDs(prCalc(e,ch.calc).precio)+' (cálculo)');
    else if(ch.precio!=null) t.push('precio provisional '+fmtUSDs(precioVenta(e))+' → '+fmtUSDs(ch.precio));
    return '<b>'+esc4(e.derrame||'')+'</b> '+esc4(e.proj||'')+' · '+t.join(' · '); }));
  if(X.avisos.length) h+='<h4 class="w">Avisos ('+X.avisos.length+')</h4>'+li(X.avisos.map(esc4));
  if(X.errores.length) h+='<h4 class="e">No se usan ('+X.errores.length+')</h4>'+li(X.errores.map(esc4));
  return h||'<p>El Excel no trae cambios frente a lo que hay en la herramienta.</p>'; }
function zpxPrevia(wb){ let X; try{ X=zpxComparar(wb); }catch(err){ console.warn(err); z26Dialogo({t:'No pude usar ese Excel',x:String(err&&err.message||err),ok:'Entendido'}); return null; }
  ZPX.prev=X; _zpxCerrar(); const s=document.createElement('div'); s.id='zpxDlg'; s.className='z-scrim';
  s.innerHTML='<div class="z-dlg zpx" role="dialog" aria-modal="true" aria-labelledby="zpxT"><h3 id="zpxT">Excel de planes · qué cambia</h3><div class="zpx-b">'+_zpxHTML(X)+'</div>'
    +'<div class="z-dlg-f"><button type="button" class="z-btn" data-zx="no">'+(X.n?'Cancelar':'Cerrar')+'</button>'+(X.n?'<button type="button" class="z-btn pri" data-zx="si">Aprobar '+X.n+' cambio'+(X.n===1?'':'s')+'</button>':'')+'</div></div>';
  s.addEventListener('click',e=>{ const b=e.target.closest('[data-zx]'); if(b){ if(b.dataset.zx==='si') zpxAplicar(); else { ZPX.prev=null; _zpxCerrar(); } } });
  document.body.appendChild(s); const f=s.querySelector('[data-zx="si"]')||s.querySelector('[data-zx="no"]'); if(f) f.focus(); return X; }
async function _zpxLibroDe(f){ if(!/\.xlsx?$/i.test((f&&f.name)||'')) return null;
  try{ const wb=XLSX.read(new Uint8Array(await f.arrayBuffer()),{type:'array'}), L=wb.Sheets['Léeme']; if(L&&L.A1&&(''+L.A1.v).indexOf(_ZPX_MARCA)===0) return wb; }catch(e){ console.warn(e); } return null; }
async function zpxSubir(inp){ const f=inp&&inp.files&&inp.files[0]; try{ inp.value=''; }catch(e){} if(!f) return; const wb=await _zpxLibroDe(f);
  if(!wb){ z26Dialogo({t:'Ese archivo no es el Excel de planes',x:'Descárgalo desde Planes › Descargar Excel, cámbialo y súbelo aquí.',ok:'Entendido'}); return; } zpxPrevia(wb); }
/* "Cargar archivo" también lo reconoce */
const _v2CargarAntes29=v2CargarArchivos;
v2CargarArchivos=async function(inp){ const fs=[...((inp&&inp.files)||[])], otros=[]; let wb=null;
  for(const f of fs){ const w=wb?null:await _zpxLibroDe(f); if(w) wb=w; else otros.push(f); }
  if(wb){ try{ inp.value=''; }catch(e){} zpxPrevia(wb); }
  if(otros.length||!wb) return _v2CargarAntes29.call(this,wb?{files:otros,value:''}:inp); return null; };
/* botones en Planes */
const _z26PlHTMLAntes29=_z26PlHTML;
_z26PlHTML=function(){ const h=_z26PlHTMLAntes29.apply(this,arguments), a='<div class="z-ph"><h2>Planes</h2>', k=h.indexOf(a); if(k<0) return h;
  const j=h.indexOf('</div>',k); return h.slice(0,j)+'<button type="button" class="z-btn" onclick="zpxDescargar()">Descargar Excel</button><label class="z-btn zpx-sub">Subir Excel<input type="file" accept=".xlsx" onchange="zpxSubir(this)" hidden></label>'+h.slice(j); };
