/* Motor del rubro: lotes (FEFO), riesgo de pérdida por vencimiento, reposición sugerida, IGV y presentaciones.
   Lo usan el sistema (app.html), la web pública (web.html) y la página de planes (index.html). */
(function () {
  const LF = (window.LF = window.LF || {});
  const DIA = 864e5;
  const pad = n => String(n).padStart(2, '0');
  const diaISO = d => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const diasHasta = (iso, ahora) => Math.floor((new Date(iso + 'T23:59:59').getTime() - (ahora || Date.now())) / DIA);
  const r2 = n => Math.round(n * 100) / 100;
  const IGV = 0.18;

  /* Precio con IGV incluido → base imponible e IGV (boleta y factura) */
  function igv(total) { const base = r2(total / (1 + IGV)); return { base, igv: r2(total - base), total: r2(total) }; }

  /* Lotes vendibles de un producto en orden FEFO (primero el que vence antes) */
  function lotesFEFO(lotes, pid, ahora, retiro) {
    return lotes.filter(l => l.pid === pid && l.cant > 0 && diasHasta(l.vence, ahora) > (retiro || 0)).sort((a, b) => a.vence.localeCompare(b.vence));
  }
  const stockVendible = (lotes, pid, ahora, retiro) => lotesFEFO(lotes, pid, ahora, retiro).reduce((s, l) => s + l.cant, 0);

  /* Descuenta unidades siguiendo FEFO. Devuelve de qué lotes salió cada unidad. */
  function descontar(lotes, pid, unidades, ahora, retiro) {
    const salida = [];
    let falta = unidades;
    for (const l of lotesFEFO(lotes, pid, ahora, retiro)) {
      if (!falta) break;
      const c = Math.min(l.cant, falta);
      l.cant -= c; falta -= c;
      salida.push({ lote: l.id, codigo: l.codigo, cant: c, costoU: l.costoU });
    }
    return { salida, faltan: falta };
  }

  /* ===== Riesgo de pérdida por vencimiento (0–100) por lote =====
     Días útiles = días que faltan para la fecha de retiro (vencimiento − días de retiro).
     Por FEFO, los lotes que vencen antes se venden primero: ese stock "ocupa" parte de los días útiles.
     Excedente = unidades del lote que no se alcanzarán a vender a tiempo. */
  const PESOS_BASE = { cercania: 35, excedente: 35, valor: 20, rotacion: 10 };
  const FACTORES = [
    { clave: 'cercania', etiqueta: 'Cercanía' },
    { clave: 'excedente', etiqueta: 'Excedente' },
    { clave: 'valor', etiqueta: 'Valor' },
    { clave: 'rotacion', etiqueta: 'Rotación' }
  ];
  const UMBRAL = { alto: 60, medio: 35 };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function riesgoLote(l, lotesDelProducto, ventaDia, opts) {
    opts = opts || {};
    const P = Object.assign({}, PESOS_BASE, opts.pesos || {});
    const retiro = opts.retiro == null ? 30 : opts.retiro;
    const ahora = opts.ahora || Date.now();
    const dias = diasHasta(l.vence, ahora);
    const util = dias - retiro;
    const previos = lotesDelProducto.filter(x => x.id !== l.id && x.cant > 0 && x.vence < l.vence && diasHasta(x.vence, ahora) > retiro).reduce((s, x) => s + x.cant, 0);
    const capacidad = Math.max(0, ventaDia * Math.max(0, util) - previos);
    const excedente = Math.min(l.cant, Math.max(0, Math.round(l.cant - capacidad)));
    const soles = r2(excedente * l.costoU);
    const fr = [];
    const pCer = util <= 0 ? P.cercania : Math.round(P.cercania * clamp((120 - util) / 120, 0, 1));
    fr.push({ clave: 'cercania', pts: pCer, peso: P.cercania, motivo: util <= 0 ? (dias < 0 ? 'Venció hace ' + (-dias) + (dias === -1 ? ' día' : ' días') : 'Vence en ' + dias + ' días: ya pasó la fecha de retiro') : 'Vence en ' + dias + ' días · ' + util + ' días útiles para vender' });
    const pctExc = l.cant ? excedente / l.cant : 0;
    fr.push({ clave: 'excedente', pts: Math.round(P.excedente * pctExc), peso: P.excedente, motivo: excedente ? excedente + ' de ' + l.cant + ' unidades no se venderían a tiempo' : 'Se vende todo antes de la fecha de retiro' });
    fr.push({ clave: 'valor', pts: Math.round(P.valor * clamp(soles / 300, 0, 1)), peso: P.valor, motivo: soles ? 'S/ ' + soles.toFixed(2) + ' de costo en riesgo' : 'Sin pérdida estimada' });
    fr.push({ clave: 'rotacion', pts: Math.round(P.rotacion * clamp((3 - ventaDia) / 3, 0, 1)), peso: P.rotacion, motivo: 'Se venden ' + (ventaDia >= 10 ? Math.round(ventaDia) : ventaDia.toFixed(1)) + ' unidades al día' + (previos ? ' · antes salen ' + previos + ' u de lotes más antiguos' : '') });
    const factores = FACTORES.map(f => Object.assign({ etiqueta: f.etiqueta }, fr.find(x => x.clave === f.clave)));
    // Sin excedente no hay pérdida esperada: el puntaje solo refleja cercanía, con tope en "bajo"
    let puntaje = clamp(factores.reduce((s, f) => s + f.pts, 0), 0, 100);
    if (!excedente && util > 0) puntaje = Math.min(puntaje, UMBRAL.medio - 1);
    const nivel = util <= 0 ? 'alto' : puntaje >= UMBRAL.alto ? 'alto' : puntaje >= UMBRAL.medio ? 'medio' : 'bajo';
    let accion;
    if (util <= 0) accion = dias < 0 ? 'Retirar y registrar como merma o canje' : 'Retirar del estante y pedir canje al proveedor';
    else if (excedente && util <= 75) accion = opts.fraccionable ? 'Vender primero: ofrecer descuento o vender por blíster' : 'Vender primero: ofrecer descuento o en combo';
    else if (excedente && util <= 200) accion = 'Pedir canje al proveedor ahora, aún hay tiempo';
    else if (excedente) accion = 'Vigilar: comprar menos de este producto la próxima vez';
    else accion = 'Se vende a tiempo, sin acción';
    return { puntaje, nivel, factores, dias, util, excedente, soles, accion };
  }

  /* ===== Reposición sugerida =====
     Pedir = venta diaria × (días de entrega + días de cobertura) − stock vendible, redondeado a la presentación de compra. */
  function reposicion(p, stock, ventaDia, opts) {
    opts = opts || {};
    const cobertura = opts.cobertura || 15;
    const lead = p.lead || 2;
    const seguridad = Math.ceil(ventaDia * 3);
    const puntoPedido = Math.ceil(ventaDia * lead) + seguridad;
    const necesita = Math.max(0, Math.ceil(ventaDia * (lead + cobertura)) + seguridad - stock);
    const uCompra = p.pres[0].unidades;
    const cajas = necesita ? Math.ceil(necesita / uCompra) : 0;
    const provs = Object.entries(p.provs).map(([id, costo]) => ({ id, costo })).sort((a, b) => a.costo - b.costo);
    const mejor = provs[0], peor = provs[provs.length - 1];
    return {
      puntoPedido, necesita, cajas, uCompra, seguridad, lead, cobertura,
      pedir: stock <= puntoPedido && cajas > 0,
      dias: ventaDia ? Math.floor(stock / ventaDia) : 999,
      prov: mejor.id, costo: mejor.costo, total: r2(cajas * mejor.costo), ahorro: r2(cajas * (peor.costo - mejor.costo))
    };
  }

  /* Presentación a texto: "Caja x 100", "Blíster x 10", "Unidad" */
  const presTxt = pr => pr.unidades > 1 ? pr.tipo + ' x ' + pr.unidades : pr.tipo;
  /* Plural de una presentación en minúsculas: 1 frasco, 2 frascos, 3 unidades, 2 blísteres, 2 cajas x 3 */
  function presPlural(tipo, n) {
    const t = String(tipo).toLowerCase();
    if (n === 1) return t;
    const [w, ...resto] = t.split(' ');
    const pl = /[aeiou]$/.test(w) ? w + 's' : w === 'blíster' ? 'blísteres' : w + 'es';
    return [pl].concat(resto).join(' ');
  }

  LF.motor = { DIA, diaISO, diasHasta, igv, IGV, lotesFEFO, stockVendible, descontar, PESOS_BASE, FACTORES, UMBRAL, riesgoLote, reposicion, presTxt, presPlural, r2 };
})();
