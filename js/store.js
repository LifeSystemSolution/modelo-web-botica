/* Almacenamiento en localStorage con versión de esquema.
   Si cambia SCHEMA o es otro día, se regeneran los datos de ejemplo: hoy siempre empieza en 0. */
(function () {
  const LF = (window.LF = window.LF || {});
  const KEY = 'lifefarma-datos';
  const SCHEMA = 3;

  const store = {
    db: null,
    SCHEMA,
    KEY,
    init() {
      let raw = null;
      try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
      if (!raw || raw.schema !== SCHEMA || raw.seedDay !== LF.motor.diaISO(Date.now())) {
        raw = LF.seed();
        raw.schema = SCHEMA;
        raw.seedDay = LF.motor.diaISO(Date.now());
        this.db = raw;
        this.save();
      } else {
        this.db = raw;
      }
      return this.db;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.db)); }
      catch (e) { if (LF.ui) LF.ui.toast('No se pudo guardar en este navegador. Libera espacio o prueba con otro navegador.', 'error'); }
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento */ }
      return this.init();
    },
    nextId(tipo) {
      const c = this.db.contadores;
      c[tipo] = (c[tipo] || 0) + 1;
      return c[tipo];
    },
    log(accion, detalle) {
      const u = LF.sesion ? LF.sesion.nombre : 'Sistema';
      this.db.historial.unshift({ t: Date.now(), usuario: u, accion, detalle: detalle || '' });
      if (this.db.historial.length > 300) this.db.historial.length = 300;
    },
    persona(id) { return this.db.personas.find(p => p.id === id); },
    cliente(id) { return this.db.clientes.find(c => c.id === id); },
    producto(id) { return this.db.productos.find(p => p.id === id); },
    proveedor(id) { return this.db.proveedores.find(p => p.id === id); },
    venta(id) { return this.db.ventas.find(v => v.id === id); },
    lotesDe(pid) { return this.db.lotes.filter(l => l.pid === pid); },
    stock(pid) { return LF.motor.stockVendible(this.db.lotes, pid, Date.now(), this.db.ajustes.retiro); },
    stockTotal(pid) { return this.db.lotes.filter(l => l.pid === pid).reduce((s, l) => s + l.cant, 0); },
    riesgoLote(l) { const p = this.producto(l.pid); return LF.motor.riesgoLote(l, this.lotesDe(l.pid), p.vd, { pesos: this.db.ajustes.pesos, retiro: this.db.ajustes.retiro, fraccionable: p.pres.length > 1 }); },
    reposicion(p) { return LF.motor.reposicion(p, this.stock(p.id), p.vd, { cobertura: this.db.ajustes.cobertura }); },
    puede(perm) { const s = LF.sesion; if (!s) return false; const P = this.db.ajustes.permisos[s.personaId] || []; return P.includes('todo') || P.includes(perm); }
  };

  LF.store = store;
})();
