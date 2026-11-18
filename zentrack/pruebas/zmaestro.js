/* v1.10 · Maestro de órdenes + estados de cuenta: dos ventanas sobre los mismos datos.
   Lo que se cambia en el Maestro se ve en el estado de cuenta y al revés; se salta de una
   fila a la misma fila en la otra ventana; filtros; mover varios; reparación de tildes. */
const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const p=await b.newPage({viewport:{width:1400,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['DET3.xlsx','OR2.xlsx']);
  await p.waitForFunction(()=>WIZ.loaded&&WIZ.work&&WIZ.work.length,null,{timeout:60000});
  await p.evaluate(()=>{wizGo(2);wizApprove();CLI['Solenium'].interno=true;CLI['Solenium'].term=60;}); await p.waitForTimeout(300);

  ok('el menú queda (v2.6): Tablero, Caja, Planes, Clientes, Proveedores, Pedidos, Ajustes',await p.evaluate(()=>
    [...document.querySelectorAll('nav.tabs button')].filter(b=>b.offsetParent!==null).map(b=>b.textContent.replace(/\s*\d+\s*$/,'').trim()).join('|')==='Tablero|Caja|Planes|Clientes|Proveedores|Pedidos|Ajustes'));
  await p.click('nav.tabs button[data-v="pedidos"]'); await p.waitForTimeout(200);
  const m0=await p.evaluate(()=>({cards:document.querySelectorAll('#maestro .ma-o').length,ords:ORD.filter(o=>(o.equipos||[]).length).length}));
  ok('el Maestro muestra una tarjeta por orden ('+m0.cards+')',m0.cards===m0.ords&&m0.cards>0);
  const k=await p.evaluate(()=>{const e=EQ.find(x=>x.cliente==='Solenium'&&x.mfg==='Singsun'&&x.etd&&!gpDeEq(x));const o=ORD.find(z=>z.equipos.indexOf(e)>=0);maToggle(_maOK(o));return kOf(e);});
  ok('al abrir una orden salen sus pedidos con todo editable',await p.evaluate(k=>{const tr=document.querySelector('#maestro tr[data-k="'+CSS.escape(k)+'"]');
    return !!tr&&!!tr.querySelector('input[data-foco^="ma-pj-"]')&&!!tr.querySelector('input[data-foco^="ma-pv-"]')&&!!tr.querySelector('select.cb-sel');},k));
  /* precio y proyecto escritos en el Maestro → estado de cuenta */
  await p.evaluate(k=>{const tr=document.querySelector('#maestro tr[data-k="'+CSS.escape(k)+'"]');
    const pv=tr.querySelector('input[data-foco^="ma-pv-"]'); pv.value='100000'; pv.dispatchEvent(new Event('change'));
    const pj=document.querySelector('#maestro tr[data-k="'+CSS.escape(k)+'"] input[data-foco^="ma-pj-"]'); pj.value='Proyecto Prueba'; pj.dispatchEvent(new Event('change'));},k);
  const ec1=await p.evaluate(k=>{selCliData('Solenium');const tr=document.querySelector('#clDetail tr[data-k="'+CSS.escape(k)+'"]');
    return tr?tr.textContent:'';},k);
  ok('precio y proyecto puestos en el Maestro salen en el estado de cuenta',/100,000\.00/.test(ec1)&&/Proyecto Prueba/.test(ec1));
  /* abono en el estado de cuenta → Maestro */
  await p.evaluate(k=>{const i=document.querySelector('#clDetail input[data-foco="ec-abonado-'+k+'"]');i.value='40000';i.dispatchEvent(new Event('change'));},k);
  ok('el abono escrito en el estado de cuenta baja el cobro en el Maestro',await p.evaluate(k=>{
    const tr=document.querySelector('#maestro tr[data-k="'+CSS.escape(k)+'"]'); return !!tr&&/60,000\.00/.test(tr.lastElementChild.previousElementSibling.textContent);},k));
  /* saltos */
  await p.evaluate(k=>maIrEC('Solenium',k),k); await p.waitForTimeout(200);
  ok('"EC →" lleva al estado de cuenta del cliente, a esa fila',await p.evaluate(k=>document.getElementById('v-clientes').classList.contains('on')&&ECSEL==='Solenium'
    &&!!document.querySelector('#clDetail tr[data-k="'+CSS.escape(k)+'"]'),k));
  await p.evaluate(k=>{document.querySelector('#clDetail tr[data-k="'+CSS.escape(k)+'"] .ec9-link').click();},k); await p.waitForTimeout(200);
  ok('clic en el pedido del estado de cuenta lleva al Maestro, a esa fila',await p.evaluate(k=>document.getElementById('v-pedidos').classList.contains('on')
    &&!!document.querySelector('#maestro tr[data-k="'+CSS.escape(k)+'"]'),k));
  /* cliente cambiado en el Maestro */
  await p.evaluate(k=>{const s=document.querySelector('#maestro tr[data-k="'+CSS.escape(k)+'"] select.ma-sel');s.value='Ext';s.dispatchEvent(new Event('change'));},k);
  ok('cambiar el cliente en el Maestro lo pasa al estado de cuenta del otro',await p.evaluate(k=>ecFilas('Ext').filas.some(f=>f.k===k)&&!ecFilas('Solenium').filas.some(f=>f.k===k),k));
  /* filtros */
  ok('filtro "Sin precio" deja solo pedidos sin precio',await p.evaluate(()=>{MA.solo='sinprecio';renderLedger();
    const ks=[...document.querySelectorAll('#maestro tr[data-k]')].map(t=>t.getAttribute('data-k'));
    const r=ks.length>0&&ks.every(k=>{const e=EQ.find(x=>kOf(x)===k);return !(precioVenta(e)>0);}); MA.solo='';renderLedger(); return r;}));
  ok('buscar filtra y abre lo que encuentra',await p.evaluate(()=>{MA.q='La Elvira';renderLedger();
    const ks=[...document.querySelectorAll('#maestro tr[data-k]')].map(t=>t.getAttribute('data-k')); MA.q='';renderLedger();
    return ks.length>0&&ks.every(k=>/elvira/i.test(EQ.find(x=>kOf(x)===k).proj));}));
  /* mover varios */
  const mv=await p.evaluate(()=>{const es=EQ.filter(e=>e.cliente==='Solenium').slice(0,2);es.forEach(e=>PCSEL.add(kOf(e)));renderLedger();
    document.getElementById('pcDest').value='Ext'; pcMover(); return es.every(e=>e.cliente==='Ext')&&PCSEL.size===0;});
  ok('marcar varios y "Mover a" los pasa de cliente',mv);
  /* el estado de cuenta: agrupado, con próximos cobros */
  ok('el estado de cuenta se agrupa por cómo va el cobro',await p.evaluate(()=>{navTo('clientes');selCliData('Ext');
    return document.querySelectorAll('#clDetail tr.ec9-g').length>0;}));
  ok('"Por orden" agrupa por orden',await p.evaluate(()=>{ecVista('orden');const t=[...document.querySelectorAll('#clDetail tr.ec9-g')].map(x=>x.textContent).join('|');ecVista('estado');return /Orden /.test(t);}));
  /* tildes dañadas */
  ok('un nombre con tildes dañadas ("TomÃ¡s") se repara solo al abrir',await p.evaluate(()=>{const s=JSON.parse(serializeState());
    const e=s.ORD[0].equipos[0]; e.proj='Santo TomÃ¡s Sur 1'; applyState(s); return EQ[0].proj==='Santo Tomás Sur 1'||EQ.some(x=>x.proj==='Santo Tomás Sur 1');}));
  ok('sin errores de JS',errs.length===0);
  if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
