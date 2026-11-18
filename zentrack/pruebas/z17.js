/* v1.17 · Estado de cuenta en PDF y Excel, más claros.
   Hoy fijado en 26-oct-2026. Usa RESP.json y DATOS.json (datos preparados de Esteban), fuera del repo.
   El Excel nuevo usa ExcelJS (se sirve desde node_modules); si no carga, baja el Excel sencillo de antes. */
const {chromium}=require('playwright-core');const fs=require('fs');const path=require('path');const ExcelJS=require('exceljs');const JSZip=require('jszip');
/* v1.17.4: Excel no abre un archivo cuyas piezas vienen en otro orden del que exige su formato (dice "dañado").
   ExcelJS al leer no se queja, así que aquí se revisa el orden dentro de cada hoja. */
const ORDEN_HOJA=['sheetPr','dimension','sheetViews','sheetFormatPr','cols','sheetData','sheetCalcPr','sheetProtection','protectedRanges','scenarios','autoFilter','sortState','dataConsolidate','customSheetViews','mergeCells','phoneticPr','conditionalFormatting','dataValidations','hyperlinks','printOptions','pageMargins','pageSetup','headerFooter','rowBreaks','colBreaks','customProperties','cellWatches','ignoredErrors','smartTags','drawing','legacyDrawing','legacyDrawingHF','picture','oleObjects','controls','webPublishItems','tableParts','extLst'];
const ORDEN_PR=['tabColor','outlinePr','pageSetUpPr'];
function hijos(xml,padre){ const out=[]; let d=0, dentro=false, m; const re=/<(\/?)([\w:]+)[^>]*?(\/?)>/g;
  while((m=re.exec(xml))){ const [,cierra,tag,sola]=m;
    if(!dentro){ if(tag===padre&&!cierra){ dentro=!sola; d=0; } continue; }
    if(cierra){ if(d===0) break; d--; continue; }
    if(d===0) out.push(tag); if(!sola) d++; }
  return out; }
const enOrden=(l,orden)=>l.every((t,i)=>orden.indexOf(t)>=0&&(i===0||orden.indexOf(l[i-1])<=orden.indexOf(t)));
async function malFormado(fx){ const z=await JSZip.loadAsync(fs.readFileSync(fx)), mal=[];
  for(const n of Object.keys(z.files).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n))){
    const x=(await z.file(n).async('string')).replace(/<sheetData>[\s\S]*<\/sheetData>/,'<sheetData/>');
    const h=hijos(x,'worksheet'), pr=hijos(x,'sheetPr');
    if(!h.length||!enOrden(h,ORDEN_HOJA)) mal.push(n+': '+h.join(' > '));
    if(!enOrden(pr,ORDEN_PR)) mal.push(n+' sheetPr: '+pr.join(' > ')); }
  return mal; }
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const ctx=await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true}); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(new Date(2026,9,26,10,0,0));
  let sinExcelJS=false;
  await ctx.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('exceljs.min.js'))return sinExcelJS?r.fulfill({status:404,body:''}):r.fulfill({body:fs.readFileSync(require.resolve('exceljs/dist/exceljs.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(150);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  const T=await p.evaluate(()=>{const t=ecTotales('Solenium');return {valor:t.valor,abonado:t.abonado,saldo:t.saldo,vencido:t.vencido};});
  const antes=await p.evaluate(()=>serializeState());
  /* ---- PDF ---- */
  const h=await p.evaluate(()=>_ecPdfHTML('Solenium'));
  ok('el PDF trae los grupos: Shelters, Trackers, Otros productos y Otros cargos',['<h2>Shelters</h2>','<h2>Trackers</h2>','<h2>Otros productos (no vienen de China)</h2>','<h2>Otros cargos</h2>'].every(x=>h.includes(x)));
  ok('Finkargo sale como ficha con su préstamo y sus 3 cuotas',/class="ficha"/.test(h)&&/Préstamo que tomó Zentrack con Finkargo/.test(h)&&/Cuota 1 · interés \+ fondo de garantías \+ giro/.test(h)&&/Cuota 2 · interés/.test(h)&&/Cuota 3 · interés \+ capital/.test(h));
  const fmt=v=>v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  ok('arriba y abajo cuadran con el estado de cuenta: saldo '+fmt(T.saldo)+', vencido '+fmt(T.vencido)+', pagado '+fmt(T.abonado),h.includes('US$ '+fmt(T.saldo))&&h.includes(fmt(T.vencido))&&h.includes('Pagado US$ '+fmt(T.abonado)));
  ok('"Pagos recibidos" suma lo pagado (lo aplicado a cada pedido + los abonos sueltos)',h.includes('<h2>Pagos recibidos</h2><span>total US$ '+fmt(T.abonado)));
  ok('el PDF lo ve el cliente: no dice de dónde sale lo abonado ("columna Abonado")',!/columna Abonado|aplicados directamente/i.test(h));
  ok('más liviano: solo lo vencido va en píldora; pagado, por vencer y sin fecha son texto',/class="pl mal"/.test(h)&&!/class="pl (ok|gr)"/.test(h)&&/class="es ok">Pagado/.test(h)&&/class="es gr">Sin fecha/.test(h));
  ok('pie con fecha de corte y "Página X de Y"',/@bottom-right\{content:"Página " counter\(page\) " de " counter\(pages\)/.test(h)&&/corte 26-oct-26/.test(h));
  const he=await p.evaluate(()=>_ecPdfHTML('Enexa S.A.S'));
  ok('cliente externo (Enexa): dice el plazo y "Vence = ETD + días"',/Vence = ETD \+ \d+ días/.test(he)&&/plazo \d+ días desde ETD/.test(he));
  const [pop]=await Promise.all([p.waitForEvent('popup'),p.evaluate(()=>ecPDF('Solenium',null))]);   /* v2.10: a un cliente del grupo, sin null sale primero el diálogo de la hoja de necesidad (z210) */
  await pop.waitForLoadState(); ok('el botón PDF abre la ventana para imprimir con el formato nuevo',/Lo que vence, fecha a fecha/.test(await pop.content())); await pop.close();
  /* ---- Excel ---- */
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.evaluate(()=>ecExcel('Solenium',null))]);
  const fx=path.join(__dirname,'_z17.xlsx'); await dl.saveAs(fx);
  ok('el Excel baja con nombre EstadoCuenta_Solenium_2026-10-26.xlsx',dl.suggestedFilename()==='EstadoCuenta_Solenium_2026-10-26.xlsx');
  const mal=await malFormado(fx);
  ok('Excel lo puede abrir: las piezas de cada hoja van en el orden que exige el formato'+(mal.length?' · '+mal.join(' | '):''),mal.length===0);
  const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(fx); fs.unlinkSync(fx);
  ok('tres hojas: Estado de cuenta, Fecha a fecha, Abonos',wb.worksheets.map(w=>w.name).join('|')==='Estado de cuenta|Fecha a fecha|Abonos');
  const ws=wb.getWorksheet('Estado de cuenta'), V=c=>{const v=c.value;return v&&typeof v==='object'&&'result' in v?v.result:v;};
  let tot=null, subOk=true, nSub=0, fk=null;
  ws.eachRow((row,rn)=>{ const a=String(V(row.getCell(1))||'');
    if(a==='TOTAL') tot=[5,6,7].map(i=>V(row.getCell(i)));
    if(/^Subtotal /.test(a)){ nSub++; [5,6,7].forEach(i=>{ const fo=row.getCell(i).value.formula, refs=fo.replace(/^SUM\(|\)$/g,'').split(',');
      const s=refs.reduce((acc,r)=>acc+(+V(ws.getCell(r))||0),0); if(Math.abs(s-V(row.getCell(i)))>0.01) subOk=false; }); }
    if(/^Finkargo/.test(a)&&fk===null) fk=rn; });
  ok('TOTAL del Excel = estado de cuenta ('+(tot||[]).map(x=>fmt(+x)).join(' / ')+')',tot&&Math.abs(tot[0]-T.valor)<0.01&&Math.abs(tot[1]-T.abonado)<0.01&&Math.abs(tot[2]-T.saldo)<0.01);
  ok('los '+nSub+' subtotales son fórmulas que suman sus filas',nSub>=4&&subOk);
  const nota=fk&&ws.getRow(fk+1), qs=fk?[2,3,4].map(i=>ws.getRow(fk+i)):[];
  ok('Finkargo: debajo va la nota del préstamo y sus 3 cuotas, plegables',nota&&/Préstamo de Finkargo/.test(String(V(nota.getCell(2))))&&nota.outlineLevel===1&&qs.every(r=>r.outlineLevel===1&&/Cuota/.test(String(V(r.getCell(2))))));
  const af=ws.autoFilter, afOk=typeof af==='string'?/^A12:/.test(af):!!(af&&af.from&&(af.from.row===12||af.from==='A12'));
  ok('encabezado fijo y filtros en la fila 12',ws.views[0].ySplit===12&&afOk);
  /* v1.17.5 · el resumen como lo dejó Esteban en Excel */
  const C=ref=>V(ws.getCell(ref)), cerca=(x,y)=>Math.abs(+x-y)<0.01;
  ok('resumen: Saldo pendiente y Próximos 30 días arriba; Sin fecha, Vencido y Total facturado en la fila 6',
    C('A5')==='Saldo pendiente'&&cerca(C('B5'),T.saldo)&&C('G5')==='Próximos 30 días'&&C('A6')==='Sin fecha'&&C('C6')==='Vencido'&&cerca(C('D6'),T.vencido)
    &&C('G6')==='Total facturado'&&cerca(C('H6'),T.valor));
  ok('"Pagado" ya no va debajo de "Vencido": va como Total pagado, junto a lo facturado',C('G7')==='Total pagado'&&cerca(C('H7'),T.abonado)
    &&![5,6].some(r=>[1,3,4,5,7].some(c=>C(String.fromCharCode(64+c)+r)==='Pagado')));
  const cf=(ws.conditionalFormattings||[]).find(x=>x.ref==='B8:F8'), rb=cf&&cf.rules&&cf.rules[0], b8=ws.getCell('B8');
  ok('barra de avance: B8:F8 unidas, '+Math.round(T.abonado/T.valor*100)+' % con formato 0 % y barra de datos naranja',C('A8')==='% Pagado a la fecha'&&b8.isMerged&&ws.getCell('F8').master===b8
    &&Math.abs(C('B8')-T.abonado/T.valor)<0.0001&&b8.numFmt==='0%'&&rb&&rb.type==='dataBar'&&rb.color&&/FD9C10$/i.test(rb.color.argb)&&C('B9')===0&&C('F9')===1);
  ok('la barra tiene su marco completo (izquierda en B8, derecha en F8, arriba y abajo en todas)',['B','C','D','E','F'].every(L=>{const bo=ws.getCell(L+'8').border||{};
    return bo.top&&bo.bottom&&(L!=='B'||bo.left)&&(L!=='F'||bo.right);}));
  ok('los encabezados de números no van a la derecha (el botón del filtro los tapaba)',[5,6,7,9].every(i=>!(ws.getRow(12).getCell(i).alignment||{}).horizontal));
  ok('"Vencido …" del grupo se ve completo: la celda de al lado va vacía',ws.getRow(13).getCell(9).value===null&&/^Vencido /.test(String(V(ws.getRow(13).getCell(8)))));
  const w2=wb.getWorksheet('Fecha a fecha'); let s2=0, ult=null; w2.eachRow((row,rn)=>{ if(rn>3){ s2+=+V(row.getCell(2))||0; ult=V(row.getCell(3)); } });
  ok('"Fecha a fecha" suma el saldo y el acumulado llega al saldo ('+fmt(s2)+')',Math.abs(s2-T.saldo)<0.05&&Math.abs(ult-T.saldo)<0.05);
  const w3=wb.getWorksheet('Abonos'); let ab=null; w3.eachRow(row=>{ if(V(row.getCell(1))==='Total') ab=V(row.getCell(2)); });
  ok('"Abonos" suma lo pagado',ab!==null&&Math.abs(ab-T.abonado)<0.01);
  let notaInt=false; w3.eachRow(row=>{ if(/columna Abonado|aplicados directamente/i.test(String(V(row.getCell(5))||''))) notaInt=true; });
  ok('y no trae la nota interna de "columna Abonado" (lo ve el cliente)',!notaInt);
  /* ---- si ExcelJS no carga, baja el sencillo ---- */
  sinExcelJS=true; await p.evaluate(()=>{ window.ExcelJS=undefined; document.querySelectorAll('script[src*="exceljs"]').forEach(s=>s.remove()); });
  const [dl2]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.evaluate(()=>ecExcel('Enexa S.A.S'))]);
  const fx2=path.join(__dirname,'_z17b.xlsx'); await dl2.saveAs(fx2); const mal2=await malFormado(fx2);
  const wb2=new ExcelJS.Workbook(); await wb2.xlsx.readFile(fx2); fs.unlinkSync(fx2);
  ok('el sencillo también va en el orden que exige el formato'+(mal2.length?' · '+mal2.join(' | '):''),mal2.length===0);
  ok('sin ExcelJS baja el Excel sencillo de antes (una hoja)',wb2.worksheets.length===1&&wb2.worksheets[0].name==='Estado de cuenta');
  ok('exportar no cambia nada guardado',await p.evaluate(()=>serializeState())===antes);
  ok('sin errores de JS',errs.length===0);
  if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
