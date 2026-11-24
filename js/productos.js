/* Productos y precios (catálogo) y Clientes */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const db = () => LF.store.db;
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const DIA = 864e5;

  function margen(p, pr) { const costo = p.costoU * pr.unidades; return pr.precio ? Math.round((pr.precio - costo) / pr.precio * 100) : 0; }

  function detalleProducto(id) {
    const p = LF.store.producto(id);
    const st = LF.store.stock(p.id);
    const lotes = LF.store.lotesDe(p.id).filter(l => l.cant > 0).sort((a, b) => a.vence.localeCompare(b.vence));
    const editar = LF.sesion.rol === 'dueno';
    const html = '<div class="panel-h">' + LF.illus(p.ill, 48) + '<div style="flex:1;min-width:0"><span class="sub">' + esc(p.cat) + ' · ' + esc(p.forma) + '</span><h2>' + esc(p.nombre) + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c"><div class="dato-grid"><div class="dato"><span>Stock vendible</span><b>' + LF.venta.stockTxt(p, st) + '</b><small>Mínimo: ' + p.min + ' u</small></div><div class="dato"><span>Se vende</span><b>' + (p.vd >= 10 ? Math.round(p.vd) : p.vd.toFixed(1)) + ' u al día</b><small>Promedio de 30 días</small></div>' +
      '<div class="dato"><span>Código de barras</span><b class="num">' + p.codigo + '</b></div><div class="dato"><span>Receta</span><b>' + (p.receta ? 'Se vende con receta médica' : 'Venta libre') + '</b></div></div>' +
      '<section class="bloque"><h3>Precios</h3><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Presentación</th><th class="r">Costo</th><th class="r">Precio</th><th class="r">Margen</th></tr></thead><tbody>' +
      p.pres.map((pr, i) => '<tr><td>' + esc(M.presTxt(pr)) + '</td><td class="r num">' + U.soles(p.costoU * pr.unidades) + '</td><td class="r">' + (editar ? '<input type="number" step="0.1" min="0" value="' + pr.precio + '" data-precio="' + i + '" aria-label="Precio de ' + esc(pr.tipo) + '">' : '<b class="num">' + U.soles(pr.precio) + '</b>') + '</td><td class="r num" data-mg="' + i + '">' + margen(p, pr) + '%</td></tr>').join('') + '</tbody></table></div></section>' +
      (LF.tieneModulo('inventario') ? '<section class="bloque"><h3>Lotes (sale primero el que vence antes)</h3>' + (lotes.length ? '<ul class="desglose">' + lotes.map(l => { const r = LF.store.riesgoLote(l); return '<li><span>Lote ' + esc(l.codigo) + ' · ' + l.cant + ' u<small>Vence ' + U.fechaLarga(new Date(l.vence + 'T12:00')) + '</small></span>' + U.riesgo(r) + '</li>'; }).join('') + '</ul>' : '<p class="muted">Sin lotes con stock.</p>') + '</section>' : '') +
      '</div>' + (editar ? '<div class="panel-f"><button class="btn btn-dark" data-guardar>Guardar precios</button></div>' : '');
    const pn = U.panel(html);
    pn.querySelectorAll('[data-precio]').forEach(i => i.oninput = () => { pn.querySelector('[data-mg="' + i.dataset.precio + '"]').textContent = margen(p, Object.assign({}, p.pres[i.dataset.precio], { precio: Number(i.value) })) + '%'; });
    const g = pn.querySelector('[data-guardar]');
    if (g) g.onclick = () => {
      const cambios = [];
      pn.querySelectorAll('[data-precio]').forEach(i => { const pr = p.pres[i.dataset.precio]; const v = Math.round(Number(i.value) * 100) / 100; if (v > 0 && v !== pr.precio) { cambios.push(pr.tipo + ': ' + U.soles(pr.precio) + ' → ' + U.soles(v)); pr.precio = v; } });
      if (!cambios.length) { U.toast('No hay cambios que guardar', 'info'); return; }
      LF.store.log('Cambió precio', p.nombre + ' · ' + cambios.join(' · '));
      LF.store.save();
      U.toast('Precios de ' + p.nombre + ' guardados');
      LF.refrescar();
    };
  }

  function renderProductos(el) {
    let q = '', cat = '';
    const cats = [...new Set(db().productos.map(p => p.cat))];
    el.innerHTML = '<div class="barra-f"><label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="Nombre, molécula o código" aria-label="Buscar productos"><kbd>/</kbd></label><select data-cat aria-label="Categoría"><option value="">Todas las categorías</option>' + cats.map(c => '<option>' + esc(c) + '</option>').join('') + '</select></div><div id="lista"></div>';
    const lista = el.querySelector('#lista');
    function pintar() {
      const qq = norm(q);
      const rows = db().productos.filter(p => (!cat || p.cat === cat) && (!qq || norm(p.nombre + ' ' + p.forma + ' ' + p.codigo).includes(qq)));
      if (!rows.length) { lista.innerHTML = U.vacio('search', 'No encontramos "' + q + '"', 'Prueba con el nombre genérico del medicamento.'); return; }
      lista.innerHTML = '<div class="tabla-wrap"><table class="tabla tabla-cli"><thead><tr><th>Producto</th><th>Categoría</th><th>Precios</th><th class="r">Stock</th></tr></thead><tbody>' +
        rows.map(p => { const st = LF.store.stock(p.id); return '<tr data-id="' + p.id + '" tabindex="0"><td><b>' + esc(p.nombre) + '</b>' + (p.receta ? ' <span class="tag tag-red">' + icon('note') + 'Receta</span>' : '') + '<br><small class="muted">' + esc(p.forma) + '</small></td><td>' + esc(p.cat) + '</td><td class="num">' + p.pres.map(pr => esc(pr.tipo) + ' ' + U.soles(pr.precio)).join(' · ') + '</td><td class="r">' + (st <= 0 ? '<span class="tag tag-red">' + icon('alert') + 'Agotado</span>' : st < p.min ? '<span class="tag tag-warn">' + icon('alert') + LF.venta.stockTxt(p, st) + '</span>' : LF.venta.stockTxt(p, st)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      lista.querySelectorAll('tr[data-id]').forEach(tr => { tr.onclick = () => detalleProducto(tr.dataset.id); tr.onkeydown = e => { if (e.key === 'Enter') detalleProducto(tr.dataset.id); }; });
    }
    const inp = el.querySelector('[data-buscar]');
    let t;
    inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { q = inp.value; pintar(); }, 150); };
    el.querySelector('[data-cat]').onchange = e => { cat = e.target.value; pintar(); };
    pintar();
  }

  /* ===== Clientes ===== */
  function resumen(c) {
    const vs = db().ventas.filter(v => v.cliente === c.id && LF.ventas.cuentan(v));
    const mes = vs.filter(v => v.t >= Date.now() - 30 * DIA);
    return { vs, mes, gasto: mes.reduce((s, v) => s + v.total, 0), ultimo: vs.reduce((m, v) => Math.max(m, v.t), 0) };
  }
  function detalleCliente(id) {
    const c = db().clientes.find(x => x.id === id);
    const r = resumen(c);
    const frec = {};
    r.vs.forEach(v => v.items.forEach(it => { frec[it.pid] = (frec[it.pid] || 0) + 1; }));
    const top = Object.entries(frec).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const html = '<div class="panel-h"><div style="flex:1;min-width:0"><span class="sub">' + (c.tipo === 'empresa' ? 'Empresa · RUC ' : 'Persona · DNI ') + c.doc + (c.cronico ? ' · paciente crónico' : '') + '</span><h2>' + esc(c.nombre) + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c"><div class="dato-grid"><div class="dato"><span>Compras en 30 días</span><b class="num">' + r.mes.length + '</b></div><div class="dato"><span>Gastó en 30 días</span><b class="num">' + U.soles(r.gasto) + '</b></div></div>' +
      (top.length ? '<section class="bloque"><h3>Lo que más compra</h3><ul class="desglose">' + top.map(([pid, n]) => '<li><span>' + esc(LF.store.producto(pid).nombre) + '</span><b>' + U.plural(n, 'vez', 'veces') + '</b></li>').join('') + '</ul></section>' : '') +
      '<section class="bloque"><h3>Últimas compras</h3>' + (r.vs.length ? '<ul class="desglose">' + r.vs.slice().sort((a, b) => b.t - a.t).slice(0, 10).map(v => '<li><span>' + v.serie + '-' + v.num + '<small>' + U.cuando(v.t) + '</small></span><b class="num">' + U.soles(v.total) + '</b></li>').join('') + '</ul>' : '<p class="muted">Aún no tiene compras registradas con su documento.</p>') + '</section></div>';
    U.panel(html);
  }
  function renderClientes(el) {
    let q = '';
    el.innerHTML = '<div class="barra-f"><label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="Nombre, DNI o RUC" aria-label="Buscar clientes"><kbd>/</kbd></label></div><p class="muted ayuda">Datos ficticios. Los clientes se registran solos al pedir su DNI o RUC en la caja.</p><div id="lista"></div>';
    const lista = el.querySelector('#lista');
    function pintar() {
      const qq = norm(q);
      const rows = db().clientes.filter(c => !qq || norm(c.nombre + ' ' + c.doc).includes(qq)).map(c => Object.assign({ c }, resumen(c))).sort((a, b) => b.gasto - a.gasto);
      if (!rows.length) { lista.innerHTML = U.vacio('users', 'No encontramos a "' + q + '"', 'Se registrará cuando des su DNI o RUC al vender.', '<a class="btn btn-primary" href="#/venta">' + icon('cart') + 'Ir a vender</a>'); return; }
      lista.innerHTML = '<div class="tabla-wrap"><table class="tabla tabla-cli"><thead><tr><th>Cliente</th><th>Documento</th><th class="r">Compras 30 d</th><th class="r">Gasto 30 d</th><th>Última compra</th></tr></thead><tbody>' +
        rows.map(x => '<tr data-id="' + x.c.id + '" tabindex="0"><td><b>' + esc(x.c.nombre) + '</b>' + (x.c.cronico ? ' <span class="tag">Crónico</span>' : '') + (x.c.tipo === 'empresa' ? ' <span class="tag">Empresa</span>' : '') + '</td><td class="num">' + x.c.doc + '</td><td class="r num">' + x.mes.length + '</td><td class="r num">' + U.soles(x.gasto) + '</td><td>' + (x.ultimo ? U.cuando(x.ultimo) : '—') + '</td></tr>').join('') + '</tbody></table></div>';
      lista.querySelectorAll('tr[data-id]').forEach(tr => { tr.onclick = () => detalleCliente(tr.dataset.id); tr.onkeydown = e => { if (e.key === 'Enter') detalleCliente(tr.dataset.id); }; });
    }
    const inp = el.querySelector('[data-buscar]');
    let t;
    inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { q = inp.value; pintar(); }, 150); };
    pintar();
  }

  LF.productos = { detalle: detalleProducto, margen };
  LF.vistas.productos = { titulo: 'Productos y precios', menu: 'Productos', icono: 'pill', modulo: 'productos', render: renderProductos };
  LF.vistas.clientes = { titulo: 'Clientes', icono: 'users', modulo: 'clientes', render: renderClientes };
})();
