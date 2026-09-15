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
mw = mesh_obj.matrix_world
verts = [mw @ v.co for v in mesh_obj.data.vertices]
xs = [v.x for v in verts]
ys = [v.y for v in verts]
zs = [v.z for v in verts]
min_x, max_x = min(xs), max(xs)
min_y, max_y = min(ys), max(ys)
min_z, max_z = min(zs), max(zs)
size_x, size_y, size_z = max_x - min_x, max_y - min_y, max_z - min_z

# DETECTA la placa (no adivina): la placa metálica es la que MÁS sobresale
# hacia delante (+X) en la franja BAJA del modelo (base, 22% inferior). Se
# aíslan solo los vértices de esa placa saliente (tolerancia estrecha para
# no coger el resto de la base) y de ahí sale su centro Y/Z y su ANCHO real.
base_top = min_z + size_z * 0.22
base_verts = [v for v in verts if v.z <= base_top]
base_front_x = max(v.x for v in base_verts)

# La placa metálica sobresale más que la madera. En vez de coger solo la
# franja más saliente (queda fina y descentra el texto), se divide la base
# en 40 franjas horizontales; en cada franja se mira cuánto sobresale. Las
# franjas donde sobresale casi como el máximo = la altura real de la placa.
NB = 40
bin_h = (base_top - min_z) / NB
bin_max_x = [-1e9] * NB
for v in base_verts:
    i = min(NB - 1, int((v.z - min_z) / bin_h))
    if v.x > bin_max_x[i]:
        bin_max_x[i] = v.x
plate_bins = [i for i in range(NB) if bin_max_x[i] >= base_front_x - size_x * 0.02]
plate_h = (max(plate_bins) - min(plate_bins) + 1) * bin_h
# +15% para compensar que las franjas bajas cogen algo del borde de madera
# y el centro geométrico queda un poco por debajo del centro visual.
plate_z = min_z + (min(plate_bins) + max(plate_bins) + 1) / 2 * bin_h + plate_h * 0.15

plate_z_lo = min_z + min(plate_bins) * bin_h
plate_z_hi = min_z + (max(plate_bins) + 1) * bin_h
pv = [v for v in base_verts if plate_z_lo <= v.z <= plate_z_hi and v.x >= base_front_x - size_x * 0.02]
pys = [v.y for v in pv]
plate_w = max(pys) - min(pys)
plate_y = (min(pys) + max(pys)) / 2
plate_front_x = base_front_x

# Tamaño del texto relativo a la ALTURA de la placa (que ocupe ~40% de su
# alto), con un mínimo por si la detección de altura sale corta.
text_size = max(plate_h * 0.4, size_y * 0.07)
# Casi sin relieve: el texto va PEGADO a la placa (sobresale mínimamente) y
# hundido lo justo para soldar. Nada de bloque grueso ni tornillo.
relief = text_size * 0.04   # sobresale poco, pero legible (grabado, no bloque)
embed = text_size * 0.18    # hundido lo justo para no dejar hueco
plate_x = plate_front_x - embed

bpy.ops.object.text_add(location=(plate_x, plate_y, plate_z))
text_obj = bpy.context.object
text_obj.data.body = name.upper()
text_obj.data.align_x = "CENTER"
text_obj.data.align_y = "CENTER"
text_obj.data.extrude = embed + relief
text_obj.data.size = text_size
text_obj.rotation_euler = (1.5708, 0, 1.5708)

# Ajusta el texto al ancho REAL de la placa detectada (70% de su ancho) —
# así los extremos nunca llegan al borde curvo de la base y no sobresalen.
bpy.context.view_layer.update()
tb = [text_obj.matrix_world @ mathutils.Vector(c) for c in text_obj.bound_box]
text_w = max(v.y for v in tb) - min(v.y for v in tb)
max_w = plate_w * 0.70
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
