'use strict';

/* =====================================================================
   Demo del Sistema para Boticas — un solo archivo para los 3 planes.
   El plan se elige con ?plan=basico|control|completo.
   Todo vive en memoria: al recargar la página la demo vuelve a empezar.
   ===================================================================== */

/* ---------------- Plan ---------------- */
const PLANES = {
  basico:   { nombre: 'Plan Básico',   nivel: 1 },
  control:  { nombre: 'Plan Control',  nivel: 2 },
  completo: { nombre: 'Plan Completo', nivel: 3 },
};
const NIVEL_KEY = { 1: 'basico', 2: 'control', 3: 'completo' };
const planParam = new URLSearchParams(location.search).get('plan');
const PLAN_KEY = PLANES[planParam] ? planParam : 'basico';
const PLAN = PLANES[PLAN_KEY];
const tiene = nivel => PLAN.nivel >= nivel;

/* ---------------- Utilidades ---------------- */
const $ = s => document.querySelector(s);
const HOY = new Date(); HOY.setHours(12, 0, 0, 0);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const HOY_ISO = iso(HOY);
const fmtFecha = s => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
const diasHasta = s => Math.round((new Date(s + 'T12:00:00') - HOY) / 86400000);
const round2 = n => Math.round(n * 100) / 100;
const soles = n => 'S/ ' + Number(n).toFixed(2);
const pad = n => String(n).padStart(8, '0');
const horaAhora = () => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = rng(20261102);

/* ---------------- Datos de prueba ---------------- */
const PROVEEDORES = [
  { id: 1, nombre: 'Droguería Andina' },
  { id: 2, nombre: 'Distribuidora Salud Perú' },
  { id: 3, nombre: 'Medisur Mayorista' },
];
const provNombre = id => PROVEEDORES.find(p => p.id === id).nombre;

// Presentaciones: caja de 100 (10 blísteres de 10) o un solo envase.
const CAJA = (u, pc, pb, pu) => [
  { tipo: 'Caja', unidades: u, precio: pc },
  { tipo: 'Blíster', unidades: 10, precio: pb },
  { tipo: 'Unidad', unidades: 1, precio: pu },
];
const SOLO = (tipo, p) => [{ tipo, unidades: 1, precio: p }];

// lotes: [lote, días para vencer, unidades] · provs: precio por caja (o por envase) de cada proveedor
const PRODUCTOS = [
  { id: 1, nombre: 'Paracetamol 500 mg', lab: 'Tabletas · Genérico', pres: CAJA(100, 12, 1.5, 0.2), costoU: 0.08, min: 100, lotes: [['PA2401', 420, 200], ['PA2403', 25, 140]], provs: { 1: 7.8, 2: 8.2, 3: 8.5 }, vend30: 900 },
  { id: 2, nombre: 'Ibuprofeno 400 mg', lab: 'Tabletas · Genérico', pres: CAJA(100, 18, 2.2, 0.3), costoU: 0.12, min: 100, lotes: [['IB2312', 300, 260]], provs: { 1: 12.5, 2: 11.9, 3: 12.8 }, vend30: 600 },
  { id: 3, nombre: 'Amoxicilina 500 mg', lab: 'Cápsulas · Genérico', pres: CAJA(100, 35, 4, 0.5), costoU: 0.22, min: 100, lotes: [['AM2402', 60, 80]], provs: { 1: 22, 2: 23.5, 3: 21.4 }, vend30: 450 },
  { id: 4, nombre: 'Antigripal tabletas', lab: 'Tabletas · Genérico', pres: CAJA(100, 42, 5, 0.6), costoU: 0.3, min: 50, lotes: [['AG2311', 15, 40], ['AG2405', 500, 100]], provs: { 1: 30, 2: 29, 3: 31 }, vend30: 300 },
  { id: 5, nombre: 'Omeprazol 20 mg', lab: 'Cápsulas · Genérico', pres: CAJA(100, 15, 2, 0.3), costoU: 0.1, min: 100, lotes: [['OM2404', 380, 500]], provs: { 1: 10, 2: 10.5, 3: 9.6 }, vend30: 380 },
  { id: 6, nombre: 'Loratadina 10 mg', lab: 'Tabletas · Genérico', pres: CAJA(100, 10, 1.2, 0.2), costoU: 0.06, min: 50, lotes: [['LO2310', 45, 60]], provs: { 1: 6, 2: 5.8, 3: 6.3 }, vend30: 200 },
  { id: 7, nombre: 'Diclofenaco 50 mg', lab: 'Tabletas · Genérico', pres: CAJA(100, 9, 1.2, 0.15), costoU: 0.05, min: 100, lotes: [['DI2402', 600, 300]], provs: { 1: 5, 2: 5.2, 3: 4.8 }, vend30: 250 },
  { id: 8, nombre: 'Metformina 850 mg', lab: 'Tabletas · Genérico', pres: CAJA(100, 14, 1.8, 0.25), costoU: 0.09, min: 100, lotes: [['ME2401', 280, 90]], provs: { 1: 9, 2: 8.6, 3: 9.4 }, vend30: 500 },
  { id: 9, nombre: 'Mascarilla KN95', lab: 'Caja x 20', pres: [{ tipo: 'Caja', unidades: 20, precio: 15 }, { tipo: 'Unidad', unidades: 1, precio: 1 }], costoU: 0.4, min: 40, lotes: [['MK2401', 900, 120]], provs: { 1: 8, 2: 7.5, 3: 8.4 }, vend30: 150 },
  { id: 10, nombre: 'Alcohol 70° 1 L', lab: 'Frasco', pres: SOLO('Frasco', 8.5), costoU: 5.2, min: 10, lotes: [['AL2402', 700, 24]], provs: { 1: 5.2, 2: 5.0, 3: 5.4 }, vend30: 40 },
  { id: 11, nombre: 'Suero oral 625 ml', lab: 'Botella', pres: SOLO('Botella', 6.5), costoU: 4.1, min: 12, lotes: [['SU2403', 20, 8]], provs: { 1: 4.1, 2: 4.3, 3: 3.9 }, vend30: 60 },
  { id: 12, nombre: 'Vitamina C 1 g efervescente', lab: 'Tubo x 10', pres: SOLO('Tubo', 12), costoU: 7, min: 5, lotes: [['VC2312', 200, 15]], provs: { 1: 7, 2: 6.8, 3: 7.3 }, vend30: 20 },
  { id: 13, nombre: 'Amoxicilina 250 mg/5 ml', lab: 'Suspensión · Frasco', pres: SOLO('Frasco', 9.5), costoU: 5.5, min: 6, lotes: [['AS2402', 75, 10]], provs: { 1: 5.5, 2: 5.7, 3: 5.3 }, vend30: 30 },
  { id: 14, nombre: 'Gasa estéril 10 x 10 cm', lab: 'Sobre', pres: SOLO('Sobre', 1.5), costoU: 0.6, min: 20, lotes: [['GA2401', 800, 50]], provs: { 1: 0.6, 2: 0.55, 3: 0.65 }, vend30: 80 },
];
PRODUCTOS.forEach(p => {
  p.cod = '77500000000' + String(p.id).padStart(2, '0');
  p.lotes = p.lotes.map(([lote, dias, cant]) => ({ lote, vence: iso(addDays(HOY, dias)), cant }));
});
const prod = id => PRODUCTOS.find(p => p.id === id);
const stockDe = p => p.lotes.reduce((a, l) => a + l.cant, 0);
const cajaDe = p => p.pres.find(x => x.unidades > 1);

const PERMISOS = [
  { id: 'vender', label: 'Vender' },
  { id: 'anular', label: 'Anular ventas' },
  { id: 'compras', label: 'Ingresar compras' },
  { id: 'ajustar', label: 'Ajustar stock' },
  { id: 'reportes', label: 'Ver reportes' },
  { id: 'gastos', label: 'Registrar gastos' },
  { id: 'usuarios', label: 'Administrar usuarios' },
];
const TODOS = PERMISOS.map(p => p.id);
const USUARIOS = [
  { id: 1, nombre: 'Rosa', rol: 'Dueño', perms: [...TODOS] },
  { id: 2, nombre: 'Luis', rol: 'Cajero', perms: ['vender', 'compras'] },
  { id: 3, nombre: 'Ana', rol: 'Cajero', perms: ['vender'] },
];
const USUARIO_UNICO = { id: 0, nombre: 'Botica', rol: '', perms: [...TODOS] };

/* ---------------- Estado ---------------- */
const S = {
  usuario: null,
  cajas: {}, cajaSeq: 0,
  vista: 'vender',
  busqueda: '',
  carrito: [], tipoDoc: 'Boleta', cobro: null,
  ventas: [], ventaSeq: 0,
  serieB: 145, serieF: 32, serieNC: 5,
  kardex: [], cierres: [], ultimoCierre: null,
  compraLista: [], compraPre: null,
  gastos: [], periodo: '7',
};
const cajaActual = () => S.usuario && S.cajas[S.usuario.id];
const puede = perm => !!S.usuario && S.usuario.perms.includes(perm);

// Kardex inicial: inventario, una compra y las ventas de ayer, cuadrando con el stock actual.
PRODUCTOS.forEach(p => {
  const stock = stockDe(p);
  const ayer = Math.round(p.vend30 / 30);
  let entrada = Math.round(p.vend30 / 2);
  let inicial = stock + ayer - entrada;
  if (inicial < 0) { entrada = stock + ayer; inicial = 0; }
  S.kardex.push({ pid: p.id, fecha: iso(addDays(HOY, -30)), tipo: 'Inventario inicial', detalle: 'Conteo inicial', cant: inicial });
  S.kardex.push({ pid: p.id, fecha: iso(addDays(HOY, -12)), tipo: 'Compra', detalle: `F001-${4200 + p.id} · ${PROVEEDORES[p.id % 3].nombre}`, cant: entrada });
  S.kardex.push({ pid: p.id, fecha: iso(addDays(HOY, -1)), tipo: 'Venta', detalle: 'Ventas del día', cant: -ayer });
});

// Ventas de esta mañana (ya descontadas del stock).
const mkItem = (p, i, cant) => ({ pid: p.id, nombre: p.nombre, pres: p.pres[i].tipo, unidades: p.pres[i].unidades, precio: p.pres[i].precio, cant, devueltos: 0 });
const vendedorSeed = tiene(3) ? 'Luis' : USUARIO_UNICO.nombre;
[
  ['08:15', [[1, 1, 1], [11, 0, 1]], 'Efectivo'],
  ['09:02', [[3, 1, 2]], 'Yape'],
  ['09:40', [[4, 1, 1], [1, 2, 4]], 'Efectivo'],
  ['10:05', [[9, 0, 1], [10, 0, 1]], 'Tarjeta'],
  ['10:30', [[5, 0, 1]], 'Plin'],
].forEach(([hora, items, metodo]) => {
  const its = items.map(([pid, i, c]) => mkItem(prod(pid), i, c));
  const total = round2(its.reduce((a, it) => a + it.precio * it.cant, 0));
  S.ventas.unshift({
    id: ++S.ventaSeq, doc: 'Boleta', numero: `B001-${pad(++S.serieB)}`, fecha: HOY_ISO, hora,
    cliente: { tipo: '', num: '', nombre: 'Clientes varios' }, items: its, total, metodo,
    recibido: total, vuelto: 0, estado: 'Aceptado', usuario: vendedorSeed, cajaId: 0, devuelto: 0,
  });
});

// Historial de los últimos 29 días para resúmenes y reportes.
const HIST = [];
for (let i = 29; i >= 1; i--) {
  const d = addDays(HOY, -i);
  let v = 650 + rand() * 450;
  if (d.getDay() === 0) v *= 0.6;
  HIST.push({ fecha: iso(d), ventas: round2(v), costo: round2(v * 0.63) });
}

S.gastos = [
  { fecha: iso(addDays(HOY, -28)), tipo: 'Alquiler', monto: 1200, detalle: 'Local' },
  { fecha: iso(addDays(HOY, -27)), tipo: 'Sueldos', monto: 1130, detalle: 'Luis' },
  { fecha: iso(addDays(HOY, -27)), tipo: 'Sueldos', monto: 1130, detalle: 'Ana' },
  { fecha: iso(addDays(HOY, -20)), tipo: 'Luz', monto: 185.4, detalle: 'Recibo del mes' },
  { fecha: iso(addDays(HOY, -18)), tipo: 'Agua', monto: 48.9, detalle: 'Recibo del mes' },
  { fecha: iso(addDays(HOY, -15)), tipo: 'Internet', monto: 89, detalle: 'Plan fibra' },
  { fecha: iso(addDays(HOY, -6)), tipo: 'Otro', monto: 35, detalle: 'Bolsas y útiles' },
].reverse();

if (tiene(3)) {
  S.cierres.push(
    { fecha: HOY_ISO, usuario: 'Luis', apertura: '08:00', cierre: '13:00', fondo: 100, total: 67.3, esperado: 113.8, contado: 113.8, diferencia: 0 },
    { fecha: iso(addDays(HOY, -1)), usuario: 'Ana', apertura: '14:00', cierre: '21:00', fondo: 100, total: 512.4, esperado: 398.6, contado: 396.1, diferencia: -2.5 },
    { fecha: iso(addDays(HOY, -1)), usuario: 'Luis', apertura: '08:00', cierre: '14:00', fondo: 100, total: 446.2, esperado: 352.0, contado: 352.0, diferencia: 0 },
  );
}

/* ---------------- Stock ---------------- */
function plural(t, n) { t = t.toLowerCase(); return n === 1 ? t : t + (/[aeiou]$/.test(t) ? 's' : 'es'); }
function fmtStock(p, u = stockDe(p)) {
  const caja = cajaDe(p);
  if (!caja) return `${u} ${plural(p.pres[0].tipo, u)}`;
  const c = Math.floor(u / caja.unidades), r = u % caja.unidades;
  return [c ? `${c} ${plural('caja', c)}` : '', r ? `${r} unid.` : ''].filter(Boolean).join(' + ') || '0';
}
function descontar(p, unidades, tipo, detalle) {
  let resto = unidades;
  p.lotes.sort((a, b) => a.vence.localeCompare(b.vence)); // primero vence, primero sale
  for (const l of p.lotes) { const t = Math.min(l.cant, resto); l.cant -= t; resto -= t; if (!resto) break; }
  p.lotes = p.lotes.filter(l => l.cant > 0);
  S.kardex.push({ pid: p.id, fecha: HOY_ISO, hora: horaAhora(), tipo, detalle, cant: -unidades });
}
function reponer(p, unidades, tipo, detalle) {
  if (p.lotes.length) p.lotes[p.lotes.length - 1].cant += unidades;
  else p.lotes.push({ lote: 'DEV', vence: iso(addDays(HOY, 365)), cant: unidades });
  S.kardex.push({ pid: p.id, fecha: HOY_ISO, hora: horaAhora(), tipo, detalle, cant: unidades });
}
function stockBadge(p) {
  const s = stockDe(p);
  if (!s) return '<span class="badge danger">Agotado</span>';
  if (s <= p.min) return `<span class="badge warn">Quedan ${fmtStock(p)}</span>`;
  return `<span class="badge ok">Stock: ${fmtStock(p)}</span>`;
}
const pocoStock = () => PRODUCTOS.filter(p => stockDe(p) <= p.min).sort((a, b) => stockDe(a) / a.min - stockDe(b) / b.min);
const porVencer = () => PRODUCTOS.flatMap(p => p.lotes.map(l => ({ p, l, dias: diasHasta(l.vence) })))
  .filter(x => x.dias <= 90).sort((a, b) => a.dias - b.dias);
const contarAlertas = () => pocoStock().length + porVencer().length;

/* ---------------- Ventas ---------------- */
const venta = id => S.ventas.find(v => v.id === id);
const neto = v => v.estado === 'Anulada' ? 0 : round2(v.total - v.devuelto);
const ventasHoy = () => S.ventas.filter(v => v.fecha === HOY_ISO);
const costoVenta = v => v.estado === 'Anulada' ? 0 : v.items.reduce((a, it) => a + (it.cant - it.devueltos) * it.unidades * prod(it.pid).costoU, 0);
const totalCarrito = () => round2(S.carrito.reduce((a, it) => a + it.precio * it.cant, 0));
const unidadesEnCarrito = pid => S.carrito.filter(it => it.pid === pid).reduce((a, it) => a + it.unidades * it.cant, 0);

/* =====================================================================
   Estructura: barra superior, menú y vistas
   ===================================================================== */
const VISTAS = [
  { id: 'vender', label: 'Vender', icon: '🛒', nivel: 1, perm: 'vender', render: vVender, after: afterVender },
  { id: 'ventas', label: 'Ventas del día', icon: '🧾', nivel: 1, perm: 'vender', render: vVentas },
  { id: 'stock', label: 'Stock', icon: '📦', nivel: 2, perm: 'vender', render: vStock, after: afterStock },
  { id: 'alertas', label: 'Alertas', icon: '⚠️', nivel: 2, perm: 'vender', render: vAlertas, badge: contarAlertas },
  { id: 'compra', label: 'Ingresar compra', icon: '🚚', nivel: 2, perm: 'compras', render: vCompra, after: afterCompra },
  { id: 'sugerencias', label: 'Sugerencias de compra', icon: '💡', nivel: 3, perm: 'compras', render: vSugerencias },
  { id: 'gastos', label: 'Gastos', icon: '💸', nivel: 3, perm: 'gastos', render: vGastos },
  { id: 'resumen', label: 'Resumen', icon: '📈', nivel: 1, hasta: 2, perm: 'reportes', render: vResumen },
  { id: 'reportes', label: 'Reportes', icon: '📊', nivel: 3, perm: 'reportes', render: vReportes },
  { id: 'usuarios', label: 'Usuarios', icon: '👥', nivel: 3, perm: 'usuarios', render: vUsuarios },
  { sep: true },
  { id: 'caja', label: 'Cerrar caja', icon: '💵', nivel: 1, perm: 'vender', render: vCaja, after: afterCaja },
];

function render() {
  renderTop();
  renderNav();
  const v = VISTAS.find(x => x.id === S.vista);
  $('#main').innerHTML = v.render();
  if (v.after) v.after();
}
function ir(id) { S.vista = id; render(); window.scrollTo(0, 0); }

function renderTop() {
  const caja = cajaActual();
  $('#topbar').innerHTML = `
    <div class="brand"><span class="logo">✚</span> Botica Demo <span class="pill ${PLAN_KEY}">${PLAN.nombre}</span></div>
    <div class="top-right">
      ${caja
        ? `<span class="caja-pill abierta">● Caja abierta desde ${caja.apertura}</span>`
        : `<button class="caja-pill cerrada" style="border:none" onclick="abrirCajaModal()">● Caja cerrada · Abrir</button>`}
      ${tiene(3) && S.usuario ? `<span class="user-chip"><span class="avatar">${S.usuario.nombre[0]}</span>${S.usuario.nombre} <span class="muted">(${S.usuario.rol})</span></span>
        <button class="btn btn-sm" onclick="mostrarLogin()">Cambiar usuario</button>` : ''}
      <a class="btn btn-sm" href="index.html">Ver los 3 planes</a>
    </div>`;
}

function renderNav() {
  if (!S.usuario) { $('#nav').innerHTML = ''; return; }
  $('#nav').innerHTML =VISTAS.filter(v => !(v.hasta && PLAN.nivel > v.hasta)).map(v => {
    if (v.sep) return '<div class="nav-sep"></div>';
    const inner = `<span class="ico">${v.icon}</span><span>${v.label}</span>`;
    if (!tiene(v.nivel)) return `<button class="nav-item locked" onclick="mostrarBloqueado(${v.nivel}, '${v.label}')">${inner}<span class="tag">${PLANES[NIVEL_KEY[v.nivel]].nombre.replace('Plan ', '')}</span></button>`;
    if (!puede(v.perm)) return `<button class="nav-item locked" onclick="sinPermiso()">${inner}<span class="tag">🔒</span></button>`;
    const n = v.badge ? v.badge() : 0;
    return `<button class="nav-item ${S.vista === v.id ? 'active' : ''}" onclick="ir('${v.id}')">${inner}${n ? `<span class="count">${n}</span>` : ''}</button>`;
  }).join('');
}

function mostrarBloqueado(nivel, label) {
  const k = NIVEL_KEY[nivel];
  modal(`<h2>${label}</h2>
    <p>Esta función viene en el <strong>${PLANES[k].nombre}</strong>.</p>
    <p class="muted">Puede cambiar de plan cuando quiera, sin perder sus ventas ni sus productos.</p>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Seguir aquí</button>
    <a class="btn btn-primary" href="app.html?plan=${k}">Ver demo del ${PLANES[k].nombre}</a></div>`);
}
function sinPermiso() { toast('Su usuario no tiene permiso para esto. Pida acceso al dueño.', 'error'); }

/* ---------------- Modal y avisos ---------------- */
function modal(html, opts = {}) {
  const bg = $('#modal');
  bg.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">
    ${opts.fixed ? '' : '<button class="modal-x" onclick="closeModal()" aria-label="Cerrar">×</button>'}${html}</div>`;
  bg.hidden = false;
  bg.dataset.fixed = opts.fixed ? '1' : '';
  const f = bg.querySelector('input:not([type=checkbox]), select');
  if (f) setTimeout(() => f.focus(), 30);
}
function closeModal() {
  const bg = $('#modal');
  bg.hidden = true; bg.innerHTML = '';
  const b = $('#buscar'); if (b) b.focus();
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal').hidden && !$('#modal').dataset.fixed) closeModal();
});
function toast(msg, tipo = 'ok') {
  const t = document.createElement('div');
  t.className = 'toast ' + tipo; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), 3600);
  setTimeout(() => t.remove(), 4000);
}

/* ---------------- Usuarios y caja ---------------- */
function mostrarLogin() {
  modal(`<h2>¿Quién va a atender?</h2><p class="muted">Cada persona entra con su propio usuario.</p>
    <div class="users">${USUARIOS.map(u => `<button class="user-card" id="uc${u.id}" onclick="elegirUsuario(${u.id})">
      <span class="avatar">${u.nombre[0]}</span><strong>${esc(u.nombre)}</strong><span class="muted">${u.rol}</span></button>`).join('')}</div>
    <div id="pin-box"></div>`, { fixed: !S.usuario });
}
function elegirUsuario(id) {
  document.querySelectorAll('.user-card').forEach(b => b.classList.toggle('on', b.id === 'uc' + id));
  const u = USUARIOS.find(x => x.id === id);
  $('#pin-box').innerHTML = `<label class="lbl" for="pin">Clave de ${esc(u.nombre)}</label>
    <input id="pin" type="password" inputmode="numeric" maxlength="4" value="1234">
    <p class="hint">Clave de prueba: 1234</p>
    <button class="btn btn-primary btn-xl" onclick="entrar(${id})">Entrar</button>`;
  $('#pin').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(id); });
  $('#pin').focus();
}
function entrar(id) {
  if ($('#pin').value !== '1234') return toast('Clave incorrecta. En la demo es 1234.', 'error');
  S.usuario = USUARIOS.find(x => x.id === id);
  S.carrito = [];
  closeModal();
  const v = VISTAS.find(x => x.id === S.vista);
  if (!puede(v.perm)) S.vista = 'vender';
  render();
  toast(`Hola, ${S.usuario.nombre}`);
  if (!cajaActual()) abrirCajaModal();
}

function abrirCajaModal() {
  modal(`<h2>Abrir caja</h2>
    <p>Escriba el dinero con el que empieza el día (el sencillo para dar vuelto).</p>
    <label class="lbl" for="fondo">Monto inicial</label>
    <div class="money"><span>S/</span><input id="fondo" type="number" min="0" step="0.10" value="100.00"></div>
    <div class="modal-actions"><button class="btn btn-ok btn-xl" onclick="confirmarApertura()">Abrir caja</button></div>`);
  $('#fondo').addEventListener('keydown', e => { if (e.key === 'Enter') confirmarApertura(); });
}
function confirmarApertura() {
  const fondo = parseFloat($('#fondo').value);
  if (!(fondo >= 0)) return toast('Escriba un monto válido', 'error');
  S.cajas[S.usuario.id] = { id: ++S.cajaSeq, usuario: S.usuario.nombre, fondo: round2(fondo), apertura: horaAhora() };
  closeModal();
  toast(`Caja abierta con ${soles(fondo)}`);
  render();
}

/* =====================================================================
   VENDER
   ===================================================================== */
function vVender() {
  return `<div class="pos">
    <section>
      <div class="search-box"><span aria-hidden="true">🔍</span>
        <input id="buscar" autocomplete="off" placeholder="Escriba el nombre o pase el lector" value="${esc(S.busqueda)}" aria-label="Buscar producto"></div>
      <p class="hint">Pruebe escribiendo <b>para</b> o <b>amoxi</b>, o pegue el código <b>7750000000011</b> y pulse Enter.</p>
      <div id="resultados" class="grid-prod"></div>
    </section>
    <aside class="card pos-cart">
      <div class="seg-group">
        <button class="seg ${S.tipoDoc === 'Boleta' ? 'on' : ''}" onclick="setDoc('Boleta')">Boleta</button>
        <button class="seg ${S.tipoDoc === 'Factura' ? 'on' : ''}" onclick="setDoc('Factura')">Factura</button>
      </div>
      <div id="carrito"></div>
    </aside>
  </div>`;
}
function afterVender() {
  const i = $('#buscar');
  i.addEventListener('input', () => { S.busqueda = i.value; pintarResultados(); });
  i.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const exacto = PRODUCTOS.find(p => p.cod === i.value.trim());
    const r = exacto ? [exacto] : filtrar();
    if (r.length === 1) { i.value = ''; S.busqueda = ''; pintarResultados(); elegirPresentacion(r[0].id); }
  });
  i.focus();
  pintarResultados();
  pintarCarrito();
}
function filtrar() {
  const q = norm(S.busqueda.trim());
  return q ? PRODUCTOS.filter(p => norm(p.nombre).includes(q) || p.cod.includes(q)) : PRODUCTOS;
}
function pintarResultados() {
  const r = filtrar();
  $('#resultados').innerHTML = r.length ? r.map(p => `
    <button class="prod" onclick="elegirPresentacion(${p.id})">
      <strong>${esc(p.nombre)}</strong><span class="muted">${esc(p.lab)}</span>
      <span class="precios">${p.pres.map(x => `${x.tipo} ${soles(x.precio)}`).join(' · ')}</span>
      ${tiene(2) ? stockBadge(p) : ''}
    </button>`).join('') : '<div class="empty card">No se encontró ningún producto con ese nombre.</div>';
}
function setDoc(t) { S.tipoDoc = t; render(); }

function elegirPresentacion(id) {
  const p = prod(id);
  if (p.pres.length === 1) return agregar(id, 0);
  const disp = stockDe(p) - unidadesEnCarrito(id);
  modal(`<h2>${esc(p.nombre)}</h2><p class="muted">¿Cómo lo vende?</p>
    <div class="pres-grid">${p.pres.map((x, i) => `
      <button class="pres" onclick="agregar(${p.id}, ${i}); closeModal()" ${tiene(2) && disp < x.unidades ? 'disabled style="opacity:.45"' : ''}>
        <span class="pres-tipo">${x.tipo}</span>
        <span class="pres-precio">${soles(x.precio)}</span>
        <span class="muted">${x.unidades > 1 ? x.unidades + ' unidades' : '1 unidad'}</span>
        ${tiene(2) ? `<span class="muted">Hay: ${Math.floor(disp / x.unidades)}</span>` : ''}
      </button>`).join('')}</div>`);
}
function agregar(pid, i) {
  const p = prod(pid), pr = p.pres[i];
  if (tiene(2) && stockDe(p) - unidadesEnCarrito(pid) < pr.unidades) return toast('No hay stock suficiente de ' + p.nombre, 'error');
  const linea = S.carrito.find(it => it.pid === pid && it.pres === pr.tipo);
  if (linea) linea.cant++; else S.carrito.push(mkItem(p, i, 1));
  pintarCarrito();
  if (tiene(2)) pintarResultados();
  toast(`Agregado: ${pr.tipo} de ${p.nombre}`);
}
function cambiarCant(k, d) {
  const it = S.carrito[k];
  if (d > 0 && tiene(2) && stockDe(prod(it.pid)) - unidadesEnCarrito(it.pid) < it.unidades) return toast('No hay más stock', 'error');
  it.cant += d;
  if (it.cant < 1) S.carrito.splice(k, 1);
  pintarCarrito();
}
function quitar(k) { S.carrito.splice(k, 1); pintarCarrito(); }
function vaciar() { S.carrito = []; pintarCarrito(); }
function pintarCarrito() {
  const c = S.carrito, total = totalCarrito();
  $('#carrito').innerHTML = (c.length ? `<ul class="cart">${c.map((it, k) => `
      <li>
        <div class="cart-name"><strong>${esc(it.nombre)}</strong><span class="muted">${it.pres} · ${soles(it.precio)}</span></div>
        <button class="x" onclick="quitar(${k})" aria-label="Quitar">×</button>
        <div class="stepper"><button onclick="cambiarCant(${k}, -1)" aria-label="Menos">−</button><span>${it.cant}</span><button onclick="cambiarCant(${k}, 1)" aria-label="Más">+</button></div>
        <div class="cart-sub">${soles(it.precio * it.cant)}</div>
      </li>`).join('')}</ul>`
    : '<div class="empty">Aún no hay productos.<br>Busque uno para empezar.</div>')
    + `<div class="total"><span>Total</span><strong>${soles(total)}</strong></div>
    ${total > 700 && S.tipoDoc === 'Boleta' ? '<p class="note warn">Pasa de S/ 700: se pedirá el DNI del cliente.</p>' : ''}
    <button class="btn btn-primary btn-xl" ${c.length ? '' : 'disabled'} onclick="abrirCobro()">Cobrar</button>
    ${c.length ? '<button class="btn-link" onclick="vaciar()">Vaciar la venta</button>' : ''}`;
}

/* ---------------- Cobro ---------------- */
const METODOS = [['Efectivo', '💵'], ['Yape', '📱'], ['Plin', '📲'], ['Tarjeta', '💳']];
function abrirCobro() {
  if (!cajaActual()) { toast('Primero abra la caja', 'error'); return abrirCajaModal(); }
  const total = totalCarrito();
  S.cobro = { metodo: 'Efectivo', cliente: null };
  const esF = S.tipoDoc === 'Factura', pideDni = !esF && total > 700;
  const tipoDocCli = esF ? 'RUC' : 'DNI';
  const rapidos = [10, 20, 50, 100, 200].filter(x => x >= total);
  modal(`<h2>Cobrar ${S.tipoDoc.toLowerCase()}</h2>
    <div class="cobro-total"><span>Total a cobrar</span><strong>${soles(total)}</strong></div>
    ${pideDni ? '<div class="note warn">La venta pasa de S/ 700. SUNAT pide el DNI del cliente.</div>' : ''}
    <label class="lbl" for="docnum">${esF ? 'RUC del cliente' : pideDni ? 'DNI del cliente' : 'DNI del cliente (opcional)'}</label>
    <div class="row"><input id="docnum" class="grow" type="text" inputmode="numeric" maxlength="${esF ? 11 : 8}" placeholder="${esF ? '11 dígitos, ej. 20123456789' : '8 dígitos, ej. 45678912'}" style="flex:1;width:auto">
      <button class="btn" onclick="buscarCliente('${tipoDocCli}')">Buscar</button></div>
    <div id="cli-res"></div>
    <label class="lbl">Forma de pago</label>
    <div class="metodos">${METODOS.map(([m, ic]) => `<button class="metodo ${m === 'Efectivo' ? 'on' : ''}" data-m="${m}" onclick="setMetodo('${m}')"><span class="ico">${ic}</span>${m}</button>`).join('')}</div>
    <div id="efectivo-box">
      <label class="lbl" for="recibido">¿Cuánto le dieron?</label>
      <div class="money"><span>S/</span><input id="recibido" type="number" min="0" step="0.10" placeholder="0.00"></div>
      <div class="rapidos"><button class="btn btn-sm" onclick="setRecibido(${total})">Monto exacto</button>${rapidos.map(x => `<button class="btn btn-sm" onclick="setRecibido(${x})">S/ ${x}</button>`).join('')}</div>
      <div id="vuelto" class="vuelto">Escriba cuánto recibió</div>
    </div>
    <div id="digital-box" hidden><div class="note info" id="digital-msg"></div></div>
    <div class="modal-actions"><button class="btn btn-ok btn-xl" onclick="emitir()">Emitir ${S.tipoDoc.toLowerCase()}</button></div>`);
  $('#docnum').addEventListener('keydown', e => { if (e.key === 'Enter') buscarCliente(tipoDocCli); });
  $('#recibido').addEventListener('input', actualizarVuelto);
  if (!esF && !pideDni) setTimeout(() => $('#recibido').focus(), 40);
}
function buscarCliente(tipo) {
  const n = $('#docnum').value.trim();
  const largo = tipo === 'RUC' ? 11 : 8;
  if (!new RegExp(`^\\d{${largo}}$`).test(n)) return toast(`El ${tipo} debe tener ${largo} números`, 'error');
  let nombre, dir = '';
  if (tipo === 'RUC') {
    nombre = n.startsWith('20') ? ['Clínica San Gabriel S.A.C.', 'Consultorio Médico Vida E.I.R.L.', 'Comercial Los Andes S.A.'][n.charCodeAt(10) % 3] : 'Pérez Quispe Jorge Luis';
    dir = 'Av. Los Olivos 456, Lima';
  } else {
    nombre = ['María López Huamán', 'Carlos Ramírez Torres', 'Lucía Fernández Rojas'][Number(n) % 3];
  }
  S.cobro.cliente = { tipo, num: n, nombre, dir };
  $('#cli-res').innerHTML = `<div class="cliente-ok">✓ ${esc(nombre)}${dir ? `<br><span style="font-weight:400">${dir}</span>` : ''}</div>`;
}
function setMetodo(m) {
  S.cobro.metodo = m;
  document.querySelectorAll('.metodo').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  $('#efectivo-box').hidden = m !== 'Efectivo';
  $('#digital-box').hidden = m === 'Efectivo';
  $('#digital-msg').textContent = m === 'Tarjeta'
    ? 'Pase la tarjeta por el POS del banco y espere el voucher aprobado.'
    : `Revise en su celular que el ${m} de ${soles(totalCarrito())} llegó antes de emitir.`;
}
function setRecibido(x) { $('#recibido').value = Number(x).toFixed(2); actualizarVuelto(); }
function actualizarVuelto() {
  const total = totalCarrito(), r = parseFloat($('#recibido').value), box = $('#vuelto');
  if (!(r > 0)) { box.className = 'vuelto'; box.textContent = 'Escriba cuánto recibió'; return; }
  if (r >= total) { box.className = 'vuelto ok'; box.innerHTML = `Vuelto a entregar<strong>${soles(r - total)}</strong>`; }
  else { box.className = 'vuelto falta'; box.innerHTML = `Falta<strong>${soles(total - r)}</strong>`; }
}
function emitir() {
  const total = totalCarrito(), c = S.cobro, esF = S.tipoDoc === 'Factura';
  if (esF && !c.cliente) return toast('Escriba el RUC y pulse Buscar', 'error');
  if (!esF && total > 700 && !c.cliente) return toast('Escriba el DNI del cliente y pulse Buscar', 'error');
  let recibido = total;
  if (c.metodo === 'Efectivo') {
    recibido = parseFloat($('#recibido').value);
    if (!(recibido >= total)) return toast('El monto recibido es menor al total', 'error');
  }
  const numero = esF ? `F001-${pad(++S.serieF)}` : `B001-${pad(++S.serieB)}`;
  const v = {
    id: ++S.ventaSeq, doc: S.tipoDoc, numero, fecha: HOY_ISO, hora: horaAhora(),
    cliente: c.cliente || { tipo: '', num: '', nombre: 'Clientes varios' },
    items: S.carrito.map(it => ({ ...it })), total, metodo: c.metodo,
    recibido: round2(recibido), vuelto: round2(recibido - total),
    estado: 'Aceptado', usuario: S.usuario.nombre, cajaId: cajaActual().id, devuelto: 0,
  };
  if (tiene(2)) v.items.forEach(it => descontar(prod(it.pid), it.unidades * it.cant, 'Venta', numero));
  S.ventas.unshift(v);
  S.carrito = []; S.busqueda = ''; S.tipoDoc = 'Boleta';
  closeModal();
  render();
  verTicket(v.id, true);
  toast(`${numero} enviado a SUNAT: aceptado (simulado)`);
}

/* ---------------- Ticket ---------------- */
function qrHTML(seed) {
  const r = rng(seed); let cells = '';
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    let on;
    if (finder) { const fx = x > 13 ? x - 14 : x, fy = y > 13 ? y - 14 : y; on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4); }
    else on = r() < 0.5;
    cells += `<i${on ? ' class="on"' : ''}></i>`;
  }
  return `<div class="qr">${cells}</div>`;
}
function ticketHTML(v) {
  const grav = round2(v.total / 1.18), igv = round2(v.total - grav);
  return `<div class="ticket">
    ${v.estado === 'Anulada' ? '<div class="sello">ANULADA</div>' : ''}
    <div class="c b grande">BOTICA DEMO</div>
    <div class="c">RUC 20000000001<br>Av. Principal 123, Lima</div><hr>
    <div class="c b">${v.doc.toUpperCase()} DE VENTA ELECTRÓNICA<br>${v.numero}</div><hr>
    <div>Fecha: ${fmtFecha(v.fecha)} ${v.hora}</div>
    <div>Cliente: ${esc(v.cliente.nombre)}</div>
    ${v.cliente.num ? `<div>${v.cliente.tipo}: ${v.cliente.num}</div>` : ''}
    ${v.cliente.dir ? `<div>Dir.: ${esc(v.cliente.dir)}</div>` : ''}
    ${tiene(3) ? `<div>Atendió: ${esc(v.usuario)}</div>` : ''}<hr>
    ${v.items.map(it => `<div>${esc(it.nombre)}</div><div class="l"><span>${it.cant} ${it.pres} x ${it.precio.toFixed(2)}</span><span>${(it.cant * it.precio).toFixed(2)}</span></div>`).join('')}
    <hr>
    <div class="l"><span>Op. gravada</span><span>${grav.toFixed(2)}</span></div>
    <div class="l"><span>IGV 18%</span><span>${igv.toFixed(2)}</span></div>
    <div class="l b grande"><span>TOTAL S/</span><span>${v.total.toFixed(2)}</span></div><hr>
    <div class="l"><span>Pago: ${v.metodo}</span><span>${v.recibido.toFixed(2)}</span></div>
    ${v.metodo === 'Efectivo' ? `<div class="l"><span>Vuelto</span><span>${v.vuelto.toFixed(2)}</span></div>` : ''}
    ${v.nc ? `<div class="l"><span>Nota de crédito ${v.nc}</span><span>-${v.devuelto.toFixed(2)}</span></div>` : ''}
    ${qrHTML(v.id * 7919)}
    <div class="c">Representación impresa de la ${v.doc} de Venta Electrónica. Consulte en www.sunat.gob.pe</div>
    <div class="c b" style="margin-top:.4rem">¡Gracias por su compra!</div>
  </div>`;
}
function verTicket(id, nuevo = false) {
  const v = venta(id);
  modal(`${nuevo ? `<div class="note info" style="text-align:center">✓ ${v.doc} emitida${v.vuelto > 0 ? ` · Entregue <strong>${soles(v.vuelto)}</strong> de vuelto` : ''}</div>` : ''}
    ${ticketHTML(v)}
    <div class="modal-actions"><button class="btn" onclick="window.print()">🖨️ Imprimir</button>
    <button class="btn btn-primary" onclick="closeModal()">${nuevo ? 'Nueva venta' : 'Cerrar'}</button></div>`);
}

/* =====================================================================
   VENTAS DEL DÍA · ANULAR O CORREGIR
   ===================================================================== */
function estadoBadge(v) {
  if (v.estado === 'Anulada') return '<span class="badge danger">Anulada</span>';
  if (v.nc) return `<span class="badge warn">Con nota de crédito ${v.nc}</span>`;
  return '<span class="badge ok">Aceptado por SUNAT</span>';
}
function vVentas() {
  const vs = ventasHoy();
  const total = vs.reduce((a, v) => a + neto(v), 0);
  return `<div class="page-head"><div><h1>Ventas del día</h1><p>${fmtFecha(HOY_ISO)} · Aquí puede reimprimir, anular o corregir.</p></div></div>
    <div class="kpis">
      <div class="kpi verde"><span>Vendido hoy</span><strong>${soles(total)}</strong></div>
      <div class="kpi"><span>Comprobantes</span><strong>${vs.length}</strong></div>
    </div>
    <div class="card table-wrap"><table class="tabla">
      <thead><tr><th>Hora</th><th>Comprobante</th><th>Cliente</th>${tiene(3) ? '<th>Atendió</th>' : ''}<th>Pago</th><th class="num">Total</th><th>Estado</th><th></th></tr></thead>
      <tbody>${vs.map(v => `<tr>
        <td>${v.hora}</td><td class="nowrap"><strong>${v.numero}</strong><br><span class="muted">${v.doc}</span></td>
        <td>${esc(v.cliente.nombre)}</td>${tiene(3) ? `<td>${esc(v.usuario)}</td>` : ''}<td>${v.metodo}</td>
        <td class="num"><strong>${soles(v.total)}</strong></td><td>${estadoBadge(v)}</td>
        <td><div class="acciones"><button class="btn btn-sm" onclick="verTicket(${v.id})">Reimprimir</button>
          ${v.estado !== 'Anulada' ? `<button class="btn btn-sm" onclick="anularModal(${v.id})">Anular o corregir</button>` : ''}</div></td>
      </tr>`).join('')}</tbody></table></div>`;
}
function anularModal(id) {
  const v = venta(id);
  if (!puede('anular')) {
    return modal(`<h2>No tiene permiso</h2><p>Solo el dueño o una persona autorizada puede anular ventas. Pídale que entre con su usuario.</p>
      <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">Entendido</button></div>`);
  }
  modal(`<h2>Anular o corregir</h2><p class="muted">${v.numero} · ${soles(v.total)} · ${esc(v.cliente.nombre)}</p>
    <p><strong>¿Qué pasó?</strong></p>
    <div class="opciones">
      <button class="opcion" onclick="confirmarAnular(${id})"><strong>Me equivoqué en toda la venta</strong><span class="muted">Se anula el comprobante completo.</span></button>
      <button class="opcion" onclick="devolverModal(${id})"><strong>El cliente devuelve un producto</strong><span class="muted">Se emite una nota de crédito solo por lo devuelto.</span></button>
      <button class="opcion" onclick="corregirDatos(${id})"><strong>Me equivoqué en los datos del cliente</strong><span class="muted">Se anula y se vuelve a emitir con los datos correctos.</span></button>
    </div>
    <p class="hint">Si solo falló la impresora, no anule: use Reimprimir.</p>`);
}
function confirmarAnular(id) {
  const v = venta(id);
  modal(`<h2>¿Anular ${v.numero}?</h2><p>Se avisará a SUNAT que este comprobante queda sin efecto${tiene(2) ? ' y los productos vuelven al stock' : ''}.</p>
    <p>Devuelva al cliente <strong>${soles(neto(v))}</strong>.</p>
    <div class="modal-actions"><button class="btn" onclick="anularModal(${id})">Volver</button>
    <button class="btn btn-danger" onclick="anular(${id}); closeModal(); render(); toast('Comprobante anulado. Aviso enviado a SUNAT (simulado).')">Sí, anular</button></div>`);
}
function anular(id) {
  const v = venta(id);
  if (tiene(2)) v.items.forEach(it => {
    const u = (it.cant - it.devueltos) * it.unidades;
    if (u) reponer(prod(it.pid), u, 'Anulación', v.numero);
  });
  v.estado = 'Anulada';
}
function devolverModal(id) {
  const v = venta(id);
  modal(`<h2>Devolución</h2><p class="muted">${v.numero} · Indique cuántos devuelve de cada producto.</p>
    <div class="table-wrap"><table class="tabla"><thead><tr><th>Producto</th><th class="num">Vendidos</th><th>Devuelve</th></tr></thead>
    <tbody>${v.items.map((it, k) => `<tr><td>${esc(it.nombre)}<br><span class="muted">${it.pres} · ${soles(it.precio)}</span></td>
      <td class="num">${it.cant - it.devueltos}</td>
      <td><input class="qty" type="number" id="dev${k}" min="0" max="${it.cant - it.devueltos}" value="0"></td></tr>`).join('')}</tbody></table></div>
    <div class="modal-actions"><button class="btn" onclick="anularModal(${id})">Volver</button>
    <button class="btn btn-primary" onclick="devolver(${id})">Emitir nota de crédito</button></div>`);
}
function devolver(id) {
  const v = venta(id);
  let monto = 0;
  const cant = v.items.map((it, k) => {
    const n = Math.max(0, Math.min(parseInt($('#dev' + k).value, 10) || 0, it.cant - it.devueltos));
    monto += n * it.precio; return n;
  });
  if (!monto) return toast('Indique al menos un producto a devolver', 'error');
  v.nc = `${v.doc === 'Factura' ? 'FC01' : 'BC01'}-${pad(++S.serieNC)}`;
  v.items.forEach((it, k) => {
    if (!cant[k]) return;
    it.devueltos += cant[k];
    if (tiene(2)) reponer(prod(it.pid), cant[k] * it.unidades, 'Devolución', v.nc);
  });
  v.devuelto = round2(v.devuelto + monto);
  closeModal(); render();
  toast(`Nota de crédito ${v.nc} emitida (simulado). Devuelva ${soles(monto)} al cliente.`);
}
function corregirDatos(id) {
  const v = venta(id);
  anular(id);
  S.carrito = v.items.filter(it => it.cant > it.devueltos).map(it => ({ ...it, cant: it.cant - it.devueltos, devueltos: 0 }));
  S.tipoDoc = v.doc;
  closeModal();
  ir('vender');
  toast(`${v.numero} anulado. Cobre de nuevo y escriba los datos correctos.`);
}

/* =====================================================================
   RESUMEN (Básico y Control)
   ===================================================================== */
function porMetodo(vs) {
  const r = { Efectivo: 0, Yape: 0, Plin: 0, Tarjeta: 0 };
  vs.forEach(v => { r[v.metodo] += neto(v); });
  return r;
}
function vResumen() {
  const vs = ventasHoy(), hoy = vs.reduce((a, v) => a + neto(v), 0);
  const validas = vs.filter(v => v.estado !== 'Anulada').length;
  const mes = HIST.reduce((a, d) => a + d.ventas, 0) + hoy;
  const pm = porMetodo(vs);
  return `<div class="page-head"><div><h1>Resumen</h1><p>Cuánto vendió hoy y en los últimos 30 días.</p></div></div>
    <div class="kpis">
      <div class="kpi verde"><span>Vendido hoy</span><strong>${soles(hoy)}</strong></div>
      <div class="kpi"><span>Ventas hoy</span><strong>${validas}</strong></div>
      <div class="kpi"><span>Promedio por venta</span><strong>${soles(validas ? hoy / validas : 0)}</strong></div>
      <div class="kpi"><span>Últimos 30 días</span><strong>${soles(mes)}</strong></div>
    </div>
    <div class="grid-2">
      <div class="card"><h3>Hoy por forma de pago</h3><table class="tabla"><tbody>
        ${Object.entries(pm).map(([m, t]) => `<tr><td>${m}</td><td class="num"><strong>${soles(t)}</strong></td></tr>`).join('')}
      </tbody></table></div>
      <div class="card"><h3>Ventas de los últimos 7 días</h3>${barras(7)}</div>
    </div>`;
}
function serieDias(n) {
  const hoy = ventasHoy().reduce((a, v) => a + neto(v), 0);
  return [...HIST.slice(-(n - 1)), { fecha: HOY_ISO, ventas: round2(hoy) }];
}
function barras(n) {
  const s = serieDias(n), max = Math.max(...s.map(d => d.ventas), 1);
  return `<div class="bars">${s.map(d => `<div class="bar ${d.fecha === HOY_ISO ? 'hoy' : ''}">
    <div style="height:${Math.max(2, d.ventas / max * 100)}%" data-v="${soles(d.ventas)}"></div>
    <span>${d.fecha === HOY_ISO ? 'Hoy' : d.fecha.slice(8)}</span></div>`).join('')}</div>`;
}

/* =====================================================================
   CERRAR CAJA
   ===================================================================== */
function datosCaja(caja) {
  const vs = S.ventas.filter(v => v.cajaId === caja.id);
  const pm = porMetodo(vs);
  const total = Object.values(pm).reduce((a, b) => a + b, 0);
  return { pm, total, esperado: round2(caja.fondo + pm.Efectivo), n: vs.filter(v => v.estado !== 'Anulada').length };
}
function vCaja() {
  const caja = cajaActual();
  const ultimo = S.ultimoCierre ? `<div class="card"><h3>Último cierre: ${S.ultimoCierre.usuario} · ${S.ultimoCierre.apertura} a ${S.ultimoCierre.cierre}</h3>
    <table class="tabla"><tbody>
      <tr><td>Total vendido</td><td class="num">${soles(S.ultimoCierre.total)}</td></tr>
      <tr><td>Debía haber en el cajón</td><td class="num">${soles(S.ultimoCierre.esperado)}</td></tr>
      <tr><td>Contó</td><td class="num">${soles(S.ultimoCierre.contado)}</td></tr>
      <tr><td>Diferencia</td><td class="num">${difBadge(S.ultimoCierre.diferencia)}</td></tr>
    </tbody></table></div>` : '';
  if (!caja) {
    return `<div class="card center" style="padding:2.5rem 1.3rem"><h2>La caja está cerrada</h2><p class="muted">Ábrala para empezar a vender.</p>
      <button class="btn btn-ok btn-xl" style="max-width:340px" onclick="abrirCajaModal()">Abrir caja</button></div>${ultimo}`;
  }
  const d = datosCaja(caja);
  return `<div class="page-head"><div><h1>Cerrar caja</h1><p>Turno de ${esc(caja.usuario)} desde las ${caja.apertura} · ${d.n} ventas</p></div></div>
    <div class="grid-2">
      <div class="card">
        <h3>1. Cuente el dinero del cajón</h3>
        <label class="lbl" for="contado">¿Cuánto dinero hay en el cajón?</label>
        <div class="money"><span>S/</span><input id="contado" type="number" min="0" step="0.10" placeholder="0.00"></div>
        <div id="dif" class="vuelto" style="margin-top:1rem">Escriba lo que contó</div>
        <label class="lbl" for="nota">Nota (opcional)</label>
        <input id="nota" type="text" placeholder="Ej.: se pagó un delivery con dinero de caja">
        <div class="modal-actions"><button class="btn btn-ok btn-xl" onclick="confirmarCierre()">Confirmar cierre</button></div>
      </div>
      <div class="card">
        <h3>2. Revise el resumen</h3>
        <table class="tabla"><tbody>
          <tr><td>Monto inicial</td><td class="num">${soles(caja.fondo)}</td></tr>
          <tr><td>Ventas en efectivo</td><td class="num">${soles(d.pm.Efectivo)}</td></tr>
          <tr><td><strong>Debe haber en el cajón</strong></td><td class="num"><strong>${soles(d.esperado)}</strong></td></tr>
          <tr><td>Yape</td><td class="num">${soles(d.pm.Yape)}</td></tr>
          <tr><td>Plin</td><td class="num">${soles(d.pm.Plin)}</td></tr>
          <tr><td>Tarjeta</td><td class="num">${soles(d.pm.Tarjeta)}</td></tr>
          <tr><td><strong>Total vendido</strong></td><td class="num"><strong>${soles(d.total)}</strong></td></tr>
        </tbody></table>
      </div>
    </div>${ultimo}`;
}
function difBadge(x) {
  if (Math.abs(x) < 0.005) return '<span class="badge ok">Cuadra</span>';
  return x < 0 ? `<span class="badge danger">Falta ${soles(-x)}</span>` : `<span class="badge warn">Sobra ${soles(x)}</span>`;
}
function afterCaja() {
  const i = $('#contado'); if (!i) return;
  i.focus();
  i.addEventListener('input', () => {
    const c = parseFloat(i.value), box = $('#dif'), esp = datosCaja(cajaActual()).esperado;
    if (!(c >= 0)) { box.className = 'vuelto'; box.textContent = 'Escriba lo que contó'; return; }
    const dif = round2(c - esp);
    if (Math.abs(dif) < 0.005) { box.className = 'vuelto ok'; box.innerHTML = '✓ Todo cuadra<strong>S/ 0.00</strong>'; }
    else if (dif < 0) { box.className = 'vuelto falta'; box.innerHTML = `Falta dinero<strong>${soles(-dif)}</strong>`; }
    else { box.className = 'vuelto'; box.style.background = 'var(--warn-l)'; box.style.color = 'var(--warn)'; box.innerHTML = `Sobra dinero<strong>${soles(dif)}</strong>`; }
  });
}
function confirmarCierre() {
  const caja = cajaActual(), contado = parseFloat($('#contado').value);
  if (!(contado >= 0)) return toast('Escriba cuánto dinero contó', 'error');
  const d = datosCaja(caja);
  const cierre = {
    fecha: HOY_ISO, usuario: caja.usuario, apertura: caja.apertura, cierre: horaAhora(), fondo: caja.fondo,
    total: round2(d.total), esperado: d.esperado, contado: round2(contado), diferencia: round2(contado - d.esperado), nota: $('#nota').value,
  };
  S.cierres.unshift(cierre);
  S.ultimoCierre = cierre;
  delete S.cajas[S.usuario.id];
  render();
  toast('Caja cerrada. Se imprimió el ticket de cierre (simulado).');
}

/* =====================================================================
   STOCK · KARDEX · AJUSTES (Control)
   ===================================================================== */
function vStock() {
  return `<div class="page-head"><div><h1>Stock</h1><p>Cuánto tiene de cada producto. Se descuenta solo al vender.</p></div></div>
    <div class="search-box" style="margin-bottom:1rem"><span aria-hidden="true">🔍</span><input id="fstock" placeholder="Buscar producto" aria-label="Buscar producto"></div>
    <div class="card table-wrap"><table class="tabla">
      <thead><tr><th>Producto</th><th>Le queda</th><th>Vence primero</th><th>Estado</th><th></th></tr></thead>
      <tbody id="tstock"></tbody></table></div>`;
}
function afterStock() {
  const pintar = () => {
    const q = norm($('#fstock').value.trim());
    $('#tstock').innerHTML = PRODUCTOS.filter(p => !q || norm(p.nombre).includes(q) || p.cod.includes(q)).map(p => {
      const s = stockDe(p), prox = p.lotes.map(l => l.vence).sort()[0];
      const dias = prox ? diasHasta(prox) : null;
      let est = '<span class="badge ok">Bien</span>';
      if (!s) est = '<span class="badge danger">Agotado</span>';
      else if (s <= p.min) est = '<span class="badge warn">Poco stock</span>';
      else if (dias !== null && dias <= 90) est = '<span class="badge warn">Por vencer</span>';
      return `<tr><td><strong>${esc(p.nombre)}</strong><br><span class="muted">${esc(p.lab)} · ${p.cod}</span></td>
        <td class="nowrap"><strong>${fmtStock(p)}</strong><br><span class="muted">${s} unidades</span></td>
        <td class="nowrap">${prox ? fmtFecha(prox) + `<br><span class="muted">en ${dias} días</span>` : '—'}</td><td>${est}</td>
        <td><div class="acciones"><button class="btn btn-sm" onclick="kardexModal(${p.id})">Ver movimientos</button>
          ${puede('ajustar') ? `<button class="btn btn-sm" onclick="ajustarModal(${p.id})">Ajustar stock</button>` : ''}</div></td></tr>`;
    }).join('');
  };
  $('#fstock').addEventListener('input', pintar);
  pintar();
}
function kardexModal(id) {
  const p = prod(id);
  let saldo = 0;
  const filas = S.kardex.filter(k => k.pid === id).map(k => {
    saldo += k.cant;
    return `<tr><td class="nowrap">${fmtFecha(k.fecha)}${k.hora ? ' ' + k.hora : ''}</td><td>${k.tipo}</td><td>${esc(k.detalle)}</td>
      <td class="num">${k.cant > 0 ? k.cant : ''}</td><td class="num">${k.cant < 0 ? -k.cant : ''}</td><td class="num"><strong>${saldo}</strong></td></tr>`;
  });
  modal(`<h2>${esc(p.nombre)}</h2><p class="muted">Kardex: todas las entradas y salidas, en unidades.</p>
    <div class="table-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Detalle</th><th class="num">Entra</th><th class="num">Sale</th><th class="num">Saldo</th></tr></thead>
    <tbody>${filas.join('')}</tbody></table></div>
    <h3 style="margin-top:1.2rem">Lotes en la botica</h3>
    <table class="tabla"><thead><tr><th>Lote</th><th>Vence</th><th class="num">Cantidad</th></tr></thead>
    <tbody>${p.lotes.map(l => `<tr><td>${l.lote}</td><td>${fmtFecha(l.vence)} <span class="muted">(${diasHasta(l.vence)} días)</span></td><td class="num">${fmtStock(p, l.cant)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Sin stock</td></tr>'}</tbody></table>`, { wide: true });
}
function ajustarModal(id) {
  const p = prod(id), s = stockDe(p);
  modal(`<h2>Ajustar stock</h2><p><strong>${esc(p.nombre)}</strong></p>
    <p class="muted">El sistema dice que hay <strong>${s} unidades</strong> (${fmtStock(p)}). Escriba lo que contó en el estante.</p>
    <label class="lbl" for="real">Cantidad real (en unidades)</label><input id="real" type="number" min="0" value="${s}">
    <label class="lbl" for="motivo">Motivo</label>
    <select id="motivo"><option>Conteo</option><option>Producto dañado</option><option>Producto vencido</option><option>Otro</option></select>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="ajustar(${id})">Guardar ajuste</button></div>`);
}
function ajustar(id) {
  const p = prod(id), real = parseInt($('#real').value, 10), motivo = $('#motivo').value;
  if (!(real >= 0)) return toast('Escriba una cantidad válida', 'error');
  const dif = real - stockDe(p);
  if (!dif) { closeModal(); return toast('No hubo cambios'); }
  if (dif < 0) descontar(p, -dif, 'Ajuste', motivo); else reponer(p, dif, 'Ajuste', motivo);
  closeModal(); render();
  toast(`Stock ajustado: ${dif > 0 ? '+' : ''}${dif} unidades (${motivo})`);
}

/* ---------------- Alertas ---------------- */
function vAlertas() {
  const pocos = pocoStock(), vence = porVencer();
  return `<div class="page-head"><div><h1>Alertas</h1><p>Revíselas al empezar el día.</p></div></div>
    <div class="grid-2">
      <div class="card"><h3>📉 Se están acabando (${pocos.length})</h3>
        ${pocos.length ? `<table class="tabla"><tbody>${pocos.map(p => `<tr>
          <td><strong>${esc(p.nombre)}</strong><br><span class="muted">Mínimo: ${fmtStock(p, p.min)}</span></td>
          <td class="nowrap">${stockDe(p) ? `<span class="badge warn">Quedan ${fmtStock(p)}</span>` : '<span class="badge danger">Agotado</span>'}</td>
          <td>${puede('compras') ? `<button class="btn btn-sm" onclick="pedir(${p.id})">Ingresar compra</button>` : ''}</td></tr>`).join('')}</tbody></table>`
          : '<div class="empty">Todo bien: ningún producto bajo el mínimo.</div>'}
      </div>
      <div class="card"><h3>⏰ Por vencer en 90 días (${vence.length})</h3>
        ${vence.length ? `<table class="tabla"><tbody>${vence.map(({ p, l, dias }) => `<tr>
          <td><strong>${esc(p.nombre)}</strong><br><span class="muted">Lote ${l.lote} · ${fmtStock(p, l.cant)}</span></td>
          <td class="nowrap"><span class="badge ${dias <= 30 ? 'danger' : 'warn'}">${dias <= 0 ? 'Vencido' : 'En ' + dias + ' días'}</span><br><span class="muted">${fmtFecha(l.vence)}</span></td>
          <td>${puede('ajustar') ? `<button class="btn btn-sm" onclick="retirarModal(${p.id}, '${l.lote}')">Retirar</button>` : ''}</td></tr>`).join('')}</tbody></table>
          <p class="hint">Consejo: venda primero estos lotes o coordine la devolución con su proveedor.</p>`
          : '<div class="empty">Ningún producto vence en los próximos 90 días.</div>'}
      </div>
    </div>`;
}
function pedir(id) { S.compraPre = id; ir('compra'); }
function retirarModal(id, lote) {
  const p = prod(id), l = p.lotes.find(x => x.lote === lote);
  modal(`<h2>Retirar lote ${lote}</h2><p>${esc(p.nombre)} · ${fmtStock(p, l.cant)} · vence ${fmtFecha(l.vence)}</p>
    <p class="muted">Se registra la salida para que el stock quede correcto.</p>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-danger" onclick="retirar(${id}, '${lote}')">Registrar salida</button></div>`);
}
function retirar(id, lote) {
  const p = prod(id), l = p.lotes.find(x => x.lote === lote);
  p.lotes = p.lotes.filter(x => x !== l);
  S.kardex.push({ pid: id, fecha: HOY_ISO, hora: horaAhora(), tipo: 'Salida', detalle: `Retiro por vencimiento · lote ${lote}`, cant: -l.cant });
  closeModal(); render();
  toast(`Lote ${lote} retirado del stock`);
}

/* ---------------- Ingresar compra ---------------- */
function vCompra() {
  return `<div class="page-head"><div><h1>Ingresar compra</h1><p>Registre la mercadería que llega. El stock se actualiza al guardar.</p></div></div>
    <div class="card"><div class="form-grid">
      <div><label class="lbl" for="cprov">Proveedor</label><select id="cprov">${PROVEEDORES.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}</select></div>
      <div><label class="lbl" for="cdoc">N° de factura o guía</label><input id="cdoc" type="text" value="F001-${5000 + Math.floor(rand() * 900)}"></div>
    </div></div>
    <div class="card"><h3>Agregar producto</h3><div class="form-grid">
      <div><label class="lbl" for="cprod">Producto</label><select id="cprod">${PRODUCTOS.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></div>
      <div><label class="lbl" for="cpres">Viene en</label><select id="cpres"></select></div>
      <div><label class="lbl" for="ccant">Cantidad</label><input id="ccant" type="number" min="1" value="5"></div>
      <div><label class="lbl" for="clote">Lote</label><input id="clote" type="text"></div>
      <div><label class="lbl" for="cvence">Vence</label><input id="cvence" type="date"></div>
      <div><label class="lbl" for="ccosto">Costo por cada una (S/)</label><input id="ccosto" type="number" min="0" step="0.01"></div>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" onclick="agregarCompra()">+ Agregar a la lista</button></div></div>
    <div class="card" id="clista"></div>`;
}
function afterCompra() {
  const sel = $('#cprod');
  if (S.compraPre) { sel.value = S.compraPre; S.compraPre = null; }
  const actualizarPres = () => {
    const p = prod(+sel.value);
    $('#cpres').innerHTML = p.pres.map((x, i) => `<option value="${i}">${x.tipo}${x.unidades > 1 ? ` (${x.unidades} unid.)` : ''}</option>`).join('');
    $('#clote').value = p.lotes[0] ? p.lotes[0].lote.slice(0, 2) + '25' + String(Math.floor(rand() * 90) + 10) : 'L' + Math.floor(rand() * 9000 + 1000);
    $('#cvence').value = iso(addDays(HOY, 540));
    actualizarCosto();
  };
  const actualizarCosto = () => {
    const p = prod(+sel.value), pr = p.pres[+$('#cpres').value], base = p.provs[+$('#cprov').value];
    const caja = cajaDe(p) || p.pres[0];
    $('#ccosto').value = round2(base / caja.unidades * pr.unidades).toFixed(2);
  };
  sel.addEventListener('change', actualizarPres);
  $('#cpres').addEventListener('change', actualizarCosto);
  $('#cprov').addEventListener('change', actualizarCosto);
  actualizarPres();
  pintarCompra();
}
function agregarCompra() {
  const pid = +$('#cprod').value, pi = +$('#cpres').value, cant = parseInt($('#ccant').value, 10);
  const lote = $('#clote').value.trim(), vence = $('#cvence').value, costo = parseFloat($('#ccosto').value);
  if (!(cant > 0)) return toast('Escriba la cantidad', 'error');
  if (!lote || !vence) return toast('Escriba el lote y la fecha de vencimiento', 'error');
  if (!(costo >= 0)) return toast('Escriba el costo', 'error');
  S.compraLista.push({ pid, pi, cant, lote, vence, costo });
  pintarCompra();
  toast('Producto agregado a la lista');
}
function pintarCompra() {
  const l = S.compraLista, total = l.reduce((a, x) => a + x.cant * x.costo, 0);
  $('#clista').innerHTML = `<h3>Productos de esta compra</h3>` + (l.length ? `<div class="table-wrap"><table class="tabla">
    <thead><tr><th>Producto</th><th class="num">Cantidad</th><th>Lote</th><th>Vence</th><th class="num">Costo</th><th class="num">Subtotal</th><th></th></tr></thead>
    <tbody>${l.map((x, k) => { const p = prod(x.pid); return `<tr><td>${esc(p.nombre)}</td><td class="num">${x.cant} ${plural(p.pres[x.pi].tipo, x.cant)}</td>
      <td>${esc(x.lote)}</td><td>${fmtFecha(x.vence)}</td><td class="num">${soles(x.costo)}</td><td class="num">${soles(x.cant * x.costo)}</td>
      <td><button class="btn btn-sm" onclick="S.compraLista.splice(${k},1); pintarCompra()">Quitar</button></td></tr>`; }).join('')}</tbody></table></div>
    <div class="total"><span>Total de la compra</span><strong>${soles(total)}</strong></div>
    <button class="btn btn-ok btn-xl" onclick="guardarCompra()">Guardar compra</button>`
    : '<div class="empty">Aún no agregó productos.</div>');
}
function guardarCompra() {
  const doc = $('#cdoc').value.trim(), prov = +$('#cprov').value;
  if (!doc) return toast('Escriba el número de factura o guía', 'error');
  S.compraLista.forEach(x => {
    const p = prod(x.pid), pr = p.pres[x.pi], u = x.cant * pr.unidades;
    const l = p.lotes.find(y => y.lote === x.lote);
    if (l) l.cant += u; else p.lotes.push({ lote: x.lote, vence: x.vence, cant: u });
    p.costoU = round2(x.costo / pr.unidades * 1000) / 1000;
    S.kardex.push({ pid: p.id, fecha: HOY_ISO, hora: horaAhora(), tipo: 'Compra', detalle: `${doc} · ${provNombre(prov)}`, cant: u });
  });
  const n = S.compraLista.length;
  S.compraLista = [];
  render();
  toast(`Compra guardada: ${n} producto${n === 1 ? '' : 's'}. El stock se actualizó.`);
}

/* =====================================================================
   COMPLETO: sugerencias, gastos, reportes, usuarios
   ===================================================================== */
function vSugerencias() {
  const filas = PRODUCTOS.map(p => {
    const prom = p.vend30 / 30, s = stockDe(p), caja = cajaDe(p) || p.pres[0];
    const falta = Math.ceil(prom * 15 - s);
    const sugerido = falta > 0 ? Math.ceil(falta / caja.unidades) : 0;
    const precios = Object.entries(p.provs).map(([id, pr]) => ({ id: +id, pr })).sort((a, b) => a.pr - b.pr);
    return { p, prom, s, caja, sugerido, precios, dias: prom ? Math.floor(s / prom) : 99 };
  }).filter(x => x.sugerido > 0).sort((a, b) => a.dias - b.dias);
  const total = filas.reduce((a, x) => a + x.sugerido * x.precios[0].pr, 0);
  return `<div class="page-head"><div><h1>Sugerencias de compra</h1><p>Calculado para que le alcance 15 días, según lo que vendió en los últimos 30 días.</p></div>
      <button class="btn btn-primary" onclick="toast('En la versión final se imprime o se envía por WhatsApp al proveedor.')">🖨️ Imprimir pedido</button></div>
    <div class="card table-wrap"><table class="tabla">
      <thead><tr><th>Producto</th><th class="num">Vendió (30 días)</th><th class="num">Le queda</th><th>Le alcanza</th><th>Pedir</th><th>Precio por proveedor</th></tr></thead>
      <tbody>${filas.map(x => `<tr>
        <td><strong>${esc(x.p.nombre)}</strong></td>
        <td class="num">${fmtStock(x.p, x.p.vend30)}</td>
        <td class="num">${fmtStock(x.p)}</td>
        <td><span class="badge ${x.dias <= 5 ? 'danger' : 'warn'}">${x.dias} días</span></td>
        <td class="nowrap"><input class="qty" type="number" min="0" value="${x.sugerido}"> ${plural(x.caja.tipo, x.sugerido)}</td>
        <td><div class="provs">${x.precios.map((pp, i) => `<span class="prov ${i === 0 ? 'mejor' : ''}">${provNombre(pp.id)}: ${soles(pp.pr)}</span>`).join('')}</div></td>
      </tr>`).join('')}</tbody></table>
      <div class="total"><span>Costo estimado con el mejor proveedor</span><strong>${soles(total)}</strong></div></div>`;
}

function vGastos() {
  const desde = iso(addDays(HOY, -29));
  const g30 = S.gastos.filter(g => g.fecha >= desde);
  const total = g30.reduce((a, g) => a + g.monto, 0);
  return `<div class="page-head"><div><h1>Gastos</h1><p>Luz, alquiler, sueldos y otros gastos del negocio.</p></div></div>
    <div class="kpis"><div class="kpi rojo"><span>Gastos de los últimos 30 días</span><strong>${soles(total)}</strong></div></div>
    <div class="card"><h3>Nuevo gasto</h3><div class="form-grid">
      <div><label class="lbl" for="gtipo">Tipo</label><select id="gtipo">${['Luz', 'Agua', 'Alquiler', 'Sueldos', 'Internet', 'Otro'].map(t => `<option>${t}</option>`).join('')}</select></div>
      <div><label class="lbl" for="gmonto">Monto (S/)</label><input id="gmonto" type="number" min="0" step="0.10" placeholder="0.00"></div>
      <div><label class="lbl" for="gdet">Detalle</label><input id="gdet" type="text" placeholder="Ej.: recibo de noviembre"></div>
      <div><label class="lbl" for="gfecha">Fecha</label><input id="gfecha" type="date" value="${HOY_ISO}"></div>
    </div><div class="modal-actions"><button class="btn btn-ok" onclick="guardarGasto()">Guardar gasto</button></div></div>
    <div class="card table-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Tipo</th><th>Detalle</th><th class="num">Monto</th></tr></thead>
      <tbody>${S.gastos.map(g => `<tr><td>${fmtFecha(g.fecha)}</td><td>${g.tipo}</td><td>${esc(g.detalle)}</td><td class="num">${soles(g.monto)}</td></tr>`).join('')}</tbody></table></div>`;
}
function guardarGasto() {
  const monto = parseFloat($('#gmonto').value);
  if (!(monto > 0)) return toast('Escriba el monto del gasto', 'error');
  S.gastos.unshift({ fecha: $('#gfecha').value || HOY_ISO, tipo: $('#gtipo').value, monto: round2(monto), detalle: $('#gdet').value || '—' });
  S.gastos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  render();
  toast('Gasto guardado');
}

function vReportes() {
  const n = S.periodo === 'hoy' ? 1 : +S.periodo;
  const desde = iso(addDays(HOY, -(n - 1)));
  const hoyVs = ventasHoy();
  const hist = n > 1 ? HIST.slice(-(n - 1)) : [];
  const ventas = hist.reduce((a, d) => a + d.ventas, 0) + hoyVs.reduce((a, v) => a + neto(v), 0);
  const costo = hist.reduce((a, d) => a + d.costo, 0) + hoyVs.reduce((a, v) => a + costoVenta(v), 0);
  const gastos = S.gastos.filter(g => g.fecha >= desde).reduce((a, g) => a + g.monto, 0);
  const ganancia = ventas - costo - gastos;
  const margen = PRODUCTOS.map(p => {
    const menor = p.pres[p.pres.length - 1], precioU = menor.precio / menor.unidades;
    return { p, precioU, gan: (precioU - p.costoU) * p.vend30, pct: (precioU - p.costoU) / precioU * 100 };
  }).sort((a, b) => b.gan - a.gan);
  const seg = (k, t) => `<button class="seg ${S.periodo === k ? 'on' : ''}" onclick="S.periodo='${k}'; render()">${t}</button>`;
  return `<div class="page-head"><div><h1>Reportes</h1><p>Cómo va el negocio. También puede verlos desde el celular.</p></div>
      <div class="row">
        <button class="btn" onclick="verCelular()">📱 Ver en el celular</button>
        <button class="btn" onclick="toast('En la versión final se descarga un Excel con ventas, compras y gastos.')">⬇️ Para el contador</button>
        <button class="btn" onclick="toast('En la versión final se descarga el archivo de precios para DIGEMID.')">⬇️ Precios DIGEMID</button>
      </div></div>
    <div class="seg-group" style="max-width:480px;grid-template-columns:repeat(3,1fr)">${seg('hoy', 'Hoy')}${seg('7', '7 días')}${seg('30', '30 días')}</div>
    <div class="kpis">
      <div class="kpi"><span>Ventas</span><strong>${soles(ventas)}</strong></div>
      <div class="kpi"><span>Costo de lo vendido</span><strong>${soles(costo)}</strong></div>
      <div class="kpi"><span>Gastos</span><strong>${soles(gastos)}</strong></div>
      <div class="kpi ${ganancia >= 0 ? 'verde' : 'rojo'}"><span>Ganancia estimada</span><strong>${soles(ganancia)}</strong></div>
    </div>
    <div class="card"><h3>Ventas por día</h3>${barras(n === 1 ? 7 : n)}</div>
    <div class="grid-2">
      <div class="card table-wrap"><h3>Productos que más ganancia dejan (30 días)</h3><table class="tabla">
        <thead><tr><th>Producto</th><th class="num">Margen</th><th class="num">Ganancia</th></tr></thead>
        <tbody>${margen.slice(0, 8).map(x => `<tr><td>${esc(x.p.nombre)}</td><td class="num">${x.pct.toFixed(0)}%</td><td class="num"><strong>${soles(x.gan)}</strong></td></tr>`).join('')}</tbody></table></div>
      <div class="card table-wrap"><h3>Ventas de hoy por usuario</h3><table class="tabla">
        <thead><tr><th>Usuario</th><th class="num">Ventas</th><th class="num">Total</th></tr></thead>
        <tbody>${USUARIOS.map(u => { const vs = hoyVs.filter(v => v.usuario === u.nombre && v.estado !== 'Anulada'); return `<tr><td>${esc(u.nombre)}</td><td class="num">${vs.length}</td><td class="num">${soles(vs.reduce((a, v) => a + neto(v), 0))}</td></tr>`; }).join('')}</tbody></table></div>
    </div>`;
}
function verCelular() {
  const hoy = ventasHoy().reduce((a, v) => a + neto(v), 0);
  modal(`<h2>Así se ve en el celular</h2><p class="muted">El dueño revisa sus números desde cualquier lugar. Solo lectura: desde el celular no se vende.</p>
    <div class="phone">
      <div style="font-weight:800;margin-bottom:.7rem">✚ Botica Demo</div>
      <div class="kpi verde"><span>Vendido hoy</span><strong>${soles(hoy)}</strong></div>
      <div class="kpi"><span>Cajas abiertas</span><strong>${Object.keys(S.cajas).length}</strong></div>
      <div class="kpi"><span>Alertas</span><strong>${contarAlertas()}</strong></div>
      <div class="kpi"><span>Últimos 30 días</span><strong>${soles(HIST.reduce((a, d) => a + d.ventas, 0) + hoy)}</strong></div>
    </div>`);
}

function vUsuarios() {
  return `<div class="page-head"><div><h1>Usuarios</h1><p>Cada persona entra con su usuario. Usted decide qué puede hacer.</p></div>
      <button class="btn btn-primary" onclick="nuevoUsuarioModal()">+ Nuevo usuario</button></div>
    <div class="kpis">${USUARIOS.map(u => `<div class="kpi">
      <div class="row"><span class="avatar">${u.nombre[0]}</span><div><strong style="font-size:1.1rem;margin:0">${esc(u.nombre)}</strong><span>${u.rol}</span></div></div>
      <div class="perm-list">${PERMISOS.map(pm => `<label><input type="checkbox" ${u.perms.includes(pm.id) ? 'checked' : ''} ${u.rol === 'Dueño' ? 'disabled' : ''}
        onchange="togglePerm(${u.id}, '${pm.id}', this.checked)"> ${pm.label}</label>`).join('')}</div></div>`).join('')}</div>
    <div class="card table-wrap"><h3>Cierres de caja por usuario</h3><table class="tabla">
      <thead><tr><th>Fecha</th><th>Usuario</th><th>Turno</th><th class="num">Vendido</th><th class="num">Debía haber</th><th class="num">Contó</th><th>Diferencia</th></tr></thead>
      <tbody>${S.cierres.map(c => `<tr><td>${fmtFecha(c.fecha)}</td><td>${esc(c.usuario)}</td><td>${c.apertura} a ${c.cierre}</td>
        <td class="num">${soles(c.total)}</td><td class="num">${soles(c.esperado)}</td><td class="num">${soles(c.contado)}</td><td>${difBadge(c.diferencia)}</td></tr>`).join('')}</tbody></table></div>`;
}
function togglePerm(uid, perm, on) {
  const u = USUARIOS.find(x => x.id === uid);
  u.perms = on ? [...new Set([...u.perms, perm])] : u.perms.filter(p => p !== perm);
  toast(`Permisos de ${u.nombre} actualizados`);
}
function nuevoUsuarioModal() {
  modal(`<h2>Nuevo usuario</h2>
    <label class="lbl" for="unom">Nombre</label><input id="unom" type="text" placeholder="Ej.: Carmen">
    <p class="hint">Empezará como Cajero con permiso para vender. Luego puede marcar más permisos. Su clave de prueba será 1234.</p>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="crearUsuario()">Crear usuario</button></div>`);
}
function crearUsuario() {
  const nombre = $('#unom').value.trim();
  if (!nombre) return toast('Escriba el nombre', 'error');
  USUARIOS.push({ id: Math.max(...USUARIOS.map(u => u.id)) + 1, nombre, rol: 'Cajero', perms: ['vender'] });
  closeModal(); render();
  toast(`Usuario ${nombre} creado`);
}

/* ---------------- Inicio ---------------- */
document.title = `${PLAN.nombre} · Demo Sistema para Boticas`;
if (tiene(3)) { render(); mostrarLogin(); }
else { S.usuario = USUARIO_UNICO; render(); abrirCajaModal(); }
