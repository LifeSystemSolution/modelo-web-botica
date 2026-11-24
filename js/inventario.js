/* Inventario: stock por lotes, kardex y ajustes · Vencimientos: riesgo de pérdida por lote */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const db = () => LF.store.db;
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const DIA = 864e5;
  const fechaV = iso => U.fecha(new Date(iso + 'T12:00')) + ' ' + iso.slice(0, 4);

  /* ===== Kardex: movimientos de 30 días con saldo ===== */
  function kardex(pid) {
    const D = db();
    const mov = [];
    D.compras.forEach(c => c.items.filter(it => it.pid === pid).forEach(it => mov.push({ t: c.t, tipo: 'Compra', det: c.factura + ' · ' + LF.store.proveedor(c.prov).nombre.replace(' (ficticia)', '') + ' · lote ' + it.codigo, cant: it.unidades })));
    const porDia = {};
    D.ventas.filter(v => !v.esCanje).forEach(v => v.items.filter(it => it.pid === pid).forEach(it => { const k = M.diaISO(v.t); porDia[k] = porDia[k] || { t: U.inicioDia(v.t) + 22 * 36e5, n: 0, u: 0 }; porDia[k].n++; porDia[k].u += it.cant * it.u; if (v.anulada) mov.push({ t: v.anulada.t, tipo: 'Devolución', det: 'Anulación ' + v.serie + '-' + v.num, cant: it.cant * it.u }); }));
    Object.values(porDia).forEach(d => mov.push({ t: Math.min(d.t, Date.now()), tipo: 'Ventas', det: U.plural(d.n, 'venta') + ' del día', cant: -d.u }));
    D.ajustesStock.filter(a => a.pid === pid).forEach(a => mov.push({ t: a.t, tipo: a.tipo, det: a.motivo + ' · lote ' + a.codigo, cant: a.cant }));
    mov.sort((a, b) => b.t - a.t);
    let saldo = LF.store.stockTotal(pid);
    mov.forEach(m => { m.saldo = saldo; saldo -= m.cant; });
    return { mov, inicial: saldo };
  }

  async function ajustar(pid) {
    const p = LF.store.producto(pid);
    const lotes = LF.store.lotesDe(pid).filter(l => l.cant > 0);
    const r = await U.modal('Ajustar stock de ' + p.nombre, '<p>Úsalo después de contar físicamente. Queda registrado en el kardex con tu nombre.</p><label class="campo">Lote<select name="lote">' + lotes.map(l => '<option value="' + l.id + '">' + esc(l.codigo) + ' · ' + l.cant + ' u · vence ' + fechaV(l.vence) + '</option>').join('') + '</select></label><label class="campo">Cantidad contada (unidades)<input name="cant" type="number" min="0" step="1" required></label><label class="campo">Motivo<select name="motivo"><option>Conteo físico</option><option>Producto dañado</option><option>Producto vencido</option><option>Pérdida o robo</option></select></label>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Guardar ajuste', 'btn-dark']]);
    if (r.v !== 'ok') return;
    const l = lotes.find(x => x.id === r.data.get('lote'));
    const n = Number(r.data.get('cant'));
    if (!l || !Number.isInteger(n) || n < 0) { U.toast('Escribe la cantidad contada en unidades enteras.', 'error'); return; }
    if (n === l.cant) { U.toast('La cantidad contada es igual al sistema. No hay nada que ajustar.', 'info'); return; }
    const dif = n - l.cant;
    db().ajustesStock.push({ t: Date.now(), pid, lote: l.id, codigo: l.codigo, cant: dif, tipo: 'Ajuste', motivo: r.data.get('motivo'), por: LF.sesion.personaId });
    l.cant = n;
    LF.store.log('Ajustó stock', p.nombre + ' · lote ' + l.codigo + ': ' + (dif > 0 ? '+' : '') + dif + ' u (' + r.data.get('motivo') + ')');
    LF.store.save();
    U.toast('Stock ajustado: ' + (dif > 0 ? '+' : '') + dif + ' unidades');
    LF.refrescar();
    detalle(pid);
  }

  function detalle(pid) {
    const p = LF.store.producto(pid);
    const K = kardex(pid);
    const lotes = LF.store.lotesDe(pid).filter(l => l.cant > 0).sort((a, b) => a.vence.localeCompare(b.vence));
    const html = '<div class="panel-h">' + LF.illus(p.ill, 44) + '<div style="flex:1;min-width:0"><span class="sub">' + esc(p.forma) + '</span><h2>' + esc(p.nombre) + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c"><div class="dato-grid"><div class="dato"><span>Stock total</span><b>' + LF.venta.stockTxt(p, LF.store.stockTotal(pid)) + '</b></div><div class="dato"><span>Vendible</span><b>' + LF.venta.stockTxt(p, LF.store.stock(pid)) + '</b><small>Sin lotes por retirar</small></div></div>' +
      '<section class="bloque"><h3>Lotes</h3><ul class="desglose">' + lotes.map((l, i) => '<li><span>' + (i === 0 ? '<b class="tag">Sale primero</b> ' : '') + 'Lote ' + esc(l.codigo) + ' · ' + l.cant + ' u<small>Vence ' + fechaV(l.vence) + ' · ' + esc(LF.store.proveedor(l.prov).nombre.replace(' (ficticia)', '')) + '</small></span>' + U.riesgo(LF.store.riesgoLote(l)) + '</li>').join('') + '</ul></section>' +
      '<section class="bloque"><h3>Kardex de 30 días</h3><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Movimiento</th><th class="r">Cant.</th><th class="r">Saldo</th></tr></thead><tbody>' +
      K.mov.slice(0, 40).map(m => '<tr><td class="num">' + U.fechaDia(m.t) + '</td><td><b>' + esc(m.tipo) + '</b><br><small class="muted">' + esc(m.det) + '</small></td><td class="r num' + (m.cant < 0 ? ' neg' : '') + '">' + (m.cant > 0 ? '+' : '') + m.cant + '</td><td class="r num">' + m.saldo + '</td></tr>').join('') +
      '<tr><td colspan="3"><b>Saldo hace 30 días</b></td><td class="r num">' + K.inicial + '</td></tr></tbody></table></div></section></div>' +
      (LF.store.puede('inventario') ? '<div class="panel-f"><button class="btn btn-dark" data-ajustar>' + icon('settings') + 'Ajustar stock</button></div>' : '');
    const pn = U.panel(html);
    const a = pn.querySelector('[data-ajustar]');
    if (a) a.onclick = () => ajustar(pid);
  }

  function renderInventario(el, params) {
    let q = '', filtro = params.get('f') || 'todos';
    el.innerHTML = '<div class="barra-f"><label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="Producto o código" aria-label="Buscar en inventario"><kbd>/</kbd></label><div class="chips">' + [['todos', 'Todos'], ['bajo', 'Stock bajo'], ['agotado', 'Agotados']].map(f => '<button class="chip' + (f[0] === filtro ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '<span class="num" data-n="' + f[0] + '"></span></button>').join('') + '</div></div><div id="lista"></div>';
    const lista = el.querySelector('#lista');
    function pintar() {
      const qq = norm(q);
      const base = db().productos.map(p => { const st = LF.store.stock(p.id); return { p, st, dias: p.vd ? Math.floor(st / p.vd) : 999, lotes: LF.store.lotesDe(p.id).filter(l => l.cant > 0).length, valor: LF.store.lotesDe(p.id).reduce((s, l) => s + l.cant * l.costoU, 0) }; });
      const g = { todos: base, bajo: base.filter(x => x.st > 0 && x.st < x.p.min), agotado: base.filter(x => x.st <= 0) };
      el.querySelectorAll('[data-n]').forEach(s => { s.textContent = g[s.dataset.n].length; });
      const rows = g[filtro].filter(x => !qq || norm(x.p.nombre + ' ' + x.p.codigo).includes(qq)).sort((a, b) => a.dias - b.dias);
      const valor = base.reduce((s, x) => s + x.valor, 0);
      if (!rows.length) { lista.innerHTML = U.vacio('box', 'Nada en este filtro', filtro === 'agotado' ? 'No hay productos agotados.' : 'Prueba con otro filtro.'); return; }
      lista.innerHTML = '<p class="muted ayuda">Valor del inventario al costo: <b class="num">' + U.soles(valor, 0) + '</b>. Ordenado por días que alcanza el stock.</p><div class="tabla-wrap"><table class="tabla tabla-cli"><thead><tr><th>Producto</th><th class="r">Vendible</th><th class="r">Alcanza</th><th class="r">Lotes</th><th>Estado</th></tr></thead><tbody>' +
        rows.map(x => '<tr data-id="' + x.p.id + '" tabindex="0"><td><b>' + esc(x.p.nombre) + '</b><br><small class="muted">' + esc(x.p.forma) + '</small></td><td class="r">' + LF.venta.stockTxt(x.p, x.st) + '</td><td class="r num">' + (x.dias >= 999 ? '—' : U.plural(x.dias, 'día')) + '</td><td class="r num">' + x.lotes + '</td><td>' + (x.st <= 0 ? '<span class="tag tag-red">' + icon('alert') + 'Agotado</span>' : x.st < x.p.min ? '<span class="tag tag-warn">' + icon('alert') + 'Stock bajo</span>' : '<span class="tag tag-ok">' + icon('check') + 'Normal</span>') + '</td></tr>').join('') + '</tbody></table></div>';
      lista.querySelectorAll('tr[data-id]').forEach(tr => { tr.onclick = () => detalle(tr.dataset.id); tr.onkeydown = e => { if (e.key === 'Enter') detalle(tr.dataset.id); }; });
    }
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtro = b.dataset.f; el.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
    const inp = el.querySelector('[data-buscar]');
    let t;
    inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { q = inp.value; pintar(); }, 150); };
    pintar();
    if (params.get('id')) detalle(params.get('id'));
  }

  /* ===== Vencimientos ===== */
  function lotesConRiesgo() {
    return db().lotes.filter(l => l.cant > 0).map(l => ({ l, p: LF.store.producto(l.pid), r: LF.store.riesgoLote(l) }));
  }

  function detalleLote(id) {
    const l = db().lotes.find(x => x.id === id);
    const p = LF.store.producto(l.pid);
    const r = LF.store.riesgoLote(l);
    const prov = LF.store.proveedor(l.prov);
    const html = '<div class="panel-h">' + LF.illus(p.ill, 44) + '<div style="flex:1;min-width:0"><span class="sub">Lote ' + esc(l.codigo) + ' · ' + l.cant + ' u · vence ' + fechaV(l.vence) + '</span><h2>' + esc(p.nombre) + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c"><section class="bloque"><h3>Riesgo de pérdida</h3>' + U.medidor(r) + '</section>' +
      '<p class="accion">' + icon('bolt') + '<span><b>Qué hacer:</b> ' + esc(r.accion) + (r.soles ? '. Si no se hace nada, se pierden unos <b class="num">' + U.soles(r.soles) + '</b> al costo.' : '.') + '</span></p>' +
      '<section class="bloque formula-b"><h3>Cómo se calcula</h3><p class="formula">Días útiles = ' + r.dias + ' días para vencer − ' + db().ajustes.retiro + ' días de retiro = ' + Math.max(0, r.util) + ' · Se alcanza a vender ≈ ' + (p.vd >= 10 ? Math.round(p.vd) : p.vd.toFixed(1)) + ' u/día × ' + Math.max(0, r.util) + ' días − lo que sale antes de otros lotes · Excedente = ' + r.excedente + ' u × S/ ' + l.costoU.toFixed(2) + ' = ' + U.soles(r.soles) + '</p></section>' +
      '<div class="dato-grid"><div class="dato"><span>Proveedor</span><b>' + esc(prov.nombre) + '</b></div><div class="dato"><span>Ingresó</span><b>' + U.fechaDia(l.ingreso) + '</b></div></div>' +
      (l.promo ? '<p class="alerta">' + icon('check') + '<span>En promoción desde ' + U.cuando(l.promo) + '.</span></p>' : '') + (l.canje ? '<p class="alerta">' + icon('check') + '<span>Canje solicitado a ' + esc(prov.nombre) + ' ' + U.cuando(l.canje) + '.</span></p>' : '') + '</div>' +
      (LF.store.puede('inventario') ? '<div class="panel-f">' + (r.util > 0 && !l.promo ? '<button class="btn btn-dark" data-promo>Vender primero (promoción)</button>' : '') + (!l.canje ? '<button class="btn btn-line" data-canje>' + icon('swap') + 'Pedir canje</button>' : '') + (r.util <= 0 ? '<button class="btn btn-primary" data-baja>' + icon('x') + 'Retirar y dar de baja</button>' : '') + '</div>' : '');
    const pn = U.panel(html);
    const on = (sel, fn) => { const b = pn.querySelector(sel); if (b) b.onclick = fn; };
    on('[data-promo]', () => { l.promo = Date.now(); LF.store.log('Puso en promoción', p.nombre + ' · lote ' + l.codigo); LF.store.save(); U.toast(p.nombre + ': la caja verá este lote como "vender primero"'); LF.refrescar(); detalleLote(id); });
    on('[data-canje]', () => {
      l.canje = Date.now();
      LF.store.log('Pidió canje', p.nombre + ' · lote ' + l.codigo + ' · ' + prov.nombre);
      LF.store.save();
      U.imprimir('<div class="guia"><header class="g-h"><div><h1>Solicitud de canje por vencimiento</h1><p>' + esc(db().empresa.razon) + ' · RUC ' + db().empresa.ruc + ' (ficticio)</p><p>Para: ' + esc(prov.nombre) + ' · ' + U.fechaLarga(Date.now()) + '</p></div></header><table><tr><td><b>Producto</b></td><td><b>Lote</b></td><td><b>Vence</b></td><td><b>Unidades</b></td></tr><tr><td>' + esc(p.nombre) + ' · ' + esc(p.forma) + '</td><td>' + esc(l.codigo) + '</td><td>' + fechaV(l.vence) + '</td><td>' + l.cant + '</td></tr></table><p>Solicitamos el canje de las unidades indicadas por productos con vencimiento mayor a 12 meses.</p><div class="g-firmas"><div>' + esc(db().empresa.qf) + '</div><div>Recibido por el proveedor</div></div></div>');
      U.toast('Solicitud de canje lista para imprimir');
      LF.refrescar(); detalleLote(id);
    });
    on('[data-baja]', async () => {
      const ok = await U.modal('Retirar lote ' + l.codigo, '<p>Se sacan <b>' + l.cant + ' unidades</b> del stock como merma (' + U.soles(l.cant * l.costoU) + ' al costo). Guarda el producto separado para su destrucción o canje.</p>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Retirar', 'btn-primary']]);
      if (ok.v !== 'ok') return;
      db().ajustesStock.push({ t: Date.now(), pid: p.id, lote: l.id, codigo: l.codigo, cant: -l.cant, tipo: 'Merma', motivo: 'Retiro por vencimiento', por: LF.sesion.personaId });
      LF.store.log('Retiró por vencimiento', p.nombre + ' · lote ' + l.codigo + ' · ' + l.cant + ' u');
      l.cant = 0;
      LF.store.save();
      U.cerrarPanel();
      U.toast('Lote retirado del stock y registrado como merma');
      LF.refrescar();
    });
  }

  function renderVenc(el, params) {
    let filtro = params.get('f') || 'riesgo';
    el.innerHTML = '<div id="kp"></div><div class="barra-f"><div class="chips">' + [['riesgo', 'En riesgo'], ['retirar', 'Por retirar'], ['180', 'Vencen en 6 meses'], ['todos', 'Todos los lotes']].map(f => '<button class="chip' + (f[0] === filtro ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '<span class="num" data-n="' + f[0] + '"></span></button>').join('') + '</div></div><div id="lista"></div>';
    function pintar() {
      const all = lotesConRiesgo();
      const g = { riesgo: all.filter(x => x.r.nivel !== 'bajo'), retirar: all.filter(x => x.r.util <= 0), 180: all.filter(x => x.r.dias <= 180), todos: all };
      el.querySelectorAll('[data-n]').forEach(s => { s.textContent = g[s.dataset.n].length; });
      const enRiesgo = g.riesgo.reduce((s, x) => s + x.r.soles, 0);
      el.querySelector('#kp').innerHTML = '<div class="kpis"><div class="kpi kpi-mal"><span>Dinero en riesgo</span><b class="num">' + U.soles(enRiesgo, 0) + '</b><small>al costo, si no se hace nada</small></div>' +
        '<div class="kpi"><span>Lotes en riesgo alto</span><b class="num">' + all.filter(x => x.r.nivel === 'alto').length + '</b><small>' + U.plural(g.riesgo.length, 'lote') + ' en riesgo medio o alto</small></div>' +
        '<div class="kpi"><span>Por retirar</span><b class="num">' + g.retirar.length + '</b><small>a menos de ' + db().ajustes.retiro + ' días de vencer</small></div>' +
        '<div class="kpi"><span>Vencen en 6 meses</span><b class="num">' + g[180].length + '</b><small>de ' + U.plural(all.length, 'lote') + ' con stock</small></div></div>';
      const rows = g[filtro].sort((a, b) => b.r.puntaje - a.r.puntaje || a.l.vence.localeCompare(b.l.vence));
      const lista = el.querySelector('#lista');
      if (!rows.length) { lista.innerHTML = U.vacio('check', 'Ningún lote en este filtro', 'Todo se vende antes de vencer.'); return; }
      lista.innerHTML = '<div class="lotes">' + rows.slice(0, 80).map(x => '<button class="lote" data-id="' + x.l.id + '">' + LF.illus(x.p.ill, 36) + '<span class="lote-p"><b>' + esc(x.p.nombre) + '</b><small>Lote ' + esc(x.l.codigo) + ' · ' + x.l.cant + ' u · vence ' + fechaV(x.l.vence) + '</small></span>' +
        '<span class="lote-e"><b class="num">' + (x.r.excedente ? x.r.excedente + ' u' : '—') + '</b><small>' + (x.r.soles ? U.soles(x.r.soles) + ' en riesgo' : 'se vende a tiempo') + '</small></span>' +
        '<span class="lote-a">' + esc(x.r.accion) + (x.l.promo ? ' <span class="tag tag-ok">En promoción</span>' : '') + (x.l.canje ? ' <span class="tag">Canje pedido</span>' : '') + '</span>' + U.riesgo(x.r, true) + '</button>').join('') + '</div>';
      lista.querySelectorAll('[data-id]').forEach(b => b.onclick = () => detalleLote(b.dataset.id));
    }
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtro = b.dataset.f; el.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
    pintar();
    const id = params.get('id');
    if (id) { const x = id === 'primero' ? lotesConRiesgo().sort((a, b) => b.r.puntaje - a.r.puntaje)[0] : { l: db().lotes.find(l => l.id === id) }; if (x && x.l) detalleLote(x.l.id); }
  }

  LF.inventario = { kardex, detalle, lotesConRiesgo, detalleLote, fechaV };
  LF.vistas.inventario = { titulo: 'Stock y lotes', menu: 'Stock', icono: 'box', modulo: 'inventario', badge: () => db().productos.filter(p => LF.store.stock(p.id) < p.min).length, render: renderInventario };
  LF.vistas.vencimientos = { titulo: 'Riesgo por vencimiento', menu: 'Vencimientos', corto: 'Vencen', icono: 'clock', modulo: 'vencimientos', badge: () => lotesConRiesgo().filter(x => x.r.nivel === 'alto').length, render: renderVenc };
})();
