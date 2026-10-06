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

Chromium: `/opt/pw-browsers/chromium` en la nube, o la ruta que indique la variable `CHROMIUM`.

| Suite | Qué cuida |
|---|---|
| zsino2, z22, z22b | Cupo Sinosure por pedido, la pestaña Sinosure y la bandeja |
| zmio, zgid, zderr | Derrames y nombres que sobreviven cargas, sin choques de id ni saltos de scroll |
| zdos | La carga de los dos archivos juntos |
| zpc | Precios y clientes: mover, repartir, quitar |
| zwiz, zflujo, zident, zgem | El asistente, el paso Comparar, la identidad de pedidos y los gemelos |
| zrepro2 | Un estado guardado por versiones viejas abre sin perder nada |
| zcierre | Cerrar el asistente sin aprobar no deja rastros |
| zcero | Empezar de cero, el respaldo y la restauración |
| zoscuro | Los menús legibles con Windows en modo oscuro |
