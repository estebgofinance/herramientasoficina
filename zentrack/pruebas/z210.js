/* v2.10 · Necesidad de efectivo en el estado de cuenta de un cliente del grupo, y TRM oficial.
   Hoy fijado en 30-oct-2026 (viernes). Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo). Cifras inventadas.
   - TRMOF: la TRM oficial (datos.gov.co, aquí simulada) se guarda por fecha, vuelve al recargar y la Caja la usa.
   - neDatos: toda la caja de la semana − entradas de otros clientes = necesidad; − lo ya girado = por girar;
     cómo se abona (vencido, lo de la semana, a favor). Lo que está en pesos se pasa con la TRM elegida.
   - Lo que está en standby no se programa para girar a China.
   - PDF y Excel: a un cliente del grupo primero sale el diálogo (semana y TRM); "Sin hoja" baja solo el estado de cuenta. */
const {chromium}=require('playwright-core');const fs=require('fs');const path=require('path');const ExcelJS=require('exceljs');const JSZip=require('jszip');
/* como en z17: Excel da por dañado un archivo cuyas piezas van en otro orden del que exige el formato */
const ORDEN_HOJA=['sheetPr','dimension','sheetViews','sheetFormatPr','cols','sheetData','sheetCalcPr','sheetProtection','protectedRanges','scenarios','autoFilter','sortState','dataConsolidate','customSheetViews','mergeCells','phoneticPr','conditionalFormatting','dataValidations','hyperlinks','printOptions','pageMargins','pageSetup','headerFooter','rowBreaks','colBreaks','customProperties','cellWatches','ignoredErrors','smartTags','drawing','legacyDrawing','legacyDrawingHF','picture','oleObjects','controls','webPublishItems','tableParts','extLst'];
function hijos(xml,padre){ const out=[]; let d=0, dentro=false, m; const re=/<(\/?)([\w:]+)[^>]*?(\/?)>/g;
  while((m=re.exec(xml))){ const [,cierra,tag,sola]=m; if(!dentro){ if(tag===padre&&!cierra){ dentro=!sola; d=0; } continue; }
    if(cierra){ if(d===0) break; d--; continue; } if(d===0) out.push(tag); if(!sola) d++; } return out; }
async function malFormado(fx){ const z=await JSZip.loadAsync(fs.readFileSync(fx)), mal=[];
  for(const n of Object.keys(z.files).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n))){ const h=hijos((await z.file(n).async('string')).replace(/<sheetData>[\s\S]*<\/sheetData>/,'<sheetData/>'),'worksheet');
    if(!h.length||!h.every((t,i)=>ORDEN_HOJA.indexOf(t)>=0&&(i===0||ORDEN_HOJA.indexOf(h[i-1])<=ORDEN_HOJA.indexOf(t)))) mal.push(n+': '+h.join(' > ')); } return mal; }
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const ctx=await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true}); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(new Date(2026,9,30,10,0,0));
  let trmOk=true;
  await ctx.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('exceljs.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('exceljs/dist/exceljs.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('pdf.worker.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.worker.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('pdf.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('datos.gov.co')) return trmOk?r.fulfill({body:JSON.stringify([{valor:'3500.25',unidad:'COP',vigenciadesde:'2026-10-30T00:00:00.000',vigenciahasta:'2026-11-03T00:00:00.000'},{valor:'3490',unidad:'COP',vigenciadesde:'2026-10-29T00:00:00.000',vigenciahasta:'2026-10-29T00:00:00.000'}]),contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'}}):r.fulfill({status:503,body:''});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  ok('versión v2.13.2 arriba',await p.evaluate(()=>document.getElementById('verTag').textContent.trim()==='v2.13.2'));
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  ok('un estado viejo abre sin TRM oficial guardada',await p.evaluate(()=>typeof TRMOF==='object'&&Object.keys(TRMOF).length===0));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(100);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV&&PKPREV.res,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  await p.setInputFiles('#v2File',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  await p.evaluate(()=>{ WIZ.work.forEach(w=>{ if(!(''+w.proj).trim()) w.proj='(sin nombre)'; }); wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(800);
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} }); await p.waitForTimeout(200);

  /* ---- TRM oficial ---- */
  const t0=await p.evaluate(()=>_p16TrmFuente().trm);
  const tr=await p.evaluate(async()=>{ const o=await _neTrmTraer(); return {o,g:TRMOF['2026-10-30'],caja:_p16TrmFuente(),x:p14Calc('pago').trm}; });
  ok('trae la TRM oficial vigente hoy ('+tr.o.v+', vigente '+tr.o.desde+' a '+tr.o.hasta+') y la guarda con su fecha',tr.o.v===3500.25&&tr.g&&tr.g.f==='oficial'&&tr.g.desde==='2026-10-30');
  ok('la Caja convierte con la oficial y no con la de antes ('+t0+')',tr.caja.trm===3500.25&&tr.x===3500.25&&/oficial/.test(tr.caja.de));
  const rt=await p.evaluate(()=>{ const s=serializeState(); TRMOF={}; applyState(JSON.parse(s)); return TRMOF['2026-10-30']&&TRMOF['2026-10-30'].v; });
  ok('la TRM guardada vuelve al recargar',rt===3500.25);

  /* ---- los números de la hoja ---- */
  const d=await p.evaluate(()=>{ const d=neDatos('Solenium',0,3500.25), r=x=>Math.round(x*100)/100;
    const X=p14Calc('pago'), egrCaja=['china','mag','tiba','otros','fij','imp'].reduce((s,k)=>s+X.R[k].v[0],0);
    return {egr:d.egr,ing:d.ing,nec:d.nec,ya:d.ya,falta:d.falta,ec:d.ec,G:d.G.map(g=>({k:g.k,usd:g.usd,cop:g.cop,n:g.items.length,suma:r(g.items.reduce((s,x)=>s+x.usd,0))})),
      egrCaja:r(egrCaja), ingCaja:r(X.R.ext.v[0]), L:_p14Iso(d.L), fin:_p14Iso(d.fin), trm:d.trm}; });
  ok('semana de lunes a domingo ('+d.L+' a '+d.fin+')',d.L==='2026-10-26'&&d.fin==='2026-11-01');
  ok('pagos de la semana = lo mismo que la Caja (US$ '+d.egr+')',Math.abs(d.egr-d.egrCaja)<0.05&&d.egr>0);
  ok('cada grupo suma sus pagos',d.G.every(g=>Math.abs(g.usd-g.suma)<0.01));
  ok('lo que está en pesos se pasa con la TRM elegida (COP ÷ 3,500.25)',d.G.filter(g=>g.cop!=null).length>0&&d.G.filter(g=>g.cop!=null).every(g=>Math.abs(g.cop/3500.25-g.usd)<1));
  ok('entradas de otros clientes = las de la Caja; necesidad = pagos − entradas',Math.abs(d.ing-d.ingCaja)<0.05&&Math.abs(d.nec-(d.egr-d.ing))<0.01);
  ok('por girar se reparte: vencido + lo de la semana + a favor',Math.abs(d.ec.aV+d.ec.aS+d.ec.fav-d.falta)<0.02&&d.ec.aV<=d.ec.V+0.01&&d.ec.aS<=d.ec.S+0.01);
  const ya=await p.evaluate(()=>{ const a={id:'ecane1',cliente:'Solenium',fecha:'2026-10-28',usd:10000,nota:'giro de prueba'}; ecAbonoAplicar('Solenium',a,null); ECA.push(a);
    const d=neDatos('Solenium',0,3500.25), d1=neDatos('Solenium',1,3500.25); return {ya:d.ya,falta:d.falta,nec:d.nec,ya1:d1.ya,L1:_p14Iso(d1.L)}; });
  ok('lo que Solenium ya giró esa semana se descuenta (US$ '+ya.ya+')',ya.ya===10000&&Math.abs(ya.falta-Math.max(0,ya.nec-10000))<0.01);
  ok('la semana siguiente arranca el lunes '+ya.L1+' y no tiene giros todavía',ya.L1==='2026-11-02'&&ya.ya1===0);

  /* ---- standby: no se gira a China ---- */
  const sb=await p.evaluate(()=>{ const X0=p14Calc('pago'), pp=cjPagos().filter(x=>x.e&&x.e.mfg&&x.tipo!=='otros'&&x.fecha&&x.monto>0.5); if(!pp.length) return null;
    const e=pp[0].e, t0=X0.R.china.v.reduce((s,v)=>s+v,0); prStandby(e,true); const X1=p14Calc('pago'), t1=X1.R.china.v.reduce((s,v)=>s+v,0), deuda=cjPagos().some(x=>x.e===e);
    prStandby(e,false); return {der:e.derrame,t0,t1,deuda,m:pp.filter(x=>x.e===e).reduce((s,x)=>s+x.monto,0)}; });
  ok('un pedido en standby ('+(sb&&sb.der)+') no se programa para girar a China; la deuda sigue',!!sb&&sb.t1<sb.t0-0.5&&sb.deuda);

  /* ---- PDF y Excel con el diálogo ---- */
  const dl1=await p.evaluate(()=>{ ecPDF('Solenium'); const s=document.getElementById('neDlg'); if(!s) return null;
    return {on:+(s.querySelector('[data-w].on')||{}).dataset.w, trm:s.querySelector('#neTrm').value, res:s.querySelector('#neRes').textContent}; });
  ok('a Solenium, el botón PDF primero pregunta la semana (viernes: la siguiente) y trae la TRM oficial',!!dl1&&dl1.on===1&&dl1.trm==='3,500.25'&&/Necesidad/.test(dl1.res));
  await p.evaluate(()=>document.querySelector('#neDlg [data-w="0"]').click());
  const [pop]=await Promise.all([p.waitForEvent('popup'),p.evaluate(()=>document.querySelector('#neDlg [data-r="1"]').click())]);
  await pop.waitForLoadState(); const ph=await pop.content(); await pop.close();
  ok('el PDF trae el estado de cuenta y la hoja "Necesidad de efectivo" de esta semana, con la TRM',/Lo que vence, fecha a fecha/.test(ph)&&/<h1>Necesidad de efectivo<\/h1>/.test(ph)&&/Semana del 26 de octubre al 1 de noviembre de 2026/.test(ph)&&/TRM 3,500.25 oficial/.test(ph)&&/Cómo se abona en el estado de cuenta/.test(ph));
  ok('la hoja va en página aparte, con los pagos por grupo y lo ya girado',/class="ne"/.test(ph)&&/Proveedores en China|Nómina y gastos fijos/.test(ph)&&/Ya girado por Solenium/.test(ph));
  await p.evaluate(()=>{ ecPDF('Solenium'); document.querySelector('#neDlg [data-w="-1"]').click(); });
  const [pop2]=await Promise.all([p.waitForEvent('popup'),p.evaluate(()=>document.querySelector('#neDlg [data-r="1"]').click())]);
  await pop2.waitForLoadState(); const ph2=await pop2.content(); await pop2.close();
  ok('"Sin hoja" baja solo el estado de cuenta',/Lo que vence, fecha a fecha/.test(ph2)&&!/Necesidad de efectivo/.test(ph2));
  const man=await p.evaluate(()=>{ ecExcel('Solenium'); const s=document.getElementById('neDlg'); s.querySelector('[data-w="1"]').click(); const i=s.querySelector('#neTrm'); i.value='3,600'; i.dispatchEvent(new Event('input'));
    return {f:s.querySelector('#neTrmF').textContent}; });
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.evaluate(()=>document.querySelector('#neDlg [data-r="1"]').click())]);
  const fx=path.join(__dirname,'_z210.xlsx'); await dl.saveAs(fx); const mal=await malFormado(fx); const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(fx); fs.unlinkSync(fx);
  ok('Excel lo puede abrir (piezas en el orden del formato)'+(mal.length?' · '+mal.join(' | '):''),mal.length===0);
  const hs=wb.worksheets.map(w=>w.name), ws=wb.getWorksheet('Necesidad de efectivo');
  ok('el Excel trae la hoja "Necesidad de efectivo" al final ('+hs.join(', ')+')',hs[0]==='Estado de cuenta'&&hs[hs.length-1]==='Necesidad de efectivo');
  ok('en el Excel va la semana siguiente con la TRM escrita a mano',!!ws&&/Semana del 2 al 8 de noviembre de 2026/.test(ws.getCell('A3').value)&&/TRM 3,600.00 escrita a mano/.test(ws.getCell('A3').value)&&man.f==='Escrita a mano');
  ok('la TRM escrita a mano queda guardada como tal',await p.evaluate(()=>TRMOF['2026-10-30'].v===3600&&TRMOF['2026-10-30'].f==='mano'));
  ok('un cliente que no es del grupo baja directo, sin diálogo',await p.evaluate(()=>{ const o=window.open; let abierto=false; window.open=()=>{ abierto=true; return null; }; ecPDF('Enexa S.A.S'); window.open=o; return abierto&&!document.getElementById('neDlg'); }));
  trmOk=false;
  const sin=await p.evaluate(async()=>{ TRMOF={}; const r=await _neTrmTraer().then(()=>'ok').catch(()=>'falla'); ecPDF('Solenium'); await new Promise(z=>setTimeout(z,300));
    const s=document.getElementById('neDlg'), i=s.querySelector('#neTrm'); i.value=''; i.dispatchEvent(new Event('input')); s.querySelector('[data-w="0"]').click(); s.querySelector('[data-r="1"]').click();
    const e=s.querySelector('#neErr'); const out={r,err:!e.hidden&&/Escribe la TRM/.test(e.textContent),sigue:!!document.getElementById('neDlg')}; s.querySelector('[data-r="0"]').click(); return out; });
  ok('sin conexión no inventa una TRM: pide escribirla',sin.r==='falla'&&sin.err&&sin.sigue);
  ok('sin errores de página',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exit(f?1:0);
})();
