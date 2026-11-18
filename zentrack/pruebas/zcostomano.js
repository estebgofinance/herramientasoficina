/* v1.7.2 · costo China corregido a mano en Precios.
   Se escribe en la tabla, queda guardado (llave COSTO), sobrevive a recargar el archivo,
   reparte por el costo corregido, y NO toca la deuda con China ni el cupo Sinosure. */
const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const p=await b.newPage({viewport:{width:1400,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  const cargar=async()=>{
    await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['DET3.xlsx','OR2.xlsx']);
    await p.waitForFunction(()=>WIZ.loaded&&WIZ.work&&WIZ.work.length,null,{timeout:60000});
    await p.evaluate(()=>{wizGo(2);wizApprove();}); await p.waitForTimeout(300);
  };
  await cargar();
  await p.evaluate(()=>{navTo('precios');PCF.q='12-';pintarPrecios();}); await p.waitForTimeout(200);
  const celda=()=>p.evaluate(()=>{const tr=[...document.querySelectorAll('#v-precios tr.pc-r')].find(r=>r.querySelector('td:nth-child(2)').textContent.trim()==='12-1');
    const i=tr&&tr.children[5].querySelector('input'); return i?{v:i.value,txt:tr.children[5].textContent}:null;});
  const antes=await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='12-1');return {c:_pcCosto(e),debo:puenteTot(null).debo,cupo:cargaViva('Singsun')};});
  const c0=await celda();
  ok('el costo China de 12-1 se puede editar en la tabla ('+(c0&&c0.v)+')',!!c0&&Math.round(+c0.v)===Math.round(antes.c));
  await p.evaluate(()=>{const tr=[...document.querySelectorAll('#v-precios tr.pc-r')].find(r=>r.querySelector('td:nth-child(2)').textContent.trim()==='12-1');
    const i=tr.children[5].querySelector('input'); i.value='65000'; i.dispatchEvent(new Event('change'));});
  await p.waitForTimeout(150);
  const c1=await celda();
  const d1=await p.evaluate(()=>{const e=EQ.find(x=>x.derrame==='12-1');return {c:_pcCosto(e),debo:puenteTot(null).debo,cupo:cargaViva('Singsun'),k:kOf(e)};});
  ok('queda el costo nuevo y se ve el del archivo ('+(c1&&c1.txt)+')',d1.c===65000&&!!c1&&/archivo/.test(c1.txt)&&+c1.v===65000);
  ok('no cambia la deuda con China ni el cupo Sinosure',Math.abs(d1.debo-antes.debo)<0.5&&Math.abs(d1.cupo-antes.cupo)<0.5);
  const rep=await p.evaluate(()=>{const a=EQ.find(x=>x.derrame==='12-1'),b2=EQ.find(x=>x.derrame==='12-2');
    const g={id:'gpt',nombre:'t',cliente:a.cliente,total:1000,base:'costo',eqRefs:[a.derrame,b2.derrame],partes:{}};GPRE.push(g);
    const pa=gpParte(g,a),pb=gpParte(g,b2); GPRE.pop(); return {pa,pb,ca:_cbCosto(a),cb:_cbCosto(b2)};});
  ok('repartir por costo usa el costo corregido ('+rep.pa+' / '+rep.pb+')',Math.abs(rep.pa-1000*rep.ca/(rep.ca+rep.cb))<0.02&&rep.pa+rep.pb===1000);
  const pers=await p.evaluate(()=>{const s=serializeState(),o=JSON.parse(s);COSTO={};applyState(JSON.parse(s));
    const e=EQ.find(x=>x.derrame==='12-1'); const r1=!!o.COSTO&&_pcCosto(e)===65000;
    const v=JSON.parse(s); delete v.COSTO; applyState(v); const r2=JSON.stringify(COSTO)==='{}'&&_pcCosto(EQ.find(x=>x.derrame==='12-1'))!==65000;
    applyState(JSON.parse(s)); return {r1,r2};});
  ok('se guarda en la llave nueva COSTO y vuelve al abrir',pers.r1);
  ok('un estado viejo sin COSTO abre con el costo del archivo',pers.r2);
  await cargar();
  ok('recargar el archivo no pisa el costo corregido',await p.evaluate(()=>_pcCosto(EQ.find(x=>x.derrame==='12-1'))===65000));
  await p.evaluate(()=>{navTo('precios');PCF.q='12-';pintarPrecios();
    const tr=[...document.querySelectorAll('#v-precios tr.pc-r')].find(r=>r.querySelector('td:nth-child(2)').textContent.trim()==='12-1');
    tr.children[5].querySelector('a').click();});
  await p.waitForTimeout(150);
  ok('"volver" deja otra vez el costo del archivo',await p.evaluate(a=>Math.abs(_pcCosto(EQ.find(x=>x.derrame==='12-1'))-a)<0.01,antes.c));
  /* v1.7.3: "Por asignar" puesto a mano sobrevive aunque el order report diga otro cliente ("Ext") */
  await p.evaluate(()=>{navTo('precios');const e=EQ.find(x=>x.derrame==='18');pcCli(kOf(e),'Por asignar');});
  await cargar();
  ok('"Por asignar" escogido a mano no lo pisa la carga (18 Catedral)',await p.evaluate(()=>EQ.find(x=>x.derrame==='18').cliente==='Por asignar'));
  ok('sin errores de JS',errs.length===0);
  if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
