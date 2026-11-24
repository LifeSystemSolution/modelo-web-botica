# LifeFarma · Demo de sistema para boticas y farmacias

Demo vendible de **LifeSystem Solutions** para boticas en Perú. Tiene tres partes:

| Página | Para quién | Qué muestra |
|---|---|---|
| `index.html` | Dueño de la botica que evalúa el sistema | Problema, cómo funciona (capturas reales), **planes Básico / Control / Completo y "Arme su plan"**, calculadora de pérdida por vencimiento, accesos por rol |
| `web.html` | Clientes de la botica | Web pública de la botica ficticia **Botica LifeFarma**: buscador con disponibilidad real, pedido por WhatsApp, servicios, ubicación y botón **"Ingresar al sistema"** |
| `app.html` | Personal de la botica | Sistema interno por rol, con los módulos del plan elegido |

Botica, químico farmacéutico, clientes, médicos, droguerías, DNI, RUC y teléfonos son **ficticios**. Demo en vivo: https://lifesystemsolution.github.io/modelo-web-botica/

## Accesos por rol

| Enlace | Rol |
|---|---|
| `app.html?demo=cajero` | **Cajera** (Ana): caja rápida, ventas, caja diaria, clientes, productos |
| `app.html?demo=qf` | **Químico farmacéutico** (Milagros): vencimientos, stock y lotes, compras, libro de recetas |
| `app.html?demo=dueno` | **Dueña** (Rosa): tablero, ventas, vencimientos, stock, compras, pedido sugerido, reportes, gastos, ajustes |
| `app.html` | Pantalla para elegir rol |

Plan: `&plan=basico`, `&plan=control` o `&plan=completo` (por defecto). A medida: `&plan=custom&mods=venta,comprobantes,productos,vencimientos`. Los módulos fuera del plan aparecen con candado y explican cómo probarlos. PIN de prueba: cajeros 0000 · Q.F. 2222 · dueña 1234 (anular una venta pide el PIN de la dueña).

## Enlaces para presentar

- Atender a una clienta con receta (carrito ya cargado): `app.html?demo=cajero#/venta?sim=1`
- Abrir el lote más urgente: `app.html?demo=qf#/vencimientos?id=primero`
- Pedir como cliente: `web.html#catalogo`
- Botón **Simular cliente**: en caja carga un carrito de ejemplo; en el resto de roles registra una venta.

## Módulos y planes

| Módulo | Básico | Control | Completo |
|---|:-:|:-:|:-:|
| Caja rápida (caja, blíster o unidad; lector de código de barras; vuelto; F2 para cobrar) | ✓ | ✓ | ✓ |
| Boletas, facturas, nota de venta canjeable y anulación con nota de crédito | ✓ | ✓ | ✓ |
| Productos y precios (margen por presentación) | ✓ | ✓ | ✓ |
| Caja diaria con arqueo | ✓ | ✓ | ✓ |
| Clientes (DNI/RUC, crónicos, lo que más compran) | ✓ | ✓ | ✓ |
| Stock con lotes, kardex y ajustes | | ✓ | ✓ |
| Riesgo por vencimiento (promoción, canje imprimible, retiro como merma) | | ✓ | ✓ |
| Compras con lote y vencimiento (costo promedio) | | ✓ | ✓ |
| Libro de recetas (exportable) | | ✓ | ✓ |
| Tablero de la dueña | | ✓ | ✓ |
| Pedido sugerido por droguería | | | ✓ |
| Gastos | | | ✓ |
| Reportes de ganancia | | | ✓ |
| Usuarios y permisos | | | ✓ |

Atajos: `/` buscar, `N` nueva venta, `F2` cobrar, `Esc` cerrar, `?` ayuda.

## Lógica central

### Venta por lote (FEFO)
Cada venta descuenta del lote que vence primero. No se venden lotes a menos de **30 días** de vencer (días de retiro, editable). Antibióticos y algunos crónicos piden la receta (médico, CMP, paciente) antes de cobrar. Precios con IGV incluido: la boleta muestra la operación gravada y el IGV 18%.

### Riesgo de pérdida por vencimiento (0 a 100, por lote)
- **Días útiles** = días para vencer − días de retiro.
- **Se alcanza a vender** = venta diaria × días útiles − unidades de lotes que vencen antes (salen primero).
- **Excedente** = unidades del lote − lo que se alcanza a vender. **Dinero en riesgo** = excedente × costo.

| Factor | Peso | Cómo suma |
|---|---|---|
| Cercanía | 35 | Todo el peso si ya pasó la fecha de retiro; antes, sube en los últimos 120 días útiles |
| Excedente | 35 | Porcentaje del lote que no se venderá a tiempo |
| Valor | 20 | Dinero en riesgo (tope en S/ 300) |
| Rotación | 10 | Productos que se venden menos de 3 unidades al día |

Riesgo **alto** desde 60, **medio** desde 35. Sin excedente, un lote no pasa de riesgo bajo, salvo que ya deba retirarse. Cada lote dice qué hacer: vender primero, pedir canje, vigilar o retirar. Pesos y días de retiro se editan en **Ajustes** con vista previa en vivo.

### Pedido sugerido
`Pedir = venta diaria × (días de entrega + días de cobertura) + 3 días de seguridad − stock vendible`, redondeado a la presentación de compra. Se sugiere cuando el stock baja del punto de pedido (`venta diaria × días de entrega + seguridad`) y se elige la droguería más barata, mostrando el ahorro.

### Ganancia neta (Reportes)
`Ventas − costo de lo vendido (al costo de cada lote) − gastos − mermas por vencimiento`.

## Qué está simulado

Envío de boletas y facturas a SUNAT, consulta RENIEC/SUNAT, cobro con tarjeta, envío de pedidos y avisos por WhatsApp. Se avisa en cada pantalla.

## Datos de ejemplo

- 50 productos con precios de mercado peruano, 3 droguerías, unas 1 860 ventas en 30 días (menos los domingos), recetas, compras con lote, gastos del mes y cierres de caja.
- Lotes pensados para la demo: uno vencido, uno por retirar y varios con excedente; algunos productos llegaron a su punto de pedido.
- **Hoy empieza en 0:** no hay ventas, compras ni caja abierta hoy.
- Semilla fija: datos iguales en cada carga, fechas calculadas desde hoy. Se guardan en `localStorage` (`lifefarma-datos`) con versión de esquema y se regeneran si cambia el esquema o el día. **Ajustes → Reiniciar datos de ejemplo**.

## Estructura

```
index.html      Planes (landing)          css/landing.css  js/landing.js
web.html        Web pública de la botica  css/web.css      js/web.js
app.html        Sistema interno           css/app.css
css/base.css    Marca LifeSystem, modo oscuro, botones
js/icons.js     Íconos e ilustraciones SVG de productos
js/motor.js     FEFO, riesgo por vencimiento, reposición, IGV, plurales
js/planes.js    Planes y módulos
js/seed.js      Datos de ejemplo
js/store.js     localStorage con versión de esquema y permisos
js/ui.js        Formatos, panel, modal, gráficos, CSV, impresión
js/venta.js ventas.js caja.js productos.js inventario.js compras.js gestion.js ajustes.js
js/app.js       Arranque: plan, rol, router por hash, tema, atajos
img/capturas/   Capturas reales (Chrome headless, 1440×900)
```

## Ver en local

```
python -m http.server 8774
```

Abrir http://localhost:8774/. Al cambiar un CSS o JS, sube el número `?v=N` en `index.html`, `web.html` y `app.html`.

---
Desarrollado por LifeSystem Solutions · WhatsApp 957 111 471
