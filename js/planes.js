/* Planes y módulos. Lo usan la página de planes (index.html) y el sistema (app.html).
   El plan se elige con ?plan=basico|control|completo, o ?plan=custom&mods=a,b,c para "Arma tu plan". */
(function () {
  const LF = (window.LF = window.LF || {});

  const MODULOS = {
    venta: { nombre: 'Caja rápida', plan: 'basico', fijo: true, desc: 'Vende por caja, blíster o unidad, con lector de código de barras, vuelto calculado y Yape, Plin o tarjeta.' },
    comprobantes: { nombre: 'Boletas, facturas y anulaciones', plan: 'basico', fijo: true, desc: 'Boleta, factura y nota de venta canjeable. Anular con nota de crédito pide el PIN de la dueña.' },
    productos: { nombre: 'Productos y precios', plan: 'basico', fijo: true, desc: 'Catálogo con precios por presentación y consulta de stock para atender rápido.' },
    caja: { nombre: 'Caja diaria', plan: 'basico', desc: 'Apertura con fondo, salidas con motivo y cierre con arqueo de billetes y monedas.' },
    clientes: { nombre: 'Clientes', plan: 'basico', desc: 'DNI o RUC con consulta simulada, historial de compras y pacientes crónicos.' },
    inventario: { nombre: 'Stock con lotes y kardex', plan: 'control', desc: 'Cada venta descuenta del lote que vence primero. Kardex y ajustes con motivo.' },
    vencimientos: { nombre: 'Riesgo por vencimiento', plan: 'control', desc: 'Puntaje de 0 a 100 por lote: cuántas unidades no se venderán a tiempo, cuánto dinero y qué hacer.' },
    compras: { nombre: 'Compras con lote', plan: 'control', desc: 'Ingresa la factura del proveedor con lote y vencimiento. Sube el stock y el costo.' },
    recetas: { nombre: 'Libro de recetas', plan: 'control', desc: 'Los antibióticos y crónicos piden la receta al vender: médico, CMP y paciente quedan registrados.' },
    tablero: { nombre: 'Tablero de la dueña', plan: 'control', desc: 'Lo de hoy, lo que se vence, lo que falta y la caja, en una sola pantalla.' },
    reposicion: { nombre: 'Pedido sugerido', plan: 'completo', desc: 'Calcula cuánto pedir de cada producto y a qué droguería, con el ahorro frente a la más cara.' },
    gastos: { nombre: 'Gastos', plan: 'completo', desc: 'Alquiler, luz, sueldos y gastos chicos, para saber la ganancia real del mes.' },
    reportes: { nombre: 'Reportes de ganancia', plan: 'completo', desc: 'Ventas, margen por producto y categoría, horas de más venta y ganancia neta. Exporta a Excel.' },
    usuarios: { nombre: 'Usuarios y permisos', plan: 'completo', desc: 'Cada trabajador con su PIN y lo que puede hacer: vender, comprar, ajustar stock o anular.' }
  };

  const BASICO = ['venta', 'comprobantes', 'productos', 'caja', 'clientes'];
  const CONTROL = BASICO.concat(['inventario', 'vencimientos', 'compras', 'recetas', 'tablero']);
  const PLANES = {
    basico: { nombre: 'Básico', para: 'Botica que quiere vender rápido, emitir comprobantes y cuadrar la caja.', mods: BASICO },
    control: { nombre: 'Control', para: 'Botica que pierde plata por productos vencidos o stock que no cuadra.', mods: CONTROL },
    completo: { nombre: 'Completo', para: 'Dueña que quiere saber cuánto gana, qué pedir y quién hizo qué.', mods: Object.keys(MODULOS) }
  };

  function planActual() {
    const q = new URLSearchParams(location.search);
    let clave = q.get('plan');
    let mods = q.get('mods');
    if (clave) {
      try { sessionStorage.setItem('lifefarma-plan', clave); sessionStorage.setItem('lifefarma-mods', mods || ''); } catch (e) { /* sin almacenamiento */ }
    } else {
      try { clave = sessionStorage.getItem('lifefarma-plan'); mods = sessionStorage.getItem('lifefarma-mods'); } catch (e) { clave = null; }
    }
    if (clave === 'custom') {
      const lista = String(mods || '').split(',').filter(m => MODULOS[m]);
      Object.keys(MODULOS).forEach(m => { if (MODULOS[m].fijo && !lista.includes(m)) lista.push(m); });
      return { clave: 'custom', nombre: 'A tu medida', mods: lista };
    }
    if (!PLANES[clave]) clave = 'completo';
    return Object.assign({ clave }, PLANES[clave]);
  }

  const planDe = mod => (MODULOS[mod] ? PLANES[MODULOS[mod].plan] : null);

  LF.planes = { MODULOS, PLANES, planActual, planDe, WHATSAPP: '51957111471' };
})();
