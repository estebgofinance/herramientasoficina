/* ===================================================================
   v2.10 · Necesidad de efectivo en el estado de cuenta de Solenium, y TRM oficial
   - Llave nueva TRMOF = {'AAAA-MM-DD': {v, f:'oficial'|'mano', desde, hasta}}: la TRM oficial de la
     Superfinanciera (datos.gov.co) por fecha. Al abrir la herramienta con el estado del servidor se trae la
     del día; si no hay conexión queda la última guardada. _p16TrmFuente la usa antes que el saldo de bancos,
     el último abono o Ajustes (lo viejo, como 3,160 o 4,050, ya no convierte nada si hay una oficial).
   - Al bajar el PDF o el Excel del estado de cuenta de un cliente del grupo, un diálogo pregunta qué semana va
     en la hoja "Necesidad de efectivo": esta semana (para enviar el lunes), la siguiente (para enviar el
     viernes) o ninguna, y con qué TRM. ecPDF(c,null) / ecExcel(c,null) bajan sin hoja y sin diálogo.
   - La hoja: toda la caja de la semana (China, Magnum, TIBA, Finkargo y otros, nómina y fijos, impuestos)
     menos lo que entra de otros clientes = necesidad; menos lo que el cliente ya giró esa semana = por girar;
     y cómo se abona en su estado de cuenta: lo vencido, lo que vence hasta el domingo, y lo que queda a favor.
   - Los pedidos en standby (frenados) ya no se programan para girar a China en el flujo; la deuda sigue en Proveedores.
   - No guarda nada del documento (solo la TRM usada).
   =================================================================== */
var TRMOF={};
const _serAntes210=serializeState;
serializeState=function(){ const o=JSON.parse(_serAntes210.apply(this,arguments)); o.TRMOF=TRMOF; return JSON.stringify(o); };
const _appAntes210=applyState;
applyState=function(s){ const r=_appAntes210.apply(this,arguments);
  TRMOF=(s&&s.TRMOF&&typeof s.TRMOF==='object'&&!Array.isArray(s.TRMOF))?s.TRMOF:{};
  if(typeof google!=='undefined'&&google.script) setTimeout(()=>{ _neTrmTraer().then(o=>{ if(o&&o._nueva) _neRepintar(); }).catch(()=>{}); },2500);
  return r; };
function _neRepintar(){ const a=document.activeElement; if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return; try{ refreshAll(); }catch(e){} }
/* la TRM guardada vigente en una fecha (la más reciente con fecha <= iso) */
function _neTrmDe(iso){ const T=TRMOF||{}, ks=Object.keys(T).filter(k=>k<=iso&&T[k]&&+T[k].v>1000).sort(); const k=ks[ks.length-1];
  return k?Object.assign({fecha:k},T[k]):null; }
/* trae la TRM oficial vigente hoy de datos.gov.co (Superfinanciera) */
function _neTrmTraer(){ const hoy=_p14Iso(TODAY), ya=TRMOF[hoy];
  if(ya&&ya.f==='oficial') return Promise.resolve(Object.assign({fecha:hoy},ya));
  if(typeof fetch!=='function') return Promise.reject(new Error('sin conexión'));
  const ctl=typeof AbortController==='function'?new AbortController():null, to=setTimeout(()=>{ if(ctl) ctl.abort(); },8000);
  return fetch('https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=10',ctl?{signal:ctl.signal}:{})
    .then(r=>r.json()).then(L=>{ clearTimeout(to);
      const x=(Array.isArray(L)?L:[]).find(y=>(''+y.vigenciadesde).slice(0,10)<=hoy&&(''+y.vigenciahasta).slice(0,10)>=hoy);
      if(!x||!(+x.valor>1000)) throw new Error('no hay TRM oficial publicada para hoy');
      const o={v:Math.round(+x.valor*100)/100,f:'oficial',desde:(''+x.vigenciadesde).slice(0,10),hasta:(''+x.vigenciahasta).slice(0,10)};
      const antes=TRMOF[hoy]; TRMOF[hoy]=o; const nueva=!antes||antes.v!==o.v||antes.f!==o.f; if(nueva) guardar4();
      return Object.assign({fecha:hoy,_nueva:nueva},o); })
    .catch(e=>{ clearTimeout(to); throw e; }); }
const _p16TrmFuenteAntes210=_p16TrmFuente;
_p16TrmFuente=function(){ const t=_neTrmDe(_p14Iso(TODAY));
  if(t) return {trm:t.v,de:(t.f==='oficial'?'oficial ':'escrita ')+_p14F(_p14D(t.fecha))};
  return _p16TrmFuenteAntes210.apply(this,arguments); };

/* lo que está en standby (pedido frenado) no se gira a China: sale del flujo (Caja, Tablero, sankey, la hoja);
   la deuda sigue en Proveedores */
const _p14CalcAntes210=p14Calc;
p14Calc=function(){ const sPg=cjPagos;
  cjPagos=function(){ return sPg.apply(this,arguments).filter(p=>!(p&&p.e&&p.e.mfg&&p.tipo!=='otros'&&p.tipo!=='tercero'&&typeof prEstado==='function'&&prEstado(p.e)==='standby')); };
  try{ return _p14CalcAntes210.apply(this,arguments); } finally { cjPagos=sPg; } };

/* ---- los datos de la hoja ---- */
const _NE_G=[['china','Proveedores en China'],['mag','Magnum · logística y aduana'],['tiba','TIBA · transporte'],['otros','Finkargo y otros cargos'],['fij','Nómina y gastos fijos'],['imp','Impuestos']];
const _NE_COP={mag:1,tiba:1,fij:1,imp:1};
const _neR2=n=>Math.round((+n||0)*100)/100;
function _neD(d){ if(!d) return null; const x=d instanceof Date?d:new Date(d); return isNaN(x)?null:x; }
function neDatos(c,w,trm){
  w=w===1?1:0; const L=addD(_v3L0(),7*w), fin=addD(L,6), Li=_p14Iso(L), Fi=_p14Iso(fin);
  const fu=_p16TrmFuente; let X;
  try{ if(+trm>1000) _p16TrmFuente=function(){ return {trm:+trm,de:'hoja'}; }; X=p14Calc('pago'); } finally { _p16TrmFuente=fu; }
  const T=X.trm||trm, R=X.R;
  const item=(k,it)=>{ let txt=''+(it.txt||''); const pag=/^Ya salió · /.test(txt), rec=/^Ya entró · /.test(txt);
    const cop=_NE_COP[k]&&/COP/.test(txt)?Math.round((+it.usd||0)*T):null;
    txt=txt.replace(/^Ya (salió|entró) · /,'').replace(/^Tu giro a /,'Giro a ').replace(/ \(plan\)$/,' · plan de pagos');
    if(!/^4x1000/.test(txt)) txt=txt.replace(/ · COP [\d,.]+$/,'');
    return {txt,fecha:_neD(it.d),cop,usd:_neR2(it.usd),pag,rec}; };
  const G=_NE_G.map(([k,nom])=>{ const it=((R[k]&&R[k].it&&R[k].it[w])||[]).filter(x=>Math.abs(+x.usd||0)>0.005).map(x=>item(k,x));
    return {k,nom,items:it,usd:_neR2(it.reduce((s,x)=>s+x.usd,0)),cop:it.some(x=>x.cop!=null)?it.reduce((s,x)=>s+(x.cop||0),0):null}; }).filter(g=>g.items.length);
  const egr=_neR2(G.reduce((s,g)=>s+g.usd,0));
  const ext=((R.ext&&R.ext.it&&R.ext.it[w])||[]).filter(x=>Math.abs(+x.usd||0)>0.005).map(x=>item('ext',x)), ing=_neR2(ext.reduce((s,x)=>s+x.usd,0));
  const ya=_neR2(((R.sole&&R.sole.it&&R.sole.it[w])||[]).filter(x=>(''+x.txt).indexOf('Ya entró · '+c+' · ')===0).reduce((s,x)=>s+(+x.usd||0),0));
  const nec=_neR2(egr-ing), falta=_neR2(Math.max(0,nec-ya));
  let plan=0; try{ const cp=_v3Cp('cobro:'+c); if(cp) plan=_neR2(_v3Act(cp).filter(l=>l.f&&l.f>=Li&&l.f<=Fi).reduce((s,l)=>s+(+l.m||0),0)); }catch(e){}
  const t=ecTotales(c); let S=0; const hoy=TODAY;
  ecFilas(c).filas.forEach(f=>{ (f.cuotas||[{saldo:f.saldo,vence:f.vence}]).forEach(q=>{ if(q.saldo>0.005&&q.vence&&q.vence>=hoy&&q.vence<=fin) S+=q.saldo; }); });
  const V=_neR2(t.vencido); S=_neR2(S); const aV=_neR2(Math.min(falta,V)), aS=_neR2(Math.min(falta-aV,S)), fav=_neR2(Math.max(0,falta-aV-aS));
  const tf=_neTrmDe(_p14Iso(TODAY));
  return {c,w,L,fin,trm:{v:T,f:(tf&&Math.abs(tf.v-T)<0.005)?tf.f:'mano',fecha:tf&&Math.abs(tf.v-T)<0.005?tf.fecha:_p14Iso(TODAY),desde:tf&&tf.desde,hasta:tf&&tf.hasta},
    G,egr,ext,ing,nec,ya,falta,plan,ec:{V,S,aV,aS,fav,saldo:_neR2(t.saldo)}};
}

/* ---- textos ---- */
const _NE_M=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const _NE_MC=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function _neSemTxt(L,F){ const a=L.getDate(), b=F.getDate();
  if(L.getMonth()===F.getMonth()) return 'Semana del '+a+' al '+b+' de '+_NE_M[F.getMonth()]+' de '+F.getFullYear();
  return 'Semana del '+a+' de '+_NE_M[L.getMonth()]+(L.getFullYear()!==F.getFullYear()?' de '+L.getFullYear():'')+' al '+b+' de '+_NE_M[F.getMonth()]+' de '+F.getFullYear(); }
function _neCorto(L,F){ return L.getDate()+(L.getMonth()!==F.getMonth()?' '+_NE_MC[L.getMonth()]:'')+'–'+F.getDate()+' '+_NE_MC[F.getMonth()]; }
const _neFc=d=>d?String(d.getDate()).padStart(2,'0')+'-'+_NE_MC[d.getMonth()]+'-'+String(d.getFullYear()).slice(2):'—';
function _neTrmTxt(t){ return 'TRM '+_ec2(t.v)+(t.f==='oficial'?' oficial'+(t.desde?' (vigente '+(t.desde===t.hasta?_neFc(_p14D(t.desde)):_neFc(_p14D(t.desde))+' al '+_neFc(_p14D(t.hasta)))+')':''):' escrita a mano el '+_neFc(_p14D(t.fecha))); }

/* ---- la hoja en el PDF ---- */
const _NE_CSS='.ne{break-before:page;page-break-before:always}.ne .res{grid-template-columns:repeat(5,1fr)}.ne .box .v.ok{color:#2E6E5A}'
  +'.ne table td.cop{color:#7A4E0B}.ne tr.gr td{font-weight:600;background:#F4F5F6;border-bottom:1px solid #CDD1D6}.ne tr.tt td{font-weight:700;border-top:1.5px solid #17181A;border-bottom:0}'
  +'.ne .es.pg{color:#2E6E5A}.ne .ab td:first-child{padding-left:16px}.ne .ab td.r b{font-weight:700}.ne td:nth-child(2),.ne td:nth-child(5){white-space:nowrap}.ne td:nth-child(3){white-space:nowrap}';
function _neHTML(ne){ const H=x=>esc4(x==null?'':x), n2=v=>Math.abs(v)<0.005?'—':_ec2(v), nc=v=>v==null?'—':fmtUSDs(v);
  const fila=(x,ent)=>'<tr><td>'+H(x.txt)+'</td><td>'+(x.fecha?_neFc(x.fecha):'—')+'</td><td class="r cop">'+nc(x.cop)+'</td><td class="r">'+n2(x.usd)+'</td><td>'
    +(ent?(x.rec?'<span class="es pg">Recibido</span>':'<span class="es">Esperada</span>'):(x.pag?'<span class="es pg">Pagado</span>':'<span class="es">Por pagar</span>'))+'</td></tr>';
  const tCop=ne.G.reduce((s,g)=>s+(g.cop||0),0);
  return '<section class="ne"><div class="cab"><div class="marca"><i></i>ZENTRACK S.A.S</div><div class="der"><h1>Necesidad de efectivo</h1><div class="cli">'+H(ne.c)+'</div><small>'
    +H(_neSemTxt(ne.L,ne.fin))+' · '+H(_neTrmTxt(ne.trm))+' · cifras en dólares (USD)</small></div></div>'
    +'<div class="res"><div class="box"><div class="l">Pagos de la semana</div><div class="v">'+_ec2(ne.egr)+'</div><small>toda la caja de Zentrack</small></div>'
    +'<div class="box"><div class="l">Entradas de otros clientes</div><div class="v">'+_ec2(ne.ing)+'</div><small>esperadas en la semana</small></div>'
    +'<div class="box n"><div class="l">Necesidad de la semana</div><div class="v">'+_ec2(ne.nec)+'</div><small>pagos − entradas</small></div>'
    +'<div class="box"><div class="l">Ya girado por '+H(ne.c)+'</div><div class="v ok">'+_ec2(ne.ya)+'</div><small>abonos de esta semana</small></div>'
    +'<div class="box"><div class="l">Por girar</div><div class="v'+(ne.falta>0.005?' mal':'')+'">'+_ec2(ne.falta)+'</div><small>hasta el '+_neFc(ne.fin)+'</small></div></div>'
    +'<section class="grupo"><div class="gh"><h2>Pagos de la semana</h2><span>'+ne.G.reduce((s,g)=>s+g.items.length,0)+' pagos · US$ <b>'+_ec2(ne.egr)+'</b></span></div>'
    +'<table><thead><tr><th>Concepto</th><th>Fecha</th><th class="r">COP</th><th class="r">US$</th><th>Estado</th></tr></thead><tbody>'
    +(ne.G.length?ne.G.map(g=>'<tr class="gr"><td colspan="2">'+H(g.nom)+'</td><td class="r cop">'+nc(g.cop)+'</td><td class="r">'+n2(g.usd)+'</td><td></td></tr>'+g.items.map(x=>fila(x,false)).join('')).join('')
      :'<tr><td colspan="5">Sin pagos en la semana.</td></tr>')
    +'<tr class="tt"><td colspan="2">Total pagos de la semana</td><td class="r cop">'+nc(tCop||null)+'</td><td class="r">'+_ec2(ne.egr)+'</td><td></td></tr></tbody></table></section>'
    +'<section class="grupo"><div class="gh"><h2>Entradas de otros clientes</h2><span>US$ <b>'+_ec2(ne.ing)+'</b></span></div>'
    +'<table><thead><tr><th>Concepto</th><th>Fecha</th><th class="r">COP</th><th class="r">US$</th><th>Estado</th></tr></thead><tbody>'
    +(ne.ext.length?ne.ext.map(x=>fila(x,true)).join(''):'<tr><td colspan="5">Ninguna esperada en la semana.</td></tr>')
    +'<tr class="tt"><td colspan="3">Total entradas</td><td class="r">'+_ec2(ne.ing)+'</td><td></td></tr></tbody></table></section>'
    +'<section class="grupo"><div class="gh"><h2>Cómo se abona en el estado de cuenta</h2><span>saldo pendiente US$ <b>'+_ec2(ne.ec.saldo)+'</b></span></div>'
    +'<table><thead><tr><th>Concepto</th><th class="r">Base</th><th class="r">Se abona</th></tr></thead><tbody>'
    +'<tr><td><b>Por girar</b></td><td class="r"></td><td class="r"><b>'+_ec2(ne.falta)+'</b></td></tr>'
    +'<tr class="ab"><td>A lo vencido</td><td class="r">'+n2(ne.ec.V)+'</td><td class="r">'+n2(ne.ec.aV)+'</td></tr>'
    +'<tr class="ab"><td>A lo que vence hasta el '+_neFc(ne.fin)+'</td><td class="r">'+n2(ne.ec.S)+'</td><td class="r">'+n2(ne.ec.aS)+'</td></tr>'
    +'<tr class="ab"><td>Queda a favor de '+H(ne.c)+'</td><td class="r"></td><td class="r">'+n2(ne.ec.fav)+'</td></tr>'
    +'<tr class="tt"><td>Plan de cobro acordado para la semana</td><td class="r"></td><td class="r">'+n2(ne.plan)+'</td></tr></tbody></table></section>'
    +'<p class="nota">Lo que gire '+H(ne.c)+' se registra como abono en su estado de cuenta, primero a lo más vencido. Los pesos se convierten con la '+H(_neTrmTxt(ne.trm))+'.</p></section>'; }
const _ecPdfHTMLAntes210=_ecPdfHTML;
_ecPdfHTML=function(c,ne){ let h=_ecPdfHTMLAntes210.call(this,c); if(!ne) return h;
  return h.replace('</style></head>',_NE_CSS+'</style></head>').replace(/<\/body><\/html>$/,_neHTML(ne)+'</body></html>'); };

/* ---- la hoja en el Excel ---- */
function _neHoja(wb,ne){
  const NEGRO='FF17181A', GRIS='FF565B61', CLARO='FFF4F5F6', LINEA='FFE4E6E9', ROJO='FFB3261E', VERDE='FF2E6E5A', NARANJA='FFFD9C10', CAFE='FF7A4E0B';
  const NUM='#,##0.00;[Red]-#,##0.00;"—"', COPF='#,##0;[Red]-#,##0;"—"', FECHA='dd-mmm-yy';
  const dt=d=>d?new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())):null;
  const ws=wb.addWorksheet('Necesidad de efectivo',{views:[{showGridLines:false}],pageSetup:{fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:1}});
  ws.columns=[{width:62},{width:12},{width:17},{width:15},{width:13}];
  const pinta=(row,o)=>{ for(let i=1;i<=5;i++){ const cl=row.getCell(i); cl.font=Object.assign({name:'Arial',size:10},o.font||{}); if(o.fill) cl.fill={type:'pattern',pattern:'solid',fgColor:{argb:o.fill}}; if(o.borde) cl.border={bottom:{style:'thin',color:{argb:o.borde}}}; } };
  ws.getCell('A1').value='ZENTRACK S.A.S'; ws.getCell('A1').font={name:'Arial',size:11,bold:true,color:{argb:NARANJA}};
  ws.getCell('A2').value='Necesidad de efectivo · '+ne.c; ws.getCell('A2').font={name:'Arial',size:16,bold:true,color:{argb:NEGRO}};
  ws.getCell('A3').value=_neSemTxt(ne.L,ne.fin)+' · '+_neTrmTxt(ne.trm)+' · cifras en dólares (USD)'; ws.getCell('A3').font={name:'Arial',size:10,color:{argb:GRIS}};
  let r=5; const kp=[['Pagos de la semana',ne.egr],['Entradas de otros clientes',ne.ing],['Necesidad de la semana',ne.nec],['Ya girado por '+ne.c,ne.ya],['Por girar',ne.falta]], kr={};
  kp.forEach(([l,v])=>{ const row=ws.getRow(r); kr[l]=r; row.getCell(1).value=l; row.getCell(1).font={name:'Arial',size:10,color:{argb:GRIS}};
    const cl=row.getCell(4); cl.numFmt=NUM; cl.font={name:'Arial',size:12,bold:true,color:{argb:l==='Por girar'&&v>0.005?ROJO:NEGRO}}; r++; });
  r++; const h1=ws.getRow(r++); h1.values=['Pagos de la semana','Fecha','COP','US$','Estado']; pinta(h1,{font:{bold:true,color:{argb:'FFFFFFFF'}},fill:NEGRO});
  const subt=[];
  ne.G.forEach(g=>{ const gr=ws.getRow(r++); const ini=r; gr.values=[g.nom,'',null,null,'']; pinta(gr,{font:{bold:true},fill:CLARO,borde:'FFCDD1D6'});
    g.items.forEach(x=>{ const row=ws.getRow(r++); row.values=[x.txt,dt(x.fecha),x.cop,x.usd,x.pag?'Pagado':'Por pagar']; pinta(row,{borde:LINEA});
      row.getCell(2).numFmt=FECHA; row.getCell(3).numFmt=COPF; row.getCell(3).font={name:'Arial',size:10,color:{argb:CAFE}}; row.getCell(4).numFmt=NUM; if(x.pag) row.getCell(5).font={name:'Arial',size:10,color:{argb:VERDE}}; });
    const fin=r-1; gr.getCell(3).value=g.cop!=null?{formula:'SUM(C'+ini+':C'+fin+')',result:g.cop}:null; gr.getCell(4).value={formula:'SUM(D'+ini+':D'+fin+')',result:g.usd};
    gr.getCell(3).numFmt=COPF; gr.getCell(4).numFmt=NUM; subt.push(gr.number); });
  const te=ws.getRow(r++); te.values=['Total pagos de la semana','',null,null,'']; te.getCell(4).value=subt.length?{formula:'SUM('+subt.map(n=>'D'+n).join(',')+')',result:ne.egr}:0;
  te.getCell(3).value=subt.length?{formula:'SUM('+subt.map(n=>'C'+n).join(',')+')',result:ne.G.reduce((s,g)=>s+(g.cop||0),0)}:0; te.getCell(3).numFmt=COPF; te.getCell(4).numFmt=NUM; pinta(te,{font:{bold:true},borde:NEGRO});
  r++; const h2=ws.getRow(r++); h2.values=['Entradas de otros clientes','Fecha','COP','US$','Estado']; pinta(h2,{font:{bold:true,color:{argb:'FFFFFFFF'}},fill:NEGRO});
  const e0=r; ne.ext.forEach(x=>{ const row=ws.getRow(r++); row.values=[x.txt,dt(x.fecha),null,x.usd,x.rec?'Recibido':'Esperada']; pinta(row,{borde:LINEA}); row.getCell(2).numFmt=FECHA; row.getCell(4).numFmt=NUM; });
  if(!ne.ext.length){ ws.getRow(r++).getCell(1).value='Ninguna esperada en la semana.'; }
  const ti=ws.getRow(r++); ti.values=['Total entradas','',null,ne.ext.length?{formula:'SUM(D'+e0+':D'+(r-2)+')',result:ne.ing}:0,'']; ti.getCell(4).numFmt=NUM; pinta(ti,{font:{bold:true},borde:NEGRO});
  /* las cifras de arriba, con fórmula */
  ws.getCell('D'+kr['Pagos de la semana']).value={formula:'D'+te.number,result:ne.egr};
  ws.getCell('D'+kr['Entradas de otros clientes']).value={formula:'D'+ti.number,result:ne.ing};
  ws.getCell('D'+kr['Necesidad de la semana']).value={formula:'D'+kr['Pagos de la semana']+'-D'+kr['Entradas de otros clientes'],result:ne.nec};
  ws.getCell('D'+kr['Ya girado por '+ne.c]).value=ne.ya;
  ws.getCell('D'+kr['Por girar']).value={formula:'MAX(0,D'+kr['Necesidad de la semana']+'-D'+kr['Ya girado por '+ne.c]+')',result:ne.falta};
  r++; const h3=ws.getRow(r++); h3.values=['Cómo se abona en el estado de cuenta','','Base','Se abona','']; pinta(h3,{font:{bold:true,color:{argb:'FFFFFFFF'}},fill:NEGRO});
  [['Por girar',null,ne.falta,true],['   A lo vencido',ne.ec.V,ne.ec.aV],['   A lo que vence hasta el '+_neFc(ne.fin),ne.ec.S,ne.ec.aS],['   Queda a favor de '+ne.c,null,ne.ec.fav],['Plan de cobro acordado para la semana',null,ne.plan,true]]
    .forEach(([l,b,v,neg])=>{ const row=ws.getRow(r++); row.values=[l,'',b,v,'']; pinta(row,{borde:LINEA,font:neg?{bold:true}:{}}); row.getCell(3).numFmt=NUM; row.getCell(4).numFmt=NUM; });
  r++; ws.getCell('A'+r).value='Lo que gire '+ne.c+' se registra como abono en su estado de cuenta, primero a lo más vencido. Los pesos se convierten con la '+_neTrmTxt(ne.trm)+'.';
  ws.getCell('A'+r).font={name:'Arial',size:9,italic:true,color:{argb:GRIS}};
  ws.headerFooter.oddFooter='&8Zentrack S.A.S · Necesidad de efectivo de '+ne.c+' · '+_neSemTxt(ne.L,ne.fin)+'&R&8Página &P de &N';
  return ws; }
const _ecLibroAntes210=_ecLibro;
_ecLibro=function(c,ExcelJS,ne){ const wb=_ecLibroAntes210.call(this,c,ExcelJS); if(ne) _neHoja(wb,ne); return wb; };

/* ---- bajar: PDF y Excel; a un cliente del grupo, primero el diálogo ---- */
ecPDF=function(c,ne){ if(ne===undefined&&esInterno(c)) return _neDialogo(c,'pdf');
  const w=window.open('','_blank'); if(!w){ toast('El navegador bloqueó la ventana. Usa el botón Excel.'); return; }
  w.document.write(_ecPdfHTML(c,ne||null)); w.document.close();
  setTimeout(function(){ try{ w.focus(); w.print(); }catch(e){} },700); };
ecExcel=function(c,ne){ if(ne===undefined&&esInterno(c)) return _neDialogo(c,'excel');
  _cargarExcelJS().then(ExcelJS=>_ecLibro(c,ExcelJS,ne||null).xlsx.writeBuffer()).then(buf=>{
    const url=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    const a=document.createElement('a'); a.href=url; a.download='EstadoCuenta_'+c.replace(/[^\w]+/g,'_')+'_'+_ecISO(TODAY)+(ne?'_necesidad_'+_p14Iso(ne.L):'')+'.xlsx'; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },1500);
  }).catch(err=>{ console.warn(err); toast('No pude armar el Excel con formato ('+err.message+'); va el sencillo.'); _ecExcelAntes117(c); }); };

/* ---- el diálogo: qué semana y con qué TRM ---- */
const NE={w:null};
function _neDialogo(c,tipo){
  let s=document.getElementById('neDlg'); if(s) s.remove();
  const dow=TODAY.getDay(), w0=(dow===0||dow>=4)?1:0, sel=NE.w==null?w0:NE.w, L0=_v3L0(), hoy=_p14Iso(TODAY);
  const t=_neTrmDe(hoy), tOk=t&&t.fecha===hoy;
  const op=(v,a,b)=>'<button type="button" data-w="'+v+'" class="'+(sel===v?'on':'')+'"><b>'+a+'</b><small>'+b+'</small></button>';
  s=document.createElement('div'); s.id='neDlg'; s.className='z-scrim';
  s.innerHTML='<div class="z-dlg ne-dlg" role="dialog" aria-modal="true" aria-labelledby="neDlgT"><h3 id="neDlgT">Estado de cuenta de '+esc4(c)+' · '+(tipo==='pdf'?'PDF':'Excel')+'</h3>'
    +'<div class="ne-f"><label>Hoja de necesidad de efectivo</label><div class="z-seg ne-seg">'
    +op(0,'Esta semana',_neCorto(L0,addD(L0,6))+' · enviar el lunes')+op(1,'Semana siguiente',_neCorto(addD(L0,7),addD(L0,13))+' · enviar el viernes')+op(-1,'Sin hoja','solo el estado de cuenta')+'</div></div>'
    +'<div class="ne-f ne-trm"><label for="neTrm">TRM</label><div class="ne-trmr"><input id="neTrm" class="z-in" inputmode="decimal" value="'+(t?_ec2(t.v):'')+'"><span id="neTrmF" class="z-mut3">'
    +(t?esc4((t.f==='oficial'?'Oficial':'Escrita a mano')+(tOk?'':' · del '+_neFc(_p14D(t.fecha)))):'')+(tOk&&t.f==='oficial'?'':' · buscando la oficial…')+'</span></div></div>'
    +'<div id="neRes" class="ne-res"></div><p id="neErr" class="ne-err" hidden></p>'
    +'<div class="z-dlg-f"><button type="button" class="z-btn" data-r="0">Cancelar</button><button type="button" class="z-btn pri" data-r="1">Descargar '+(tipo==='pdf'?'PDF':'Excel')+'</button></div></div>';
  document.body.appendChild(s);
  const inp=s.querySelector('#neTrm'), F=s.querySelector('#neTrmF'), res=s.querySelector('#neRes'), err=s.querySelector('#neErr');
  let w=sel, tocado=false;
  const trm=()=>{ const v=+(''+inp.value).replace(/[^\d.]/g,''); return v>1000&&v<20000?Math.round(v*100)/100:null; };
  const pinta=()=>{ s.querySelectorAll('[data-w]').forEach(b=>b.classList.toggle('on',+b.dataset.w===w)); s.querySelector('.ne-trm').hidden=w<0;
    if(w<0){ res.innerHTML=''; return; } const v=trm(); if(!v){ res.innerHTML=''; return; }
    try{ const d=neDatos(c,w,v); res.innerHTML='<div><span>Pagos</span><b>'+_ec2(d.egr)+'</b></div><div><span>Otros clientes</span><b>'+_ec2(d.ing)+'</b></div><div><span>Necesidad</span><b>'+_ec2(d.nec)+'</b></div><div><span>Ya girado</span><b>'+_ec2(d.ya)+'</b></div><div><span>Por girar</span><b>'+_ec2(d.falta)+'</b></div>'; }
    catch(e){ console.warn(e); res.innerHTML=''; } };
  if(!(tOk&&t.f==='oficial')) _neTrmTraer().then(o=>{ if(!document.body.contains(s)) return; if(!tocado){ inp.value=_ec2(o.v); } F.textContent='Oficial · vigente '+(o.desde===o.hasta?_neFc(_p14D(o.desde)):_neFc(_p14D(o.desde))+' al '+_neFc(_p14D(o.hasta))); pinta(); })
    .catch(()=>{ if(!document.body.contains(s)) return; F.textContent=t?'No pude traer la oficial: revisa la de arriba o escríbela':'No pude traer la oficial: escríbela'; });
  inp.addEventListener('input',()=>{ tocado=true; F.textContent='Escrita a mano'; err.hidden=true; pinta(); });
  const kd=e=>{ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); fin(); } };
  const fin=()=>{ s.remove(); document.removeEventListener('keydown',kd,true); };
  s.addEventListener('click',e=>{ const b=e.target.closest('[data-w]'); if(b){ w=+b.dataset.w; NE.w=w; err.hidden=true; pinta(); return; }
    const r=e.target.closest('[data-r]'); if(!r){ if(e.target===s) fin(); return; }
    if(r.dataset.r!=='1'){ fin(); return; }
    if(w<0){ fin(); return tipo==='pdf'?ecPDF(c,null):ecExcel(c,null); }
    const v=trm(); if(!v){ err.textContent='Escribe la TRM (por ejemplo 3,316.70).'; err.hidden=false; inp.focus(); return; }
    const cur=TRMOF[hoy]; if(!cur||Math.abs(cur.v-v)>=0.005){ TRMOF[hoy]={v,f:'mano'}; guardar4(); }
    const d=neDatos(c,w,v); fin(); return tipo==='pdf'?ecPDF(c,d):ecExcel(c,d); });
  document.addEventListener('keydown',kd,true); pinta(); const f=s.querySelector('[data-r="1"]'); if(f) f.focus();
  return s; }
