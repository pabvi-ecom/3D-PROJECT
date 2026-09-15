import bpy, sys, mathutils
argv = sys.argv[sys.argv.index("--") + 1:]
glb_path, out_dir = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
if glb_path.lower().endswith(".stl"):
    bpy.ops.wm.stl_import(filepath=glb_path)
else:
    bpy.ops.import_scene.gltf(filepath=glb_path)
xs, ys, zs = [], [], []
for o in bpy.data.objects:
    if o.type != "MESH": continue
    for c in o.bound_box:
        v = o.matrix_world @ mathutils.Vector(c)
        xs.append(v.x); ys.append(v.y); zs.append(v.z)
cx, cy, cz = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2, (min(zs)+max(zs))/2
size = max(max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x = 800; sc.render.resolution_y = 800
L = bpy.data.lights.new("s", "SUN"); L.energy = 3.5
Lo = bpy.data.objects.new("s", L); sc.collection.objects.link(Lo); Lo.location = (cx+size, cy-size, cz+size)
cam = bpy.data.cameras.new("c"); cam.type = "ORTHO"
co = bpy.data.objects.new("c", cam); sc.collection.objects.link(co); sc.camera = co
# vista de la placa desde 45° arriba-derecha para ver si sobresale por el lado
views = {
  "plate_front": ((cx+size*2, cy, cz-size*0.36), (1.5708,0,1.5708), size*0.42),
  "plate_angle": ((cx+size*1.6, cy-size*1.2, cz-size*0.25), (1.25,0,1.05), size*0.6),
}
for n,(loc,rot,s) in views.items():
    co.location = loc; co.rotation_euler = rot; cam.ortho_scale = s
    sc.render.filepath = f"{out_dir}/{n}.png"
    bpy.ops.render.render(write_still=True)
    print("rendered", n)
