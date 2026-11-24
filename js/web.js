/* Web pública de Botica LifeFarma: catálogo con disponibilidad real del sistema y pedido por WhatsApp */
(function () {
  const LF = (window.LF = window.LF || {});
  const U = LF.ui, esc = U.esc, icon = LF.icon, M = LF.motor;
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const pedido = [];

  function tema(t) {
    try { if (t) localStorage.setItem('lifefarma-tema', t); } catch (e) { /* */ }
    let v = 'light';
    try { v = localStorage.getItem('lifefarma-tema') || 'light'; } catch (e) { /* */ }
    document.documentElement.dataset.theme = v;
    const b = document.getElementById('btn-tema');
    b.innerHTML = icon(v === 'dark' ? 'sun' : 'moon');
    b.setAttribute('aria-label', v === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro');
  }

  function disponibilidad(p) {
    const st = LF.store.stock(p.id);
    if (st <= 0) return ['agotado', 'Agotado por ahora', 'x'];
    if (st < p.min) return ['pocas', 'Quedan pocas unidades', 'alert'];
    return ['hay', 'Disponible', 'check'];
  }

  function catalogo() {
    const D = LF.store.db;
    let q = '', cat = '';
    const cats = [...new Set(D.productos.map(p => p.cat))];
    document.getElementById('cats').innerHTML = '<button class="on" data-cat="">Todo</button>' + cats.map(c => '<button data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('');
    const cont = document.getElementById('prods');
    function pintar() {
      const qq = norm(q);
      let rows = D.productos.filter(p => (!cat || p.cat === cat) && (!qq || norm(p.nombre + ' ' + p.forma + ' ' + p.cat).includes(qq)));
      if (!qq && !cat) rows = rows.slice().sort((a, b) => b.vd - a.vd).slice(0, 12);
      if (!rows.length) { cont.innerHTML = '<p class="w-vacio">No encontramos "' + esc(q) + '". Escríbenos por WhatsApp y te decimos si lo conseguimos.</p>'; return; }
      cont.innerHTML = rows.map(p => {
        const d = disponibilidad(p);
        const pr = p.pres[p.pres.length - 1];
        return '<article class="w-prod">' + LF.illus(p.ill, 52) + '<div class="w-prod-t"><h3>' + esc(p.nombre) + '</h3><p>' + esc(p.forma) + '</p>' +
          '<p class="w-disp w-' + d[0] + '">' + icon(d[2]) + d[1] + (p.receta ? ' · <span class="w-rx">Con receta</span>' : '') + '</p></div>' +
          '<div class="w-prod-p"><b class="num">' + U.soles(pr.precio) + '</b><small>' + esc(pr.unidades > 1 ? pr.tipo + ' x ' + pr.unidades : pr.tipo.toLowerCase()) + (p.pres.length > 1 ? ' · también por ' + p.pres.slice(0, -1).map(x => x.tipo.toLowerCase()).join(' o ') : '') + '</small>' +
          '<button class="w-add" data-add="' + p.id + '"' + (d[0] === 'agotado' ? ' disabled' : '') + '>' + icon('plus') + 'Agregar</button></div></article>';
      }).join('') + (!qq && !cat ? '<p class="w-nota">Te mostramos los más pedidos. Busca por nombre para ver todo el catálogo.</p>' : '');
      cont.querySelectorAll('[data-add]').forEach(b => b.onclick = () => agregar(b.dataset.add));
    }
    const inp = document.getElementById('buscar');
    let t;
    inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { q = inp.value; pintar(); }, 150); };
    document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; document.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
    pintar();
  }

  function agregar(pid) {
    const p = LF.store.producto(pid);
    const pr = p.pres[p.pres.length - 1];
    const ex = pedido.find(x => x.pid === pid);
    const cant = (ex ? ex.cant : 0) + (pr.unidades === 1 && p.pres.length > 1 ? 10 : 1);
    if (cant * pr.unidades > LF.store.stock(pid)) { avisar('No tenemos más unidades de ' + p.nombre + ' por ahora.'); return; }
    if (ex) ex.cant = cant; else pedido.push({ pid, cant, pres: pr.tipo, precio: pr.precio });
    pintarPedido();
    avisar(p.nombre + ' agregado a tu pedido');
  }

  function avisar(msg) {
    let a = document.getElementById('w-toast');
    if (!a) { a = document.createElement('p'); a.id = 'w-toast'; a.className = 'w-toast'; a.setAttribute('role', 'status'); document.body.appendChild(a); }
    a.textContent = msg;
    a.classList.add('in');
    clearTimeout(a._t);
    a._t = setTimeout(() => a.classList.remove('in'), 2600);
  }

  function pintarPedido() {
    const el = document.getElementById('pedido');
    const total = pedido.reduce((s, x) => s + x.precio * x.cant, 0);
    const rx = pedido.some(x => LF.store.producto(x.pid).receta);
    if (!pedido.length) {
      el.innerHTML = '<h3>Tu pedido</h3><p class="w-nota">Agrega productos y envíanos la lista por WhatsApp. Te confirmamos el precio final y la hora de recojo o entrega.</p>';
      return;
    }
    el.innerHTML = '<h3>Tu pedido</h3><ul>' + pedido.map((x, i) => { const p = LF.store.producto(x.pid); return '<li><div><b>' + esc(p.nombre) + '</b><small>' + x.cant + ' ' + esc(M.presPlural(x.pres, x.cant)) + ' · ' + U.soles(x.precio * x.cant) + '</small></div><div class="w-qty"><button data-menos="' + i + '" aria-label="Quitar uno">−</button><button data-mas="' + i + '" aria-label="Agregar uno">+</button></div></li>'; }).join('') + '</ul>' +
      '<p class="w-total"><span>Total referencial</span><b class="num">' + U.soles(total) + '</b></p>' +
      '<div class="w-ent" role="radiogroup" aria-label="Entrega"><label><input type="radio" name="ent" value="recojo" checked> Recojo en botica</label><label><input type="radio" name="ent" value="delivery"> Delivery</label></div>' +
      (rx ? '<p class="w-aviso">' + icon('note') + 'Tu pedido tiene productos con receta. Muéstrala al recoger o al recibir.</p>' : '') +
      '<a class="w-wa" id="wa-pedido" target="_blank" rel="noopener" href="#">' + icon('whatsapp') + 'Enviar pedido por WhatsApp</a><p class="w-nota">En esta web de ejemplo, el WhatsApp va a LifeSystem Solutions.</p>';
    const linkWa = () => {
      const ent = el.querySelector('input[name=ent]:checked').value;
      const txt = 'Hola, quiero hacer este pedido en Botica LifeFarma (' + (ent === 'delivery' ? 'delivery' : 'recojo en botica') + '):\n' + pedido.map(x => '- ' + x.cant + ' ' + M.presPlural(x.pres, x.cant) + ' de ' + LF.store.producto(x.pid).nombre).join('\n') + '\nTotal referencial: ' + U.soles(total);
      el.querySelector('#wa-pedido').href = 'https://wa.me/' + LF.planes.WHATSAPP + '?text=' + encodeURIComponent(txt);
    };
    el.querySelectorAll('input[name=ent]').forEach(r => r.onchange = linkWa);
    linkWa();
    el.querySelectorAll('[data-menos]').forEach(b => b.onclick = () => { const x = pedido[b.dataset.menos]; const p = LF.store.producto(x.pid); x.cant -= (x.pres === 'Unidad' && p.pres.length > 1 ? 5 : 1); if (x.cant <= 0) pedido.splice(b.dataset.menos, 1); pintarPedido(); });
    el.querySelectorAll('[data-mas]').forEach(b => b.onclick = () => agregar(pedido[b.dataset.mas].pid));
  }

  document.addEventListener('DOMContentLoaded', () => {
    LF.store.init();
    const E = LF.store.db.empresa;
    tema();
    document.getElementById('btn-tema').onclick = () => tema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('w-lock').innerHTML = icon('lock');
    document.getElementById('ic-buscar').innerHTML = icon('search');
    document.getElementById('w-hero-ill').innerHTML = LF.illus('frasco', 110) + LF.illus('capsula', 110) + LF.illus('caja', 110);
    document.getElementById('w-horario').innerHTML = icon('clock') + esc(E.horario);
    document.getElementById('w-dir').innerHTML = icon('pin') + esc(E.direccion);
    document.getElementById('w-dir2').textContent = E.direccion;
    document.getElementById('w-horario2').textContent = E.horario;
    document.getElementById('w-qf').textContent = 'Químico farmacéutico responsable: ' + E.qf + ' · ' + E.digemid;
    document.getElementById('w-razon').textContent = E.razon + ' · RUC ' + E.ruc + ' (ficticio)';
    catalogo();
    pintarPedido();
  });
})();
