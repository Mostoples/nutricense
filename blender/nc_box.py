# ============================================================
#  NUTRICENSE — NC-BOX-09X : pustaka pembangun model Blender
#
#  Bentuk mengikuti gambar produk resmi: SLAB putih tipis yang
#  menjorok ke depan, dengan GANTRY gelap (menara kanan +
#  kanopi) yang duduk mundur di atasnya — bukan kotak tertutup.
#  Seluruh rusuk memakai fillet besar (2–3 cm) agar terbaca
#  lembut dan organik, bukan geometris.
#
#  Semua ukuran dalam meter: 45 x 32 x 42 cm. Depan menghadap -Y.
# ============================================================

import bpy
import math
from mathutils import Vector

# ── Dimensi utama (m) ────────────────────────────────────────
W, D, H = 0.45, 0.32, 0.42

PLINTH_H = 0.014
BASE_H = 0.072
BASE_TOP = PLINTH_H + BASE_H            # 0.086 — permukaan tempat nampan

CANOPY_H = 0.072
CANOPY_BOT = H - CANOPY_H               # 0.348

# Struktur atas lebih dangkal dari alas → alas menjorok ke depan
UPPER_D = 0.255
UPPER_Y0 = D / 2 - UPPER_D              # -0.095 (muka depan gantry)
UPPER_Y1 = D / 2                        #  0.160
UPPER_CY = (UPPER_Y0 + UPPER_Y1) / 2

LEFT_T = 0.058                          # tebal dinding kiri (putih)
TOWER_W = 0.120                         # lebar menara layar (gelap)
BACK_T = 0.030

OPEN_X0 = -W / 2 + LEFT_T               # -0.179
OPEN_X1 = W / 2 - TOWER_W               #  0.113
TRAY_CX = (OPEN_X0 + OPEN_X1) / 2       # -0.033
TOWER_CX = W / 2 - TOWER_W / 2          #  0.169

FRONT = -D / 2                          # -0.16

# ── Warna ────────────────────────────────────────────────────
GREEN = (0.055, 0.42, 0.20, 1.0)
LED_BLUE = (0.020, 0.155, 1.0, 1.0)
SCREEN_NAVY = (0.010, 0.020, 0.075, 1.0)


# ════════════════════════════════════════════════════════════
#  Utilitas
# ════════════════════════════════════════════════════════════

def purge():
    """Kosongkan scene dari objek dan data yang tak terpakai."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.curves,
                 bpy.data.lights, bpy.data.cameras, bpy.data.images,
                 bpy.data.node_groups, bpy.data.worlds, bpy.data.collections):
        for item in list(coll):
            if item.users == 0:
                try:
                    coll.remove(item)
                except Exception:
                    pass


def _set(node, names, value):
    """Set input Principled BSDF; namanya berbeda antar versi Blender."""
    for n in names:
        if n in node.inputs:
            try:
                node.inputs[n].default_value = value
                return True
            except Exception:
                pass
    return False


def mat_principled(name, base, rough=0.4, metal=0.0, coat=0.0,
                   coat_rough=0.05, emit=None, emit_str=0.0,
                   transmission=0.0, ior=1.45, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    _set(bsdf, ['Base Color'], base)
    _set(bsdf, ['Roughness'], rough)
    _set(bsdf, ['Metallic'], metal)
    _set(bsdf, ['IOR'], ior)
    _set(bsdf, ['Alpha'], alpha)
    if coat:
        _set(bsdf, ['Coat Weight', 'Clearcoat'], coat)
        _set(bsdf, ['Coat Roughness', 'Clearcoat Roughness'], coat_rough)
    if transmission:
        _set(bsdf, ['Transmission Weight', 'Transmission'], transmission)
    if emit is not None:
        _set(bsdf, ['Emission Color', 'Emission'], emit)
        _set(bsdf, ['Emission Strength'], emit_str)
    return m


def mat_emission(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (200, 0)
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = color
    em.inputs['Strength'].default_value = strength
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m


def smooth(obj, angle=52.0):
    bpy.context.view_layer.objects.active = obj
    for op in ('shade_auto_smooth', 'shade_smooth_by_angle'):
        fn = getattr(bpy.ops.object, op, None)
        if fn is None:
            continue
        try:
            fn(angle=math.radians(angle))
            return
        except Exception:
            pass
    bpy.ops.object.shade_smooth()


def soft_box(name, size, loc, mat=None, r=0.024, seg=8, rot=None,
             collection=None):
    """Kotak dengan fillet BESAR di seluruh rusuk.

    Kunci tampilan produk ini: radius 2–3 cm dengan banyak segmen,
    bukan bevel tipis. Lebar bevel dibatasi otomatis agar tidak
    melebihi separuh sisi terpendek — bevel akan rusak bila lewat.
    """
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = Vector(size)
    if rot:
        o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    r = min(r, min(size) * 0.48)
    if r > 0.0005:
        b = o.modifiers.new('bev', 'BEVEL')
        b.width = r
        b.segments = seg
        b.limit_method = 'NONE'          # bulatkan semua rusuk
        try:
            b.miter_outer = 'MITER_ARC'  # sudut menyatu mulus
        except Exception:
            pass
        bpy.ops.object.modifier_apply(modifier=b.name)

    smooth(o)
    if mat:
        o.data.materials.append(mat)
    if collection:
        _move(o, collection)
    return o


def box(name, size, loc, mat=None, bevel=0.006, segments=4, rot=None,
        smooth_it=True, collection=None):
    """Alias lama — dipakai render_video.py untuk berkas pemindai."""
    return soft_box(name, size, loc, mat, r=bevel, seg=segments, rot=rot,
                    collection=collection)


def cyl(name, r, h, loc, mat=None, verts=48, rot=None, collection=None,
        bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts,
                                        location=loc)
    o = bpy.context.active_object
    o.name = name
    if rot:
        o.rotation_euler = rot
    if bevel:
        b = o.modifiers.new('bev', 'BEVEL')
        b.width = bevel
        b.segments = 4
        b.limit_method = 'ANGLE'
        bpy.ops.object.modifier_apply(modifier=b.name)
    smooth(o, 40)
    if mat:
        o.data.materials.append(mat)
    if collection:
        _move(o, collection)
    return o


def plane(name, w, h, loc, mat=None, rot=None, collection=None):
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, h, 1.0)
    if rot:
        o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        o.data.materials.append(mat)
    if collection:
        _move(o, collection)
    return o


def text(name, body, loc, size, mat=None, align='LEFT', rot=None,
         extrude=0.0004, collection=None, bold=False):
    """Teks 3D — dipakai untuk isi layar dan wordmark."""
    bpy.ops.object.text_add(location=loc)
    t = bpy.context.active_object
    t.name = name
    t.data.body = body
    t.data.size = size
    t.data.extrude = extrude
    t.data.align_x = align
    t.data.align_y = 'CENTER'
    if bold:
        t.data.bevel_depth = size * 0.020
        t.data.bevel_resolution = 1
    t.rotation_euler = rot if rot else (math.radians(90), 0, 0)
    if mat:
        t.data.materials.append(mat)
    if collection:
        _move(t, collection)
    return t


def boolean_diff(target, cutter, apply=True):
    m = target.modifiers.new('bool', 'BOOLEAN')
    m.operation = 'DIFFERENCE'
    m.object = cutter
    try:
        m.solver = 'EXACT'
    except Exception:
        pass
    if apply:
        bpy.context.view_layer.objects.active = target
        bpy.ops.object.modifier_apply(modifier=m.name)
        bpy.data.objects.remove(cutter, do_unlink=True)
    return target


def _move(obj, coll_name):
    coll = bpy.data.collections.get(coll_name)
    if not coll:
        coll = bpy.data.collections.new(coll_name)
        bpy.context.scene.collection.children.link(coll)
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)


# ════════════════════════════════════════════════════════════
#  Material
# ════════════════════════════════════════════════════════════

def build_materials():
    M = {}
    # Putih cerah dengan clearcoat — cangkang plastik produk
    M['white'] = mat_principled('NC_White', (0.855, 0.870, 0.862, 1),
                                rough=0.26, coat=0.9, coat_rough=0.07)
    M['white_soft'] = mat_principled('NC_WhiteSoft', (0.80, 0.815, 0.808, 1),
                                     rough=0.42)
    # Hitam gloss — kanopi & menara
    M['dark'] = mat_principled('NC_Dark', (0.0075, 0.0085, 0.0100, 1),
                               rough=0.30, coat=0.45, coat_rough=0.12)
    M['dark_matte'] = mat_principled('NC_DarkMatte', (0.016, 0.018, 0.021, 1),
                                     rough=0.62)
    M['steel'] = mat_principled('NC_Steel', (0.74, 0.775, 0.795, 1),
                                rough=0.20, metal=1.0)
    M['steel_dark'] = mat_principled('NC_SteelDark', (0.42, 0.45, 0.47, 1),
                                     rough=0.34, metal=1.0)
    M['rubber'] = mat_principled('NC_Rubber', (0.015, 0.016, 0.018, 1), rough=0.88)
    M['lens'] = mat_principled('NC_Lens', (0.012, 0.030, 0.050, 1),
                               rough=0.04, metal=0.4, coat=1.0)
    M['glass_dark'] = mat_principled('NC_GlassDark', (0.008, 0.009, 0.012, 1),
                                     rough=0.045, coat=1.0)

    # Layar & indikator
    M['screen_bg'] = mat_emission('NC_ScreenBG', SCREEN_NAVY, 1.1)
    M['ui_white'] = mat_emission('NC_UIWhite', (0.85, 0.89, 0.95, 1), 3.0)
    M['ui_green'] = mat_emission('NC_UIGreen', (0.10, 0.72, 0.28, 1), 3.6)
    M['ui_dim'] = mat_emission('NC_UIDim', (0.16, 0.22, 0.38, 1), 1.6)
    M['ui_bar'] = mat_emission('NC_UIBar', (0.08, 0.62, 0.24, 1), 3.0)
    M['led'] = mat_emission('NC_LED', LED_BLUE, 7.0)
    M['led_white'] = mat_emission('NC_LEDWhite', (1.0, 0.975, 0.94, 1), 4.5)

    M['btn_green'] = mat_emission('NC_BtnGreen', (0.055, 0.60, 0.13, 1), 3.4)
    M['btn_amber'] = mat_emission('NC_BtnAmber', (0.82, 0.46, 0.01, 1), 3.4)
    M['btn_red'] = mat_emission('NC_BtnRed', (0.74, 0.045, 0.030, 1), 3.4)
    M['btn_grey'] = mat_principled('NC_BtnGrey', (0.30, 0.32, 0.33, 1), rough=0.45)

    M['logo'] = mat_principled('NC_Logo', (0.90, 0.92, 0.93, 1), rough=0.30)

    # Makanan
    M['rice'] = mat_principled('F_Rice', (0.72, 0.705, 0.63, 1), rough=0.48)
    M['chicken'] = mat_principled('F_Chicken', (0.235, 0.075, 0.018, 1), rough=0.33)
    M['veg'] = mat_principled('F_Veg', (0.025, 0.115, 0.020, 1), rough=0.32)
    M['carrot'] = mat_principled('F_Carrot', (0.50, 0.13, 0.012, 1), rough=0.34)
    M['banana'] = mat_principled('F_Banana', (0.58, 0.40, 0.030, 1), rough=0.40)
    return M


# ════════════════════════════════════════════════════════════
#  Badan: slab putih + gantry
# ════════════════════════════════════════════════════════════

def build_body(M):
    C = 'NC_Body'

    # Plinth gelap tipis — membuat slab tampak melayang
    soft_box('Plinth', (W - 0.075, D - 0.075, PLINTH_H),
             (0, 0, PLINTH_H / 2), M['dark_matte'], r=0.005, seg=4, collection=C)

    # Slab alas putih — fillet besar di semua rusuk
    soft_box('BaseSlab', (W, D, BASE_H), (0, 0, PLINTH_H + BASE_H / 2),
             M['white'], r=0.026, seg=10, collection=C)

    # Tinggi dilebihkan 2,4 cm ke dalam kanopi: fillet besar pada kedua
    # bagian menyisakan celah bila hanya bersentuhan tepat di bidang.
    OVERLAP = 0.024
    upper_h = CANOPY_BOT - BASE_TOP + OVERLAP
    upper_cz = (BASE_TOP + CANOPY_BOT + OVERLAP) / 2

    # Dinding kiri (putih) — tiang penopang gantry
    soft_box('LeftWall', (LEFT_T, UPPER_D, upper_h),
             (-W / 2 + LEFT_T / 2, UPPER_CY, upper_cz),
             M['white'], r=0.020, seg=9, collection=C)

    # Dinding belakang (putih) — tampak belakang pada gambar memang putih
    soft_box('BackWall', (W - LEFT_T - TOWER_W + 0.02, BACK_T, upper_h),
             (TRAY_CX, UPPER_Y1 - BACK_T / 2, upper_cz),
             M['white'], r=0.012, seg=6, collection=C)

    # Menara kanan (gelap) — rumah layar dan tombol
    soft_box('Tower', (TOWER_W, UPPER_D, upper_h),
             (TOWER_CX, UPPER_CY, upper_cz),
             M['dark'], r=0.024, seg=10, collection=C)

    # Kanopi (gelap) — menjorok ke depan di atas nampan
    soft_box('Canopy', (W, UPPER_D, CANOPY_H),
             (0, UPPER_CY, CANOPY_BOT + CANOPY_H / 2),
             M['dark'], r=0.026, seg=10, collection=C)

    # Langit-langit terang di bawah kanopi
    soft_box('CanopyInner', (W - LEFT_T - TOWER_W + 0.03, UPPER_D - 0.02, 0.003),
             (TRAY_CX, UPPER_CY, CANOPY_BOT - 0.0015),
             M['white_soft'], r=0.0015, seg=3, collection=C)

    # Kaki karet
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl('Foot_%d_%d' % (sx, sy), 0.014, 0.008,
                (sx * (W / 2 - 0.05), sy * (D / 2 - 0.05), 0.004),
                M['rubber'], verts=24, collection=C)

    # Kisi ventilasi pada dinding belakang
    for i in range(9):
        soft_box('Vent_%d' % i, (0.115, 0.004, 0.0045),
                 (TRAY_CX, UPPER_Y1 + 0.0005, BASE_TOP + 0.075 + i * 0.0125),
                 M['dark_matte'], r=0.001, seg=3, collection=C)


# ════════════════════════════════════════════════════════════
#  Optik: kamera, LED, sensor
# ════════════════════════════════════════════════════════════

def build_optics(M):
    C = 'NC_Optics'
    z = CANOPY_BOT
    cx, cy = TRAY_CX, UPPER_CY - 0.012

    # Modul kamera ESP32-CAM di langit-langit
    soft_box('CamHousing', (0.086, 0.062, 0.024), (cx, cy, z - 0.011),
             M['dark'], r=0.008, seg=6, collection=C)
    cyl('CamBarrel', 0.015, 0.014, (cx, cy, z - 0.028),
        M['steel_dark'], verts=40, collection=C)
    cyl('CamLens', 0.0125, 0.004, (cx, cy, z - 0.036),
        M['lens'], verts=40, collection=C)

    # Dua strip LED biru di bawah kanopi — ciri khas produk
    # Strip biru diletakkan di tepi DEPAN dan BELAKANG langit-langit;
    # lampu putih mundur agar tidak menutupi cahaya biru dari pandangan.
    for i, y in enumerate((UPPER_Y0 + 0.016, UPPER_Y1 - 0.030)):
        soft_box('LEDStrip_%d' % i, (0.255, 0.013, 0.006), (cx, y, z - 0.018),
                 M['led'], r=0.0025, seg=4, collection=C)

    # Lampu putih pencahayaan objek
    soft_box('LightBar', (0.19, 0.008, 0.004), (cx, UPPER_Y0 + 0.105, z - 0.013),
             M['led_white'], r=0.0012, seg=3, collection=C)

    # Pod sensor pada dinding dalam menara (MLX90614 & MQ-135)
    inner_x = OPEN_X1 - 0.002
    for i, zz in enumerate((BASE_TOP + 0.150, BASE_TOP + 0.100)):
        soft_box('SensorPod_%d' % i, (0.020, 0.040, 0.040),
                 (inner_x - 0.008, UPPER_CY - 0.03, zz),
                 M['dark_matte'], r=0.006, seg=6, collection=C)
        cyl('SensorEye_%d' % i, 0.008, 0.006,
            (inner_x - 0.019, UPPER_CY - 0.03, zz),
            M['lens'], verts=28, rot=(0, math.radians(90), 0), collection=C)


# ════════════════════════════════════════════════════════════
#  Layar: navy dengan teks sungguhan
# ════════════════════════════════════════════════════════════

SCREEN_ROWS = [
    ('Kalori', '642 kcal'),
    ('Protein', '23.1 g'),
    ('Karbohidrat', '88.7 g'),
    ('Lemak', '17.2 g'),
    ('Suhu', '36.4 C'),
    ('NH3', '9 ppm'),
]


def build_screen(M):
    C = 'NC_Screen'
    fy = UPPER_Y0                      # muka depan menara
    sy = fy - 0.0012                   # bidang kaca layar
    ty = sy - 0.0010                   # teks sedikit di depan kaca
    cx = TOWER_CX
    cz = BASE_TOP + 0.180

    SW, SH = 0.096, 0.150              # ukuran kaca layar

    # Kaca gelap membulat sebagai bezel
    soft_box('ScreenGlass', (SW + 0.010, 0.006, SH + 0.010),
             (cx, fy + 0.001, cz), M['glass_dark'], r=0.004, seg=6, collection=C)
    # Bidang navy yang menyala
    plane('ScreenLit', SW, SH, (cx, sy, cz), M['screen_bg'],
          rot=(math.radians(90), 0, 0), collection=C)

    left = cx - SW / 2 + 0.007
    right = cx + SW / 2 - 0.007
    top = cz + SH / 2

    # Bilah judul
    plane('UI_TitleBar', SW, 0.013, (cx, ty + 0.0002, top - 0.010),
          M['ui_dim'], rot=(math.radians(90), 0, 0), collection=C)
    text('T_Title', 'HASIL ANALISIS', (left, ty, top - 0.010), 0.0060,
         M['ui_white'], collection=C)

    # Vonis besar
    text('T_Aman', 'AMAN', (cx, ty, top - 0.040), 0.0175,
         M['ui_green'], align='CENTER', collection=C, bold=True)
    text('T_Sesuai', 'Sesuai Gizi', (cx, ty, top - 0.058), 0.0068,
         M['ui_green'], align='CENTER', collection=C)

    # Tabel nilai gizi
    y0 = top - 0.070
    for i, (k, v) in enumerate(SCREEN_ROWS):
        zz = y0 - i * 0.0115
        text('T_K%d' % i, k, (left, ty, zz), 0.0056, M['ui_white'], collection=C)
        text('T_V%d' % i, v, (right, ty, zz), 0.0056, M['ui_white'],
             align='RIGHT', collection=C)

    # Dua bilah hijau + label SESUAI di bawah
    bz = y0 - len(SCREEN_ROWS) * 0.0115 - 0.005
    for dx in (-0.026, 0.026):
        plane('UI_Bar_%.3f' % dx, 0.028, 0.009, (cx + dx, ty + 0.0002, bz),
              M['ui_bar'], rot=(math.radians(90), 0, 0), collection=C)
    text('T_Sesuai2', 'SESUAI', (cx, ty, bz), 0.0058,
         M['ui_white'], align='CENTER', collection=C)

    # Empat tombol fisik, susunan 2 x 2 seperti pada gambar
    btns = ((-0.024, 0.014, M['btn_green']), (0.024, 0.014, M['btn_grey']),
            (-0.024, -0.010, M['btn_amber']), (0.024, -0.010, M['btn_red']))
    bz0 = BASE_TOP + 0.062
    for i, (dx, dz, mat) in enumerate(btns):
        soft_box('Btn_%d' % i, (0.034, 0.006, 0.011),
                 (cx + dx, fy + 0.001, bz0 + dz), mat, r=0.0025, seg=5,
                 collection=C)


# ════════════════════════════════════════════════════════════
#  Merek: heksagon + wordmark pada kanopi
# ════════════════════════════════════════════════════════════

def build_branding(M):
    C = 'NC_Brand'
    fy = UPPER_Y0 - 0.0012
    cx = TRAY_CX
    cz = CANOPY_BOT + CANOPY_H / 2

    # Cincin heksagon
    ring = cyl('LogoHex', 0.0125, 0.0016, (cx, fy, cz + 0.014), M['logo'],
               verts=6, rot=(math.radians(90), 0, 0), collection=C)
    cut = cyl('LogoHexCut', 0.0092, 0.006, (cx, fy, cz + 0.014), None,
              verts=6, rot=(math.radians(90), 0, 0))
    boolean_diff(ring, cut)
    cyl('LogoDot', 0.0042, 0.0016, (cx, fy, cz + 0.014), M['logo'],
        verts=6, rot=(math.radians(90), 0, 0), collection=C)

    # Wordmark
    text('Wordmark', 'NUTRICENSE', (cx, fy, cz - 0.013), 0.0120,
         M['logo'], align='CENTER', extrude=0.0008, collection=C)


# ════════════════════════════════════════════════════════════
#  Nampan + isi
# ════════════════════════════════════════════════════════════

def build_tray(M, with_food=True):
    C = 'NC_Tray'
    tcy = -0.036                       # nampan maju, sebagian di luar kanopi
    tz = BASE_TOP + 0.015

    tray = soft_box('TrayBody', (0.268, 0.188, 0.020), (TRAY_CX, tcy, tz),
                    M['steel'], r=0.008, seg=7, collection=C)

    # Sekat: satu besar di kiri, dua di kanan — mengikuti gambar
    wells = [(-0.068, 0.000, 0.104, 0.152),
             (0.066, 0.052, 0.108, 0.044),
             (0.066, 0.000, 0.108, 0.044),
             (0.066, -0.052, 0.108, 0.044)]
    for i, (dx, dy, w, d) in enumerate(wells):
        cut = soft_box('well_%d' % i, (w, d, 0.016),
                       (TRAY_CX + dx, tcy + dy, tz + 0.008), None, r=0.006, seg=6)
        boolean_diff(tray, cut)
    smooth(tray, 40)

    if not with_food:
        return

    fz = tz + 0.008

    # Nasi
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.032, segments=32, ring_count=16,
                                         location=(TRAY_CX - 0.066, tcy, fz - 0.002))
    rice = bpy.context.active_object
    rice.name = 'Food_Rice'
    rice.scale = (1.35, 1.85, 0.40)
    bpy.ops.object.transform_apply(scale=True)
    sub = rice.modifiers.new('sub', 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    smooth(rice)
    rice.data.materials.append(M['rice'])
    _move(rice, C)

    # Ayam
    for i, (dx, dy, rot) in enumerate(((-0.020, 0.010, 14), (0.006, -0.008, -28),
                                       (0.022, 0.014, 40), (0.000, 0.020, -6))):
        bpy.ops.mesh.primitive_cube_add(
            size=0.022, location=(TRAY_CX + 0.066 + dx, tcy + 0.052 + dy, fz))
        c = bpy.context.active_object
        c.name = 'Food_Chicken_%d' % i
        c.scale = (1.0, 0.70, 0.52)
        c.rotation_euler = (0, 0, math.radians(rot))
        bpy.ops.object.transform_apply(scale=True)
        b = c.modifiers.new('bev', 'BEVEL')
        b.width = 0.0045
        b.segments = 4
        bpy.ops.object.modifier_apply(modifier=b.name)
        smooth(c)
        c.data.materials.append(M['chicken'])
        _move(c, C)

    # Sayur + wortel
    for i in range(12):
        a = i * 1.21
        px = TRAY_CX + 0.066 + math.cos(a) * 0.030
        py = tcy - 0.052 + math.sin(a) * 0.012
        pz = fz - 0.002 + (i % 3) * 0.004
        if i % 4 == 0:
            cyl('Food_Carrot_%d' % i, 0.008, 0.005, (px, py, pz), M['carrot'],
                verts=20, rot=(math.radians(76), 0, math.radians(i * 30)),
                collection=C)
        else:
            bpy.ops.mesh.primitive_ico_sphere_add(
                radius=0.0095 + (i % 3) * 0.002, subdivisions=2,
                location=(px, py, pz))
            v = bpy.context.active_object
            v.name = 'Food_Veg_%d' % i
            v.scale = (1, 1, 0.82)
            bpy.ops.object.transform_apply(scale=True)
            smooth(v)
            v.data.materials.append(M['veg'])
            _move(v, C)


# ════════════════════════════════════════════════════════════
#  Detail halus
# ════════════════════════════════════════════════════════════

def build_details(M):
    C = 'NC_Detail'

    # Pelat nama + LED daya pada muka depan slab
    soft_box('NamePlate', (0.048, 0.0022, 0.012),
             (-0.150, FRONT - 0.0006, PLINTH_H + 0.036),
             M['steel_dark'], r=0.001, seg=4, collection=C)
    cyl('PowerLED', 0.0032, 0.003, (-0.196, FRONT - 0.0008, PLINTH_H + 0.036),
        M['btn_green'], verts=18, rot=(math.radians(90), 0, 0), collection=C)

    # Port kabel + sakelar daya di belakang slab
    cyl('CablePort', 0.010, 0.012, (0.135, D / 2 + 0.001, PLINTH_H + 0.034),
        M['steel_dark'], verts=28, rot=(math.radians(90), 0, 0), collection=C)
    soft_box('PowerSwitch', (0.018, 0.005, 0.010),
             (0.172, D / 2 + 0.0008, PLINTH_H + 0.034),
             M['dark_matte'], r=0.0015, seg=4, collection=C)

    # Kisi pada sisi luar menara — terlihat saat turntable
    for i in range(6):
        soft_box('TowerVent_%d' % i, (0.004, 0.050, 0.0045),
                 (W / 2 + 0.0006, UPPER_CY - 0.05, BASE_TOP + 0.035 + i * 0.011),
                 M['dark_matte'], r=0.001, seg=3, collection=C)

    # Bibir tipis di tepi depan kanopi — garis sorot khas produk
    soft_box('CanopyLip', (W - 0.02, 0.004, 0.005),
             (0, UPPER_Y0 - 0.0015, CANOPY_BOT + 0.006),
             M['steel_dark'], r=0.0012, seg=4, collection=C)


# ════════════════════════════════════════════════════════════

def build_all(with_food=True):
    M = build_materials()
    build_body(M)
    build_optics(M)
    build_screen(M)
    build_tray(M, with_food=with_food)
    build_details(M)
    build_branding(M)
    return M


def device_empty():
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, H * 0.44))
    e = bpy.context.active_object
    e.name = 'NC_Pivot'
    e.empty_display_size = 0.05
    return e
