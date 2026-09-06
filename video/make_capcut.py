# ============================================================
#  NUTRICENSE — Bangun draft CapCut yang bisa diedit
#
#  Berbeda dari nutricense-promo.mp4 (hasil akhir ffmpeg), draft
#  ini memakai segmen TANPA lower third yang di-bake; captionnya
#  ditambahkan sebagai text segment CapCut asli sehingga masih
#  bisa diubah, diterjemahkan, atau diberi gaya lain di aplikasi.
#
#  Catatan: capcut-cli hanya menyusun timeline. Render akhir tetap
#  dilakukan di aplikasi CapCut (perintah `render` miliknya hanya
#  membuat pratinjau proxy, bukan keluaran final).
#
#  python make_capcut.py [--name "Nutricense Promo"]
# ============================================================

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_video as B                                     # noqa: E402

def _capcut_bin():
    """Di Windows, `capcut-cli` adalah shim tanpa ekstensi yang hanya bisa
    dijalankan shell; subprocess Python membutuhkan varian .cmd."""
    env = os.environ.get('CAPCUT_BIN')
    if env:
        return env
    if os.name == 'nt':
        for d in os.environ.get('PATH', '').split(os.pathsep):
            c = os.path.join(d, 'capcut-cli.cmd')
            if os.path.isfile(c):
                return c
    return 'capcut-cli'


CAPCUT = _capcut_bin()
NAME = 'Nutricense Promo'
if '--name' in sys.argv:
    NAME = sys.argv[sys.argv.index('--name') + 1]

CLEAN = os.path.join(HERE, 'segments_clean')
os.makedirs(CLEAN, exist_ok=True)

# Caption per segmen — dibuat sebagai text segment CapCut, bukan di-bake.
CAPTIONS = {
    '02_reveal': ('NC-BOX-09X', 'Smart Nutrition Verification System'),
    '03_screen': ('Hasil dalam hitungan detik', 'Food Safety Index, gizi, dan suhu'),
    '04_tray':   ('Nampan MBG 4 sekat', 'Ditimbang, dikenali, dinilai otomatis'),
    '06_scan':   ('Kamera AI + 4 sensor presisi', 'ESP32-CAM, MLX90614, MQ-135, HX711'),
}


def _env():
    """capcut-cli memanggil ffprobe lewat PATH; PATH Node berbeda dari shell,
    jadi direktori ffmpeg disisipkan agar durasi/dimensi media terbaca
    (tanpa ini setiap add-video memberi peringatan "could not probe")."""
    env = os.environ.copy()
    ff = env.get('FFMPEG_BIN') or ''
    d = os.path.dirname(ff) if ff and os.path.isfile(ff) else ''
    if d:
        env['PATH'] = d + os.pathsep + env.get('PATH', '')
    return env


def sh(cmd, label, check=True):
    print('  ->', label)
    p = subprocess.run(cmd, capture_output=True, text=True,
                       encoding='utf-8', errors='replace', shell=False, env=_env())
    if check and p.returncode not in (0,):
        print('GAGAL:', label)
        print((p.stderr or p.stdout or '')[-1800:])
        raise SystemExit(1)
    return p


def build_clean_segments():
    """Segmen yang sama dengan papan cerita, tetapi tanpa overlay."""
    old_seg = B.SEG
    B.SEG = CLEAN
    made = []
    try:
        for kind, name, src, start, dur, _ov in B.STORYBOARD:
            dst = os.path.join(CLEAN, name + '.mp4')
            if os.path.isfile(dst):
                made.append((name, dst, dur))
                continue
            if kind == 'video':
                B.seg_from_video(name, start, dur, None)
            elif kind == 'still':
                B.seg_from_still(name, src, dur, overlay=None)
            else:
                B.seg_from_card(name, src, dur)
            made.append((name, os.path.join(CLEAN, name + '.mp4'), dur))
    finally:
        B.SEG = old_seg
    return made


def find_draft_dir(init_output):
    """Ambil path draft dari keluaran `capcut init`.

    init mencetak satu baris JSON lalu beberapa baris teks biasa, jadi
    mem-parse seluruh stdout akan gagal — ambil baris JSON pertama saja.
    """
    data = None
    for line in (init_output or '').splitlines():
        line = line.strip()
        if line.startswith('{'):
            try:
                data = json.loads(line)
                break
            except Exception:
                continue
    if data is None:
        return None
    for k in ('draft_path', 'path', 'draft_dir', 'dir'):
        if isinstance(data, dict) and data.get(k):
            return data[k]
    if isinstance(data, dict):
        for v in data.values():
            if isinstance(v, str) and os.path.isdir(v):
                return v
    return None


def main():
    if not os.path.isfile(B.SRC_3D):
        raise SystemExit('Render 3D belum ada: ' + B.SRC_3D)

    print('[capcut] membangun segmen bersih (tanpa lower third)...')
    segs = build_clean_segments()

    print('[capcut] membuat draft "%s"...' % NAME)
    p = sh([CAPCUT, 'init', NAME], 'init')
    draft = find_draft_dir(p.stdout)
    if not draft or not os.path.isdir(draft):
        print(p.stdout[:600])
        raise SystemExit('Tidak dapat menemukan folder draft dari keluaran init.')
    print('[capcut] draft:', draft)

    t = 0.0
    for name, path, dur in segs:
        sh([CAPCUT, 'add-video', draft, path, '%.2fs' % t, '%.2fs' % dur, '-q'],
           'add-video %s @ %.2fs' % (name, t), check=False)
        t += dur

    # Caption sebagai text segment yang masih bisa diedit
    t = 0.0
    for name, _path, dur in segs:
        cap = CAPTIONS.get(name)
        if cap:
            title, sub = cap
            sh([CAPCUT, 'add-text', draft, '%.2fs' % (t + 0.4), '%.2fs' % max(dur - 1.0, 0.8),
                title, '--font-size', '18', '--color', '#10221A',
                '--x', '-0.42', '--y', '-0.62', '--align', '0',
                '--track-name', 'judul', '-q'],
               'add-text %s' % name, check=False)
            sh([CAPCUT, 'add-text', draft, '%.2fs' % (t + 0.5), '%.2fs' % max(dur - 1.1, 0.7),
                sub, '--font-size', '10', '--color', '#43543F',
                '--x', '-0.42', '--y', '-0.72', '--align', '0',
                '--track-name', 'subjudul', '-q'],
               'add-text %s (sub)' % name, check=False)
        t += dur

    print('[capcut] lint...')
    lint = sh([CAPCUT, 'lint', draft, '-H'], 'lint', check=False)
    print((lint.stdout or lint.stderr or '')[:1500])

    print()
    print('[capcut] SELESAI. Buka CapCut — draft "%s" ada di pustaka Anda.' % NAME)
    print('[capcut] Timeline: %d klip, total %.1f detik.' % (len(segs), t))
    print('[capcut] Musik belum ditambahkan; tarik trek audio Anda di CapCut,')
    print('[capcut] lalu Export dari aplikasi untuk render akhir.')


if __name__ == '__main__':
    main()
