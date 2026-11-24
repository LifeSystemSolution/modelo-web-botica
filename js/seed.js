/* Datos de ejemplo: 30 días de una botica de barrio ficticia.
   Semilla fija: los datos son iguales en cada carga; las fechas se calculan desde hoy.
   Nada se vende, compra ni cobra hoy. */
(function () {
  const LF = (window.LF = window.LF || {});

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Presentaciones: caja de 100 (10 blísteres de 10) o un solo envase
  const CAJA = (u, pc, pb, pu) => [{ tipo: 'Caja', unidades: u, precio: pc }, { tipo: 'Blíster', unidades: 10, precio: pb }, { tipo: 'Unidad', unidades: 1, precio: pu }];
  const SOLO = (tipo, p) => [{ tipo, unidades: 1, precio: p }];
  // [nombre, forma, categoría, receta, presentaciones, costo por unidad, venta diaria aprox (unidades), ilustración]
  const CATALOGO = [
    ['Paracetamol 500 mg', 'Tabletas · genérico', 'Dolor y fiebre', 0, CAJA(100, 15, 2, 0.2), 0.08, 34, 'pastilla'],
    ['Ibuprofeno 400 mg', 'Tabletas · genérico', 'Dolor y fiebre', 0, CAJA(100, 18, 2.2, 0.3), 0.12, 20, 'pastilla'],
    ['Naproxeno 550 mg', 'Tabletas · genérico', 'Dolor y fiebre', 0, CAJA(100, 35, 4, 0.5), 0.2, 11, 'pastilla'],
    ['Diclofenaco 50 mg', 'Tabletas · genérico', 'Dolor y fiebre', 0, CAJA(100, 9, 1.2, 0.15), 0.05, 8, 'pastilla'],
    ['Metamizol 500 mg', 'Tabletas · genérico', 'Dolor y fiebre', 0, CAJA(100, 12, 1.5, 0.2), 0.06, 9, 'pastilla'],
    ['Antigripal', 'Tabletas · paracetamol, fenilefrina y clorfenamina', 'Resfrío y alergia', 0, CAJA(100, 42, 5, 0.6), 0.3, 17, 'pastilla'],
    ['Amoxicilina 500 mg', 'Cápsulas · genérico', 'Antibióticos', 1, CAJA(100, 35, 4, 0.5), 0.22, 14, 'capsula'],
    ['Azitromicina 500 mg', 'Caja x 3 tabletas', 'Antibióticos', 1, SOLO('Caja x 3', 9), 3.2, 1.6, 'caja'],
    ['Ciprofloxacino 500 mg', 'Tabletas · genérico', 'Antibióticos', 1, CAJA(100, 28, 3.5, 0.4), 0.15, 4, 'pastilla'],
    ['Cefalexina 500 mg', 'Cápsulas · genérico', 'Antibióticos', 1, CAJA(100, 45, 5, 0.6), 0.3, 3, 'capsula'],
    ['Amoxicilina 250 mg/5 ml', 'Suspensión 60 ml', 'Antibióticos', 1, SOLO('Frasco', 9.5), 5.5, 1, 'frasco'],
    ['Omeprazol 20 mg', 'Cápsulas · genérico', 'Estómago', 0, CAJA(100, 15, 2, 0.3), 0.1, 16, 'capsula'],
    ['Famotidina 40 mg', 'Tabletas · genérico', 'Estómago', 0, CAJA(100, 20, 2.5, 0.3), 0.12, 3, 'pastilla'],
    ['Sal de frutas', 'Sobre 5 g', 'Estómago', 0, SOLO('Sobre', 1.2), 0.55, 9, 'sobre'],
    ['Suero oral', 'Botella 625 ml', 'Estómago', 0, SOLO('Botella', 6.5), 4.1, 2.6, 'frasco'],
    ['Loperamida 2 mg', 'Tabletas · genérico', 'Estómago', 0, CAJA(100, 15, 2, 0.3), 0.09, 2, 'pastilla'],
    ['Hioscina 10 mg', 'Tabletas · genérico', 'Estómago', 0, CAJA(100, 30, 3.5, 0.4), 0.18, 3, 'pastilla'],
    ['Metformina 850 mg', 'Tabletas · genérico', 'Crónicos', 1, CAJA(100, 14, 1.8, 0.25), 0.09, 12, 'pastilla'],
    ['Losartán 50 mg', 'Tabletas · genérico', 'Crónicos', 1, CAJA(100, 12, 1.5, 0.2), 0.07, 14, 'pastilla'],
    ['Enalapril 10 mg', 'Tabletas · genérico', 'Crónicos', 1, CAJA(100, 9, 1.2, 0.15), 0.05, 6, 'pastilla'],
    ['Atorvastatina 20 mg', 'Tabletas · genérico', 'Crónicos', 1, CAJA(100, 25, 3, 0.4), 0.14, 5, 'pastilla'],
    ['Glibenclamida 5 mg', 'Tabletas · genérico', 'Crónicos', 1, CAJA(100, 8, 1, 0.15), 0.04, 3, 'pastilla'],
    ['Salbutamol 100 mcg', 'Inhalador 200 dosis', 'Crónicos', 1, SOLO('Inhalador', 18), 10, 0.5, 'inhalador'],
    ['Loratadina 10 mg', 'Tabletas · genérico', 'Resfrío y alergia', 0, CAJA(100, 10, 1.2, 0.2), 0.06, 8, 'pastilla'],
    ['Cetirizina 10 mg', 'Tabletas · genérico', 'Resfrío y alergia', 0, CAJA(100, 12, 1.5, 0.2), 0.07, 5, 'pastilla'],
    ['Clorfenamina 4 mg', 'Tabletas · genérico', 'Resfrío y alergia', 0, CAJA(100, 6, 0.8, 0.1), 0.03, 4, 'pastilla'],
    ['Jarabe para la tos', 'Dextrometorfano 120 ml', 'Resfrío y alergia', 0, SOLO('Frasco', 14), 7.5, 1.2, 'frasco'],
    ['Ambroxol jarabe', '30 mg/5 ml · 120 ml', 'Resfrío y alergia', 0, SOLO('Frasco', 9), 4.8, 1.5, 'frasco'],
    ['Paracetamol jarabe', '120 mg/5 ml · 120 ml', 'Dolor y fiebre', 0, SOLO('Frasco', 6), 3, 2, 'frasco'],
    ['Vitamina C 1 g', 'Tubo x 10 efervescentes', 'Vitaminas', 0, SOLO('Tubo', 12), 7, 0.7, 'tubo'],
    ['Complejo B', 'Tabletas', 'Vitaminas', 0, CAJA(100, 20, 2.5, 0.3), 0.12, 3, 'pastilla'],
    ['Sulfato ferroso + ácido fólico', 'Tabletas', 'Vitaminas', 0, CAJA(100, 18, 2.2, 0.3), 0.1, 3, 'pastilla'],
    ['Calcio + vitamina D', 'Frasco x 30 tabletas', 'Vitaminas', 0, SOLO('Frasco', 22), 12, 0.5, 'frasco'],
    ['Multivitamínico jarabe', 'Frasco 120 ml', 'Vitaminas', 0, SOLO('Frasco', 16), 9, 0.6, 'frasco'],
    ['Alcohol 70°', 'Frasco 1 L', 'Primeros auxilios', 0, SOLO('Frasco', 8.5), 5.2, 1.5, 'frasco'],
    ['Agua oxigenada', 'Frasco 120 ml', 'Primeros auxilios', 0, SOLO('Frasco', 2.5), 1.1, 1.5, 'frasco'],
    ['Gasa estéril 10 x 10 cm', 'Sobre', 'Primeros auxilios', 0, SOLO('Sobre', 1.5), 0.6, 3, 'sobre'],
    ['Venda elástica 4"', 'Unidad', 'Primeros auxilios', 0, SOLO('Unidad', 4.5), 2, 0.8, 'caja'],
    ['Curitas', 'Caja x 20', 'Primeros auxilios', 0, SOLO('Caja', 4), 2, 1, 'caja'],
    ['Mascarilla KN95', 'Caja x 20', 'Primeros auxilios', 0, [{ tipo: 'Caja', unidades: 20, precio: 15 }, { tipo: 'Unidad', unidades: 1, precio: 1 }], 0.4, 6, 'caja'],
    ['Clotrimazol crema 1%', 'Tubo 20 g', 'Piel', 0, SOLO('Tubo', 6), 2.5, 0.6, 'tubo'],
    ['Betametasona crema', 'Tubo 15 g', 'Piel', 1, SOLO('Tubo', 5), 2, 0.5, 'tubo'],
    ['Crema para escaldaduras', 'Tubo 60 g', 'Bebé y mamá', 0, SOLO('Tubo', 14), 7, 0.4, 'tubo'],
    ['Bloqueador solar FPS 50', 'Frasco 120 ml', 'Piel', 0, SOLO('Frasco', 45), 28, 0.3, 'frasco'],
    ['Pañales talla M', 'Paquete x 30', 'Bebé y mamá', 0, SOLO('Paquete', 38), 28, 0.6, 'caja'],
    ['Toallitas húmedas', 'Paquete x 80', 'Bebé y mamá', 0, SOLO('Paquete', 9), 5.5, 0.8, 'caja'],
    ['Prueba de embarazo', 'Unidad', 'Bebé y mamá', 0, SOLO('Unidad', 8), 3.5, 0.7, 'caja'],
    ['Preservativos', 'Caja x 3', 'Cuidado personal', 0, SOLO('Caja', 6), 2.8, 1, 'caja'],
    ['Simeticona gotas', 'Frasco 15 ml', 'Bebé y mamá', 0, SOLO('Frasco', 8), 4.5, 1, 'frasco'],
    ['Termómetro digital', 'Unidad', 'Primeros auxilios', 0, SOLO('Unidad', 15), 7, 0.3, 'termometro']
  ];
  const PROVEEDORES = [
    { id: 'PV1', nombre: 'Droguería Andina S.A.C. (ficticia)', ruc: '20999000001', dias: 2 },
    { id: 'PV2', nombre: 'Distribuidora Salud Perú E.I.R.L. (ficticia)', ruc: '20999000002', dias: 1 },
    { id: 'PV3', nombre: 'Medisur Mayorista S.A.C. (ficticia)', ruc: '20999000003', dias: 3 }
  ];
  const NOMBRES = ['Rosa', 'María', 'Lucía', 'Carmen', 'Milagros', 'Yesenia', 'Flor', 'Gladys', 'Patricia', 'Sofía', 'Jorge', 'Luis', 'Carlos', 'José', 'Miguel', 'Juan', 'Víctor', 'Edwin', 'Kevin', 'Diego', 'Renzo', 'Óscar', 'César', 'Percy'];
  const APELLIDOS = ['Quispe', 'Huamán', 'Mamani', 'Flores', 'Rojas', 'Sánchez', 'García', 'Chávez', 'Torres', 'Ramírez', 'Mendoza', 'Vargas', 'Castillo', 'Condori', 'Paredes', 'Vega', 'Apaza', 'Ríos', 'Salazar', 'Cárdenas', 'Espinoza', 'Ticona', 'Cruz', 'Ramos'];
  const MEDICOS = [['Dra. Carmen Salazar Ríos', '04521'], ['Dr. Jorge Paredes Vega', '07834'], ['Dra. Lucía Ramos Cruz', '06210'], ['Dr. Miguel Torres Apaza', '05198'], ['Dr. César Huamán Ríos', '08877']];

  function seed() {
    const rnd = mulberry32(20261124);
    const r = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const peso = pares => { const tot = pares.reduce((s, p) => s + p[1], 0); let x = rnd() * tot; for (const p of pares) { if ((x -= p[1]) <= 0) return p[0]; } return pares[0][0]; };
    const M = LF.motor;
    const hoy0 = new Date(); hoy0.setHours(0, 0, 0, 0);
    const CORTE = hoy0.getTime();
    const DIA = 864e5;
    const isoEn = d => M.diaISO(CORTE + d * DIA);
    const nombre = () => pick(NOMBRES) + ' ' + pick(APELLIDOS) + ' ' + pick(APELLIDOS);

    const productos = CATALOGO.map((c, i) => {
      const pid = 'M' + String(i + 1).padStart(2, '0');
      const uC = c[4][0].unidades;
      const costoC = c[5] * uC;
      return {
        id: pid, nombre: c[0], forma: c[1], cat: c[2], receta: !!c[3], pres: c[4], costoU: c[5], ill: c[7], vd: c[6],
        codigo: '775' + String(1000000000 + (i + 1) * 7919).slice(-10),
        min: Math.max(uC === 1 ? 3 : 30, Math.ceil(c[6] * 5)),
        lead: (i % 3) + 1,
        provs: { PV1: M.r2(costoC), PV2: M.r2(costoC * (0.96 + rnd() * 0.1)), PV3: M.r2(costoC * (0.92 + rnd() * 0.14)) }
      };
    });
    const prod = id => productos.find(p => p.id === id);

    const personas = [
      { id: 'P1', nombre: 'Ana Quispe Rojas', cargo: 'Cajera · turno mañana', rol: 'cajero', demo: 'cajero', pin: '0000' },
      { id: 'P2', nombre: 'Q.F. Milagros Torres Vega', cargo: 'Químico farmacéutico · C.Q.F.P. 00000 (demo)', rol: 'qf', demo: 'qf', pin: '2222' },
      { id: 'P3', nombre: 'Rosa Mendoza Ríos', cargo: 'Dueña', rol: 'dueno', demo: 'dueno', pin: '1234' },
      { id: 'P4', nombre: 'Luis Huamán Soto', cargo: 'Cajero · turno tarde', rol: 'cajero', pin: '0000' }
    ];

    const clientes = [
      { id: 'C1', tipo: 'empresa', nombre: 'Clínica Dental Sonrisa E.I.R.L.', doc: '20999100011', tel: '900010011' },
      { id: 'C2', tipo: 'empresa', nombre: 'Consultorio Médico San Martín S.A.C.', doc: '20999100022', tel: '900010022' },
      { id: 'C3', tipo: 'empresa', nombre: 'Colegio Particular Los Andes S.A.C.', doc: '20999100033', tel: '900010033' },
      { id: 'C4', tipo: 'empresa', nombre: 'Transportes Rápido Norte S.A.C.', doc: '20999100044', tel: '900010044' }
    ];
    for (let i = 0; i < 26; i++) clientes.push({ id: 'C' + (clientes.length + 1), tipo: 'persona', nombre: nombre(), doc: String(r(40000000, 79999999)), tel: '9000' + String(r(10000, 99999)), cronico: i < 9 });

    /* ===== Ventas de 30 días ===== */
    const ventas = [];
    const recetas = [];
    const series = { B001: 4120, F001: 318, NV01: 905, BC01: 41, FC01: 6 };
    const pesoProd = productos.map(p => [p.id, p.vd / (p.pres.length === 3 ? 6 : p.pres.length === 2 ? 2.5 : 1.1)]);
    for (let dAgo = 30; dAgo >= 1; dAgo--) {
      const dia = new Date(CORTE - dAgo * DIA);
      const dow = dia.getDay();
      const n = dow === 0 ? r(38, 48) : dow === 6 ? r(50, 62) : r(58, 74);
      for (let k = 0; k < n; k++) {
        const h = peso([[8, 5], [9, 9], [10, 10], [11, 8], [12, 7], [13, 6], [14, 5], [15, 5], [16, 6], [17, 8], [18, 10], [19, 11], [20, 9], [21, 5]]);
        const t = CORTE - dAgo * DIA + h * 36e5 + r(0, 59) * 6e4;
        const ni = peso([[1, 46], [2, 34], [3, 15], [4, 5]]);
        const items = [];
        for (let j = 0; j < ni; j++) {
          const p = prod(peso(pesoProd));
          if (items.some(x => x.pid === p.id)) continue;
          let pi = p.pres.length - 1, cant = 1;
          if (p.pres.length === 3) {
            pi = peso([[2, 52], [1, 42], [0, 6]]);
            cant = pi === 2 ? peso([[3, 12], [4, 18], [6, 22], [8, 12], [12, 14], [21, 14], [30, 8]]) : pi === 1 ? peso([[1, 55], [2, 33], [3, 12]]) : 1;
          } else if (p.pres.length === 2) { pi = peso([[1, 70], [0, 30]]); cant = pi === 1 ? r(1, 5) : 1; }
          else cant = peso([[1, 85], [2, 15]]);
          const pr = p.pres[pi];
          items.push({ pid: p.id, pres: pr.tipo, u: pr.unidades, cant, precio: pr.precio, costo: M.r2(p.costoU * pr.unidades * cant) });
        }
        const total = M.r2(items.reduce((s, it) => s + it.precio * it.cant, 0));
        let doc = 'B001';
        let cliente = null;
        if (total > 25 && rnd() < 0.12) { const c = pick(clientes.filter(x => x.tipo === 'empresa')); doc = 'F001'; cliente = c.id; }
        else if (rnd() < 0.08) doc = 'NV01';
        else if (rnd() < 0.18) cliente = pick(clientes.filter(x => x.tipo === 'persona')).id;
        const medio = total < 6 ? peso([['Efectivo', 80], ['Yape', 20]]) : peso([['Efectivo', 46], ['Yape', 30], ['Plin', 8], ['Tarjeta', 16]]);
        const por = h < 15 ? 'P1' : 'P4';
        const v = { id: 'V' + (ventas.length + 1), serie: doc, num: ++series[doc], t, items, total, medio, cliente, por };
        if (medio === 'Efectivo') { const pagos = [5, 10, 20, 50, 100, 200]; const paga = pagos.find(x => x >= total) || total; v.paga = paga; }
        items.filter(it => prod(it.pid).receta).forEach(it => {
          const md = pick(MEDICOS);
          const rec = { id: 'R' + (recetas.length + 1), venta: v.id, t, pid: it.pid, cant: it.cant * it.u, medico: md[0], cmp: md[1], paciente: cliente && v.serie !== 'F001' ? clientes.find(c => c.id === cliente).nombre : nombre(), nro: String(r(10000, 99999)), por };
          recetas.push(rec);
          it.receta = rec.id;
        });
        if (rnd() < 0.006) { v.anulada = { t: t + r(5, 60) * 6e4, motivo: pick(['Error en el producto', 'El cliente devolvió el producto', 'Error en el monto']), nc: (doc === 'F001' ? 'FC01-' : 'BC01-') + (doc === 'F001' ? ++series.FC01 : ++series.BC01), por: 'P3' }; }
        ventas.push(v);
      }
    }
    // Venta diaria real de cada producto (unidades / 30 días)
    const vendidas = {};
    ventas.filter(v => !v.anulada).forEach(v => v.items.forEach(it => { vendidas[it.pid] = (vendidas[it.pid] || 0) + it.cant * it.u; }));
    productos.forEach(p => { p.vd = M.r2((vendidas[p.id] || 0) / 30); });

    /* ===== Lotes actuales y compras ===== */
    const lotes = [];
    const compras = [];
    let nl = 0;
    const lote = (p, cant, venceEn, ingresoHace, prov) => {
      const l = { id: 'L' + (++nl), pid: p.id, codigo: p.nombre.slice(0, 2).toUpperCase() + (24 + Math.floor((venceEn + 900) / 365)) + String(r(10, 99)) + String.fromCharCode(65 + r(0, 25)), cant, vence: isoEn(venceEn), costoU: p.costoU, prov: prov || pick(PROVEEDORES).id, ingreso: CORTE - ingresoHace * DIA + r(9, 12) * 36e5 };
      lotes.push(l);
      return l;
    };
    // Casos diseñados para mostrar el riesgo por vencimiento (resto: stock sano)
    // [vence en días, multiplicador sobre lo que se alcanza a vender, ingresó hace días]; cantidad fija si el multiplicador es 0
    const DISENO = {
      M30: [[20, 0, 70, 24]], M36: [[-3, 0, 120, 6]], M15: [[38, 2.4, 50]], M34: [[75, 1.9, 60]], M44: [[105, 2.1, 90]], M11: [[52, 1.7, 45]],
      M10: [[128, 1.3, 75]], M23: [[92, 1.6, 60]], M42: [[140, 1.25, 100]], M28: [[260, 1.05, 40]], M26: [[150, 1, 90]]
    };
    // Productos con stock bajo para la reposición
    const BAJO = { M01: 3, M19: 4, M12: 5, M40: 3, M07: 6 };
    productos.forEach((p, i) => {
      const uC = p.pres[0].unidades;
      if (DISENO[p.id]) DISENO[p.id].forEach(d => lote(p, d[1] ? Math.max(4, Math.round(p.vd * Math.max(1, d[0] - 30) * d[1])) : d[3], d[0], d[2]));
      const dias = BAJO[p.id] || r(14, 42);
      let resto = Math.max(uC === 1 ? 2 : 10, Math.round(p.vd * dias));
      if (DISENO[p.id]) resto = Math.round(resto * 0.4);
      if (rnd() < 0.45 && resto > uC) { const a = Math.round(resto * 0.35); lote(p, a, r(150, 300), r(25, 29)); resto -= a; }
      lote(p, Math.max(1, resto), r(320, 720), r(2, 24));
    });
    // Compras: agrupar los lotes ingresados por fecha y proveedor
    const grupos = {};
    lotes.filter(l => l.ingreso > CORTE - 30 * DIA).forEach(l => { const k = M.diaISO(l.ingreso) + '|' + l.prov; (grupos[k] = grupos[k] || []).push(l); });
    Object.entries(grupos).sort().forEach(([k, ls], i) => {
      const prov = PROVEEDORES.find(p => p.id === k.split('|')[1]);
      const items = ls.map(l => { const p = prod(l.pid); const uC = p.pres[0].unidades; return { pid: l.pid, lote: l.id, codigo: l.codigo, vence: l.vence, unidades: l.cant, costo: M.r2(l.cant * l.costoU), cajas: M.r2(l.cant / uC) }; });
      const c = { id: 'CP' + (i + 1), t: ls[0].ingreso, prov: prov.id, factura: 'F00' + (i % 3 + 1) + '-' + String(1200 + i * 7), items, total: M.r2(items.reduce((s, x) => s + x.costo, 0)), por: 'P2' };
      ls.forEach(l => { l.compra = c.id; });
      compras.push(c);
    });

    /* ===== Gastos ===== */
    const gastos = [];
    const g = (dAgo, cat, det, monto) => gastos.push({ id: 'G' + (gastos.length + 1), t: CORTE - dAgo * DIA + 11 * 36e5, cat, det, monto, por: 'P3' });
    const d1 = new Date(CORTE); const diaMes = d1.getDate();
    const haceDiaMes = n => (diaMes >= n ? diaMes - n : diaMes + 30 - n);
    g(haceDiaMes(1), 'Alquiler', 'Local de la botica', 1800);
    g(haceDiaMes(5), 'Servicios', 'Luz (recibo del mes)', 286.4);
    g(haceDiaMes(6), 'Servicios', 'Agua', 92.1);
    g(haceDiaMes(7), 'Servicios', 'Internet y teléfono', 99);
    g(haceDiaMes(15) || 30, 'Sueldos', 'Quincena del personal', 3700);
    for (let i = 0; i < 9; i++) g(r(1, 30), pick(['Útiles', 'Movilidad', 'Limpieza']), pick(['Bolsas y papel de impresora', 'Movilidad a la droguería', 'Artículos de limpieza', 'Cinta para impresora térmica']), r(8, 45));
    gastos.sort((a, b) => b.t - a.t);

    /* ===== Cierres de caja ===== */
    const cajas = [];
    for (let dAgo = 30; dAgo >= 1; dAgo--) {
      const d0 = CORTE - dAgo * DIA;
      const ef = ventas.filter(v => !v.anulada && v.medio === 'Efectivo' && v.t >= d0 && v.t < d0 + DIA).reduce((s, v) => s + v.total, 0);
      const esperado = M.r2(150 + ef);
      const dif = rnd() < 0.82 ? 0 : (rnd() < 0.55 ? -1 : 1) * r(1, 5) / (rnd() < 0.5 ? 1 : 10);
      cajas.push({ fecha: M.diaISO(d0), fondo: 150, abre: d0 + 8 * 36e5, cierra: d0 + 22 * 36e5, esperado, contado: M.r2(esperado + dif), por: 'P1' });
    }

    const historial = [
      { t: CORTE - 6 * DIA + 10 * 36e5, usuario: 'Rosa Mendoza Ríos', accion: 'Cambió precio', detalle: 'Naproxeno 550 mg · blíster: S/ 3.50 → S/ 4.00' },
      { t: CORTE - 12 * DIA + 16 * 36e5, usuario: 'Q.F. Milagros Torres Vega', accion: 'Ajustó stock', detalle: 'Mascarilla KN95: −3 unidades (dañadas)' },
      { t: CORTE - 19 * DIA + 9 * 36e5, usuario: 'Rosa Mendoza Ríos', accion: 'Cambió permisos', detalle: 'Luis Huamán Soto: puede ingresar compras' }
    ];

    return {
      empresa: { razon: 'Botica LifeFarma E.I.R.L. (ficticia)', nombre: 'Botica LifeFarma', ruc: '20999555001', direccion: 'Av. Perú 2150, San Martín de Porres, Lima (referencial)', horario: 'Lunes a domingo de 8:00 a. m. a 10:00 p. m.', qf: 'Q.F. Milagros Torres Vega', digemid: 'Registro DIGEMID 00000 (demo)', whatsapp: '51957111471' },
      ajustes: {
        pesos: Object.assign({}, M.PESOS_BASE), retiro: 30, cobertura: 15,
        permisos: { P1: ['vender'], P4: ['vender', 'compras'], P2: ['vender', 'compras', 'inventario', 'recetas'], P3: ['todo'] }
      },
      productos, proveedores: PROVEEDORES, lotes, compras, ventas, recetas, clientes, personas, gastos, cajas, historial,
      cajaHoy: null, ajustesStock: [], series, contadores: { venta: ventas.length, lote: nl, compra: compras.length, receta: recetas.length, gasto: gastos.length }
    };
  }

  LF.seed = seed;
})();
