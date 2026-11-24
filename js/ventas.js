/* Ventas: listado, detalle, anulación con nota de crédito (PIN de la dueña) y canje de nota de venta */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const db = () => LF.store.db;
  const DIA = 864e5;

  const docTxt = v => v.serie + '-' + v.num;
  const cliente = v => (v.cliente ? db().clientes.find(c => c.id === v.cliente) : null);

  async function pedirPin(motivo) {
    if (LF.sesion.rol === 'dueno') return true;
    const r = await U.modal('Autorización de la dueña', '<p>' + esc(motivo) + '</p><label class="campo">PIN de la dueña<input name="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" required></label><p class="muted">En el demo, el PIN de la dueña es 1234.</p>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Autorizar', 'btn-dark']]);
    if (r.v !== 'ok') return false;
    if (String(r.data.get('pin')) !== LF.store.persona('P3').pin) { U.toast('PIN incorrecto. No se hizo ningún cambio.', 'error'); return false; }
    return true;
  }

  function detalle(id) {
    const v = LF.store.venta(id);
    const cli = cliente(v);
    const T = M.igv(v.total);
    const html = '<div class="panel-h"><div style="flex:1;min-width:0"><span class="sub">' + U.fechaDia(v.t) + ' ' + U.hora(v.t) + ' · ' + esc(U.nombreCorto(LF.store.persona(v.por).nombre)) + '</span><h2>' + LF.venta.DOCS[v.serie] + ' ' + docTxt(v) + '</h2></div><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div>' +
      '<div class="panel-c">' + (v.anulada ? '<p class="alerta mal">' + icon('alert') + '<span>Anulada con nota de crédito <b>' + esc(v.anulada.nc) + '</b> · ' + esc(v.anulada.motivo) + ' · ' + U.cuando(v.anulada.t) + '</span></p>' : '') +
      (v.canje ? '<p class="alerta">' + icon('swap') + '<span>Canjeada por ' + esc(v.canje) + '</span></p>' : '') +
      '<div class="dato-grid"><div class="dato"><span>Cliente</span><b>' + (cli ? esc(cli.nombre) : 'Público general') + '</b>' + (cli ? '<small>' + (cli.tipo === 'empresa' ? 'RUC ' : 'DNI ') + cli.doc + '</small>' : '') + '</div><div class="dato"><span>Pago</span><b>' + esc(v.medio) + '</b>' + (v.paga ? '<small>Pagó ' + U.soles(v.paga) + ' · vuelto ' + U.soles(v.paga - v.total) + '</small>' : '') + '</div></div>' +
      '<section class="bloque"><h3>Productos</h3><ul class="desglose">' + v.items.map(it => { const p = LF.store.producto(it.pid); return '<li><span>' + it.cant + ' ' + esc(it.u > 1 ? it.pres + ' x ' + it.u : it.pres) + ' · ' + esc(p.nombre) + '<small>' + (it.lotes && it.lotes.length ? 'Lote ' + it.lotes.map(l => esc(l.codigo) + ' (' + l.cant + ' u)').join(', ') : 'Lote registrado en el kardex') + (it.receta ? ' · receta registrada' : '') + '</small></span><b class="num">' + U.soles(it.precio * it.cant) + '</b></li>'; }).join('') + '</ul></section>' +
      '<dl class="car-tot">' + (v.serie !== 'NV01' ? '<dt>Op. gravada</dt><dd class="num">' + U.soles(T.base) + '</dd><dt>IGV 18%</dt><dd class="num">' + U.soles(T.igv) + '</dd>' : '') + '<dt class="t">Total</dt><dd class="t num">' + U.soles(v.total) + '</dd></dl></div>' +
      '<div class="panel-f"><button class="btn btn-line" data-print>' + icon('print') + 'Reimprimir</button>' +
      (!v.anulada && v.serie === 'NV01' && !v.canje ? '<button class="btn btn-dark" data-canje>' + icon('swap') + 'Canjear por boleta o factura</button>' : '') +
      (!v.anulada && !v.canje ? '<button class="btn btn-line" data-anular>' + icon('x') + 'Anular</button>' : '') + '</div>';
    const p = U.panel(html);
    p.querySelector('[data-print]').onclick = () => LF.venta.imprimirTicket(v);
    const a = p.querySelector('[data-anular]');
    if (a) a.onclick = () => anular(v);
    const c = p.querySelector('[data-canje]');
    if (c) c.onclick = () => canjear(v);
  }

  async function anular(v) {
    const r = await U.modal('Anular ' + docTxt(v), '<p>Se emite una nota de crédito por ' + U.soles(v.total) + ' y los productos vuelven al stock en su mismo lote.</p><label class="campo">Motivo<select name="motivo"><option>El cliente devolvió el producto</option><option>Error en el producto</option><option>Error en el monto</option><option>Error en el tipo de comprobante</option></select></label>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Anular venta', 'btn-dark']]);
    if (r.v !== 'ok') return;
    if (!(await pedirPin('Anular una venta necesita la autorización de la dueña.'))) return;
    const D = db();
    const serieNC = v.serie === 'F001' ? 'FC01' : 'BC01';
    v.anulada = { t: Date.now(), motivo: r.data.get('motivo'), nc: v.serie === 'NV01' ? 'Nota de venta anulada' : serieNC + '-' + (++D.series[serieNC]), por: LF.sesion.personaId };
    v.items.forEach(it => (it.lotes || []).forEach(l => { const lt = D.lotes.find(x => x.id === l.lote); if (lt) lt.cant += l.cant; }));
    LF.store.log('Anuló venta', docTxt(v) + ' · ' + U.soles(v.total) + ' · ' + v.anulada.motivo + (LF.sesion.rol !== 'dueno' ? ' · autorizó ' + LF.store.persona('P3').nombre : ''));
    LF.store.save();
    U.toast(docTxt(v) + ' anulada. ' + (v.serie === 'NV01' ? '' : 'Nota de crédito ' + v.anulada.nc + '.'));
    LF.refrescar();
    detalle(v.id);
  }

  async function canjear(v) {
    const r = await U.modal('Canjear ' + docTxt(v), '<p>La nota de venta se reemplaza por un comprobante electrónico. Los productos y el pago no cambian.</p><div class="seg2" role="radiogroup"><label class="check"><input type="radio" name="doc" value="B001" checked> Boleta</label><label class="check"><input type="radio" name="doc" value="F001"> Factura</label></div><label class="campo">DNI o RUC<input name="docu" inputmode="numeric" maxlength="11"></label>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Emitir', 'btn-primary']]);
    if (r.v !== 'ok') return;
    const doc = r.data.get('doc'), nro = String(r.data.get('docu') || '').trim();
    if (doc === 'F001' && !/^\d{11}$/.test(nro)) { U.toast('La factura necesita un RUC de 11 dígitos.', 'error'); return; }
    if (nro && !/^(\d{8}|\d{11})$/.test(nro)) { U.toast('El DNI tiene 8 dígitos y el RUC 11.', 'error'); return; }
    const D = db();
    let c = nro ? D.clientes.find(x => x.doc === nro) : null;
    if (nro && !c) { c = { id: 'C' + (D.clientes.length + 1), tipo: nro.length === 11 ? 'empresa' : 'persona', nombre: nro.length === 11 ? 'Comercial Demo ' + nro.slice(-3) + ' S.A.C.' : 'Cliente ' + nro.slice(-4), doc: nro, tel: '' }; D.clientes.push(c); }
    const nueva = Object.assign({}, v, { id: 'V' + LF.store.nextId('venta'), serie: doc, num: ++D.series[doc], t: Date.now(), cliente: c ? c.id : v.cliente, canjeDe: docTxt(v), items: v.items.map(it => Object.assign({}, it, { lotes: [] })) });
    delete nueva.canje;
    v.canje = doc + '-' + nueva.num;
    // El stock ya salió con la nota de venta: el nuevo comprobante no vuelve a descontar
    nueva.esCanje = true;
    D.ventas.push(nueva);
    LF.store.log('Canjeó nota de venta', docTxt(v) + ' → ' + v.canje);
    LF.store.save();
    U.toast('Emitiste ' + LF.venta.DOCS[doc] + ' ' + v.canje);
    LF.refrescar();
    detalle(nueva.id);
  }

  /* Ventas que cuentan para totales: no anuladas y sin duplicar canjes */
  const cuentan = v => !v.anulada && !v.canje;
  LF.ventas = { cuentan, detalle, pedirPin };

  function render(el, params) {
    let rango = params.get('r') || 'hoy', q = '';
    el.innerHTML = '<div class="barra-f"><div class="chips">' + [['hoy', 'Hoy'], ['ayer', 'Ayer'], ['7', '7 días']].map(r => '<button class="chip' + (r[0] === rango ? ' on' : '') + '" data-r="' + r[0] + '">' + r[1] + '</button>').join('') + '</div>' +
      '<label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="Comprobante, cliente o producto" aria-label="Buscar ventas"><kbd>/</kbd></label></div><div id="res"></div>';
    const res = el.querySelector('#res');
    function pintar() {
      const h0 = U.inicioDia();
      const [a, b] = rango === 'hoy' ? [h0, h0 + DIA] : rango === 'ayer' ? [h0 - DIA, h0] : [h0 - 7 * DIA, h0 + DIA];
      const qq = q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      let rows = db().ventas.filter(v => v.t >= a && v.t < b);
      if (qq) rows = rows.filter(v => { const c = cliente(v); return (docTxt(v) + ' ' + (c ? c.nombre + ' ' + c.doc : '') + ' ' + v.items.map(it => LF.store.producto(it.pid).nombre).join(' ')).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(qq); });
      rows.sort((x, y) => y.t - x.t);
      const ok = rows.filter(cuentan);
      const total = ok.reduce((s, v) => s + v.total, 0);
      const porMedio = {};
      ok.forEach(v => { porMedio[v.medio] = (porMedio[v.medio] || 0) + v.total; });
      if (!rows.length) {
        res.innerHTML = U.vacio('receipt', rango === 'hoy' ? 'Hoy todavía no hay ventas' : 'No hay ventas en este rango', rango === 'hoy' ? 'El día empieza en cero. Registra una venta en la caja rápida.' : '', LF.puede('venta') ? '<a class="btn btn-primary" href="#/venta">' + icon('cart') + 'Ir a vender</a>' : '');
        return;
      }
      res.innerHTML = '<div class="kpis"><div class="kpi"><span>Vendido</span><b class="num">' + U.soles(total) + '</b><small>' + U.plural(ok.length, 'venta') + '</small></div>' +
        '<div class="kpi"><span>Ticket promedio</span><b class="num">' + U.soles(ok.length ? total / ok.length : 0) + '</b><small>por venta</small></div>' +
        '<div class="kpi"><span>Efectivo</span><b class="num">' + U.soles(porMedio.Efectivo || 0) + '</b><small>Yape ' + U.soles(porMedio.Yape || 0, 0) + ' · Plin ' + U.soles(porMedio.Plin || 0, 0) + '</small></div>' +
        '<div class="kpi"><span>Tarjeta</span><b class="num">' + U.soles(porMedio.Tarjeta || 0) + '</b><small>' + U.plural(rows.filter(v => v.anulada).length, 'anulada') + '</small></div></div>' +
        '<div class="tabla-wrap sec-s"><table class="tabla tabla-cli"><thead><tr><th>Hora</th><th>Comprobante</th><th>Cliente</th><th>Productos</th><th>Pago</th><th class="r">Total</th></tr></thead><tbody>' +
        rows.slice(0, 150).map(v => { const c = cliente(v); return '<tr data-id="' + v.id + '" tabindex="0"' + (v.anulada || v.canje ? ' class="tachada"' : '') + '><td class="num">' + (rango === '7' ? U.fechaDia(v.t) + ' ' : '') + U.hora(v.t) + '</td><td><b>' + docTxt(v) + '</b>' + (v.anulada ? ' <span class="tag tag-red">Anulada</span>' : v.canje ? ' <span class="tag">Canjeada</span>' : '') + '</td><td>' + (c ? esc(U.nombreCorto(c.nombre)) : '<span class="muted">Público general</span>') + '</td><td>' + esc(v.items.map(it => LF.store.producto(it.pid).nombre).join(', ')) + '</td><td>' + esc(v.medio) + '</td><td class="r num">' + U.soles(v.total) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      res.querySelectorAll('tr[data-id]').forEach(tr => { tr.onclick = () => detalle(tr.dataset.id); tr.onkeydown = e => { if (e.key === 'Enter') detalle(tr.dataset.id); }; });
    }
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rango = b.dataset.r; el.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
    const inp = el.querySelector('[data-buscar]');
    let t;
    inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { q = inp.value; pintar(); }, 150); };
    pintar();
    if (params.get('id')) detalle(params.get('id'));
  }

  LF.vistas.ventas = { titulo: 'Ventas', icono: 'receipt', modulo: 'comprobantes', render };
})();
