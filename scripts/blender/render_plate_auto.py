import bpy, sys, mathutils
argv = sys.argv[sys.argv.index("--") + 1:]
glb_path, out_dir = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
if glb_path.lower().endswith(".stl"):
    bpy.ops.wm.stl_import(filepath=glb_path)
else:
    bpy.ops.import_scene.gltf(filepath=glb_path)
mesh = [o for o in bpy.data.objects if o.type == "MESH"][0]
mw = mesh.matrix_world
verts = [mw @ v.co for v in mesh.data.vertices]
xs = [v.x for v in verts]; ys = [v.y for v in verts]; zs = [v.z for v in verts]
min_x, max_x = min(xs), max(xs); min_z, max_z = min(zs), max(zs)
size_x = max_x - min_x; size_z = max_z - min_z
base_top = min_z + size_z * 0.22
bv = [v for v in verts if v.z <= base_top]
bfx = max(v.x for v in bv)
pv = [v for v in bv if v.x >= bfx - size_x * 0.03]
py = sum(v.y for v in pv) / len(pv)
pz = sum(v.z for v in pv) / len(pv)
size = max(size_x, max(ys)-min(ys), size_z)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"; sc.render.resolution_x = 800; sc.render.resolution_y = 800
L = bpy.data.lights.new("s","SUN"); L.energy=4; Lo=bpy.data.objects.new("s",L); sc.collection.objects.link(Lo); Lo.location=(bfx+size,py-size*0.3,pz+size*0.3)
cam=bpy.data.cameras.new("c"); cam.type="ORTHO"; co=bpy.data.objects.new("c",cam); sc.collection.objects.link(co); sc.camera=co
co.location=(bfx+size, py, pz); co.rotation_euler=(1.5708,0,1.5708); cam.ortho_scale=size*0.35
sc.render.filepath=f"{out_dir}/plate.png"
bpy.ops.render.render(write_still=True)
print("done")
