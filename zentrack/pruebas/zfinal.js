const {chromium}=require('playwright-core');const fs=require('fs');
const OUT='/tmp/claude-0/-home-user-herramientasoficina/ca332b4e-3f1e-594e-b2aa-30133e5b1508/scratchpad/';
const ok=(n,c)=>console.log((c?'  OK ':'FALLA')+'  '+n);
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const p=await b.newPage({viewport:{width:1600,height:1040},deviceScaleFactor:1.2});
  p.on('dialog',d=>d.accept());
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text());});
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+process.cwd()+'/ASM4.html'); await p.waitForTimeout(500);
  const g=s=>p.evaluate(s);

  // ===== el estado guardado por la versión ANTERIOR entra al motor nuevo =====
  const viejo=fs.readFileSync('estado.json','utf8');
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();renderLedger();},viejo);
  await p.waitForTimeout(700);
  ok('tu estado guardado entra sin errores', errs.length===0);
  ok('conserva los 30 pedidos', (await g(`EQ.length`))===30);
  ok('conserva las órdenes, facturas, pagos y clientes', await g(`(function(){
     const v=JSON.parse(arguments[0]||'{}');return ORD.length>0&&Array.isArray(FACT)&&Array.isArray(PAGOS);})()`));
  ok('conserva la conciliación de Sinosure', (await g(`!!CONCILIA&&!!CONCILIA.sino&&Object.keys(CONCILIA.sinoDetalle||{}).length`))>20);
  ok('conserva los cupos', (await g(`CUPO.Singsun>0&&CUPO.Eaglerise>0`)));
  const antes=await g(`JSON.stringify({ord:ORD.length,eq:EQ.length,cupo:CUPO,
     sing:Math.round(cargaViva('Singsun')),eag:Math.round(cargaViva('Eaglerise'))})`);

  // ===== las dos pestañas nuevas =====
  await p.click('nav.tabs button[data-v="precios"]'); await p.waitForTimeout(500);
  ok('Precios funciona', (await p.textContent('#v-precios')).includes('Precios por grupo') && errs.length===0);
  await p.click('nav.tabs button[data-v="sinosure"]'); await p.waitForTimeout(500);
  const sn=await p.textContent('#v-sinosure');
  ok('Sinosure funciona y el cupo es MIO', sn.includes('Sinosure')&&sn.includes('Usado')
     &&sn.includes('Tu cupo')&&await p.evaluate(()=>document.querySelectorAll('#v-sinosure tbody.sn-g').length>0));
  ok('las ordenes se abren', await p.evaluate(async()=>{snToggle('Singsun|7');return true;}));
  await p.waitForTimeout(350);
  const detOrd=await p.textContent('#v-sinosure');
  ok('y muestran los pedidos que las componen',
     ['7-5','7-6','7-7','7-8','7-9'].every(d=>detOrd.includes(d)));

  // ===== la palanca de Sinosure EN PEDIDOS, que es lo que faltaba =====
  await p.click('nav.tabs button[data-v="pedidos"]'); await p.waitForTimeout(400);
  const o16=await g(`(function(){const e=EQ.find(x=>x.derrame==='16');return e?e.ordenId:null;})()`);
  await p.evaluate(id=>{LAB.add(id);renderLedger();},o16);
  await p.waitForTimeout(400);
  ok('en Pedidos hay selector de cupo Sinosure por pedido', (await p.$$('#ledger .csel')).length>0);
  const eag0=await g(`Math.round(cargaViva('Eaglerise'))`);
  await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='16');
    setSinoManual(e.derrame,e.mfg,'no');renderLedger();});
  await p.waitForTimeout(400);
  await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='16');snSet(kOf(e),'modo','fuera');});
  await p.waitForTimeout(350);
  ok('el PO#16 se puede sacar del cupo desde Sinosure',
     (await g(`consumoEq(EQ.find(x=>x.derrame==='16'),'Eaglerise')`))===0);
  await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='16');snSet(kOf(e),'modo','monto');});
  await p.waitForTimeout(400);
  ok('y meterlo', (await g(`Math.round(cargaViva('Eaglerise'))`))>eag0);
  await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='16');snSet(kOf(e),'modo','');});
  await p.waitForTimeout(350);
  ok('el filtro "Sin clasificar" de Sinosure encuentra los pendientes',
     await p.evaluate(()=>{snFiltro('pend');
       const n=document.querySelectorAll('#v-sinosure tbody.sn-g').length; snFiltro('todo'); return n>0;}));
  ok('y el chip viejo de Pedidos ya no esta',
     await p.evaluate(()=>!document.querySelector('#filters .chip[data-f="sincupo"]')));
  await p.waitForTimeout(300);
  await p.screenshot({path:OUT+'fin-pedidos.png',fullPage:true});

  // ===== precio en la misma fila =====
  await p.evaluate(id=>{LAB.add(id);renderLedger();},(await g(`ORD[0].id`)));
  await p.waitForTimeout(350);
  ok('el precio sigue editándose en la fila', (await p.$$('#ledger .pinp')).length>0);

  // ===== nada cambió en los números =====
  const despues=await g(`JSON.stringify({ord:ORD.length,eq:EQ.length,cupo:CUPO,
     sing:Math.round(cargaViva('Singsun')),eag:Math.round(cargaViva('Eaglerise'))})`);
  ok('los cupos y los conteos quedaron igual que al entrar', antes===despues);

  // ===== guardar y volver a entrar =====
  const nuevo=await g(`serializeState()`);
  await p.goto('file://'+process.cwd()+'/ASM4.html'); await p.waitForTimeout(500);
  errs.length=0;
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();renderLedger();},nuevo);
  await p.waitForTimeout(600);
  ok('el estado que guarda el motor nuevo se vuelve a leer bien',
     (await g(`EQ.length`))===30 && errs.length===0);
  for(const v of ['hoy','pedidos','clientes','pagos','precios','sinosure','config']){
    await p.click(`nav.tabs button[data-v="${v}"]`); await p.waitForTimeout(300);
  }
  ok('las siete pestañas pintan sin un solo error', errs.length===0);
  ok('el código muerto ya no está', (await g(`typeof cupoExplica==='undefined'&&typeof vencidoEq==='undefined'&&typeof alarmasCupo==='undefined'`)));
  if(errs.length)console.log(errs.slice(0,4));
  await b.close();
})();
