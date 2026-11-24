/* Arranque: plan (?plan=), rol (?demo=counter|transportista|jefe), navegación por hash, tema y atajos */
(function () {
  const LF = (window.LF = window.LF || {});
  LF.vistas = LF.vistas || {};
  const esc = LF.ui.esc, icon = LF.icon;

  const ROLES = {
    cajero: { persona: 'P1', etiqueta: 'Cajera', desc: 'Ana atiende en mostrador: vende por caja, blíster o unidad, cobra y cuadra su caja.', ill: 'cobro', nav: ['venta', 'ventas', 'caja', 'clientes', 'productos'], inicio: 'venta' },
    qf: { persona: 'P2', etiqueta: 'Químico farmacéutico', desc: 'Milagros controla lotes y vencimientos, ingresa las compras y revisa el libro de recetas.', ill: 'receta', nav: ['vencimientos', 'inventario', 'compras', 'recetas', 'venta', 'productos'], inicio: 'vencimientos', requiere: 'inventario' },
    dueno: { persona: 'P3', etiqueta: 'Dueña', desc: 'Rosa ve el día, lo que se vence, qué pedir, la ganancia real y quién hizo qué.', ill: 'botica', nav: ['tablero', 'ventas', 'vencimientos', 'inventario', 'compras', 'reposicion', 'reportes', 'gastos', 'clientes', 'productos', 'ajustes'], inicio: 'tablero' }
  };
  LF.ROLES = ROLES;
  LF.plan = LF.planes.planActual();

  const modDe = v => (LF.vistas[v] && LF.vistas[v].modulo) || null;
  const habilitada = v => { const m = modDe(v); return !m || LF.plan.mods.includes(m); };
  LF.tieneModulo = m => LF.plan.mods.includes(m);
  const puede = v => LF.sesion && ROLES[LF.sesion.rol].nav.includes(v);
  LF.puede = v => puede(v) && habilitada(v);

  function tema(t) {
    try { if (t) localStorage.setItem('lifefarma-tema', t); } catch (e) { /* sin almacenamiento */ }
    let v = 'light';
    try { v = localStorage.getItem('lifefarma-tema') || 'light'; } catch (e) { /* claro por defecto */ }
    document.documentElement.dataset.theme = v;
    const b = document.getElementById('btn-tema');
    if (b) { b.innerHTML = icon(v === 'dark' ? 'sun' : 'moon'); b.setAttribute('aria-label', v === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'); }
  }

  function rolInicial() {
    const q = new URLSearchParams(location.search).get('demo');
    if (q && ROLES[q]) { try { sessionStorage.setItem('lifefarma-rol', q); } catch (e) { /* */ } return q; }
    try { return sessionStorage.getItem('lifefarma-rol'); } catch (e) { return null; }
  }
  const rolDisponible = rol => !ROLES[rol].requiere || LF.tieneModulo(ROLES[rol].requiere);

  function iniciarSesion(rol) {
    const p = LF.store.persona(ROLES[rol].persona);
    LF.sesion = { rol, personaId: p.id, nombre: p.nombre, cargo: p.cargo, agencia: p.agencia, persona: p };
    document.body.dataset.rol = rol;
  }

  function itemNav(v, tab) {
    const def = LF.vistas[v];
    if (!def) return '';
    const bloq = !habilitada(v);
    const badge = !bloq && def.badge ? def.badge() : 0;
    const txt = tab ? (def.corto || def.menu || def.titulo) : (def.menu || def.titulo);
    return '<a href="#/' + v + '" data-v="' + v + '"' + (bloq ? ' class="bloq" title="Disponible en el plan ' + esc(LF.planes.planDe(def.modulo).nombre) + '"' : '') + '>' + icon(def.icono) + '<span>' + esc(txt) + '</span>' +
      (bloq ? icon('lock', 'ic-lock') : badge ? '<em class="num">' + badge + '</em>' : '') + '</a>';
  }

  function pintarNav() {
    const r = ROLES[LF.sesion.rol];
    document.getElementById('nav').innerHTML = r.nav.map(v => itemNav(v)).join('');
    const prim = r.nav.filter(habilitada).slice(0, r.nav.length <= 3 ? 3 : 4);
    const tb = document.getElementById('tabbar');
    tb.innerHTML = prim.map(v => itemNav(v, true)).join('') + (r.nav.length > prim.length ? '<button type="button" id="tab-mas">' + icon('menu') + '<span>Más</span></button>' : '');
    const mas = document.getElementById('tab-mas');
    if (mas) mas.onclick = abrirMas;
    const u = LF.sesion;
    document.getElementById('side-user').innerHTML = LF.ui.avatar(u.nombre) + '<div><b>' + esc(LF.ui.nombreCorto(u.nombre)) + '</b><span>' + esc(u.cargo) + '</span></div>';
    document.getElementById('btn-sim').hidden = u.rol === 'transportista';
    const plan = document.getElementById('plan-pill');
    plan.innerHTML = icon('box') + '<span>Plan ' + esc(LF.plan.nombre) + '</span>';
  }

  function abrirMas() {
    const r = ROLES[LF.sesion.rol];
    const p = LF.ui.panel('<div class="panel-h"><h2>Menú</h2><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">' + icon('x') + '</button></div><div class="panel-c mas-menu">' +
      r.nav.map(v => { const d = LF.vistas[v]; return '<a href="#/' + v + '" data-close>' + icon(d.icono) + esc(d.menu || d.titulo) + (habilitada(v) ? '' : icon('lock', 'ic-lock')) + '</a>'; }).join('') +
      '<hr><a href="#" data-cambiar data-close>' + icon('swap') + 'Cambiar de rol</a><a href="web.html">' + icon('globe') + 'Ver la web de la empresa</a><a href="index.html#planes">' + icon('box') + 'Ver los planes</a></div>');
    p.querySelector('[data-cambiar]').onclick = e => { e.preventDefault(); salir(); };
  }

  function ruta() {
    const h = location.hash.replace(/^#\/?/, '');
    const [v, qs] = h.split('?');
    return { vista: v, params: new URLSearchParams(qs || '') };
  }
  LF.ir = (v, params) => { location.hash = '#/' + v + (params ? '?' + new URLSearchParams(params) : ''); };

  /* Vista de módulo no incluido en el plan: explica qué hace y cómo probarlo */
  function renderBloqueada(el, v) {
    const def = LF.vistas[v];
    const mod = LF.planes.MODULOS[def.modulo];
    const plan = LF.planes.planDe(def.modulo);
    const claveP = Object.keys(LF.planes.PLANES).find(k => LF.planes.PLANES[k] === plan);
    const msg = encodeURIComponent('Hola, quiero cotizar el sistema LifeFarma con el módulo "' + mod.nombre + '".');
    el.innerHTML = '<div class="bloqueo">' + icon('lock') + '<h2>' + esc(mod.nombre) + ' no está en tu plan</h2><p>' + esc(mod.desc) + '</p><p class="muted">Viene desde el plan <b>' + esc(plan.nombre) + '</b>. Puedes probarlo ahora sin perder nada.</p>' +
      '<div class="fila"><a class="btn btn-primary" href="app.html?plan=' + claveP + '&demo=' + LF.sesion.rol + '#/' + v + '">Probar con plan ' + esc(plan.nombre) + '</a>' +
      '<a class="btn btn-line" target="_blank" rel="noopener" href="https://wa.me/' + LF.planes.WHATSAPP + '?text=' + msg + '">' + icon('whatsapp') + 'Cotizar por WhatsApp</a></div></div>';
  }

  function render() {
    if (!LF.sesion) return;
    LF.ui.cerrarPanel();
    let { vista, params } = ruta();
    const r = ROLES[LF.sesion.rol];
    if (!puede(vista)) { vista = r.nav.find(v => v === r.inicio && habilitada(v)) || r.nav.find(habilitada); history.replaceState(null, '', '#/' + vista); }
    const def = LF.vistas[vista];
    document.getElementById('titulo').textContent = def.titulo;
    document.title = def.titulo + ' · LifeFarma';
    document.querySelectorAll('#nav a, #tabbar a').forEach(a => a.classList.toggle('on', a.dataset.v === vista));
    // Nodo nuevo en cada render: así no se acumulan los eventos de la vista anterior
    const viejo = document.getElementById('vista');
    const el = viejo.cloneNode(false);
    viejo.replaceWith(el);
    el.className = 'vista v-' + vista;
    if (!habilitada(vista)) renderBloqueada(el, vista); else def.render(el, params);
    document.getElementById('main').scrollTop = 0;
    window.scrollTo(0, 0);
  }
  LF.refrescar = () => { pintarNav(); render(); };
  LF.refrescarNav = () => { pintarNav(); const { vista } = ruta(); document.querySelectorAll('#nav a, #tabbar a').forEach(a => a.classList.toggle('on', a.dataset.v === vista)); };

  function salir() {
    try { sessionStorage.removeItem('lifefarma-rol'); } catch (e) { /* */ }
    LF.sesion = null;
    history.replaceState(null, '', location.pathname);
    mostrarSelector();
  }

  function logo(claro) {
    return '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--brand)"/><path d="M13 7.5h6v5.5h5.5v6H19v5.5h-6V19H7.5v-6H13z" fill="#fff"/></svg><span class="logo-t' + (claro ? ' oscuro' : '') + '">Life<b>Farma</b></span>';
  }
  LF.logo = logo;

  function mostrarSelector() {
    document.body.classList.add('en-selector');
    const s = document.getElementById('selector');
    s.hidden = false;
    const db = LF.store.db;
    const card = rol => {
      const R = ROLES[rol];
      if (!rolDisponible(rol)) {
        const p = LF.planes.planDe(R.requiere);
        return '<div class="rol rol-bloq">' + LF.illus(R.ill, 56) + '<span><b>' + esc(R.etiqueta) + '</b><span>' + esc(R.desc) + '</span><span class="rol-nota">' + icon('lock') + 'Disponible desde el plan ' + esc(p.nombre) + '</span></span></div>';
      }
      return '<button class="rol" data-rol="' + rol + '">' + LF.illus(R.ill, 56) + '<span><b>' + esc(R.etiqueta) + '</b><span>' + esc(R.desc) + '</span></span>' + icon('arrowR') + '</button>';
    };
    s.innerHTML = '<div class="sel-box"><a class="marca" href="web.html" aria-label="Ir a la web de LifeFarma">' + logo(true) + '</a>' +
      '<h1>¿Con qué rol quieres entrar?</h1><p class="sel-sub">Sistema interno de <b>' + esc(db.empresa.razon) + '</b>, con ' + db.productos.length + ' productos y ' + LF.ui.num(db.ventas.length) + ' ventas de los últimos 30 días. Estás probando el <b>plan ' + esc(LF.plan.nombre) + '</b>.</p>' +
      '<div class="roles">' + Object.keys(ROLES).map(card).join('') + '</div>' +
      '<p class="sel-nota">' + icon('alert') + 'Demo con datos ficticios: SUNAT, RENIEC y los mensajes de WhatsApp son simulados.</p>' +
      '<p class="sel-links"><a href="web.html">' + icon('arrowL') + 'Volver a la web</a><a href="index.html#planes">Ver los planes</a></p></div>';
    s.querySelectorAll('[data-rol]').forEach(b => b.onclick = () => {
      try { sessionStorage.setItem('lifefarma-rol', b.dataset.rol); } catch (e) { /* */ }
      history.replaceState(null, '', location.pathname + '?demo=' + b.dataset.rol);
      entrar(b.dataset.rol);
    });
  }

  function entrar(rol) {
    if (!rolDisponible(rol)) { mostrarSelector(); return; }
    iniciarSesion(rol);
    document.getElementById('selector').hidden = true;
    document.body.classList.remove('en-selector');
    pintarNav();
    if (!location.hash) { const r = ROLES[rol]; location.hash = '#/' + (habilitada(r.inicio) ? r.inicio : r.nav.find(habilitada)); } else render();
  }

  function atajos(e) {
    if (!LF.sesion || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.key === 'Escape') { LF.ui.cerrarPanel(); return; }
    if (e.key === '/') { const s = document.querySelector('#vista [data-buscar]'); if (s) { e.preventDefault(); s.focus(); } }
    if ((e.key === 'n' || e.key === 'N') && LF.puede('venta')) { e.preventDefault(); LF.ir('venta'); }
    if (e.key === '?') { e.preventDefault(); ayudaAtajos(); }
  }
  function ayudaAtajos() {
    LF.ui.modal('Atajos de teclado', '<dl class="atajos"><dt><kbd>/</kbd></dt><dd>Buscar en la pantalla</dd><dt><kbd>N</kbd></dt><dd>Nueva venta</dd><dt><kbd>F2</kbd></dt><dd>Cobrar (en Caja rápida)</dd><dt><kbd>Esc</kbd></dt><dd>Cerrar el detalle</dd><dt><kbd>?</kbd></dt><dd>Ver esta ayuda</dd></dl><p class="muted">También puedes usar un lector de código de barras en cualquier buscador: lee el código de la caja del producto.</p>', [['ok', 'Entendido', 'btn-dark']]);
  }

  function init() {
    tema();
    LF.store.init();
    document.getElementById('side-logo').innerHTML = logo();
    document.getElementById('btn-tema').onclick = () => tema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('btn-salir').onclick = salir;
    document.getElementById('btn-atajos').onclick = ayudaAtajos;
    document.getElementById('btn-sim').onclick = () => {
      if (LF.sesion.rol === 'cajero' || LF.sesion.rol === 'qf') { LF.venta.simularCarrito(); return; }
      const v = LF.venta.simularVenta();
      LF.ui.toast('Nueva venta ' + v.serie + '-' + v.num + ' por ' + LF.ui.soles(v.total) + ' en caja', 'info');
      LF.refrescar();
    };
    window.addEventListener('hashchange', render);
    document.addEventListener('keydown', atajos);
    const rol = rolInicial();
    if (rol && ROLES[rol] && rolDisponible(rol)) entrar(rol); else mostrarSelector();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
