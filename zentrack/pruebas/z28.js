/* v2.8 · Precios provisionales y facturados.
   Hoy fijado en 30-oct-2026. Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo).
   - Estados: sin precio · provisional (todo precio sin factura) · facturado · standby.
   - Precio provisional = (costo China + flete + aduana) × (1 + margen) + Zentrack × (1 + su margen).
     Los márgenes por defecto llegan en los datos preparados (aquí, cifras inventadas: 10 % y 25 %).
   - Registrar la factura pone el precio real; lo abonado se queda y el saldo se recalcula.
   - Datos preparados PRECIOS; standby saca el pedido del estado de cuenta.
   - El PDF y el Excel del cliente no dicen qué es provisional. Llave nueva: PRECIO. */
const {chromium}=require('playwright-core');const fs=require('fs');const os=require('os');const path=require('path');
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
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  ok('un estado viejo (sin PRECIO) abre sin errores',errs.length===0&&await p.evaluate(()=>typeof PRECIO==='object'&&!Object.keys(PRECIO).length));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(100);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV&&PKPREV.res,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  await p.setInputFiles('#v2File',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  await p.evaluate(()=>{ WIZ.work.forEach(w=>{ if(!(''+w.proj).trim()) w.proj='(sin nombre)'; }); wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(800);
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} }); await p.waitForTimeout(200);
  const llaves=await p.evaluate(()=>Object.keys(JSON.parse(serializeState())));
  ok('el estado solo gana la llave PRECIO',llaves.includes('PRECIO'));

  /* dos pedidos de Solenium para probar: uno sin precio y uno en producción con precio */
  const pk=await p.evaluate(()=>{ const S=EQ.filter(e=>e.cliente==='Solenium'&&cobroModo(e)!=='especial');
    let sp=S.find(e=>!(precioVenta(e)>0)); const otros=S.filter(e=>precioVenta(e)>0&&!_prDespachado(e));
    if(!sp){ sp=otros.shift(); sp.precioVenta=0; } const pr=otros[0], st=otros[1];
    return {sp:kOf(sp),spPed:sp.derrame,spMfg:sp.mfg,pr:kOf(pr),st:kOf(st),stPed:st.derrame,stMfg:st.mfg,est:S.filter(e=>precioVenta(e)>0).every(e=>prEstado(e)==='provisional'),sinEst:prEstado(sp)}; });
  ok('al arrancar todo precio es provisional y lo que no tiene precio queda "sin precio"',pk.est&&pk.sinEst==='sin');

  /* datos preparados PRECIOS */
  const arch=path.join(os.tmpdir(),'z28_precios.json');
  fs.writeFileSync(arch,JSON.stringify({tipo:'zentrack-datos',version:2,datos:{PRECIOS:[{def:{margen:0.1,mExtra:0.25}},{ped:pk.spPed,mfg:pk.spMfg,flete:10000,aduana:300,extra:5000,nota:'prueba'},{ped:pk.stPed,mfg:pk.stMfg,standby:true}]}}));
  const s0=await p.evaluate(()=>({t:ecTotales('Solenium'),n:ecFilas('Solenium').filas.length}));
  await p.evaluate(()=>{ PKPREV=null; navTo('config'); }); await p.setInputFiles('#pkFile',arch); await p.waitForFunction(()=>PKPREV&&(PKPREV.res||PKPREV.error),null,{timeout:10000});
  const pv=await p.evaluate(()=>PKPREV.res||[]);
  ok('la vista previa explica los márgenes, el cálculo y el standby',pv.some(x=>/^Márgenes por defecto · 10 % sobre el costo · Zentrack 25 %/.test(x))&&pv.some(x=>/Precio provisional · .*× 1\.10 \+ Zentrack 5,000 × 1\.25 = US\$/.test(x))&&pv.some(x=>/^Standby · /.test(x)));
  await p.evaluate(()=>pkAplicar()); await p.waitForTimeout(200);
  const a1=await p.evaluate(k=>{ const e=_prEq(k), esp=Math.round(((_pcCosto(e)+10300)*1.1+6250)*100)/100; return {precio:precioVenta(e),esp,est:prEstado(e),h:(PRECIO[k].hist||[]).length,en:ecFilas('Solenium').filas.some(x=>x.k===k)}; },pk.sp);
  ok('precio provisional = (China + flete + aduana) × (1 + margen) + Zentrack × (1 + su margen) ('+a1.precio+')',a1.precio===a1.esp&&a1.est==='provisional'&&a1.h===1&&a1.en);
  const a2=await p.evaluate(k=>({est:prEstado(_prEq(k)),en:ecFilas('Solenium').filas.some(x=>x.k===k)}),pk.st);
  ok('standby: el pedido sale del estado de cuenta',a2.est==='standby'&&!a2.en);
  const s1=await p.evaluate(()=>({t:ecTotales('Solenium'),n:ecFilas('Solenium').filas.length}));
  ok('el estado de cuenta ya trae lo que antes no tenía precio',s1.n===s0.n&&Math.abs(s1.t.valor-s0.t.valor-a1.precio+await p.evaluate(k=>precioVenta(_prEq(k)),pk.st))<0.5);
  await p.evaluate(()=>{ PKPREV=null; }); await p.setInputFiles('#pkFile',arch); await p.waitForFunction(()=>PKPREV&&(PKPREV.res||PKPREV.error),null,{timeout:10000}); await p.evaluate(()=>pkAplicar()); await p.waitForTimeout(150);
  ok('cargar el mismo archivo otra vez no cambia nada',await p.evaluate(x=>{ const e=_prEq(x.k); return precioVenta(e)===x.p&&PRECIO[x.k].hist.length===1; },{k:pk.sp,p:a1.precio}));

  /* la tabla de precios en Clientes */
  await p.evaluate(()=>{ navTo('clientes'); selCliData('Solenium'); }); await p.waitForTimeout(300);
  const tb=await p.evaluate(()=>{ const d=document.querySelector('.pr28'); return d?{open:d.open,secs:[...d.querySelectorAll('tr.sec')].map(x=>x.textContent.split(' · ')[0]),res:d.querySelector('summary').textContent}:null; });
  ok('Clientes: tabla "Precios" con despachados sin factura, provisionales y standby ('+(tb&&tb.secs.join(', '))+')',!!tb&&tb.open&&tb.secs.includes('Despachados sin factura')&&tb.secs.includes('Provisionales')&&tb.secs.includes('Standby')&&/despachados? sin factura/.test(tb.res));
  ok('en pantalla el valor dice "provisional"; en el PDF del cliente no',await p.evaluate(()=>/provisional/.test(document.getElementById('v-clientes').innerHTML)&&!/provisional/i.test(_ecPdfHTML('Solenium'))));
  /* calcular desde la tabla: el cálculo se guarda; el precio cambia con "Usar este precio" */
  await p.click('.pr28 [data-pa="calc"][data-k="'+pk.pr+'"]'); await p.waitForTimeout(200);
  const p0=await p.evaluate(k=>precioVenta(_prEq(k)),pk.pr);
  await p.fill('.pr28 [data-pr="flete"][data-k="'+pk.pr+'"]','10,000'); await p.press('.pr28 [data-pr="flete"][data-k="'+pk.pr+'"]','Tab'); await p.waitForTimeout(250);
  const c1=await p.evaluate(k=>({p:precioVenta(_prEq(k)),calc:PRECIO[k]&&PRECIO[k].calc&&PRECIO[k].calc.flete,abierto:!!document.querySelector('.pr28 tr.pr28-ff [data-pa="usar"]')}),pk.pr);
  ok('escribir el flete guarda el cálculo sin cambiar el precio todavía',c1.p===p0&&c1.calc===10000&&c1.abierto);
  await p.click('.pr28 [data-pa="usar"][data-k="'+pk.pr+'"]'); await p.waitForTimeout(250);
  const c2=await p.evaluate(k=>{ const e=_prEq(k); return {p:precioVenta(e),esp:Math.round((_pcCosto(e)+10000)*1.1*100)/100,toast:(document.getElementById('z26Toast')||{}).textContent||''}; },pk.pr);
  ok('"Usar este precio" lo aplica ('+c2.p+'), con Deshacer',c2.p===c2.esp&&/Deshacer/.test(c2.toast));
  await p.evaluate(()=>z26Deshacer()); await p.waitForTimeout(150);
  ok('Deshacer vuelve al precio anterior',await p.evaluate(x=>precioVenta(_prEq(x.k))===x.p,{k:pk.pr,p:p0}));
  /* registrar la factura */
  const sa0=await p.evaluate(()=>ecTotales('Solenium').saldo);
  await p.evaluate(k=>document.querySelector('.pr28 [data-pa="facturar"][data-k="'+k+'"]').click(),pk.sp); await p.waitForTimeout(200);
  await p.fill('.pr28 [data-pf="num"]','FE-1234'); await p.fill('.pr28 [data-pf="valor"]','100,000');
  await p.click('.pr28 [data-pa="facOk"]'); await p.waitForTimeout(250);
  const fa=await p.evaluate(k=>{ const e=_prEq(k), r=PRECIO[k]; return {est:prEstado(e),p:precioVenta(e),num:r.fac.num,prov:r.fac.prov,h:r.hist.length,saldo:ecTotales('Solenium').saldo,
    tag:!!document.querySelector('.pr28 tr.pr28-facturado'),pill:/ajuste/.test(document.querySelector('.pr28').textContent)}; },pk.sp);
  ok('factura: el precio pasa al real (100,000), queda el número y el ajuste frente al provisional',fa.est==='facturado'&&fa.p===100000&&fa.num==='FE-1234'&&fa.prov===a1.precio&&fa.h===2&&fa.tag&&fa.pill);
  ok('el saldo se recalcula solo ('+Math.round(fa.saldo-sa0)+')',Math.abs((fa.saldo-sa0)-(100000-a1.precio))<0.5);
  await p.evaluate(()=>{ PKPREV=null; navTo('config'); }); await p.setInputFiles('#pkFile',arch); await p.waitForFunction(()=>PKPREV&&(PKPREV.res||PKPREV.error),null,{timeout:10000});
  const pv2=await p.evaluate(()=>PKPREV.res||[]); await p.evaluate(()=>pkAplicar()); await p.waitForTimeout(150);
  ok('un pedido facturado no lo cambian los datos preparados',pv2.some(x=>/ya está facturado/.test(x))&&await p.evaluate(k=>precioVenta(_prEq(k))===100000,pk.sp));
  /* reactivar el standby */
  await p.evaluate(()=>{ navTo('clientes'); selCliData('Solenium'); }); await p.waitForTimeout(200);
  await p.evaluate(k=>document.querySelector('.pr28 [data-pa="activar"][data-k="'+k+'"]').click(),pk.st); await p.waitForTimeout(200);
  ok('Reactivar devuelve el pedido al estado de cuenta',await p.evaluate(k=>prEstado(_prEq(k))==='provisional'&&ecFilas('Solenium').filas.some(x=>x.k===k),pk.st));
  /* guardar y abrir */
  const rt=await p.evaluate(k=>{ const s=serializeState(); applyState(JSON.parse(s)); refreshAll(); const e=_prEq(k); return {est:prEstado(e),p:precioVenta(e)}; },pk.sp);
  ok('guardar y abrir conserva la factura y el precio',rt.est==='facturado'&&rt.p===100000);
  const fz=await p.evaluate(()=>{ const bad=[]; document.querySelectorAll('.pr28 *').forEach(e=>{ const s=parseFloat(getComputedStyle(e).fontSize); if(e.children.length===0&&e.textContent.trim()&&s<13) bad.push(e.tagName+':'+e.textContent.slice(0,20)); }); return bad; });
  ok('nada por debajo de 13 px en la tabla de precios'+(fz.length?' '+fz.slice(0,3).join(' | '):''),fz.length===0);
  ok('sin errores de página',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  try{ fs.unlinkSync(arch); }catch(e){}
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exit(f?1:0);
})();
