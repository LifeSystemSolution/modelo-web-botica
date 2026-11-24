/* Caja diaria de la agencia: apertura, cobros por medio, salidas y cierre con arqueo */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const db = () => LF.store.db;
  const DENOM = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];

  function movimientosHoy() {
    const h0 = U.inicioDia();
    const mov = [];
    db().ventas.filter(v => v.t >= h0 && LF.ventas.cuentan(v) && !v.esCanje).forEach(v => mov.push({ t: v.t, tipo: LF.venta.DOCS[v.serie], det: v.serie + '-' + v.num + ' · ' + v.items.map(it => LF.store.producto(it.pid).nombre).join(', '), medio: v.medio, monto: v.total }));
    const c = db().cajaHoy;
    if (c && c.salidas) c.salidas.forEach(s => mov.push({ t: s.t, tipo: 'Salida', det: s.motivo, medio: 'Efectivo', monto: -s.monto }));
    return mov.sort((a, b) => b.t - a.t);
  }

  function render(el) {
    const hoy = M.diaISO(Date.now());
    let c = db().cajaHoy;
    if (c && c.fecha !== hoy) { db().cajaHoy = null; c = null; }
    const hist = db().cajas.slice(-7).reverse();
    const tablaHist = '<section class="sec"><div class="sec-h"><h2>Cierres anteriores</h2><p>Últimos 7 días</p></div><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Día</th><th>Responsable</th><th class="r">Esperado</th><th class="r">Contado</th><th class="r">Diferencia</th></tr></thead><tbody>' +
      hist.map(x => { const d = Math.round((x.contado - x.esperado) * 10) / 10; return '<tr><td>' + U.fechaDia(new Date(x.fecha + 'T12:00')) + '</td><td>' + esc(U.nombreCorto((LF.store.persona(x.por) || {}).nombre || 'Ana Quispe')) + '</td><td class="r num">' + U.soles(x.esperado) + '</td><td class="r num">' + U.soles(x.contado) + '</td><td class="r num">' + (d === 0 ? '<span class="tag tag-ok">' + icon('check') + 'Cuadra</span>' : '<span class="tag ' + (d < 0 ? 'tag-red' : '') + '">' + (d > 0 ? 'Sobra ' : 'Falta ') + U.soles(Math.abs(d)) + '</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>';

    if (!c || c.cerrada) {
      el.innerHTML = '<div class="caja caja-p abrir-caja">' + LF.illus('cobro', 64) + '<div><h2>' + (c && c.cerrada ? 'La caja de hoy ya se cerró' : 'La caja de hoy está cerrada') + '</h2><p class="muted">' + (c && c.cerrada ? 'Cerraste a las ' + U.hora(c.cierra) + ' con ' + U.soles(c.contado) + '. Puedes abrirla otra vez si vas a seguir atendiendo.' : 'Ábrela con el fondo de sencillo para empezar a cobrar en efectivo.') + '</p></div>' +
        '<label class="campo">Fondo inicial (S/)<input type="number" min="0" step="10" value="150" data-fondo></label><button class="btn btn-primary btn-lg" data-abrir>' + icon('cash') + 'Abrir caja</button></div>' + tablaHist;
      el.querySelector('[data-abrir]').onclick = () => {
        const fondo = Number(el.querySelector('[data-fondo]').value) || 0;
        db().cajaHoy = { fecha: hoy, fondo, abre: Date.now(), salidas: [], por: LF.sesion.personaId };
        LF.store.log('Abrió caja', 'Fondo ' + U.soles(fondo));
        LF.store.save();
        U.toast('Caja abierta con ' + U.soles(fondo) + ' de fondo');
        LF.refrescar();
      };
      return;
    }

    const mov = movimientosHoy();
    const porMedio = {};
    mov.forEach(m => { porMedio[m.medio] = (porMedio[m.medio] || 0) + m.monto; });
    const efectivo = c.fondo + (porMedio.Efectivo || 0);
    const otros = Object.keys(porMedio).filter(k => k !== 'Efectivo');
    el.innerHTML = '<div class="kpis"><div class="kpi"><span>Efectivo esperado</span><b class="num">' + U.soles(efectivo) + '</b><small>Fondo ' + U.soles(c.fondo) + ' + cobros − salidas</small></div>' +
      '<div class="kpi"><span>Cobrado hoy</span><b class="num">' + U.soles(mov.filter(m => m.monto > 0).reduce((s, m) => s + m.monto, 0)) + '</b><small>' + U.plural(mov.filter(m => m.monto > 0).length, 'cobro') + '</small></div>' +
      '<div class="kpi"><span>Yape, Plin y tarjeta</span><b class="num">' + U.soles(otros.reduce((s, k) => s + porMedio[k], 0)) + '</b><small>' + (otros.length ? otros.map(k => k + ' ' + U.soles(porMedio[k], 0)).join(' · ') : 'Sin cobros digitales aún') + '</small></div>' +
      '<div class="kpi"><span>Abierta</span><b class="num">' + U.hora(c.abre) + '</b><small>por ' + esc(U.nombreCorto(LF.store.persona(c.por).nombre)) + '</small></div></div>' +
      '<div class="fila acciones-caja"><button class="btn btn-line" data-salida>' + icon('arrowUp') + 'Registrar salida de efectivo</button><button class="btn btn-dark" data-cerrar>' + icon('lock') + 'Cerrar caja con arqueo</button></div>' +
      '<section class="sec"><div class="sec-h"><h2>Movimientos de hoy</h2></div>' + (mov.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Hora</th><th>Tipo</th><th>Detalle</th><th>Medio</th><th class="r">Monto</th></tr></thead><tbody>' +
        mov.map(m => '<tr><td class="num">' + U.hora(m.t) + '</td><td>' + esc(m.tipo) + '</td><td>' + esc(m.det) + '</td><td>' + esc(m.medio) + '</td><td class="r num' + (m.monto < 0 ? ' neg' : '') + '">' + U.soles(m.monto) + '</td></tr>').join('') + '</tbody></table></div>'
        : U.vacio('cash', 'Aún no hay cobros hoy', 'Cada venta que cobres aparecerá aquí.', LF.puede('venta') ? '<a class="btn btn-primary" href="#/venta">' + icon('cart') + 'Ir a vender</a>' : '')) + '</section>' + tablaHist;

    el.querySelector('[data-salida]').onclick = async () => {
      const r = await U.modal('Salida de efectivo', '<label class="campo">Monto (S/)<input name="monto" type="number" min="0.1" step="0.1" required></label><label class="campo">Motivo<input name="motivo" placeholder="Ej.: movilidad, bolsas" required></label>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Registrar salida', 'btn-dark']]);
      if (r.v !== 'ok') return;
      const monto = Number(r.data.get('monto'));
      const motivo = String(r.data.get('motivo') || '').trim();
      if (!(monto > 0) || !motivo) { U.toast('Escribe el monto y el motivo de la salida.', 'error'); return; }
      if (monto > efectivo) { U.toast('No hay ' + U.soles(monto) + ' en efectivo. En caja hay ' + U.soles(efectivo) + '.', 'error'); return; }
      c.salidas.push({ t: Date.now(), monto, motivo });
      LF.store.log('Registró salida de caja', U.soles(monto) + ' · ' + motivo);
      LF.store.save();
      LF.refrescar();
    };
    el.querySelector('[data-cerrar]').onclick = () => arqueo(c, efectivo);
  }

  function arqueo(c, esperado) {
    const p = U.panel('<div class="panel-h"><h2>Arqueo y cierre</h2><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div><div class="panel-c">' +
      '<p class="muted">Cuenta el efectivo por billetes y monedas. El sistema compara con lo esperado.</p><div class="arqueo">' +
      DENOM.map(d => '<label><span class="num">' + (d >= 10 ? 'Billete ' : 'Moneda ') + U.soles(d, d < 1 ? 2 : 0) + '</span><input type="number" min="0" step="1" inputmode="numeric" data-d="' + d + '" placeholder="0"><output class="num">S/ 0.00</output></label>').join('') + '</div>' +
      '<div class="arq-res" data-res></div></div><div class="panel-f"><button class="btn btn-dark btn-lg" data-ok>' + icon('lock') + 'Cerrar caja</button></div>');
    const res = p.querySelector('[data-res]');
    let contado = 0;
    function calc() {
      contado = 0;
      p.querySelectorAll('[data-d]').forEach(i => { const v = (Number(i.value) || 0) * Number(i.dataset.d); contado += v; i.nextElementSibling.textContent = U.soles(v); });
      contado = Math.round(contado * 10) / 10;
      const dif = Math.round((contado - esperado) * 10) / 10;
      res.innerHTML = '<div><span>Esperado</span><b class="num">' + U.soles(esperado) + '</b></div><div><span>Contado</span><b class="num">' + U.soles(contado) + '</b></div><div class="' + (dif === 0 ? 'ok' : 'mal') + '"><span>' + (dif === 0 ? 'Cuadra' : dif > 0 ? 'Sobra' : 'Falta') + '</span><b class="num">' + U.soles(Math.abs(dif)) + '</b></div>';
    }
    p.querySelectorAll('[data-d]').forEach(i => i.oninput = calc);
    calc();
    p.querySelector('[data-ok]').onclick = () => {
      if (!contado) { U.toast('Cuenta el efectivo antes de cerrar. Si no hay efectivo, escribe 0 en un casillero y cierra.', 'error'); const i = p.querySelector('[data-d]'); if (i.value === '') { i.focus(); return; } }
      c.cerrada = true; c.cierra = Date.now(); c.contado = contado; c.esperado = Math.round(esperado * 10) / 10;
      db().cajas.push({ fecha: c.fecha, fondo: c.fondo, abre: c.abre, cierra: c.cierra, esperado: c.esperado, contado, por: LF.sesion.personaId });
      LF.store.log('Cerró caja', 'Esperado ' + U.soles(c.esperado) + ' · contado ' + U.soles(contado));
      LF.store.save();
      U.cerrarPanel();
      U.toast('Caja cerrada. ' + (contado === c.esperado ? 'Cuadró exacto.' : 'Diferencia de ' + U.soles(Math.abs(contado - c.esperado)) + '.'));
      LF.refrescar();
    };
  }

  LF.vistas.caja = { titulo: 'Caja del día', menu: 'Caja', icono: 'cash', modulo: 'caja', render };
})();
