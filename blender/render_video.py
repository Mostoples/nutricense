# ============================================================
#  NUTRICENSE — Render video produk NC-BOX-09X
#
#  Empat shot, kamera terikat timeline marker:
#    A. Reveal   — turntable lambat dari tiga-perempat depan
#    B. Layar    — dolly mendekat ke panel hasil analisis
#    C. Pindai   — masuk ke ruang, berkas pemindai menyapu nampan
#    D. Turntable— putaran penuh 360° sambil kamera menarik mundur
#
#  blender --background --factory-startup --python render_video.py
#          -- [--samples 48] [--fps 24] [--res 1920x1080] [--dry]
# ============================================================

import bpy
import sys
import os
import math

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import nc_box as NC
import studio as ST

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(flag, default):
    return argv[argv.index(flag) + 1] if flag in argv else default


SAMPLES = int(arg('--samples', 48))
FPS = int(arg('--fps', 24))
RES = tuple(int(v) for v in arg('--res', '1920x1080').split('x'))
DRY = '--dry' in argv

OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

# ── Papan cerita (dalam detik) ───────────────────────────────
SHOTS = [
    ('A_reveal', 4.0),
    ('B_screen', 3.5),
    ('C_scan',   3.5),
    ('D_turn',   6.0),
]

# ════════════════════════════════════════════════════════════
#  Scene
# ════════════════════════════════════════════════════════════

NC.purge()
M = NC.build_all()
pivot, _ = ST.build_studio()

sc = bpy.context.scene
info = ST.setup_render(res=RES, samples=SAMPLES, fps=FPS)
print('[video] engine=%s gpu=%s samples=%d fps=%d' %
      (info['engine'], info['gpu'], SAMPLES, FPS))

# ── Poros turntable: seluruh perangkat diinduk ke satu empty ──
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
root = bpy.context.active_object
root.name = 'NC_Root'

MODEL_COLLS = ('NC_Body', 'NC_Optics', 'NC_Screen', 'NC_Tray',
               'NC_Detail', 'NC_Brand')
for cname in MODEL_COLLS:
    coll = bpy.data.collections.get(cname)
    if not coll:
        continue
    for o in coll.objects:
        o.parent = root
        o.matrix_parent_inverse = root.matrix_world.inverted()

# ── Berkas pemindai (hanya tampil pada shot C) ───────────────
def make_beam_material():
    """Emisi dicampur Transparent supaya berkas menyala tetapi tembus pandang —
    emisi murni akan menutupi nampan sebagai lembaran hijau pekat."""
    m = bpy.data.materials.new('NC_Beam')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (400, 0)
    mix = nt.nodes.new('ShaderNodeMixShader');      mix.location = (200, 0)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); tr.location = (0, 120)
    em = nt.nodes.new('ShaderNodeEmission');        em.location = (0, -80)
    em.inputs['Color'].default_value = (0.12, 0.85, 0.45, 1)
    em.inputs['Strength'].default_value = 5.0
    mix.inputs['Fac'].default_value = 0.72        # 72% tembus pandang
    nt.links.new(tr.outputs['BSDF'], mix.inputs[1])
    nt.links.new(em.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return m


beam_mat = make_beam_material()
beam = NC.box('ScanBeam', (0.30, 0.22, 0.0016),
              (NC.TRAY_CX, -0.01, NC.BASE_TOP + 0.10), beam_mat, bevel=0.0)
beam.parent = root
beam.matrix_parent_inverse = root.matrix_world.inverted()

# ════════════════════════════════════════════════════════════
#  Kamera
# ════════════════════════════════════════════════════════════

def make_cam(name, loc, target, lens, fstop=5.6):
    tgt = bpy.data.objects.new('T_' + name, None)
    tgt.empty_display_size = 0.03
    sc.collection.objects.link(tgt)
    tgt.location = target

    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = 36.0
    cd.dof.use_dof = True
    cd.dof.focus_object = tgt
    cd.dof.aperture_fstop = fstop

    cam = bpy.data.objects.new(name, cd)
    sc.collection.objects.link(cam)
    cam.location = loc
    tt = cam.constraints.new('TRACK_TO')
    tt.target = tgt
    tt.track_axis = 'TRACK_NEGATIVE_Z'
    tt.up_axis = 'UP_Y'
    return cam, tgt


CENTER = (0, 0, NC.H * 0.46)
SCREEN_PT = (NC.W / 2 - NC.TOWER_W / 2, -0.10, NC.BASE_TOP + 0.150)
TRAY_PT = (NC.TRAY_CX, -0.01, NC.BASE_TOP + 0.035)

camA, tgtA = make_cam('Cam_A', (-1.30, -1.72, 0.56), CENTER, 80, 6.3)
camB, tgtB = make_cam('Cam_B', (0.42, -0.92, 0.34), SCREEN_PT, 85, 3.2)
camC, tgtC = make_cam('Cam_C', (-0.30, -0.86, 0.66), TRAY_PT, 55, 4.0)
camD, tgtD = make_cam('Cam_D', (-1.10, -1.55, 0.62), CENTER, 70, 7.1)

# ── Rentang frame per shot ───────────────────────────────────
frames, f = {}, 1
for name, secs in SHOTS:
    n = int(round(secs * FPS))
    frames[name] = (f, f + n - 1)
    f += n
LAST = f - 1
sc.frame_start, sc.frame_end = 1, LAST
print('[video] shot:', {k: v for k, v in frames.items()}, 'total', LAST, 'frame')

# ── Marker: potongan antar kamera ────────────────────────────
for cam, key in ((camA, 'A_reveal'), (camB, 'B_screen'),
                 (camC, 'C_scan'), (camD, 'D_turn')):
    m = sc.timeline_markers.new(key, frame=frames[key][0])
    m.camera = cam
sc.camera = camA


# ════════════════════════════════════════════════════════════
#  Animasi
# ════════════════════════════════════════════════════════════

def key_rot_z(obj, frame, deg, interp='BEZIER'):
    obj.rotation_euler.z = math.radians(deg)
    obj.keyframe_insert('rotation_euler', index=2, frame=frame)
    _last_interp(obj, 'rotation_euler', 2, interp)


def key_loc(obj, frame, loc, interp='BEZIER'):
    obj.location = loc
    obj.keyframe_insert('location', frame=frame)
    for i in range(3):
        _last_interp(obj, 'location', i, interp)


def action_fcurves(obj):
    """Ambil F-Curve sebuah objek.

    Blender 4.4+ memakai "slotted actions": Action.fcurves dihapus dan
    kurva pindah ke layer → strip → channelbag. Fungsi ini menangani
    kedua skema sehingga skrip tetap jalan di 4.0 maupun 5.x.
    """
    ad = obj.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    if hasattr(act, 'fcurves'):
        return list(act.fcurves)

    out = []
    slot = getattr(ad, 'action_slot', None)
    for layer in act.layers:
        for strip in layer.strips:
            cb = None
            if slot is not None:
                try:
                    cb = strip.channelbag(slot)
                except Exception:
                    cb = None
            if cb is None:
                bags = getattr(strip, 'channelbags', None)
                cb = bags[0] if bags else None
            if cb is not None:
                out.extend(cb.fcurves)
    return out


def _last_interp(obj, path, index, interp):
    for fc in action_fcurves(obj):
        if fc.data_path == path and fc.array_index == index and fc.keyframe_points:
            fc.keyframe_points[-1].interpolation = interp


a0, a1 = frames['A_reveal']
b0, b1 = frames['B_screen']
c0, c1 = frames['C_scan']
d0, d1 = frames['D_turn']

# Turntable: berputar pada shot A dan D, diam pada B dan C
key_rot_z(root, a0, -34)
key_rot_z(root, a1, 18)
key_rot_z(root, b0, 18, 'LINEAR')
key_rot_z(root, b1, 18, 'LINEAR')
key_rot_z(root, c0, 18, 'LINEAR')
key_rot_z(root, c1, 6)
key_rot_z(root, d0, 6, 'LINEAR')
key_rot_z(root, d1, 366, 'LINEAR')       # satu putaran penuh

# Shot A: dorong maju halus
key_loc(camA, a0, (-1.42, -1.88, 0.60))
key_loc(camA, a1, (-1.22, -1.60, 0.52))

# Shot B: dolly mendekat ke panel layar
key_loc(camB, b0, (0.52, -1.06, 0.40))
key_loc(camB, b1, (0.33, -0.72, 0.31))

# Shot C: turun ke dalam ruang pindai
key_loc(camC, c0, (-0.26, -1.00, 0.80))
key_loc(camC, c1, (-0.30, -0.74, 0.58))

# Shot D: tarik mundur sambil naik sedikit
key_loc(camD, d0, (-1.02, -1.44, 0.56))
key_loc(camD, d1, (-1.34, -1.78, 0.70))

# ── Berkas pemindai: menyapu turun-naik, hanya pada shot C ───
mid = (c0 + c1) // 2
for fr, z, vis in ((1, 0.30, True), (c0 - 1, 0.30, True),
                   (c0, 0.315, False), (mid, 0.128, False),
                   (c1, 0.315, False), (c1 + 1, 0.30, True)):
    beam.location.z = z
    beam.keyframe_insert('location', index=2, frame=fr)
    beam.hide_render = vis
    beam.keyframe_insert('hide_render', frame=fr)
    beam.hide_viewport = vis
    beam.keyframe_insert('hide_viewport', frame=fr)

# hide_render harus melompat, bukan dilerp
for fc in action_fcurves(beam):
    if fc.data_path in ('hide_render', 'hide_viewport'):
        for kp in fc.keyframe_points:
            kp.interpolation = 'CONSTANT'

# ── Denyut LED & layar sepanjang video ───────────────────────
led = bpy.data.materials.get('NC_LED')
if led:
    node = led.node_tree.nodes.get('Emission')
    if node:
        for fr, v in ((1, 10.0), (LAST // 3, 17.0), (2 * LAST // 3, 11.0), (LAST, 16.0)):
            node.inputs['Strength'].default_value = v
            node.inputs['Strength'].keyframe_insert('default_value', frame=fr)

ui = bpy.data.materials.get('NC_ScreenUI')
if ui:
    node = ui.node_tree.nodes.get('Emission')
    if node:
        for fr, v in ((1, 2.0), (b0, 2.2), ((b0 + b1) // 2, 3.1), (b1, 2.2), (LAST, 2.4)):
            node.inputs['Strength'].default_value = v
            node.inputs['Strength'].keyframe_insert('default_value', frame=fr)

# ════════════════════════════════════════════════════════════
#  Output
# ════════════════════════════════════════════════════════════

video_path = os.path.join(OUT, 'nc_box_product.mp4')
ST.setup_video_output(video_path)

blend_path = os.path.join(HERE, 'nc_box_video.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print('[video] scene tersimpan:', blend_path)

if DRY:
    print('[video] --dry: berhenti sebelum render')
else:
    print('[video] mulai render %d frame -> %s' % (LAST, video_path))
    bpy.ops.render.render(animation=True)
    print('[video] selesai:', video_path)
