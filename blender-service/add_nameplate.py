"""
Coge un .glb generado por Tripo (perro + base + placa en blanco) y pega
encima un texto 3D real y nítido con el nombre — la posición se calcula a
partir de la geometría del propio modelo (siempre: base abajo, placa en la
cara frontal = +X, centrada en Y), no son coordenadas fijas por figura.

Uso:
  blender --background --python add_nameplate.py -- input.glb "NOMBRE" output.glb
"""
import bpy
import sys
import mathutils

argv = sys.argv[sys.argv.index("--") + 1:]
in_path, name, out_path = argv[0], argv[1], argv[2]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=in_path)

mesh_obj = [o for o in bpy.data.objects if o.type == "MESH"][0]
corners = [mesh_obj.matrix_world @ mathutils.Vector(c) for c in mesh_obj.bound_box]
xs = [c.x for c in corners]
ys = [c.y for c in corners]
zs = [c.z for c in corners]
min_x, max_x = min(xs), max(xs)
min_y, max_y = min(ys), max(ys)
min_z, max_z = min(zs), max(zs)
size_y, size_z = max_y - min_y, max_z - min_z

plate_x = max_x + 0.004  # justo delante de la superficie, evita z-fighting
plate_y = (min_y + max_y) / 2
plate_z = min_z + size_z * 0.06

text_size = size_y * 0.11

bpy.ops.object.text_add(location=(plate_x, plate_y, plate_z))
text_obj = bpy.context.object
text_obj.data.body = name.upper()
text_obj.data.align_x = "CENTER"
text_obj.data.align_y = "CENTER"
text_obj.data.extrude = text_size * 0.06
text_obj.data.size = text_size
text_obj.rotation_euler = (1.5708, 0, 1.5708)

mat = bpy.data.materials.new(name="nameplate_gold")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.83, 0.68, 0.21, 1.0)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.3
text_obj.data.materials.append(mat)

bpy.ops.object.convert(target="MESH")

# Fusiona el texto con la malla del perro en UN solo objeto — algunos
# visores (Quick Look de macOS, slicers de impresión) no interpretan bien
# escenas .glb con varios objetos raíz independientes y los muestran
# descolocados/sueltos aunque en Blender se vean perfectamente alineados.
bpy.ops.object.select_all(action="DESELECT")
text_obj.select_set(True)
mesh_obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_obj
bpy.ops.object.join()

bpy.ops.export_scene.gltf(filepath=out_path, export_format="GLB", use_selection=False)
print(f"OK -> {out_path}")
