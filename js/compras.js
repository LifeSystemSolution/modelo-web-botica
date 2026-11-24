/* Compras con lote y vencimiento · Pedido sugerido (reposición) · Libro de recetas */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const db = () => LF.store.db;
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const provN = id => LF.store.proveedor(id).nombre.replace(' (ficticia)', '');

  /* ===== Registrar compra ===== */
  function nuevaCompra(pre) {
    const D = db();
    const filas = (pre && pre.items) || [{ pid: '', cajas: 1, costo: '', codigo: '', vence: '' }];
    const en = n => M.diaISO(Date.now() + n * 864e5);
    const pn = U.panel('<div class="panel-h"><h2>Registrar compra</h2><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c"><div class="campos"><label class="campo">Proveedor<select data-prov>' + D.proveedores.map(p => '<option value="' + p.id + '"' + (pre && pre.prov === p.id ? ' selected' : '') + '>' + esc(provN(p.id)) + '</option>').join('') + '</select></label><label class="campo">N.º de factura<input data-fac placeholder="F001-1234"></label></div>' +
      '<div id="filas" class="filas-c"></div><button class="btn btn-line btn-sm" data-add>' + icon('plus') + 'Otro producto</button>' +
      '<p class="muted">Cada fila crea un lote nuevo. El sistema venderá primero el que vence antes.</p><div class="res-total"><span>Total de la compra</span><b class="num" data-tot>S/ 0.00</b></div></div>' +
      '<div class="panel-f"><button class="btn btn-primary btn-lg" data-ok>' + icon('check') + 'Guardar compra y subir stock</button></div>');
    const cont = pn.querySelector('#filas');
    function pintar() {
      cont.innerHTML = filas.map((f, i) => {
        const p = f.pid ? LF.store.producto(f.pid) : null;
        return '<div class="fila-c"><label class="campo">Producto<select data-k="pid" data-i="' + i + '"><option value="">Elige el producto</option>' + D.productos.map(x => '<option value="' + x.id + '"' + (x.id === f.pid ? ' selected' : '') + '>' + esc(x.nombre) + '</option>').join('') + '</select></label>' +
          '<label class="campo">' + (p ? esc(M.presPlural(p.pres[0].tipo, 2).replace(/^./, c => c.toUpperCase())) : 'Cajas') + '<input type="number" min="1" step="1" data-k="cajas" data-i="' + i + '" value="' + f.cajas + '"></label>' +
          '<label class="campo">Costo c/u (S/)<input type="number" min="0" step="0.01" data-k="costo" data-i="' + i + '" value="' + f.costo + '"></label>' +
          '<label class="campo">Lote<input data-k="codigo" data-i="' + i + '" value="' + esc(f.codigo) + '" placeholder="Del envase"></label>' +
          '<label class="campo">Vence<input type="date" min="' + en(1) + '" data-k="vence" data-i="' + i + '" value="' + f.vence + '"></label>' +
          (filas.length > 1 ? '<button class="btn btn-ghost btn-icon btn-sm" data-del="' + i + '" aria-label="Quitar fila">' + icon('x') + '</button>' : '') +
          (f.vence && M.diasHasta(f.vence) < 180 ? '<p class="aviso-f">' + icon('alert') + 'Vence en ' + M.diasHasta(f.vence) + ' días. Conviene pedir uno con vencimiento más largo.</p>' : '') + '</div>';
      }).join('');
      cont.querySelectorAll('[data-k]').forEach(inp => inp.onchange = () => {
        const f = filas[inp.dataset.i];
        f[inp.dataset.k] = inp.value;
        if (inp.dataset.k === 'pid' && inp.value) { const p = LF.store.producto(inp.value); f.costo = p.provs[pn.querySelector('[data-prov]').value] || M.r2(p.costoU * p.pres[0].unidades); }
        pintar();
      });
      cont.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { filas.splice(b.dataset.del, 1); pintar(); });
      pn.querySelector('[data-tot]').textContent = U.soles(filas.reduce((s, f) => s + (Number(f.cajas) || 0) * (Number(f.costo) || 0), 0));
    }
    pn.querySelector('[data-add]').onclick = () => { filas.push({ pid: '', cajas: 1, costo: '', codigo: '', vence: '' }); pintar(); };
    pn.querySelector('[data-ok]').onclick = () => {
      const fac = pn.querySelector('[data-fac]').value.trim();
      const prov = pn.querySelector('[data-prov]').value;
      const err = [];
      if (!fac) err.push('el número de factura');
      filas.forEach((f, i) => { if (!f.pid || !(Number(f.cajas) > 0) || !(Number(f.costo) > 0) || !f.codigo || !f.vence) err.push('todos los datos de la fila ' + (i + 1)); });
      if (err.length) { U.toast('Completa ' + err.join(', ') + '.', 'error'); return; }
      const c = { id: 'CP' + LF.store.nextId('compra'), t: Date.now(), prov, factura: fac, items: [], total: 0, por: LF.sesion.personaId };
      filas.forEach(f => {
        const p = LF.store.producto(f.pid);
        const u = Number(f.cajas) * p.pres[0].unidades;
        const costoU = M.r2(Number(f.costo) / p.pres[0].unidades);
        const l = { id: 'L' + LF.store.nextId('lote'), pid: p.id, codigo: f.codigo.toUpperCase(), cant: u, vence: f.vence, costoU, prov, ingreso: c.t, compra: c.id };
        D.lotes.push(l);
        // Costo promedio ponderado del producto
        const st = LF.store.stockTotal(p.id) - u;
        p.costoU = M.r2((st * p.costoU + u * costoU) / (st + u));
        c.items.push({ pid: p.id, lote: l.id, codigo: l.codigo, vence: l.vence, unidades: u, costo: M.r2(Number(f.cajas) * Number(f.costo)), cajas: Number(f.cajas) });
      });
      c.total = M.r2(c.items.reduce((s, x) => s + x.costo, 0));
      D.compras.push(c);
      LF.store.log('Registró compra', fac + ' · ' + provN(prov) + ' · ' + U.soles(c.total));
      LF.store.save();
      U.cerrarPanel();
      U.toast('Compra guardada: ' + U.plural(c.items.length, 'lote nuevo', 'lotes nuevos') + ', stock actualizado');
      LF.refrescar();
    };
    pintar();
  }

  function renderCompras(el) {
    const D = db();
    const rows = D.compras.slice().sort((a, b) => b.t - a.t);
    const mes = rows.filter(c => c.t > Date.now() - 30 * 864e5);
    el.innerHTML = '<div class="barra-f"><span class="muted grow">' + U.plural(mes.length, 'compra') + ' en 30 días por ' + U.soles(mes.reduce((s, c) => s + c.total, 0), 0) + '</span>' + (LF.store.puede('compras') ? '<button class="btn btn-primary" data-nueva>' + icon('plus') + 'Registrar compra</button>' : '') + '</div>' +
      (rows.length ? '<div class="tabla-wrap"><table class="tabla tabla-cli"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Factura</th><th>Productos</th><th class="r">Total</th></tr></thead><tbody>' +
        rows.map(c => '<tr data-id="' + c.id + '" tabindex="0"><td>' + U.fechaDia(c.t) + '</td><td>' + esc(provN(c.prov)) + '</td><td class="num">' + esc(c.factura) + '</td><td>' + esc(c.items.map(it => LF.store.producto(it.pid).nombre).join(', ')) + '</td><td class="r num">' + U.soles(c.total) + '</td></tr>').join('') + '</tbody></table></div>'
        : U.vacio('box', 'Aún no hay compras', 'Registra la factura del proveedor para crear los lotes.'));
    const b = el.querySelector('[data-nueva]');
    if (b) b.onclick = () => nuevaCompra();
    el.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => {
      const c = D.compras.find(x => x.id === tr.dataset.id);
      U.panel('<div class="panel-h"><div style="flex:1;min-width:0"><span class="sub">' + esc(provN(c.prov)) + ' · ' + U.fechaLarga(c.t) + '</span><h2>Factura ' + esc(c.factura) + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div><div class="panel-c"><ul class="desglose">' +
        c.items.map(it => { const p = LF.store.producto(it.pid); return '<li><span>' + esc(p.nombre) + '<small>' + it.unidades + ' u · lote ' + esc(it.codigo) + ' · vence ' + LF.inventario.fechaV(it.vence) + '</small></span><b class="num">' + U.soles(it.costo) + '</b></li>'; }).join('') + '</ul><div class="res-total"><span>Total</span><b class="num">' + U.soles(c.total) + '</b></div></div>');
    });
  }

  /* ===== Pedido sugerido ===== */
  function renderReposicion(el) {
    const D = db();
    const rows = D.productos.map(p => ({ p, st: LF.store.stock(p.id), rp: LF.store.reposicion(p) })).filter(x => x.rp.pedir).sort((a, b) => a.rp.dias - b.rp.dias);
    const porProv = {};
    rows.forEach(x => (porProv[x.rp.prov] = porProv[x.rp.prov] || []).push(x));
    const total = rows.reduce((s, x) => s + x.rp.total, 0), ahorro = rows.reduce((s, x) => s + x.rp.ahorro, 0);
    el.innerHTML = '<div class="kpis"><div class="kpi kpi-mal"><span>Productos por pedir</span><b class="num">' + rows.length + '</b><small>llegaron a su punto de pedido</small></div><div class="kpi"><span>Costo del pedido</span><b class="num">' + U.soles(total, 0) + '</b><small>en ' + U.plural(Object.keys(porProv).length, 'droguería') + '</small></div>' +
      '<div class="kpi"><span>Ahorro por elegir proveedor</span><b class="num">' + U.soles(ahorro) + '</b><small>frente a la droguería más cara</small></div><div class="kpi"><span>Cobertura</span><b class="num">' + D.ajustes.cobertura + ' días</b><small>se cambia en Ajustes</small></div></div>' +
      '<p class="formula sec-s">Pedir = venta diaria × (días de entrega + ' + D.ajustes.cobertura + ' días de cobertura) + 3 días de seguridad − stock vendible, redondeado a cajas. Se pide cuando el stock baja del punto de pedido (venta diaria × días de entrega + seguridad).</p>' +
      (rows.length ? Object.entries(porProv).map(([prov, xs]) => '<section class="sec caja caja-p"><div class="sec-h"><h2>' + esc(provN(prov)) + '</h2><p>' + U.plural(xs.length, 'producto') + ' · ' + U.soles(xs.reduce((s, x) => s + x.rp.total, 0)) + '</p></div><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Producto</th><th class="r">Vendible</th><th class="r">Alcanza</th><th class="r">Se vende</th><th class="r">Pedir</th><th class="r">Costo</th></tr></thead><tbody>' +
        xs.map(x => '<tr><td><b>' + esc(x.p.nombre) + '</b></td><td class="r">' + LF.venta.stockTxt(x.p, x.st) + '</td><td class="r num">' + U.plural(x.rp.dias, 'día') + '</td><td class="r num">' + (x.p.vd >= 10 ? Math.round(x.p.vd) : x.p.vd.toFixed(1)) + ' u/día</td><td class="r"><b class="num">' + x.rp.cajas + '</b> ' + esc(M.presPlural(x.p.pres[0].tipo, x.rp.cajas)) + '</td><td class="r num">' + U.soles(x.rp.total) + '</td></tr>').join('') + '</tbody></table></div>' +
        '<div class="fila"><button class="btn btn-dark" data-pedir="' + prov + '">' + icon('whatsapp') + 'Enviar pedido (simulado)</button>' + (LF.tieneModulo('compras') ? '<button class="btn btn-line" data-recibir="' + prov + '">Ya llegó: registrar compra</button>' : '') + '</div></section>').join('')
        : U.vacio('check', 'No hace falta pedir nada hoy', 'Todos los productos tienen stock por encima de su punto de pedido.'));
    el.querySelectorAll('[data-pedir]').forEach(b => b.onclick = () => {
      const xs = porProv[b.dataset.pedir];
      const txt = 'Pedido de ' + db().empresa.nombre + ':\n' + xs.map(x => '- ' + x.rp.cajas + ' ' + M.presPlural(x.p.pres[0].tipo, x.rp.cajas) + ' de ' + x.p.nombre).join('\n');
      U.modal('Pedido a ' + provN(b.dataset.pedir), '<div class="wa-burbuja">' + esc(txt).replace(/\n/g, '<br>') + '</div><p class="muted">En el demo no se envía: el número del proveedor es ficticio.</p>', [['ok', 'Listo', 'btn-dark']]);
      LF.store.log('Preparó pedido', provN(b.dataset.pedir) + ' · ' + U.plural(xs.length, 'producto'));
      LF.store.save();
    });
    el.querySelectorAll('[data-recibir]').forEach(b => b.onclick = () => {
      const xs = porProv[b.dataset.recibir];
      nuevaCompra({ prov: b.dataset.recibir, items: xs.map((x, i) => ({ pid: x.p.id, cajas: x.rp.cajas, costo: x.rp.costo, codigo: x.p.nombre.slice(0, 2).toUpperCase() + '27' + (10 + i), vence: M.diaISO(Date.now() + (540 + i * 30) * 864e5) })) });
    });
  }

  /* ===== Libro de recetas ===== */
  function renderRecetas(el) {
    let q = '';
    el.innerHTML = '<div class="barra-f"><label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="Paciente, médico, CMP o producto" aria-label="Buscar recetas"><kbd>/</kbd></label><button class="btn btn-line" data-csv>' + icon('download') + 'Exportar a Excel</button></div><p class="muted ayuda">Se registra solo cuando se vende un producto con receta. Datos ficticios.</p><div id="lista"></div>';
    const lista = el.querySelector('#lista');
    const rows = () => db().recetas.slice().sort((a, b) => b.t - a.t).filter(r => !q || norm(r.paciente + ' ' + r.medico + ' ' + r.cmp + ' ' + LF.store.producto(r.pid).nombre).includes(norm(q)));
    function pintar() {
      const R = rows();
      if (!R.length) { lista.innerHTML = U.vacio('note', 'No hay recetas con "' + q + '"', ''); return; }
      lista.innerHTML = '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Producto</th><th class="r">Cant.</th><th>Paciente</th><th>Médico</th><th>CMP</th><th>Receta</th></tr></thead><tbody>' +
        R.slice(0, 120).map(r => '<tr><td class="num">' + U.fechaDia(r.t) + ' ' + U.hora(r.t) + '</td><td>' + esc(LF.store.producto(r.pid).nombre) + '</td><td class="r num">' + r.cant + '</td><td>' + esc(r.paciente) + '</td><td>' + esc(r.medico) + '</td><td class="num">' + esc(r.cmp) + '</td><td class="num">' + esc(r.nro) + '</td></tr>').join('') + '</tbody></table></div>' + (R.length > 120 ? '<p class="muted">Mostrando 120 de ' + R.length + '. Exporta a Excel para verlas todas.</p>' : '');
    }
    el.querySelector('[data-csv]').onclick = () => { const R = rows(); U.csv('libro-de-recetas', [['Fecha', 'Producto', 'Cantidad', 'Paciente', 'Médico', 'CMP', 'N.º receta']].concat(R.map(r => [new Date(r.t).toLocaleString('es-PE'), LF.store.producto(r.pid).nombre, r.cant, r.paciente, r.medico, r.cmp, r.nro]))); U.toast('Descargaste ' + U.plural(R.length, 'receta') + ' en Excel (CSV)'); };
    const inp = el.querySelector('[data-buscar]');
    let t;
    inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { q = inp.value; pintar(); }, 150); };
    pintar();
  }

  LF.compras = { nuevaCompra };
  LF.vistas.compras = { titulo: 'Compras', icono: 'truck', modulo: 'compras', render: renderCompras };
  LF.vistas.reposicion = { titulo: 'Pedido sugerido', menu: 'Qué pedir', corto: 'Pedir', icono: 'refresh', modulo: 'reposicion', badge: () => db().productos.filter(p => LF.store.reposicion(p).pedir).length, render: renderReposicion };
  LF.vistas.recetas = { titulo: 'Libro de recetas', menu: 'Recetas', icono: 'note', modulo: 'recetas', render: renderRecetas };
})();
