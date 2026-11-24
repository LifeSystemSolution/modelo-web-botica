/* Íconos de interfaz (trazo 1.75) e ilustraciones dibujadas a mano por categoría */
(function () {
  const LF = (window.LF = window.LF || {});

  const ui = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    ticket: '<path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z"/><path d="M9 5v14" stroke-dasharray="2 2.5"/>',
    queue: '<path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4.5M12 17.5v.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.8 3.6-5.5 6.5-5.5s5.7 1.7 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.6 5.2"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 9v6M10 9v6M13 9v6M16.5 9v6"/>',
    send: '<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>',
    filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 12h8M8 16h6"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8.4 19z"/><path d="M9 9.2c0 2.8 2.6 5.6 5.6 5.8l1.3-1.4-1.8-1-.9.8c-1-.4-2.1-1.5-2.5-2.5l.8-.9-1-1.8z"/>',
    swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/>',
    pin: '<path d="M12 21s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.7-.8 1.2v.9M12 17v.5"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.5M10 10h.5M14 10h.5M18 10h.5M7 14h10"/>',
    escalate: '<path d="M4 20h5v-5h5v-5h6"/><path d="m16 6 4 4-4 4" transform="translate(0 -4)"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3.5h3l2.4 11.2h11.2L21 7H6.6"/>',
    receipt: '<path d="M5 3h14v18l-2.5-1.6L14 21l-2-1.6L10 21l-2.5-1.6L5 21z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l6.9-6.9a5 5 0 0 1 7 7z"/><path d="m7 10 7 7"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    truck: '<path d="M2 6h12v10H2z"/><path d="M14 9h4l3 3.5V16h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
    store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 11.5V20h14v-8.5M10 20v-5h4v5"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.1M18 14.5v.1"/>',
    scale: '<path d="M5 20h14"/><path d="M7 20 8.5 9h7L17 20"/><circle cx="12" cy="6" r="2.5"/>',
    sign: '<path d="M3 17c2.5 0 3-6 5-6s1.5 5 3.5 5 2.5-3 4-3 1.5 2 2.5 2"/><path d="M3 21h18"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>'
  };

  function icon(name, cls) {
    const p = ui[name] || ui.help;
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* Ilustraciones 64x64: trazo a mano (líneas ligeramente irregulares), relleno suave y un acento rojo */
  const S = 'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const F = 'fill="var(--ill-fill, var(--surface))"';
  const R = 'fill="var(--brand)"';
  const ill = {
    pastilla:
      '<circle cx="24" cy="36" r="13.6" ' + F + ' ' + S + '/>' +
      '<path ' + S + ' fill="none" d="M15.2 26.6 33 45.2"/>' +
      '<path ' + F + ' ' + S + ' d="M40.4 12.6c3.2-3.1 8.4-3 11.5.2 3.1 3.2 3 8.3-.2 11.4l-9.6 9.4c-3.2 3.1-8.4 3-11.5-.2-3.1-3.2-3-8.3.2-11.4z"/>' +
      '<path fill="var(--brand)" d="M45.6 17.4 36.6 26.2c-1.4-1.6-1.3-4 .2-5.5l4.4-4.3c1.4-1.4 3.6-1.5 5.2-.1z" opacity=".95"/>',
    capsula:
      '<path ' + F + ' ' + S + ' d="M21.4 46.6c-4.4-4.3-4.5-11.4-.1-15.8l13.6-13.6c4.4-4.4 11.5-4.4 15.8 0 4.4 4.3 4.4 11.4 0 15.8L37.2 46.6c-4.3 4.3-11.4 4.4-15.8 0z"/>' +
      '<path fill="var(--brand)" d="M28.1 24.1 21.3 30.8c-4.4 4.4-4.3 11.5.1 15.8 4.4 4.4 11.5 4.3 15.8 0l6.7-6.7z"/>' +
      '<path ' + S + ' fill="none" d="M28.1 24.1 43.9 39.9"/><path stroke="#fff" stroke-width="2" stroke-linecap="round" d="M23.6 38.2l3-3"/>',
    frasco:
      '<path ' + F + ' ' + S + ' d="M22.6 22.4c6.4-.3 12.6-.3 18.9.1 3 .2 5.1 2.6 5.1 5.5l-.3 22.8c0 2.8-2.3 5-5.1 5H23.1c-2.8 0-5.1-2.3-5.1-5.1l.1-23.1c0-2.7 2-5 4.5-5.2z"/>' +
      '<path ' + S + ' fill="var(--bg)" d="M25.6 22.2V15.6c4.3-.3 8.6-.3 12.9 0l-.1 6.6"/><path ' + S + ' fill="none" d="M24.4 10.8c5.1-.3 10.2-.3 15.3 0l-.1 4.8H24.4z"/>' +
      '<path fill="var(--brand)" d="M24 31.4c5.4-.2 10.8-.2 16.2 0l-.1 11.6c-5.4.2-10.8.2-16.1 0z"/>' +
      '<path stroke="#fff" stroke-width="2.4" stroke-linecap="round" d="M32.1 33.8v6.8M28.7 37.2h6.8"/>',
    caja:
      '<path ' + F + ' ' + S + ' d="M10.6 22.6c14.4-.6 28.8-.5 43 .1 1.4.1 2.4 1.2 2.4 2.6l-.3 21.6c0 1.4-1.1 2.5-2.5 2.5l-42.3.1c-1.4 0-2.5-1.1-2.5-2.5l.1-21.8c0-1.4 1-2.5 2.1-2.6z"/>' +
      '<path ' + S + ' fill="var(--bg)" d="M14.6 22.4 18 14.4c9.4-.4 18.8-.3 28.2.1l3.4 7.9"/>' +
      '<path fill="var(--brand)" d="M17 30.2c4.8-.2 9.6-.2 14.4 0l-.1 11.2c-4.8.2-9.6.2-14.3 0z"/>' +
      '<path stroke="#fff" stroke-width="2.4" stroke-linecap="round" d="M24.2 32.6v6.4M21 35.8h6.4"/><path ' + S + ' fill="none" d="M36.4 32.2h12M36.4 38.4h8.4"/>',
    sobre:
      '<path ' + F + ' ' + S + ' d="M14.6 12.4c11.6-.5 23.2-.4 34.8.1 1.4.1 2.4 1.2 2.4 2.6l-.3 34.4c0 1.4-1.1 2.5-2.5 2.5l-34.2.1c-1.4 0-2.5-1.1-2.5-2.5l.1-34.6c0-1.4 1-2.5 2.2-2.6z"/>' +
      '<path ' + S + ' fill="none" stroke-dasharray="1.5 4" d="M12.6 19.2c12.8-.4 25.8-.4 38.8.1M12.6 44.8c12.8-.4 25.8-.4 38.8.1"/>' +
      '<circle cx="32" cy="32" r="6.2" fill="var(--brand)"/>',
    tubo:
      '<path ' + F + ' ' + S + ' d="M14.4 21.6 44.6 14c2.2-.5 4.4.8 5 3l3.9 15.6c.6 2.2-.8 4.5-3 5l-30.4 7.4z"/>' +
      '<path ' + S + ' fill="var(--bg)" d="M14.4 21.6 6.4 22.8l4 22.4 9.8-.3"/>' +
      '<path ' + S + ' fill="none" d="M53 26.2l4.8-1.2 1.6 6.4-4.8 1.2"/>' +
      '<path fill="var(--brand)" d="M27.8 22.4 40.4 19.2l2.6 10.6-12.6 3.2z"/>',
    inhalador:
      '<path ' + F + ' ' + S + ' d="M30.4 8.6c3.6-.2 7.2-.2 10.8 0l.1 30.6-11 .1z"/>' +
      '<path ' + S + ' fill="var(--bg)" d="M26.2 38.6c6.4-.4 12.6-.4 18.9 0l.2 11.6c-.1 2.4-2 4.3-4.4 4.3H16.6c-2.4 0-4.4-2-4.4-4.4l.1-3.2c.1-2.3 2-4.2 4.3-4.2h9.4z"/>' +
      '<path fill="var(--brand)" d="M30.6 16.6c3.6-.2 7-.2 10.6 0v8.8c-3.5.2-7.1.2-10.6 0z"/>',
    termometro:
      '<path ' + F + ' ' + S + ' d="M27 12.6c0-2.9 2.3-5.2 5.1-5.2 2.9 0 5.2 2.3 5.1 5.2l-.1 25.6c3.3 1.8 5.4 5.2 5.4 9.1 0 5.7-4.6 10.4-10.4 10.4S21.7 53 21.7 47.3c0-3.9 2.1-7.3 5.4-9.1z"/>' +
      '<circle cx="32.1" cy="47.3" r="5" fill="var(--brand)"/><path stroke="var(--brand)" stroke-width="3" stroke-linecap="round" d="M32.1 42.4V24"/>' +
      '<path ' + S + ' fill="none" d="M39.8 16.4h4.2M39.8 22.6h2.6M39.8 28.8h4.2"/>',
    receta:
      '<path ' + F + ' ' + S + ' d="M14.6 8.6c11.6-.5 23.2-.4 34.8.1 1.4.1 2.4 1.2 2.4 2.6l-.3 41.6c0 1.4-1.1 2.5-2.5 2.5l-34.2.1c-1.4 0-2.5-1.1-2.5-2.5l.1-41.8c0-1.4 1-2.5 2.2-2.6z"/>' +
      '<path stroke="var(--brand)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M20 18.4v12.4M20 18.4h4.6c2.2 0 3.8 1.6 3.8 3.6s-1.6 3.6-3.8 3.6H20M24.4 25.6l6 8.4M30.6 26.4l-5.8 7.8"/>' +
      '<path ' + S + ' fill="none" d="M20 40.4h24M20 46.4h15.2M38.4 20.6h6"/>',
    botica:
      '<path ' + F + ' ' + S + ' d="M9.4 26.6 13.2 12.4c12.6-.5 25.2-.4 37.8.1l3.6 14.2"/>' +
      '<path ' + F + ' ' + S + ' d="M12.2 26.8l-.2 27.4 39.8.2.2-27.6"/>' +
      '<path ' + S + ' fill="var(--bg)" d="M26.4 54.2V41.6c3.6-.2 7.4-.2 11 0l.2 12.6"/>' +
      '<path fill="var(--brand)" d="M28.4 15.6h7v4.4h4.4v7h-4.4v4.4h-7V27h-4.4v-7h4.4z"/>',
    cobro:
      '<path ' + F + ' ' + S + ' d="M8.6 20.2c15.4-.6 30.8-.5 46.2.1 1.4.1 2.4 1.2 2.4 2.6l-.3 20.4c0 1.4-1.1 2.5-2.5 2.5l-45.6.1c-1.4 0-2.5-1.1-2.5-2.5l.1-20.6c0-1.4 1-2.5 2.2-2.6z"/>' +
      '<circle cx="32" cy="33.2" r="6.4" stroke="var(--brand)" stroke-width="2.6" fill="none"/>' +
      '<path ' + S + ' fill="none" d="M14.4 27.4v.2M49.6 39v.2"/>'
  };

  function illus(cat, size) {
    const s = size || 48;
    return '<svg class="ill" width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true">' + (ill[cat] || ill.caja) + '</svg>';
  }

  LF.icon = icon;
  LF.illus = illus;
})();
