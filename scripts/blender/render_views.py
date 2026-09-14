import bpy
import sys
import mathutils

argv = sys.argv[sys.argv.index("--") + 1:]
glb_path = argv[0]
out_dir = argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb_path)

mesh_objs = [o for o in bpy.data.objects if o.type == "MESH"]
xs, ys, zs = [], [], []
for obj in mesh_objs:
    for c in obj.bound_box:
        v = obj.matrix_world @ mathutils.Vector(c)
        xs.append(v.x)
        ys.append(v.y)
        zs.append(v.z)
cx, cy, cz = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2
size = max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs))

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 800
scene.render.resolution_y = 800

light_data = bpy.data.lights.new(name="sun", type="SUN")
light_data.energy = 3
light_obj = bpy.data.objects.new(name="sun", object_data=light_data)
scene.collection.objects.link(light_obj)
light_obj.location = (cx, cy - size, cz + size)

cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = size * 1.3
cam_obj = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

views = {
    "front": ((cx + size * 2, cy, cz), (1.5708, 0, 1.5708), size * 1.3),
    "plate_closeup": ((cx + size * 2, cy, cz - size * 0.35), (1.5708, 0, 1.5708), size * 0.4),
}

for name, (loc, rot, scale) in views.items():
    cam_obj.location = loc
    cam_obj.rotation_euler = rot
    cam_data.ortho_scale = scale
    scene.render.filepath = f"{out_dir}/{name}.png"
    bpy.ops.render.render(write_still=True)
    print(f"rendered {name}")
