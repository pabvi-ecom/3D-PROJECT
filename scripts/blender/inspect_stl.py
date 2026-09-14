import bpy
import sys
import mathutils

argv = sys.argv[sys.argv.index("--") + 1:]
stl_path = argv[0]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.stl_import(filepath=stl_path)

for obj in bpy.data.objects:
    if obj.type != "MESH":
        continue
    print(f"OBJ: {obj.name}  verts={len(obj.data.vertices)}")
    # separa por partes sueltas (loose parts) para ver si hay algo desconectado
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    visited = set()
    islands = []
    for v in bm.verts:
        if v.index in visited:
            continue
        stack = [v]
        island = []
        while stack:
            cur = stack.pop()
            if cur.index in visited:
                continue
            visited.add(cur.index)
            island.append(cur)
            for e in cur.link_edges:
                other = e.other_vert(cur)
                if other.index not in visited:
                    stack.append(other)
        islands.append(island)
    print(f"  islas sueltas: {len(islands)}")
    for i, isl in enumerate(sorted(islands, key=len, reverse=True)[:10]):
        coords = [obj.matrix_world @ v.co for v in isl]
        xs = [c.x for c in coords]
        ys = [c.y for c in coords]
        zs = [c.z for c in coords]
        print(f"    isla {i}: {len(isl)} verts, bbox x:[{min(xs):.3f},{max(xs):.3f}] y:[{min(ys):.3f},{max(ys):.3f}] z:[{min(zs):.3f},{max(zs):.3f}]")
    bm.free()
