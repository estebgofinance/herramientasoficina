/* La pestaña Sinosure nueva: derrotero por orden madre, con palancas. */
const {chromium}=require('playwright-core');const fs=require('fs');
let ok=0,mal=0;const T=(c,m)=>{if(c){ok++;console.log('  OK   '+m);}else{mal++;console.log('  FALLA '+m);}};
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1100}});
  const errs=[];p.on('pageerror',e=>errs.push(''+e));p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(4200);
  await p.evaluate(()=>navTo('sinosure')); await p.waitForTimeout(600);

  console.log('\n— es un derrotero, no un listado de mil renglones —');
  const g0=await p.evaluate(()=>({
    ordenes:document.querySelectorAll('#v-sinosure tbody.sn-g').length,
    filasAbiertas:document.querySelectorAll('#v-sinosure tr.sn-eq').length,
    pedidos:EQ.length}));
  T(g0.ordenes>0&&g0.ordenes<g0.pedidos/2,g0.ordenes+' ordenes madre para '+g0.pedidos+' pedidos');
  T(g0.filasAbiertas===0,'arranca todo plegado: ni una fila de pedido a la vista');

  console.log('\n— se abren y se cierran —');
  await p.evaluate(()=>snToggle('Singsun|7')); await p.waitForTimeout(350);
  const txt=await p.textContent('#v-sinosure');
  T(['7-5','7-6','7-7','7-8','7-9'].every(d=>txt.includes(d)),'al abrir la orden 7 salen sus 5 derrames');
  await p.evaluate(()=>snToggle('Singsun|7')); await p.waitForTimeout(300);
  T((await p.evaluate(()=>document.querySelectorAll('#v-sinosure tr.sn-eq').length))===0,'y se vuelve a cerrar');

  console.log('\n— el techo lo edito yo, ahi mismo —');
  await p.evaluate(()=>snTecho('Singsun',2000000)); await p.waitForTimeout(400);
  const t1=await p.evaluate(()=>({cupo:CUPO.Singsun,txt:document.querySelector('#v-sinosure .sn-col .sn-card').innerText}));
  T(t1.cupo===2000000,'cambiar el techo en la pestaña lo cambia de verdad');
  T(/Disponible/.test(t1.txt),'y al subirlo deja de estar sobregirado');
  await p.evaluate(()=>snTecho('Singsun',1300000)); await p.waitForTimeout(350);

  console.log('\n— la palanca por orden completa —');
  const antes=await p.evaluate(()=>Math.round(cargaViva('Singsun')));
  await p.evaluate(()=>snOrden('9','Singsun','fuera')); await p.waitForTimeout(450);
  const fuera=await p.evaluate(()=>Math.round(cargaViva('Singsun')));
  T(fuera<antes,'sacar la orden 9 entera baja el cupo usado ('+antes+' → '+fuera+')');
  await p.evaluate(()=>snOrden('9','Singsun','monto')); await p.waitForTimeout(450);
  T((await p.evaluate(()=>Math.round(cargaViva('Singsun'))))===antes,'y devolverla al monto completo lo restaura');

  console.log('\n— los filtros —');
  await p.evaluate(()=>snFiltro('pend')); await p.waitForTimeout(350);
  const pend=await p.evaluate(()=>document.querySelectorAll('#v-sinosure tbody.sn-g').length);
  await p.evaluate(()=>snFiltro('todo')); await p.waitForTimeout(350);
  const todo=await p.evaluate(()=>document.querySelectorAll('#v-sinosure tbody.sn-g').length);
  T(pend<todo&&pend>0,'"Sin clasificar" filtra ('+pend+' de '+todo+')');

  console.log('\n— la columna de comparacion con Andres —');
  await p.evaluate(()=>snCmp()); await p.waitForTimeout(400);
  T((await p.textContent('#v-sinosure')).includes('Andrés dice'),'se puede mostrar lo que dice su hoja, al lado');
  await p.evaluate(()=>snCmp()); await p.waitForTimeout(300);
  T(!(await p.textContent('#v-sinosure')).includes('Andrés dice'),'y se puede ocultar');

  console.log('\n— escribir una nota sin que me saque —');
  await p.evaluate(()=>{snFiltro('todo');snToggle('Singsun|7');}); await p.waitForTimeout(450);
  const sel='#v-sinosure tr.sn-eq .sn-nota';
  await p.click(sel);
  await p.type(sel,'ojo con este',{delay:25});
  const v=await p.$eval(sel,n=>n.value);
  const foco=await p.evaluate(s=>document.activeElement===document.querySelector(s),sel);
  T(v==='ojo con este','escribi 12 caracteres de corrido: "'+v+'"');
  T(foco,'y el cursor no se salio');

  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`);
  await b.close(); process.exit(mal?1:0);
})();
