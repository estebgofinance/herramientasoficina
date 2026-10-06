const {chromium}=require('playwright-core');const fs=require('fs');
const ok=(n,c)=>console.log((c?'  OK ':'FALLA')+'  '+n);
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const p=await b.newPage({viewport:{width:1600,height:1020}});
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
  // un pedido con cliente de verdad, metido a un grupo
  const cli=await g(`EQ[0].cliente`);
  await p.evaluate(c=>{if(!CLI[c])addCliente(c,60,false);
    gpNuevo();const gg=GPRE[0];gg.nombre='Factura Mompox';gg.cliente=c;
    gg.eqRefs=[EQ[0].derrame];gg.total=300000;refreshAll();},cli);
  await p.waitForTimeout(400);
  await p.evaluate(c=>openEditCliente(c),cli); await p.waitForTimeout(500);
  const t=await p.textContent('body');
  ok('la casilla de precio del pedido en grupo queda bloqueada y lo explica',
     t.includes('del grupo')&&t.includes('Factura Mompox')&&t.includes('editarlo ahí'));
  ok('y muestra la parte que le toca del grupo',
     (await p.textContent('.ec-tbl'))!==null && t.includes('300,000'));
  ok('los pedidos fuera del grupo conservan su casilla editable',
     (await p.$$('.ec-tbl input.ec-num')).length>0);
  ok('sin errores de JS', errs.length===0);
  if(errs.length)console.log(errs.slice(0,3));
  await b.close();
})();
