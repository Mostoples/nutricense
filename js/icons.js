/* ============================================================
   NUTRICENSE — Animated Icon System
   Path ikon mengikuti geometri Lucide (24x24, stroke currentColor).
   Animasi diimplementasikan lokal dengan CSS (lihat css/icons.css):
   gaya "draw-on" saat muncul + reaksi hover/aktif per ikon.
   Dipakai lewat <i data-ic="home"></i> atau icon('home').
   ============================================================ */

'use strict';

/* Setiap entri = isi <svg>. viewBox 24x24. */
export const ICONS = {
  /* ── Navigasi ── */
  home:        '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  utensils:    '<path d="M7 3v8a2 2 0 0 0 2 2V3"/><path d="M9 3v18"/><path d="M17 3c-1.5 1-2.5 3-2.5 5.5S15.5 13 17 13v8"/>',
  scan:        '<path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M4 12h16"/>',
  clipboard:   '<path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8.5 12h7"/><path d="M8.5 16h4.5"/>',
  user:        '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  users:       '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M18 14.4a6.5 6.5 0 0 1 3.5 5.6"/>',
  bell:        '<path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5"/><path d="M10.3 19a2 2 0 0 0 3.4 0"/>',
  grid:        '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',

  /* ── Aksi ── */
  arrowLeft:   '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>',
  arrowRight:  '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  chevron:     '<path d="M9 5l7 7-7 7"/>',
  chevronDown: '<path d="M5 9l7 7 7-7"/>',
  plus:        '<path d="M12 5v14"/><path d="M5 12h14"/>',
  search:      '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.6-3.6"/>',
  filter:      '<path d="M3.5 5h17l-6.5 8v6l-4 2v-8z"/>',
  download:    '<path d="M12 3v12"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4 18.5v1a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-1"/>',
  settings:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.1a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.2A1.7 1.7 0 0 0 4.3 6.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H22a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1.1z"/>',
  logout:      '<path d="M9.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.5"/><path d="M16 16.5 20.5 12 16 7.5"/><path d="M20.5 12H9.5"/>',
  eye:         '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:      '<path d="M10.6 6.1A8.7 8.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.8"/><path d="M6.4 7.5A17 17 0 0 0 2.5 12S6 18 12 18a9 9 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/>',
  refresh:     '<path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 12.5A8 8 0 0 0 17.7 17.7L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  send:        '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 10l18-7z"/>',

  /* ── Status ── */
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.2 12.3l2.6 2.6 5-5.4"/>',
  alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.3v.2"/>',
  xCircle:     '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/>',
  check:       '<path d="M4.5 12.5l5 5 10-11"/>',
  x:           '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
  shield:      '<path d="M12 2.8 20 6v6c0 5-3.4 8-8 9.2C7.4 20 4 17 4 12V6z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.6"/>',

  /* ── Sensor / lab ── */
  thermometer: '<path d="M13.5 14.2V4.8a2 2 0 1 0-4 0v9.4a4 4 0 1 0 4 0z"/>',
  droplet:     '<path d="M12 3.2s6 6 6 9.8a6 6 0 0 1-12 0c0-3.8 6-9.8 6-9.8z"/>',
  wind:        '<path d="M3 8.5h10a3 3 0 1 0-3-3"/><path d="M3 12.5h14a3 3 0 1 1-3 3"/><path d="M3 16.5h6.5"/>',
  beaker:      '<path d="M9 3v6.2L4.4 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.8-3L15 9.2V3"/><path d="M8 3h8"/><path d="M6.6 14.5h10.8"/>',
  activity:    '<path d="M3 12h4l2.5-7 5 14 2.5-7h4"/>',
  cpu:         '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/><path d="M10 10.5h4v4h-4z"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/>',

  /* ── Domain ── */
  leaf:        '<path d="M4.5 19.5C3 15 5 6.5 20 4.5c1.5 10-4.5 16-11 15a4.5 4.5 0 0 1-4.5-4.5z"/><path d="M8.5 15.5C11 12 14 10 17.5 8.8"/>',
  apple:       '<path d="M12 8.2c-1.4-1.6-3.2-2-4.7-1.2C5.3 8 4.3 10.8 5.2 14c.9 3.2 2.9 5.8 4.6 5.8.8 0 1.4-.4 2.2-.4s1.4.4 2.2.4c1.7 0 3.7-2.6 4.6-5.8.9-3.2-.1-6-2.1-7-1.5-.8-3.3-.4-4.7 1.2z"/><path d="M12 8.2c.2-1.9 1.4-3.4 3.2-3.9"/>',
  camera:      '<path d="M4 8.5h2.8l1.4-2.2h7.6l1.4 2.2H20a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z"/><circle cx="12" cy="13.8" r="3.4"/>',
  image:       '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="M4 17l5-5 4.5 4.5L16.5 14l3.5 3.5"/>',
  qr:          '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M13.5 13.5h3v3h-3z"/><path d="M20.5 13.5v3M17.5 20.5h3M13.5 20.5h1"/>',
  package:     '<path d="M20.5 7.8v8.4a1.5 1.5 0 0 1-.8 1.3l-7 3.8a1.5 1.5 0 0 1-1.4 0l-7-3.8a1.5 1.5 0 0 1-.8-1.3V7.8"/><path d="m3.7 7.1 7.6-4.1a1.5 1.5 0 0 1 1.4 0l7.6 4.1-8.3 4.5z"/><path d="M12 11.6V20.9"/>',
  truck:       '<path d="M2.5 6.5h10.5v9.5H2.5z"/><path d="M13 9.5h3.8l2.7 3v3.5H13z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  school:      '<path d="M12 3 3 7.5h18z"/><path d="M4.5 7.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V7.5"/><path d="M9.5 20v-5h5v5"/><path d="M12 3V1.5"/>',
  building:    '<path d="M4 21V8.5l8-5.5 8 5.5V21"/><path d="M2.5 21h19"/><path d="M9.5 21v-5h5v5"/><path d="M8.5 11.5h1.5M14 11.5h1.5"/>',
  mapPin:      '<path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10.3" r="2.7"/>',
  fileText:    '<path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M13.5 3v5.5H19"/><path d="M8.5 13h7M8.5 17h4.5"/>',
  chart:       '<path d="M3 3v16.5a1.5 1.5 0 0 0 1.5 1.5H21"/><path d="M7.5 15.5v-3M12 15.5v-7M16.5 15.5v-5"/>',
  trending:    '<path d="M3 16.5 9 10l4 4 8-8.5"/><path d="M15 5.5h6v6"/>',
  calendar:    '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/>',
  book:        '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 1 5.5 21H19v-3"/>',
  help:        '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4"/><path d="M12 16.6v.2"/>',
  lock:        '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/><path d="M12 14.5v2"/>',
  idCard:      '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5 16.4a3.6 3.6 0 0 1 7 0"/><path d="M14.5 10h4M14.5 13.5h4"/>',
  sun:         '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/>',
  moon:        '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  sparkle:     '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z"/><path d="M18.5 4v3M20 5.5h-3"/>',
  menu:        '<path d="M4 7h16M4 12h16M4 17h16"/>',
  flag:        '<path d="M5 21V4"/><path d="M5 4.5h11l-1.6 3.5L16 11.5H5z"/>',
};

/* Preset animasi per ikon (kelas didefinisikan di css/icons.css) */
const MOTION = {
  bell: 'ic-swing', scan: 'ic-scanline', camera: 'ic-shutter',
  refresh: 'ic-spin-h', settings: 'ic-spin-h', search: 'ic-nudge',
  checkCircle: 'ic-pop', check: 'ic-pop', xCircle: 'ic-pop',
  alertCircle: 'ic-buzz', leaf: 'ic-sway', apple: 'ic-sway',
  sparkle: 'ic-twinkle', activity: 'ic-beat', trending: 'ic-rise',
  droplet: 'ic-drip', thermometer: 'ic-beat', wind: 'ic-drift',
  truck: 'ic-roll', send: 'ic-fly', download: 'ic-dip',
  arrowRight: 'ic-nudge', arrowLeft: 'ic-nudge-back', chevron: 'ic-nudge',
  plus: 'ic-turn', logout: 'ic-nudge', home: 'ic-pop', user: 'ic-pop',
  sun: 'ic-spin-h', moon: 'ic-sway', qr: 'ic-twinkle', shield: 'ic-pop',
};

/**
 * Bangun markup SVG satu ikon.
 * @param {string} name kunci ICONS
 * @param {{size?:number, cls?:string, draw?:boolean, sw?:number}} o
 */
export function icon(name, o = {}) {
  const body = ICONS[name];
  if (!body) { console.warn('[icons] tidak dikenal:', name); return ''; }
  const size = o.size || 22;
  const sw = o.sw || 1.8;
  const motion = MOTION[name] || '';
  const cls = ['ic', motion, o.draw ? 'ic-draw' : '', o.cls || ''].filter(Boolean).join(' ');
  return '<svg class="' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + body + '</svg>';
}

/** Ganti semua <i data-ic="nama"> di dalam root menjadi SVG sungguhan. */
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-ic]').forEach((node) => {
    const name = node.dataset.ic;
    if (!ICONS[name]) return;
    const span = document.createElement('span');
    span.className = ('ic-wrap ' + (node.getAttribute('class') || '')).trim();
    span.innerHTML = icon(name, {
      size: Number(node.dataset.icSize) || 22,
      draw: node.dataset.icDraw === '1',
      sw: Number(node.dataset.icSw) || 1.8,
    });
    node.replaceWith(span);
  });
}

/* ── Jembatan Lordicon (dipakai hemat: splash & empty-state) ──
   Web component dimuat malas; bila CDN gagal, ikon lokal tetap tampil. */
let lordiconReady = null;
export function ensureLordicon() {
  if (lordiconReady) return lordiconReady;
  lordiconReady = new Promise((resolve) => {
    const load = (src) => new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
    load('https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js')
      .then(() => load('https://cdn.jsdelivr.net/npm/lord-icon-element@4.0.0/dist/lord-icon.min.js'))
      .then(() => {
        if (window.lottie && window.defineLordIconElement && !customElements.get('lord-icon')) {
          window.defineLordIconElement(window.lottie.loadAnimation);
        }
        resolve(!!customElements.get('lord-icon'));
      })
      .catch(() => resolve(false));
  });
  return lordiconReady;
}

/** ID ikon Lordicon gratis yang sudah diverifikasi tersedia. */
export const LORD = {
  sekolah:    'qhviklyi',
  sppg:       'tdrtiskw',
  pemerintah: 'wloilxuq',
  murid:      'gqzfzudq',
  sukses:     'msoeawqm',
  kosong:     'puvaffet',
};

/**
 * <lord-icon> dengan fallback ikon lokal.
 * Animasi baru dipasang setelah berkas JSON-nya terbukti dapat diambil —
 * jadi bila CDN diblokir atau ID tidak valid, ikon lokal tetap tampil
 * dan tidak menyisakan kotak kosong.
 */
export function lordIcon(id, opt = {}) {
  const size = opt.size || 96;
  const trigger = opt.trigger || 'loop';
  const fallback = opt.fallback || 'sparkle';
  const key = 'ld' + Math.random().toString(36).slice(2, 9);
  const src = 'https://cdn.lordicon.com/' + id + '.json';

  Promise.all([ensureLordicon(), fetch(src, { mode: 'cors' }).then((r) => r.ok).catch(() => false)])
    .then(([ready, exists]) => {
      if (!ready || !exists) return;
      const h = document.querySelector('[data-lord="' + key + '"]');
      if (!h) return;
      h.innerHTML = '<lord-icon src="' + src + '" trigger="' + trigger + '" ' +
        'colors="primary:currentColor,secondary:currentColor" ' +
        'style="width:' + size + 'px;height:' + size + 'px"></lord-icon>';
    });

  return '<span class="lord-holder" data-lord="' + key + '" style="width:' + size + 'px;height:' + size + 'px">' +
    icon(fallback, { size: Math.round(size * 0.62), cls: 'lord-fallback' }) + '</span>';
}
