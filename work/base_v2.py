import bpy, bmesh, math, mathutils
OUT="/Users/saborit22/3D-PROJECT/work"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=OUT+"/model.glb")
ms=[o for o in bpy.data.objects if o.type=='MESH']
for o in bpy.data.objects: o.select_set(o.type=='MESH')
bpy.context.view_layer.objects.active=ms[0]
if len(ms)>1: bpy.ops.object.join()
dog=bpy.context.active_object
# escala a 5cm de alto (Z)
bm=bmesh.new(); bm.from_mesh(dog.data)
zspan=max(v.co.z for v in bm.verts)-min(v.co.z for v in bm.verts)
f=50.0/zspan
for v in bm.verts: v.co*=f
bm.to_mesh(dog.data); bm.free()
bm=bmesh.new(); bm.from_mesh(dog.data)
xs=[v.co.x for v in bm.verts]; ys=[v.co.y for v in bm.verts]; zs=[v.co.z for v in bm.verts]; bm.free()
cx=(min(xs)+max(xs))/2; cy=(min(ys)+max(ys))/2; zmin=min(zs)
foot=max(max(xs)-min(xs), max(ys)-min(ys))
rad=foot/2*1.15            # base pequena, con hueco delante para el nombre
DEPTH=3.5                  # fina/baja
TOP=zmin                   # cara superior de la base = patas del perro
by=cy-rad*0.12             # base corrida hacia delante -> mas marmol libre delante
# --- base cilindro ---
bpy.ops.mesh.primitive_cylinder_add(radius=rad, depth=DEPTH, location=(cx,by,TOP-DEPTH/2), vertices=96)
base=bpy.context.active_object
# marmol blanco
mb=bpy.data.materials.new("marble"); mb.use_nodes=True
p=mb.node_tree.nodes["Principled BSDF"]
p.inputs["Base Color"].default_value=(0.93,0.92,0.90,1); p.inputs["Roughness"].default_value=0.35
base.data.materials.append(mb)
# bevel fino en el borde
bpy.ops.object.modifier_add(type='BEVEL'); base.modifiers["Bevel"].width=0.5; base.modifiers["Bevel"].segments=3
bpy.ops.object.modifier_apply(modifier="Bevel")
# --- nombre PEPE grabado HACIA DENTRO en la cara de arriba, delante del perro ---
bpy.ops.object.text_add(location=(cx, by-rad*0.60, TOP+0.3))
txt=bpy.context.active_object; txt.data.body="PEPE"
txt.data.align_x="CENTER"; txt.data.align_y="CENTER"; txt.data.size=rad*0.42
txt.data.resolution_u=4     # curvas limpias (evita letras rotas al restar)
txt.data.extrude=1.2        # cuerpo que cruza la cara -> carva ~1mm al restar
bpy.context.view_layer.objects.active=txt; bpy.ops.object.convert(target='MESH')
# boolean DIFFERENCE -> hunde el texto en la base (surco)
bpy.context.view_layer.objects.active=base
mod=base.modifiers.new("cut",'BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=txt
bpy.ops.object.modifier_apply(modifier="cut")
bpy.data.objects.remove(txt, do_unlink=True)
# relleno OSCURO dentro del surco -> PEPE negro hundido, bien visible
bpy.ops.object.text_add(location=(cx, by-rad*0.60, TOP-0.9))
ink=bpy.context.active_object; ink.data.body="PEPE"
ink.data.align_x="CENTER"; ink.data.align_y="CENTER"; ink.data.size=rad*0.42
ink.data.resolution_u=4; ink.data.extrude=1.0   # sube hasta ~0.1mm bajo la cara
bpy.context.view_layer.objects.active=ink; bpy.ops.object.convert(target='MESH')
mi=bpy.data.materials.new("ink"); mi.use_nodes=True
pi=mi.node_tree.nodes["Principled BSDF"]
pi.inputs["Base Color"].default_value=(0.05,0.04,0.03,1); pi.inputs["Roughness"].default_value=0.5
ink.data.materials.append(mi)
# --- render preview (3/4 frontal) ---
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=48
sc.render.resolution_x=720; sc.render.resolution_y=820
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(1,1,1,1); w.node_tree.nodes["Background"].inputs[1].default_value=1.4
bpy.ops.object.light_add(type='AREA'); L=bpy.context.active_object
L.data.energy=1800; L.data.size=10; L.location=(cx+40,cy-55,TOP+95); L.rotation_euler=(math.radians(48),0,math.radians(20))
ctr=mathutils.Vector((cx,by-rad*0.3,TOP+2))
cdat=bpy.data.cameras.new("c"); cam=bpy.data.objects.new("c",cdat); sc.collection.objects.link(cam); sc.camera=cam
tgt=bpy.data.objects.new("t",None); sc.collection.objects.link(tgt); tgt.location=ctr
con=cam.constraints.new('TRACK_TO'); con.target=tgt; con.track_axis='TRACK_NEGATIVE_Z'; con.up_axis='UP_Y'
cam.location=(cx+10, by-rad-70, TOP+16); sc.render.filepath=OUT+"/base_v2.png"; bpy.ops.render.render(write_still=True)
print("RENDERED rad=%.1f depth=%.1f"%(rad,DEPTH))
