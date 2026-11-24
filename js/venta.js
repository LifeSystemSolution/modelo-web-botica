/* Caja rápida: venta por caja, blíster o unidad, comprobantes, receta obligatoria, vuelto y ticket */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const db = () => LF.store.db;
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const DOCS = { B001: 'Boleta', F001: 'Factura', NV01: 'Nota de venta' };
  const NOMBRES_RENIEC = ['Gladys Ticona Mamani', 'Óscar Salazar Vega', 'Roxana Cruz Espinoza', 'Julio Poma Huanca', 'Mercedes Ríos Castillo', 'Fernando Apaza Quispe'];

  /* Carrito persistente mientras se navega (no se guarda en localStorage) */
  const C = { items: [], doc: 'B001', cliente: null, medio: 'Efectivo', paga: '' };
  LF.carrito = C;

  /* ===== Crear venta (usado por la caja y por la simulación) ===== */
  function crearVenta(d) {
    const s = LF.store, D = db();
    const v = { id: 'V' + s.nextId('venta'), serie: d.doc, num: ++D.series[d.doc], t: Date.now(), items: [], total: 0, medio: d.medio, cliente: d.cliente || null, por: LF.sesion ? LF.sesion.personaId : 'P1' };
    d.items.forEach(it => {
      const p = s.producto(it.pid);
      const out = M.descontar(D.lotes, p.id, it.u * it.cant, Date.now(), D.ajustes.retiro);
      v.items.push({ pid: p.id, pres: it.pres, u: it.u, cant: it.cant, precio: it.precio, costo: M.r2(out.salida.reduce((a, x) => a + x.cant * x.costoU, 0)), lotes: out.salida.map(x => ({ lote: x.lote, codigo: x.codigo, cant: x.cant })) });
    });
    v.total = M.r2(v.items.reduce((a, it) => a + it.precio * it.cant, 0));
    if (d.medio === 'Efectivo' && d.paga) v.paga = Number(d.paga);
    (d.recetas || []).forEach(r => {
      const rec = Object.assign({ id: 'R' + s.nextId('receta'), venta: v.id, t: v.t, por: v.por }, r);
      D.recetas.unshift(rec);
      const it = v.items.find(x => x.pid === r.pid);
      if (it) it.receta = rec.id;
    });
    D.ventas.push(v);
    s.log('Vendió', v.serie + '-' + v.num + ' · ' + U.soles(v.total) + ' · ' + v.medio);
    s.save();
    return v;
  }

  function stockOk(items) {
    const falta = [];
    const pedido = {};
    items.forEach(it => { pedido[it.pid] = (pedido[it.pid] || 0) + it.u * it.cant; });
    Object.entries(pedido).forEach(([pid, u]) => { const st = LF.store.stock(pid); if (u > st) falta.push(LF.store.producto(pid).nombre + ' (pides ' + u + ' u, hay ' + st + ')'); });
    return falta;
  }

  /* ===== Simulación ===== */
  let simN = 0;
  function itemsEjemplo() {
    const P = db().productos;
    const combos = [['M07', 2, 21, 'M01', 2, 6], ['M19', 1, 3, 'M12', 2, 14], ['M06', 1, 2, 'M15', 0, 1], ['M18', 1, 3, 'M33', 0, 1], ['M11', 0, 1, 'M29', 0, 1]];
    const c = combos[(simN++ + db().ventas.length) % combos.length];
    const out = [];
    for (let i = 0; i < c.length; i += 3) {
      const p = P.find(x => x.id === c[i]);
      const pr = p.pres[Math.min(c[i + 1], p.pres.length - 1)];
      out.push({ pid: p.id, pres: pr.tipo, u: pr.unidades, cant: pr.unidades === 1 && p.pres.length > 1 ? c[i + 2] : (c[i + 2] > 3 ? 1 : c[i + 2]), precio: pr.precio });
    }
    return out;
  }
  function simularCarrito() {
    C.items = itemsEjemplo(); C.doc = 'B001'; C.cliente = null; C.medio = 'Efectivo'; C.paga = '';
    U.toast('Llegó una clienta con una receta. El carrito ya tiene sus productos.', 'info');
    if (location.hash.startsWith('#/venta')) LF.refrescar(); else LF.ir('venta');
  }
  function simularVenta() {
    const items = itemsEjemplo();
    const recetas = items.filter(it => LF.store.producto(it.pid).receta).map(it => ({ pid: it.pid, cant: it.u * it.cant, medico: 'Dra. Carmen Salazar Ríos', cmp: '04521', paciente: 'Fiorella Ramos Ticona', nro: String(30000 + db().recetas.length) }));
    const prev = LF.sesion;
    LF.sesion = Object.assign({}, prev, { personaId: 'P1', nombre: 'Ana Quispe Rojas' });
    const v = crearVenta({ items, doc: 'B001', medio: ['Efectivo', 'Yape', 'Tarjeta'][db().ventas.length % 3], recetas });
    LF.sesion = prev;
    return v;
  }

  /* ===== Ticket 80 mm ===== */
  function ticketHTML(v) {
    const E = db().empresa;
    const cli = v.cliente ? LF.store.db.clientes.find(c => c.id === v.cliente) : null;
    const T = M.igv(v.total);
    const vuelto = v.paga ? M.r2(v.paga - v.total) : 0;
    return '<div class="ticket"><h1>' + esc(E.nombre) + '</h1><p>' + esc(E.razon) + '<br>RUC ' + E.ruc + ' (ficticio)<br>' + esc(E.direccion) + '</p>' +
      '<h2>' + (v.serie === 'NV01' ? 'NOTA DE VENTA (no es comprobante)' : DOCS[v.serie].toUpperCase() + ' DE VENTA ELECTRÓNICA') + '<br>' + v.serie + '-' + String(v.num).padStart(8, '0') + '</h2>' +
      '<p>' + U.fechaLarga(v.t) + ' ' + U.hora(v.t) + (cli ? '<br>' + (cli.tipo === 'empresa' ? 'RUC ' : 'DNI ') + cli.doc + ' · ' + esc(cli.nombre) : '') + '</p>' +
      '<table>' + v.items.map(it => { const p = LF.store.producto(it.pid); return '<tr><td>' + it.cant + ' ' + esc(it.pres) + ' ' + esc(p.nombre) + (it.lotes && it.lotes.length ? '<br><small>Lote ' + it.lotes.map(l => l.codigo).join(', ') + '</small>' : '') + '</td><td class="r">' + U.soles(it.precio * it.cant) + '</td></tr>'; }).join('') + '</table>' +
      (v.serie !== 'NV01' ? '<p class="r">Op. gravada ' + U.soles(T.base) + '<br>IGV 18% ' + U.soles(T.igv) + '</p>' : '') +
      '<p class="r tk-total">TOTAL ' + U.soles(v.total) + '</p><p>' + esc(v.medio) + (v.paga ? ' · pagó ' + U.soles(v.paga) + ' · vuelto ' + U.soles(vuelto) : '') + '</p>' +
      '<p class="peq">Atendido por ' + esc(U.nombreCorto(LF.store.persona(v.por).nombre)) + ' · Q.F. responsable: ' + esc(E.qf) + '<br>' + (v.serie === 'NV01' ? 'Puede canjearla por boleta o factura en caja.' : 'Representación impresa de demostración. Envío a SUNAT simulado.') + '</p></div>';
  }
  const imprimirTicket = v => U.imprimir(ticketHTML(v));

  /* ===== Vista ===== */
  function render(el, params) {
    const D = db();
    if (params.get('sim') === '1' && !C.items.length) C.items = itemsEjemplo();
    let q = '', cat = '';
    const cats = [...new Set(D.productos.map(p => p.cat))];
    el.innerHTML = '<div class="pos"><section class="pos-cat"><div class="barra-f"><label class="buscar">' + icon('search') + '<input type="search" data-buscar placeholder="Nombre, molécula o código de barras" aria-label="Buscar producto"><kbd>/</kbd></label></div>' +
      '<div class="chips"><button class="chip on" data-cat="">Todos</button>' + cats.map(c => '<button class="chip" data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' +
      '<div class="prods" id="prods"></div></section><aside class="pos-car caja" id="carrito"></aside></div>';
    const prods = el.querySelector('#prods');
    const car = el.querySelector('#carrito');

    function pintarProds() {
      const qq = norm(q);
      let rows = D.productos.filter(p => (!cat || p.cat === cat) && (!qq || norm(p.nombre + ' ' + p.forma + ' ' + p.codigo).includes(qq)));
      if (!qq && !cat) rows = rows.slice().sort((a, b) => b.vd - a.vd);
      if (!rows.length) { prods.innerHTML = U.vacio('search', 'No encontramos "' + q + '"', 'Busca por el nombre genérico (por ejemplo, paracetamol) o pasa el código de barras de la caja.'); return; }
      prods.innerHTML = rows.slice(0, 24).map(p => {
        const st = LF.store.stock(p.id);
        const ag = st <= 0;
        const bajo = !ag && st < p.min;
        return '<article class="prod' + (ag ? ' agotado' : '') + '">' + LF.illus(p.ill, 40) + '<div class="prod-t"><b>' + esc(p.nombre) + '</b><small>' + esc(p.forma) + '</small>' +
          '<span class="prod-st' + (bajo ? ' bajo' : '') + '">' + (ag ? icon('alert') + 'Agotado' : (bajo ? icon('alert') : '') + 'Stock: ' + stockTxt(p, st)) + (p.receta ? ' · <span class="tag tag-red">' + icon('note') + 'Con receta</span>' : '') + '</span></div>' +
          '<div class="prod-pres">' + p.pres.map((pr, i) => '<button type="button" data-add="' + p.id + '" data-i="' + i + '"' + (ag || pr.unidades > st ? ' disabled' : '') + '><span>' + esc(pr.unidades > 1 ? pr.tipo + ' ' + pr.unidades : pr.tipo) + '</span><b class="num">' + U.soles(pr.precio) + '</b></button>').join('') + '</div></article>';
      }).join('') + (rows.length > 24 ? '<p class="muted">Mostrando 24 de ' + rows.length + '. Escribe más letras para encontrarlo.</p>' : '');
      prods.querySelectorAll('[data-add]').forEach(b => b.onclick = () => agregar(b.dataset.add, Number(b.dataset.i)));
    }

    function agregar(pid, i) {
      const p = LF.store.producto(pid);
      const pr = p.pres[i];
      const ex = C.items.find(x => x.pid === pid && x.pres === pr.tipo);
      if (ex) ex.cant++; else C.items.push({ pid, pres: pr.tipo, u: pr.unidades, cant: 1, precio: pr.precio });
      const f = stockOk(C.items);
      if (f.length) { if (ex) ex.cant--; else C.items.pop(); U.toast('No alcanza el stock: ' + f[0] + '.', 'error'); return; }
      pintarCar();
    }

    function pintarCar() {
      const total = M.r2(C.items.reduce((a, it) => a + it.precio * it.cant, 0));
      const T = M.igv(total);
      const cli = C.cliente ? D.clientes.find(c => c.id === C.cliente) : null;
      const vuelto = C.medio === 'Efectivo' && Number(C.paga) >= total ? M.r2(Number(C.paga) - total) : null;
      const conReceta = C.items.filter(it => LF.store.producto(it.pid).receta);
      if (!C.items.length) {
        car.innerHTML = '<h2>Venta</h2>' + U.vacio('cart', 'El carrito está vacío', 'Busca un producto o pasa el código de barras. También puedes usar "Simular cliente" arriba.');
        return;
      }
      car.innerHTML = '<div class="car-h"><h2>Venta</h2><button class="btn btn-ghost btn-sm" data-vaciar>Vaciar</button></div>' +
        '<ul class="car-items">' + C.items.map((it, i) => { const p = LF.store.producto(it.pid); return '<li><div><b>' + esc(p.nombre) + '</b><small>' + esc(it.u > 1 ? it.pres + ' x ' + it.u : it.pres) + ' · ' + U.soles(it.precio) + (p.receta ? ' · <span class="rx">' + icon('note') + 'receta</span>' : '') + '</small></div>' +
          '<div class="qty"><button type="button" data-menos="' + i + '" aria-label="Quitar uno">−</button><span class="num">' + it.cant + '</span><button type="button" data-mas="' + i + '" aria-label="Agregar uno">+</button></div><b class="num">' + U.soles(it.precio * it.cant) + '</b></li>'; }).join('') + '</ul>' +
        '<div class="seg3 doc-seg" role="radiogroup" aria-label="Comprobante">' + Object.keys(DOCS).map(k => '<button type="button" data-doc="' + k + '"' + (C.doc === k ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + DOCS[k] + '</button>').join('') + '</div>' +
        '<div class="car-cli">' + (cli ? '<span>' + icon('user') + '<b>' + esc(cli.nombre) + '</b> · ' + (cli.tipo === 'empresa' ? 'RUC ' : 'DNI ') + cli.doc + '</span><button class="btn btn-ghost btn-sm" data-sincli>Quitar</button>' : '<label class="con-btn"><input data-doccli inputmode="numeric" maxlength="11" placeholder="' + (C.doc === 'F001' ? 'RUC del cliente (obligatorio)' : 'DNI o RUC (opcional)') + '" aria-label="Documento del cliente"><button type="button" class="btn btn-line btn-sm" data-buscli>Buscar</button></label>') + '</div>' +
        '<dl class="car-tot">' + (C.doc !== 'NV01' ? '<dt>Op. gravada</dt><dd class="num">' + U.soles(T.base) + '</dd><dt>IGV 18%</dt><dd class="num">' + U.soles(T.igv) + '</dd>' : '') + '<dt class="t">Total</dt><dd class="t num">' + U.soles(total) + '</dd></dl>' +
        '<div class="medios" role="radiogroup" aria-label="Medio de pago">' + ['Efectivo', 'Yape', 'Plin', 'Tarjeta'].map(m => '<button type="button" data-medio="' + m + '"' + (C.medio === m ? ' class="on"' : '') + '>' + m + '</button>').join('') + '</div>' +
        (C.medio === 'Efectivo' ? '<div class="paga"><label class="campo">Paga con<input data-paga type="number" min="0" step="0.1" inputmode="decimal" value="' + esc(C.paga) + '" placeholder="' + total.toFixed(2) + '"></label><div class="billetes">' + [10, 20, 50, 100].filter(b => b >= total).slice(0, 3).map(b => '<button type="button" class="chip" data-bill="' + b + '">S/ ' + b + '</button>').join('') + '</div>' + '<p class="vuelto" aria-live="polite">' + (vuelto != null ? 'Vuelto <b class="num">' + U.soles(vuelto) + '</b>' : '') + '</p>' + '</div>' : '') +
        (conReceta.length ? '<p class="nota-rx">' + icon('note') + '<span>' + U.plural(conReceta.length, 'producto requiere', 'productos requieren') + ' receta médica. Se pedirá al cobrar.</span></p>' : '') +
        '<button class="btn btn-primary btn-lg car-ok" data-cobrar>' + icon('check') + 'Cobrar ' + U.soles(total) + ' <kbd>F2</kbd></button>';
      car.querySelector('[data-vaciar]').onclick = () => { C.items = []; C.cliente = null; C.paga = ''; pintarCar(); };
      car.querySelectorAll('[data-menos]').forEach(b => b.onclick = () => { const it = C.items[b.dataset.menos]; it.cant--; if (!it.cant) C.items.splice(b.dataset.menos, 1); pintarCar(); });
      car.querySelectorAll('[data-mas]').forEach(b => b.onclick = () => { const it = C.items[b.dataset.mas]; it.cant++; const f = stockOk(C.items); if (f.length) { it.cant--; U.toast('No alcanza el stock: ' + f[0] + '.', 'error'); return; } pintarCar(); });
      car.querySelectorAll('[data-doc]').forEach(b => b.onclick = () => { C.doc = b.dataset.doc; if (C.doc === 'F001' && cli && cli.tipo !== 'empresa') C.cliente = null; pintarCar(); });
      car.querySelectorAll('[data-medio]').forEach(b => b.onclick = () => { C.medio = b.dataset.medio; pintarCar(); });
      const paga = car.querySelector('[data-paga]');
      if (paga) paga.oninput = () => { C.paga = paga.value; const p = car.querySelector('.vuelto'); const v = Number(paga.value) >= total ? M.r2(Number(paga.value) - total) : null; p.innerHTML = !paga.value ? '' : v != null ? 'Vuelto <b class="num">' + U.soles(v) + '</b>' : 'Falta ' + U.soles(total - Number(paga.value || 0)); };
      car.querySelectorAll('[data-bill]').forEach(b => b.onclick = () => { C.paga = b.dataset.bill; pintarCar(); });
      const sc = car.querySelector('[data-sincli]');
      if (sc) sc.onclick = () => { C.cliente = null; pintarCar(); };
      const bc = car.querySelector('[data-buscli]');
      if (bc) { const inp = car.querySelector('[data-doccli]'); bc.onclick = () => buscarCliente(inp.value.trim()); inp.onkeydown = e => { if (e.key === 'Enter') buscarCliente(inp.value.trim()); }; }
      car.querySelector('[data-cobrar]').onclick = cobrar;
    }

    function buscarCliente(doc) {
      if (!/^(\d{8}|\d{11})$/.test(doc)) { U.toast('Escribe un DNI de 8 dígitos o un RUC de 11.', 'error'); return; }
      if (C.doc === 'F001' && doc.length !== 11) { U.toast('La factura necesita el RUC del cliente (11 dígitos).', 'error'); return; }
      let c = D.clientes.find(x => x.doc === doc);
      if (!c) {
        c = { id: 'C' + (D.clientes.length + 1), tipo: doc.length === 11 ? 'empresa' : 'persona', nombre: doc.length === 11 ? 'Comercial Demo ' + doc.slice(-3) + ' S.A.C.' : NOMBRES_RENIEC[Number(doc.slice(-1)) % NOMBRES_RENIEC.length], doc, tel: '' };
        D.clientes.push(c);
        U.toast((doc.length === 11 ? 'SUNAT' : 'RENIEC') + ' (simulado): ' + c.nombre, 'info');
      }
      C.cliente = c.id;
      pintarCar();
    }

    async function cobrar() {
      const total = M.r2(C.items.reduce((a, it) => a + it.precio * it.cant, 0));
      const cli = C.cliente ? D.clientes.find(c => c.id === C.cliente) : null;
      if (C.doc === 'F001' && (!cli || cli.tipo !== 'empresa')) { U.toast('Para emitir factura, busca el RUC del cliente.', 'error'); const i = car.querySelector('[data-doccli]'); if (i) i.focus(); return; }
      if (C.doc === 'B001' && total >= 700 && !cli) { U.toast('Las boletas desde S/ 700 necesitan el DNI del cliente.', 'error'); return; }
      if (C.medio === 'Efectivo' && C.paga && Number(C.paga) < total) { U.toast('El monto recibido es menor que el total. Faltan ' + U.soles(total - Number(C.paga)) + '.', 'error'); return; }
      const f = stockOk(C.items);
      if (f.length) { U.toast('No alcanza el stock: ' + f.join(', ') + '.', 'error'); return; }
      if (!LF.store.puede('vender')) { U.toast('Tu usuario no tiene permiso para vender. Pide a la dueña que lo active en Ajustes.', 'error'); return; }
      let recetas = [];
      const rx = C.items.filter(it => LF.store.producto(it.pid).receta);
      if (rx.length) {
        const r = await U.modal('Receta médica', '<p>' + rx.map(it => '<b>' + esc(LF.store.producto(it.pid).nombre) + '</b>').join(', ') + ' se venden con receta. Registra sus datos (quedan en el libro de recetas).</p>' +
          '<div class="campos"><label class="campo">N.º de receta<input name="nro" inputmode="numeric" required></label><label class="campo">Médico<input name="medico" required placeholder="Ej.: Dra. Carmen Salazar"></label><label class="campo">CMP<input name="cmp" inputmode="numeric" maxlength="6" required pattern="[0-9]{4,6}"></label><label class="campo">Paciente<input name="paciente" required value="' + esc(cli && cli.tipo === 'persona' ? cli.nombre : '') + '"></label></div>',
          [['cancelar', 'Volver', 'btn-line'], ['ok', 'Registrar y cobrar', 'btn-primary']]);
        if (r.v !== 'ok') return;
        const dat = Object.fromEntries(['nro', 'medico', 'cmp', 'paciente'].map(k => [k, String(r.data.get(k) || '').trim()]));
        if (!dat.nro || !dat.medico || !/^\d{4,6}$/.test(dat.cmp) || !dat.paciente) { U.toast('Completa la receta: número, médico, CMP (4 a 6 dígitos) y paciente.', 'error'); return; }
        recetas = rx.map(it => Object.assign({ pid: it.pid, cant: it.u * it.cant }, dat));
      }
      const v = crearVenta({ items: C.items, doc: C.doc, cliente: C.cliente, medio: C.medio, paga: C.paga, recetas });
      C.items = []; C.cliente = null; C.paga = ''; C.doc = 'B001'; C.medio = 'Efectivo';
      LF.refrescarNav();
      const vuelto = v.paga ? M.r2(v.paga - v.total) : 0;
      car.innerHTML = '<div class="listo">' + LF.illus('cobro', 64) + '<h2>' + DOCS[v.serie] + ' ' + v.serie + '-' + v.num + '</h2><p class="num">' + U.soles(v.total) + ' · ' + esc(v.medio) + (v.paga ? ' · vuelto <b>' + U.soles(vuelto) + '</b>' : '') + '</p>' +
        '<div class="fila"><button class="btn btn-primary" data-print>' + icon('print') + 'Imprimir ticket</button><button class="btn btn-line" data-nueva>' + icon('plus') + 'Nueva venta</button></div>' +
        (LF.tieneModulo('caja') && !(db().cajaHoy && !db().cajaHoy.cerrada) && v.medio === 'Efectivo' ? '<p class="nota-rx">' + icon('alert') + '<span>La caja de hoy no está abierta: este efectivo no entra al arqueo. <a href="#/caja">Abrir caja</a></span></p>' : '') + '</div>';
      car.querySelector('[data-print]').onclick = () => imprimirTicket(v);
      car.querySelector('[data-nueva]').onclick = () => { pintarProds(); pintarCar(); el.querySelector('[data-buscar]').focus(); };
      pintarProds();
    }

    const inp = el.querySelector('[data-buscar]');
    let tmr;
    inp.oninput = () => { clearTimeout(tmr); tmr = setTimeout(() => { q = inp.value; pintarProds(); }, 120); };
    inp.onkeydown = e => {
      if (e.key !== 'Enter') return;
      const code = inp.value.trim();
      const p = D.productos.find(x => x.codigo === code);
      if (p) { agregar(p.id, p.pres.length - 1); inp.value = ''; q = ''; pintarProds(); U.toast('Agregado: ' + p.nombre, 'ok'); }
      else { const primero = prods.querySelector('[data-add]:not([disabled])'); if (primero) primero.click(); }
    };
    el.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; el.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x === b)); pintarProds(); });
    document.onkeydown = e => { if (e.key === 'F2' && location.hash.startsWith('#/venta')) { e.preventDefault(); const b = document.querySelector('#carrito [data-cobrar]'); if (b) b.click(); } };
    pintarProds();
    pintarCar();
    setTimeout(() => inp.focus(), 50);
  }

  function stockTxt(p, st) {
    const uC = p.pres[0].unidades;
    if (uC > 1) { const cj = Math.floor(st / uC); return (cj ? cj + (cj === 1 ? ' caja' : ' cajas') + ' + ' : '') + (st % uC) + ' u'; }
    return st + ' ' + M.presPlural(p.pres[0].tipo, st);
  }

  LF.venta = { crearVenta, simularCarrito, simularVenta, ticketHTML, imprimirTicket, stockTxt, DOCS };
  LF.vistas.venta = { titulo: 'Caja rápida', menu: 'Vender', corto: 'Vender', icono: 'cart', modulo: 'venta', badge: () => LF.carrito.items.length, render };
})();
