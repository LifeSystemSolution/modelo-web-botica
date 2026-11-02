# Demo · Sistema para Boticas

Demostración interactiva de las 3 versiones del sistema para boticas de LifeSystem Solutions:

- **Básico**: vender, cobrar con vuelto, boletas y facturas, anular o corregir, abrir y cerrar caja.
- **Control**: todo lo del Básico + stock, alertas de poco stock y vencimiento, compras con lote y kardex.
- **Completo**: todo lo del Control + usuarios y permisos, gastos, reportes de ganancia y sugerencias de compra.

Es una página estática (HTML, CSS y JavaScript, sin dependencias). Usa datos de prueba en memoria: no emite comprobantes reales ni se conecta a SUNAT, y al recargar la página vuelve a empezar.

Para verla en local, abra una terminal en esta carpeta y ejecute:

```
python -m http.server 8765
```

Luego entre a http://localhost:8765.

Pruébalo desde la web
https://lifesystemsolution.github.io/modelo-web-botica/
