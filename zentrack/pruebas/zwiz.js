/* El asistente de carga: scroll al derramar, y el paso Comparar por pedido. */
const {chromium}=require('playwright-core');const fs=require('fs');
let ok=0,mal=0;const T=(c,m)=>{if(c){ok++;console.log('  OK   '+m);}else{mal++;console.log('  FALLA '+m);}};
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:950}});
  const errs=[];p.on('pageerror',e=>errs.push(''+e));p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);

  console.log('\n— derramar un pedido ya no me manda al principio —');
  await p.evaluate(()=>wizGo(2)); await p.waitForTimeout(700);
  // bajar bien abajo del listado
  await p.evaluate(()=>{const sc=document.querySelector('#wizEditBody .vscroll');sc.scrollTop=sc.scrollHeight;});
  await p.waitForTimeout(250);
  const antes=await p.evaluate(()=>document.querySelector('#wizEditBody .vscroll').scrollTop);
  T(antes>100,'me baje hasta '+antes+'px del listado');
  // derramar un pedido con qty>1 que este abajo
  const der=await p.evaluate(()=>{
    const w=[...WIZ.work].reverse().find(x=>(x.qty||1)>1);
    if(!w) return null; splitRow(w._i); return w.derrame;});
  await p.waitForTimeout(600);
  const desp=await p.evaluate(()=>document.querySelector('#wizEditBody .vscroll').scrollTop);
  T(der!=null,'derrame el pedido '+der);
  T(desp>100,'y la lista NO se fue al principio (quedo en '+desp+'px)');
  T(await p.evaluate(()=>WIZ.work.some(w=>w._splitGroup)),'el derrame si se hizo');

  console.log('\n— el paso Comparar: una fila por pedido, solo los que cambiaron —');
  /* primero apruebo, para que la segunda carga tenga con que comparar */
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(4000);
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  /* simulo que Andres movio varias cosas de UN solo pedido */
  await p.evaluate(()=>{
    const w=WIZ.work.find(x=>x.derrame==='7-3');
    w.cupoMonto=w.cupoMonto-9000; w.cupoSaldo=w.cupoSaldo-9000; w.st='prod';
    const v=WIZ.work.find(x=>x.derrame==='9-2'); v.cupoSaldo=v.cupoSaldo-500;
  });
  await p.evaluate(()=>wizGo(3)); await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{
    const filas=document.querySelectorAll('#reconBody table.wd tbody tr').length;
    const cambios=document.querySelectorAll('#reconBody .wd-c').length;
    return {filas:filas,cambios:cambios,txt:document.getElementById('reconBody').innerText,
      work:WIZ.work.length};
  });
  console.log('   '+r.filas+' filas para '+r.cambios+' cambios (antes era 1 fila por cambio)');
  T(r.filas<r.cambios,'hay MENOS filas que cambios: se agrupo por pedido ('+r.filas+' vs '+r.cambios+')');
  T(r.filas<r.work,'y solo salen los que cambiaron, no los '+r.work+' del archivo');
  const p73=await p.evaluate(()=>{
    const tr=[...document.querySelectorAll('#reconBody table.wd tbody tr')]
      .find(t=>t.querySelector('.wd-po')&&t.querySelector('.wd-po').textContent.indexOf('7-3')===0);
    return tr?{n:tr.querySelectorAll('.wd-c').length,txt:tr.innerText}:null;});
  T(p73&&p73.n===3,'el 7-3 sale en UNA fila con sus 3 cambios juntos');
  T(p73&&/Monto/.test(p73.txt)&&/Saldo/.test(p73.txt)&&/Estado/.test(p73.txt),'y se ven los tres: monto, saldo y estado');
  T(/traen algo distinto a lo que ya ten/.test(r.txt),'dice cuantos pedidos traen algo distinto');
  T(/Con cambios/.test(r.txt)&&/Desaparecidos/.test(r.txt),'estan los filtros, incluido Desaparecidos');

  console.log('\n— recargar el MISMO archivo no debe reportar nada —');
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(4000);
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  const limpio=await p.evaluate(()=>WIZ.work.filter(w=>_cambiosW(w).length).map(w=>w.derrame));
  T(limpio.length===0,'cargar dos veces el mismo detailed no inventa cambios'+(limpio.length?': '+limpio.join(','):''));

  console.log('\n— detecta los que desaparecen del archivo nuevo —');
  await p.evaluate(()=>{ WIZ.work=WIZ.work.filter(w=>w.derrame!=='9-7'); });
  await p.evaluate(()=>wizGo(3)); await p.waitForTimeout(600);
  await p.evaluate(()=>wdifFiltro('idos')); await p.waitForTimeout(400);
  const idos=await p.evaluate(()=>document.getElementById('reconBody').innerText);
  T(/9-7/.test(idos)&&/Desapareci/.test(idos),'el 9-7 que saque sale como desaparecido');
  T(/se va de la herramienta/.test(idos),'y avisa que si apruebas se pierde');

  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`);
  await b.close(); process.exit(mal?1:0);
})();
