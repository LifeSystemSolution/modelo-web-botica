/* Tablero de la dueña, reportes de ganancia y gastos */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const db = () => LF.store.db;
  const DIA = 864e5;
  const ok = v => LF.ventas.cuentan(v);
  const costoV = v => v.items.reduce((s, it) => s + (it.costo || 0), 0);
  const mermas = (a, b) => db().ajustesStock.filter(x => x.t >= a && x.t < b && x.cant < 0 && x.tipo === 'Merma').reduce((s, x) => { const l = db().lotes.find(y => y.id === x.lote); return s + -x.cant * (l ? l.costoU : 0); }, 0);

  /* ===== Tablero ===== */
  function renderTablero(el) {
    const D = db();
    const h0 = U.inicioDia();
    const hoy = D.ventas.filter(v => v.t >= h0 && ok(v));
    const vHoy = hoy.reduce((s, v) => s + v.total, 0);
    const prom = D.ventas.filter(v => v.t >= h0 - 28 * DIA && v.t < h0 && ok(v)).reduce((s, v) => s + v.total, 0) / 28;
    const lotes = LF.tieneModulo('vencimientos') ? LF.inventario.lotesConRiesgo() : [];
    const enRiesgo = lotes.filter(x => x.r.nivel !== 'bajo');
    const retirar = lotes.filter(x => x.r.util <= 0);
    const agot = D.productos.filter(p => LF.store.stock(p.id) <= 0);
    const bajo = D.productos.filter(p => { const s = LF.store.stock(p.id); return s > 0 && (s < p.min || (LF.tieneModulo('reposicion') && LF.store.reposicion(p).pedir)); });
    const caja = D.cajaHoy;
    const alertas = [];
    retirar.forEach(x => alertas.push(['mal', x.p.nombre + ', lote ' + x.l.codigo + ': ' + (x.r.dias < 0 ? 'ya venció' : 'vence en ' + x.r.dias + ' días') + '. Retirar del estante.', '#/vencimientos?id=' + x.l.id, 'Ver']));
    if (agot.length) alertas.push(['mal', U.plural(agot.length, 'producto agotado', 'productos agotados') + ': ' + agot.slice(0, 3).map(p => p.nombre).join(', ') + '.', '#/inventario?f=agotado', 'Ver']);
    if (bajo.length) alertas.push(['', U.plural(bajo.length, 'producto', 'productos') + ' por acabarse: ' + bajo.slice(0, 3).map(p => p.nombre).join(', ') + '. ' + (LF.tieneModulo('reposicion') ? 'El pedido sugerido ya está listo.' : ''), LF.tieneModulo('reposicion') ? '#/reposicion' : '#/inventario?f=bajo', LF.tieneModulo('reposicion') ? 'Qué pedir' : 'Ver']);
    const ayer = D.cajas.find(c => c.fecha === M.diaISO(h0 - DIA));
    if (ayer && ayer.contado !== ayer.esperado) alertas.push(['', 'La caja de ayer cerró con ' + (ayer.contado < ayer.esperado ? 'faltante' : 'sobrante') + ' de ' + U.soles(Math.abs(ayer.contado - ayer.esperado)) + '.', null]);
    if (!caja || caja.cerrada) alertas.push(['', caja ? 'La caja de hoy ya se cerró.' : 'La caja de hoy aún no se abre.', '#/caja', 'Caja']);
    const anul = D.ventas.filter(v => v.anulada && v.anulada.t >= h0);
    if (anul.length) alertas.push(['', U.plural(anul.length, 'venta anulada', 'ventas anuladas') + ' hoy.', '#/ventas', 'Ver']);
    // 7 días
    const dias = [];
    for (let i = 6; i >= 0; i--) { const a = h0 - i * DIA; const s = D.ventas.filter(v => v.t >= a && v.t < a + DIA && ok(v)).reduce((x, v) => x + v.total, 0); dias.push({ l: i === 0 ? 'Hoy' : U.fechaDia(a).split(' ')[0], v: Math.round(s), fmt: U.soles(s, 0) }); }
    const top = {};
    D.ventas.filter(v => v.t >= h0 - 7 * DIA && ok(v)).forEach(v => v.items.forEach(it => { top[it.pid] = (top[it.pid] || 0) + it.precio * it.cant - (it.costo || 0); }));
    const topL = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6);

    el.innerHTML = '<div class="kpis"><div class="kpi"><span>Vendido hoy</span><b class="num">' + U.soles(vHoy) + '</b><small>' + U.plural(hoy.length, 'venta') + ' · promedio diario ' + U.soles(prom, 0) + '</small></div>' +
      '<div class="kpi"><span>Ganancia bruta hoy</span><b class="num">' + U.soles(vHoy - hoy.reduce((s, v) => s + costoV(v), 0)) + '</b><small>ventas − costo de lo vendido</small></div>' +
      (LF.tieneModulo('vencimientos') ? '<div class="kpi' + (retirar.length ? ' kpi-mal' : '') + '"><span>En riesgo por vencer</span><b class="num">' + U.soles(enRiesgo.reduce((s, x) => s + x.r.soles, 0), 0) + '</b><small>' + U.plural(enRiesgo.length, 'lote') + ' · ' + retirar.length + ' por retirar</small></div>' : '<div class="kpi"><span>Productos</span><b class="num">' + D.productos.length + '</b><small>en el catálogo</small></div>') +
      '<div class="kpi"><span>Caja</span><b>' + (caja && !caja.cerrada ? 'Abierta' : caja ? 'Cerrada' : 'Sin abrir') + '</b><small>' + (caja ? 'desde ' + U.hora(caja.abre) : 'Ábrela para cobrar en efectivo') + '</small></div></div>' +
      '<div class="tab-grid"><section class="caja caja-p"><div class="sec-h"><h2>Atender hoy</h2></div>' + (alertas.length ? '<div class="alertas">' + alertas.map(a => '<p class="alerta ' + a[0] + '">' + icon('alert') + '<span>' + esc(a[1]) + '</span>' + (a[2] ? '<a class="btn btn-sm btn-line" href="' + a[2] + '">' + a[3] + '</a>' : '') + '</p>').join('') + '</div>' : U.vacio('check', 'Todo en orden', 'Nada urgente por ahora.')) + '</section>' +
      '<div class="tab-lado"><section class="caja caja-p"><div class="sec-h"><h2>Ventas de la semana</h2></div>' + U.barras(dias, { alto: 120 }) + '</section>' +
      '<section class="caja caja-p"><div class="sec-h"><h2>Lo que más deja (7 días)</h2></div><ul class="peores">' + topL.map(([pid, g]) => '<li><span>' + esc(LF.store.producto(pid).nombre) + '</span><b class="num">' + U.soles(g, 0) + '</b><small>de ganancia</small></li>').join('') + '</ul></section></div></div>';
  }

  /* ===== Reportes ===== */
  function renderReportes(el, params) {
    let rango = params.get('r') || '30';
    function pintar() {
      const D = db();
      const h0 = U.inicioDia();
      const desde = rango === 'hoy' ? h0 : h0 - Number(rango) * DIA;
      const vs = D.ventas.filter(v => v.t >= desde && ok(v));
      const chips = [['hoy', 'Hoy'], ['7', '7 días'], ['30', '30 días']].map(r => '<button class="chip' + (r[0] === rango ? ' on' : '') + '" data-r="' + r[0] + '">' + r[1] + '</button>').join('');
      const cab = '<div class="barra-f"><div class="chips">' + chips + '</div><button class="btn btn-line" data-csv' + (vs.length ? '' : ' disabled') + '>' + icon('download') + 'Exportar a Excel</button></div>';
      if (!vs.length) { el.innerHTML = cab + U.vacio('chart', rango === 'hoy' ? 'Hoy todavía no hay ventas' : 'No hay ventas en este rango', rango === 'hoy' ? 'El día empieza en cero. Vende algo en la caja rápida o usa "Simular cliente".' : '', '<button class="btn btn-line" data-r="7">Ver los últimos 7 días</button>'); enlazar(); return; }
      const ventas = vs.reduce((s, v) => s + v.total, 0);
      const costo = vs.reduce((s, v) => s + costoV(v), 0);
      const bruta = ventas - costo;
      const gastos = LF.tieneModulo('gastos') ? D.gastos.filter(g => g.t >= desde).reduce((s, g) => s + g.monto, 0) : 0;
      const merma = mermas(desde, Date.now() + DIA);
      const neta = bruta - gastos - merma;
      const nd = rango === 'hoy' ? 1 : Number(rango);
      const porDia = [];
      for (let i = nd - 1; i >= 0; i--) { const a = h0 - i * DIA; const s = vs.filter(v => v.t >= a && v.t < a + DIA).reduce((x, v) => x + v.total, 0); porDia.push({ l: nd === 30 ? (i % 3 === 0 ? String(new Date(a).getDate()) : '') : U.fechaDia(a).split(' ').slice(0, 2).join(' '), v: Math.round(s), fmt: nd === 30 ? (i % 3 === 0 ? String(Math.round(s)) : ' ') : U.soles(s, 0) }); }
      const cat = {}, prod = {}, hora = {}, med = {};
      vs.forEach(v => { med[v.medio] = (med[v.medio] || 0) + v.total; const h = new Date(v.t).getHours(); hora[h] = (hora[h] || 0) + 1; v.items.forEach(it => { const p = LF.store.producto(it.pid); const vt = it.precio * it.cant; cat[p.cat] = (cat[p.cat] || 0) + vt; prod[it.pid] = prod[it.pid] || { v: 0, c: 0 }; prod[it.pid].v += vt; prod[it.pid].c += it.costo || 0; }); });
      const catL = Object.entries(cat).sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ l, v: Math.round(v), fmt: U.soles(v, 0) }));
      const horas = []; for (let h = 8; h <= 21; h++) horas.push({ l: h + 'h', v: hora[h] || 0 });
      const prodL = Object.entries(prod).map(([pid, x]) => ({ p: LF.store.producto(pid), v: x.v, g: x.v - x.c, m: x.v ? Math.round((x.v - x.c) / x.v * 100) : 0 }));
      const topG = prodL.slice().sort((a, b) => b.g - a.g).slice(0, 6);
      const bajoM = prodL.filter(x => x.v > 30).sort((a, b) => a.m - b.m).slice(0, 4);
      el.innerHTML = cab + '<div class="kpis"><div class="kpi"><span>Ventas</span><b class="num">' + U.soles(ventas, 0) + '</b><small>' + U.plural(vs.length, 'venta') + ' · ticket ' + U.soles(ventas / vs.length) + '</small></div>' +
        '<div class="kpi"><span>Ganancia bruta</span><b class="num">' + U.soles(bruta, 0) + '</b><small>margen ' + Math.round(bruta / ventas * 100) + '%</small></div>' +
        '<div class="kpi"><span>Gastos y mermas</span><b class="num">' + U.soles(gastos + merma, 0) + '</b><small>' + (LF.tieneModulo('gastos') ? 'gastos ' + U.soles(gastos, 0) + ' · mermas ' + U.soles(merma, 0) : 'Gastos disponibles en plan Completo') + '</small></div>' +
        '<div class="kpi"><span>Ganancia neta</span><b class="num">' + U.soles(neta, 0) + '</b><small>' + Math.round(neta / ventas * 100) + '% de las ventas</small></div></div>' +
        '<p class="formula sec-s">Ganancia neta = ventas ' + U.soles(ventas, 0) + ' − costo de lo vendido ' + U.soles(costo, 0) + ' (al costo de cada lote) − gastos ' + U.soles(gastos, 0) + ' − mermas por vencimiento ' + U.soles(merma, 0) + ' = <b>' + U.soles(neta, 0) + '</b>. Las ventas incluyen IGV.</p>' +
        '<div class="grid2 sec"><section class="caja caja-p"><div class="sec-h"><h2>Ventas por día</h2></div>' + U.barras(porDia, { alto: 140 }) + '</section>' +
        '<section class="caja caja-p"><div class="sec-h"><h2>Ventas por categoría</h2></div>' + U.barras(catL, { horizontal: true }) + '</section>' +
        '<section class="caja caja-p"><div class="sec-h"><h2>Ventas por hora</h2><p>Para armar los turnos</p></div>' + U.barras(horas, { alto: 120 }) + '</section>' +
        '<section class="caja caja-p"><div class="sec-h"><h2>Los que más ganancia dejan</h2></div><ul class="peores">' + topG.map(x => '<li><span>' + esc(x.p.nombre) + '</span><b class="num">' + U.soles(x.g, 0) + '</b><small>' + x.m + '% margen</small></li>').join('') + '</ul>' +
        '<h3 class="sub-h">Margen más bajo (revisar precio)</h3><ul class="peores">' + bajoM.map(x => '<li><span>' + esc(x.p.nombre) + '</span><b class="num">' + x.m + '%</b><small>' + U.soles(x.v, 0) + ' vendidos</small></li>').join('') + '</ul>' +
        '<h3 class="sub-h">Medios de pago</h3><ul class="peores">' + Object.entries(med).sort((a, b) => b[1] - a[1]).map(([k, v]) => '<li><span>' + esc(k) + '</span><b class="num">' + U.soles(v, 0) + '</b><small>' + Math.round(v / ventas * 100) + '%</small></li>').join('') + '</ul></section></div>';
      enlazar();
      el.querySelector('[data-csv]').onclick = () => {
        U.csv('lifefarma-ventas-' + (rango === 'hoy' ? 'hoy' : rango + 'dias'), [['Fecha', 'Comprobante', 'Producto', 'Presentación', 'Cantidad', 'Precio (S/)', 'Total (S/)', 'Costo (S/)', 'Medio de pago']]
          .concat(vs.flatMap(v => v.items.map(it => [new Date(v.t).toLocaleString('es-PE'), v.serie + '-' + v.num, LF.store.producto(it.pid).nombre, it.pres, it.cant, String(it.precio.toFixed(2)).replace('.', ','), String((it.precio * it.cant).toFixed(2)).replace('.', ','), String((it.costo || 0).toFixed(2)).replace('.', ','), v.medio]))));
        U.toast('Descargaste ' + U.plural(vs.length, 'venta') + ' en Excel (CSV)');
      };
    }
    function enlazar() { el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rango = b.dataset.r; pintar(); }); }
    pintar();
  }

  /* ===== Gastos ===== */
  function renderGastos(el) {
    const D = db();
    const mes = D.gastos.filter(g => g.t > Date.now() - 30 * DIA);
    const porCat = {};
    mes.forEach(g => { porCat[g.cat] = (porCat[g.cat] || 0) + g.monto; });
    el.innerHTML = '<div class="barra-f"><span class="muted grow">Gastos de los últimos 30 días: <b class="num">' + U.soles(mes.reduce((s, g) => s + g.monto, 0)) + '</b></span><button class="btn btn-primary" data-nuevo>' + icon('plus') + 'Registrar gasto</button></div>' +
      '<div class="grid2"><section class="caja caja-p"><div class="sec-h"><h2>Por tipo</h2></div>' + U.barras(Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ l, v: Math.round(v), fmt: U.soles(v, 0) })), { horizontal: true }) + '</section>' +
      '<section class="caja caja-p"><div class="sec-h"><h2>Registrados</h2></div><ul class="desglose">' + D.gastos.slice(0, 20).map(g => '<li><span>' + esc(g.det) + '<small>' + esc(g.cat) + ' · ' + U.fechaDia(g.t) + '</small></span><b class="num">' + U.soles(g.monto) + '</b></li>').join('') + '</ul></section></div>';
    el.querySelector('[data-nuevo]').onclick = async () => {
      const r = await U.modal('Registrar gasto', '<label class="campo">Tipo<select name="cat"><option>Alquiler</option><option>Servicios</option><option>Sueldos</option><option>Útiles</option><option>Movilidad</option><option>Limpieza</option><option>Otros</option></select></label><label class="campo">Detalle<input name="det" required placeholder="Ej.: recibo de luz"></label><label class="campo">Monto (S/)<input name="monto" type="number" min="0.1" step="0.1" required></label>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Guardar', 'btn-primary']]);
      if (r.v !== 'ok') return;
      const monto = Number(r.data.get('monto')), det = String(r.data.get('det') || '').trim();
      if (!(monto > 0) || !det) { U.toast('Escribe el detalle y el monto del gasto.', 'error'); return; }
      D.gastos.unshift({ id: 'G' + LF.store.nextId('gasto'), t: Date.now(), cat: r.data.get('cat'), det, monto, por: LF.sesion.personaId });
      LF.store.log('Registró gasto', det + ' · ' + U.soles(monto));
      LF.store.save();
      U.toast('Gasto registrado');
      LF.refrescar();
    };
  }

  LF.vistas.tablero = { titulo: 'Tablero de hoy', menu: 'Tablero', icono: 'home', modulo: 'tablero', render: renderTablero };
  LF.vistas.reportes = { titulo: 'Reportes de ganancia', menu: 'Reportes', icono: 'chart', modulo: 'reportes', render: renderReportes };
  LF.vistas.gastos = { titulo: 'Gastos', icono: 'cash', modulo: 'gastos', render: renderGastos };
})();
