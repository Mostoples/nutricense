# ============================================================
#  NUTRICENSE — Rekam penggunaan aplikasi untuk showreel
#
#  Playwright membuka situs yang tayang, masuk memakai akun demo,
#  lalu menjalankan tur bernaskah: pindah layar dan menggulir
#  halus. Setiap peran direkam menjadi satu berkas video.
#
#  Catatan: aplikasi menggulir di dalam #scroll (bukan window),
#  jadi scroll dianimasikan sendiri lewat requestAnimationFrame —
#  mouse.wheel menghasilkan gerak patah-patah pada rekaman.
#
#  python record_app.py [--url ...] [--roles sekolah,sppg]
# ============================================================

import os
import shutil
import subprocess
import sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw_app')
OUT = os.path.join(HERE, 'app_clips')
for d in (RAW, OUT):
    os.makedirs(d, exist_ok=True)

URL = 'https://nutricense.web.app'
if '--url' in sys.argv:
    URL = sys.argv[sys.argv.index('--url') + 1]

FFMPEG = os.environ.get('FFMPEG_BIN', 'ffmpeg')

VW, VH = 540, 1170          # viewport telepon; juga ukuran rekaman
FPS = 24

# ── Naskah tur per peran ─────────────────────────────────────
#   ('goto', hash)          buka layar
#   ('scroll', px, ms)      gulir halus sejauh px dalam ms
#   ('tap', selector)       klik elemen
#   ('wait', ms)            diam
TOURS = {
    'sekolah': [
        ('wait', 900),
        ('scroll', 620, 2200), ('wait', 500),
        ('scroll', -620, 1400),
        # Jeda 4,2 s: pratinjau 3D NC-BOX baru muncul setelah batas waktu
        # kamera 2,5 s, jadi rana ditekan sesudah pratinjau terlihat.
        ('tap', '#tabbar [data-nav="scan"]'), ('wait', 6500),
        ('tap', '[data-act="ambil"]'), ('wait', 2600),
        ('scroll', 500, 1800), ('wait', 600),
        ('tap', '#tabbar [data-nav="riwayat"]'), ('wait', 1400),
        ('scroll', 420, 1600), ('wait', 700),
    ],
    'sppg': [
        ('wait', 900),
        ('scroll', 900, 3000), ('wait', 500),
        ('tap', '#tabbar [data-nav="menu"]'), ('wait', 1500),
        ('tap', '#tabbar [data-nav="bahan"]'), ('wait', 1500),
        ('scroll', 400, 1400),
        ('tap', '#tabbar [data-nav="periksa"]'), ('wait', 1600),
        ('scroll', 500, 1800), ('wait', 700),
    ],
    'pemerintah': [
        ('wait', 900),
        ('scroll', 1000, 3200), ('wait', 500),
        ('tap', '#tabbar [data-nav="sppg"]'), ('wait', 1600),
        ('scroll', 420, 1500),
        ('tap', '#tabbar [data-nav="sekolah"]'), ('wait', 1500),
        ('tap', '#tabbar [data-nav="laporan"]'), ('wait', 1600),
        ('scroll', 500, 1800), ('wait', 700),
    ],
    'murid': [
        ('wait', 900),
        ('scroll', 700, 2400), ('wait', 500),
        ('tap', '#tabbar [data-nav="edukasi"]'), ('wait', 1600),
        ('scroll', 380, 1400), ('wait', 700),
    ],
}

ROLES = list(TOURS)
if '--roles' in sys.argv:
    ROLES = sys.argv[sys.argv.index('--roles') + 1].split(',')

SMOOTH = """
([dy, ms]) => new Promise(res => {
  const el = document.getElementById('scroll');
  if (!el) return res();
  const from = el.scrollTop;
  const to = Math.max(0, Math.min(from + dy, el.scrollHeight - el.clientHeight));
  const t0 = performance.now();
  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  const step = now => {
    const p = Math.min(1, (now - t0) / ms);
    el.scrollTop = from + (to - from) * ease(p);
    p < 1 ? requestAnimationFrame(step) : res();
  };
  requestAnimationFrame(step);
})
"""


def run_tour(page, role):
    for step in TOURS[role]:
        kind = step[0]
        try:
            if kind == 'wait':
                page.wait_for_timeout(step[1])
            elif kind == 'scroll':
                page.evaluate(SMOOTH, [step[1], step[2]])
                page.wait_for_timeout(120)
            elif kind == 'tap':
                page.click(step[1], timeout=6000)
                page.wait_for_timeout(500)
            elif kind == 'goto':
                page.evaluate("h => location.hash = h", step[1])
                page.wait_for_timeout(700)
        except Exception as e:
            print('      (lewati %s: %s)' % (kind, str(e).splitlines()[0][:90]))


def to_mp4(src, dst):
    subprocess.run([FFMPEG, '-y', '-v', 'error', '-i', src,
                    '-vf', 'fps=%d,scale=%d:%d:flags=lanczos,setsar=1' % (FPS, VW, VH),
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
                    '-pix_fmt', 'yuv420p', '-an', dst], check=True)


def main():
    made = []
    with sync_playwright() as p:
        # SwiftShader: Chromium headless tanpa GPU tidak punya WebGL, sehingga
        # pratinjau 3D NC-BOX pada layar Scan hanya tampil hitam.
        browser = p.chromium.launch(args=[
            '--force-color-profile=srgb', '--hide-scrollbars',
            '--use-gl=angle', '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for role in ROLES:
            print('[rec] %s ...' % role)
            ctx = browser.new_context(
                viewport={'width': VW, 'height': VH},
                record_video_dir=RAW,
                record_video_size={'width': VW, 'height': VH},
                locale='id-ID', reduced_motion='no-preference')
            page = ctx.new_page()
            page.goto(URL + '/app.html#/login/' + role, wait_until='networkidle')
            page.wait_for_selector('[data-act="isi-demo"]', timeout=15000)
            page.wait_for_timeout(700)
            page.click('[data-act="isi-demo"]')
            page.wait_for_function("h => location.hash.startsWith(h)",
                                   arg='#/' + role, timeout=20000)
            page.wait_for_timeout(1200)
            run_tour(page, role)
            page.wait_for_timeout(400)

            video = page.video
            ctx.close()                      # video baru ditulis saat context ditutup
            src = video.path()
            dst = os.path.join(OUT, 'app_%s.mp4' % role)
            to_mp4(src, dst)
            made.append(dst)
            print('      -> %s (%.1f MB)' % (os.path.basename(dst),
                                             os.path.getsize(dst) / 1048576))
        browser.close()

    shutil.rmtree(RAW, ignore_errors=True)
    print('[rec] selesai: %d klip di %s' % (len(made), OUT))


if __name__ == '__main__':
    main()
