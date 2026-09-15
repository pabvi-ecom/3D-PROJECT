"""
Ya NO toca el nombre: la placa la reconstruye Tripo (P2+8K) directamente de
la imagen, nítida. Este paso solo hace dos cosas necesarias:
  1. Convierte el .glb de Tripo a .stl (lo que acepta el proveedor JLC3DP).
  2. Re-exporta el .glb para guardarlo permanente (las URLs de Tripo caducan).

Uso (el 2º arg "name" se ignora, se mantiene por compatibilidad del server):
  blender --background --python add_nameplate.py -- input.glb "IGNORADO" output.glb
"""
import bpy
import sys

argv = sys.argv[sys.argv.index("--") + 1:]
in_path, _name, out_path = argv[0], argv[1], argv[2]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=in_path)

bpy.ops.export_scene.gltf(filepath=out_path, export_format="GLB", use_selection=False)
print(f"OK -> {out_path}")

stl_path = out_path.rsplit(".", 1)[0] + ".stl"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.wm.stl_export(filepath=stl_path, export_selected_objects=True)
print(f"OK -> {stl_path}")
