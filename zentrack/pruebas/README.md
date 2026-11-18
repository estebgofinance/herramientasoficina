# Pruebas

```
npm install
node correr.js            # todas (≈10 min)
node correr.js zpc.js     # una sola
```

Antes, pon en esta carpeta los Excel reales con estos nombres (no se suben al repo, que es público):

| Archivo | Qué es |
|---|---|
| `DET.xlsx` | detailed viejo, corte 25-sep (110 filas en Summary) |
| `DET3.xlsx` | "Detailed order and operational fund report SEP252026 (3).xlsx" |
| `OR2.xlsx` | ORDER REPORT de una hoja, corte 25-sep |
| `MAG.xlsx` / `MAG.pdf` | estado de cuenta de Magnum del 16-oct (Excel) y del 6-oct (PDF) |
| `TIBA.xlsx` | extracto de TIBA del 19-oct |
| `RESP.json` | respaldo real de Esteban del 9-oct |
| `V113.html` | master.html de la v1.13 (para comparar números) |
| `FINK.pdf` / `DATOS.json` | confirmación de compra de Finkargo y datos preparados de Esteban (v1.16) |
| `DET23.xlsx` / `OR23.xlsx` | detailed y ORDER REPORT del 23-oct (v1.17.1: PO#12 que no viene, CFM 2-3 en Paying, 10 y 9-7 ya zarparon) |

Chromium: `/opt/pw-browsers/chromium` en la nube, o la ruta que indique la variable `CHROMIUM`.

| Suite | Qué cuida |
|---|---|
| zsino2, z22, z22b | Cupo Sinosure por pedido, la pestaña Sinosure y la bandeja |
| zmio, zgid, zderr | Derrames y nombres que sobreviven cargas, sin choques de id ni saltos de scroll |
| zdos | La carga de los dos archivos juntos |
| zpc | Precios y clientes: mover, repartir, quitar |
| zcosto | El costo China en Precios es fabricante + otros, no el precio de Nexus |
| zwiz, zflujo, zident, zgem | El asistente, el paso Comparar, la identidad de pedidos y los gemelos |
| zrepro2 | Un estado guardado por versiones viejas abre sin perder nada |
| zcierre | Cerrar el asistente sin aprobar no deja rastros |
| zcero | Empezar de cero, el respaldo y la restauración |
| zoscuro | Los menús legibles con Windows en modo oscuro |
| z14 | Caja como presupuesto y Por pagar: lectores Magnum/TIBA, reglas, plan China, saldos, fijos, estado viejo |
| z17 | Estado de cuenta en PDF y Excel: grupos, Finkargo, totales que cuadran, resumen y barra de avance como los dejó Esteban, Excel que Excel puede abrir (orden de las piezas de cada hoja), sin notas internas, Excel de respaldo si no carga ExcelJS |
| z171 | Cargar el detailed sin perder pedidos: cupo Sinosure de los derrames, "Paying", estado embarcado, pedidos que no vienen o vienen cerrados |
| z1172 | Enexa El Rosario 1, 2 y 3: aviso con "Aplicar", 7-6/7-7 pasan a Enexa con precio y cuotas, sale el PO 12, abonos de Solenium no se pierden, "Deshacer" |
| z24 | Planes desde datos preparados (versión nueva de Eaglerise activa, estado de cuenta de Magnum/TIBA ya leído que no pisa uno igual o más nuevo, regla y fechas a mano que se quitan), anticipo de un derrame, Finkargo en semanas pasadas |
| z26 | v2.6, capa 1 ordenada: menú (Clientes y Proveedores; Salidas dentro de Pedidos), Tablero (tira de 5 cifras, "Requiere atención" por gravedad, una gráfica), Caja (solo la tabla, con Neto, saldo igual al cálculo, detalle al lado), Planes (las filas suman exacto lo que entra y sale en la Caja; ventanita: agregar, marcar pagado, mover; panel lateral: + Pago, fuera de la Caja, versión nueva y borrarla con diálogo propio; Deshacer), letra mínima 13 px, "Guardado hh:mm", sin llaves nuevas |
| z261 | v2.6.1, pedidos que Andrés renombra: datos preparados con TRASPASO (13 → 13-1, CFM 4A-4D → CFM 4-1 en partes) heredan nombre, cliente, precio, costo y lo aplicado al cliente; los viejos salen y la deuda con China no se duplica; PLAN_QUITAR (plan de Nexus) y GIROS (sin repetir); cargar lo mismo otra vez no cambia nada |
| z27 | v2.7, planes: Tablero con el sankey (semana con ‹ ›, 4 o 12 semanas) que cuadra con la Caja; pendientes arriba de la tabla de Planes; pagar con fecha y medio (PLANES.reg), correr, ajustar, armar acuerdo con 4 datos o pegando, borrador, historial, reprogramar cobros y cobrar como abono (lo más viejo primero); todo con Deshacer y sin llaves nuevas |
| z271 | v2.7.1, Solenium sin cobros dobles: los componentes van con su fabricante (no hay proveedor "Componentes"); el capital del préstamo de Finkargo se le abona al cliente que lo asume (al más vencido primero, sin tocar el cargo) y no cuenta como plata que entra; el sankey resta lo que Finkargo paga directo a China en vez de mostrarlo como entrada |
| z28 | v2.8, precios provisionales y facturados: todo precio sin factura es provisional; cálculo (China + flete + aduana) × (1 + margen) + Zentrack × 1.30; datos preparados PRECIOS (sin pisar lo facturado); registrar factura recalcula el saldo; standby saca el pedido del estado de cuenta; el PDF del cliente no dice qué es provisional; llave nueva PRECIO |
| z281 | v2.8.1, actualización preparada: con Apps Script simulado, al abrir y leer el estado del servidor aplica sola los pasos (asistente del detailed aprobado y datos preparados), la guarda con su marca y no la repite; no corre si el servidor falla ni con el estado vacío |
| z29 | v2.9, Excel de planes: descarga Léeme, Pagos, Cobros y Precios con código por fila; subirlo sin cambios no cambia nada; con cambios muestra qué cambia y al aprobar crea acuerdos nuevos (las cuotas conservan lo pagado), vuelve plan propio un automático, registra pagos con medio, cobros como abono y precios, facturas y standby; subirlo dos veces no duplica; Deshacer; "Cargar archivo" lo reconoce |
| z291 | v2.9.1, flujo sin saldo de bancos: el cálculo arranca en cero aunque haya saldo registrado; esta semana suma lo que ya entró (abonos) y ya salió (pagos registrados) del lunes a hoy; Caja con Acumulado; Tablero con "Esta semana" y gráfica entra − sale; sankey semana por semana |
| z293 | v2.9.3, plan de Enexa: un acuerdo con "desde" no cuenta los abonos de antes; paso "abono" de la actualización preparada va al pedido indicado, en partes, sin repetirse ni duplicar uno parecido ya registrado; standby para líneas sueltas del estado de cuenta, con Reactivar en Clientes › Precios |
| z210 | v2.10, necesidad de efectivo: TRM oficial por fecha (datos.gov.co, simulada) guardada y usada por la Caja; la hoja de un cliente del grupo (pagos de la semana = Caja, entradas de otros clientes, lo ya girado, por girar y cómo se abona); los pedidos en standby no se giran a China; PDF y Excel con diálogo (esta semana / la siguiente / sin hoja, TRM oficial o escrita); Excel abre sin daño; sin conexión pide la TRM |
| z211 | v2.11, Caja viva: la fecha pasa sola al día siguiente con la página abierta (igual que abrirla ese día; espera si hay un diálogo); lo que el detailed (con corte en el nombre, posterior a la primera cuota) muestra pagado a un proveedor de China se descuenta solo de las cuotas ya vencidas del plan (la más vieja primero; las futuras no se tocan; sin contar dos veces lo registrado; sin guardar nada); fijos, impuestos y cuotas de contrato de semanas pasadas no se arrastran; gráfica de control debajo de la tabla con las mismas cifras, hover y clic; sin tabla día a día; sin llaves nuevas; v2.11.1: un estado de cuenta con el mismo corte y otras facturas sí entra desde un paquete (igual o más viejo, no); v2.11.2: un abono adelantado (después del acuerdo, antes de la semana de la cuota) tacha la cuota; cobrar lo mismo desde Planes no duplica; la TRM oficial llega por el servidor si el navegador no puede, y sin oficial se usa la del abono en pesos más reciente; la Caja dice qué TRM usa; v2.11.3: el paso "reaplicar" mueve parte de un abono de una línea a otra sin cambiar el total ni repetirse |
| z212 | v2.12, necesidad de efectivo con decisiones: botón en el estado de cuenta del cliente del grupo y en la Caja; abre con la cifra de la hoja; desmarcar, pedir una parte y ajustar cambian la cifra y lo que ve el cliente sin guardar nada; "Otra semana" mueve el pago en la Caja y Deshacer lo devuelve; PDF y Excel por rubro (Excel válido) |
| z213 | v2.13, Planes por cuotas: abre en la lista de contrapartes y las cuotas de la que tiene la pendiente más vieja (12 semanas a un clic); agregar con fecha, concepto, monto y Enter suma en la Caja; cuota en pesos vale con la TRM del día; mover corrige el mismo acuerdo con nota y Deshacer; marcar varias y correrlas; quitar; subtotales por semana; China solo en US$; automático con "Hacer plan propio"; "Abrir en Planes" cae en esa contraparte; Excel no cambia por la TRM y conserva concepto y pesos; paso "cuotaCop"; sin llaves nuevas |
| z2131 | v2.13.1, marcar desde Planes sincronizado: "Cobrado" = abono en el estado de cuenta amarrado a la cuota (no se repite), "Desmarcar" lo quita de ambos, Deshacer; un abono del estado de cuenta tacha la cuota y repetirlo pregunta; "Pagado" en un giro a China = pago con fecha y medio del panel, Desmarcar; Magnum factura por factura con las marcas de Proveedores (pagada y fecha de pago mueven la Caja); un contrato automático se cobra desde Planes; sin llaves nuevas |
| z2132 | v2.13.2, arreglos de la auditoría del 18-nov: "Cobrado" tacha la cuota del botón y no se cobra dos veces; cuota en pesos cobrada o pagada no reabre si la TRM cambia (cliente y proveedor, el pago guarda su TRM); correr varios giros de China no los junta; las acciones de varias no tocan las pagadas; fecha escrita con el teclado se guarda una vez (Enter o al salir); fila de agregar, Excel y Acuerdo nuevo conservan los pesos; Desmarcar un abono del estado de cuenta (pregunta); Plan en la Caja en pesos; PDF sin "Cobro del plan"; avisos sin Cancelar; cuotaCop con guarda |

La prueba de la capa 2 (z25, v2.5) quedó en espera junto con esa versión, en `zentrack/privado/v25_espera/`.
