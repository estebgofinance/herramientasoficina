const {chromium}=require('playwright-core');const fs=require('fs');
const OUT='/tmp/claude-0/-home-user-herramientasoficina/ca332b4e-3f1e-594e-b2aa-30133e5b1508/scratchpad/';
const ok=(n,c)=>console.log((c?'  OK ':'FALLA')+'  '+n);
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const p=await b.newPage({viewport:{width:1600,height:1020},deviceScaleFactor:1.25});
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
  await p.click('nav.tabs button[data-v="precios"]'); await p.waitForTimeout(350); await p.evaluate(()=>{PCADV=true;pintarPrecios();}); await p.waitForTimeout(250);
  await p.evaluate(()=>{gpNuevo();const g=GPRE[0];g.nombre='Factura Mompox';g.cliente=EQ[0].cliente;
    g.eqRefs=[EQ[5].derrame,EQ[9].derrame];g.total=480000;pintarPrecios();refreshAll();});
  await p.waitForTimeout(400);
  const ord=await p.evaluate(()=>[...document.querySelectorAll('#v-precios .pc-adv tbody tr')]
    .slice(0,3).map(t=>t.querySelector('input[type=checkbox]')&&t.querySelector('input[type=checkbox]').checked));
  ok('los pedidos marcados aparecen de primeros', ord[0]===true&&ord[1]===true);
  await p.fill('#gq','piojo'); await p.waitForTimeout(400);
  const vis=await p.evaluate(()=>[...document.querySelectorAll('#v-precios .pc-adv tbody tr')].length);
  ok('el filtro reduce la lista pero no esconde los marcados',
     vis<20 && (await p.evaluate(()=>[...document.querySelectorAll('#v-precios .pc-adv tbody tr input:checked')].length))===2);
  await p.fill('#gq',''); await p.waitForTimeout(350);
  await p.screenshot({path:OUT+'v22-precios2.png'});
  await p.click('nav.tabs button[data-v="sinosure"]'); await p.waitForTimeout(400);
  ok('el PO#16 sale en "lo que la hoja no lista" con su monto',
     (await p.textContent('#v-sinosure')).includes('515,200'));
  await p.screenshot({path:OUT+'v22-sino2.png'});
  ok('sin errores de JS', errs.length===0);
  if(errs.length)console.log(errs.slice(0,4));
  await b.close();
})();
