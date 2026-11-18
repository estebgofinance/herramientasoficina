# Zentrack · traspaso

Este documento es para quien siga el proyecto, sea una persona u otro Claude, y no estuvo en las conversaciones anteriores. Léelo completo antes de cambiar algo. La versión del repo es **v2.13.2** (ver las secciones "0. v2.13.2", "0. v2.13.1", "0. v2.13", "0. v2.12", "0. v2.11.3", "0. v2.11.2", "0. v2.11.1", "0. v2.11", "0. v2.10", "0. v2.9.3", "0. v2.9.2", "0. v2.9.1", "0. v2.9", "0. v2.8.1", "0. v2.8", "0. v2.7.1", "0. v2.7", "0. v2.6.1", "0. v2.6", "0. v2.4", "0. v2.3" y "0. v2" justo debajo de este párrafo; la v2.5 está en espera en `zentrack/privado/v25_espera/`). Antes fue **v1.17.5**: el resumen de la hoja 1 del Excel del estado de cuenta queda como Esteban lo armó a mano en Excel el 2026-10-28. Va así: A5 Saldo pendiente · G5 Próximos 30 días · A6 Sin fecha · C6 Vencido · G6 Total facturado · G7 Total pagado. "Pagado" ya no va debajo de "Vencido", porque se confundían. En A8 va "% Pagado a la fecha" con una barra en B8:F8 (unidas, valor pagado/facturado, formato 0 %, barra de datos naranja sólida 0 a 1, fondo gris y marco medio negro), y 0 % en B9 y 100 % en F9. Ojo con ExcelJS: al unir celdas, las demás comparten el MISMO objeto de estilo que la primera, así que hay que darle a cada una el suyo (`cl.style=Object.assign({},cl.style,…)`). Los encabezados de números ya no van a la derecha, porque el botón del filtro los tapaba. La celda I del renglón de grupo va en `null` para que "Vencido …" se vea completo. D e I quedan de ancho 12 y la hoja imprime al 70 %, lo que cabe a lo ancho, verificado en Excel. Antes fue **v1.17.4**: el Excel del estado de cuenta salía dañado (Excel no lo abría). En la hoja 1, con `fitToPage` y `outlineProperties.summaryBelow:false` juntos, ExcelJS 4.4 escribe `<sheetPr>` con `pageSetUpPr` antes de `outlinePr`, y el formato exige lo contrario. Ahora la hoja 1 imprime con `scale:75` (cabe a lo ancho, verificado en Excel) y sin `fitToPage`. `z17.js` revisa el orden de las piezas de cada hoja con JSZip, porque ExcelJS al leer no se queja. También se quitó de los exportes, que ve el cliente, la nota "Pagos aplicados directamente a cada pedido (columna Abonado)": el renglón de Pagos recibidos queda con la cifra y sin nota. Antes fue **v1.17.3**: arregla que el aviso de la v1.17.2 no salía al abrir la herramienta. `loadFromServer` pinta pantalla por pantalla (`renderHoy`, `renderConfig`…) y no llama `refreshAll`, así que lo que cuelgue solo de `refreshAll` no aparece hasta la primera acción. El aviso ahora también se pinta desde `renderConfig`, y `z1172.js` simula la apertura real (un `google.script.run` falso que devuelve el estado). Antes fue **v1.17.2** (sección "v1.17.2 · ENEXA: EL ROSARIO 1, 2 Y 3", prueba `z1172.js`). Es un cambio de datos que Esteban aprobó el 2026-10-27, con el chat de WhatsApp "Zentrack China" y sus ORDER REPORT del 25-sep, 5-oct y 23-oct: los trackers de Enexa salen de bodega. 7-6 y 7-7 (Piojo 2 y 3, "Paratebueno 1 y 2" en el ORDER REPORT, que eran de Solenium) pasan a Enexa como **El Rosario 1 y 2**, con el precio, las cuotas (`ECP`) y el modo de cobro (`COBRO`) que tenían 12-1B y 12-2A (La Elvira 1 y 2); 7-3A se llama **El Rosario 3**; el PO 12 de trackers sale de la herramienta (en el ORDER REPORT del 5-oct era 1 tracker por pedido, "Ext"; Andrés lo quitó del detailed y del ORDER REPORT el 23-oct; Heliconias 1 y Ponedera nunca se pidieron a China). Lo abonado por Solenium en las líneas que salen pasa a lo que le vence primero (mismo orden que "Registrar abono", `_ecUnidades`; los `ECA` que apuntaban ahí se re-apuntan). Nada se aplica solo: `_rosPlan()` arma el cambio con el estado vivo y un aviso arriba (`#rosAviso`) lo muestra con "Aplicar" (`rosAplicar`) y una casilla opcional para sacar 7-6 a 7-9 del cupo Sinosure (`modo:"fuera"`). Queda en Ajustes (`#rosAjustes`) con "Deshacer" (`rosDeshacer`). No hay llaves nuevas: el registro y lo necesario para deshacer van en `CONFIG.cambios["enexa-rosario-2026-10-27"]`. Antes fue **v1.17.1** (sección "v1.17.1 · CARGA DEL DETAILED SIN PERDER PEDIDOS NI CUPO", prueba `z171.js`, con el detailed y el ORDER REPORT del 23-oct como `DET23.xlsx`/`OR23.xlsx`). Salió de la carga del 23-oct: (1) la cifra de Sinosure del paso 1 y del resumen sumaba la hoja por la llave de cada derrame (7-2A…) y la hoja la trae por pedido completo (7-2): `cupoWork` ahora usa `_hojaClaveW` (el derrame toma la de su pedido, una vez); (2) en `parseDetailed`, un pago con estado "Paying"/parcial trae escrito lo que FALTA (CFM 2-3: `=O-S-500-80000`), así que el faltante de la línea se toma como pagado y no como "Sin programar"; (3) en `aplicarOrderReport`, si el detailed trae BL ya pasado y el ORDER REPORT dice producción, se deja embarcado (PO#10 y 9-7) y se avisa en la diferencia; (4) un pedido que ya estaba y no viene en el archivo (los trackers del PO#12) o viene pagado y cerrado (`omitidos[].cerrado`) ya no se borra al aprobar: se conserva por defecto (`e.noVino` / `e.cerradoEn`, el cerrado con saldo a China en 0) y en Comparar › Desaparecidos se puede elegir Quitar (`WIZ.quitar`, solo de esa carga). Antes se borraba con su línea del estado de cuenta del cliente. Antes fue **v1.17** (sección "v1.17 · ESTADO DE CUENTA EN PDF Y EXCEL, MÁS CLAROS", prueba `z17.js`). Solo cambia cómo se exporta el estado de cuenta; no hay llaves nuevas. PDF (`_ecPdfHTML(c)`, `ecPDF` abre la ventana e imprime): resumen arriba, "Lo que vence, fecha a fecha", pedidos por grupo (Shelters / Trackers / Otros productos / Otros cargos) con cuotas anidadas (├ └), cada cargo de Finkargo como ficha con su préstamo, "Pagos recibidos" = lo aplicado directo a cada pedido + los abonos `ECA` (suma lo pagado), totales y pie con "Página X de Y" (`@page`). Esteban lo pidió "más descargado": solo lo vencido va en píldora roja, lo demás es texto. Excel (`_ecLibro(c,ExcelJS)`, ExcelJS 4.4.0 desde cdnjs, se carga solo al exportar con `_cargarExcelJS`): hojas "Estado de cuenta" (resumen, grupos con subtotales en fórmula, cuotas plegables con outline, nota del préstamo de Finkargo, filtros y encabezado fijo en la fila 12, listo para imprimir), "Fecha a fecha" (con acumulado) y "Abonos"; si ExcelJS no carga, `ecExcel` baja el Excel sencillo de antes (`_ecExcelAntes117`). Antes fue **v1.16** (sección "v1.16 · FINKARGO, PAGOS PARCIALES Y DATOS PREPARADOS", prueba `z16.js`). Llave nueva `FINK={ops:[{id,orden,fecha,capital,tasa,fondo,giroFee,capitalEn,asume,para,cuotas:[{fecha,interes,pagada}]}]}`: `fkCuotas(op)` corta en la cuota `capitalEn` (interés vencido + capital; fondo de garantías y giro en la cuota 1); `fkSync()` mantiene en ECX un cargo enlazado (`x.fink`) en el cliente que la asume; los pagos a Finkargo salen en la Caja vía `cjPagosTerceros` (fila "otros cargos"); lector del PDF de confirmación de compra `fkLeerLineas` (valida contra el Valor Adeudado). Pagos parciales planeados: `CXPMIO[k].partes=[{fecha,monto}]` (cxpActivas parte la factura). `PLANCHINA[lunes].fuera`: giros a China pagados con plata que no pasa por los bancos (Finkargo): cuentan en el plan pero no salen de la Caja. Ajustes › "Agregar datos preparados" (`pkLeer`/`pkAplicar`) suma un .json {tipo:"zentrack-datos",datos:{FINK,PLANCHINA,CXPMIO,PROM}} sin borrar nada y reemplaza un cargo manual de Finkargo por el enlazado (pasa lo abonado y remapea ECA). El paquete real de Esteban vive en `zentrack/privado/` (no va al repo). TRM: si no hay saldos escritos, usa la del último abono en pesos antes que la de Ajustes, y la Caja avisa. Antes fue **v1.15** (sección "v1.15 · LEGIBLE Y POR PREGUNTA", prueba `z15.js`; maquetas A–E en el lienzo "Zentrack · Caja y Por pagar (v1.14)"). Pestañas: Tablero · Caja · Estados de cuenta · Pedidos · Sinosure · Ajustes (la pestaña Por pagar desapareció: es el lado **Debo** de Estados de cuenta, `ecLado('debo')`, y `navTo('porpagar')` lleva ahí; `#v-porpagar` vive dentro de `#v-clientes`). Tablero: `_p15Tablero` pinta 4 números + totales y el cupo Sinosure en barras; el treemap se queda (Esteban lo pidió); `#vencBox` y `.tmcap` se esconden. Caja: `P14.vista` = ingresos / egresos / vence / plan / minimo / max (`p15Vista`); `p14Calc('minimo')` ignora PLANCHINA, `p14Calc('max')` calcula el máximo giro a China por semana sin bajar del colchón (tope: vencido + lo que vence); "¿Me alcanza para…?" (`P14.prueba`) no guarda nada. Me deben: `ecEntra(c)` / "Lo que te va a entrar, fecha a fecha" reemplaza la franja de próximos cobros. Pedidos: `PDV` or / maestro; el order report es una fila por EQ. Letra: reglas generadas al final de la hoja principal (nada bajo 13 px; inline con selectores [style*="font-size:.."]); --ink2/--ink3 más oscuros. Corrección: en `cjPagos` un balance sin BL ni ETD no tiene fecha (antes CFM 3-4 y Siliana salían vencidos con la fecha del anticipo): el vencido de China con el respaldo del 9-oct baja (cifras en `privado/CIFRAS.md`). Antes fue **v1.14.1** (el plan a China va por proveedor: `PLANCHINA[lunes]={eagle,nexus,comp,sin}`; un número suelto de la v1.14 se lee como "sin asignar"; `p14Calc` devuelve `vencProv`, `natProv`, `planProv`; en la Caja la fila China se abre en Eaglerise, Nexus y Componentes, y en Por pagar › China hay una columna por proveedor). Antes fue **v1.14** (sección "v1.14 · CAJA COMO PRESUPUESTO Y POR PAGAR", prueba `z14.js`; diseño en el documento de Esteban "Zentrack v1.14 · Diseño de Caja, Por pagar y reglas de pago" y el lienzo "Zentrack · Caja y Por pagar (v1.14)"). Llaves nuevas: `SALDOS` {hist:[{fecha,trm,cuentas:{bcCol,bbvaCol,bcPan,bbvaPan}}]} (COP en Colombia, USD en Panamá; la Caja usa el último registro y su TRM), `CXP` (hechos de los lectores: magnum/tiba con corte, tipo, facturas {id,empresa,fecha,vence,saldo,moneda,centroCosto,pedido,bl}, anticipos, cupo/sobrecupo del PDF, cambios), `CXPMIO` ("magnum:166137" → {planFecha,pagada}; sobrevive cargas), `REGLAS` (magnum/tiba maxMora 30 días, fijos alVencer, colchon 21500), `PLANCHINA` (USD por semana, lunes ISO) y `GASTOS` (rubros fijos; si no existe se precarga con `_gastos0()`; `desde` = próximo pago pendiente, lo de antes de hoy cae esta semana). Pestaña **Por pagar** (`v-porpagar`, `renderPorPagar`): China (plan semanal), Magnum (Excel `magLeerExcel` o PDF `magLeerPdf`, que valida contra el total y lee el cupo), TIBA (`tibaLeerExcel`, hoja SOA, valida por moneda) y Fijos e impuestos. Toda carga muestra "Qué cambió" (`cxpDiff`) y espera "Aprobar". La **Caja** (`p14Calc(modo)`): Como vence / Como pago, USD / COP, saldos de hoy, 4 tarjetas, semáforo de 12 semanas, barras, tabla semana × rubro con la fila China editable en Como pago; 4x1000 = 0.4 % de lo que sale en COP. Las vistas de la v1.12 siguen debajo, plegadas. Pruebas nuevas necesitan en `pruebas/`: MAG.xlsx, MAG.pdf, TIBA.xlsx, RESP.json (respaldo del 9-oct) y V113.html (master v1.13), todos fuera del repo; `pdfjs-dist@3.11.174` va en package.json. Pendiente para v1.15+: extracto bancario (plan contra real), capa Comercial, renta, Tablero nuevo, limpieza de Ajustes (TRM de prueba 4050). Antes fue **v1.13** (sección "v1.13 · OTROS CARGOS Y PROMESAS DE PAGO", prueba `zcargos.js`: en el estado de cuenta, "Otros cargos" = líneas `ECX` con `tipo:'cargo'` —rubros que el cliente debe, p. ej. cuotas de Finkargo que asume Solenium o un CPP pagado por ellos— con `tercero`/`pagoT` para el pago tuyo a un tercero, que sale en la Caja vía `cjPagosTerceros()`; "Promesas de pago" para clientes del grupo, llave nueva `PROM`, y en la Caja de un cliente interno solo cuentan sus promesas pendientes —`CJ.sole` ahora significa "incluir promesas", encendido por defecto—). Esteban decidió: no es para cruzar cuentas, todo va dentro del EC de un cliente. Antes fue **v1.12** (pestaña **Caja**, sección "v1.12 · CAJA", prueba `zcaja.js`: pagos a China de `pagosPend()` repartidos en cajones —Atrasado (antes del corte `CONCILIA.ts`), Se venció hace poco, Componentes: pagar ya, cada semana, Más adelante y Sin fecha todavía (balances sin BL/ETD, que `pagosPend` ponía "para hoy")— más cobros de clientes de `_ecUnidades` (sin clientes del grupo por defecto); vistas Semana a semana / Lo que viene / Todo lo que debo / Resumen; solo lee, no guarda nada). Próximas iteraciones acordadas con Esteban: Tablero nuevo (4 números, cupo en barras simples, mini Caja, "lo que necesita atención") y limpieza de Ajustes (esconder, no borrar). Antes fue **v1.11** (pestaña Sinosure rehecha, sección "v1.11 · SINOSURE: PRIMERO LO CARGADO", prueba `zsino3.js`: al entrar se ve la hoja Sinosure del detailed —`CONCILIA.sinoDetalle`/`sinoPorDerrame`— por fabricante, con total de Andrés, "en tu cuenta", techo manual y disponible; botón "Por conciliar" con decisiones por pedido; campos nuevos dentro de `SINO.ped[k]`: `rev={hoja,tu,fecha}` y `espera`; `snConciliar()` da el estado de cada pedido; el número junto a la pestaña cuenta lo pendiente; la vista vieja queda plegada con `SNDET`). Esteban pone el techo de Eaglerise a mano (no usar el techo que trae la hoja). Antes fue **v1.10**: dos ventanas sobre los mismos datos (sección "v1.10 · MAESTRO Y ESTADOS DE CUENTA", prueba `zmaestro.js`). **Maestro** (pestaña `pedidos`, `#maestro`, `renderLedger`): órdenes como tarjetas desplegables con proyecto, cliente, costo, precio y "cómo se cobra" editables en la fila (reusa `pcProj`/`pcCli`/`pcPrecio`/`costoSet`/`_cbCelda`, selección `PCSEL` con "Mover a" y "Repartir"). **Estados de cuenta** (pestaña `clientes`): agrupado por estado de cobro o por orden, próximos cobros arriba. Saltos `maIrEC`/`maIrPedido`. "Precios y clientes" quedó escondida (el botón sigue en el DOM para `navTo('precios')`; enlace "Grupos de precio (avanzado)" desde el Maestro). También repara al abrir textos con tildes dañadas (`arreglarTildes`: un script del 6-oct guardó "TomÃ¡s", "ChinÃº", "SotaquirÃ¡"). Antes fue **v1.9** (sin pestaña Pagos: se quitó de la pantalla; `renderPagos` no pinta nada si no existe `#v-pagos`; la llave PAGOS se sigue guardando). Desde el 2026-10-14 el Escritorio de Esteban está en OneDrive: repo en `C:\Users\esteb\OneDrive\Desktop\Zentrack_repo`, despliegue en `C:\Users\esteb\OneDrive\Desktop\Zentrack_despliegue\Zentrack`. Antes fue **v1.8.3** (el estado de cuenta separa "Equipos (China)" de "Otros productos · no vienen de China": son las líneas `ECX`, botón "+ producto", en Valor se puede escribir cantidad x precio, ej. 12x6608; no tocan deuda con China ni cupo). Antes fue **v1.8.2** (las fechas del estado de cuenta se guardan en cada cambio y la tabla se repinta al salir del campo: `ecFechaCambio`/`ecFechaSalir`; antes se repintaba a mitad de la edición y la fecha se perdía). Antes fue **v1.8.1** (botón "Registrar abono" en cada estado de cuenta: USD o COP con TRM, al más vencido primero o a un pedido, queda en la lista `ECA` y se puede deshacer). Antes fue **v1.8**: el estado de cuenta de cada cliente es una tabla editable (sección "v1.8 · ESTADO DE CUENTA EN TABLA", llaves nuevas `ECP` y `ECX`, prueba `zec.js`). Valor = precio de Precios; abonado, vence (por defecto ETD + plazo del cliente) y cuotas se escriben en la tabla; líneas sueltas para lo que no viene de China. "Cargar facturas" quedó oculto (FACT/PAGOS siguen guardados). El Tablero ("me deben") lee lo mismo. Esteban lo pidió así: nada de hitos automáticos, todo visible y a mano. Antes fue **v1.7.3** ("Por asignar" puesto a mano en Precios se guarda en MIO.cli y ninguna carga lo pisa). Reasignaciones confirmadas por Esteban el 2026-10-06: Enexa = 12-1B (La Elvira 1), 12-2A (La Elvira 2) y 7-3A (La Elvira 3, en Colombia, TRM 3,307.73 del 2-oct). 12-1 y 12-2 son **2 trackers cada uno** (el "Manufacturer amount" y el anticipo de Andrés están a la mitad: pedírselo); las otras dos partes son de Sole: 12-1A Heliconias 1 y 12-2B Ponedera. 7-6/7-7 siguen siendo de Sole como Piojo 2/3 ("Chibolo" ya no se usa). El 12 aún no entra a Sinosure (decisión de Esteban). Corrección del 2026-10-09. Antes fue **v1.7.2** (costo China corregible a mano en Precios, llave nueva `COSTO`, prueba `zcostomano.js`; no toca deuda con China ni cupo). Antes fue **v1.7.1** (incluye la corrección de costo de la v1.6.2). Esteban tenía desplegada la v1.6.1; la v1.7 y la v1.7.1 se le entregaron el 2026-10-06, copiadas directamente a su carpeta de despliegue `Escritorio\Zentrack_despliegue\Zentrack` (allí quedó `master_v1.6.1_respaldo.html`). v1.7.1: al repintar una pestaña se conserva el scroll de la página y de las listas, y en Clientes el cliente abierto (`_conLugar`, prueba `zlugar.js`).

## 0. v2.13.2 · Planes: arreglos de la auditoría del 18-nov (18-nov-2026)

Esteban pidió auditar la v2.13.1 contra estas reglas. Un revisor aparte y yo reprodujimos 6 fallas y 6 detalles en el navegador, con su respaldo del 17-nov y con datos de prueba. Él dijo "prosigue así tal cual". Código en la sección "v2.13.2" de master.html; prueba `z2132.js`.

- **"Cobrado" tacha la cuota del botón.** `_z27Cob` ahora es `_z2132Cobro`: primero aplica cada abono amarrado (`ECA[].cuota`) a su cuota; lo que sobre y los abonos sin amarre van lo más viejo primero. Antes tachaba la más vieja, la cuota marcada seguía con "Cobrado" y un segundo clic duplicaba el abono.
  - El amarre sale solo del clic en "Registrar cobro" (escucha en captura de `[data-y="cbOk"]` → `Z2132.cuota`), ya no de `Z27.pg`. Un formulario abierto ya no amarra los cobros del Excel.
- **Cuota en pesos cobrada o pagada queda con la TRM de su pago.** Lo cubierto se cuenta en pesos:
  - un abono en pesos con su `cop/usd`;
  - uno en dólares con la TRM oficial de su fecha (`_z2132TrmDia`);
  - un pago a proveedor con `reg[].trm`, campo nuevo que `z27Pagar` guarda.
  - Solo lo que falta se pasa a dólares con la TRM de hoy (`_v3Lin` para la versión activa).
  - Antes, si la TRM bajaba, una cuota cobrada reabría (con el respaldo real, una cuota de un cliente reabría). Si subía, lo de más tachaba la cuota siguiente.
- **Varias a la vez** (`_z213Bulk`):
  - Los giros de China (`PLANCHINA`, la llave es la semana) se corren del último al primero, y se adelantan del primero al último, para no juntarlos.
  - No se tocan las cuotas ya pagadas o cobradas. "Marcar todas" solo marca las pendientes.
- **Fechas escritas con el teclado** (`data-h` f, bF, fxf): Chrome dispara `change` en cada tecla.
  - Con teclado, el `change` se detiene en captura y se guarda en `focusout` (Enter hace `blur`). Tab no sirve, porque dentro de una fecha pasa de día a mes.
  - Elegida en el calendario (sin teclas), se guarda de una.
- **Pesos que no se pierden:**
  - Fila de agregar: `Z213.monAdd[cp]` recuerda la moneda.
  - Excel: `_zpxCrear` deja en pesos una cuota cuyo monto en US$ cambió ≤3 %, o sea solo la TRM.
  - "Acuerdo nuevo" conservando las que no vencen: `_z27GenAbrir` y `_z27Crear` llevan `mon`/`cop` con lo que falta.
- **Estado de cuenta:** `_v2Ver` (Plan en la Caja, cumplimiento) y `ecEntra` valen las cuotas en pesos igual que la Caja. Devuelven copias; lo guardado no cambia.
- **Desmarcar** también sale si el abono se registró en el estado de cuenta (`_z2132Cubre`, de `k.de`). Pregunta con `z26Dialogo` antes de quitarlo de allá. Deshacer.
- **"Registrar cobro" de una cuota en pesos** abre en pesos, con lo que falta y la TRM oficial de la fecha. Si la fecha cambia, la TRM se actualiza.
- **Lo que ve el cliente:** la nota del abono ya no dice "Cobro del plan". En las notas viejas se limpia solo al armar el PDF y el Excel (`_z2132Limpio`).
- **Avisos ya hechos:** `z26Dialogo` con `ok` "Listo" o "Entendido" no muestra "Cancelar".
- **Paso `cuotaCop`** con `esperado: {f, m, dest}`: si la cuota cambió después del respaldo, no se toca y el nombre del paso lo dice. Si solo cambió el concepto, se respeta el concepto.
- **Valores propios fuera del código público.** Los gastos fijos precargados (`_gastos0`: nómina, arriendo, impuestos) y el colchón (`_reglas0`) eran cifras reales escritas en el código. Ahora llegan como `window.ZT_DEF`, desde `zentrack/privado/defaults.js`.
  - Ese archivo lo meten `privado/pendiente.py` (al final del despliegue) y `pruebas/correr.js` (en el `<head>` de ASM4.html).
  - Sin él, el código público trae los mismos rubros sin monto y colchón 20,000.
  - Esteban ya tiene GASTOS y REGLAS guardados, así que a él no le cambia nada.
- Sigue igual: un contrato automático (Enexa en "base") cobrado desde Planes se aplica a lo más vencido del estado de cuenta (el total es correcto). En el Excel, un cambio real ≤3 % de una cuota en pesos con la misma fecha se toma como TRM.

## 0. v2.13.1 · Marcar pagado o cobrado desde Planes, sincronizado (17-nov-2026)

Esteban: "Quiero poder modificar desde planes también. Que todo sea la misma tabla pero vista de otra forma… poder marcar desde cualquiera de las vistas y que se sincronice". No hay registro nuevo: Planes escribe en lo mismo que las otras pantallas. Código en la sección "v2.13.1" de master.html; prueba `z2131.js`.

- **Cobrado** (cuota de un cliente, también de un contrato automático): formulario en la línea (`_z27RegHTML`) → `z27Cobrar` → abono `ECA` aplicado al estado de cuenta, lo mismo que "Registrar abono" (`ecAbono`). El plan lo tacha con `_z27Cob`: desde la v2.13.2, primero la cuota del botón (abono amarrado) y lo que sobre, lo más viejo primero. El abono queda con `cuota` (campo nuevo dentro del abono) para poder desmarcarlo. `_zcDup` (v2.11.2) evita repetirlo.
- **Pagado** (cuota de un proveedor): `z27Pagar` con fecha y medio (`PLANES.reg`), el mismo del panel y de la tabla de 12 semanas. `_zaAuto` (v2.11) no cuenta dos veces lo que el detailed muestre después.
- **Desmarcar** (`_z2131Desm`): quita los abonos amarrados a esa cuota (`_z27DesCobrar`) o los pagos registrados (`z27Quitar` y `PLANES.real[id]`). Deshacer.
- **Magnum y TIBA** automáticos se ven factura por factura (`_z2131FxHTML`, envuelve `_z213DetHTML`): "Pagada"/"Desmarcar" = `cxpPagada` y la fecha = `cxpPlan` (`CXPMIO.pagada` / `planFecha`), las mismas marcas de Proveedores (`_p14PanelCxp`). Deshacer con `_z27HechoFn`.
- **`ecAbono`** (estado de cuenta) pregunta con `z26Dialogo` antes de registrar un abono igual a uno que ya está (mismo monto, ±7 días), por ejemplo uno marcado desde Planes.
- Las acciones de cada cuota salen de `_z213Acc` (gancho de la v2.13).

## 0. v2.13 · Planes por cuotas (17-nov-2026)

Esteban dijo que el hub de Planes no era fácil para modificar ni crear cuotas; solo le servía el panel de una línea por cuota. La propuesta está publicada como artifact "Planes por cuotas". Contestó (17-nov):
1. Planes abre en las cuotas (la tabla de 12 semanas queda a un clic).
2. Una cuota puede ir en pesos y la Caja la pasa a dólares con la TRM del día.
3. Mover o cambiar una cuota corrige el mismo acuerdo y deja nota, con Deshacer (no crea un acuerdo nuevo).

Código en la sección "v2.13" de master.html; prueba `z213.js`.

- **Pantalla** (`renderPlanes` cuando `Z213.vista==='cuotas'`, `_z213HTML`): a la izquierda la lista de contrapartes de `_v3Fichas()` en "Me pagan" y "Le pago", con lo pendiente y la próxima fecha (`_z213Res`); a la derecha las cuotas del elegido (`_z213DetHTML`), una línea por cuota, agrupadas por semana con subtotal en US$. Abre en la contraparte con la cuota pendiente más vieja (`_z213Elegir`). `Z213` vive solo en memoria.
- **Editar**: fecha, concepto (`dest`), moneda y monto en la misma línea; fila fija arriba para agregar (fecha, concepto, moneda, monto, Enter); marcar varias para correrlas o adelantarlas una semana, ponerles fecha o quitarlas; "Correr" y ✕ por línea. Todo con `_z26Hecho` (Deshacer). Durante un `change` la pantalla se repinta un instante después para no perder el foco.
- **Automáticos** (Magnum, TIBA, contratos, Finkargo) se ven sin editar, con "Hacer plan propio". China sin acuerdo muestra "Armar acuerdo". "Acuerdo nuevo" e "Historial y más" abren el panel de siempre (`z26Abrir`).
- ~~El botón "Cobrado" ya no está en cada línea~~: volvió en la v2.13.1, a pedido de Esteban (marcar desde cualquier vista). Sigue siendo el mismo abono del estado de cuenta.
- **Cuotas en pesos**: campos nuevos `mon:'COP'` y `cop` en la cuota (línea de versión o `PROM`). `_v3Lin` las devuelve con `m = cop / _p14Trm()` (la TRM oficial del día), así que la Caja, la necesidad de efectivo y el Excel ven el valor del día. `monto` guarda el último valor en US$ como respaldo. Los giros a China van solo en US$. `_v3LinSet` acepta `'cop'` y `'mon'`; un cambio de `'m'` en una cuota en pesos recalcula `cop`.
- **Nota de cada cambio**: `PLANES.planes[].log = [{f, ts, v, id, n, k, de, a}]` (`k`: f, m, cop, mon, c, add, del). La escriben los envoltorios de `_v3LinSet`, `_v3LinAdd` y `_v3LinDel`, sin importar desde dónde se llamen (panel, Necesidad de efectivo, ajustar…). Debajo de cada cuota va el último cambio ("19-nov → 26-nov · cambiado el 17-nov") y abajo "Cambios (n)". Máximo 300 por plan.
- **Excel de planes**: `zpxComparar` ya no toma como cambio la diferencia de TRM de una cuota en pesos (misma fecha, ≤3 %), y `_zpxCrear` conserva el concepto y los pesos de las cuotas que no cambiaron. Antes el concepto escrito a mano se perdía al subir el Excel.
- **`v3Abrir`** (Caja, Clientes, Tablero) abre Planes en las cuotas de esa contraparte, sin el panel.
- **Actualización preparada**: paso nuevo `{tipo:'cuotaCop', cp, v, id, cop, con}` (`_ztpCuotaCop`); no se repite. El paquete del 17-nov (en `privado/pendiente.py`) pasa a pesos las 3 cuotas que Esteban tenía escritas en pesos.
- Las pruebas viejas que miran la tabla de 12 semanas ponen `Z213.vista='12'` antes de `navTo('planes')`.

## 0. v2.12 · Necesidad de efectivo: pantalla para decidir antes de pedir (17-nov-2026)

La propuesta está publicada como artifact "Necesidad de efectivo para Solenium". Esteban contestó (17-nov):
1. No se guarda nada: solo salen el PDF, el Excel y el mensaje.
2. "Otra semana" mueve el pago también en la Caja, con Deshacer.
3. El cliente ve solo los totales por rubro.
4. La cifra se compara con el plan de cobro de la semana más lo atrasado del plan.

Código en la sección "v2.12" de master.html; prueba `z212.js`.

- **Botón "Necesidad de efectivo"**: en el estado de cuenta de un cliente del grupo, junto a Excel (se inyecta en `_ecHTML`), y en la Caja junto a Exportar. Abre `#neV2` (`neV2Abrir(c)`), una capa sobre la pantalla.
- **Datos**: `_ne2Datos(c,w)` llama `neDatos` (la misma hoja de la v2.10) y, mientras tanto, marca de dónde sale cada pago:
  - Magnum y TIBA: la factura (envuelve `cxpFecha`).
  - Giro del plan a China: el proveedor y la fecha (envuelve `_pcVal` y `_PC_NOM` con una marca invisible que luego se quita).
- **Decisiones** (`ZNE`, solo en memoria): desmarcar, pedir una parte, ajuste en US$ con su motivo, y no contar una entrada de otro cliente. El 4x1000 se recalcula sobre lo que se pide en pesos. `_ne2Calc` da la cifra y el reparto en el estado de cuenta (vencido, lo que vence en la semana, a favor).
- **"Otra semana"** (`neV2Mover`): en Magnum y TIBA pone la fecha a mano de la factura (`CXPMIO[k].planFecha`) una semana después. En un giro del plan a China o una cuota de un plan propio de Magnum o TIBA mueve la cuota con `_v3LinSet`. Guarda y repinta la Caja; `neV2Deshacer` restaura `CXPMIO`, `PLANES` y `PLANCHINA`. Los pagos que salen de las fechas de Andrés, los fijos y las cuotas de contrato no tienen "Otra semana": solo se desmarcan o se recortan.
- **Mover un giro del plan a China** puede hacer que reaparezca en la semana un pago de Andrés que ese giro cubría (`cub` de la v2.3). Es lo esperado.
- **PDF y Excel**: `neV2Hoja()` arma la hoja con `v2:true` y `R` (rubros). `_neHTML` y `_neHoja` la pintan por rubro; en el Excel cada rubro lleva una fila de detalle oculta para que las fórmulas de la v2.10 sigan sumando.
- Sin llaves nuevas.

## 0. v2.11.3 · Mover parte de un abono desde una actualización preparada (17-nov-2026)

- Paso nuevo `reaplicar` en `ZT_PENDIENTE` (`_ztpReaplicar`): `{tipo:'reaplicar', cliente, fecha, usd, de:{k,i}, a:{k,i}, monto}` busca el abono (`ECA`) por cliente, fecha y monto, saca `monto` de la línea o cuota `de` y lo pone en `a`, y actualiza `aplicado`. Si el abono o lo aplicado ya no están como se espera, no hace nada. `_ztpUno` se copió completo para sumar el paso.
- Uso real (P17b en `privado/pendiente.py`): parte de un abono de un cliente había caído en una línea que después quedó en standby. Una línea en standby sale del estado de cuenta, así que ese pedazo del abono no se veía; al moverlo a un tracker, el saldo visible del cliente baja en ese monto.
- **Ojo para la próxima**: al poner una línea en standby, revisar si tiene abonos aplicados.

## 0. v2.11.2 · Abonos adelantados en el plan de cobro y TRM oficial por el servidor (17-nov-2026)

- **Plan de cobro**: `_z27Cob` contaba abonos desde el lunes de la semana de la primera cuota. Un cliente pagó el viernes antes, el abono quedó en su estado de cuenta y la cuota no se tachaba. Ahora cuenta desde lo que llegue primero, ese lunes o la fecha del acuerdo (`version.fecha`). Un plan con `desde` propio (v2.9.3) lo sigue usando.
- **Sin duplicar abonos**: `z27Cobrar` (Planes, Excel de planes, paquetes) no registra un cobro si ya hay un abono del mismo cliente, por el mismo monto, con menos de 7 días de diferencia (`_zcDup`), y lo avisa. "Registrar abono" en el estado de cuenta no tiene ese freno.
- **TRM oficial**: en la herramienta real el navegador no estaba trayendo la TRM de datos.gov.co (el respaldo no tenía `TRMOF` y la Caja usaba la de saldos del 5-nov).
  - `Code.gs` tiene `trmOficial()` (UrlFetchApp). Es la única función del servidor que no es guardar o leer, y pide el permiso "conectarse a un servicio externo": después de desplegar, Google pide autorizar una vez.
  - `_neTrmTraer` prueba el navegador y, si falla, el servidor.
  - Sin oficial guardada, `_p16TrmFuente` usa la TRM del abono en pesos más reciente si es más nueva que la de saldos.
  - La Caja muestra "TRM … · fuente" junto a la fecha.
  - **Al desplegar, Code.gs del repo debe estar también en `appsscript/Código.js` de la carpeta de despliegue.**

## 0. v2.11.1 · Estados de cuenta con el mismo corte y la carga del 17-nov (17-nov-2026)

Esteban prefiere mandar a Claude los estados de cuenta (detailed y ORDER REPORT de Andrés, Magnum, TIBA) para que los cargue bien. Se cargan con un paquete en `zentrack/privado/pendiente.py` (P17). El paquete no va al repo; las cifras están en `privado/CIFRAS.md`.

- `_pk24Viejo` (sección "v2.11"): un estado de cuenta de Magnum o TIBA que llega en un paquete con el **mismo corte** que el cargado, pero con otras facturas, ahora sí entra. Antes se descartaba. Se sigue descartando si es más viejo o si trae exactamente las mismas facturas. Caso real: TIBA mandó el 17-nov su SOA del 10-nov con una factura más.
- La carga del 17-nov repitió los errores de Andrés del 11-nov, en las mismas celdas del Summary:
  - CFM 3-1 en "Pending" con la fórmula del pago parcial (AC99 → "Paying").
  - El balance de todo el PO 13 copiado en 13-1 y en 13-2 (AA106 y AA107).
  - Además, un pago parcial de Nexus a Singsun por el PO#7-2 que está en "Payment records" pero no en el Summary (AE5 = lo que falta, AH5 → "Paying").
  - Se corrige editando el XML de la celda, nunca guardando con openpyxl, y se carga el archivo "(conciliado)" con la fecha de corte en el nombre (la usa `_zaCorte`).
- **Antes de cargar un detailed nuevo**: compara con el anterior, celda por celda y la hoja "Payment records". Simula la carga sobre una copia del estado y confirma que solo cambia lo real.

## 0. v2.11 · Caja viva: fecha que corre, estados de cuenta y planes, sin registrar giros (17-nov-2026)

Esteban (17-nov) encontró la Caja "congelada": la pestaña llevaba abierta desde el viernes y `TODAY` se fija al abrir la página, así que el lunes seguía en la semana anterior (el Excel de planes bajado el lunes decía 13-nov). Además dejó una regla de trabajo: **no registra giros a mano**. Carga los estados de cuenta de vez en cuando y, con los planes que ya definió, la Caja se tiene que actualizar sola cada día. Rechazó la tabla "día a día" debajo de la Caja ("ruido"): la Caja es la tabla semana a semana. Aceptó una gráfica de control debajo. Código en la sección "v2.11" de master.html; prueba `z211.js`.

- **Fecha viva**: `zdRevisarDia()` corre cada minuto y al volver a la pestaña (`visibilitychange`, `focus`, `pageshow`). Si cambió el día, mueve `TODAY` en el mismo objeto (`TODAY.setTime`), así todo lo que lo lee ve la fecha nueva. Luego repinta la pestaña abierta, trae la TRM del día y avisa. Si hay un diálogo abierto o un campo con foco, mueve la fecha y repinta después (`ZD.pend`). `z211` comprueba que la Caja queda igual que abriéndola ese día. Arriba, junto a la versión, `#zdFecha` muestra la fecha con la que calcula, y la Caja dice "Hoy · …".
- **Plan a China sin registrar giros**: `_zaAuto()` calcula, por proveedor (Eaglerise, Nexus · Singsun, Componentes), lo pagado según el detailed hoy (`cupoPagado` del fabricante; `otrosPagado` para componentes). Lo compara con el `HIST[].snapPrev` de la primera carga cuyo corte es posterior a la primera cuota del plan activo; contar desde la primera cuota hace que cambiar de versión del acuerdo no lo reinicie. Esa diferencia, menos lo registrado a mano, se aplica a las cuotas del plan **con fecha ya pasada**, la más vieja primero; las que vienen no se tocan.
  - El corte sale del nombre del detailed (`_zaCorte`: "…report NOV172026.xlsx"). Una carga sin fecha en el nombre no se usa.
  - Riesgo conocido: un pago hecho antes del plan pero reportado tarde por Andrés puede cancelar una cuota vieja. Por eso nunca toca cuotas futuras.
  - `_v3Real()` devuelve un Proxy que suma lo automático al leer; lo que se escribe va a `PLANES.real` como antes. `z27Pagar` y `z27Quitar` trabajan sin lo automático.
  - Nada automático se guarda.
  - Sin una carga posterior al acuerdo no se descuenta nada.
  - Lo atrasado que el detailed no muestra pagado sigue saliendo en la semana actual.
  - Lo automático de un giro con fecha de esta semana sale como "Ya salió · … según el detailed", igual que si se hubiera registrado.
- **Fijos, impuestos y cuotas de contrato**: `gastoFechas` y `cjPagosTerceros` ya no devuelven fechas anteriores al lunes de la semana actual. Se dan por pagados en su fecha y no se arrastran; lo de esta semana (lunes a hoy) sí cuenta.
- **Magnum y TIBA** ya salían de su estado de cuenta: la factura que no viene en el nuevo, no sale. No cambió.
- **Gráfica "Entra y sale · 12 semanas"** (`_zgHTML`), debajo de la tabla:
  - Barras: lo que entra arriba; lo que sale abajo, apilado en China, Magnum y TIBA, nómina-fijos-impuestos y Finkargo y otros cargos.
  - Línea: el acumulado de la Caja.
  - Eje único y paleta validada con el validador de dataviz; la tabla de arriba es su vista en tabla.
  - Hover por semana con el detalle; clic marca la semana en la tabla (`Z26.sem`).
  - Usa las mismas cifras de `p14Calc`.
- Sin llaves nuevas.

## 0. v2.10 · Necesidad de efectivo para el cliente del grupo y TRM oficial (17-nov-2026)

Pedido del gerente (9-nov): mostrarle a Solenium la necesidad de efectivo de la semana junto con su estado de cuenta, para pedirle plata. Esteban decidió (17-nov): **toda la caja de la semana**; poder armarla **para esta semana (enviar el lunes) o para la siguiente (enviar el viernes)**; va **en la misma descarga** del estado de cuenta (PDF y Excel). Código en la sección "v2.10" de master.html; prueba `z210.js`.

- **TRM oficial** (llave nueva `TRMOF` = {fecha ISO: {v, f:'oficial'|'mano', desde, hasta}}): `_neTrmTraer()` la trae de datos.gov.co (dataset `32sa-8pi3`, Superfinanciera, con CORS) y la guarda con su vigencia; corre sola al abrir con el estado del servidor (solo si hay `google.script`). `_p16TrmFuente` usa primero la guardada más reciente (≤ hoy); si no hay, sigue como antes (saldo de bancos, último abono, Ajustes). Si no hay conexión, el diálogo pide escribirla y queda como 'mano'; nunca se inventa una.
- **La hoja** (`neDatos(c, w, trm)`, w = 0 esta semana, 1 la siguiente): corre `p14Calc('pago')` con la TRM elegida y toma la semana w. Pagos = filas china, mag, tiba, otros, fij, imp de la Caja (con sus partidas `it`; las de pesos muestran COP = US$ × TRM). Entradas de otros clientes = fila ext. Necesidad = pagos − entradas. Ya girado = abonos del cliente en esa semana ("Ya entró · cliente · …", v2.9.1). Por girar = necesidad − ya girado, mínimo 0. Cómo se abona = primero lo vencido del estado de cuenta, luego lo que vence hasta el domingo de esa semana, el resto a favor (mismo orden que `ecAbonoAplicar`). Plan de cobro acordado para la semana = líneas de la versión activa de `cobro:cliente` en esas fechas.
- **PDF y Excel**: `ecPDF(c)` / `ecExcel(c)` de un cliente del grupo (`esInterno`) abren el diálogo `#neDlg` (Esta semana · Semana siguiente · Sin hoja, y la TRM). De lunes a miércoles sugiere esta semana; de jueves a domingo, la siguiente. `ecPDF(c, null)` / `ecExcel(c, null)` bajan sin hoja y sin diálogo; `ecPDF(c, neDatos(...))` con hoja. La hoja va en página aparte al final del PDF (`_ecPdfHTML(c, ne)`) y como última hoja del Excel (`_ecLibro(c, ExcelJS, ne)`, con fórmulas en subtotales y totales).
- **Standby y China**: en el flujo (`p14Calc`), los anticipos y balances de pedidos en standby (`prEstado(e)==='standby'`) ya no se programan para girar. La deuda sigue visible en Proveedores.
- No guarda nada del documento, solo la TRM usada.

## 0. v2.9.3 · Plan de un cliente desde una fecha, abonos por partes y standby de líneas sueltas (13-nov-2026)

Salió del plan de cobro de Enexa (solo trackers; lo demás quedó frenado). Código en la sección "v2.9.3" de master.html; prueba `z293.js`.

- **Acuerdo con "desde"**: una versión de plan puede traer `desde` (ISO). `_z27Cob` solo cuenta los abonos del cliente desde esa fecha (o el lunes de la primera cuota, lo que sea más tarde). Sirve cuando el plan se arma con saldos que ya descuentan un abono reciente: ese abono no debe pagar las cuotas otra vez. Datos preparados `PLANES_V` copian `desde` a la versión creada (`_pk24PlanAplicar`). Sin `desde` todo sigue igual.
- **Paso "abono" de la actualización preparada** (`_ztpAbono`): puede ir a un pedido (`ped` = derrame u orden; se aplica con `ecAbonoAplicar` a ese pedido) y trae `dup:{desde,hasta,usd,cop}` para no registrar un abono que el usuario ya escribió a mano. No se registra si en ese rango hay un abono del cliente con el mismo monto en pesos (el total o esta parte), uno solo por el total en dólares (±2 %), o esta misma parte (nota y monto); tampoco si ya hay uno con la misma fecha y monto. No se suman abonos distintos para decidir (eso tapaba la segunda parte de un abono partido).
- **Standby de líneas sueltas** (`ECX[].standby`, campo nuevo dentro de una llave existente): `ecFilas` las saca del estado de cuenta. Datos preparados `PRECIOS` aceptan `{ecx, cliente, standby}` (`ecx` = texto del pedido/equipo/proyecto de la línea). En Clientes › Precios salen en "Standby · líneas sueltas" con Reactivar (Deshacer con `_z27HechoFn`).
- TRM: lo recibido se convierte con la TRM oficial del día en que entró; lo proyectado, con la vigente el día que se arma el plan. Va escrita en la nota de cada línea.

## 0. v2.9.2 · Actualización preparada con varios paquetes y abonos (12-nov-2026)

- `window.ZT_PENDIENTE` puede ser una lista de paquetes. Cada uno lleva su marca `CONFIG.cambios['pendiente:'+id]`, y solo corren los que faltan, en orden (`_ztpLista` y `_ztpUno`).
- **Paso nuevo `{tipo:'abono', cliente, fecha, usd, cop?, trm?, nota}`:** registra un cobro con `z27Cobrar`. No se repite si ya hay un abono del mismo cliente con la misma fecha y monto.
- **Para qué se usó:** el plan de cobro de Solenium del 12-nov (`PLANES_V` con `ref`) y el abono de esta semana. Las cifras están en `privado/pendiente.py`, que no va al repo.
- **TRM:** los pesos se pasan a dólares con la TRM oficial de la fecha: la del día en que entró, para lo recibido, y la vigente, para lo proyectado. Nunca con la TRM guardada en la herramienta.
- **Pruebas:** `z281.js` (11).

## 0. v2.9.1 · Flujo de ingresos y egresos, sin saldo de bancos (12-nov-2026)

Esteban (12-nov): "a día de hoy no me sirve de nada colocar el saldo del banco porque es jueves y ya ha salido plata. Necesito mapear mis ingresos y egresos de forma oportuna; el saldo lo sé yo". Código en la sección "v2.9.1" al final de master.html.

- **`p14Calc` (envoltura `_z291Flujo`):**
  - `X.s0 = 0`; el saldo registrado queda en `X.s0Bancos`, sin uso.
  - Esta semana suma lo que **ya entró**: abonos `ECA` sin `via`, con fecha del lunes a hoy. Van en `R.sole` o `R.ext` y en `X.v3.cli`.
  - Esta semana suma lo que **ya salió**: `PLANES.reg` con fecha del lunes a hoy. Va en la fila de su proveedor (China va también en `X.chPlan`).
  - Lo pendiente de cada cuota ya venía descontado, así que un pago adelantado pasa de su semana a esta.
  - `ini`, `neto` y `cierre` se recalculan desde cero: `cierre` es el acumulado de entra − sale. `X.ya = {entra, sale}`.
- **Caja:** sin la fila "Saldo al empezar". "Saldo al cerrar" pasa a "Acumulado".
- **Planes:** la última fila es "Acumulado (entra − sale)".
- **Tablero:**
  - La primera tarjeta es "Esta semana" (entra, sale, ya entró, ya salió).
  - La gráfica muestra entra − sale de cada semana (sin colchón).
  - Ya no sale la fecha de los bancos arriba, y `z26Bancos` solo avisa.
- **Sankey:** `s0 = 0`, sin arrastre entre semanas: cada semana o periodo se lee solo. "Falta plata" pasa a "De tu saldo" y "Queda en caja" a "Sobra".
- **Lo que no se borra:** la llave `SALDOS` y la pantalla para registrar saldos siguen en el estado, sin uso.
- **Pruebas:** `z291.js` (11).

## 0. v2.9 · Excel de planes: pagos, cobros y precios (12-nov-2026)

Esteban quiere manejar los planes desde un Excel que baja y sube, sin moverse por la plataforma. Aprobó (12-nov):
- Un solo archivo con pagos, cobros y precios.
- Los pagos se marcan en el Excel (fecha, monto, medio).
- Los planes automáticos salen; si los cambia, quedan como plan propio.
- Al subir, se muestra qué cambia y se espera Aprobar.

Código en la sección "v2.9" al final de master.html.

- **Descargar** (`zpxLibro` / `zpxDescargar`, botón en Planes): hojas Léeme (marca `_ZPX_MARCA` en A1), Pagos, Cobros y Precios.
  - Cada fila lleva "Código (no tocar)": `p|cpId|lineId`, `c|cpId|lineId` o `x|kOf`.
  - Las fechas van como serial de Excel con formato.
  - Un proveedor o cliente sin cuotas sale con una fila vacía con su código, para agregarle cuotas.
- **Subir** (botón en Planes o "Cargar archivo"; `v2CargarArchivos` lo reconoce por la marca): `zpxComparar` arma los cambios y `zpxPrevia` muestra la ventana "qué cambia".
  - **Planes:** por contraparte, las filas del Excel frente al plan vigente (cambiadas, nuevas, quitadas). Una fila sin código que coincide en fecha y monto con una cuota existente es esa cuota, así que subir dos veces no duplica.
  - **Pagos:** "Pagado US$" es el total de la cuota; si sube, se registra la diferencia con `z27Pagar` (fecha y medio; sin medio queda Banco). Si baja, solo se avisa: no se quitan pagos.
  - **Cobros:** "Nuevo cobro" crea un abono (`z27Cobrar`); si ya existe uno igual (cliente, fecha, monto), no se repite.
  - **Precios:** standby, factura (`prFacturar`), cálculo (`prCalcSet`) o precio escrito. Un pedido facturado solo cambia corrigiendo la factura.
- **Aprobar** (`zpxAplicar`): cada plan que cambió queda como versión nueva "Excel dd-mmm" activa (`_zpxCrear`), y la anterior pasa al historial.
  - Las cuotas que ya existían **conservan su id**, así que `PLANES.real` y `PLANES.reg` siguen con ellas. Esto no aplica a las líneas de una base automática, cuyos ids no son únicos entre contrapartes.
  - Deshacer vuelve a la foto completa del estado (`serializeState` antes de aprobar).
- **Estado:** no hay llaves nuevas.
- **Pruebas:** `z29.js` (23).

## 0. v2.8.1 · Actualización preparada: desplegar y listo (11-nov-2026)

Esteban no quiere pasos extra: "cuando doy desplegar, todo lo que apruebo queda listo". Los datos que se preparan para él (datos preparados, detailed y ORDER REPORT conciliados) ya no se cargan a mano. Se meten en la copia de despliegue y la herramienta los aplica sola al abrir. Código en la sección "v2.8.1" al final de master.html.

- **Formato:** `window.ZT_PENDIENTE = {id, titulo, resumen, pasos:[{tipo:'json', nombre, obj} | {tipo:'excel', nombre, archivos:[{nombre, b64}]}]}`.
  - Los pasos `json` se aplican como "Agregar datos preparados" (`pkLeer` / `pkAplicar`).
  - Los pasos `excel` pasan por el asistente (`v2CargarArchivos` con `File` armados desde base64) y se aprueban con lo que trae por defecto (`wizGo` y `wizApprove`).
- **Cuándo corre (`ztPendiente`):** una sola vez, después de que `loadFromServer` aplicó el estado. Lo dispara la envoltura de `applyState`, solo si existe `google.script`.
  - Si el paquete termina de cargar después del estado, lo dispara `_ztpAlLlegar`.
  - Nunca corre con `EQ` vacío ni si el servidor falló.
  - Queda anotado en `CONFIG.cambios['pendiente:'+id]`.
  - Todos los pasos se pueden repetir sin duplicar, así que si algo falla a mitad, se reintenta la próxima vez que se abra.
  - Avisa con `z26Dialogo`.
- **Los datos NO van en el repo.** `privado/pendiente.py` (fuera del repo) los mete solo en la copia de despliegue. Van como un `<script>` aparte al final, partido en secciones `/* ===== ACTUALIZACIÓN PREPARADA · parte n ===== */` de ~50 KB, para que `build.py` lo corte en archivos de Apps Script sin partir instrucciones.
  - Por eso el `master.html` de la carpeta de despliegue es el del repo más ese bloque.
  - Al copiar una versión nueva, el bloque se puede dejar fuera si ya está aplicado (mirar `CONFIG.cambios` en un respaldo), o volver a meterlo: no se repite.
- **Primera actualización preparada (`id 2026-11-11`):** plan de Eaglerise del 9-nov, carga del 11-nov (Magnum, TIBA, TRASPASO, PLAN_QUITAR, GIROS), detailed y ORDER REPORT conciliados del 11-nov, y precios de Solenium. Se probó con el respaldo del 4-nov, con y sin las cargas del 5 y 9-nov, abriendo el armado exacto de Apps Script con `google.script.run` simulado.
- **Pruebas:** `z281.js` (10).

## 0. v2.8 · Precios provisionales y facturados (11-nov-2026)

Esteban quiere que el estado de cuenta de Solenium saque **todo** lo que es de Solenium, incluso los pedidos que aún no tienen precio consolidado. Cada pedido lleva un precio provisional hasta que se registra la factura. Lo que decidió:
- Un precio pasa a facturado **solo cuando registra la factura** en la herramienta.
- Al arrancar, todo precio existente es provisional.
- El PDF y el Excel que van al cliente **no dicen qué es provisional** ("es para manejo interno").

Código en la sección "v2.8" al final de master.html. Cómo funciona:
- **Llave nueva `PRECIO`** = `{kOf: {est:'standby', calc:{flete,aduana,extra,mExtra,margen}, fac:{num,fecha,valor,prov}, hist:[{f,de,a,por}]}}`.
- **Estado del precio (`prEstado`):** standby, facturado (si tiene `fac`), provisional (cualquier precio sin factura) o sin precio.
- **Cálculo (`prCalc`):** (costo China `_pcCosto` + flete + aduana) × (1 + margen) + Zentrack × (1 + mExtra).
  - Los márgenes por defecto no van en el código, porque el repo es público. Llegan en los datos preparados (`{def:{margen,mExtra}}`) y se guardan en `PRECIO.__def`. Las cifras de Esteban (margen sobre el costo, margen de lo que pone Zentrack, flete y aduana por contenedor) están en `privado/CIFRAS.md`.
- **`prCalcSet`** aplica el cálculo, salvo si el pedido está facturado o en un grupo de precio.
- **`prFacturar`** pone el valor real y guarda el provisional en `fac.prov`. Lo abonado se queda: el saldo sale de valor − abonado.
- **Historial:** todo cambio de precio queda en `hist`.
- **Standby:** saca el pedido del estado de cuenta, envolviendo `ecFilas`.
- **Pantalla (Clientes):** caja plegable "Precios" encima de las líneas del estado de cuenta (`_prHTML`). Se agrupa en sin precio, despachados sin factura, provisionales, facturados y standby. Acciones por pedido:
  - Calcular: los campos guardan el cálculo y el precio cambia con "Usar este precio".
  - Factura: número, fecha y valor.
  - Standby y Reactivar.
  - Clic en el pedido muestra su historial.
  - El valor del estado de cuenta en pantalla lleva la etiqueta "provisional"; los exportes no.
- **Datos preparados `PRECIOS`** = `[{def:{margen,mExtra}} | {ped, mfg, flete, aduana, extra, mExtra, margen, standby, nota}]`. Nunca toca un pedido facturado y es idempotente. El de Esteban (11-4, 16 y 18 en standby) vive en `privado/carga_11nov/` y en su Escritorio.
- **Pruebas:** `z28.js` (21).
- **Pendientes:**
  - Si Andrés renombra o parte un pedido facturado, el registro de `PRECIO` no pasa al pedido nuevo (TRASPASO no lo copia).
  - Leer la factura desde un archivo (PDF), si Esteban lo pide.

## 0. v2.7.1 · Solenium sin cobros dobles (11-nov-2026)

Esteban pidió una radiografía del estado de cuenta de Solenium por miedo a cobrarle doble. Su regla: **el precio del tracker lo trae todo**. Incluye la electrónica de Nexus, los otros componentes del detailed (Jingwei, Wenzhong, Restar, Qiyuan), la logística (Magnum, TIBA) y lo que Zentrack pone aparte (estaciones, TCUs). El shelter es un solo producto.

Qué dio la radiografía:
- Magnum, TIBA y componentes no se le cobran aparte a Solenium. Bien.
- El préstamo de Finkargo sí se cobraba doble: el cargo completo (capital + intereses + fondo + giro) iba en su estado de cuenta, y el capital ya estaba dentro del precio de los shelters que ese préstamo le pagó a Eaglerise.
- Las 14 "Estaciones" Cox (líneas `ecxcox1…14`) salen de su propio estado de cuenta en PDF del 6-oct. Decidió dejarlas aparte.
- Hay pedidos de Solenium sin precio, que no entran a su estado de cuenta hasta que tengan precio.

Cambios (código en la sección "v2.7.1" al final de master.html):
- **Componentes con su fabricante:** `cjPagos` pone los pagos `tipo:'otros'` con el fabricante del pedido (Nexus o Eaglerise). La llave `_v3Claves` no cambia porque usa el tipo. `_v3Cps` esconde `pago:comp` si no tiene deudas, ni giros en el plan "a", ni versiones; si tiene plan propio guardado, se sigue viendo. En el FIFO, los componentes son vencido "pagar ya" y se cubren primero.
- **Capital de Finkargo abonado:** si un cliente asume una operación (`op.asume`), el cargo enlazado sigue completo y se crea un abono en `ECA` con `{id:'ecafk'+op.id, via:'finkargo', fink:op.id, usd:capital, fecha:op.fecha}`.
  - Se aplica al más vencido primero y nunca al cargo de Finkargo (`_fk271Aplicar`).
  - Lo mantiene `_fk271Abonos`, que corre en `fkSync` y en `applyState`. Es idempotente; si cambian el capital o quién lo asume, se rehace, y si nadie lo asume, se quita.
  - Los abonos con `via` no cuentan como plata que entra: los excluyen `_z27Cob`, `_v2Recibido` y `_v3RecSem`.
  - "Deshacer" sobre ese abono no lo borra: se quita desde el préstamo.
- **Sankey:** una fila de pagos negativa ("Lo paga Finkargo": giros a China pagados por Finkargo, `PLANCHINA.fuera`) se resta de los pagos a China de esa semana. Antes salía como entrada.
- **Pruebas:** `z271.js` (15). Se adaptaron `z16` (al asumir el préstamo, el estado de cuenta sube solo lo que no es capital), `z23` y `z27` (Componentes dentro de Nexus).
- **Pendiente:** el costo del tracker no incluye estaciones ni TCUs, que pone Zentrack y no vienen en el ORDER REPORT de Andrés. El margen que muestra la radiografía es antes de logística y antes de esas piezas.

## 0. v2.7 · Planes de pago y de cobro, y el sankey en el Tablero (11-nov-2026)

Esteban pidió manejar los planes "de nosotros a externos y de externos a nosotros" y modificarlos fácil. Aprobó (11-nov): un acuerdo vigente por contraparte con historial, registrar fecha y medio de cada pago, Planes sigue abriendo en la tabla de 12 semanas con los pendientes arriba, y Finkargo como deuda propia queda para una fase 2. También pidió cambiar "Requiere atención" del Tablero por su sankey: sin amarrar pagos a cobros ("tomar el grueso y con ese grueso destinar"), y los demás avisos quedan solo en su pantalla. Código en la sección "v2.7" al final de master.html.

- **Acuerdo vigente + historial.** El vigente es la versión activa de siempre (`c.act`); las demás salen en "Historial" del panel con Activar / Borrar (borrador o reemplazado). `_z27Crear` crea una versión (borrador o vigente) y `_z27Activar` la activa y anota `PLANES.planes[].cambios=[{f,de,a}]`. No se borra nada al activar.
- **Cuotas con estado** (`_z27Est`): pagos → Programada / Esta semana / Parcial / Sin registrar (vencida) / Pagada; cobros → Programada / Parcial / Incumplida / Cobrada.
- **Pagos con fecha y medio:** llave nueva dentro de PLANES, `PLANES.reg[lineId]=[{f,m,medio:'banco'|'finkargo'|'cruce',ref,ts}]`. `PLANES.real[lineId]` sigue siendo la suma (la Caja no cambió). Un pagado de antes queda como registro "sin fecha". Al mover un giro del plan "a" de China (cambia su llave `pc|fecha|prov`) los registros se mueven con él.
- **Cobros:** "Cobrado" registra un abono en `ECA` (el mismo de Clientes, `ecAbonoAplicar`), no un pagado aparte. Las cuotas de un acuerdo de cobro se dan por pagadas con los abonos del cliente desde el lunes de la primera cuota pendiente, lo más viejo primero (`_z27Cob`). Por eso `_v3Act` devuelve lo pendiente de cada cuota y, dentro de `p14Calc`, `_v3RecSem` vale 0 (antes se restaba lo recibido en la semana solo a las cuotas de esa semana). También pagos fuera de China con versión propia (Magnum, TIBA, otros) cuentan lo pendiente (m − real).
- **Armar acuerdo** (`_z27GenAbrir`, panel con `Z27.gen`): Cuotas iguales (total, cuotas, desde, cada semana / 2 semanas / mes) o Pegar fechas y montos (`_z27Pegar`: dd/mm, dd-mmm, "9 de diciembre", ISO; miles con punto o coma). Reprogramar/Renegociar conserva por defecto las cuotas que no han vencido. Vista previa con cobertura de la deuda (`_z27Cobertura`) y el saldo más bajo de la Caja hoy contra con el acuerdo (`_z27Sim`: aplica, calcula y restaura desde la foto `_z26Snap`).
- **Acciones con Deshacer:** Pagado (fecha, monto, medio), Cobrado, Correr (una semana desde la fecha o desde hoy si ya venció), Correr todo (del último al primero, para no fundir giros del plan "a"), Ajustar al vencido / al saldo / a la deuda, Sacar de la Caja. El deshacer de un cobro deshace el abono (`Z27.undoFn`).
- **Planes:** `_z27PendHTML` va arriba de la tabla (envoltura de `_z26PlHTML`): vencido sin acuerdo, sin registrar, incumplidas, vencido de contrato, y lo de esta semana, con el botón en la fila. La ventanita de una cifra cambia "Marcar pagado" por "Registrar pago".
- **Tablero:** `_z27SkHTML` reemplaza a `_z26AtencionHTML` (que sigue en el código, sin uso). Sale de `_z26Grilla` (mismas filas que Planes y la Caja). Izquierda: bancos (o el saldo con que empieza la semana), cada cliente, lo que paga Finkargo (fila negativa de "Lo paga Finkargo") y "Falta plata"; centro: la Caja; derecha: cada pago partido en cubierto / se cubre en una semana posterior / sin fondos, y "Queda en caja". Reparto semana a semana: lo que no alcanzó antes se paga primero; dentro de la semana, proporcional. Cuadra con `X.cierre` (queda − falta = saldo al cierre) en semana, 4 y 12 semanas.
- **Pruebas:** `z27.js` (41). Se adaptaron `z15`, `z20`, `z23`, `z24`, `z26`, `z261` (versión, sankey en vez de "Requiere atención", historial y armar en vez del selector de versión).
- **Ojo:** registrar el pago de un giro a China ya vencido casi no mueve la Caja mientras Andrés siga mostrando esa deuda como vencida (comportamiento de la v2.3, no de esta versión). Revisarlo con Esteban.
- **Pendiente (fase 2):** pagar con Finkargo crea la deuda con Finkargo; conciliar cuotas contra banco y estados de cuenta; los avisos que salieron del Tablero (pedidos sin precio o sin cliente, diferencias con Andrés) solo están en su pantalla.

## 0. v2.6.1 · Pedidos que Andrés renombra y ajustes de plan desde datos preparados (11-nov-2026)

Al conciliar el detailed y el ORDER REPORT del 11-nov apareció un problema de fondo. Andrés renombra pedidos: partió el PO 13 en 13-1 y 13-2, el CFM 4 en CFM 4-1 y 4-2, y cambió "PO CFM3-2 INGEV2" a "PO INGEV2". La herramienta conservaba los viejos (con los nombres, clientes, precios y costos de Esteban) y traía los nuevos vacíos. Resultado: la deuda con Eaglerise quedaba doble y Solenium perdía esos precios. Código en la sección "v2.6.1" al final de master.html.

- **Datos preparados: `TRASPASO`** = `[{a:'mfg|nuevo', de:['mfg|viejo',...], partes:[{proj,cliente,frac}]}]`.
  - Al subirlo deja la receta del pedido nuevo: `MIO.split` si hay varias partes, o `MIO.proj` y `MIO.cli` si es una sola. No pisa una receta que ya exista.
  - Guarda en `MIO.traspaso` qué parte hereda de qué viejo.
  - Al aprobar el detailed (envoltura de `wizApprove`), cada parte nueva hereda del viejo, por la fracción `frac`:
    - el precio y la logística (`_TR261NUM` y `_TR261BOOL`);
    - el cliente, si no tiene;
    - `COSTO` y `COBRO`.
  - `ECP` y lo aplicado en `ECA` se re-apuntan al primer pedido nuevo.
  - Los viejos vienen en "Quitar" en Desaparecidos (si se pasan a "Conservar", no heredan). El pedido entero que ya estaba cargado y ahora llega en partes también sale (`_tr261Partidos`).
  - Un aviso en el asistente (`.tr261`) dice qué pasa a dónde.
- **`PLAN_QUITAR`** = `[{prov}]`: borra los giros de ese proveedor en `PLANCHINA` (el plan "a") y su pagado en `PLANES.real`. Lo de Finkargo (`fuera`) se recorta a lo que queda en esa semana.
- **`GIROS`** = `[{cp, fecha, monto, nota}]`: agrega un giro a la versión que cuenta en la Caja. Si ya está, no se repite.
- **Archivos de Andrés conciliados.** Viven en `privado/carga_11nov/`. El detailed se corrigió tocando solo 3 celdas del XML.
  - Ojo: guardarlo con openpyxl rompe la lectura de la hoja Sinosure (las cifras que Andrés pone en dos líneas). Si hay que corregir un detailed, edita el XML.
  - El ORDER REPORT lleva la tabla de pagos prioritarios de los shelters sin duplicados y con fecha. El lector ignora las líneas sin fecha (`porPri` solo toma las que la traen), y Andrés dejó de ponerles fecha.
- **Pruebas.** `z261.js` hace 24 verificaciones: simula el renombre del PO 13 y del CFM 4 sobre DET23 y OR23. Las demás pruebas solo cambian la versión.
- **Pendiente.**
  - Que el lector acepte la tabla de pagos prioritarios sin fecha, que es el formato nuevo de Andrés: tomar el saldo y heredar la fecha anterior.
  - Que el traspaso se pueda hacer desde la pantalla, sin datos preparados.

## 0. v2.6 · Capa 1 ordenada: sistema visual, Tablero, Caja y Planes (11-nov-2026)

El 10-nov Esteban puso la v2.5 en espera ("la herramienta está demasiado cargada") y pidió ordenar primero la base (v2.4). Aceptó la propuesta pestaña por pestaña y la pasó por su "prompt maestro" de UX. El plan que salió de ahí está en el artifact privado "Plan de diseño Zentrack": investigación con fuentes, auditoría, arquitectura, flujos, sistema visual, pantallas de referencia y etapas. Esta versión cubre las etapas 3 (sistema visual) y 4 (Tablero, Caja y Planes).

**Base:** master es la v2.4 más la sección "v2.6 · CAPA 1 ORDENADA" al final, con su CSS `z-*`. La v2.5 entera (master, fragmentos, `z25` y las pruebas como estaban) está en `zentrack/privado/v25_espera/`, junto con su sección de este traspaso (`TRASPASO_v25.md`). Se vuelve a montar encima como capa 2 cuando Esteban la revise.

**Despliegue:** el 10-nov la carpeta de despliegue volvió a la v2.4 (la v2.5 quedó al lado como `master_v2.5_espera.html`).

Cada pantalla tiene un tipo: el Tablero sirve para vigilar, la Caja para analizar y Planes para operar.

- **Menú (`_z26Nav`).** Tablero · Caja · Planes · Clientes · Proveedores · Pedidos · Ajustes.
  - Proveedores es un botón nuevo (`data-v="proveedores"`) que muestra `v-clientes` con `ecLado('debo')`. `navTo('porpagar'|'proveedores')` va ahí. Cada lado quita la lista del otro (`renderClientes` y `renderPorPagar` envueltos).
  - La pestaña Salidas se esconde y marca Pedidos.
  - De la v2.5 entraron: "Sale de China / Llega a Colombia" arriba de Por estado (`_z26SemanaHTML`) y la conciliación con Andrés en Cupo Sinosure (`#z26Conc`).
- **Tablero (`_v2Tablero` reasignado).**
  - Fuentes con su fecha.
  - Tira de 5 cifras (`_z26Tira`): bancos, me deben vencido, debo vencido y los dos cupos.
  - Formulario de bancos (`z26Bancos`). Antes estaba en la Caja.
  - Tabla "Requiere atención" (`_z26Atencion`), ordenada por gravedad y monto. Revisa:
    - bancos sin registrar o con más de 7 días;
    - promesas vencidas sin recibir del cliente del grupo (`_z26Prom`);
    - vencido sin plan y pagos vencidos sin registrar;
    - archivos de más de 14 días y diferencias con Andrés;
    - pedidos sin precio o sin cliente;
    - cupo al 90 % o más.
  - La única gráfica de saldo (`_z26GrafHTML`). Clic en una barra marca esa semana en la Caja (`z26IrSemana`).
- **Caja (`_p14Caja` reasignado).**
  - Solo trabaja en modo "con mi plan". Muestra la tabla con Entra y Sale abiertos, la fila Neto y el saldo al cerrar con la semana más baja marcada. Arriba va su definición: unidad, semanas, saldo inicial y colchón.
  - Clic en una cifra abre el detalle al lado (`P14.det`).
  - Salieron las 4 tarjetas, la gráfica, "Solo lo que vence" (vuelve en la capa 2 como Reglas vs plan) y "Bancos hoy".
- **Planes (`renderPlanes` reasignado, `_z26Grilla`).** Una tabla contraparte × semana. Todas las filas salen del mismo `p14Calc('pago')`:
  - clientes (`X.v3.cli`);
  - China por proveedor (`X.chPlan` + `X.natProv`, con las filas hijas Tu plan y Fechas de Andrés);
  - "Lo paga Finkargo" (lo que queda de `R.china`);
  - Magnum, TIBA, Finkargo y otros, y Fijos e impuestos.

  Por eso Entra, Sale, Neto y Saldo cuadran exacto con la Caja. Si algo no cuadrara, aparece una fila "Otros cobros" u "Otros pagos" con la diferencia.

  La columna Atrasado es informativa. Muestra:
  - las promesas vencidas sin recibir;
  - las cuotas vencidas;
  - los giros atrasados que faltan;
  - lo vencido sin plan.

  La semana actual incluye lo atrasado con plan, igual que la Caja.

  Clic en una cifra abre la ventanita (`Z26.pop`), con:
  - monto, semana y pagado;
  - "Marcar pagado" y "Borrar";
  - "+ Pago esta semana";
  - "Hacer plan propio".

  Clic en un nombre abre el panel lateral.
- **Panel lateral (`z26Abrir(cp)`).** Reemplaza el cronograma por contraparte. `v3Abrir` ahora abre Planes con el panel.
  - La versión se elige en un selector, y la elegida es la que cuenta en la Caja. El selector también trae "Fuera de la Caja" y "Versión nueva, copia de esta".
  - La tabla edita fecha y monto, más el pagado (proveedores) o el destino (clientes), con el estado de cada pago.
  - Abajo: "+ Pago" y "Más", que trae repartir un monto, cuotas iguales, renombrar y borrar la versión. Borrar abre un diálogo propio (`z26Dialogo`).
  - Para China, "Qué pedidos paga cada giro".
  - En Clientes, el plan del cliente del grupo es una sola línea (`_promHTML`) que abre el panel ahí mismo.
- **Deshacer.** `_z26Snap` guarda PLANES, PLANCHINA y PROM antes de cada cambio de un plan, y `z26Aviso` muestra el aviso con "Deshacer".
- **Pagado reemplaza a "Real".** Usa la misma llave, `PLANES.real`.
  - Estados de pagos: Programado, Sin registrar, Parcial y Pagado.
  - Estados de cobros: Programado, Incumplida, Parcial y Cobrado.
- **Sistema visual.** Tokens `--z-*`. Al arrancar, `_z26Css` sube a 13 px toda regla de CSS más chica y deja los radios en 4 u 8.
  - "Guardado hh:mm" va junto a la versión (`saveToServer` reasignado, `#z26Gu`); si falla, queda en rojo con "reintentar".
  - Ctrl K va al buscador y Esc cierra la ventanita y el panel.
- **No hay llaves nuevas** en el estado.
- **Pruebas.** `z26.js` hace 46 verificaciones. Se ajustaron `z14`, `z15`, `z20`, `z23`, `z24`, `zcaja` y `zmaestro` a las pantallas nuevas sin cambiar las cifras que verifican. `z25` quedó en espera.
- **Pendiente.**
  - Etapa 5: validar con Esteban usando 6 tareas reales (están en el plan de diseño).
  - Etapa 6:
    - Clientes: "fecha a fecha" solo con la deuda y filtros por etapa.
    - Proveedores: resumen por edades.
    - Pedidos: Order report y Fichas en una sola lista, con la ficha al hacer clic.
    - Ajustes: menú lateral de 6 entradas.
    - Diálogos propios en lugar de los `confirm()` y `prompt()` que quedan.
  - Después, la capa 2 (v2.5).

## 0. v2.4 · Planes desde un archivo y anticipo de un derrame (9-nov-2026)

**Despliegue:** hasta el 9-nov lo desplegado era la v1.17.5 (la v2 a la v2.3 nunca se copiaron a la carpeta de despliegue). La v2.4 se copió directamente a `Escritorio\Zentrack_despliegue\Zentrack\master.html` (respaldo `master_v1.17.5_respaldo.html` al lado) y se corrió `build.py` allí; a Esteban solo le queda `desplegar.bat`. Esteban prefiere que se haga así: copiar uno mismo, no pedirle que copie.

Esteban mandó su plan con Eaglerise (imagen), la proyección de Magnum (Excel, criterio: cada factura se paga la semana en que cumple 30 días vencida) con el estado de cuenta del 3-nov (PDF) y el de TIBA (imagen, igual al SOA del 19-oct). Pidió no escribir nada a mano. Todo vive en la sección "v2.4 · PLANES DESDE UN ARCHIVO Y ANTICIPO DE UN DERRAME" al final de master.html. No hay llaves nuevas (las versiones de PLANES ganan `ref`).

- **Datos preparados ampliados** (`pkLeer`/`pkAplicar` envueltos): `PLANES_V` agrega una versión a un plan (`_pk24PlanAplicar`: la activa si `activar`, guarda la anterior, `real` por línea, no se repite con la misma `ref`); `CXP` carga un estado de cuenta de Magnum/TIBA ya leído por los lectores de la herramienta (`_pk24CxpAplicar`, mismas reglas que `cxpAprobar`; si ya hay ese corte o uno más nuevo no se toca); `REGLAS` (solo magnum/tiba); en `CXPMIO` un campo en `null` se quita (fechas a mano de un plan viejo). La vista previa dice todo en una línea por cosa.
- Subido con "Cargar archivo", Ajustes abre "Avanzado" (`cfgV2Avz`) y lleva la vista al recuadro; al aprobar, "Ver en Planes".
- **Corrección · anticipo de un derrame** (`_v2SoloAnticipo`): en CFM 3-4A/B, "pagos prioritarios" trae el anticipo de todo el pedido; si cuadra con la suma de los anticipos de las partes, su fecha ya no se le pone al balance (salía vencido).
- **Corrección · Finkargo en semanas pasadas** (envoltura v1.16 de `p14Calc`): el plan va por fecha exacta y un giro de una semana pasada cae en esta semana; su `PLANCHINA.fuera` ahora también se descuenta ahí (antes solo en semanas del horizonte con llave lunes).
- **El paquete real** de Esteban (`Zentrack_planes_9nov.json`) se armó con los lectores de la herramienta y se simuló sobre su respaldo del 4-nov más el detailed y el ORDER REPORT del 5-nov: Magnum quedó semana a semana igual a su Excel. Vive en `zentrack/privado/` (no va al repo). Sus cifras y lo que se le reportó están en `privado/CIFRAS.md`.
- **Ojo · detailed del 5-nov:** Andrés renombró PO 13 → 13-1/13-2 y CFM 4 (4A-D) → CFM 4-1/4-2. Si en Comparar se conservan los viejos (`noVino`, lo que pasa por defecto), los anticipos quedan dobles en lo que se le debe a Eaglerise.
- **Pruebas:** `z24.js` (20 verificaciones, cifras sacadas de los mismos archivos). `z20` ya no exige "Avanzado" cerrado (se abre al subir datos preparados; `z24` verifica que arranca cerrado).

## 0. v2.3 · Planes semana a semana y Caja limpia (nov-2026)

Esteban aprobó el prototipo "Planes Zentrack" (página aparte, 5-nov) y la Caja limpia del lienzo v2 (tablero "2b"), y aceptó quitar lo que eso dejaba repetido. Todo vive en la sección "v2.3 · PLANES SEMANA A SEMANA Y CAJA LIMPIA" al final de master.html y en el CSS `v3-*`. No hay llaves nuevas.

- **Contrapartes (`_v3Cps`)**: cliente del grupo (tipo Negociado, versión "a" = `PROM`), clientes externos (Contrato, base = cuotas del estado de cuenta), Eaglerise, Nexus y componentes (Negociado, base = fechas de Andrés, versión "a" = `PLANCHINA` con fecha exacta como llave), Magnum y TIBA (Regla, base = regla de días) y Finkargo y otros cargos (Contrato, base = cuotas). `activa:'base'` es nuevo: en un negociado quiere decir "sin plan"; en contrato/regla, "lo automático". "Negociar" (`v3Negociar`) copia la base o una versión a una versión nueva en borrador; un plan de externo/Magnum/TIBA/otros se crea al negociar (`_v3PlanDe`) y su primera versión es "a".
- **China con plan (en `p14Calc`)**: los giros de la versión activa pagan los pedidos en orden (`_v3Fifo`: vencido primero, luego por fecha, al final sin fecha). Lo que vence y el plan no cubre sale en su fecha (se le resta a `cjPagos` mientras corre la Caja); lo vencido que el plan no cubre no sale y se ve como "vencido sin plan". Antes, girar más que lo vencido era "te pasaste"; ahora adelanta lo que vence (no se cuenta dos veces).
- **Real**: `PLANES.real[idDelGiro]` = lo girado de verdad; la Caja cuenta solo lo que falta. Los cobros reales salen de los abonos (`ECA`): esta semana descuentan las promesas del cliente del grupo. Los giros de semanas pasadas siguen contando en esta semana hasta que se registre lo real o se borren (igual que antes).
- **Las versiones de pagos** (China, Magnum, TIBA, otros) cuentan solo en "Con mi plan de pagos"; las de cobros cuentan en las dos vistas. "Cuenta en la Caja" (`v3EnCaja`) usa `enCaja` del plan y `PLANES.excl` (lo de antes sigue funcionando).
- **Pestaña Planes (`renderPlanes`)**: "Semana a semana" (Atrasado + 12 semanas; fichas que se arrastran, clic para monto y semana, "+ Pago", "Real" en Atrasado y Esta semana, candado en lo automático, agrupado por semana) y "Cronograma por contraparte" (pestañas de versión, "Usar esta versión en la Caja", "Repartir un monto", "Cuotas iguales", fecha y monto exactos, qué pedidos paga cada giro). Indicadores que cambian con Todos / Me pagan / Yo pago. Eventos por delegación en `#v-planes` (`_v3Eventos`), atributos `data-a` y `data-c`.
- **Caja (`_p14Caja`)**: solo lee. 4 indicadores, saldo al cierre con la línea del colchón, tabla plegable (`P14.abre`) con la fuente de cada fila (link al cronograma), "Bancos hoy" abre las cuentas y la TRM. Clic en una celda muestra el detalle; Magnum/TIBA llevan a Cuentas › Debo.
- **Se quitó** (código y pantalla): las vistas de la Caja de la v1.12, las Cajas de la v1.14, v1.15 ("¿Me alcanza para…?", "Máximo a China") y v2.0, el cajón de facturas de la Caja, el panel "Planes activos", la grilla de Planes de la v2.1 con su generador, el bloque de plan con grilla en Cuentas (queda un resumen con "Abrir en Planes"), el "te pasaste" de Debo › China y el flujo de 12 semanas del Tablero (queda la barra de saldo, clic → Caja). `cjCajones`, `p14Calc('minimo')`, `planChinaSet` y `PLANES.excl` siguen.
- **Magnum y TIBA, factura por factura**, solo en Cuentas › Debo: casilla "En la Caja" (`CXPMIO.fuera`), "Aplicar regla a todas" y "Todo lo vencido esta semana".
- **Pruebas**: `z23.js` (29 verificaciones con los datos del 30-oct). Se ajustaron `z14`, `z15`, `z20` y `zcaja` a la Caja que solo lee y a los Planes nuevos, sin cambiar lo que verifican de los números.
- **Ojo**: después de cargar un detailed nuevo, los giros viejos del plan que Andrés ya descuenta hay que borrarlos o marcarles lo real; si no, siguen pagando pedidos en el orden de vencimiento.

## 0. v2 · tablero de control, planes de pago y salidas (nov-2026)

Esteban aprobó el rediseño en el lienzo "Zentrack · Propuesta de rediseño v2" (claude.ai, privado) después de dos rondas. Criterio de diseño que pidió: **tablero de control de CFO, sin frases**. Nada de "No te alcanza…" ni casillas escritas en palabras; cifras con edad, fecha y fuente, en tablas y gráficos con valores. Se entregaron las tres fases juntas como v2.2. Todo vive en cinco secciones nuevas al final de master.html (v2.0 ESTRUCTURA, v2.0 TABLERO, v2.0 CAJA, v2.1 PLANES, v2.2 SALIDAS) más el CSS `v2-*` al final del `<style>`.

- **Pestañas:** Tablero · Caja · Planes · Salidas · Cuentas · Pedidos y Ajustes (engranaje). `sinosure` y `precios` siguen como vistas con su botón escondido (`navTo` las abre; las pruebas usan `navTo('sinosure')`, no el clic). Pedidos tiene sub-vistas: Por estado (`PDV='estado'`, por defecto), Order report, Fichas (el Maestro) y Cupo Sinosure (la vista de Sinosure con el menú de Pedidos arriba y el mapa del cupo: los nodos `tmModeSeg`, `.cupo-cols` y `tmLegend` se mudan del Tablero a `#v-sinosure` en `pintarSino`; `renderHoy` los sigue encontrando por id).
- **Cargar archivo:** un solo botón (`#v2File`, múltiple). `_v2Tipo` reconoce detailed/ORDER REPORT (hoja Summary u ORDER REPORT), Magnum (Excel por nombre de hoja o PDF con "MAGNUM"), TIBA (hoja SOA), Finkargo (PDF) y datos preparados (.json), y abre el flujo de siempre de cada uno (`verifyOpen` + `#reportFile`, `cxpCargar`, `fkCargarPdf`, `pkCargar`). Nada se aprueba solo.
- **Tablero (`_v2Tablero`, reemplaza `_p15Tablero`):** fuentes con su fecha; plata en bancos; debo vencido por edades (China por proveedor con `cjCajones`, Magnum y TIBA por factura); me deben vencido por edades (`ecFilas` con cuotas); seis indicadores (mínimo de caja, cobertura 4 semanas, posición neta, cumplimiento del plan del cliente del grupo, cupo Singsun y Eaglerise); flujo de 12 semanas; edades por cliente y por proveedor; próximos 14 días (de `p14Calc('pago').R[*].it`); qué sale y llega; y **conciliación con Andrés**: pagos prioritarios contra el saldo de cada pedido (`saldoPrioridad`), las líneas de su lista que no son de ningún pedido (`CONCILIA.prioSueltos`) y la hoja Sinosure contra tu cuenta.
- **Caja (`_p14Caja`):** dos vistas, "Solo lo que vence" (`p14Calc('minimo')`) y "Con mi plan de pagos" (`'pago'`); `p15Vista` mapea las vistas viejas a esas dos. Seis indicadores, panel "Planes activos" (casilla para meter o sacar cada plan de la proyección y su versión), plan a China escrito por proveedor en la tabla, y Magnum/TIBA factura por factura (`p14Det('mag',i)`): pagar o no (`CXPMIO[k].fuera`, la saca de la Caja pero no de la deuda) y semana de pago (`cxpPlan`). "Aplicar regla" quita fechas a mano **solo de la semana abierta** y pregunta antes. Exportar baja un CSV. Las vistas de la v1.12 siguen en el DOM, escondidas.
- **Planes (llave nueva `PLANES={planes:[{id,cp,dir,prov,activa,enCaja,versiones:[{id,nombre,fecha,origen,estado,lineas:[{sem,fecha,monto,dest}]}]}],excl:{}}`):** un plan por contraparte negociada: cada cliente del grupo (`cobro:Solenium`) y Eaglerise, Nexus y componentes (`pago:eagle|nexus|comp`). **La versión "a" no se copia**: la de un cliente son sus promesas (`PROM`) y la de un proveedor es `PLANCHINA`; se leen y escriben ahí (`_v2SetCelda`). Las versiones b, c… viven en PLANES. La versión activa manda en la Caja: el `p14Calc` de afuera cambia por un momento `PLANCHINA`, `PROM`, `cxpActivas`, `cjCobros` y `cjPagosTerceros` y los devuelve en `finally`; `_v2PlanChinaActivo` parte de una copia de PLANCHINA para no perder `sin` ni `fuera` (lo girado con Finkargo). `excl` saca de la Caja lo que no es plan negociado (`cli:<cliente>`, `magnum`, `tiba`, `otros`). Pestaña Planes: solo lo activo, por cobrar y por pagar, en grilla de 12 semanas (escribir, mover de semana, partir 50/50, borrar, versión por fila, nuevo plan con generador de líneas). En Cuentas, el cliente del grupo trae su plan con todas las versiones, recibido (`ECA`) contra plan y cumplimiento (`_promHTML` ahora pinta esto); "fecha a fecha" (`_ecEntraHTML`) es una tabla con plan, pedidos, cuotas y cargos; los externos traen "Cuotas por pedido".
- **Salidas (llave nueva `SALIDAS={sel,cont,magFecha,magDias,magSeguro,margen,comparar,sem,cli}`):** un renglón por pedido que no ha llegado (en el mar, listo, en producción) del cliente elegido (por defecto el del grupo), con anticipo pendiente, componentes, contenedores (regla: 3×40HQ por tracker, 2 shelters por 20GP; se corrige por renglón), flete (tarifa por contenedor + % Magnum; si falta la tarifa se dice "falta"), aduana y transporte; aparte lo vencido que frena los zarpes. Magnum: lo que llega a N días a una fecha. "Pedir a …" compara contra cualquier versión del plan del cliente; "Llevar a Planes" crea una versión **borrador** (no cambia la activa). Las reglas de logística viven en `REGLAS.logistica` (Ajustes › Reglas). La llegada sin ETA se estima ETD + 35 días y se marca "(estimado)".
- **Cuentas:** la pestaña de estados de cuenta, con una sola lista: me deben (clientes) y debo (China, Magnum, TIBA, Finkargo, Fijos). En el estado de cuenta, "Vencido" arranca abierto y lo demás plegado (`ECGRP`, `ecGrp2`); las líneas repetidas de otros productos (las 14 estaciones COX) van en un grupo.
- **Ajustes:** `_v2CfgGrupos` reparte lo que pinta `renderConfig` en Reglas (incluye colchón, días máximos de Magnum/TIBA y logística), Historial de cargas y Avanzado (cerrado: datos preparados, TRM de prueba, mantenimiento, excepciones, empezar de cero). No borra nada.
- **Correcciones:** (1) Siliana: si lo que Andrés escribe en "pagos prioritarios" es el anticipo (`|saldoPrioridad − antSaldo| ≤ 2`), su fecha no se le pone al balance; el balance vence BL/ETD + plazo (`pagosPend` y `cjPagos`). Con el reporte del 23-oct, el vencido con Eaglerise queda igual que la tabla de Andrés descontando sus dos errores (la cifra está en `z20.js`). Para eso `aplicarOrderReport` y `cruzarOrderReport` ahora guardan `saldoPrioridad` (antes solo lo guardaba el lector de un solo archivo). (2) "Vencido" en Pedidos y Salidas sale de `cjPagos` y no de `pagosPend`: algunos trackers traen fecha límite "1900" del detailed.
- **Pruebas:** `z20.js` (40 verificaciones) cubre todo lo anterior. Se ajustaron a la interfaz nueva, sin cambiar lo que verifican: `z14` (indicador "te pasaste", cajón de facturas), `z15` (reescrita: lo vigente de la v1.15, letra mínima 13 px en las 8 pestañas), `zcargos` (`promAdd` en vez del botón), `zec` (abre los grupos antes de escribir la fecha), `zmaestro` (menú) y `z22`, `z22b`, `zsino3` (`navTo('sinosure')`).
- **Pendiente de v2:** leer los contenedores del detailed (hoy van por regla), las tarifas de flete (Esteban las va a pasar), escenarios guardados con nombre en la Caja (hoy el escenario es la combinación de planes activos y casillas) y el extracto bancario contra el plan.

## 1. Qué es

Zentrack importa trackers solares de **Singsun** (vía Nexus) y shelters de **Eaglerise**. Las compras se financian con crédito asegurado por **Sinosure**, y los equipos se venden a clientes, sobre todo a **Solenium**, que es un cliente interno. **Andrés** (en China) le manda a Esteban dos Excel en cada corte.

La herramienta lleva tres estados de cuenta:

| Estado de cuenta | Pregunta | De dónde sale |
|---|---|---|
| Nosotros → China | ¿Cuánto se le debe a cada fabricante y cuándo vence? | El detailed (hoja Summary) |
| Nosotros → Sinosure | ¿Cuánto cupo se usa y cuánto queda? | La hoja Sinosure del detailed, más la decisión de Esteban por pedido, más el techo que él pone |
| Clientes → nosotros | ¿Cuánto debe cada cliente? | Los precios, facturas y pagos que registra Esteban |

**Principio:** el archivo manda en los hechos (montos, saldos, estados). Esteban manda en las decisiones (cupo, derrames, nombres, clientes, precios). Ninguna carga puede pisar una decisión suya.

**Lo que más le importa a Esteban:** cargar los archivos y olvidarse. Todo lo que hace a mano tiene que sobrevivir a la siguiente carga, y los números tienen que cuadrar con la hoja de Andrés.

## 2. Plataforma

- Es una web app de **Google Apps Script** pegada a una Google Sheet de Esteban, en su cuenta personal de Google. Cambiar de cuenta de Claude no cambia nada de esto.
- `Code.gs` (en su proyecto se llama `Código.gs`) solo sirve el HTML con `doGet` e `include()`, y guarda y lee el estado. El estado es un JSON partido en trozos de 45k caracteres en la hoja `DB_State`. El servidor no calcula nada.
- Todo el cálculo vive en el navegador, en `master.html` (~410 KB, un solo archivo).
- `build.py` parte master.html en `appsscript/` (Estilos1-2, Motor1-6, Index), con un máximo de 62 KB por archivo, porque el editor de Apps Script trunca pegadas grandes. Después verifica que al rearmarlos salga idéntico. Ver `ARQUITECTURA.md`.
- **Despliegue:** `configurar.bat` se corrió una sola vez en el PC de Esteban: instaló clasp, hizo el login, clonó el proyecto a `appsscript/` y guardó el id de implementación en `deploy_id.txt`. Ahora cada versión es doble clic en `desplegar.bat`, que corre build, `clasp push --force` y `clasp update-deployment <id>`. La URL no cambia. Los scripts son `_comun.js`, `configurar.js` y `desplegar.js`. Ver `DESPLIEGUE.md`.
- En 2026-10 se decidió **no migrar a Python**: la lógica ya está probada y los fallos fueron de lógica, no de plataforma.

## 3. Cómo está escrito el código (léelo antes de editar)

master.html creció por **capas**. Cada versión agrega una sección al final del `<script>` que **reemplaza funciones existentes envolviéndolas**:

```js
const _wizApproveAntesX = wizApprove;
wizApprove = function(){ /* antes */ const r = _wizApproveAntesX.apply(this, arguments); /* después */ return r; };
```

Consecuencias:
- Una función puede tener 3 o 4 envolturas. Busca **todas** las asignaciones (`grep -n "wizApprove=function"`) para saber qué corre y en qué orden. La última definida es la de afuera.
- Un `const` o `let` de nivel superior no se puede redeclarar. Si un bloque viejo tiene uno que hay que cambiar, se edita en su sitio.
- Las secciones empiezan con `/* ==== TÍTULO ==== */`. build.py solo corta en esas fronteras, así que cada sección nueva debe llevar ese encabezado.
- Las funciones con nombre en español son de las capas nuevas. Las que vienen de v0.x (renderHoy, consumoEq, cargaViva…) siguen vivas debajo.

Capas principales, de abajo hacia arriba en el archivo:

| Sección | Qué hace |
|---|---|
| LECTOR PRINCIPAL (~L2876) | `parseReportV2`, `cargarDetailed`: leen el detailed y arman `WIZ.work` (los pedidos en edición) |
| Asistente de carga (~L3330) | `verifyOpen` y los 4 pasos (Recepción, Verificar y editar, Comparar, Resumen), más `wizApprove`, que pasa WIZ.work a ORD/EQ |
| PERSISTENCIA (~L4092) | `serializeState` / `applyState` / `saveToServer` / `loadFromServer` |
| CAPA SINOSURE MANUAL v1.1 (~L5021) | `SINO.ped`, el modo de cupo por pedido |
| PESTAÑA SINOSURE · DERROTERO | La pestaña Sinosure |
| LO QUE YO HICE A MANO v1.4 (~L5595) | `MIO`: derrames, nombres y clientes que sobreviven cargas |
| v1.5 LOS DOS ARCHIVOS JUNTOS | Cruce con el ORDER REPORT |
| SINOSURE · ¿COINCIDE CON LA HOJA? | Aviso e "Igualar a la hoja" |
| PRECIOS Y CLIENTES v1.5 | Grilla de precios, mover pedidos de cliente, repartir un precio total |
| v1.5.1 | MIO en borrador mientras el asistente está abierto |
| v1.6 | Empezar de cero, más respaldo y restauración .json |

## 4. Datos y estado

Variables globales: `ORD` (órdenes madre con `equipos[]`), `EQ` (todos los pedidos aplanados), `FACT`, `PAGOS`, `CLI`, `HIST` (cargas, cada una con `snapPrev`, la foto completa del estado anterior), `CUPO` (techos), `CONFIG`, `CONCILIA` (la última lectura de la hoja Sinosure), `GPRE` (grupos de precio), `SINO`, `MIO`, y `WIZ` (el asistente abierto; no se guarda).

**Las llaves del estado solo se agregan, nunca se renombran ni se borran.**

- **Identidad de un pedido:** `kOf(e)` = fabricante + número normalizado (`_poKey`) + sufijo de variante (`_poVarK`). "Pedido 7.2" en la hoja Sinosure es lo mismo que "PO#7-2" en el Summary. "CFM3-2" y "CFM3-2 INGEV2" son pedidos distintos (gemelos). PO#10 de Singsun y PO#10 de Eaglerise también son distintos.
- **Derrame:** partir un pedido en A, B, C… (`splitRow`). Las partes cumplen `/^(.*\d)([A-P])$/` y se agrupan con `_gruposDerrame`. Las partes llevan `splitDe` (el padre) y `_splitGroup`.
- **`SINO.ped[kOf]` = `{modo, fijo, nota, sug, mio}`.** El modo puede ser:
  - `saldo`: consume lo que falta pagarle al fabricante (columna O).
  - `monto`: consume el pedido completo (M) mientras tenga saldo.
  - `fijo`: consume la cifra fija menos lo girado desde entonces.
  - `fuera`: no consume.
  - `null`: sin clasificar, va a la bandeja.

  `mio=true` quiere decir que Esteban lo confirmó; `mio=false` es una propuesta sacada de la hoja y se ve como **"sin confirmar"**.
  - `_sinoPropuesta(O,M,d)` propone saldo si |d−O|≤2, monto si |d−M|≤2, y si no, fijo d.
  - `sinoMerge()` solo propone para pedidos sin `mio` y sin `modo`. Nunca reclasifica.
  - `sinoRegEf(e)`: una parte de un derrame hereda la decisión del padre, con su parte proporcional.
  - `consumoEq` aplica todo eso.
- **`MIO` = `{split:{kPadre:{partes:[{proj,cliente}]}}, proj:{k:nombre}, cli:{k:cliente}, v}`.** Son las recetas de lo manual.
  - `mioReaplicar()` las vuelve a aplicar sobre cada carga nueva, antes de que Esteban vea nada.
  - `mioRecuperar()` rescata derrames viejos desde `HIST[].snapPrev`.
  - Desde v1.5.1, MIO se toma en borrador al abrir el asistente (`_MIOBORR`) y se descarta si se cierra sin aprobar.

## 5. Flujo de una carga

1. Esteban selecciona **los dos archivos a la vez**: el detailed (tiene la hoja `Summary`) y el ORDER REPORT (tiene la hoja `ORDER REPORT`). El input `#reportFile` es múltiple y reconoce cada archivo por sus hojas.
2. Se lee el detailed, luego se aplica el ORDER REPORT encima (`aplicarOrderReport`), y luego MIO.
   - Del **ORDER REPORT** salen cliente, proyecto, cantidad, estado, fechas, BL, telex y fecha límite de pago.
   - Del **detailed** salen la plata con China y el cupo Sinosure.
   - Si los dos difieren, se lista en el paso 1 (lista para mandarle a Andrés).
3. **Paso 2:** derramar, nombrar, asignar cliente.
4. **Paso 3 (Comparar):** solo lo que cambió frente a lo ya cargado. Cargar dos veces el mismo archivo tiene que dar Comparar vacío.
5. **Paso 4 (Resumen y aprobar):** al aprobar, `wizApprove` pasa todo a ORD, registra MIO, corre `sinoMerge` y guarda.

Si se sube solo el detailed, cliente, estado y fechas salen del detailed y la lectura cambia. El paso 1 lo avisa en rojo.

## 6. Reglas de negocio que salieron de casos reales

- **Fila madre:** un bloque del Summary que repite su número y suma a sus hermanos no es un pedido. Ejemplo: PO#7-5 = 7-5…7-9.
- **Renglón repetido en la hoja Sinosure:** si apunta a una celda ya contada y hay un gemelo sin renglón, se le atribuye al gemelo (`_gemelosDeDup`). Caso: la celda E12 es de CFM 3-2 INGEV2.
- **Pedido cerrado:** sin saldo y sin renglón en la hoja, no se carga. Pero si ya estaba cargado, se conserva con saldo a China en 0 (`cerradoEn`): el cliente puede seguir debiéndolo (v1.17.1).
- **Pedido que no viene:** si un pedido que ya tenías no aparece en el detailed nuevo, se conserva como estaba (`noVino`) hasta que lo quites a mano en Comparar › Desaparecidos. Caso: el detailed del 23-oct no trae los trackers del PO#12 (12-1A/B, 12-2A/B, con Enexa y Sole).
- **"Paying" en un pago:** Andrés escribe solo lo que falta de ese pago; lo demás ya se abonó.
- **Embarcado no retrocede:** si el detailed trae BL ya pasado, el ORDER REPORT no lo devuelve a producción.
- **El techo del cupo** lo pone Esteban a mano en Ajustes o en Sinosure. Ninguna carga lo cambia.
- **La cifra de Sinosure que vale es la de la hoja Sinosure del detailed.** Si una decisión vieja la contradice, sale un aviso con "Igualar a la hoja".
- **Costo con China = fabricante + otros componentes** (`cupoMonto + otrosMonto`). No uses la columna "Total amount" del detailed (`totalChina`): en pedidos pagados vía Nexus (PO12 Solaris) Andrés pone ahí el precio de venta, y en 12-1/12-2 repite el total del par.
- **Solenium es cliente interno** (`CLI[x].interno`). Su estado de cuenta es un espejo del order report a precio de venta.

## 7. Pendiente

**Bug conocido, sin arreglar.** En el paso 4 del asistente, el "cupo Sinosure comprometido" (`cupoWork`, ~L3596) busca cada pedido por nombre exacto en la hoja. Las partes de un derrame (11-1A…) no están en la hoja y suman 0. Por eso ese resumen sale más bajo que el tablero, y la diferencia es exactamente lo que el tablero muestra como "sin confirmar". **El tablero es el correcto.** La solución es que `cupoWork` use la misma herencia que `sinoRegEf`/`consumoEq`. A Esteban ya se le explicó y se le ofreció arreglarlo.

Funcionalidad que falta:
1. Link de la factura en cada grupo de precio.
2. Consolidar varios grupos en uno nuevo con su factura.
3. Volver los tres estados de cuenta vistas de primer nivel.

Decisiones que Esteban todavía no ha tomado:
- ¿Sinosure cubre solo al fabricante o el costo total a China (que incluye Jingwei, Wenzhong y Restar)?
- ¿Se le piden a Andrés dos columnas nuevas en el ORDER REPORT: "Cupo Sinosure" y "Entra a Sinosure Sí/No"?

**Resuelto en v1.7 (llave nueva `COBRO`, sección "v1.7 · CÓMO SE COBRA CADA PEDIDO", prueba `zcobro.js`).** En Precios cada pedido tiene un selector:
- **Precio:** como antes.
- **Sin facturar:** al cliente interno se le cobra el **costo** con China (`cupoMonto`) con las mismas fechas (anticipo ya, balance al BL); la utilidad sale aparte como "por materializar". Al externo no le cambia nada (ya se cobra por factura). Sin decisión, un pedido interno sin precio es "Sin facturar" (Esteban lo pidió así: opción automática).
- **Especial:** nota libre, no cuenta en el estado de cuenta del cliente. Con la casilla "lo paga el cliente directo al fabricante" (`directo`) sale también de `deboChina`, `pagosPend`, `vencFilas` e `isOver`, pero **sigue consumiendo cupo Sinosure** (Esteban: "sí gasta cupo") hasta que el detailed lo muestre pagado. Se ve aparte en el Tablero (`#directoBox`).
- Esteban no sabe cómo es el cruce de cuentas entre Ingenio Verde y el broker; lo que vigila es el pendiente que trae el detailed.
- Ojo: en la hoja Sinosure, el renglón que Andrés llama "PO 14 SOLARIS" apunta al anticipo de **PO14 Siliana**, no a Solaris. La herramienta va por la fórmula y lo cuenta bien.

Lo que sigue es el diseño original, para contexto.

**Diseño (ya construido): pago directo del cliente al fabricante.** En PO12 Solaris (Eaglerise, cliente Ingenio Verde) el detailed dice "Payment via: Nexus", y "Total amount" es mayor que "Manufacturer amount" (montos en `privado/CIFRAS.md`). Esteban explicó que el "Total amount" es lo que **Ingenio Verde le tiene que pagar a Eaglerise**, o sea su precio de venta. Es el único shelter con "Payment via" Nexus; los demás dicen Zentrack, y en los trackers Nexus es lo normal. Hoy la herramienta lo trata como deuda propia: suma a "Vencido con China" y consume cupo.

Propuesta hecha a Esteban, **sin construir**: una marca por pedido, "lo paga el cliente directo al fabricante", que se pone una vez y persiste en una llave nueva del estado. Con la marca:
- El saldo sale de lo que debe Zentrack y se muestra como deuda del cliente con el fabricante.
- El estado de cuenta del cliente muestra ese pago con su vencimiento.
- Sinosure sigue la hoja de Andrés, salvo que Esteban lo ponga en "fuera".

Antes de construir hay que preguntarle:
1. ¿Ingenio Verde le paga el total completo a Eaglerise y Eaglerise le devuelve la diferencia a Zentrack, o le paga a Eaglerise solo el monto del fabricante y la diferencia a Zentrack?
2. ¿Ese pedido debe consumir cupo Sinosure?
3. ¿Es un caso único o va a repetirse (por ejemplo con PO14 Siliana)?

## 8. Errores que ya costaron caro (no los repitas)

- **Confiar en que ExcelJS escribe un archivo válido.** Con `fitToPage` + `outlineProperties` en la misma hoja, el archivo sale "dañado" para Excel aunque ExcelJS lo lea bien. Toda hoja nueva del Excel debe pasar el chequeo de orden de `z17.js`.
- **Poner notas internas en lo que ve el cliente** (PDF y Excel del estado de cuenta). Esteban los manda tal cual.
- **Usar variables CSS que no existen.** `--card`, `--line` y `--hover` no estaban definidas, así que los menús salían transparentes y oscuros. Los tokens reales son los de `:root` al comienzo del `<style>`. La app es **solo clara**: no agregues reglas de modo oscuro.
- **Guardar en MIO al instante**, durante un asistente que después se cancela.
- **Ids de derrame** generados con ms + azar, que chocaban. Ahora se usa `_gidNuevo()` con contador.
- **Insertar CSS con `rindex('</style>')`:** caía dentro de una plantilla JS.
- **Pruebas con esperas fijas.** Usa `waitForFunction` (WIZ.loaded, el modal cerrado).
- **Repintar la pestaña en cada tecla:** el usuario pierde el foco del campo.
- **Proponer modos de cupo sobre pedidos ya clasificados.** Cambiaba decisiones del usuario.
- **Mostrar números sin verificar con los archivos reales.** Esteban compara contra su cálculo de cabeza y se frustra con razón.

## 9. Pruebas

`zentrack/pruebas/` tiene 49 suites de Chromium (Playwright) que cargan los Excel reales, hacen clic como el usuario y verifican números y persistencia (`correr.js` las lista todas). Las que comparan contra totales de los archivos reales (z14, z15, z16, z171, z20, z23, z261, z27, z271, z291, zcobro, zec, zsino3) **no van al repo** (`.gitignore`): viven en la carpeta de Esteban en OneDrive. Una prueba nueva lleva cifras inventadas; si tiene que verificar contra un archivo real, va a esa lista. En Windows, apunta `CHROMIUM` al Chrome instalado (`C:\Program Files\Google\Chrome\Application\chrome.exe`).

```
cd zentrack/pruebas
npm install
node correr.js              # todas
node correr.js zmio.js      # una
```

- Los Excel **no están en el repo** porque es público. Esteban tiene que adjuntarlos y se guardan en `zentrack/pruebas/` con estos nombres:
  - `DET.xlsx`: detailed viejo del corte 25-sep (110 filas en Summary).
  - `DET3.xlsx`: "Detailed order and operational fund report SEP252026 (3).xlsx".
  - `OR2.xlsx`: ORDER REPORT de una hoja.
- Chromium: `/opt/pw-browsers/chromium` en la nube de Claude Code, o la ruta en la variable `CHROMIUM`.
- Desde la v1.14 también hacen falta (fuera del repo): `MAG.xlsx`, `MAG.pdf`, `TIBA.xlsx`, `RESP.json`, `V113.html`, `FINK.pdf`, `DATOS.json`, y desde la v1.17.1 `DET23.xlsx` y `OR23.xlsx` (detailed y ORDER REPORT del 23-oct). `package.json` trae `pdfjs-dist@3.11.174` y `exceljs@4.4.0` (z17 lo sirve desde node_modules en vez de cdnjs y lee el Excel que baja).
- `correr.js` copia `../master.html` a `ASM4.html` y saca las versiones viejas (V14/V141) del historial de git para la prueba de migración (`zrepro2`).

Las cifras de referencia para verificar están en `zentrack/privado/CIFRAS.md`. Esa carpeta no va al repo; Esteban la tiene.

## 10. Git

Se trabaja en la rama `claude/order-report-detailed-parsing-krkps6`, que hoy es también la rama por defecto del repo `estebgofinance/herramientasoficina`. Cada versión es un commit.

**Cómo se arma master.html desde la v2.6** (`zentrack/capas/`): `base_v2.4.html` + el CSS y el JS de cada capa (`v26/`, `v27/`: v27.js … v2132.js), en el orden de `capas/armar.py`. Para una versión nueva:
1. Escribe `capas/v27/vX.js` (y `vX.css` si hace falta) con su encabezado `/* ==== … ==== */`.
2. Agrégalo al final de `JS`/`CSS` en `armar.py` y sube `VER`.
3. `cd zentrack/capas && python armar.py`, luego `cd .. && python build.py`.

No edites master.html a mano: lo pisa el siguiente `armar.py`. Hasta el 18-nov-2026 estas piezas vivían en una carpeta temporal de Claude; nada de la v1.7 a la v2.13.2 estaba en git.
