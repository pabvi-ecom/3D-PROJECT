import bpy, bmesh, math, mathutils
OUT="/Users/saborit22/3D-PROJECT/work"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=OUT+"/model.glb")
ms=[o for o in bpy.data.objects if o.type=='MESH']
for o in bpy.data.objects: o.select_set(o.type=='MESH')
bpy.context.view_layer.objects.active=ms[0]
if len(ms)>1: bpy.ops.object.join()
dog=bpy.context.active_object
bm=bmesh.new(); bm.from_mesh(dog.data)
zspan=max(v.co.z for v in bm.verts)-min(v.co.z for v in bm.verts)
f=50.0/zspan
for v in bm.verts: v.co*=f
bm.to_mesh(dog.data); bm.free()
bm=bmesh.new(); bm.from_mesh(dog.data)
xs=[v.co.x for v in bm.verts]; ys=[v.co.y for v in bm.verts]; zs=[v.co.z for v in bm.verts]; bm.free()
cx=(min(xs)+max(xs))/2; cy=(min(ys)+max(ys))/2; TOP=min(zs)
foot=max(max(xs)-min(xs), max(ys)-min(ys))

# marmol beige calido (ref del usuario)
mb=bpy.data.materials.new("marble"); mb.use_nodes=True
p=mb.node_tree.nodes["Principled BSDF"]
p.inputs["Base Color"].default_value=(0.88,0.80,0.70,1); p.inputs["Roughness"].default_value=0.28

# pedestal 2 niveles: superior (donde pisa el perro) mas estrecho, inferior mas ancho (step)
RTOP=foot/2*1.02; H2=2.5          # tier superior
RBOT=RTOP*1.14;  H1=6.0           # tier inferior (canto alto para el nombre)
# superior
bpy.ops.mesh.primitive_cylinder_add(radius=RTOP, depth=H2, location=(cx,cy,TOP-H2/2), vertices=96)
up=bpy.context.active_object; up.data.materials.append(mb)
bpy.ops.object.modifier_add(type='BEVEL'); up.modifiers["Bevel"].width=0.4; up.modifiers["Bevel"].segments=3
bpy.ops.object.modifier_apply(modifier="Bevel")
# inferior
ZB=TOP-H2                          # cara superior del tier inferior
bpy.ops.mesh.primitive_cylinder_add(radius=RBOT, depth=H1, location=(cx,cy,ZB-H1/2), vertices=96)
base=bpy.context.active_object; base.data.materials.append(mb)
bpy.ops.object.modifier_add(type='BEVEL'); base.modifiers["Bevel"].width=0.5; base.modifiers["Bevel"].segments=3
bpy.ops.object.modifier_apply(modifier="Bevel")

ZRIM=ZB-H1/2                       # centro del canto inferior (vertical)
YF=cy-RBOT                         # cara frontal del canto

# --- surco: PEPE grabado en el CANTO (cara vertical frontal) ---
bpy.ops.object.text_add(location=(cx, YF, ZRIM))
txt=bpy.context.active_object; txt.data.body="PEPE"
txt.data.align_x="CENTER"; txt.data.align_y="CENTER"; txt.data.size=H1*0.5
txt.data.resolution_u=4; txt.data.extrude=1.0
txt.rotation_euler=(math.radians(90),0,0)   # texto de pie en la cara vertical
bpy.context.view_layer.objects.active=txt; bpy.ops.object.convert(target='MESH')
bpy.context.view_layer.objects.active=base
mod=base.modifiers.new("cut",'BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=txt
bpy.ops.object.modifier_apply(modifier="cut")
bpy.data.objects.remove(txt, do_unlink=True)
# --- relleno oscuro dentro del surco (letras negras hundidas) ---
bpy.ops.object.text_add(location=(cx, YF+0.5, ZRIM))
ink=bpy.context.active_object; ink.data.body="PEPE"
ink.data.align_x="CENTER"; ink.data.align_y="CENTER"; ink.data.size=H1*0.5
ink.data.resolution_u=4; ink.data.extrude=0.45
ink.rotation_euler=(math.radians(90),0,0)
bpy.context.view_layer.objects.active=ink; bpy.ops.object.convert(target='MESH')
mi=bpy.data.materials.new("ink"); mi.use_nodes=True
pi=mi.node_tree.nodes["Principled BSDF"]
pi.inputs["Base Color"].default_value=(0.05,0.04,0.03,1); pi.inputs["Roughness"].default_value=0.5
ink.data.materials.append(mi)

# --- render frontal (un poco elevado) ---
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=48
sc.render.resolution_x=720; sc.render.resolution_y=860
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(1,1,1,1); w.node_tree.nodes["Background"].inputs[1].default_value=1.4
bpy.ops.object.light_add(type='AREA'); L=bpy.context.active_object
L.data.energy=1800; L.data.size=10; L.location=(cx+40,cy-55,TOP+95); L.rotation_euler=(math.radians(48),0,math.radians(20))
ctr=mathutils.Vector((cx,cy,TOP*0.4))
cdat=bpy.data.cameras.new("c"); cam=bpy.data.objects.new("c",cdat); sc.collection.objects.link(cam); sc.camera=cam
tgt=bpy.data.objects.new("t",None); sc.collection.objects.link(tgt); tgt.location=ctr
con=cam.constraints.new('TRACK_TO'); con.target=tgt; con.track_axis='TRACK_NEGATIVE_Z'; con.up_axis='UP_Y'
cam.location=(cx+12, cy-150, TOP+30); sc.render.filepath=OUT+"/base_v3.png"; bpy.ops.render.render(write_still=True)
print("RENDERED RBOT=%.1f RTOP=%.1f H1=%.1f"%(RBOT,RTOP,H1))
