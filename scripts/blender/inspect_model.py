import bpy
import sys

argv = sys.argv[sys.argv.index("--") + 1:]
glb_path = argv[0]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb_path)

for obj in bpy.data.objects:
    print(f"OBJ: {obj.name} type={obj.type}")
    if obj.type == "MESH":
        bbox = [obj.matrix_world @ v.co for v in obj.data.vertices[:0]]  # placeholder
        corners = [obj.matrix_world @ __import__("mathutils").Vector(c) for c in obj.bound_box]
        xs = [c.x for c in corners]
        ys = [c.y for c in corners]
        zs = [c.z for c in corners]
        print(f"  bbox x:[{min(xs):.4f},{max(xs):.4f}] y:[{min(ys):.4f},{max(ys):.4f}] z:[{min(zs):.4f},{max(zs):.4f}]")
        print(f"  verts={len(obj.data.vertices)} polys={len(obj.data.polygons)}")
        print(f"  materials={[m.name if m else None for m in obj.data.materials]}")
