# ============================================================
#  NUTRICENSE — Bangun model + studio, simpan .blend
#  Jalankan:
#    blender --background --factory-startup --python build_model.py -- [--preview]
#  Opsi:
#    --preview   render satu still cepat untuk pemeriksaan
#    --food/--no-food   sertakan isi nampan (default: sertakan)
# ============================================================

import bpy
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import nc_box as NC
import studio as ST

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in argv
WITH_FOOD = '--no-food' not in argv

OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

print('=== NC-BOX BUILD START ===')

NC.purge()
NC.build_all(with_food=WITH_FOOD)
pivot, cam = ST.build_studio()

info = ST.setup_render(res=(1280, 720) if PREVIEW else (1920, 1080),
                       samples=48 if PREVIEW else 128)
print('[build] engine=%s gpu=%s' % (info['engine'], info['gpu']))

blend_path = os.path.join(HERE, 'nc_box.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print('[build] tersimpan:', blend_path)

# Ringkasan objek supaya mudah diperiksa
counts = {}
for o in bpy.data.objects:
    counts[o.type] = counts.get(o.type, 0) + 1
tris = sum(len(o.data.loop_triangles) if o.type == 'MESH' and o.data else 0
           for o in bpy.data.objects)
print('[build] objek:', counts)
print('[build] material:', len(bpy.data.materials))

if PREVIEW:
    ST.setup_still_output(os.path.join(OUT, 'preview'))
    bpy.context.scene.render.filepath = os.path.join(OUT, 'preview.png')
    bpy.ops.render.render(write_still=True)
    print('[build] pratinjau:', os.path.join(OUT, 'preview.png'))

print('=== NC-BOX BUILD DONE ===')
