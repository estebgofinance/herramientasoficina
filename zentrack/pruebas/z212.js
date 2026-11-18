/* v2.12 · Necesidad de efectivo: pantalla para decidir qué pedirle a un cliente del grupo.
   Hoy fijado en 30-oct-2026 (viernes). Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo). Cifras inventadas.
   - Botón en el estado de cuenta del cliente del grupo y en la Caja; abre con la misma cifra de la hoja (v2.10).
   - Desmarcar, pedir una parte y ajustar cambian la cifra y lo que ve el cliente; no se guarda nada.
   - "Otra semana" mueve el pago también en la Caja; Deshacer lo devuelve.
   - El PDF y el Excel van por rubro, sin el detalle. */
const {chromium}=require('playwright-core');const fs=require('fs');const ExcelJS=require('exceljs');const JSZip=require('jszip');
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
  await ctx.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('exceljs.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('exceljs/dist/exceljs.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  ok('versión v2.13.2 arriba',await p.evaluate(()=>document.getElementById('verTag').textContent.trim()==='v2.13.2'));
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(100);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV&&PKPREV.res,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  await p.setInputFiles('#v2File',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  await p.evaluate(()=>{ WIZ.work.forEach(w=>{ if(!(''+w.proj).trim()) w.proj='(sin nombre)'; }); wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(800);
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} TRMOF['2026-10-30']={v:3500.25,f:'oficial',desde:'2026-10-30',hasta:'2026-11-03'}; }); await p.waitForTimeout(200);
  const est0=await p.evaluate(()=>serializeState());

  /* ---- los botones ---- */
  await p.evaluate(()=>{ navTo('clientes'); selCliData('Solenium'); }); await p.waitForTimeout(300);
  const bt=await p.evaluate(()=>{ const a=!!document.getElementById('ne2Btn'); const ext=_ecClientes().find(c=>!esInterno(c)); selCliData(ext); const bb=!!document.getElementById('ne2Btn');
    navTo('caja'); const cj=[...document.querySelectorAll('#v-caja button')].some(x=>/Necesidad de efectivo · Solenium/.test(x.textContent)); navTo('clientes'); selCliData('Solenium'); return {a,bb,cj}; });
  ok('botón "Necesidad de efectivo" en el estado de cuenta de Solenium (no en un cliente externo) y en la Caja',bt.a&&!bt.bb&&bt.cj);
  await p.click('#ne2Btn'); await p.waitForTimeout(300);
  const a0=await p.evaluate(()=>{ const d=neDatos('Solenium',0,null), X=_ne2Calc(); return {pedir:X.pedir,falta:d.falta,vis:!!document.querySelector('#neV2 .ne2-big'),big:document.querySelector('#neV2 .ne2-big').textContent}; });
  ok('abre con la misma cifra de la hoja ('+a0.big+')',a0.vis&&Math.abs(a0.pedir-a0.falta)<0.02&&a0.pedir>0);

  /* ---- decidir: desmarcar, recortar, ajustar (no se guarda nada) ---- */
  const dc=await p.evaluate(async()=>{ const usdIt=[]; ZNE.D.G.forEach(g=>g.items.forEach(it=>{ if(!it.pag&&!it.cuatro&&it.cop==null&&it.usd>10) usdIt.push(it); }));
    const it=usdIt[0], it2=usdIt[1], p0=_ne2Calc().pedir, s0=serializeState(), espera=()=>new Promise(r=>setTimeout(r,50));
    [...document.querySelectorAll('#neV2 input[data-ne="ck"]')].find(x=>x.dataset.k===it.key).click(); await espera();
    const p1=_ne2Calc().pedir, tachada=!!document.querySelector('#neV2 tr.off');
    const m=[...document.querySelectorAll('#neV2 input[data-ne="m"]')].find(x=>x.dataset.k===it2.key); m.value=String(Math.round(it2.usd/2)); m.dispatchEvent(new Event('change',{bubbles:true})); await espera();
    const p2=_ne2Calc().pedir; const aj=document.getElementById('ne2Aj'); aj.value='1000'; aj.dispatchEvent(new Event('change',{bubbles:true})); await espera();
    const p3=_ne2Calc().pedir, sole=document.querySelector('#neV2 .ne2-sole').innerText, msg=document.getElementById('ne2Msg').textContent, s1=serializeState();
    return {d1:Math.round((p0-p1)*100)/100,u1:it.usd,d2:Math.round((p1-p2)*100)/100,u2:Math.round((it2.usd-Math.round(it2.usd/2))*100)/100,d3:Math.round((p3-p2)*100)/100,
      tachada,otros:/Otros pagos de la semana/.test(sole),msg:/US\$ /.test(msg)&&/Va con el estado de cuenta/.test(msg),igual:s0===s1}; });
  ok('desmarcar un pago lo quita de la cifra ('+dc.d1+') y queda tachado',Math.abs(dc.d1-dc.u1)<0.02&&dc.tachada);
  ok('pedir una parte baja la cifra en lo que no se pide ('+dc.d2+')',Math.abs(dc.d2-dc.u2)<0.02);
  ok('el ajuste suma y el cliente lo ve como "Otros pagos de la semana"; el mensaje queda listo',Math.abs(dc.d3-1000)<0.02&&dc.otros&&dc.msg);
  ok('decidir no guarda nada en el estado',dc.igual);

  /* ---- lo que ve el cliente: por rubro, en PDF y Excel ---- */
  const hj=await p.evaluate(()=>{ const ne=neV2Hoja(), h=_ecPdfHTML('Solenium',ne), X=_ne2Calc(); const g=ZNE.D.G.find(x=>x.items.some(i=>!i.cuatro)), txt=g?g.items.find(i=>!i.cuatro).txt:'';
    return {R:ne.R.length,falta:ne.falta,pedir:X.pedir,rubro:ne.R.every(r=>h.indexOf(esc4(r.nom))>=0),sinItem:!txt||h.indexOf(esc4(txt))<0,suma:Math.abs(ne.R.reduce((s,r)=>s+r.usd,0)-ne.egr)<0.02}; });
  ok('el PDF va por rubro ('+hj.R+' rubros), sin el detalle, y "por girar" = la cifra',hj.R>0&&hj.rubro&&hj.sinItem&&hj.suma&&Math.abs(hj.falta-hj.pedir)<0.02);
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:30000}),p.evaluate(()=>document.querySelector('#neV2 [data-ne="xls"]').click())]);
  const fx=__dirname+'/_z212.xlsx'; await dl.saveAs(fx); const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(fx); const ws=wb.worksheets[wb.worksheets.length-1];
  let porPagar=0; ws.eachRow(r=>{ if(!r.hidden&&r.getCell(5).value==='Por pagar') porPagar++; });
  const mal=await malFormado(fx); fs.unlinkSync(fx);
  ok('el Excel trae la hoja por rubro al final ('+ws.name+') y abre sin daño',ws.name==='Necesidad de efectivo'&&porPagar===0&&mal.length===0);

  /* ---- "Otra semana": también en la Caja; Deshacer ---- */
  const mv=await p.evaluate(async()=>{ let it=null, g0=null; ZNE.D.G.forEach(g=>g.items.forEach(x=>{ if(!it&&x.mov){ it=x; g0=g.k; } })); if(!it) return {sin:true};
    const antesG=ZNE.D.G.find(x=>x.k===g0).items.reduce((s,x)=>s+x.usd,0), antes=JSON.stringify({CXPMIO,PLANES,PLANCHINA}), X0=p14Calc('pago'), w0=X0.R[g0].v[0], w1=X0.R[g0].v[1], u=it.usd;
    [...document.querySelectorAll('#neV2 button[data-ne="mov"]')].find(x=>x.dataset.k===it.key).click(); await new Promise(r=>setTimeout(r,100));
    const sumG=()=>{ const g=ZNE.D.G.find(x=>x.k===g0); return g?g.items.reduce((s,x)=>s+x.usd,0):0; }; const X1=p14Calc('pago'), sigue=Math.abs((antesG-sumG())-u)>0.05, toast=document.getElementById('ne2Toast').textContent;
    const r={g0,u,d0:Math.round((w0-X1.R[g0].v[0])*100)/100,d1:Math.round((X1.R[g0].v[1]-w1)*100)/100,sigue,toast};
    document.querySelector('#neV2 [data-ne="undo"]').click(); await new Promise(r=>setTimeout(r,100));
    const X2=p14Calc('pago'); r.vuelve=Math.abs(X2.R[g0].v[0]-w0)<0.02; r.igual=JSON.stringify({CXPMIO,PLANES,PLANCHINA})===antes; return r; });
  ok('"Otra semana" lo pasa a la siguiente también en la Caja ('+mv.g0+' '+mv.u+')',!mv.sin&&Math.abs(mv.d0-mv.u)<0.05&&Math.abs(mv.d1-mv.u)<0.05&&!mv.sigue&&/Caja/.test(mv.toast));
  ok('Deshacer lo devuelve a su semana y deja los planes como estaban',mv.vuelve&&mv.igual);

  /* ---- semana siguiente y cerrar ---- */
  const s1=await p.evaluate(async()=>{ document.querySelector('#neV2 [data-ne="w"][data-w="1"]').click(); await new Promise(r=>setTimeout(r,80));
    const r={w:ZNE.w,dw:ZNE.D&&ZNE.D.w}; document.querySelector('#neV2 [data-ne="cerrar"]').click(); await new Promise(r=>setTimeout(r,50)); r.cerrado=!document.getElementById('neV2'); return r; });
  ok('"Siguiente" arma la semana que viene; Cerrar quita la pantalla',s1.w===1&&s1.dw===1&&s1.cerrado);
  ok('sin llaves nuevas en el estado',await p.evaluate(e0=>Object.keys(JSON.parse(serializeState())).sort().join(',')===Object.keys(JSON.parse(e0)).sort().join(','),est0));
  ok('sin errores de página',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK'+(f?' · '+f+' con falla':'')); await b.close(); process.exitCode=f?1:0;
})();
