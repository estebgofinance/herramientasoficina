const {chromium}=require('playwright-core');const fs=require('fs');
let ok=0,mal=0;const T=(c,m)=>{if(c){ok++;console.log('  OK   '+m);}else{mal++;console.log('  FALLA '+m);}};
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const errs=[];
  const abrir=async(html)=>{const p=await b.newPage({viewport:{width:1500,height:1000}});p.on('dialog',d=>d.accept());
    p.on('pageerror',e=>errs.push(html+': '+e));
    await p.route('**/*',r=>{const u=r.request().url();
      if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
      if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
    await p.goto('file://'+__dirname+'/'+html); await p.waitForTimeout(450); return p;};
  const cupo=p=>p.evaluate(()=>({S:Math.round(cargaViva('Singsun')),E:Math.round(cargaViva('Eaglerise')),n:EQ.length,
    der:EQ.filter(e=>/[A-H]$/.test(e.derrame)).length, pend:sinoPendientes().map(e=>e.derrame)}));
  /* esperar a que el archivo TERMINE de leerse, no un tiempo fijo */
  const leido=async p=>{ await p.waitForFunction(()=>WIZ&&WIZ.loaded&&WIZ.work&&WIZ.work.length>0,null,{timeout:60000}); await p.waitForTimeout(300); };
  const cargar=async p=>{await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile','DET.xlsx'); await leido(p);
    await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForFunction(()=>!document.getElementById('reconScrim').classList.contains('on'),null,{timeout:60000}); await p.waitForTimeout(800);};
  const cerca=(a,b)=>Math.abs(a-b)<=3;
  const S_OK=1413028-12384;   /* tu PO#10 en 'saldo por pagar' (decisión tuya) en vez de monto completo */

  // ===== como lo tenías en la v1.3: 40 partes derramadas, el 10 a mano en "saldo" =====
  let p=await abrir('V13.html');
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile','DET.xlsx'); await leido(p);
  await p.evaluate(()=>{ [...WIZ.work].filter(w=>(w.qty||1)>1&&w.derrame!=='10').forEach(w=>{const x=WIZ.work.find(y=>y.derrame===w.derrame); if(x) splitRow(x._i);});
    WIZ.work.filter(w=>/^7-2[AB]$/.test(w.derrame)).forEach((w,i)=>setW(w._i,'proj',['Santo Tomas 1','Santo Tomas 2'][i])); });
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForFunction(()=>!document.getElementById('reconScrim').classList.contains('on'),null,{timeout:60000}); await p.waitForTimeout(800);
  await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='10'); sinoSet(kOf(e),'modo','saldo');});
  const v13=await p.evaluate(()=>serializeState()); console.log('v1.3 con derrames:',JSON.stringify(await cupo(p))); await p.close();

  // ===== lo que te pasó hoy: v1.4 vieja carga y aprueba =====
  p=await abrir('V14.html'); await p.evaluate(j=>applyState(JSON.parse(j)),v13); await p.waitForTimeout(400); await cargar(p);
  const hoy=await p.evaluate(()=>serializeState()); const vieja=await cupo(p); console.log('v1.4 vieja:',JSON.stringify({S:vieja.S,E:vieja.E,n:vieja.n,der:vieja.der}));
  T(vieja.S===847068,'la v1.4 vieja reproduce tu pantalla: Singsun '+vieja.S+' (tú: 847,068)'); await p.close();

  console.log('\n— CASO REAL: abres la v1.4.1 con el estado que tienes hoy —');
  p=await abrir('V141.html'); await p.evaluate(j=>applyState(JSON.parse(j)),hoy); await p.waitForTimeout(1400);
  let c=await cupo(p); console.log('   al abrir   ',JSON.stringify(c));
  T(cerca(c.S,S_OK),'Singsun vuelve a '+c.S+' apenas abres, sin cargar nada');
  T(cerca(c.E,1465652),'Eaglerise vuelve a '+c.E);
  T(c.pend.join()==='16','solo el PO#16 queda en la bandeja ('+c.pend.join()+')');
  const rec=await p.evaluate(()=>Object.keys(MIO.split).length);
  T(rec===13,'se recuperaron las recetas de tus 13 pedidos derramados ('+rec+')');
  await cargar(p); c=await cupo(p); console.log('   tras cargar',JSON.stringify({S:c.S,E:c.E,n:c.n,der:c.der}));
  T(c.der===40,'tus 40 partes volvieron, sin derramar nada a mano ('+c.der+')');
  T(cerca(c.S,S_OK)&&cerca(c.E,1465652),'y el cupo sigue cuadrando con las partes: S '+c.S+' · E '+c.E);
  const nom=await p.evaluate(()=>EQ.filter(e=>/^7-2[AB]$/.test(e.derrame)).map(e=>e.proj).join(' / '));
  T(nom==='Santo Tomas 1 / Santo Tomas 2','con sus nombres: '+nom);
  const h=await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='7-2A');const f=sinoRegEf(e);return {her:f&&f.heredado,modo:f&&f.r.modo,c:Math.round(consumoEq(e,'Singsun'))};});
  T(h.her&&h.modo==='saldo','7-2A hereda "saldo por pagar" de su pedido 7-2 (consume '+h.c+')');
  const diez=await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='10');return SINO.ped[kOf(e)].modo;});
  T(diez==='saldo','tu decisión a mano sobre el 10 se respetó ('+diez+')');
  const again=await p.evaluate(()=>serializeState()); await p.close();

  console.log('\n— y la siguiente carga ya no pide nada —');
  p=await abrir('V141.html'); await p.evaluate(j=>applyState(JSON.parse(j)),again); await p.waitForTimeout(600);
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile','DET.xlsx'); await leido(p);
  const cam=await p.evaluate(()=>WIZ.work.filter(w=>_cambiosW(w).length).map(w=>w.derrame));
  T(cam.length===0,'Comparar sale vacío al recargar el mismo archivo'+(cam.length?' ('+cam.join(',')+')':''));
  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForFunction(()=>!document.getElementById('reconScrim').classList.contains('on'),null,{timeout:60000}); await p.waitForTimeout(800);
  c=await cupo(p); T(c.der===40&&cerca(c.S,S_OK)&&cerca(c.E,1465652),'todo igual: '+JSON.stringify({S:c.S,E:c.E,der:c.der}));
  await p.evaluate(()=>navTo('sinosure')); await p.waitForTimeout(500);
  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`); await b.close(); process.exit(mal?1:0);
})();
