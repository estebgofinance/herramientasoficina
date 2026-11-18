/* ===================================================================
   v2.12 · Necesidad de efectivo: una pantalla para decidir antes de pedirle plata a Solenium
   Esteban (17-nov-2026), sobre la propuesta https://claude.ai/artifact/AWEomEcGsrBgh6xhW4ZUcW:
   1. No se guarda nada: solo sale el PDF, el Excel y el mensaje (lo tachado, lo recortado y el ajuste viven
      mientras la pantalla está abierta en esta sesión).
   2. "Pasar a la otra semana" mueve el pago también en la Caja (fecha a mano en Magnum o TIBA, o la cuota del
      plan a China), con Deshacer.
   3. Solenium ve solo los totales por rubro.
   4. La cifra se compara con el plan de cobro de esa semana y lo atrasado del plan.
   Botón "Necesidad de efectivo" en Clientes (cliente del grupo) y en la Caja. Sin llaves nuevas.
   =================================================================== */
var ZNE={c:null,w:0,excl:{},parc:{},entx:{},aj:0,ajN:'',undo:[],D:null,ab:false};
const _NE2_R={china:'Proveedores en China',mag:'Magnum · logística y aduana',tiba:'TIBA · transporte',otros:'Finkargo y otros cargos',fij:'Nómina y gastos fijos',imp:'Impuestos'};
const _NE2_PROV=()=>{ const o={}; Object.keys(_PC_NOM).forEach(k=>{ o[_PC_NOM[k]]=k; }); return o; };
function _ne2Q(s){ return esc4(s==null?'':''+s).replace(/'/g,'&#39;'); }
/* los datos de la semana, con lo necesario para mover cada pago */
function _ne2Datos(c,w){ const s=p14Calc, sF=cxpFecha, sV=_pcVal, nom=Object.assign({},_PC_NOM), MK='⁣', fx={magnum:{},tiba:{}}; let X=null, cur=null;
  /* mientras se arma: cada factura de Magnum y TIBA y cada giro del plan a China quedan marcados con su origen */
  p14Calc=function(){ const r=s.apply(this,arguments); X=r; return r; };
  cxpFecha=function(acre,f,modo){ const dd=sF.apply(this,arguments); try{ if(f&&fx[acre]&&f.id!=null&&modo!=='vence') (fx[acre][f.id]=fx[acre][f.id]||[]).push(f); }catch(e){} return dd; };
  _pcVal=function(iso){ cur=iso; return sV.apply(this,arguments); };
  Object.keys(nom).forEach(k=>Object.defineProperty(_PC_NOM,k,{configurable:true,enumerable:true,get(){ return nom[k]+(cur?MK+cur+MK:''); }}));
  let d; try{ d=neDatos(c,w,null); }
  finally { p14Calc=s; cxpFecha=sF; _pcVal=sV; Object.keys(nom).forEach(k=>Object.defineProperty(_PC_NOM,k,{configurable:true,enumerable:true,writable:true,value:nom[k]})); }
  const re=/⁣(\d{4}-\d{2}-\d{2})⁣/, sin=t=>(''+t).split(MK).filter((x,i)=>i%2===0).join('');
  const T=d.trm.v, prov=_NE2_PROV(), L=d.L, hoy=TODAY;
  d.G.forEach(g=>{ const raw=((X&&X.R[g.k]&&X.R[g.k].it[w])||[]).filter(x=>Math.abs(+x.usd||0)>0.005); const vis={};
    g.items.forEach((it,i)=>{ const r0=raw[i]||{}, mm=re.exec(''+r0.txt), r=Object.assign({},r0,{txt:sin(r0.txt),iso:mm?mm[1]:r0.iso}); it.txt=sin(it.txt); const base=g.k+'|'+it.txt; vis[base]=(vis[base]||0)+1; it.key=base+(vis[base]>1?'#'+vis[base]:''); it.raw=r;
      it.cuatro=g.k==='imp'&&/^4x1000/.test(it.txt);
      const dd=r.d?new Date(r.d):(r.iso?_p14D(r.iso):null), dia=dd&&dd>=L?dd:(hoy>L?hoy:L); it.dia=dia;
      if(it.pag||it.cuatro) return;
      if(g.k==='china'&&r.plan&&r.iso){ const m=/^Tu giro a (.+) \(plan\)$/.exec(''+r.txt), k=m?prov[m[1]]:null; if(k&&k!=='sin') it.mov={tipo:'pc',prov:k,iso:r.iso}; }
      else if(g.k==='mag'||g.k==='tiba'){ const acre=g.k==='mag'?'magnum':'tiba', id=(''+r.txt).split(' · ')[0], C=fx[acre][id]||[];
        const f=C.find(o=>Math.abs((o.moneda==='USD'?+o.saldo:(+o.saldo)/T)-(+r.usd||0))<0.05)||C[0];
        if(f&&f._planFecha) it.mov={tipo:'cxv',acre,pf:f._planFecha};
        else if(f&&!((CXPMIO[_mioK(acre,f)]||{}).partes||[]).length) it.mov={tipo:'cxp',acre,f}; } }); });
  return d; }
function _ne2Calc(){ const D=ZNE.D; if(!D) return null; const w=ZNE.w, T=D.trm.v, P=k=>w+'|'+k;
  let pag=0, cop=0, cuatro=0; const rub={};
  D.G.forEach(g=>{ g.items.forEach(it=>{ if(it.cuatro) return; const on=it.pag||!ZNE.excl[P(it.key)], m=it.pag?it.usd:Math.min(it.usd,ZNE.parc[P(it.key)]!=null?ZNE.parc[P(it.key)]:it.usd);
      it.on=on; it.m=on?m:0; if(!on) return; pag+=m; (rub[g.k]=rub[g.k]||{usd:0,cop:0,hayCop:false}).usd+=m;
      if(it.cop!=null&&it.usd>0.005){ const cc=it.cop*(m/it.usd); cop+=cc; rub[g.k].cop+=cc; rub[g.k].hayCop=true; } }); });
  const tieneCuatro=D.G.some(g=>g.items.some(it=>it.cuatro));
  if(tieneCuatro&&cop>0){ cuatro=_neR2(cop*0.004/T); pag+=cuatro; const r=(rub.imp=rub.imp||{usd:0,cop:0,hayCop:false}); r.usd+=cuatro; r.cop+=cop*0.004; r.hayCop=true; }
  const ent=D.ext.reduce((a,x,i)=>a+(ZNE.entx[P('e'+i)]?0:x.usd),0), aj=+ZNE.aj||0, ya=D.ya;
  const pedir=_neR2(Math.max(0,pag+aj-ent-ya));
  const aV=_neR2(Math.min(pedir,D.ec.V)), aS=_neR2(Math.min(pedir-aV,D.ec.S)), fav=_neR2(Math.max(0,pedir-aV-aS));
  let atr=0; try{ const cp=_v3Cp('cobro:'+D.c), hoy=_p14Iso(TODAY); if(cp) atr=_neR2(_v3Act(cp).filter(l=>l.f&&l.f<hoy).reduce((s,l)=>s+(+l.m||0),0)); }catch(e){}
  return {pag:_neR2(pag),cop,cuatro,ent:_neR2(ent),aj,ya,pedir,aV,aS,fav,rub,atr}; }
/* abrir, cerrar y repintar */
function neV2Abrir(c,w){ if(!c){ c=_ecClientes().find(n=>esInterno(n)); if(!c){ z26Aviso('No hay cliente del grupo.'); return; } }
  if(ZNE.c!==c){ ZNE.excl={}; ZNE.parc={}; ZNE.entx={}; ZNE.aj=0; ZNE.ajN=''; ZNE.undo=[]; }
  ZNE.c=c; ZNE.w=w!=null?w:(ZNE.w||0); ZNE.ab=true; _ne2Pintar(); }
function neV2Cerrar(){ ZNE.ab=false; const s=document.getElementById('neV2'); if(s) s.remove(); try{ _p14Repintar(); }catch(e){} }
function neV2Semana(w){ ZNE.w=w===1?1:0; _ne2Pintar(); }
function _ne2Pintar(){ let s=document.getElementById('neV2'); const foco=document.activeElement&&document.activeElement.id;
  ZNE.D=_ne2Datos(ZNE.c,ZNE.w); const X=_ne2Calc(), D=ZNE.D, w=ZNE.w, P=k=>w+'|'+k, H=_ne2Q, n2=v=>_ec2(v), n0=v=>fmtUSDs(v);
  const tf=D.trm, trmT='TRM '+_ec2(tf.v)+' · '+(tf.f==='oficial'?'oficial '+_p14F(_p14D(tf.fecha)):(_p16TrmFuente().de||''));
  const dif=X.pedir-D.plan;
  let rows='';
  D.G.forEach(g=>{ const sub=g.items.reduce((a,it)=>a+(it.cuatro?0:(it.m||0)),0)+(g.k==='imp'?X.cuatro:0);
    rows+='<tr class="ne2-g"><td></td><td colspan="3">'+H(_NE2_R[g.k]||g.nom)+'</td><td class="n">'+(sub>0.005?n2(sub):'—')+'</td><td></td></tr>';
    g.items.forEach(it=>{ if(it.cuatro){ rows+='<tr><td></td><td>4x1000 sobre lo que sale en pesos</td><td class="mut">automático</td><td class="n">—</td><td class="n">'+n2(X.cuatro)+'</td><td></td></tr>'; return; }
      const q=_ne2Q(it.key), parc=ZNE.parc[P(it.key)]!=null&&Math.abs(ZNE.parc[P(it.key)]-it.usd)>0.005;
      rows+='<tr class="'+(it.on?'':'off')+'">'
        +'<td class="ck">'+(it.pag?'':'<input type="checkbox" data-ne="ck" data-k="'+q+'" '+(it.on?'checked':'')+' aria-label="Pedir '+H(it.txt)+'">')+'</td>'
        +'<td>'+H(it.txt)+(it.pag?' <span class="z-tag ok">Ya salió</span>':'')+'</td>'
        +'<td class="mut">'+(it.dia?_p14F(it.dia):'—')+'</td>'
        +'<td class="n mut">'+(it.cop!=null?fmtUSDs(it.cop*((it.m||it.usd)/it.usd)):'—')+'</td>'
        +'<td class="n">'+(it.pag?n2(it.usd):'<input class="z-in n ne2-m'+(parc?' ed':'')+'" data-ne="m" data-k="'+q+'" value="'+n2(it.on?it.m:it.usd)+'" inputmode="decimal" aria-label="Monto a pedir de '+H(it.txt)+'">')+'</td>'
        +'<td>'+(it.mov?'<button type="button" class="z-btn q sm" data-ne="mov" data-k="'+q+'" title="Pasar a la otra semana: también se mueve en la Caja">Otra semana →</button>':'')+'</td></tr>'; }); });
  if(!D.G.length) rows='<tr><td colspan="6" class="mut" style="padding:14px">Sin pagos en la semana.</td></tr>';
  const ent=D.ext.length?D.ext.map((x,i)=>'<label class="ne2-ent"><input type="checkbox" data-ne="ent" data-i="'+i+'" '+(ZNE.entx[P('e'+i)]?'':'checked')+'> '+H(x.txt)+' <b class="n">'+n2(x.usd)+'</b></label>').join('')
    :'<span class="mut">Ninguna esperada en la semana.</span>';
  const rub=Object.keys(_NE2_R).filter(k=>X.rub[k]&&X.rub[k].usd>0.005).map(k=>({k,t:_NE2_R[k],v:X.rub[k].usd}));
  const ajT=X.aj>0.005?'Otros pagos de la semana':'Pagos cubiertos con caja de Zentrack';
  const sole=rub.map(r=>'<li><span>'+H(r.t)+'</span><b class="n">'+n2(r.v)+'</b></li>').join('')+(Math.abs(X.aj)>0.005?'<li><span>'+ajT+'</span><b class="n">'+n2(X.aj)+'</b></li>':'')
    +(X.ent>0.005?'<li><span>Menos: entradas de otros clientes</span><b class="n">−'+n2(X.ent)+'</b></li>':'')+(X.ya>0.005?'<li><span>Menos: ya girado esta semana</span><b class="n">−'+n2(X.ya)+'</b></li>':'');
  const T=Math.max(1,X.pedir), bar=(X.aV>0.5?'<i style="flex:'+(X.aV/T)+';background:var(--z-crit)"></i>':'')+(X.aS>0.5?'<i style="flex:'+(X.aS/T)+';background:#FD9C10"></i>':'')+(X.fav>0.5?'<i style="flex:'+(X.fav/T)+';background:var(--z-ok)"></i>':'');
  const msg=_ne2Msg(X,rub);
  const html='<div class="z-dlg ne2" role="dialog" aria-modal="true" aria-labelledby="ne2T">'
    +'<div class="ne2-top"><h3 id="ne2T">Necesidad de efectivo · '+H(D.c)+'</h3>'
    +'<div class="z-seg" role="group" aria-label="Semana"><button type="button" class="'+(w===0?'on':'')+'" data-ne="w" data-w="0">Esta semana · '+H(_neCorto(D.L,D.fin).replace('–',' al '))+'</button><button type="button" class="'+(w===1?'on':'')+'" data-ne="w" data-w="1">Siguiente</button></div>'
    +'<span class="z-sp"></span><span class="zd-trm'+(tf.f==='oficial'?'':' warn')+'">'+H(trmT)+'</span><button type="button" class="z-btn" data-ne="cerrar">Cerrar</button></div>'
    +'<div class="ne2-hero"><div><span class="z-cap">Pedir a '+H(D.c)+' · US$</span><div class="ne2-big">'+n0(X.pedir)+'</div><span class="mut">'+H(_neSemTxt(D.L,D.fin))+(Math.abs(X.aj)>0.005?' · con ajuste '+n2(X.aj):'')+'</span></div>'
    +'<div class="ne2-eq"><div><span class="z-cap">Pagos que decides</span><b>'+n0(X.pag)+'</b></div><i>−</i><div><span class="z-cap">Entradas de otros</span><b>'+n0(X.ent)+'</b></div><i>−</i><div><span class="z-cap">Ya girado por '+H(D.c)+'</span><b>'+n0(X.ya)+'</b></div>'
    +(Math.abs(X.aj)>0.005?'<i>'+(X.aj>0?'+':'−')+'</i><div><span class="z-cap">Ajuste</span><b>'+n0(Math.abs(X.aj))+'</b></div>':'')
    +'<div class="ne2-plan"><span>Plan de cobro de la semana <b>'+n0(D.plan)+'</b></span>'+(X.atr>0.5?'<span>Atrasado del plan <b>'+n0(X.atr)+'</b></span>':'')
    +'<span>Diferencia contra el plan <b class="'+(dif>0.5?'mal':'ok')+'">'+(dif>0?'+':'')+n0(dif)+'</b></span></div></div></div>'
    +'<div class="ne2-cols"><div class="z-box ne2-tabla"><div class="z-bh"><h3>Pagos de la semana</h3><span class="z-def">desmarca para no pedirlo · cambia el monto para pedir una parte · "Otra semana" lo pasa a la siguiente también en la Caja</span><span class="z-sp"></span>'
    +(ZNE.undo.length?'<button type="button" class="z-btn sm" data-ne="undo">Deshacer</button>':'')+'<button type="button" class="z-btn q sm" data-ne="reset">Como está en la Caja</button></div>'
    +'<div class="z-wrap"><table class="z-t"><thead><tr><th></th><th>Concepto</th><th>Cuándo</th><th class="n">COP</th><th class="n">US$ a pedir</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div class="ne2-pie"><div><span class="z-cap">Entradas de otros clientes</span><div class="ne2-ents">'+ent+'</div></div>'
    +'<div class="ne2-aj"><label class="z-cap" for="ne2Aj">Ajuste · US$</label><input class="z-in n" id="ne2Aj" data-ne="aj" inputmode="decimal" value="'+(X.aj?n2(X.aj):'')+'" placeholder="0">'
    +'<input class="z-in" id="ne2AjN" data-ne="ajn" value="'+H(ZNE.ajN)+'" placeholder="Por qué (solo lo ves tú)"></div></div></div>'
    +'<aside class="z-box ne2-sole"><div class="z-bh"><h3>Lo que ve '+H(D.c)+'</h3><span class="z-def">PDF y Excel</span></div><div class="ne2-paper">'
    +'<ul>'+(sole||'<li class="mut">Nada que pedir.</li>')+'</ul><div class="ne2-tot"><span>Por girar</span><b>US$ '+n2(X.pedir)+'</b></div>'
    +'<span class="z-cap">Cómo se abona en su estado de cuenta</span><div class="ne2-bar" aria-hidden="true">'+bar+'</div><ul>'
    +[['Vencido',X.aV,'crit'],['Vence hasta el '+_p14F(D.fin),X.aS,'warn'],['A su favor',X.fav,'ok']].filter(x=>x[1]>0.005).map(x=>'<li><span>'+_z26tag(x[2],x[0])+'</span><b class="n">'+n2(x[1])+'</b></li>').join('')+'</ul>'
    +'<span class="z-cap">Mensaje</span><div class="ne2-msg" id="ne2Msg">'+H(msg)+'</div>'
    +'<div class="ne2-acts"><button type="button" class="z-btn pri" data-ne="pdf">PDF</button><button type="button" class="z-btn" data-ne="xls">Excel</button><button type="button" class="z-btn" data-ne="copy">Copiar mensaje</button></div>'
    +'<span class="ne2-toast" id="ne2Toast" role="status"></span></div></aside></div></div>';
  if(!s){ s=document.createElement('div'); s.id='neV2'; s.className='z-scrim ne2-scrim'; s.addEventListener('click',_ne2Click); s.addEventListener('change',_ne2Change);
    s.addEventListener('keydown',e=>{ if(e.key==='Escape') neV2Cerrar(); }); document.body.appendChild(s); }
  const sc=(s.querySelector('.ne2-tabla .z-wrap')||{}).scrollTop||0, sd=(s.querySelector('.z-dlg')||{}).scrollTop||0;
  s.innerHTML=html; const t=s.querySelector('.ne2-tabla .z-wrap'); if(t) t.scrollTop=sc; const dl=s.querySelector('.z-dlg'); if(dl) dl.scrollTop=sd;
  if(foco){ const f=document.getElementById(foco); if(f&&f.tagName==='INPUT'){ f.focus(); } } }
function _ne2Msg(X,rub){ const D=ZNE.D; return 'Hola, te comparto la necesidad de efectivo de la '+_neSemTxt(D.L,D.fin).toLowerCase()+': US$ '+_ec2(X.pedir)+' ('+_neTrmTxt(D.trm)+').\n'
  +rub.map(r=>'· '+r.t+': US$ '+_ec2(r.v)).join('\n')+(Math.abs(X.aj)>0.005?'\n· '+(X.aj>0?'Otros pagos de la semana':'Pagos cubiertos con caja de Zentrack')+': US$ '+_ec2(X.aj):'')
  +(X.ent>0.005?'\n· Menos entradas de otros clientes: US$ '+_ec2(X.ent):'')+(X.ya>0.005?'\n· Menos lo ya girado esta semana: US$ '+_ec2(X.ya):'')+'\nVa con el estado de cuenta en PDF y Excel.'; }
function _ne2Toast(t){ const x=document.getElementById('ne2Toast'); if(x) x.textContent=t; }
function _ne2Item(k){ for(const g of (ZNE.D&&ZNE.D.G)||[]){ const it=g.items.find(x=>x.key===k); if(it) return it; } return null; }
function _ne2Click(e){ const b=e.target.closest('[data-ne]'); if(!b||b.tagName==='INPUT') return; const a=b.dataset.ne;
  if(a==='cerrar') return neV2Cerrar();
  if(a==='w') return neV2Semana(+b.dataset.w);
  if(a==='reset'){ ZNE.excl={}; ZNE.parc={}; ZNE.entx={}; ZNE.aj=0; ZNE.ajN=''; _ne2Pintar(); return _ne2Toast('Todo como está en la Caja.'); }
  if(a==='mov'){ const it=_ne2Item(b.dataset.k); if(it&&neV2Mover(it)){ _ne2Pintar(); _ne2Toast('Pasado a la semana siguiente. También quedó así en la Caja.'); } return; }
  if(a==='undo'){ neV2Deshacer(); return; }
  if(a==='pdf'||a==='xls'){ const ne=neV2Hoja(); if(a==='pdf') ecPDF(ZNE.c,ne); else ecExcel(ZNE.c,ne); return; }
  if(a==='copy'){ const t=_ne2Msg(_ne2Calc(),Object.keys(_NE2_R).filter(k=>{ const X=_ne2Calc(); return X.rub[k]&&X.rub[k].usd>0.005; }).map(k=>({t:_NE2_R[k],v:_ne2Calc().rub[k].usd})));
    const sel=()=>{ const n=document.getElementById('ne2Msg'); if(!n) return; const r=document.createRange(); r.selectNodeContents(n); const s=getSelection(); s.removeAllRanges(); s.addRange(r); _ne2Toast('Seleccionado: cópialo con Ctrl+C.'); };
    try{ navigator.clipboard.writeText(t).then(()=>_ne2Toast('Mensaje copiado.'),sel); }catch(err){ sel(); } } }
function _ne2Change(e){ const t=e.target, a=t.dataset&&t.dataset.ne; if(!a) return; const P=k=>ZNE.w+'|'+k;
  if(a==='ck'){ if(t.checked) delete ZNE.excl[P(t.dataset.k)]; else ZNE.excl[P(t.dataset.k)]=true; }
  else if(a==='m'){ const it=_ne2Item(t.dataset.k), v=_z27Num(t.value); if(it){ if(isFinite(v)&&v>=0){ ZNE.parc[P(it.key)]=Math.min(v,it.usd); if(v<0.005) ZNE.excl[P(it.key)]=true; else delete ZNE.excl[P(it.key)]; } else delete ZNE.parc[P(it.key)]; } }
  else if(a==='ent'){ if(t.checked) delete ZNE.entx[P('e'+t.dataset.i)]; else ZNE.entx[P('e'+t.dataset.i)]=true; }
  else if(a==='aj'){ const v=_z27Num(t.value); ZNE.aj=isFinite(v)?v:0; }
  else if(a==='ajn'){ ZNE.ajN=t.value; return; }
  _ne2Pintar(); }
/* pasar a la otra semana: queda en la Caja (fecha a mano de la factura o cuota del plan), con Deshacer */
function _ne2Snap(){ return JSON.stringify({CXPMIO,PLANES,PLANCHINA}); }
function neV2Mover(it){ const m=it&&it.mov; if(!m) return false; const dest=_p14Iso(addD(it.dia||TODAY,7)), snap=_ne2Snap(); let ok=false;
  try{
    if(m.tipo==='cxp'){ const k=_mioK(m.acre,m.f); CXPMIO[k]=Object.assign({},CXPMIO[k]||{},{planFecha:dest}); ok=true; }
    else if(m.tipo==='pc'||m.tipo==='cxv'){ const c=_v3Cp('pago:'+(m.prov||m.acre)); if(c&&c.act){ const iso=m.iso||m.pf;
        _v3Lin(c,c.act).filter(l=>l.f===iso&&l.m>0.005).forEach(l=>{ _v3LinSet(c,c.act,l.id,'f',dest); ok=true; }); } }
  }catch(err){ console.warn('v2.12 mover',err); ok=false; }
  if(!ok){ try{ const o=JSON.parse(snap); CXPMIO=o.CXPMIO; PLANES=o.PLANES; PLANCHINA=o.PLANCHINA; }catch(e){} _ne2Toast('No se pudo mover ese pago.'); return false; }
  ZNE.undo.push(snap); if(ZNE.undo.length>20) ZNE.undo.shift(); ZA.cache=null; guardar4(); try{ _p14Repintar(); }catch(e){} return true; }
function neV2Deshacer(){ const s=ZNE.undo.pop(); if(!s) return; const o=JSON.parse(s); CXPMIO=o.CXPMIO; PLANES=o.PLANES; PLANCHINA=o.PLANCHINA; ZA.cache=null; guardar4();
  try{ _p14Repintar(); }catch(e){} _ne2Pintar(); _ne2Toast('Deshecho: el pago volvió a su semana.'); }
/* lo que sale para Solenium (PDF y Excel): por rubro */
function neV2Hoja(){ const D=ZNE.D, X=_ne2Calc(); if(!D||!X) return null;
  const R=Object.keys(_NE2_R).filter(k=>X.rub[k]&&X.rub[k].usd>0.005).map(k=>({nom:_NE2_R[k],usd:_neR2(X.rub[k].usd),cop:X.rub[k].hayCop?Math.round(X.rub[k].cop):null}));
  if(Math.abs(X.aj)>0.005) R.push({nom:X.aj>0?'Otros pagos de la semana':'Pagos cubiertos con caja de Zentrack',usd:_neR2(X.aj),cop:null});
  const egr=_neR2(R.reduce((s,r)=>s+r.usd,0)), ext=D.ext.filter((x,i)=>!ZNE.entx[ZNE.w+'|e'+i]);
  return Object.assign({},D,{v2:true,R,G:[],egr,ext,ing:X.ent,nec:_neR2(egr-X.ent),ya:X.ya,falta:X.pedir,ec:Object.assign({},D.ec,{aV:X.aV,aS:X.aS,fav:X.fav})}); }
function _ne2HTML(ne){ const H=x=>esc4(x==null?'':x), n2=v=>Math.abs(v)<0.005?'—':_ec2(v), nc=v=>v==null?'—':fmtUSDs(v), tCop=ne.R.reduce((s,r)=>s+(r.cop||0),0);
  const h=_neHTMLAntes212(Object.assign({},ne,{G:[]}));
  const tabla='<section class="grupo"><div class="gh"><h2>Pagos de la semana</h2><span>US$ <b>'+_ec2(ne.egr)+'</b></span></div>'
    +'<table><thead><tr><th>Rubro</th><th class="r">COP</th><th class="r">US$</th></tr></thead><tbody>'
    +(ne.R.length?ne.R.map(r=>'<tr><td>'+H(r.nom)+'</td><td class="r cop">'+nc(r.cop)+'</td><td class="r">'+n2(r.usd)+'</td></tr>').join(''):'<tr><td colspan="3">Sin pagos en la semana.</td></tr>')
    +'<tr class="tt"><td>Total pagos de la semana</td><td class="r cop">'+nc(tCop||null)+'</td><td class="r">'+_ec2(ne.egr)+'</td></tr></tbody></table></section>';
  return h.replace(/<section class="grupo"><div class="gh"><h2>Pagos de la semana<\/h2>[\s\S]*?<\/table><\/section>/,tabla); }
function _ne2Hoja(wb,ne){ const ws=_neHojaAntes212(wb,Object.assign({},ne,{G:ne.R.map(r=>({nom:r.nom,usd:r.usd,cop:r.cop,items:[{txt:r.nom,fecha:null,cop:r.cop,usd:r.usd,pag:false}]}))}));
  /* por rubro: la fila de detalle repite el rubro; se deja solo una fila por rubro */
  const quitar=[]; ws.eachRow((row,n)=>{ const a=row.getCell(1).value, e=row.getCell(5).value; if(e==='Por pagar'&&ne.R.some(r=>r.nom===a)) quitar.push(n); });
  quitar.forEach(n=>{ const row=ws.getRow(n); row.getCell(5).value=''; row.hidden=true; });
  return ws; }
const _neHTMLAntes212=_neHTML; _neHTML=function(ne){ return ne&&ne.v2?_ne2HTML(ne):_neHTMLAntes212.apply(this,arguments); };
const _neHojaAntes212=_neHoja; _neHoja=function(wb,ne){ return ne&&ne.v2?_ne2Hoja(wb,ne):_neHojaAntes212.apply(this,arguments); };
/* botones: en el estado de cuenta de un cliente del grupo y en la Caja */
const _ecHTMLAntes212=_ecHTML;
_ecHTML=function(c){ const h=_ecHTMLAntes212.apply(this,arguments); if(!c||!esInterno(c)) return h;
  return h.replace(/<button class="ec8-b" onclick="ecExcel\(('[^']*')\)">Excel<\/button>/,(m,q)=>'<button type="button" id="ne2Btn" class="ec8-b ne2-btn" onclick="neV2Abrir('+q+')">Necesidad de efectivo</button>'+m); };
const _p14CajaAntes212=_p14Caja;
_p14Caja=function(){ const h=_p14CajaAntes212.apply(this,arguments); const c=_ecClientes().find(n=>esInterno(n)); if(!c) return h;
  return h.replace('<button type="button" class="z-btn" onclick="v2CajaExportar()">Exportar</button>','<button type="button" class="z-btn pri" onclick="neV2Abrir(\''+_maQ(c)+'\')">Necesidad de efectivo · '+esc4(c)+'</button><button type="button" class="z-btn" onclick="v2CajaExportar()">Exportar</button>'); };
/* la Caja cambia por fuera (carga, día nuevo): si la pantalla está abierta, se repinta */
const _p14RepintarAntes212=_p14Repintar;
_p14Repintar=function(){ const r=_p14RepintarAntes212.apply(this,arguments); try{ if(ZNE.ab&&document.getElementById('neV2')) _ne2Pintar(); }catch(e){} return r; };
