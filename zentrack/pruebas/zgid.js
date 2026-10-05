/* Recargar muchas veces no puede mezclar derrames: cada receta conserva su número de partes. */
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
  const leido=async()=>{await p.waitForFunction(()=>WIZ&&WIZ.loaded&&WIZ.work&&WIZ.work.length>0,null,{timeout:60000});await p.waitForTimeout(200);};
  const aprobar=async()=>{await p.evaluate(()=>{wizGo(4);wizApprove();});await p.waitForFunction(()=>!document.getElementById('reconScrim').classList.contains('on'),null,{timeout:60000});await p.waitForTimeout(300);};
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile','DET.xlsx'); await leido();
  await p.evaluate(()=>{ [...WIZ.work].filter(w=>(w.qty||1)>1).forEach(w=>{const x=WIZ.work.find(y=>y.derrame===w.derrame); if(x) splitRow(x._i);}); });
  await aprobar();
  const base=await p.evaluate(()=>{const o={};Object.keys(MIO.split).forEach(k=>o[k]=MIO.split[k].partes.length);return o;});
  const nBase=await p.evaluate(()=>EQ.length);
  console.log('  recetas:',Object.keys(base).length,'· pedidos tras derramar:',nBase);
  let malas=[];
  for(let i=1;i<=15;i++){
    await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile','DET.xlsx'); await leido(); await aprobar();
    const r=await p.evaluate(()=>{const o={};Object.keys(MIO.split).forEach(k=>o[k]=MIO.split[k].partes.length);return {o:o,n:EQ.length};});
    Object.keys(base).forEach(k=>{ if(r.o[k]!==base[k]) malas.push('carga '+i+': '+k+' '+base[k]+'→'+r.o[k]); });
    if(r.n!==nBase) malas.push('carga '+i+': '+nBase+'→'+r.n+' pedidos');
  }
  T(malas.length===0,'15 recargas seguidas: ninguna receta cambió'+(malas.length?' — '+malas.slice(0,3).join(' | '):''));
  T(errs.length===0,'sin errores de JS'+(errs.length?': '+errs[0]:''));
  console.log(`\n${ok} OK · ${mal} fallas`); await b.close(); process.exit(mal?1:0);
})();
