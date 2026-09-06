# ============================================================
#  NUTRICENSE — Setup environment studio untuk render produk
#  Berisi: cyclorama, tiga titik cahaya + softbox pemantul,
#  world gradient, kamera dengan DOF, dan konfigurasi engine.
#
#  Semua fungsi idempoten: aman dipanggil sekali per scene.
# ============================================================

import bpy
import math
from mathutils import Vector

import nc_box as NC


# ════════════════════════════════════════════════════════════
#  World
# ════════════════════════════════════════════════════════════

def build_world(top=(0.055, 0.070, 0.062), bottom=(0.012, 0.014, 0.013),
                strength=1.0):
    """Latar gradien halus — memberi isi pada pantulan tanpa mendominasi."""
    world = bpy.data.worlds.get('NC_World') or bpy.data.worlds.new('NC_World')
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()

    out = nt.nodes.new('ShaderNodeOutputWorld');      out.location = (600, 0)
    bg = nt.nodes.new('ShaderNodeBackground');        bg.location = (400, 0)
    ramp = nt.nodes.new('ShaderNodeValToRGB');        ramp.location = (150, 0)
    grad = nt.nodes.new('ShaderNodeTexGradient');     grad.location = (-80, 0)
    mapp = nt.nodes.new('ShaderNodeMapping');         mapp.location = (-280, 0)
    coord = nt.nodes.new('ShaderNodeTexCoord');       coord.location = (-480, 0)

    grad.gradient_type = 'EASING'
    mapp.inputs['Rotation'].default_value = (math.radians(90), 0, 0)

    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (*bottom, 1)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (*top, 1)

    bg.inputs['Strength'].default_value = strength

    nt.links.new(coord.outputs['Generated'], mapp.inputs['Vector'])
    nt.links.new(mapp.outputs['Vector'], grad.inputs['Vector'])
    nt.links.new(grad.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    return world


# ════════════════════════════════════════════════════════════
#  Cyclorama
# ════════════════════════════════════════════════════════════

def build_cyclorama(radius=1.4, height=2.6, depth=3.2, dark=False):
    """Lantai menyatu dinding dengan lengkungan — khas foto produk."""
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = 'Cyclorama'
    floor.scale = (depth * 2.4, depth * 2.4, 1)
    bpy.ops.object.transform_apply(scale=True)

    # Dinding belakang, dilengkungkan ke lantai lewat modifier
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, depth * 0.62, height / 2))
    wall = bpy.context.active_object
    wall.name = 'CycWall'
    wall.rotation_euler = (math.radians(90), 0, 0)
    wall.scale = (depth * 2.4, height, 1)
    bpy.ops.object.transform_apply(rotation=True, scale=True)

    bpy.ops.object.select_all(action='DESELECT')
    floor.select_set(True); wall.select_set(True)
    bpy.context.view_layer.objects.active = floor
    bpy.ops.object.join()
    cyc = bpy.context.active_object
    cyc.name = 'Cyclorama'

    # Subdivide lalu bevel sudut pertemuan agar melengkung mulus
    sub = cyc.modifiers.new('sub', 'SUBSURF')
    sub.levels = 2
    sub.render_levels = 3
    try:
        sub.subdivision_type = 'SIMPLE'
    except Exception:
        pass

    base = (0.018, 0.020, 0.019, 1) if dark else (0.44, 0.458, 0.449, 1)
    mat = NC.mat_principled('NC_Cyc', base, rough=0.55)
    cyc.data.materials.append(mat)
    NC.smooth(cyc, 60)
    return cyc


# ════════════════════════════════════════════════════════════
#  Pencahayaan
# ════════════════════════════════════════════════════════════

def _area(name, loc, rot, size, energy, color=(1, 1, 1), shape='RECTANGLE',
          size_y=None):
    d = bpy.data.lights.new(name, 'AREA')
    d.shape = shape
    d.size = size
    if size_y is not None and shape == 'RECTANGLE':
        d.size_y = size_y
    d.energy = energy
    d.color = color
    o = bpy.data.objects.new(name, d)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    return o


def build_lights(scale=1.0):
    """Tiga titik klasik + strip atas + dua kartu pemantul untuk bodi mengilap."""
    lights = {}

    # Key: softbox besar dari kiri-depan-atas
    lights['key'] = _area(
        'L_Key', (-1.15, -1.15, 1.25), (math.radians(52), 0, math.radians(-44)),
        size=1.1, size_y=0.85, energy=150 * scale, color=(1.0, 0.98, 0.95))

    # Fill: lebih lembut dari kanan-depan, mengangkat bayangan
    lights['fill'] = _area(
        'L_Fill', (1.30, -1.00, 0.68), (math.radians(72), 0, math.radians(52)),
        size=1.3, size_y=1.0, energy=52 * scale, color=(0.92, 0.96, 1.0))

    # Rim: dari belakang-kanan, memisahkan siluet dari latar
    lights['rim'] = _area(
        'L_Rim', (0.95, 1.35, 1.00), (math.radians(118), 0, math.radians(150)),
        size=0.55, size_y=0.9, energy=125 * scale, color=(0.80, 1.0, 0.90))

    # Strip atas: garis sorot memanjang pada kanopi hitam
    lights['top'] = _area(
        'L_Top', (0, -0.10, 1.55), (0, 0, math.radians(90)),
        size=1.5, size_y=0.18, energy=34 * scale)

    # Kartu pemantul: memberi tepi terang pada plastik gelap
    lights['card_l'] = _area(
        'L_CardL', (-1.05, 0.15, 0.28), (math.radians(90), 0, math.radians(-90)),
        size=0.9, size_y=0.6, energy=30 * scale)
    lights['card_r'] = _area(
        'L_CardR', (1.05, 0.10, 0.30), (math.radians(90), 0, math.radians(90)),
        size=0.9, size_y=0.6, energy=24 * scale)

    for o in lights.values():
        o.data.use_shadow = True
    return lights


# ════════════════════════════════════════════════════════════
#  Kamera
# ════════════════════════════════════════════════════════════

def build_camera(target, lens=80.0, distance=2.15, height=0.52,
                 azimuth=-38.0, fstop=6.3):
    """Kamera dengan Track-To ke target, plus depth of field."""
    cam_d = bpy.data.cameras.new('NC_Cam')
    cam_d.lens = lens
    cam_d.sensor_width = 36.0
    cam_d.dof.use_dof = True
    cam_d.dof.focus_object = target
    cam_d.dof.aperture_fstop = fstop

    cam = bpy.data.objects.new('NC_Cam', cam_d)
    bpy.context.scene.collection.objects.link(cam)

    a = math.radians(azimuth)
    cam.location = (math.sin(a) * distance, -math.cos(a) * distance, height)

    tt = cam.constraints.new('TRACK_TO')
    tt.target = target
    tt.track_axis = 'TRACK_NEGATIVE_Z'
    tt.up_axis = 'UP_Y'

    bpy.context.scene.camera = cam
    return cam


# ════════════════════════════════════════════════════════════
#  Engine & output
# ════════════════════════════════════════════════════════════

def pick_gpu():
    """Aktifkan Cycles + perangkat GPU tercepat yang tersedia (OptiX > CUDA > HIP)."""
    try:
        bpy.ops.preferences.addon_enable(module='cycles')
    except Exception:
        pass
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
    except Exception:
        return None

    chosen = None
    for kind in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):
        try:
            prefs.compute_device_type = kind
        except Exception:
            continue
        prefs.refresh_devices()
        if any(d.type == kind for d in prefs.devices):
            chosen = kind
            break

    if not chosen:
        return None

    for d in prefs.devices:
        d.use = (d.type == chosen) or (d.type == 'CPU' and chosen in ('OPTIX', 'CUDA'))
    return chosen


def setup_render(res=(1920, 1080), samples=128, engine='CYCLES',
                 fps=30, denoise=True):
    sc = bpy.context.scene
    r = sc.render

    r.resolution_x, r.resolution_y = res
    r.resolution_percentage = 100
    r.fps = fps
    r.film_transparent = False

    used_gpu = None
    if engine == 'CYCLES':
        try:
            r.engine = 'CYCLES'
            used_gpu = pick_gpu()
            sc.cycles.device = 'GPU' if used_gpu else 'CPU'
            sc.cycles.samples = samples
            sc.cycles.use_adaptive_sampling = True
            sc.cycles.adaptive_threshold = 0.01
            sc.cycles.max_bounces = 8
            sc.cycles.transmission_bounces = 8
            sc.cycles.transparent_max_bounces = 8
            sc.cycles.caustics_reflective = False
            sc.cycles.caustics_refractive = False
            if denoise:
                sc.cycles.use_denoising = True
                try:
                    sc.cycles.denoiser = 'OPTIX' if used_gpu == 'OPTIX' else 'OPENIMAGEDENOISE'
                except Exception:
                    pass
        except Exception as e:
            print('[studio] Cycles tidak tersedia, memakai EEVEE:', e)
            engine = 'EEVEE'

    if engine != 'CYCLES':
        r.engine = 'BLENDER_EEVEE'
        ee = sc.eevee
        if hasattr(ee, 'taa_render_samples'):
            ee.taa_render_samples = max(64, samples)
        if hasattr(ee, 'use_raytracing'):
            ee.use_raytracing = True

    # Color management — AgX memberi roll-off highlight yang lembut
    vs = sc.view_settings
    try:
        vs.view_transform = 'AgX'
    except Exception:
        try:
            vs.view_transform = 'Filmic'
        except Exception:
            pass
    try:
        vs.look = 'AgX - Medium High Contrast'
    except Exception:
        try:
            vs.look = 'Medium High Contrast'
        except Exception:
            pass
    vs.exposure = 0.0
    vs.gamma = 1.0

    return {'engine': r.engine, 'gpu': used_gpu}


def setup_video_output(path, fmt='MPEG4', codec='H264', quality='HIGH'):
    r = bpy.context.scene.render
    # Blender 5.x memisahkan media: FFMPEG baru muncul di enum file_format
    # setelah media_type diset ke VIDEO.
    if hasattr(r.image_settings, 'media_type'):
        r.image_settings.media_type = 'VIDEO'
    r.image_settings.file_format = 'FFMPEG'
    r.ffmpeg.format = fmt
    r.ffmpeg.codec = codec
    try:
        r.ffmpeg.constant_rate_factor = quality
    except Exception:
        pass
    try:
        r.ffmpeg.ffmpeg_preset = 'GOOD'
    except Exception:
        pass
    r.ffmpeg.gopsize = 15
    r.ffmpeg.audio_codec = 'NONE'
    r.filepath = path


def setup_still_output(path, fmt='PNG'):
    r = bpy.context.scene.render
    if hasattr(r.image_settings, 'media_type'):
        r.image_settings.media_type = 'IMAGE'
    r.image_settings.file_format = fmt
    r.image_settings.color_mode = 'RGBA' if fmt == 'PNG' else 'RGB'
    try:
        r.image_settings.compression = 15
    except Exception:
        pass
    r.filepath = path


# ════════════════════════════════════════════════════════════
#  Rakitan penuh
# ════════════════════════════════════════════════════════════

def build_studio(dark=False, light_scale=1.0, lens=80.0, distance=2.15,
                 height=0.52, azimuth=-38.0):
    """Bangun world + cyclorama + lampu + kamera. Mengembalikan (pivot, cam)."""
    build_world()
    build_cyclorama(dark=dark)
    build_lights(scale=light_scale)
    pivot = NC.device_empty()
    cam = build_camera(pivot, lens=lens, distance=distance,
                       height=height, azimuth=azimuth)
    return pivot, cam
