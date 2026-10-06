/* Precios y clientes: editar, mover de cliente, repartir un precio total, y que sobreviva la recarga. */
const {chromium}=require('playwright-core');const fs=require('fs');
let ok=0,mal=0;const T=(c,m)=>{if(c){ok++;console.log('  OK   '+m);}else{mal++;console.log('  FALLA '+m);}};
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1100}});
  const errs=[];p.on('pageerror',e=>errs.push(''+e));p.on('dialog',d=>d.accept('Valledupar Solar'));
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  const leido=async()=>{await p.waitForFunction(()=>WIZ&&WIZ.loaded&&WIZ.work&&WIZ.work.length>0,null,{timeout:60000});await p.waitForTimeout(400);};
  const aprobar=async()=>{await p.evaluate(()=>{wizGo(4);wizApprove();});await p.waitForFunction(()=>!document.getElementById('reconScrim').classList.contains('on'),null,{timeout:60000});await p.waitForTimeout(500);};
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['DET3.xlsx','OR2.xlsx']); await leido(); await aprobar();
  await p.evaluate(()=>navTo('precios')); await p.waitForTimeout(500);
  const k=await p.evaluate(()=>({a:kOf(EQ.find(e=>e.derrame==='9-2')),b:kOf(EQ.find(e=>e.derrame==='9-3')),c:kOf(EQ.find(e=>e.derrame==='9-5'))}));

  console.log('\n— una sola tabla —');
  T(await p.evaluate(()=>document.querySelectorAll('#v-precios tr.pc-r').length===EQ.length),'una fila por pedido');
  T(await p.evaluate(()=>!!document.querySelector('#v-precios details.pc-adv')),'la vista de grupos queda abajo, plegada');

  console.log('\n— precio de un pedido, escrito ahí mismo —');
  const sel='#v-precios input[data-foco="pv-'+k.a+'"]';
  await p.fill(sel,'95000'); await p.press(sel,'Tab'); await p.waitForTimeout(400);
  T(await p.evaluate(()=>EQ.find(e=>e.derrame==='9-2').precioVenta)===95000,'9-2 queda en 95,000');

  console.log('\n— marcar varios y poner un precio total —');
  await p.evaluate(([b,c])=>{pcSel(b,true);pcSel(c,true);},[k.b,k.c]); await p.waitForTimeout(300);
  T(await p.evaluate(()=>!!document.querySelector('.pc-bar')),'aparece la barra de acciones');
  await p.fill('#pcTot','150000'); await p.evaluate(()=>pcRepartir()); await p.waitForTimeout(500);
  const rep=await p.evaluate(()=>{const x=EQ.find(e=>e.derrame==='9-3'),y=EQ.find(e=>e.derrame==='9-5');return {x:x.precioVenta,y:y.precioVenta,g:!!gpDeEq(x)};});
  T(rep.g&&Math.abs(rep.x+rep.y-150000)<0.02,'150,000 repartidos: 9-3 '+Math.round(rep.x)+' + 9-5 '+Math.round(rep.y));
  T(rep.x>rep.y,'por costo: el pedido más caro recibe más');

  console.log('\n— mover pedidos de Solenium a otro cliente —');
  await p.evaluate(([b,c])=>{pcSel(b,true);pcSel(c,true);},[k.b,k.c]); await p.waitForTimeout(300);
  await p.selectOption('#pcDest','__nuevo'); await p.evaluate(()=>pcMover()); await p.waitForTimeout(600);
  const mv=await p.evaluate(()=>({c:EQ.filter(e=>/^9-[35]$/.test(e.derrame)).map(e=>e.cliente),int:esInterno('Valledupar Solar'),
    ec:equiposCliente('Valledupar Solar').length, grupoSigue:GPRE.some(g=>g.cliente==='Solenium'&&(g.eqRefs||[]).some(d=>/^9-[35]$/.test(d)))}));
  T(mv.c.every(c=>c==='Valledupar Solar'),'9-3 y 9-5 ahora son de Valledupar Solar');
  T(mv.int,'el cliente nuevo quedó interno (EC espejo, como Solenium)');
  T(mv.ec===2,'y aparecen en su estado de cuenta');
  T(!mv.grupoSigue,'ya no quedan colgados en el grupo de precio de Solenium');
  T(await p.evaluate(()=>!GPRE.some(g=>!(g.eqRefs||[]).length)),'y el grupo que quedó vacío se borró');

  console.log('\n— el proyecto, escrito a mano —');
  const pj='#v-precios input[data-foco="pj-'+k.a+'"]';
  await p.fill(pj,'Confines Occidente 2 · fase B'); await p.press(pj,'Tab'); await p.waitForTimeout(400);

  console.log('\n— todo sobrevive recargar los dos archivos —');
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['DET3.xlsx','OR2.xlsx']); await leido(); await aprobar();
  const r=await p.evaluate(()=>{const g=d=>EQ.find(e=>e.derrame===d);return {pv:g('9-2').precioVenta,pj:g('9-2').proj,c3:g('9-3').cliente,c5:g('9-5').cliente};});
  T(r.pv===95000,'el precio de 9-2 sigue');
  T(r.pj==='Confines Occidente 2 · fase B','el proyecto que escribí sigue (el ORDER REPORT no lo pisa)');
  T(r.c3==='Valledupar Solar'&&r.c5==='Valledupar Solar','los pedidos movidos siguen en su cliente nuevo');
  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  await p.evaluate(()=>{navTo('precios');}); await p.waitForTimeout(400);
  await p.screenshot({path:'pc.png',clip:{x:0,y:0,width:1500,height:1100}});
  console.log(`\n${ok} OK · ${mal} fallas`); await b.close(); process.exit(mal?1:0);
})();
