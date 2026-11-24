/* Página de planes: simulador del riesgo por vencimiento (mismo motor del sistema), planes, "arma tu plan", calculadora y accesos */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor, P = LF.planes;
  const WA = P.WHATSAPP;
  const wa = txt => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt);
  const logo = '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--brand)"/><path d="M13 7.5h6v5.5h5.5v6H19v5.5h-6V19H7.5v-6H13z" fill="#fff"/></svg><span class="logo-t oscuro">Life<b>Farma</b></span>';

  function tema(t) {
    try { if (t) localStorage.setItem('lifefarma-tema', t); } catch (e) { /* */ }
    let v = 'light';
    try { v = localStorage.getItem('lifefarma-tema') || 'light'; } catch (e) { /* */ }
    document.documentElement.dataset.theme = v;
    const b = document.getElementById('btn-tema');
    b.innerHTML = icon(v === 'dark' ? 'sun' : 'moon');
    b.setAttribute('aria-label', v === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro');
  }

  /* ===== Simulador: el mismo cálculo por lote que usa el sistema ===== */
  function widget() {
    const el = document.getElementById('widget');
    const s = { tipo: 'frasco', cant: 60, dias: 80, vd: 0.6, costo: 9 };
    el.innerHTML = '<div class="w-h"><h2>Pruebe el puntaje de un lote</h2><p class="muted">Un lote en su estante. Mueva los valores.</p></div>' +
      '<div class="w-c"><label class="campo">Producto<select data-w="tipo"><option value="frasco">Jarabe (frasco)</option><option value="blister">Tabletas (blíster)</option></select></label>' +
      '<label class="campo">Costo por unidad <output data-o="costo">S/ 9.00</output><input type="range" min="0.1" max="40" step="0.1" value="9" data-w="costo"></label>' +
      '<label class="campo">Unidades del lote <output data-o="cant">60</output><input type="range" min="5" max="400" step="5" value="60" data-w="cant"></label>' +
      '<label class="campo">Días para vencer <output data-o="dias">80</output><input type="range" min="0" max="365" step="5" value="80" data-w="dias"></label>' +
      '<label class="campo">Se venden al día <output data-o="vd">0.6</output><input type="range" min="0.1" max="10" step="0.1" value="0.6" data-w="vd"></label></div>' +
      '<div class="w-res" data-res></div>';
    function pintar() {
      const l = { id: 'X', pid: 'X', cant: s.cant, vence: M.diaISO(Date.now() + s.dias * 864e5), costoU: s.costo };
      const r = M.riesgoLote(l, [l], s.vd, { retiro: 30, fraccionable: s.tipo === 'blister' });
      el.querySelector('[data-res]').innerHTML = U.medidor(r) + '<p class="accion">' + icon('bolt') + '<span><b>Qué hacer:</b> ' + esc(r.accion) + (r.soles ? '. En juego: <b class="num">' + U.soles(r.soles) + '</b> al costo.' : '.') + '</span></p>';
      el.querySelector('[data-o=costo]').textContent = U.soles(s.costo);
      el.querySelector('[data-o=cant]').textContent = s.cant;
      el.querySelector('[data-o=dias]').textContent = s.dias;
      el.querySelector('[data-o=vd]').textContent = s.vd.toFixed(1);
    }
    el.querySelectorAll('[data-w]').forEach(i => i.oninput = () => { s[i.dataset.w] = i.tagName === 'SELECT' ? i.value : Number(i.value); pintar(); });
    pintar();
  }

  /* ===== Planes ===== */
  function planes() {
    const el = document.getElementById('planes-lista');
    const orden = ['basico', 'control', 'completo'];
    el.innerHTML = orden.map((k, i) => {
      const p = P.PLANES[k];
      const nuevos = i === 0 ? p.mods : p.mods.filter(m => !P.PLANES[orden[i - 1]].mods.includes(m));
      return '<article class="l-plan' + (k === 'control' ? ' l-plan-dest' : '') + '"><h3>' + esc(p.nombre) + '</h3><p class="l-plan-para">' + esc(p.para) + '</p>' +
        '<ul>' + (i ? '<li class="mas">' + icon('check') + 'Todo lo del plan ' + esc(P.PLANES[orden[i - 1]].nombre) + '</li>' : '') + nuevos.map(m => '<li>' + icon('check') + '<span><b>' + esc(P.MODULOS[m].nombre) + '</b><small>' + esc(P.MODULOS[m].desc) + '</small></span></li>').join('') + '</ul>' +
        '<div class="l-plan-acc"><a class="btn ' + (k === 'control' ? 'btn-primary' : 'btn-dark') + '" href="app.html?plan=' + k + '">Probar ' + esc(p.nombre) + '</a><a class="btn btn-ghost" target="_blank" rel="noopener" href="' + wa('Hola, quiero cotizar el sistema LifeFarma plan ' + p.nombre + ' para mi botica.') + '">Cotizar</a></div></article>';
    }).join('');

    const arma = document.getElementById('arma');
    const sel = new Set(P.PLANES.basico.mods);
    arma.innerHTML = '<div class="l-arma-h"><h3>Arme su plan</h3><p class="muted">Marque solo los módulos que necesita. Los tres primeros vienen siempre.</p></div><div class="l-mods">' +
      Object.keys(P.MODULOS).map(m => '<label class="l-mod' + (P.MODULOS[m].fijo ? ' fijo' : '') + '"><input type="checkbox" value="' + m + '"' + (sel.has(m) ? ' checked' : '') + (P.MODULOS[m].fijo ? ' disabled' : '') + '><span><b>' + esc(P.MODULOS[m].nombre) + '</b><small>' + esc(P.MODULOS[m].desc) + '</small></span></label>').join('') +
      '</div><div class="l-arma-f"><span data-n class="num"></span><a class="btn btn-primary" data-probar>Probar mi plan</a><a class="btn btn-line" data-wa target="_blank" rel="noopener">' + icon('whatsapp') + 'Cotizar este plan</a></div>';
    function act() {
      const mods = [...arma.querySelectorAll('input:checked')].map(i => i.value);
      arma.querySelector('[data-n]').textContent = U.plural(mods.length, 'módulo') + ' elegidos';
      arma.querySelector('[data-probar]').href = 'app.html?plan=custom&mods=' + mods.join(',');
      arma.querySelector('[data-wa]').href = wa('Hola, quiero cotizar el sistema LifeFarma con estos módulos: ' + mods.map(m => P.MODULOS[m].nombre).join(', ') + '.');
    }
    arma.querySelectorAll('input').forEach(i => i.onchange = act);
    act();
  }

  /* ===== Calculadora de pérdida por vencimiento (estimación) ===== */
  function calc() {
    const el = document.getElementById('calc');
    const res = document.getElementById('calc-res');
    const C = [['inv', 'Valor de su inventario al costo', 25000, 1000, 2000000, 500, 'S/'], ['venc', 'De ese valor, cuánto se vence al año', 3, 0, 30, 0.5, '%'], ['red', 'Pérdida que se evita vendiendo primero o con canje a tiempo', 60, 0, 90, 5, '%'], ['horas', 'Horas al mes revisando vencimientos a mano', 6, 0, 80, 1, 'h'], ['hora', 'Costo de una hora de trabajo', 10, 1, 80, 0.5, 'S/']];
    el.innerHTML = C.map(c => '<label class="campo">' + c[1] + '<span class="l-in"><input type="number" min="' + c[3] + '" max="' + c[4] + '" step="' + c[5] + '" value="' + c[2] + '" data-c="' + c[0] + '" inputmode="decimal"><em>' + c[6] + '</em></span></label>').join('');
    function pintar() {
      const v = {};
      el.querySelectorAll('[data-c]').forEach(i => { v[i.dataset.c] = Math.max(0, Number(i.value) || 0); });
      const perdida = v.inv * v.venc / 100;
      const evitada = perdida * v.red / 100;
      const tiempo = v.horas * 12 * v.hora;
      const total = evitada + tiempo;
      res.innerHTML = '<p class="muted">Estimación anual</p><p class="l-big num">' + U.soles(total, 0) + '</p><p>al año que dejaría de perder, unos <b class="num">' + U.soles(total / 12, 0) + '</b> al mes.</p>' +
        '<p class="formula">' + U.soles(v.inv, 0) + ' × ' + v.venc + '% que se vence = ' + U.soles(perdida, 0) + ' al año; × ' + v.red + '% evitado = ' + U.soles(evitada, 0) + ' + ' + v.horas + ' h × 12 meses × S/ ' + v.hora + ' = ' + U.soles(tiempo, 0) + '</p>' +
        '<p class="muted l-sup">Supuestos: los pone usted. Lo que se evita depende de actuar a tiempo con lo que el sistema avisa; 60% es un punto de partida, no una promesa.</p>';
    }
    el.querySelectorAll('[data-c]').forEach(i => i.oninput = pintar);
    pintar();
  }

  /* ===== Probar por rol ===== */
  function probar() {
    const sel = document.getElementById('plan-sel');
    const roles = document.getElementById('roles');
    let plan = 'completo';
    const R = [
      ['cajero', 'Cajera', 'Ana atiende a una clienta con receta, cobra con vuelto y cuadra su caja.', 'cobro', 'venta?sim=1'],
      ['qf', 'Químico farmacéutico', 'Milagros revisa los lotes por vencer, ingresa compras y el libro de recetas.', 'receta', 'vencimientos'],
      ['dueno', 'Dueña', 'Rosa ve el día, qué pedir, la ganancia real y quién hizo qué.', 'botica', 'tablero']
    ];
    sel.innerHTML = ['basico', 'control', 'completo'].map(k => '<button type="button" data-p="' + k + '">Plan ' + P.PLANES[k].nombre + '</button>').join('');
    function pintar() {
      sel.querySelectorAll('[data-p]').forEach(b => { b.classList.toggle('on', b.dataset.p === plan); b.setAttribute('aria-pressed', b.dataset.p === plan); });
      roles.innerHTML = R.map(r => {
        const bloq = r[0] === 'qf' && !P.PLANES[plan].mods.includes('inventario');
        return bloq ? '<div class="l-rol bloq">' + LF.illus(r[3], 56) + '<span><b>' + r[1] + '</b><small>Este rol viene desde el plan Control.</small></span></div>'
          : '<a class="l-rol" href="app.html?plan=' + plan + '&demo=' + r[0] + '#/' + r[4] + '">' + LF.illus(r[3], 56) + '<span><b>' + r[1] + '</b><small>' + r[2] + '</small></span>' + icon('arrowR') + '</a>';
      }).join('');
    }
    sel.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { plan = b.dataset.p; pintar(); });
    pintar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('l-logo').innerHTML = logo;
    tema();
    document.getElementById('btn-tema').onclick = () => tema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('wa-cierre').href = wa('Hola, vi el demo de LifeFarma y quiero verlo con los productos de mi botica.');
    widget(); planes(); calc(); probar();
  });
})();
