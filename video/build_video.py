# ============================================================
#  NUTRICENSE — Perakitan video promo dengan ffmpeg
#
#  Bahan:
#    blender/out/nc_box_product.mp4   render 3D 4 shot (Cycles/OptiX)
#    blender/out/stills/*.png          render still produk
#    video/cards/*.png                 kartu judul & lower third (Pillow)
#
#  Dua tahap agar kegagalan mudah dilacak:
#    1. setiap segmen dirender terpisah ke video/segments/ (CRF 16)
#    2. seluruh segmen disambung dengan xfade dalam satu perintah
#
#  python build_video.py [--fast] [--no-build-segments]
# ============================================================

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BL = os.path.join(ROOT, 'blender', 'out')
STILLS = os.path.join(BL, 'stills')
CARDS = os.path.join(HERE, 'cards')
SEG = os.path.join(HERE, 'segments')
os.makedirs(SEG, exist_ok=True)

SRC_3D = os.path.join(BL, 'nc_box_product.mp4')
OUT = os.path.join(HERE, 'nutricense-promo.mp4')

FFMPEG = os.environ.get('FFMPEG_BIN', 'ffmpeg')
FFPROBE = os.environ.get('FFPROBE_BIN', 'ffprobe')

FPS = 24
Wd, Ht = 1920, 1080
XFADE = 0.5                     # durasi silang antar segmen
FAST = '--fast' in sys.argv
CRF = '20' if FAST else '16'
PRESET = 'veryfast' if FAST else 'slow'


def run(cmd, label):
    print('  ->', label)
    p = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if p.returncode != 0:
        print('FFMPEG GAGAL:', label)
        print((p.stderr or '')[-2500:])
        raise SystemExit(1)
    return p


def probe_duration(path):
    p = subprocess.run([FFPROBE, '-v', 'error', '-select_streams', 'v:0',
                        '-show_entries', 'stream=duration,nb_frames,r_frame_rate',
                        '-of', 'json', path],
                       capture_output=True, text=True)
    try:
        st = json.loads(p.stdout)['streams'][0]
        if st.get('duration') and st['duration'] != 'N/A':
            return float(st['duration'])
        num, den = st['r_frame_rate'].split('/')
        return int(st['nb_frames']) / (float(num) / float(den))
    except Exception:
        return None


VCODEC = ['-c:v', 'libx264', '-preset', PRESET, '-crf', CRF,
          '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']


def seg_from_video(name, start, dur, overlay=None, fade_in=False):
    """Potongan dari render 3D, opsional dengan lower third."""
    out = os.path.join(SEG, name + '.mp4')
    cmd = [FFMPEG, '-y', '-ss', str(start), '-t', str(dur), '-i', SRC_3D]
    if overlay:
        cmd += ['-loop', '1', '-framerate', str(FPS), '-t', str(dur),
                '-i', os.path.join(CARDS, overlay)]
        # Lower third masuk pada 0,4 s dan keluar 0,6 s sebelum segmen habis
        fx = ("[1:v]format=rgba,fade=t=in:st=0.4:d=0.5:alpha=1,"
              "fade=t=out:st=%.2f:d=0.4:alpha=1[lt];"
              "[0:v]scale=%d:%d,setsar=1[bg];[bg][lt]overlay=0:0[v]"
              % (max(dur - 1.0, 0.6), Wd, Ht))
        cmd += ['-filter_complex', fx, '-map', '[v]']
    else:
        cmd += ['-vf', 'scale=%d:%d,setsar=1' % (Wd, Ht)]
    cmd += VCODEC + [out]
    run(cmd, name)
    return out


def seg_from_still(name, image, dur, zoom_in=True, overlay=None):
    """Ken Burns dari satu still.

    Sumber di-upscale dulu sebelum zoompan: zoompan membulatkan offset ke
    piksel bulat, dan pada resolusi asli pembulatan itu terlihat sebagai
    getaran halus sepanjang gerakan.
    """
    out = os.path.join(SEG, name + '.mp4')
    # d=1 penting: zoompan menghasilkan d frame PER FRAME MASUKAN, jadi d=durasi
    # membuat klip berlipat (2 detik pernah jadi 157 detik). Panjang klip
    # dikendalikan oleh -t, dan -framerate menyamakan laju frame masukan.
    if zoom_in:
        z = "min(zoom+0.0009,1.14)"
    else:
        z = "if(lte(zoom,1.0),1.14,max(zoom-0.0009,1.0))"
    vf = ("scale=3840:-2,"
          "zoompan=z='%s':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
          ":s=%dx%d:fps=%d,setsar=1" % (z, Wd, Ht, FPS))

    cmd = [FFMPEG, '-y', '-loop', '1', '-framerate', str(FPS), '-t', str(dur),
           '-i', os.path.join(STILLS, image)]
    if overlay:
        cmd += ['-loop', '1', '-framerate', str(FPS), '-t', str(dur),
                '-i', os.path.join(CARDS, overlay)]
        fx = ("[0:v]%s[bg];"
              "[1:v]format=rgba,fade=t=in:st=0.3:d=0.5:alpha=1,"
              "fade=t=out:st=%.2f:d=0.4:alpha=1[lt];"
              "[bg][lt]overlay=0:0[v]" % (vf, max(dur - 0.9, 0.5)))
        cmd += ['-filter_complex', fx, '-map', '[v]']
    else:
        cmd += ['-vf', vf]
    cmd += VCODEC + [out]
    run(cmd, name)
    return out


def seg_from_card(name, image, dur, zoom=True):
    out = os.path.join(SEG, name + '.mp4')
    if zoom:
        vf = ("scale=3840:-2,zoompan=z='min(zoom+0.0006,1.08)':d=1"
              ":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
              ":s=%dx%d:fps=%d,setsar=1" % (Wd, Ht, FPS))
    else:
        vf = 'scale=%d:%d,setsar=1,fps=%d' % (Wd, Ht, FPS)
    run([FFMPEG, '-y', '-loop', '1', '-framerate', str(FPS), '-t', str(dur),
         '-i', os.path.join(CARDS, image), '-vf', vf] + VCODEC + [out], name)
    return out


# ── Papan cerita ─────────────────────────────────────────────
# (jenis, nama, sumber, mulai, durasi, overlay)
STORYBOARD = [
    ('card',  '01_title',   'title.png',        None, 3.0,  None),
    ('video', '02_reveal',  None,               0.0,  4.0,  'lt_reveal.png'),
    ('video', '03_screen',  None,               4.0,  3.5,  'lt_screen.png'),
    ('still', '04_tray',    '04_chamber.png',   None, 3.2,  'lt_tray.png'),
    ('card',  '05_spec4',   'spec_4.png',       None, 2.0,  None),
    ('video', '06_scan',    None,               7.5,  3.5,  'lt_sensor.png'),
    ('still', '07_display', '03_screen.png',    None, 3.0,  None),
    ('card',  '08_spec60',  'spec_60.png',      None, 2.0,  None),
    ('video', '09_turn',    None,               11.0, 6.0,  None),
    ('card',  '10_end',     'end.png',          None, 3.5,  None),
]


def build_segments():
    made = []
    for kind, name, src, start, dur, ov in STORYBOARD:
        if kind == 'video':
            made.append((seg_from_video(name, start, dur, ov), dur))
        elif kind == 'still':
            made.append((seg_from_still(name, src, dur, overlay=ov), dur))
        else:
            made.append((seg_from_card(name, src, dur), dur))
    return made


def concat_xfade(segments):
    """Sambung semua segmen dengan crossfade dalam satu perintah."""
    inputs = []
    for path, _ in segments:
        inputs += ['-i', path]

    parts, prev, offset = [], '0:v', 0.0
    for i in range(1, len(segments)):
        offset += segments[i - 1][1] - XFADE
        label = 'x%d' % i
        parts.append('[%s][%d:v]xfade=transition=fade:duration=%.2f:offset=%.3f[%s]'
                     % (prev, i, XFADE, offset, label))
        prev = label

    total = sum(d for _, d in segments) - XFADE * (len(segments) - 1)
    # Fade hitam di ujung + trek audio senyap agar kompatibel di semua pemutar
    parts.append('[%s]fade=t=in:st=0:d=0.6,fade=t=out:st=%.2f:d=0.8,format=yuv420p[vout]'
                 % (prev, total - 0.8))

    cmd = [FFMPEG, '-y'] + inputs + [
        '-f', 'lavfi', '-t', '%.3f' % total, '-i', 'anullsrc=r=48000:cl=stereo',
        '-filter_complex', ';'.join(parts),
        '-map', '[vout]', '-map', '%d:a' % len(segments),
        '-c:v', 'libx264', '-preset', PRESET, '-crf', CRF,
        '-pix_fmt', 'yuv420p', '-r', str(FPS),
        '-c:a', 'aac', '-b:a', '96k',
        '-movflags', '+faststart', OUT]
    run(cmd, 'concat + xfade')
    return total


if __name__ == '__main__':
    if not os.path.isfile(SRC_3D):
        raise SystemExit('Render 3D belum ada: ' + SRC_3D)
    d3 = probe_duration(SRC_3D)
    print('[build] render 3D: %s (%.2f s)' % (os.path.basename(SRC_3D), d3 or -1))
    need = max(s + dur for k, n, s_, s, dur, o in STORYBOARD if k == 'video')
    if d3 and d3 + 0.05 < need:
        raise SystemExit('Render 3D terlalu pendek: butuh %.1f s, ada %.1f s' % (need, d3))

    print('[build] membangun %d segmen...' % len(STORYBOARD))
    segs = build_segments() if '--no-build-segments' not in sys.argv else [
        (os.path.join(SEG, n + '.mp4'), dur) for k, n, s_, s, dur, o in STORYBOARD]

    print('[build] menyambung...')
    total = concat_xfade(segs)
    size = os.path.getsize(OUT) / 1024 / 1024
    print('[build] selesai: %s' % OUT)
    print('[build] durasi %.2f s · %.1f MB · %dx%d @ %dfps' % (total, size, Wd, Ht, FPS))
