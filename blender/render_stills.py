# ============================================================
#  NUTRICENSE — Render still produk
#  Enam sudut: hero, tampak depan, detail layar, detail ruang
#  pindai, tampak belakang, dan hero latar gelap.
#
#  blender --background --factory-startup --python render_stills.py
#          -- [--samples 128] [--res 1920x1080] [--only hero]
# ============================================================

import bpy
import sys
import os
import math
import time

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import nc_box as NC
import studio as ST

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(flag, default):
    return argv[argv.index(flag) + 1] if flag in argv else default


SAMPLES = int(arg('--samples', 128))
RES = tuple(int(v) for v in arg('--res', '1920x1080').split('x'))
ONLY = arg('--only', None)

OUT = os.path.join(HERE, 'out', 'stills')
os.makedirs(OUT, exist_ok=True)

# ── Bangun scene ─────────────────────────────────────────────
NC.purge()
M = NC.build_all()
pivot, cam = ST.build_studio()
info = ST.setup_render(res=RES, samples=SAMPLES)
print('[stills] engine=%s gpu=%s' % (info['engine'], info['gpu']))

cyc = bpy.data.objects.get('Cyclorama')
cyc_mat = cyc.data.materials[0] if cyc and cyc.data.materials else None
bsdf = cyc_mat.node_tree.nodes.get('Principled BSDF') if cyc_mat else None


def look_at(loc, target_loc, lens, fstop=6.3):
    """Pindahkan kamera + pivot fokus ke posisi tertentu."""
    pivot.location = target_loc
    cam.data.lens = lens
    cam.data.dof.aperture_fstop = fstop
    cam.location = loc
    bpy.context.view_layer.update()


def set_backdrop(value):
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (*value, 1)


def shoot(name, loc, target, lens, fstop=6.3, backdrop=(0.44, 0.458, 0.449)):
    if ONLY and ONLY != name:
        return
    set_backdrop(backdrop)
    look_at(loc, target, lens, fstop)
    path = os.path.join(OUT, name + '.png')
    bpy.context.scene.render.filepath = path
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print('[stills] %-14s %.1fs -> %s' % (name, time.time() - t0, path))


CENTER = (0, 0, NC.H * 0.46)

# 1. Hero tiga-perempat dari kiri-depan
shoot('01_hero', (-1.32, -1.68, 0.55), CENTER, 80)

# 2. Tampak depan lurus — memperlihatkan proporsi
shoot('02_front', (-0.045, -2.35, 0.30), (-0.045, 0, 0.20), 85, fstop=9.0)

# 3. Detail layar + tombol
shoot('03_screen', (0.30, -0.62, 0.30),
      (NC.W / 2 - NC.TOWER_W / 2, -0.10, NC.BASE_TOP + 0.150), 90, fstop=3.5)

# 4. Ruang pindai + nampan, dilihat dari atas-depan
shoot('04_chamber', (-0.28, -0.78, 0.62),
      (NC.TRAY_CX, -0.01, NC.BASE_TOP + 0.03), 60, fstop=4.5)

# 5. Tiga-perempat belakang — kisi, port kabel, tiang sudut
shoot('05_rear', (1.55, 1.70, 0.62), CENTER, 80)

# 6. Hero latar gelap — untuk header gelap
shoot('06_hero_dark', (-1.32, -1.68, 0.55), CENTER, 80,
      backdrop=(0.020, 0.023, 0.022))

print('[stills] selesai ->', OUT)
