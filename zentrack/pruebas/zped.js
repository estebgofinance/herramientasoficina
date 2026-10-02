const {chromium}=require('playwright-core');const fs=require('fs');
const OUT='/tmp/claude-0/-home-user-herramientasoficina/ca332b4e-3f1e-594e-b2aa-30133e5b1508/scratchpad/';
const ok=(n,c)=>console.log((c?'  OK ':'FALLA')+'  '+n);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const p=await b.newPage({viewport:{width:1560,height:1040},deviceScaleFactor:1.3});
  p.on('dialog',d=>d.accept());
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  const g=s=>p.evaluate(s);
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{wizGo(4);wizApprove();document.getElementById('toast').classList.remove('on');});
  await p.waitForTimeout(700);
  await p.click('nav.tabs button[data-v="pedidos"]'); await p.waitForTimeout(400);

  ok('la lista de órdenes pinta', (await p.$$('#ledger tr.ord')).length>0);
  ok('cada orden trae su casilla y su flecha', (await p.$$('#ledger tr.ord .lchk')).length>0
     && (await p.$$('#ledger tr.ord .chev')).length>0);
  await p.click('#ledger tr.ord >> nth=0'); await p.waitForTimeout(350);
  ok('abrir la orden muestra sus pedidos', (await p.$$('#ledger table.ptab tbody tr')).length>0);
  const sub=await p.textContent('#ledger tr.subrow');
  ok('con proyecto, estado, saldo y precio', sub.includes('Proyecto')&&sub.includes('Saldo cupo')&&sub.includes('Precio de venta'));
  ok('el precio es un campo editable en la fila', (await p.$$('#ledger .pinp')).length>0);
  await p.screenshot({path:OUT+'ped1.png'});

  // poner precio directo
  const d0=await g(`(function(){const o=ORD.find(x=>LAB.has(x.id));return o.equipos[0].derrame;})()`);
  await p.fill('#ledger .pinp >> nth=0','198000'); await p.waitForTimeout(700);
  ok('escribir el precio lo guarda sin tener que salir del campo',
     (await g(`EQ.find(e=>e.derrame===${JSON.stringify(d0)}).precioVenta`))===198000);
  ok('y se refleja en precioVenta()',
     (await g(`precioVenta(EQ.find(e=>e.derrame===${JSON.stringify(d0)}))`))===198000);
  ok('el foco se queda en el campo mientras escribes',
     (await g(`document.activeElement.className`)).indexOf('pinp')>=0);
  await p.keyboard.press('Tab'); await p.waitForTimeout(400);

  // seleccionar y agrupar
  await p.click('#ledger table.ptab .lchk >> nth=0'); await p.waitForTimeout(250);
  await p.click('#ledger table.ptab .lchk >> nth=1'); await p.waitForTimeout(300);
  ok('aparece la barra con lo escogido', (await p.$('#lbar'))!==null
     && (await p.textContent('#lbar')).includes('2 pedido(s)'));
  await p.screenshot({path:OUT+'ped2.png'});
  await p.click('#lbar button:has-text("Ponerles un precio juntos")'); await p.waitForTimeout(600);
  ok('crea el grupo y salta a Precios', (await g(`GPRE.length`))===1
     && (await g(`GPRE[0].eqRefs.length`))===2
     && (await p.$('nav.tabs button[data-v="precios"].on'))!==null);
  ok('el grupo arranca con la suma de los precios individuales',
     (await g(`GPRE[0].total`))===198000);
  ok('la selección se limpia', (await g(`LSEL.size`))===0);

  // de vuelta en Pedidos, el precio ya es del grupo
  await p.evaluate(()=>{GPRE[0].total=520000;refreshAll();});
  await p.click('nav.tabs button[data-v="pedidos"]'); await p.waitForTimeout(400);
  const sub2=await p.textContent('#ledger tr.subrow');
  ok('los pedidos del grupo muestran su parte y el nombre del grupo',
     sub2.includes('del grupo')&&sub2.includes('abrirlo'));
  ok('y ya no tienen campo editable suelto', await g(`(function(){
     const o=ORD.find(x=>LAB.has(x.id));
     const n=o.equipos.filter(e=>gpDeEq(e)).length;
     return document.querySelectorAll('#ledger table.ptab tbody tr').length - 
            document.querySelectorAll('#ledger .pinp').length >= n;})()`));
  ok('la suma de las partes del grupo da el total', await g(`(function(){
     const gg=GPRE[0];const s=gg.eqRefs.reduce((s,d)=>s+gpParte(gg,EQ.find(e=>e.derrame===d)),0);
     return Math.abs(s-520000)<0.01;})()`));

  // filtro sin precio
  await p.click('#filters .chip[data-f="sinprecio"]'); await p.waitForTimeout(400);
  ok('el filtro "sin precio" deja solo las órdenes incompletas',
     (await p.$$('#ledger tr.ord')).length>0
     && (await g(`ORD.filter(o=>o.equipos.some(e=>!(precioVenta(e)>0))).length`))===(await p.$$('#ledger tr.ord')).length);
  await p.screenshot({path:OUT+'ped3.png'});
  ok('sin errores de JS', errs.length===0);
  if(errs.length)console.log(errs.slice(0,4));
  await b.close();
})();
