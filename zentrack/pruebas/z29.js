/* v2.9 · Excel de planes: pagos, cobros y precios en un archivo que se baja y se sube.
   Hoy fijado en 30-oct-2026. Usa RESP.json, DATOS.json, DET23.xlsx y OR23.xlsx (fuera del repo).
   - Descargar: Léeme, Pagos, Cobros y Precios; cada fila con su código.
   - Subir sin cambios: nada que aprobar. Con cambios: "qué cambia" y Aprobar.
   - Plan cambiado = acuerdo nuevo (el anterior al historial); las cuotas que existían conservan lo pagado.
   - Automático cambiado = plan propio. Pagos con fecha y medio; cobros como abono; precios, factura y standby.
   - Subir dos veces lo mismo no duplica nada. Deshacer vuelve a como estaba. */
const {chromium}=require('playwright-core');const fs=require('fs');const os=require('os');const path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const p=await b.newPage({viewport:{width:1440,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(new Date(2026,9,30,10,0,0));
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('pdf.worker.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.worker.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.includes('pdf.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  ok('versión v2.13.2 arriba',await p.evaluate(()=>document.getElementById('verTag').textContent.trim()==='v2.13.2'));
  await p.evaluate(s=>{applyState(JSON.parse(s));refreshAll();},fs.readFileSync(__dirname+'/RESP.json','utf8'));
  await p.evaluate(()=>navTo('config')); await p.waitForTimeout(100);
  await p.setInputFiles('#pkFile','DATOS.json'); await p.waitForFunction(()=>PKPREV&&PKPREV.res,null,{timeout:10000}); await p.evaluate(()=>pkAplicar());
  await p.setInputFiles('#v2File',['DET23.xlsx','OR23.xlsx']);
  await p.waitForFunction(()=>WIZ&&WIZ.loaded,null,{timeout:30000});
  await p.evaluate(()=>{ WIZ.work.forEach(w=>{ if(!(''+w.proj).trim()) w.proj='(sin nombre)'; }); wizGo(2); wizGo(3); wizGo(4); wizApprove(); }); await p.waitForTimeout(800);
  await p.evaluate(()=>{ try{ rosAplicar(); }catch(e){} }); await p.waitForTimeout(200);
  const llaves0=await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','));

  /* ---- botones y descarga ---- */
  await p.evaluate(()=>{ navTo('planes'); renderPlanes(); }); await p.waitForTimeout(200);
  ok('Planes: botones Descargar Excel y Subir Excel',await p.evaluate(()=>/Descargar Excel/.test(document.querySelector('#v-planes .z-ph').textContent)&&!!document.querySelector('#v-planes .z-ph input[type=file]')));
  const lib=await p.evaluate(()=>{ const wb=zpxLibro(), S=wb.SheetNames, J=n=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''});
    const P=J('Pagos'), C=_v3Cps(), esp=C.filter(c=>c.dir==='p').reduce((a,c)=>a+Math.max(1,_z27Vista(c).L.length),0), cods=P.slice(1).map(r=>r[9]);
    const fecha=wb.Sheets['Pagos']['C2']; return {S:S.join('|'),filas:P.length-1,esp,unicos:new Set(cods).size===cods.length,fz:fecha&&fecha.t==='n'&&/yyyy/.test(fecha.z||''),
      pre:J('Precios').length-1,eq:EQ.filter(e=>cobroModo(e)!=='especial').length,marca:J('Léeme')[0][0]}; });
  ok('el Excel trae Léeme, Pagos, Cobros y Precios ('+lib.S+')',lib.S==='Léeme|Pagos|Cobros|Precios'&&/Zentrack · Planes, cobros y precios/.test(lib.marca));
  ok('Pagos: una fila por cuota con su código único y fechas como fecha ('+lib.filas+')',lib.filas===lib.esp&&lib.unicos&&lib.fz);
  ok('Precios: una fila por pedido ('+lib.pre+')',lib.pre===lib.eq);
  /* subir lo mismo: nada que aprobar */
  const rt=await p.evaluate(()=>{ const buf=XLSX.write(zpxLibro(),{type:'array',bookType:'xlsx'}), wb=XLSX.read(new Uint8Array(buf),{type:'array'}), X=zpxComparar(wb); return {n:X.n,e:X.errores.length,a:X.avisos.length}; });
  ok('subir el Excel sin tocarlo no cambia nada',rt.n===0&&rt.e===0);

  /* ---- un Excel con cambios ---- */
  const prep=await p.evaluate(()=>{ const wb=XLSX.read(new Uint8Array(XLSX.write(zpxLibro(),{type:'array',bookType:'xlsx'})),{type:'array'});
    const J=n=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''}), put=(n,a)=>{ wb.Sheets[n]=XLSX.utils.aoa_to_sheet(a); };
    const ser=iso=>_zpxSerial(iso), P=J('Pagos'), Co=J('Cobros'), Pr=J('Precios'), info={};
    /* Eaglerise: mover y subir una cuota futura; quitar otra */
    const eg=P.map((r,i)=>[r,i]).filter(([r,i])=>i>0&&r[0]==='Eaglerise'&&r[2]);
    const fut=eg.filter(([r])=>r[2]>ser(_p14Iso(TODAY))); const [rm,im]=fut[0], [rq,iq]=fut[1];
    info.mov={cod:rm[9],f:_zpxFecha(rm[2]+7),m:_z27r2(rm[3]+1000)}; rm[2]+=7; rm[3]=_z27r2(rm[3]+1000);
    info.pag={cod:rm[9]}; rm[6]=1234; rm[7]='Cruce'; rm[5]=ser(_p14Iso(TODAY));
    info.quita=rq[9]; P.splice(iq,1);
    /* Nexus: una cuota nueva sin código, con un pago por Finkargo */
    P.push(['Nexus · Singsun','',ser('2026-11-09'),5000,'',ser('2026-10-30'),2000,'Finkargo','','']);
    /* Magnum (automático): cambiar un monto */
    const mg=P.find(r=>/^Automático/.test(r[1])&&r[2]); if(mg){ const c=_v3Cps().find(x=>x.n===mg[0]); info.auto=c&&c.id; info.mag={m0:mg[3]}; mg[3]=_z27r2(mg[3]+500); }
    /* un nombre que no existe */
    P.push(['Fulano de tal','',ser('2026-11-20'),10,'','','','','','']);
    put('Pagos',P);
    /* Solenium: un cobro nuevo */
    const so=Co.find(r=>r[0]==='Solenium'); so[6]=ser('2026-10-30'); so[7]=15000; put('Cobros',Co);
    /* precios: calcular uno sin precio, facturar uno provisional, standby otro */
    const H=Pr[0], ix=t=>H.indexOf(t), sin=Pr.find(r=>r[0]==='Solenium'&&r[ix('Estado')]==='Sin precio'), prov=Pr.filter(r=>r[0]==='Solenium'&&/^Provisional/.test(r[ix('Estado')]));
    sin[ix('Flete')]=10000; sin[ix('Aduana')]=300; sin[ix('Zentrack')]=5000; sin[ix('Margen %')]=10; info.sin=sin[ix('Código (no tocar)')].slice(2);
    prov[0][ix('Factura n.º')]='FE-9'; prov[0][ix('Fecha factura')]=ser('2026-10-29'); prov[0][ix('Valor factura')]=90000; info.fac=prov[0][ix('Código (no tocar)')].slice(2);
    prov[1][ix('Standby')]='sí'; info.sb=prov[1][ix('Código (no tocar)')].slice(2); put('Precios',Pr);
    window._zwb=wb; window._zinfo=info;
    const X=zpxComparar(wb), pl=X.planes.map(P2=>P2.c.id+(P2.auto?'(auto)':'')+':'+P2.mov.length+'/'+P2.nue.length+'/'+P2.bor.length);
    info.mag0=info.auto&&_v3Cp(info.auto)&&_v3Cp(info.auto).act; info.eca=ECA.length; info.egAct=_v3Cp('pago:eagle').act; info.eqSin=precioVenta(_prEq(info.sin));
    return {pl,pagos:X.pagos.map(o=>o.c.id+' '+o.m+' '+o.medio),cobros:X.cobros.length,precios:X.precios.length,err:X.errores,n:X.n,info}; });
  ok('qué cambia: Eaglerise (1 cambiada, 1 quitada), Nexus (1 nueva), '+prep.info.auto+' pasa a plan propio · '+prep.pl.join(' · '),!!prep.info.auto&&prep.pl.includes('pago:eagle:1/0/1')&&prep.pl.includes('pago:nexus:0/1/0')&&prep.pl.includes(prep.info.auto+'(auto):1/0/0'));
  ok('qué cambia: 2 pagos (Cruce y Finkargo), 1 cobro y 3 precios',prep.pagos.length===2&&prep.pagos.some(x=>/pago:eagle 1234 cruce/.test(x))&&prep.pagos.some(x=>/pago:nexus 2000 finkargo/.test(x))&&prep.cobros===1&&prep.precios===3);
  ok('una fila con un nombre que no existe no se usa y se avisa',prep.err.some(e=>/Fulano de tal/.test(e)));
  /* la ventana y Aprobar */
  await p.evaluate(()=>zpxPrevia(window._zwb)); await p.waitForTimeout(150);
  const dl=await p.evaluate(()=>{ const d=document.getElementById('zpxDlg'); return d?{t:d.textContent,btn:(d.querySelector('[data-zx="si"]')||{}).textContent}:null; });
  ok('la ventana muestra planes, pagos, cobros, precios y lo que no se usa',!!dl&&/Planes/.test(dl.t)&&/Pagos/.test(dl.t)&&/Cobros/.test(dl.t)&&/Precios/.test(dl.t)&&/No se usan/.test(dl.t)&&/Aprobar/.test(dl.btn));
  const s0=await p.evaluate(()=>serializeState());
  await p.click('#zpxDlg [data-zx="si"]'); await p.waitForTimeout(300);
  const ap=await p.evaluate(i=>{ const eg=_v3Cp('pago:eagle'), L=_v3Lin(eg,eg.act), lid=i.mov.cod.split('|').slice(2).join('|'), l=L.find(x=>x.id===lid), quit=i.quita.split('|').slice(2).join('|');
    const nx=_v3Cp('pago:nexus'), Ln=_v3Lin(nx,nx.act), nl=Ln.find(x=>x.f==='2026-11-09'&&Math.abs(x.m-5000)<0.01), mg=i.auto?_v3Cp(i.auto):null, pl=_v2Plan('pago:eagle');
    const ver=(pl.versiones||[]).find(v=>v.id===eg.act);
    return {egAct:eg.act,nombre:ver&&ver.nombre,mov:!!l&&l.f===i.mov.f&&Math.abs(l.m-i.mov.m)<0.01,quita:!L.some(x=>x.id===quit),hist:_v3Vers(eg).some(v=>v.id===i.egAct),
      pagEg:(PLANES.reg[lid]||[]).map(r=>r.medio+':'+r.m).join(','),realEg:_v3Real()[lid],nexus:!!nl&&(PLANES.reg[nl.id]||[]).some(r=>r.medio==='finkargo'&&r.m===2000),
      mag:mg?mg.act:null,eca:ECA.length,abono:(ECA[ECA.length-1]||{}).nota,sin:precioVenta(_prEq(i.sin)),esp:Math.round(((_pcCosto(_prEq(i.sin))+10300)*1.1+5000*(1+_prDef().mExtra))*100)/100,
      fac:prEstado(_prEq(i.fac))+':'+precioVenta(_prEq(i.fac)),sb:prEstado(_prEq(i.sb)),toast:(document.getElementById('z26Toast')||{}).textContent||''}; },prep.info);
  ok('Eaglerise: acuerdo nuevo "'+ap.nombre+'" vigente, cuota movida, la quitada ya no está y el anterior en el historial',ap.egAct!==prep.info.egAct&&/^Excel /.test(ap.nombre||'')&&ap.mov&&ap.quita&&ap.hist);
  ok('el pago por Cruce quedó en esa misma cuota ('+ap.pagEg+')',/cruce:1234/.test(ap.pagEg)&&ap.realEg>=1234);
  ok('Nexus: la cuota nueva con su pago por Finkargo',ap.nexus);
  ok(prep.info.auto+': pasó de automático a plan propio ('+ap.mag+')',!!prep.info.mag0&&prep.info.mag0==='base'&&ap.mag&&ap.mag!=='base');
  ok('Solenium: el cobro quedó como abono',ap.eca===prep.info.eca+1&&/Excel/.test(ap.abono||''));
  ok('precios: calculado ('+ap.sin+'), facturado ('+ap.fac+') y standby',ap.sin===ap.esp&&ap.fac==='facturado:90000'&&ap.sb==='standby');
  ok('aviso con Deshacer',/Deshacer/.test(ap.toast));
  /* subir otra vez el mismo archivo: nada nuevo */
  const re=await p.evaluate(()=>{ const X=zpxComparar(window._zwb); return {n:X.n,pl:X.planes.map(x=>x.c.id),pg:X.pagos.length,co:X.cobros.length,pr:X.precios.length}; });
  ok('subir el mismo archivo otra vez no duplica nada ('+JSON.stringify(re)+')',re.n===0);
  /* Deshacer */
  await p.evaluate(()=>z26Deshacer()); await p.waitForTimeout(300);
  ok('Deshacer deja todo como antes de aprobar',await p.evaluate(s=>{ const a=JSON.parse(s), b2=JSON.parse(serializeState()); return JSON.stringify(a.PLANES)===JSON.stringify(b2.PLANES)&&JSON.stringify(a.ECA)===JSON.stringify(b2.ECA)&&JSON.stringify(a.PRECIO)===JSON.stringify(b2.PRECIO); },s0));
  /* "Cargar archivo" reconoce el Excel de planes */
  const arch=path.join(os.tmpdir(),'z29_planes.xlsx');
  fs.writeFileSync(arch,Buffer.from(await p.evaluate(()=>Array.from(new Uint8Array(XLSX.write(window._zwb,{type:'array',bookType:'xlsx'}))))));
  await p.evaluate(()=>{ const d=document.getElementById('zpxDlg'); if(d) d.remove(); });
  await p.setInputFiles('#v2File',arch); await p.waitForTimeout(800);
  ok('"Cargar archivo" reconoce el Excel de planes y abre "qué cambia"',await p.evaluate(()=>!!document.getElementById('zpxDlg')&&!(WIZ&&WIZ.loaded&&document.querySelector('#verify.on'))));
  await p.evaluate(()=>{ const d=document.querySelector('#zpxDlg [data-zx="no"]'); if(d) d.click(); });
  ok('Cancelar no cambia nada',await p.evaluate(s=>JSON.stringify(JSON.parse(serializeState()).PLANES)===JSON.stringify(JSON.parse(s).PLANES),s0));
  ok('el estado no gana llaves nuevas',await p.evaluate(()=>Object.keys(JSON.parse(serializeState())).sort().join(','))===llaves0);
  ok('sin errores de página',errs.length===0); if(errs.length) console.log(errs.slice(0,5).join('\n'));
  try{ fs.unlinkSync(arch); }catch(e){}
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exit(f?1:0);
})();
