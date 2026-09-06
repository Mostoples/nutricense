# ============================================================
#  NUTRICENSE — Ekspor hasil render ke aset web
#  PNG 1920px (±2 MB) diubah menjadi WebP berkualitas tinggi
#  (±150–250 KB) dan disalin ke assets/img/product/.
#  Video mp4 disalin ke assets/video/.
#
#  Memakai Blender sebagai pengonversi agar tidak perlu
#  dependensi tambahan (Pillow/ffmpeg) di mesin ini.
#
#  blender --background --factory-startup --python export_web.py
# ============================================================

import bpy
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC_STILLS = os.path.join(HERE, 'out', 'stills')
SRC_VIDEO = os.path.join(HERE, 'out', 'nc_box_product.mp4')

DST_IMG = os.path.join(ROOT, 'assets', 'img', 'product')
DST_VID = os.path.join(ROOT, 'assets', 'video')
os.makedirs(DST_IMG, exist_ok=True)
os.makedirs(DST_VID, exist_ok=True)

sc = bpy.context.scene
# PNG sudah melewati view transform saat dirender; jangan diterapkan dua kali.
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.view_settings.exposure = 0.0
sc.view_settings.gamma = 1.0

ims = sc.render.image_settings
if hasattr(ims, 'media_type'):
    ims.media_type = 'IMAGE'


def convert(src, dst, fmt, quality, width=None):
    img = bpy.data.images.load(src, check_existing=False)
    if width and img.size[0] > width:
        h = int(round(img.size[1] * width / img.size[0]))
        img.scale(width, h)
    ims.file_format = fmt
    ims.quality = quality
    ims.color_mode = 'RGB'
    img.save_render(filepath=dst, scene=sc)
    size = os.path.getsize(dst)
    print('[web] %-22s %6.0f KB  %dx%d' %
          (os.path.basename(dst), size / 1024, img.size[0], img.size[1]))
    bpy.data.images.remove(img)
    return size


total = 0
if os.path.isdir(SRC_STILLS):
    for name in sorted(os.listdir(SRC_STILLS)):
        if not name.endswith('.png'):
            continue
        stem = os.path.splitext(name)[0]
        src = os.path.join(SRC_STILLS, name)
        # Versi lebar untuk tampilan besar
        total += convert(src, os.path.join(DST_IMG, stem + '.webp'),
                         'WEBP', 82, width=1600)
        # Versi kecil untuk kisi galeri
        total += convert(src, os.path.join(DST_IMG, stem + '_sm.webp'),
                         'WEBP', 78, width=720)
        # Cadangan JPEG untuk peramban lama
        total += convert(src, os.path.join(DST_IMG, stem + '.jpg'),
                         'JPEG', 84, width=1600)
else:
    print('[web] tidak ada stills di', SRC_STILLS)

if os.path.isfile(SRC_VIDEO):
    dst = os.path.join(DST_VID, 'nc-box-product.mp4')
    shutil.copy2(SRC_VIDEO, dst)
    size = os.path.getsize(dst)
    total += size
    print('[web] %-22s %6.0f KB' % (os.path.basename(dst), size / 1024))
else:
    print('[web] video belum ada di', SRC_VIDEO)

print('[web] total aset web: %.1f MB' % (total / 1024 / 1024))
print('[web] gambar ->', DST_IMG)
print('[web] video  ->', DST_VID)
