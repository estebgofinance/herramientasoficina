const {chromium}=require('playwright-core');const fs=require('fs');
let ok=0,mal=0;
const T=(c,m)=>{if(c){ok++;console.log('  OK   '+m);}else{mal++;console.log('  FALLA '+m);}};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1000}});
  const errs=[];p.on('pageerror',e=>errs.push(''+e));p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(450);

  console.log('\n— punto y guion son el mismo pedido —');
  const id=await p.evaluate(()=>({
    a:_poKey('Pedido 7.2')===_poKey('PO#7-2'),
    b:_poKey('CFM 3.2')===_poKey('PO CFM3-2'),
    c:_poKey('Pedido 11.1')===_poKey('PO#11-1'),
    d:_poKey('CFM 2.3')===_poKey('PO CFM2-3'),
    e:_poKey('Pedido 10 INGEV 1'),
    seq:_poNums('PO 15 13.2 3200 m').join(','),
  }));
  T(id.a,'"Pedido 7.2" y "PO#7-2" son el mismo pedido');
  T(id.b,'"CFM 3.2" y "PO CFM3-2" son el mismo pedido');
  T(id.c,'"Pedido 11.1" y "PO#11-1" son el mismo pedido');
  T(id.d,'"CFM 2.3" y "PO CFM2-3" son el mismo pedido');
  T(id.seq==='15,13,2,3200','la secuencia de números se lee completa y en orden');

  console.log('\n— el sufijo de entidad separa los gemelos —');
  const g=await p.evaluate(()=>({
    v1:_poVar('PO CFM3-2 INGEV2'), v2:_poVar('PO CFM3-2'),
    k1:kOf({mfg:'Eaglerise',derrame:'CFM 3-2 INGEV2'}), k2:kOf({mfg:'Eaglerise',derrame:'CFM 3-2'}),
  }));
  T(g.v1==='INGEV2'&&g.v2==='','el sufijo se extrae solo cuando existe');
  T(g.k1!==g.k2,'el CFM3-2 de INGEV2 y el de Solenium son pedidos distintos');

  console.log('\n— la identidad de los pedidos que YA tienes no se mueve —');
  const vieja=await p.evaluate(()=>['7-2','7-5','9-1','10','11-4','16','12','CFM 3-2','CFM 4','CFM 2-3','7-2A']
    .map(d=>d+' → '+kOf({mfg:'Singsun',derrame:d})));
  const esperado=['7-2 → Singsun|7-2','7-5 → Singsun|7-5','9-1 → Singsun|9-1','10 → Singsun|10',
    '11-4 → Singsun|11-4','16 → Singsun|16','12 → Singsun|12','CFM 3-2 → Singsun|CFM3-2',
    'CFM 4 → Singsun|CFM4','CFM 2-3 → Singsun|CFM2-3','7-2A → Singsun|7-2A'];
  T(JSON.stringify(vieja)===JSON.stringify(esperado),'las claves de los 11 pedidos de siempre quedan idénticas');
  if(JSON.stringify(vieja)!==JSON.stringify(esperado)) console.log('     '+JSON.stringify(vieja));

  console.log('\n— con el detailed real —');
  await p.evaluate(()=>{setCupo('Singsun',1750000);setCupo('Eaglerise',1750000);});
  await p.evaluate(()=>verifyOpen());
  await p.setInputFiles('#reportFile','DET.xlsx'); await p.waitForTimeout(1900);
  const paso1=await p.evaluate(()=>document.getElementById('reconBody').innerText);
  T(/cupo Sinosure 1,413,028/.test(paso1),'el paso 1 ya muestra el cupo de los trackers (antes decía 0)');
  T(/cupo Sinosure 1,465,652/.test(paso1),'y el de los shelters, con el renglon gemelo ya reasignado');
  T(!/= CFM3-2 \+ CFM3-3/.test(paso1),'el CFM3-1 no se confunde con la suma de CFM3-2 + CFM3-3');
  T(/PO#7-5 \(293,699 = 7-5 \+ 7-6 \+ 7-7 \+ 7-8 \+ 7-9\)/.test(paso1),'la fila madre de verdad (PO#7-5) sí se sigue detectando');
  T(/fila 98/.test(paso1),'el renglón repetido nombra el pedido gemelo y su fila');

  await p.evaluate(()=>{wizGo(4);wizApprove();}); await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>{
    const eqs=ORD.flatMap(o=>o.equipos||[]);
    const s=m=>Math.round(eqs.filter(e=>e.mfg===m).reduce((a,e)=>a+consumoEq(e,e.mfg),0));
    return {E:s('Eaglerise'),S:s('Singsun'),cupo:CUPO,hoja:CONCILIA.sino.cupos,
      claves:eqs.filter(e=>e.mfg==='Eaglerise').map(e=>kOf(e)).sort(),
      sueltos:CONCILIA.sinoSueltosL.length};
  });
  T(Math.abs(r.S-1413028)<=2,'trackers: el motor da '+r.S+', la hoja dice 1,413,028 (±2 por redondeo)');
  T(r.E===1465652,'shelters: el motor da 1,465,652, igual que la hoja (el renglon repetido se le atribuye al gemelo)');
  T(r.cupo.Singsun===1750000&&r.cupo.Eaglerise===1750000,'el techo es MIO: la carga NO pisa lo que puse en Ajustes');
  T(r.hoja&&r.hoja.Singsun===1300000,'pero la hoja queda guardada para poder compararla');
  T(r.claves.includes('Eaglerise|CFM3-1'),'el CFM3-1 sigue siendo un pedido vivo');
  T(r.sueltos===0,'ningún renglón de la hoja quedó sin pedido');
  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`);
  await b.close();
  process.exit(mal?1:0);
})();
