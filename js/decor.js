/* ============================================================
   NUTRICENSE — Dekorasi SVG orisinal
   Semua bentuk digambar khusus untuk merek ini (bukan stok):
   monogram "nc", glyph percikan dari logo, blob organik,
   garis kontur piring, gauge cincin, dan bingkai pindai.
   Semuanya memakai currentColor / token tema.
   ============================================================ */

'use strict';

let uid = 0;
const nid = (p) => p + '-' + (++uid);

/* ── Monogram "nc" — huruf dibangun dari sapuan tebal membulat,
      ditemani tiga percikan miring seperti pada logo. ── */
export function logoMark(size = 44, opt = {}) {
  const g = nid('lg');
  const spark = opt.spark !== false;
  return `
<svg class="nc-mark" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${g}" x1="14" y1="20" x2="86" y2="86" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="var(--lime-500)"/>
      <stop offset="1" stop-color="var(--g-600)"/>
    </linearGradient>
  </defs>
  ${spark ? `
  <g stroke="url(#${g})" stroke-width="7" stroke-linecap="round" class="nc-mark-spark">
    <path d="M22 26 L18 12"/>
    <path d="M33 23 L33 9"/>
    <path d="M43 26 L48 13"/>
  </g>` : ''}
  <!-- huruf n -->
  <path d="M25 46 V78" stroke="url(#${g})" stroke-width="15" stroke-linecap="round"/>
  <path d="M25 52 a13 13 0 0 1 26 0 V78" stroke="url(#${g})" stroke-width="15"
        stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- huruf c -->
  <path d="M89 44 a19 19 0 1 0 0 34" stroke="url(#${g})" stroke-width="15"
        stroke-linecap="round" fill="none"/>
  <!-- percikan kecil kanan -->
  <path d="M92 52 l3.5 6.5 6.5 3.5 -6.5 3.5 -3.5 6.5 -3.5 -6.5 -6.5 -3.5 6.5 -3.5z"
        fill="url(#${g})" opacity=".85" transform="translate(-6 -14) scale(.62)"/>
</svg>`;
}

/* ── Latar blob organik: dua bentuk membulat bertumpuk dengan
      gradien lembut. Dipakai di hero, splash, dan kartu besar. ── */
export function blobField(opt = {}) {
  const a = nid('bl'), b = nid('bl'), c = nid('bl');
  const op = opt.opacity ?? 1;
  return `
<svg class="nc-blobs" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice"
     aria-hidden="true" style="opacity:${op}">
  <defs>
    <radialGradient id="${a}" cx=".3" cy=".3" r=".9">
      <stop offset="0" stop-color="var(--g-300)" stop-opacity=".55"/>
      <stop offset="1" stop-color="var(--g-500)" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${b}" cx=".7" cy=".4" r=".8">
      <stop offset="0" stop-color="var(--lime-400)" stop-opacity=".45"/>
      <stop offset="1" stop-color="var(--lime-500)" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${c}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--g-400)" stop-opacity=".3"/>
      <stop offset="1" stop-color="var(--g-700)" stop-opacity=".08"/>
    </linearGradient>
  </defs>
  <circle cx="110" cy="90" r="150" fill="url(#${a})" class="nc-blob nc-blob-1"/>
  <circle cx="310" cy="130" r="130" fill="url(#${b})" class="nc-blob nc-blob-2"/>
  <path class="nc-blob nc-blob-3" fill="url(#${c})"
        d="M60 240c40-52 96-34 150-52s96-70 140-30 22 128-38 152-190 30-232 6-60-24-20-76z"/>
</svg>`;
}

/* ── Garis kontur "piring": lingkaran sekat 4 bagian seperti nampan
      NC-BOX, dipakai sebagai tekstur latar halus. ── */
export function plateContour(size = 240) {
  return `
<svg class="nc-plate" width="${size}" height="${size}" viewBox="0 0 200 200" fill="none" aria-hidden="true">
  <g stroke="currentColor" fill="none" stroke-linecap="round">
    <circle cx="100" cy="100" r="92" stroke-width="1.2" opacity=".28"/>
    <circle cx="100" cy="100" r="74" stroke-width="1"   opacity=".2" stroke-dasharray="3 7"/>
    <circle cx="100" cy="100" r="52" stroke-width="1.2" opacity=".26"/>
    <path d="M100 26v148M26 100h148" stroke-width="1" opacity=".16"/>
    <path d="M100 48a52 52 0 0 1 52 52" stroke-width="2.4" opacity=".55" class="nc-plate-arc"/>
  </g>
</svg>`;
}

/* ── Percikan bertebaran — glyph yang sama dengan logo, dipakai
      sebagai aksen kecil di sudut kartu. ── */
export function sparkField(n = 5) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = 8 + (i * 37) % 90, y = 10 + (i * 53) % 80;
    const s = 0.5 + ((i * 7) % 5) / 8;
    const d = (i * 0.42).toFixed(2);
    out += `<path d="M50 30 l6 13 13 6 -13 6 -6 13 -6 -13 -13 -6 13 -6z"
      transform="translate(${x - 50} ${y - 50}) scale(${s})" fill="currentColor"
      style="animation-delay:${d}s" class="nc-spark"/>`;
  }
  return `<svg class="nc-sparks" viewBox="0 0 100 100" fill="none" aria-hidden="true">${out}</svg>`;
}

/* ── Gauge cincin untuk Food Safety Index ── */
export function gaugeRing(value, opt = {}) {
  const size = opt.size || 118;
  const max = opt.max || 100;
  const r = 46, C = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const g = nid('gg');
  const tone = value >= 85 ? 'var(--ok)' : value >= 70 ? 'var(--warn)' : 'var(--bad)';
  return `
<svg class="nc-gauge" width="${size}" height="${size}" viewBox="0 0 110 110" aria-hidden="true">
  <defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tone}"/>
      <stop offset="1" stop-color="${tone}" stop-opacity=".55"/>
    </linearGradient>
  </defs>
  <circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--line)" stroke-width="9"/>
  <circle cx="55" cy="55" r="${r}" fill="none" stroke="url(#${g})" stroke-width="9"
          stroke-linecap="round" transform="rotate(-90 55 55)"
          stroke-dasharray="${C.toFixed(1)}"
          style="--to:${(C * (1 - pct)).toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"
          class="nc-gauge-arc"/>
</svg>`;
}

/* ── Bingkai pindai bersudut — dipakai di layar kamera ── */
export function scanFrame() {
  return `
<svg class="nc-scanframe" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none" vector-effect="non-scaling-stroke">
    <path d="M4 20V8a4 4 0 0 1 4-4h12"/>
    <path d="M80 4h12a4 4 0 0 1 4 4v12"/>
    <path d="M96 80v12a4 4 0 0 1-4 4H80"/>
    <path d="M20 96H8a4 4 0 0 1-4-4V80"/>
  </g>
  <rect class="nc-scanbeam" x="4" y="4" width="92" height="2.2" fill="currentColor" opacity=".7"/>
</svg>`;
}

/* ── Pembatas gelombang antar-seksi ── */
export function waveDivider(flip = false) {
  return `
<svg class="nc-wave${flip ? ' is-flip' : ''}" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 46c180-38 360 26 540 26s360-56 540-42 240 44 360 30V90H0z" fill="currentColor"/>
</svg>`;
}

/* ════════════════════════════════════════════════════════════
   DEKORASI KARTU
   Delapan motif untuk sudut kartu. Semuanya digambar pada
   viewBox 120x120, memakai currentColor, dan disetel agar
   tetap terbaca pada opasitas rendah: garis tebal minimal
   1.5 dan bentuk besar — motif berdetail halus akan hilang.
   ════════════════════════════════════════════════════════════ */

const DECO = {
  /* Jalur sirkuit dengan simpul — kesan perangkat keras */
  circuit: `
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M8 30h26l12-12h30"/>
      <path d="M8 58h14l14 14h44"/>
      <path d="M40 88h20l14-14h38"/>
      <path d="M76 18v22l14 14"/>
      <path d="M22 58v30"/>
    </g>
    <g fill="currentColor">
      <circle cx="76" cy="18" r="4"/><circle cx="90" cy="54" r="4"/>
      <circle cx="22" cy="88" r="4"/><circle cx="112" cy="74" r="4"/>
      <circle cx="34" cy="30" r="3"/>
    </g>`,

  /* Gelombang berlapis — aliran data */
  wave: `
    <g fill="none" stroke="currentColor" stroke-linecap="round">
      <path d="M-4 44c18-16 34 16 52 0s34-16 52 0 20 8 24 4" stroke-width="2.4"/>
      <path d="M-4 66c18-16 34 16 52 0s34-16 52 0 20 8 24 4" stroke-width="1.8" opacity=".7"/>
      <path d="M-4 88c18-16 34 16 52 0s34-16 52 0 20 8 24 4" stroke-width="1.4" opacity=".45"/>
    </g>`,

  /* Kisi heksagon — molekuler, sejalan dengan logo perangkat */
  hex: `
    <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
      <path d="M60 8l20 11v23L60 53 40 42V19z"/>
      <path d="M100 32l20 11v23l-20 11-20-11V43z" opacity=".7"/>
      <path d="M60 56l20 11v23l-20 11-20-11V67z" opacity=".5"/>
      <path d="M20 32l20 11v23l-20 11-20-11V43z" opacity=".35"/>
    </g>
    <circle cx="60" cy="31" r="5" fill="currentColor"/>`,

  /* Cincin sepusat + jarum — radar sensor */
  rings: `
    <g fill="none" stroke="currentColor" stroke-linecap="round">
      <circle cx="88" cy="34" r="16" stroke-width="2"/>
      <circle cx="88" cy="34" r="30" stroke-width="1.6" opacity=".65" stroke-dasharray="5 7"/>
      <circle cx="88" cy="34" r="46" stroke-width="1.4" opacity=".4"/>
      <path d="M88 34l32-16" stroke-width="2.2"/>
      <path d="M56 88a52 52 0 0 0 52-52" stroke-width="2" opacity=".8"/>
    </g>
    <circle cx="88" cy="34" r="4.5" fill="currentColor"/>`,

  /* Urat daun — sisi gizi/organik */
  leaf: `
    <g fill="none" stroke="currentColor" stroke-linecap="round">
      <path d="M14 106C4 72 22 24 108 12c8 58-30 92-70 88a24 24 0 0 1-24-22z" stroke-width="2.2"/>
      <path d="M30 92C48 66 74 46 100 34" stroke-width="1.8" opacity=".8"/>
      <g stroke-width="1.4" opacity=".55">
        <path d="M44 78c-2-12-8-20-16-24"/><path d="M58 64c-2-12-8-20-16-24"/>
        <path d="M74 52c-2-12-8-20-16-24"/><path d="M52 84c8-2 16 0 22 6"/>
        <path d="M66 70c8-2 16 0 22 6"/>
      </g>
    </g>`,

  /* Batang data dengan garis tren */
  bars: `
    <g fill="currentColor">
      <rect x="14" y="72" width="12" height="34" rx="4" opacity=".45"/>
      <rect x="34" y="58" width="12" height="48" rx="4" opacity=".6"/>
      <rect x="54" y="66" width="12" height="40" rx="4" opacity=".5"/>
      <rect x="74" y="40" width="12" height="66" rx="4" opacity=".75"/>
      <rect x="94" y="24" width="12" height="82" rx="4"/>
    </g>
    <path d="M20 66l20-14 20 8 20-24 20-14" fill="none" stroke="currentColor"
          stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,

  /* Kurung sudut bergaris ukur — kesan instrumen */
  frame: `
    <g fill="none" stroke="currentColor" stroke-linecap="round">
      <path d="M112 8H92" stroke-width="2.6"/><path d="M112 8v20" stroke-width="2.6"/>
      <path d="M8 112h20" stroke-width="2.6"/><path d="M8 112V92" stroke-width="2.6"/>
      <g stroke-width="1.6" opacity=".6">
        <path d="M112 40h-9"/><path d="M112 52h-14"/><path d="M112 64h-9"/>
        <path d="M112 76h-14"/><path d="M40 112v-9"/><path d="M52 112v-14"/>
        <path d="M64 112v-9"/><path d="M76 112v-14"/>
      </g>
      <path d="M112 8 8 112" stroke-width="1.2" opacity=".28" stroke-dasharray="4 8"/>
    </g>`,

  /* Titik mengorbit pada elips miring */
  orbit: `
    <g fill="none" stroke="currentColor">
      <ellipse cx="62" cy="60" rx="52" ry="22" stroke-width="1.8" transform="rotate(-24 62 60)"/>
      <ellipse cx="62" cy="60" rx="52" ry="22" stroke-width="1.5" opacity=".65" transform="rotate(30 62 60)"/>
      <ellipse cx="62" cy="60" rx="34" ry="34" stroke-width="1.3" opacity=".4"/>
    </g>
    <g fill="currentColor">
      <circle cx="62" cy="60" r="6"/>
      <circle cx="108" cy="40" r="4"/><circle cx="24" cy="82" r="3.5" opacity=".7"/>
      <circle cx="34" cy="34" r="3" opacity=".55"/>
    </g>`,
};

export const DECO_KINDS = Object.keys(DECO);

/**
 * Dekorasi sudut untuk sebuah kartu.
 * @param {string} kind kunci DECO; bila tidak dikenal dipilih dari nama
 * @param {{size?:number, pos?:'tr'|'br'|'bl'}} o
 */
export function cardDeco(kind, o = {}) {
  const body = DECO[kind] || DECO[DECO_KINDS[hashStr(String(kind)) % DECO_KINDS.length]];
  const size = o.size || 132;
  const pos = o.pos || 'tr';
  return `<svg class="card-deco at-${pos}" width="${size}" height="${size}"
    viewBox="0 0 120 120" fill="none" aria-hidden="true">${body}</svg>`;
}

/** Hash kecil dan stabil — agar kartu yang sama selalu dapat motif yang sama. */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Sebar motif berbeda ke sekumpulan elemen agar tidak berulang. */
export function scatterDeco(nodes, { size = 132, positions = ['tr', 'br', 'bl'] } = {}) {
  Array.from(nodes).forEach((el, i) => {
    if (el.querySelector(':scope > .card-deco')) return;
    const kind = DECO_KINDS[i % DECO_KINDS.length];
    const pos = positions[i % positions.length];
    el.insertAdjacentHTML('afterbegin', cardDeco(kind, { size, pos }));
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = el.style.overflow || 'hidden';
  });
}

/* ── Ilustrasi nampan MBG sederhana (pengganti foto) ── */
export function trayGlyph(size = 64) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true" class="nc-tray">
  <rect x="4" y="10" width="56" height="44" rx="9" fill="var(--inset)" stroke="var(--line-2)" stroke-width="1.6"/>
  <rect x="9" y="15" width="23" height="16" rx="5" fill="var(--g-100)"/>
  <rect x="35" y="15" width="20" height="16" rx="5" fill="var(--macro-lem)"/>
  <rect x="9" y="34" width="20" height="15" rx="5" fill="var(--macro-kal)"/>
  <rect x="32" y="34" width="23" height="15" rx="5" fill="var(--g-200)"/>
  <circle cx="20" cy="23" r="4.5" fill="#fff" opacity=".75"/>
  <path d="M40 26c2-4 6-6 10-5" stroke="var(--g-600)" stroke-width="2" stroke-linecap="round"/>
</svg>`;
}
