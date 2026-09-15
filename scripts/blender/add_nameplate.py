"""
Coge un .glb generado por Tripo (perro + base + placa en blanco) y pega
encima un texto 3D real y nítido con el nombre — la posición se calcula a
partir de la geometría del propio modelo (siempre: base abajo, placa en la
cara frontal = +X, centrada en Y), no son coordenadas fijas por figura.

También exporta un .stl junto al .glb — es lo que de verdad acepta el
proveedor de impresión (JLC3DP no admite .glb), y además se ve bien en
CUALQUIER visor (Quick Look incluido) porque es un formato mucho más
simple, sin materiales ni nodos que puedan interpretarse mal.

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

plate_y = (min_y + max_y) / 2
plate_z = min_z + size_z * 0.06

text_size = size_y * 0.10
# Relieve FINO (no un bloque grueso). El texto se hunde solo un poco en la
# superficie para que no quede hueco visible, y sobresale poco — como el
# grabado en relieve de una placa real, no un tornillo saliendo.
relief = text_size * 0.05   # cuánto sobresale
embed = text_size * 0.12    # cuánto se hunde (suficiente para no dejar hueco)
plate_x = max_x - embed

bpy.ops.object.text_add(location=(plate_x, plate_y, plate_z))
text_obj = bpy.context.object
text_obj.data.body = name.upper()
text_obj.data.align_x = "CENTER"
text_obj.data.align_y = "CENTER"
text_obj.data.extrude = embed + relief
text_obj.data.size = text_size
text_obj.rotation_euler = (1.5708, 0, 1.5708)

# La base es REDONDA — si el texto es ancho, sus extremos se salen por el
# lateral curvo (efecto "tornillo"). Se limita a ~40% del ancho del modelo
# (la zona central plana de la placa), escalándolo si hace falta.
bpy.context.view_layer.update()
tb = [text_obj.matrix_world @ mathutils.Vector(c) for c in text_obj.bound_box]
text_w = max(v.y for v in tb) - min(v.y for v in tb)
max_w = size_y * 0.42
if text_w > max_w:
    s = max_w / text_w
    text_obj.data.size = text_size * s
    text_obj.data.extrude = embed + relief

mat = bpy.data.materials.new(name="nameplate_gold")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.83, 0.68, 0.21, 1.0)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.3
text_obj.data.materials.append(mat)

bpy.ops.object.convert(target="MESH")

# La unión booleana no sirve aquí: la malla que devuelve Tripo (IA) no es
# manifold/estanca, así que el solver falla en silencio y no suelda nada
# (probado con "Exact" y "Float" — mismo resultado que sin booleano).
# En su lugar, el texto va HUNDIDO bien dentro del sólido (0.4× su tamaño)
# — la mayor parte queda enterrada dentro de la figura, invisible, y solo
# asoma el relieve. Para renderizado (no hay hueco/costura que un visor
# pueda pintar mal) y para impresión (los slicers unen sólidos que se
# solapan al laminar, no hace falta que estén topológicamente fusionados
# en el archivo) es indistinguible de una soldadura real.
bpy.ops.object.select_all(action="DESELECT")
text_obj.select_set(True)
mesh_obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_obj
bpy.ops.object.join()

bpy.ops.export_scene.gltf(filepath=out_path, export_format="GLB", use_selection=False)
print(f"OK -> {out_path}")

stl_path = out_path.rsplit(".", 1)[0] + ".stl"
bpy.ops.object.select_all(action="DESELECT")
mesh_obj.select_set(True)
bpy.ops.wm.stl_export(filepath=stl_path, export_selected_objects=True)
print(f"OK -> {stl_path}")
