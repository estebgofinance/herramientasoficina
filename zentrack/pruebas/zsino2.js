const {chromium}=require('playwright-core');const fs=require('fs');
let ok=0,mal=0;const T=(c,m)=>{if(c){ok++;console.log('  OK   '+m);}else{mal++;console.log('  FALLA '+m);}};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1000}});
  const errs=[];p.on('pageerror',e=>errs.push(''+e));p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(1300);

  console.log('\n— la siembra: arranca con lo que el motor ya habia leido —');
  const s1=await p.evaluate(()=>({
    sembrado:SINO.sembrado, n:Object.keys(SINO.ped).length,
    modos:Object.values(SINO.ped).reduce((a,r)=>{const k=r.modo||'sin clasificar';a[k]=(a[k]||0)+1;return a;},{}),
    S:Math.round(cargaViva('Singsun')), E:Math.round(cargaViva('Eaglerise')),
  }));
  console.log('   modos:',JSON.stringify(s1.modos));
  T(s1.sembrado&&s1.n===31,'quedaron los 31 pedidos sembrados (30 + el gemelo INGEV2)');
  T(Math.abs(s1.S-1413028)<=2,'Singsun arranca en '+s1.S+', la hoja dice 1,413,028 (±2 por redondeo)');
  T(s1.E===1465652,'Eaglerise arranca en 1,465,652, el total de la hoja');

  console.log('\n— el techo es MIO, ninguna carga lo pisa —');
  await p.evaluate(()=>{setCupo('Singsun',1750000);setCupo('Eaglerise',1750000);});
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(1300);
  const s2=await p.evaluate(()=>({cupo:CUPO,n:Object.keys(SINO.ped).length,S:Math.round(cargaViva('Singsun'))}));
  T(s2.cupo.Singsun===1750000&&s2.cupo.Eaglerise===1750000,'el techo que puse a mano sobrevivio la recarga');
  T(s2.n===31,'la recarga no duplico ni borro pedidos');

  console.log('\n— mis decisiones sobreviven una recarga —');
  await p.evaluate(()=>{
    const k=Object.keys(SINO.ped).find(x=>x.indexOf('Eaglerise|16')===0);
    sinoSet(k,'modo','fuera');
    const k2='Singsun|7-2'; sinoSet(k2,'modo','fijo'); sinoSet(k2,'fijo',99999); sinoSet(k2,'nota','lo bajé yo');
    refreshAll();
  });
  const antes=await p.evaluate(()=>({S:Math.round(cargaViva('Singsun')),r:SINO.ped['Singsun|7-2']}));
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(1300);
  const desp=await p.evaluate(()=>({S:Math.round(cargaViva('Singsun')),r:SINO.ped['Singsun|7-2'],
    e16:SINO.ped[Object.keys(SINO.ped).find(x=>x.indexOf('Eaglerise|16')===0)]}));
  T(desp.r.modo==='fijo'&&desp.r.fijo===99999,'el monto fijo que escribi sigue ahi despues de recargar');
  T(desp.r.nota==='lo bajé yo','y mi nota tambien');
  T(desp.e16.modo==='fuera','el PO#16 que saque del cupo sigue fuera');
  T(desp.S===antes.S,'el total no se movio con la recarga ('+desp.S+')');

  console.log('\n— guardar y volver a abrir —');
  const json=await p.evaluate(()=>serializeState());
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);
  await p.evaluate(j=>applyState(JSON.parse(j)),json);
  await p.waitForTimeout(400);
  const s3=await p.evaluate(()=>({n:Object.keys(SINO.ped).length,r:SINO.ped['Singsun|7-2'],
    S:Math.round(cargaViva('Singsun')),cupo:CUPO}));
  T(s3.n===31&&s3.r.fijo===99999,'al recargar la herramienta esta todo igual');
  T(s3.cupo.Singsun===1750000,'y el techo tambien');

  console.log('\n— la pestaña de Precios ya no me saca del campo —');
  await p.evaluate(()=>{navTo('precios');PCADV=true;pintarPrecios();});
  await p.waitForTimeout(500);
  await p.evaluate(()=>{ if(!GPRE.length) gpNuevo(); });
  await p.waitForTimeout(400);
  const sel='#v-precios .pc-adv input[placeholder="Factura Mompox"]';
  const hay=await p.$(sel);
  if(hay){
    await p.click(sel);
    await p.type(sel,'Factura Mompox 42',{delay:30});
    const v=await p.$eval(sel,n=>n.value);
    const foco=await p.evaluate(s=>document.activeElement===document.querySelector(s),sel);
    T(v==='Factura Mompox 42','escribi 17 caracteres de corrido y quedaron los 17: "'+v+'"');
    T(foco,'y el cursor nunca se salio del campo');
  } else { T(false,'no encontre el campo de nombre del grupo'); }
  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`);
  await b.close(); process.exit(mal?1:0);
})();
