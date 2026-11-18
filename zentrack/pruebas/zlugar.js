/* v1.7.1 · al editar no se pierde el lugar: la lista de Precios no vuelve arriba,
   la página tampoco, y en Clientes el cliente abierto sigue abierto. */
const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  let n=0,f=0; const ok=(t,c)=>{c?n++:f++;console.log((c?'  OK   ':'  FALLA ')+t);};
  const p=await b.newPage({viewport:{width:1400,height:700}}); const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('dialog',d=>d.accept());
  await p.route('**/*',r=>{const u=r.request().url();
    if(u.includes('xlsx.full.min.js'))return r.fulfill({body:fs.readFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'),'utf8'),contentType:'text/javascript'});
    if(u.startsWith('http'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await p.goto('file://'+__dirname+'/ASM4.html'); await p.waitForTimeout(400);
  await p.evaluate(()=>verifyOpen()); await p.setInputFiles('#reportFile',['DET3.xlsx','OR2.xlsx']);
  await p.waitForFunction(()=>WIZ.loaded&&WIZ.work&&WIZ.work.length,null,{timeout:60000});
  await p.evaluate(()=>{wizGo(2);wizApprove();navTo('precios');}); await p.waitForTimeout(300);

  /* Precios: bajar en la lista y cambiar un precio de una fila de abajo */
  const r=await p.evaluate(()=>{
    const w=document.querySelector('#v-precios .pc-wrap'); if(!w) return null;
    w.scrollTop=600; window.scrollTo(0,200);
    const antes={w:w.scrollTop,y:window.scrollY};
    const fila=[...document.querySelectorAll('#v-precios tr.pc-r')].find(tr=>tr.offsetTop>w.scrollTop+50);
    /* la casilla de precio (desde v1.7.2 el costo también es casilla, en la columna anterior) */
    const inp=fila.children[6].querySelector('input.pc-num'); inp.value='12345'; inp.dispatchEvent(new Event('change'));
    const sel=document.querySelectorAll('#v-precios tr.pc-r select.cb-sel')[[...document.querySelectorAll('#v-precios tr.pc-r')].indexOf(fila)];
    if(sel){ sel.value='sinfac'; sel.dispatchEvent(new Event('change')); }
    const w2=document.querySelector('#v-precios .pc-wrap');
    return {antes, w:w2.scrollTop, y:window.scrollY, nuevo:w2!==w};
  });
  ok('Precios: la lista se repinta y queda donde estaba ('+(r&&r.antes.w)+' → '+(r&&r.w)+')',!!r&&r.nuevo&&r.antes.w>0&&Math.abs(r.w-r.antes.w)<2);
  ok('Precios: la página tampoco vuelve arriba ('+(r&&r.antes.y)+' → '+(r&&r.y)+')',!!r&&Math.abs(r.y-r.antes.y)<2);

  /* Clientes: abrir el segundo cliente y repintar todo */
  await p.evaluate(()=>navTo('clientes')); await p.waitForTimeout(200);
  const c=await p.evaluate(()=>{
    renderClientes();
    const items=[...document.querySelectorAll('#clList .cl-item')]; if(items.length<2) return null;
    items[1].click(); const quien=items[1].querySelector('.cn').firstChild.textContent.trim();
    refreshAll(); renderClientes();
    const on=document.querySelector('#clList .cl-item.on');
    return {quien, on:on?on.querySelector('.cn').firstChild.textContent.trim():null,
      det:(document.querySelector('#clDetail .ec8-name, #clDetail .ec-hero-name')||{}).textContent};
  });
  ok('Clientes: el cliente abierto sigue abierto después de repintar ('+(c&&c.quien)+')',!!c&&c.on===c.quien&&c.det===c.quien);
  ok('los datos no cambian: el precio escrito quedó guardado',await p.evaluate(()=>EQ.some(e=>+e.precioVenta===12345)));
  ok('sin errores de JS',errs.length===0);
  if(errs.length) console.log(errs.slice(0,5).join('\n'));
  console.log('\n'+n+' OK · '+f+' fallas'); await b.close(); process.exitCode=f?1:0;
})();
