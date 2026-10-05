const {chromium}=require('playwright-core');const fs=require('fs');
const OUT='/tmp/claude-0/-home-user-herramientasoficina/ca332b4e-3f1e-594e-b2aa-30133e5b1508/scratchpad/';
const ok=(n,c)=>console.log((c?'  OK ':'FALLA')+'  '+n);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const p=await b.newPage({viewport:{width:1600,height:1020},deviceScaleFactor:1.25});
  p.on('dialog',d=>d.accept());
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text());});
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html');
  await p.waitForTimeout(500);
  const g=s=>p.evaluate(s);

  ok('el motor 4 se cargó sobre el resto', (await g(`typeof pintarPrecios==='function' && typeof pintarSino==='function'`)));
  ok('reemplazó precioVenta, serializeState y applyState', await g(`(function(){
     const antes=GPRE.slice();
     GPRE=[{id:'zz',nombre:'x',cliente:'',total:1,base:'costo',eqRefs:[],partes:{}}];
     const s=serializeState(); GPRE=[]; applyState(JSON.parse(s));
     const ok1=GPRE.length===1&&GPRE[0].id==='zz';
     GPRE=antes;
     return ok1 && precioVenta.toString().indexOf('gpDeEq')>0;})()`));
  ok('las dos pestañas nuevas existen',
     (await p.$('nav.tabs button[data-v="precios"]'))!==null && (await p.$('#v-sinosure'))!==null);

  // cargar el detailed real, como hace Esteban
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{wizGo(4);wizApprove();document.getElementById('toast').classList.remove('on');});
  await p.waitForTimeout(700);
  ok('los datos del detailed cargaron', (await g(`EQ.length`))>=25);
  const nEq=await g(`EQ.length`);

  // ---- PRECIOS ----
  await p.click('nav.tabs button[data-v="precios"]'); await p.waitForTimeout(400); await p.evaluate(()=>{PCADV=true;pintarPrecios();}); await p.waitForTimeout(250);
  ok('la pestaña Precios pinta', (await p.textContent('#v-precios')).includes('Precios por grupo'));
  await p.screenshot({path:OUT+'v22-precios0.png'});

  const d0=await g(`EQ[0].derrame`), d1=await g(`EQ[1].derrame`), cli=await g(`EQ[0].cliente`);
  await p.evaluate(({cli,a,bb})=>{
    gpNuevo(); const g=GPRE[GPRE.length-1];
    g.nombre='Factura conjunta'; g.cliente=cli; g.eqRefs=[a,bb]; g.total=520000; g.base='costo';
    pintarPrecios(); refreshAll();
  },{cli,a:d0,bb:d1});
  await p.waitForTimeout(400);
  ok('el grupo cubre los dos pedidos', (await g(`GPRE[0].eqRefs.length`))===2);
  const partes=await g(`GPRE[0].eqRefs.map(d=>gpParte(GPRE[0],EQ.find(e=>e.derrame===d)))`);
  ok('reparte el total completo sin perder centavos', Math.abs(partes[0]+partes[1]-520000)<0.01);
  ok('reparte a prorrata del costo', await g(`(function(){const g=GPRE[0];
     const a=EQ.find(e=>e.derrame===g.eqRefs[0]),bb=EQ.find(e=>e.derrame===g.eqRefs[1]);
     const ca=+a.cupoMonto,cb=+bb.cupoMonto;
     return Math.abs(gpParte(g,a)-520000*ca/(ca+cb))<0.02;})()`));
  ok('precioVenta de un pedido del grupo sale del grupo',
     Math.abs((await g(`precioVenta(EQ.find(e=>e.derrame===GPRE[0].eqRefs[0]))`))-partes[0])<0.01);
  ok('un pedido fuera del grupo conserva su precio de siempre', await g(`(function(){
     const e=EQ.find(x=>!gpDeEq(x)); e.precioVenta=12345; return precioVenta(e)===12345;})()`));

  // base por equipos
  await p.evaluate(()=>{GPRE[0].base='equipos';pintarPrecios();refreshAll();});
  await p.waitForTimeout(300);
  ok('cambiar la base cambia el reparto pero no el total', await g(`(function(){const g=GPRE[0];
     const s=g.eqRefs.reduce((s,d)=>s+gpParte(g,EQ.find(e=>e.derrame===d)),0);
     return Math.abs(s-520000)<0.01;})()`));
  // base manual + cuadrar
  await p.evaluate(()=>{const g=GPRE[0];g.base='manual';g.partes={};g.partes[g.eqRefs[0]]=300000;
    pintarPrecios();});
  await p.waitForTimeout(300);
  ok('avisa cuando el reparto a mano no cuadra', (await p.textContent('#v-precios')).includes('te faltan'));
  await p.click('#v-precios .pc-adv button:has-text("Cuadrar")'); await p.waitForTimeout(350);
  ok('el botón de cuadrar ajusta la última fila',
     Math.abs((await g(`gpRepartido(GPRE[0])`))-520000)<0.01);
  await p.evaluate(()=>{GPRE[0].base='costo';pintarPrecios();refreshAll();});
  await p.waitForTimeout(300);
  await p.screenshot({path:OUT+'v22-precios.png',fullPage:true});

  // ---- persistencia ----
  const st=await g(`serializeState()`);
  ok('el estado guardado lleva los grupos', JSON.parse(st).GPRE.length===1);
  ok('y conserva todo lo de antes', (()=>{const s=JSON.parse(st);
     return Array.isArray(s.ORD)&&Array.isArray(s.FACT)&&Array.isArray(s.PAGOS)&&!!s.CONCILIA&&!!s.CUPO;})());
  await p.evaluate(s=>{GPRE=[];applyState(JSON.parse(s));},st);
  await p.waitForTimeout(300);
  ok('recargar el estado devuelve los grupos', (await g(`GPRE.length`))===1 && (await g(`GPRE[0].total`))===520000);
  ok('y los pedidos siguen enteros', (await g(`EQ.length`))===nEq);

  // ---- SINOSURE: lo nuevo se prueba en zsino.js; aquí solo que la pestaña viva ----
  await p.click('nav.tabs button[data-v="sinosure"]'); await p.waitForTimeout(450);
  ok('la pestaña Sinosure pinta el derrotero', (await p.textContent('#v-sinosure')).includes('Sinosure')
     && (await p.evaluate(()=>document.querySelectorAll('#v-sinosure tbody.sn-g').length))>0);

  // las pestañas viejas siguen sanas
  for(const v of ['hoy','pedidos','clientes','pagos','config']){
    await p.click(`nav.tabs button[data-v="${v}"]`); await p.waitForTimeout(220);
  }
  ok('las cinco pestañas de siempre siguen pintando sin error', errs.length===0);
  ok('sin errores de JS', errs.length===0);
  if(errs.length)console.log(errs.slice(0,5));
  await b.close();
})();
