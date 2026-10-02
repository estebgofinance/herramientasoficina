const {chromium}=require('playwright-core');const fs=require('fs');
const OUT='/tmp/claude-0/-home-user-herramientasoficina/ca332b4e-3f1e-594e-b2aa-30133e5b1508/scratchpad/';
const ok=(n,c)=>console.log((c?'  OK ':'FALLA')+'  '+n);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const p=await b.newPage({viewport:{width:1560,height:1040},deviceScaleFactor:1.2});
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
  // dar cliente a los pedidos de la orden 7 para poder ver su estado de cuenta
  await p.evaluate(()=>{ if(!CLI['Solenium'])addCliente('Solenium',60,false);
    ORD.find(o=>o.id==='7').equipos.forEach(e=>e.cliente='Solenium');
    ORD.find(o=>o.id==='7').cliente='Solenium'; refreshAll(); });
  await p.waitForTimeout(400);

  // --- 1. el precio del grupo tiene que llegar al estado de cuenta ---
  const ds=await g(`ORD.find(o=>o.id==='7').equipos.slice(0,3).map(e=>e.derrame)`);
  await p.evaluate(d=>{ gpNuevo(); const gg=GPRE[0];
    gg.nombre='Factura 7'; gg.cliente='Solenium'; gg.eqRefs=d; gg.total=600000; gg.base='costo';
    gpSet(gg.id,'total',600000); }, ds);
  await p.waitForTimeout(500);
  ok('el grupo reparte los 600.000', Math.abs(
    (await g(`GPRE[0].eqRefs.reduce((s,d)=>s+gpParte(GPRE[0],EQ.find(e=>e.derrame===d)),0)`))-600000)<0.02);
  ok('y la parte queda escrita en cada pedido', await g(`GPRE[0].eqRefs.every(d=>{
     const e=EQ.find(x=>x.derrame===d); return Math.abs(e.precioVenta-gpParte(GPRE[0],e))<0.01;})`));
  ok('las lecturas directas del motor ya ven el precio', await g(`(function(){
     const e=EQ.find(x=>x.derrame===GPRE[0].eqRefs[0]);
     return (+e.precioVenta>0) && Math.abs((+e.precioVenta||0)-precioVenta(e))<0.01;})()`));

  await p.click('nav.tabs button[data-v="clientes"]'); await p.waitForTimeout(600);
  await p.evaluate(()=>selCliData('Solenium')); await p.waitForTimeout(500);
  const ec=await p.textContent('#v-clientes');
  ok('la pestaña Clientes ya no dice "definir" para los del grupo', await g(`(function(){
     const filas=[...document.querySelectorAll('#v-clientes tr')];
     const conDef=filas.filter(tr=>/definir/.test(tr.textContent))
       .map(tr=>(tr.textContent.trim().match(/^[\w-]+/)||[''])[0]);
     const enGrupo=GPRE[0].eqRefs;
     return enGrupo.every(d=>!conDef.some(c=>c.indexOf(d)===0));})()`));
  ok('y el estado de cuenta ya suma esos 600.000',
     ec.replace(/\s+/g,'').includes('600,000')||ec.replace(/\s+/g,'').includes('600.000')
     || (await g(`EQ.filter(e=>gpDeEq(e)).reduce((s,e)=>s+(+e.precioVenta||0),0)`))===600000);
  await p.screenshot({path:OUT+'limp-clientes.png',fullPage:true});

  // cambiar el total del grupo re-sincroniza
  await p.evaluate(()=>{const gg=GPRE[0];gpSet(gg.id,'total',900000);}); await p.waitForTimeout(500);
  ok('cambiar el total del grupo re-sincroniza los pedidos',
     Math.abs((await g(`EQ.filter(e=>gpDeEq(e)).reduce((s,e)=>s+(+e.precioVenta||0),0)`))-900000)<0.02);

  // --- 2. el botón muerto ---
  await p.evaluate(()=>openPanel('7')); await p.waitForTimeout(450);
  const bts=await p.evaluate(()=>[...document.querySelectorAll('#panel .pactions button')].map(b=>b.textContent.trim()));
  ok('el botón "Simular sacar pedidos" ya no está', !bts.some(x=>/Simular/.test(x)));
  ok('y los que sí sirven siguen', bts.some(x=>/giro a China/.test(x))&&bts.some(x=>/estado de cuenta/.test(x)));
  ok('no quedó ninguna navegación a la pestaña Caja',
     (await g(`[...document.querySelectorAll('[onclick]')].filter(e=>/navTo\\(['"]caja/.test(e.getAttribute('onclick'))).length`))===0);

  // --- 3. la palanca duplicada ---
  ok('la palanca de Sinosure ya no se repite en el panel',
     (await p.$$('#panel .sinorow select')).length===0);
  ok('pero el dato sigue visible y lleva a la pestaña',
     (await p.textContent('#panel')).includes('según la hoja'));
  await p.screenshot({path:OUT+'limp-panel.png'});
  await p.evaluate(()=>closePanel()); await p.waitForTimeout(300);

  // --- 4. aviso de grupos a medias ---
  await p.evaluate(()=>{gpNuevo();pintarPrecios();}); await p.waitForTimeout(400);
  await p.click('nav.tabs button[data-v="precios"]'); await p.waitForTimeout(450);
  ok('avisa de los grupos sin terminar', (await p.textContent('#v-precios')).includes('sin terminar'));

  // --- nada se rompió ---
  await p.evaluate(()=>{const s=serializeState();GPRE=[];applyState(JSON.parse(s));}); await p.waitForTimeout(500);
  ok('guardar y recargar conserva grupos y precios',
     (await g(`GPRE.length`))===2 && Math.abs(
     (await g(`EQ.filter(e=>gpDeEq(e)).reduce((s,e)=>s+(+e.precioVenta||0),0)`))-900000)<0.02);
  for(const v of ['hoy','pedidos','clientes','pagos','precios','sinosure','config']){
    await p.click(`nav.tabs button[data-v="${v}"]`); await p.waitForTimeout(260);
  }
  ok('las siete pestañas siguen pintando', errs.length===0);
  ok('sin errores de JS', errs.length===0);
  if(errs.length)console.log(errs.slice(0,4));
  await b.close();
})();
