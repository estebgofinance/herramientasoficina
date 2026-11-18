/* v2.8.1 · Actualización preparada: se aplica sola al abrir la herramienta, una sola vez.
   Hoy fijado en 30-oct-2026. Usa RESP.json, DET23.xlsx y OR23.xlsx (fuera del repo).
   Se simula Apps Script (google.script.run) para probar el camino real: cargar del servidor → aplicar → guardar.
   - Solo corre después de leer el estado del servidor; nunca con el estado vacío ni si el servidor falla.
   - Pasos: el detailed y el ORDER REPORT por el asistente (aprobado solo) y datos preparados (precios).
   - Queda anotado en CONFIG.cambios y no se repite al volver a abrir. */
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
  const resp=fs.readFileSync(__dirname+'/RESP.json','utf8');
  const pend={id:'prueba',titulo:'Actualización de prueba aplicada',resumen:'Detailed, order report y precios.',pasos:[
    {tipo:'excel',nombre:'detailed y order report',archivos:[{nombre:'DET23.xlsx',b64:fs.readFileSync(__dirname+'/DET23.xlsx').toString('base64')},{nombre:'OR23.xlsx',b64:fs.readFileSync(__dirname+'/OR23.xlsx').toString('base64')}]},
    {tipo:'json',nombre:'precios',obj:{tipo:'zentrack-datos',version:2,datos:{PRECIOS:[{def:{margen:0.1,mExtra:0.25}},{ped:'11-4',mfg:'Singsun',flete:10000,aduana:300,extra:5000}]}}}]};
  /* Apps Script simulado: loadState devuelve el estado guardado; saveState lo guarda */
  await p.evaluate(({resp,pend})=>{ window._srv={estado:resp,guardados:0,falla:false};
    const run=()=>{ const o={}; o.withSuccessHandler=fn=>{ o.s=fn; return o; }; o.withFailureHandler=fn=>{ o.f=fn; return o; };
      o.loadState=()=>setTimeout(()=>{ if(window._srv.falla) o.f&&o.f(new Error('sin servidor')); else o.s&&o.s(window._srv.estado); },20);
      o.saveState=x=>setTimeout(()=>{ window._srv.estado=x; window._srv.guardados++; o.s&&o.s(); },20); return o; };
    window.google={script:{get run(){ return run(); }}}; window.ZT_PENDIENTE=pend; },{resp,pend});
  /* abrir: cargar del servidor */
  await p.evaluate(()=>loadFromServer());
  await p.waitForFunction(()=>CONFIG.cambios&&CONFIG.cambios['pendiente:prueba'],null,{timeout:150000}).catch(()=>{});
  await p.waitForTimeout(1500);
  const r1=await p.evaluate(()=>{ const e=EQ.find(x=>x.derrame==='11-4'), s=JSON.parse(window._srv.estado||'{}');
    return {flag:!!(CONFIG.cambios&&CONFIG.cambios['pendiente:prueba']),pasos:(CONFIG.cambios['pendiente:prueba']||{}).pasos,eq:EQ.length,p:e?precioVenta(e):null,
      esp:e?Math.round(((_pcCosto(e)+10300)*1.1+6250)*100)/100:null,est:e?prEstado(e):null,
      guardado:!!(s.CONFIG&&s.CONFIG.cambios&&s.CONFIG.cambios['pendiente:prueba'])&&!!(s.PRECIO&&Object.keys(s.PRECIO).length),
      dlg:(document.getElementById('z26Dlg')||{}).textContent||'',wiz:!document.querySelector('#verifyModal.on,#verify.on')}; });
  ok('al abrir, la actualización se aplica sola: asistente aprobado y precios ('+(r1.pasos||[]).join(' + ')+')',r1.flag&&(r1.pasos||[]).length===2&&r1.eq>0);
  ok('el precio preparado quedó puesto ('+r1.p+')',r1.p===r1.esp&&r1.est==='provisional');
  ok('queda guardado en el servidor, con la marca de hecho',r1.guardado);
  ok('avisa con un mensaje propio',/Actualización de prueba aplicada/.test(r1.dlg));
  await p.evaluate(()=>{ const d=document.querySelector('#z26Dlg [data-r="1"]'); if(d) d.click(); });
  /* volver a abrir: no se repite */
  const antes=await p.evaluate(()=>({g:window._srv.guardados,eq:EQ.length}));
  await p.evaluate(()=>{ WIZ.loaded=false; WIZ.work=null; loadFromServer(); }); await p.waitForTimeout(3500);
  const r2=await p.evaluate(()=>({wiz:!!WIZ.loaded,eq:EQ.length,dlg:!!document.getElementById('z26Dlg')}));
  ok('al volver a abrir no se repite',!r2.wiz&&r2.eq===antes.eq&&!r2.dlg);
  /* el paquete llega después de cargar el estado: se aplica al llegar */
  await p.evaluate(()=>{ window.ZT_PENDIENTE=null; window._srv.falla=false; loadFromServer(); }); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ window.ZT_PENDIENTE={id:'tarde',titulo:'Tarde',resumen:'',pasos:[{tipo:'json',nombre:'márgenes',obj:{tipo:'zentrack-datos',version:2,datos:{PRECIOS:[{def:{margen:0.2,mExtra:0.2}}]}}}]}; _ztpAlLlegar(); });
  await p.waitForFunction(()=>CONFIG.cambios&&CONFIG.cambios['pendiente:tarde'],null,{timeout:20000}).catch(()=>{});
  ok('si el paquete termina de llegar después del estado, se aplica al llegar',await p.evaluate(()=>!!(CONFIG.cambios['pendiente:tarde'])&&PRECIO.__def&&PRECIO.__def.margen===0.2));
  await p.evaluate(()=>{ const d=document.querySelector('#z26Dlg [data-r="1"]'); if(d) d.click(); });
  /* v2.9.2: varios paquetes a la vez y un paso "abono" que no se repite */
  await p.evaluate(()=>{ const d=document.querySelector('#z26Dlg [data-r="1"]'); if(d) d.click(); window._ecaN=ECA.length;
    window.ZT_PENDIENTE=[{id:'tarde',pasos:[]},{id:'abono',titulo:'Abono',resumen:'',pasos:[{tipo:'abono',nombre:'abono',cliente:'Solenium',fecha:'2026-10-30',usd:4321,nota:'abono preparado'}]}]; _ztpAlLlegar(); });
  await p.waitForFunction(()=>CONFIG.cambios&&CONFIG.cambios['pendiente:abono'],null,{timeout:20000}).catch(()=>{});
  const ab=await p.evaluate(()=>({n:ECA.length-window._ecaN,a:ECA.filter(a=>a.nota==='abono preparado').length}));
  await p.evaluate(()=>{ const d=document.querySelector('#z26Dlg [data-r="1"]'); if(d) d.click(); delete CONFIG.cambios['pendiente:abono']; _ztpAlLlegar(); });
  await p.waitForFunction(()=>CONFIG.cambios&&CONFIG.cambios['pendiente:abono'],null,{timeout:20000}).catch(()=>{});
  ok('v2.9.2: varios paquetes; un abono preparado entra una vez y no se repite aunque se vuelva a correr',ab.n===1&&ab.a===1&&await p.evaluate(()=>ECA.filter(a=>a.nota==='abono preparado').length===1));
  await p.evaluate(()=>{ const d=document.querySelector('#z26Dlg [data-r="1"]'); if(d) d.click(); });
  /* si el servidor falla, no corre */
  await p.evaluate(()=>{ window.ZT_PENDIENTE=Object.assign({},window.ZT_PENDIENTE,{id:'otra'}); window._srv.falla=true; WIZ.loaded=false; WIZ.work=null; loadFromServer(); }); await p.waitForTimeout(3500);
  ok('si el servidor no responde, no se aplica nada',await p.evaluate(()=>!CONFIG.cambios['pendiente:otra']&&!WIZ.loaded));
  /* con el estado vacío, no corre */
  ok('con el estado vacío no se aplica nada',await p.evaluate(async()=>{ const s=EQ.splice(0,EQ.length); const r=await ztPendiente(); EQ.push(...s); return r===null&&!CONFIG.cambios['pendiente:otra']; }));
  ok('sin errores de página',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exit(f?1:0);
})();
