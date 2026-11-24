/* Ajustes: negocio, reglas de vencimiento y pedido, usuarios y permisos, historial, datos del demo */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const db = () => LF.store.db;
  const NOM_F = { cercania: 'Cercanía', excedente: 'Excedente', valor: 'Valor en riesgo', rotacion: 'Rotación lenta' };
  const PERMS = [['vender', 'Vender'], ['compras', 'Registrar compras'], ['inventario', 'Ajustar stock y lotes'], ['recetas', 'Ver libro de recetas']];
  const sec = (t, d, c) => '<section class="aj-sec"><div><h2>' + t + '</h2><p>' + d + '</p></div><div>' + c + '</div></section>';

  function render(el) {
    const D = db(), E = D.empresa, A = D.ajustes;
    const muestra = LF.tieneModulo('vencimientos') ? LF.inventario.lotesConRiesgo().sort((a, b) => b.r.puntaje - a.r.puntaje)[2] : null;
    el.innerHTML =
      sec('Datos de la botica', 'Salen en el ticket, la boleta y la web.', '<div class="campos"><label class="campo">Nombre comercial<input data-emp="nombre" value="' + esc(E.nombre) + '"></label><label class="campo">Razón social<input data-emp="razon" value="' + esc(E.razon) + '"></label><label class="campo">RUC<input data-emp="ruc" value="' + esc(E.ruc) + '" inputmode="numeric" maxlength="11"></label><label class="campo">Dirección<input data-emp="direccion" value="' + esc(E.direccion) + '"></label><label class="campo">Horario<input data-emp="horario" value="' + esc(E.horario) + '"></label><label class="campo">Q.F. responsable<input data-emp="qf" value="' + esc(E.qf) + '"></label></div><button class="btn btn-dark" data-g-emp>Guardar datos</button>') +
      (LF.tieneModulo('vencimientos') ? sec('Riesgo por vencimiento', 'Cuántos días antes de vencer se retira un lote del estante y cuánto pesa cada factor.', '<div class="campos campos-sm"><label class="campo">Días de retiro<input type="number" min="0" max="120" step="5" data-retiro value="' + A.retiro + '"><small>antes del vencimiento</small></label></div><div class="pesos">' + Object.keys(NOM_F).map(k => '<label class="peso"><span>' + NOM_F[k] + '</span><input type="range" min="0" max="60" data-p="' + k + '" value="' + A.pesos[k] + '"><output class="num">' + A.pesos[k] + '</output></label>').join('') + '</div><p class="suma" data-suma></p>' +
        (muestra ? '<div class="caja caja-p prev"><p class="muted">Vista previa con <b>' + esc(muestra.p.nombre) + '</b>, lote ' + esc(muestra.l.codigo) + '</p><div data-prev></div></div>' : '') + '<div class="fila"><button class="btn btn-dark" data-g-p>Guardar reglas</button><button class="btn btn-ghost" data-reset-p>Valores sugeridos</button></div>') : '') +
      (LF.tieneModulo('reposicion') ? sec('Pedido sugerido', 'Para cuántos días alcanza cada pedido.', '<div class="campos campos-sm"><label class="campo">Días de cobertura<input type="number" min="5" max="60" data-cob value="' + A.cobertura + '"></label></div><button class="btn btn-dark" data-g-cob>Guardar</button>') : '') +
      sec('Usuarios y permisos', LF.tieneModulo('usuarios') ? 'Qué puede hacer cada trabajador. Anular ventas siempre pide el PIN de la dueña.' : 'Disponible en el plan Completo. En este plan todos los usuarios pueden vender.',
        '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Usuario</th>' + PERMS.map(p => '<th>' + p[1] + '</th>').join('') + '</tr></thead><tbody>' + D.personas.map(p => { const P = A.permisos[p.id] || []; const todo = P.includes('todo'); return '<tr><td>' + U.avatar(p.nombre, 'avatar-s') + ' <b>' + esc(p.nombre) + '</b><br><small class="muted">' + esc(p.cargo) + '</small></td>' + PERMS.map(x => '<td><input type="checkbox" class="perm" data-u="' + p.id + '" data-perm="' + x[0] + '"' + (todo || P.includes(x[0]) ? ' checked' : '') + (todo || !LF.tieneModulo('usuarios') ? ' disabled' : '') + ' aria-label="' + esc(x[1]) + ' para ' + esc(p.nombre) + '"></td>').join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="muted">PIN de prueba: cajeros 0000 · Q.F. 2222 · dueña 1234.</p>') +
      sec('Historial de cambios', 'Quién cambió qué y cuándo.', '<ul class="hist">' + D.historial.slice(0, 25).map(h => '<li><time>' + U.cuando(h.t) + '</time><div><b>' + esc(h.usuario) + '</b> · ' + esc(h.accion) + (h.detalle ? '<small>' + esc(h.detalle) + '</small>' : '') + '</div></li>').join('') + '</ul>') +
      sec('Datos del demo', 'Son ficticios y se regeneran cada día. Puedes volver a empezar cuando quieras.', '<button class="btn btn-line" data-reset>' + icon('refresh') + 'Reiniciar datos de ejemplo</button>');

    const on = (s, fn) => { const b = el.querySelector(s); if (b) b.onclick = fn; };
    on('[data-g-emp]', () => { const c = []; el.querySelectorAll('[data-emp]').forEach(i => { if (E[i.dataset.emp] !== i.value.trim()) { c.push(i.dataset.emp); E[i.dataset.emp] = i.value.trim(); } }); if (!c.length) { U.toast('No hay cambios que guardar', 'info'); return; } LF.store.log('Cambió datos de la botica', c.join(', ')); LF.store.save(); U.toast('Datos guardados'); });
    const leer = () => { const p = {}; el.querySelectorAll('[data-p]').forEach(i => { p[i.dataset.p] = Number(i.value); i.nextElementSibling.textContent = i.value; }); return p; };
    const prev = el.querySelector('[data-prev]');
    const pintar = () => {
      const p = leer(), s = Object.values(p).reduce((a, b) => a + b, 0);
      const sm = el.querySelector('[data-suma]');
      if (sm) sm.innerHTML = 'Suma: <b class="num">' + s + '</b> de 100' + (s !== 100 ? ' · <span class="aviso">' + (s > 100 ? 'pasa de 100: los puntajes se cortan en 100' : 'menos de 100: ningún lote llegará a 100') + '</span>' : '');
      if (prev && muestra) { const ret = Number(el.querySelector('[data-retiro]').value) || 0; prev.innerHTML = U.medidor(M.riesgoLote(muestra.l, LF.store.lotesDe(muestra.p.id), muestra.p.vd, { pesos: p, retiro: ret })); }
    };
    el.querySelectorAll('[data-p], [data-retiro]').forEach(i => i.oninput = pintar);
    if (el.querySelector('[data-p]')) pintar();
    on('[data-reset-p]', () => { el.querySelectorAll('[data-p]').forEach(i => { i.value = M.PESOS_BASE[i.dataset.p]; }); el.querySelector('[data-retiro]').value = 30; pintar(); });
    on('[data-g-p]', () => {
      const p = leer(), ret = Number(el.querySelector('[data-retiro]').value);
      const c = Object.keys(p).filter(k => p[k] !== A.pesos[k]).map(k => NOM_F[k] + ': ' + A.pesos[k] + ' → ' + p[k]);
      if (ret !== A.retiro) c.push('Días de retiro: ' + A.retiro + ' → ' + ret);
      if (!c.length) { U.toast('No hay cambios que guardar', 'info'); return; }
      A.pesos = p; A.retiro = ret;
      LF.store.log('Cambió reglas de vencimiento', c.join(' · '));
      LF.store.save(); U.toast('Reglas guardadas. Los puntajes ya se recalcularon.'); LF.refrescar();
    });
    on('[data-g-cob]', () => { const v = Number(el.querySelector('[data-cob]').value); if (!(v >= 5)) { U.toast('La cobertura debe ser de al menos 5 días.', 'error'); return; } if (v === A.cobertura) { U.toast('No hay cambios que guardar', 'info'); return; } LF.store.log('Cambió cobertura del pedido', A.cobertura + ' → ' + v + ' días'); A.cobertura = v; LF.store.save(); U.toast('Cobertura guardada'); });
    el.querySelectorAll('.perm').forEach(c => c.onchange = () => {
      const P = A.permisos[c.dataset.u] = A.permisos[c.dataset.u] || [];
      const i = P.indexOf(c.dataset.perm);
      if (c.checked && i < 0) P.push(c.dataset.perm); if (!c.checked && i >= 0) P.splice(i, 1);
      LF.store.log('Cambió permisos', LF.store.persona(c.dataset.u).nombre + ': ' + (c.checked ? 'puede ' : 'ya no puede ') + PERMS.find(x => x[0] === c.dataset.perm)[1].toLowerCase());
      LF.store.save(); U.toast('Permiso actualizado');
    });
    on('[data-reset]', async () => { const r = await U.modal('Reiniciar datos de ejemplo', '<p>Se borran las ventas, compras y cambios que hiciste en este navegador y se cargan otra vez los 30 días de ejemplo.</p>', [['cancelar', 'Cancelar', 'btn-line'], ['ok', 'Reiniciar', 'btn-primary']]); if (r.v !== 'ok') return; LF.store.reset(); LF.carrito.items = []; U.toast('Datos de ejemplo reiniciados'); LF.refrescar(); });
  }

  LF.vistas.ajustes = { titulo: 'Ajustes', icono: 'settings', render };
})();
