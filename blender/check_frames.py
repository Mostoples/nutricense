import bpy, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import studio as ST
sc = bpy.context.scene
ST.setup_render(res=(960, 540), samples=32)
ST.setup_still_output('')
os.makedirs(os.path.join(HERE, 'out', 'check'), exist_ok=True)
for f in (5, 60, 96, 140, 180, 225, 264, 300, 360, 405):
    sc.frame_set(f)
    sc.render.filepath = os.path.join(HERE, 'out', 'check', 'f%03d.png' % f)
    bpy.ops.render.render(write_still=True)
    print('CHECK frame', f, '->', sc.camera.name if sc.camera else 'NO CAM')
