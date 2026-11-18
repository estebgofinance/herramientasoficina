/* v2.4 · Planes desde un archivo y anticipo de un derrame.
   Hoy fijado en 30-oct-2026. Usa RESP.json, DATOS.json, DET23.xlsx, OR23.xlsx, MAG.pdf y TIBA.xlsx (fuera del repo).
   Las cifras esperadas salen de los mismos archivos: aquí no hay cifras del negocio escritas.
   - Datos preparados trae PLANES_V (versión nueva de un plan, activa, con "ref" para no repetir), CXP (estado de
     cuenta de Magnum/TIBA ya leído; no pisa uno igual o más nuevo), REGLAS y CXPMIO con null (quita fechas a mano).
   - Al subirlo con "Cargar archivo", Ajustes abre "Avanzado"; al aprobar, "Ver en Planes".
   - Derrame: "pagos prioritarios" con el anticipo de todo el pedido no le pone su fecha al balance de las partes.
   - Lo girado con Finkargo (PLANCHINA.fuera) en una semana pasada no sale de los bancos esta semana. */
const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const p=await b.newPage({viewport:{width:1440,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(new Date(2026,9,30,10,0,0));
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('pdf.worker.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.worker.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('pdf.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  ok('versión v2.13.2 arriba',await p.evaluate(()=>document.getElementById('verTag').textContent.trim()==='v2.13.2'));
  /* ---- datos reales del 23/30-oct, sin Magnum ni TIBA cargados ---- */
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(150);
  const avz0=await p.evaluate(()=>{ const A=document.getElementById('cfgV2Avz'); return !!A&&A.tagName==='DETAILS'&&!A.open; });
  ok('Ajustes › Avanzado arranca cerrado',avz0);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV&&PKPREV.res,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  await p.setInputFiles('#v2File',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  await p.evaluate(()=>{ WIZ.work.forEach(w=>{ if(!(''+w.proj).trim()) w.proj='(sin nombre)'; }); wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(800);
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} }); await p.waitForTimeout(300);
  const est0=await p.evaluate(()=>serializeState());

  /* ---- derrame: el anticipo de todo el pedido ---- */
  const dr=await p.evaluate(()=>{
    const g={}; EQ.forEach(e=>{ const id=''+(e.derrame||e.ordenId||''), bs=_v2Base(e); if(bs!==id) (g[e.mfg+'|'+bs]=g[e.mfg+'|'+bs]||[]).push(e); });
    const k=Object.keys(g).find(k=>g[k].length>=2&&g[k].every(e=>e.bl||e.etd)); if(!k) return {sin:true};
    const L=g[k], antes=L.map(e=>({e,a:e.antSaldo,l:e.limitePago,s:e.saldoPrioridad}));
    const lim=new Date(2026,8,1); L.forEach(e=>{ e.antSaldo=1000; e.limitePago=lim; e.saldoPrioridad=1000*L.length; });
    const todas=L.every(e=>_v2SoloAnticipo(e));
    const bal=cjPagos().filter(p=>p.tipo==='balance'&&L.indexOf(p.e)>=0).every(p=>!p.fecha||+_p14D(p.fecha)===+_p14D(_v2LimBal(p.e)));
    L.forEach(e=>{ e.saldoPrioridad=1000*L.length+500; }); const ninguna=L.every(e=>!_v2SoloAnticipo(e));
    L.forEach(e=>{ e.saldoPrioridad=1000; }); const una=L.every(e=>_v2SoloAnticipo(e));
    antes.forEach(x=>{ x.e.antSaldo=x.a; x.e.limitePago=x.l; x.e.saldoPrioridad=x.s; });
    return {k,todas,bal,ninguna,una}; });
  ok('derrame '+(dr.k||'')+': si "pagos prioritarios" es el anticipo de todo el pedido, el balance de cada parte no toma esa fecha',!dr.sin&&dr.todas&&dr.bal);
  ok('derrame: si la cifra no cuadra con los anticipos, no cambia nada; si cuadra con el de la parte, sigue igual que antes',!dr.sin&&dr.ninguna&&dr.una);

  /* ---- Finkargo en una semana pasada ---- */
  const fk=await p.evaluate(()=>{ const s=JSON.parse(JSON.stringify(PLANCHINA)), iso='2026-10-14', m=12345;
    PLANCHINA[iso]={nexus:m}; const a=p14Calc('pago').R.china.v[0];
    PLANCHINA[iso]={nexus:m,fuera:m}; const X=p14Calc('pago'), c=X.R.china.v[0], it=(X.R.china.it[0]||[]).some(x=>/Finkargo/.test(x.txt)&&Math.round(-x.usd)===m);
    PLANCHINA=s; return {d:Math.round(a-c),m,it}; });
  ok('un giro de una semana pasada pagado con Finkargo no sale de los bancos esta semana (baja '+fk.d+' de '+fk.m+')',fk.d===fk.m&&fk.it);

  /* ---- el paquete: se arma con los lectores de la herramienta ---- */
  const b64=x=>fs.readFileSync(x).toString('base64');
  const pk=await p.evaluate(async([mp,tx])=>{ const u8=s=>{ const bin=atob(s), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; };
    const mag=await magLeerPdf(new File([u8(mp)],'MAG.pdf')), tiba=tibaLeerExcel(u8(tx).buffer,'TIBA.xlsx');
    const mio={}; mag.facturas.forEach(f=>{ mio['magnum:'+f.id]={planFecha:null,partes:null}; });
    return {tipo:'zentrack-datos',version:2,datos:{CXP:{magnum:mag,tiba},REGLAS:{magnum:{tipo:'maxMora',dias:30}},CXPMIO:mio,
      PLANES_V:[{cp:'pago:eagle',ref:'prueba-z24',nombre:'Plan prueba',fecha:'2026-10-30',origen:'Acordado',activar:true,real:{0:1000},
        lineas:[{fecha:'2026-10-29',monto:30000},{fecha:'2026-11-12',monto:20000},{fecha:'2026-11-26',monto:10000}]}]}}; },[b64(__dirname+'/MAG.pdf'),b64(__dirname+'/TIBA.xlsx')]);
  fs.writeFileSync(__dirname+'/DATOS_Z24.json',JSON.stringify(pk));
  /* las fechas a mano que se quitan: solo las de facturas que vienen en el paquete; las demás no se tocan */
  const K=Object.keys(pk.datos.CXPMIO);
  const antes=await p.evaluate(K=>({pc:JSON.stringify(PLANCHINA),mio:K.filter(k=>CXPMIO[k]&&(CXPMIO[k].planFecha||CXPMIO[k].partes)).length,
    otros:JSON.stringify(Object.keys(CXPMIO).filter(k=>K.indexOf(k)<0).sort().map(k=>[k,CXPMIO[k]])),act:_v3Cp('pago:eagle').act}),K);
  await p.evaluate(()=>{ const A=document.getElementById('cfgV2Avz'); if(A) A.open=false; navTo('hoy'); window.scrollTo(0,0); });
  await p.setInputFiles('#v2File',['DATOS_Z24.json']); await p.waitForFunction(()=>PKPREV&&(PKPREV.res||PKPREV.error),null,{timeout:10000}); await p.waitForTimeout(200);
  const pv=await p.evaluate(()=>{ const a=document.getElementById('cfgV2Avz'), bx=document.getElementById('pkBox'), r=bx.getBoundingClientRect();
    return {res:PKPREV.res||[],err:PKPREV.error||'',abierto:!!(a&&a.open),visible:r.top<innerHeight&&r.bottom>0,config:document.getElementById('v-config').classList.contains('on')}; });
  ok('"Cargar archivo" con el .json abre Ajustes › Avanzado y deja a la vista lo que se va a agregar',pv.config&&pv.abierto&&pv.visible&&!pv.err);
  const tiene=re=>pv.res.some(t=>re.test(t)); if(process.env.Z24DEBUG) console.log(pv.res.join(' ;; '),antes.mio);
  ok('lo que se va a agregar: estado de cuenta de Magnum y de TIBA, la regla, las fechas a mano que se quitan ('+antes.mio+') y la versión nueva de Eaglerise',
    tiene(/^Magnum · estado de cuenta del .* facturas · COP/)&&tiene(/^TIBA · estado de cuenta .*US\$/)&&tiene(/^Magnum · regla: máx\. 30 días/)
    &&tiene(new RegExp('^Magnum · quita la fecha a mano de '+antes.mio+' factura'))&&tiene(/^Eaglerise · versión nueva "Plan prueba" · 3 pagos · US\$ 60,000 .*queda en la Caja; la versión a · Plan de giros se guarda/)&&!tiene(/^Fechas planeadas/));
  await p.evaluate(()=>pkAplicar()); await p.waitForTimeout(300);
  const ap=await p.evaluate(pkS=>{ const pk=JSON.parse(pkS), d=pk.datos, e=_v2Plan('pago:eagle'), v=e.versiones.find(x=>x.ref==='prueba-z24');
    const c=_v3Cp('pago:eagle'), L=_v3Act(c);
    return {act:e.activa===v.id&&c.act===v.id&&v.estado==='activo',lin:L.map(l=>l.f+' '+l.m).join(','),real:+_v3Real()[v.lineas[0].id]===1000,
      mag:CXP.magnum&&CXP.magnum.corte===d.CXP.magnum.corte&&CXP.magnum.facturas.length===d.CXP.magnum.facturas.length&&CXP.magnum.cupo===d.CXP.magnum.cupo,
      tiba:CXP.tiba&&CXP.tiba.corte===d.CXP.tiba.corte&&CXP.tiba.facturas.length===d.CXP.tiba.facturas.length,
      mio:Object.keys(d.CXPMIO).filter(k=>CXPMIO[k]&&(CXPMIO[k].planFecha||CXPMIO[k].partes)).length,
      otros:JSON.stringify(Object.keys(CXPMIO).filter(k=>!(k in d.CXPMIO)).sort().map(k=>[k,CXPMIO[k]])),pc:JSON.stringify(PLANCHINA),
      regla:REGLAS.magnum.tipo==='maxMora'&&REGLAS.magnum.dias===30,ir:!!document.querySelector('#pkBox .pk24-ir button')}; },JSON.stringify(pk));
  ok('Eaglerise: la versión nueva queda activa en la Caja, con sus 3 pagos y lo ya girado del primero',ap.act&&ap.lin==='2026-10-29 30000,2026-11-12 20000,2026-11-26 10000'&&ap.real);
  ok('la versión "a" (tu plan de giros) se guarda tal cual',ap.pc===antes.pc);
  ok('Magnum y TIBA: el estado de cuenta entra igual que al cargar el archivo (corte, facturas, cupo)',ap.mag&&ap.tiba);
  ok('Magnum: las fechas a mano del plan anterior se quitan y manda la regla de 30 días; lo demás de CXPMIO no se toca',ap.mio===0&&ap.regla&&ap.otros===antes.otros);
  /* la Caja: Magnum semana a semana = regla (vence + 30 días; lo que ya pasó, esta semana) */
  const cj=await p.evaluate(()=>{ const X=p14Calc('pago'), N=X.W.length, esp=new Array(N).fill(0); let tarde=0;
    cxpActivas('magnum').forEach(f=>{ let d=addD(_p14D(f.vence),30); if(d<TODAY) d=TODAY; const i=Math.floor(days(X.W[0],_p14Lun(d))/7); if(i<N) esp[i]+=_cxpUSD(f); else tarde+=_cxpUSD(f); });
    const dif=X.R.mag.v.map((v,i)=>Math.abs(v-esp[i])).reduce((a,b)=>Math.max(a,b),0);
    const c=_v3Cp('pago:eagle'), w0=_v3Act(c).filter(l=>_v3Wk(l.f)<=0).reduce((a,l)=>a+l.m-(+_v3Real()[l.id]||0),0);
    const it=(X.R.china.it[0]||[]).filter(x=>/Eaglerise \(plan\)/.test(x.txt)).reduce((a,x)=>a+x.usd,0);
    return {dif:Math.round(dif),w0:Math.round(w0),it:Math.round(it)}; });
  ok('Caja: Magnum semana a semana igual a la regla de 30 días sobre el estado de cuenta (dif. máx. '+cj.dif+')',cj.dif<=1);
  ok('Caja: Eaglerise esta semana = lo que falta de los giros del plan ('+cj.it+' = '+cj.w0+')',cj.it===cj.w0&&cj.w0>0);
  ok('al aprobar sale "Ver en Planes"',ap.ir);
  const vp=await p.evaluate(()=>{ document.querySelector('#pkBox .pk24-ir button').click(); const on=document.querySelector('.z13-cp.on'); return {planes:document.getElementById('v-planes').classList.contains('on'),cp:Z213.cp,on:on&&on.dataset.cp,y:window.scrollY}; });
  ok('"Ver en Planes" abre Planes en las cuotas de Eaglerise, arriba de la página (v2.13)',vp.planes&&vp.cp==='pago:eagle'&&vp.on==='pago:eagle'&&vp.y===0);
  await p.evaluate(()=>z26Cerrar());

  /* ---- subirlo otra vez no repite nada; uno más viejo no pisa ---- */
  const rep=await p.evaluate(async pkS=>{ const c0=CXP.magnum.cargado, nv=_v2Plan('pago:eagle').versiones.length;
    PKPREV=Object.assign(pkLeer(JSON.parse(pkS)),{archivo:'otra vez'}); const res=PKPREV.res.slice(); pkAplicar();
    const pk=JSON.parse(pkS); pk.datos.CXP.magnum.corte='2026-01-15'; pk.datos.CXP.magnum.facturas=pk.datos.CXP.magnum.facturas.slice(0,2); delete pk.datos.PLANES_V;
    const r2=pkLeer(pk).res; PKPREV=Object.assign(pkLeer(pk),{archivo:'viejo'}); pkAplicar();
    return {res,nv0:nv,nv:_v2Plan('pago:eagle').versiones.length,c0,c:CXP.magnum.cargado,n:CXP.magnum.facturas.length,r2}; },JSON.stringify(pk));
  ok('subirlo otra vez: "ya estaba" / "ya tienes ese corte", sin versión repetida',rep.nv===rep.nv0&&rep.res.some(t=>/ya estaba: no se repite/.test(t))&&rep.res.some(t=>/ya tienes ese corte/.test(t)));
  ok('un estado de cuenta más viejo que el cargado no lo pisa',rep.n>2&&rep.r2.some(t=>/ya tienes uno más nuevo/.test(t)));

  /* ---- se guarda y un estado viejo abre ---- */
  const rt=await p.evaluate(s0=>{ const s=serializeState(), o=JSON.parse(s), falta=Object.keys(JSON.parse(s0)).filter(k=>!(k in o)), nuevas=Object.keys(o).filter(k=>!(k in JSON.parse(s0)));
    applyState(JSON.parse(s)); const v=_v2Plan('pago:eagle').versiones.find(x=>x.ref==='prueba-z24');
    return {falta,nuevas,ok:!!v&&_v3Cp('pago:eagle').act===v.id}; },est0);
  ok('se guarda todo sin llaves nuevas ni quitar ninguna; la versión sigue activa al recargar'+(rt.falta.length?' · faltan '+rt.falta:'')+(rt.nuevas.length?' · nuevas '+rt.nuevas:''),!rt.falta.length&&!rt.nuevas.length&&rt.ok);
  const viejo=await p.evaluate(s=>{ applyState(JSON.parse(s)); refreshAll(); Z213.vista='12';navTo('planes'); renderPlanes(); navTo('caja'); return !!document.getElementById('z26Plan')&&!!document.getElementById('z26Caja'); },est0);
  ok('un estado de antes de cargar el paquete abre igual',viejo);
  ok('sin errores en la página',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  try{ fs.unlinkSync(__dirname+'/DATOS_Z24.json'); }catch(e){}
  console.log(n+' OK · '+f+' fallas'); await b.close(); process.exit(f?1:0);
})();
