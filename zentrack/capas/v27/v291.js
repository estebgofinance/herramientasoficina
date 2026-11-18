/* ===================================================================
   v2.9.1 · Flujo de ingresos y egresos, sin saldo de bancos
   Esteban (12-nov-2026): "a día de hoy no me sirve de nada colocar el saldo del banco porque es jueves y ya ha
   salido plata. Necesito mapear mis ingresos y egresos de forma oportuna; el saldo lo sé yo".
   - El cálculo no arranca con el saldo de bancos (X.s0 = 0; el registrado queda en X.s0Bancos, sin uso).
   - Esta semana trae lo que YA entró (abonos registrados del lunes a hoy) y lo que YA salió (pagos registrados
     con fecha del lunes a hoy), además de lo que falta. Así la semana muestra el flujo completo.
   - "Saldo al cerrar" pasa a "Acumulado" (entra − sale desde esta semana). La tarjeta "Plata en bancos" del
     Tablero pasa a "Esta semana"; la gráfica muestra el neto de cada semana; el sankey lee cada semana sola.
   =================================================================== */
function _z291Lineas(){ const m={}; try{ _v3Cps().forEach(c=>{ if(c.dir!=='p') return; _v3Vers(c).forEach(v=>{ if(v.id==='base') return; _v3Lin(c,v.id).forEach(l=>{ if(!m[l.id]) m[l.id]={prov:c.prov,n:c.n}; }); }); }); }catch(e){ console.warn(e); } return m; }
function _z291Flujo(X){ const R=X.R, N=X.W&&X.W.length; if(!R||!N||!R.ext) return X;
  X.s0Bancos=X.s0; X.s0=0; X.chPlan=X.chPlan||{};
  const L0=X.W[0], hoy=TODAY, ya={entra:0,sale:0,itE:[],itS:[]}, cli=(X.v3&&X.v3.cli)||null;
  (ECA||[]).forEach(a=>{ if(a.via) return; const d=_ecFecha(a.fecha), usd=+a.usd||0; if(!d||d<L0||d>hoy||!(usd>0.005)) return;
    const k=esInterno(a.cliente)?'sole':'ext'; R[k].v[0]+=usd; R[k].it[0].push({txt:'Ya entró · '+a.cliente+' · '+_p14F(d)+(a.nota?' · '+a.nota:''),usd});
    if(cli){ (cli[a.cliente]=cli[a.cliente]||new Array(N).fill(0))[0]+=usd; } ya.entra+=usd; ya.itE.push({n:a.cliente,usd,d}); });
  const G=(PLANES&&PLANES.reg)||{}, M=Object.keys(G).length?_z291Lineas():{}, FI={eagle:'china',nexus:'china',comp:'china',magnum:'mag',tiba:'tiba',otros:'otros'};
  Object.keys(G).forEach(id=>{ (G[id]||[]).forEach(r=>{ const d=_p14D(r.f), m=+r.m||0; if(!d||d<L0||d>hoy||!(m>0.005)) return;
    const o=M[id]||{prov:'otros',n:'Pago'}, fila=FI[o.prov]||'otros'; if(!R[fila]) return;
    R[fila].v[0]+=m; R[fila].it[0].push({txt:'Ya salió · '+o.n+' · '+_p14F(d)+' · '+_z27Med(r.medio),usd:m});
    if(fila==='china'){ (X.chPlan[o.prov]=X.chPlan[o.prov]||new Array(N).fill(0))[0]+=m; } ya.sale+=m; ya.itS.push({n:o.n,usd:m,d}); }); });
  X.ya=ya; let s=0; X.ini=[]; X.neto=[]; X.cierre=[];
  for(let i=0;i<N;i++){ X.ini.push(s); const n=R.ext.v[i]+R.sole.v[i]-R.china.v[i]-R.mag.v[i]-R.tiba.v[i]-R.otros.v[i]-R.fij.v[i]-R.imp.v[i]; X.neto.push(n); s+=n; X.cierre.push(s); }
  return X; }
const _p14CalcAntes291=p14Calc;
p14Calc=function(){ const X=_p14CalcAntes291.apply(this,arguments); try{ _z291Flujo(X); }catch(e){ console.warn('v2.9.1 flujo',e); } return X; };

/* ---- Caja: sin "Saldo al empezar"; "Acumulado" en vez de "Saldo al cerrar" ---- */
const _p14CajaAntes291=_p14Caja;
_p14Caja=function(){ let h=_p14CajaAntes291.apply(this,arguments);
  h=h.replace(/<tr class=""><td class="cp">Saldo al empezar<\/td>[\s\S]*?<\/tr>/,'');
  h=h.replace('<td class="cp">Saldo al cerrar</td>','<td class="cp">Acumulado <small class="z-mut3">entra − sale desde esta semana</small></td>').replace(/ title="bajo el colchón"/g,'');
  h=h.replace(/ · saldo inicial: bancos [^·<]*· colchón [^<]*<\/span>/,' · esta semana incluye lo que ya entró y salió · sin saldo de bancos</span>');
  return h; };
/* ---- Planes: la última fila es el acumulado ---- */
const _z26PlHTMLAntes291=_z26PlHTML;
_z26PlHTML=function(){ return _z26PlHTMLAntes291.apply(this,arguments).replace('Saldo al cerrar = Caja','Acumulado (entra − sale)'); };
/* ---- Tablero: "Esta semana" en vez de "Plata en bancos" ---- */
const _z26TiraAntes291=_z26Tira;
_z26Tira=function(){ const h=_z26TiraAntes291.apply(this,arguments); let X=null; try{ X=p14Calc('pago'); }catch(e){}
  if(!X) return h; const E=X.R.ext.v[0]+X.R.sole.v[0], S=X.R.china.v[0]+X.R.mag.v[0]+X.R.tiba.v[0]+X.R.otros.v[0]+X.R.fij.v[0]+X.R.imp.v[0], ya=X.ya||{entra:0,sale:0};
  const card='<div><span class="z-cap">Esta semana · US$</span><a href="#" class="z-go" onclick="z26IrSemana(0);return false"><span class="v'+(E-S<-0.5?' crit':(E-S>0.5?' ok':''))+'">'+_z26m(E-S).replace('—','0')+'</span></a>'
    +'<span class="s">entra '+_z26m(E)+' · sale '+_z26m(S)+'</span><span class="s">ya entró '+_z26m(ya.entra)+' · ya salió '+_z26m(ya.sale)+'</span></div>';
  const a=h.indexOf('<div><span class="z-cap">Plata en bancos'); if(a<0) return h;
  const b=h.indexOf('</div>',h.indexOf('Registrar saldos',a)); if(b<0) return h;
  return h.slice(0,a)+card+h.slice(b+6); };
/* ---- Tablero: la gráfica muestra el neto de cada semana ---- */
_z26GrafHTML=function(X){
  const C=X.neto||[], N=C.length, W=1180, H=250, L=60, Rr=12, T=24, B=44, ph=H-T-B, pw=W-L-Rr;
  const mx=Math.max(0,...C), mn=Math.min(0,...C), rg=Math.max(1,mx-mn), y=v=>T+(mx-v)/rg*ph;
  const st=(()=>{ const r=rg/4, p=Math.pow(10,Math.floor(Math.log10(r))), m=r/p; return (m<=1?1:(m<=2?2:(m<=5?5:10)))*p; })();
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Lo que entra menos lo que sale, semana a semana, en dólares">';
  for(let t=Math.ceil(mn/st)*st;t<=mx+0.5;t+=st){ const yy=y(t).toFixed(1); s+='<line x1="'+L+'" x2="'+(W-Rr)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+(Math.abs(t)<0.5?'#A2A7AD':'#E4E6E9')+'"/><text x="'+(L-8)+'" y="'+(+yy+4)+'" text-anchor="end" font-size="13" fill="#7D838A">'+_z26k(t)+'</text>'; }
  let mi=0; C.forEach((v,i)=>{ if(v<C[mi]) mi=i; });
  const slot=pw/N, bw=Math.min(40,slot*.62), y0=y(0);
  C.forEach((v,i)=>{ const x=L+slot*i+(slot-bw)/2, yt=Math.min(y(v),y0), h=Math.max(2,Math.abs(y(v)-y0)), cl=v<0?'#B3261E':'#2E6E5A';
    s+='<g class="bar" data-i="'+i+'" onclick="z26IrSemana('+i+')"><title>'+_p14F(X.W[i])+' · entra − sale '+_z26m(v)+'</title><rect x="'+x.toFixed(1)+'" y="'+yt.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="2" fill="'+cl+'" opacity="'+(i===mi?1:.72)+'"/>'
      +'<text x="'+(x+bw/2).toFixed(1)+'" y="'+(v<0?yt+h+15:yt-6).toFixed(1)+'" text-anchor="middle" font-size="13" font-weight="'+(i===mi?700:500)+'" fill="'+(v<0?'#B3261E':'#17181A')+'">'+_z26k(v)+'</text>'
      +'<text x="'+(x+bw/2).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle" font-size="13" font-weight="'+(i===0?700:400)+'" fill="'+(i===0?'#7A4A00':'#7D838A')+'">'+_p14F(X.W[i])+'</text></g>'; });
  s+='</svg>';
  const neg=C.filter(v=>v<-0.5).length, tot=C.reduce((a,v)=>a+v,0);
  return '<section class="z-box z-graf" id="z26Graf"><div class="z-bh"><h3>Entra menos sale · '+N+' semanas</h3><span class="z-def">US$ · con tu plan de pagos · esta semana incluye lo que ya entró y salió · sin saldo de bancos</span></div>'
    +'<div style="padding:8px 12px 0">'+s+'</div><div class="z-bf">Peor semana: <b style="color:'+(C[mi]<0?'var(--z-crit)':'var(--ink)')+'">'+_z26m(C[mi])+'</b> el '+_p14F(X.W[mi])+' · '+neg+' de '+N+' semanas sale más de lo que entra · en '+N+' semanas: '+_z26m(tot)+' · clic en una barra abre la Caja en esa semana</div></section>'; };
/* ---- el Tablero ya no pide saldos de bancos ---- */
z26Bancos=function(){ z26Aviso('El saldo de bancos ya no se usa: la Caja muestra lo que entra y sale cada semana.'); };
/* ---- armar acuerdo: el efecto se mide en el acumulado ---- */
const _z27GenPrevHTMLAntes291=_z27GenPrevHTML;
_z27GenPrevHTML=function(){ return _z27GenPrevHTMLAntes291.apply(this,arguments).replace('Saldo más bajo','Acumulado más bajo').replace('Semana del saldo más bajo','Semana del más bajo'); };
/* ---- arriba ya no se muestra la fecha de los bancos ---- */
const _z26FuentesAntes291=_z26Fuentes;
_z26Fuentes=function(){ return _z26FuentesAntes291.apply(this,arguments).replace(/<span title="Bancos[^"]*"><span class="z-tag[^"]*">[^<]*<\/span><\/span>/,'').replace(/<span class="z-tag[^"]*">Bancos · sin cargar<\/span>/,''); };
