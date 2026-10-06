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
rad=max(max(xs)-min(xs), max(ys)-min(ys))/2*1.15
# --- base cilindro ---
bpy.ops.mesh.primitive_cylinder_add(radius=rad, depth=9, location=(cx,cy,zmin-9/2+1))
base=bpy.context.active_object
mb=bpy.data.materials.new("marble"); mb.use_nodes=True
mb.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(0.86,0.80,0.70,1); base.data.materials.append(mb)
# bevel suave
bpy.ops.object.modifier_add(type='BEVEL'); base.modifiers["Bevel"].width=1.2; base.modifiers["Bevel"].segments=3
bpy.ops.object.modifier_apply(modifier="Bevel")
# --- nombre PEPE en el canto frontal (-Y) ---
bpy.ops.object.text_add(location=(cx, cy-rad-0.3, zmin-3.5))
txt=bpy.context.active_object; txt.data.body="PEPE"; txt.data.align_x="CENTER"; txt.data.size=7; txt.data.extrude=1.0
txt.rotation_euler=(math.radians(90),0,0)
bpy.context.view_layer.objects.active=txt; bpy.ops.object.convert(target='MESH')
mt=bpy.data.materials.new("name"); mt.use_nodes=True
mt.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(0.32,0.22,0.12,1); txt.data.materials.append(mt)
# --- render ---
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=40
sc.render.resolution_x=640; sc.render.resolution_y=760
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(1,1,1,1); w.node_tree.nodes["Background"].inputs[1].default_value=1.5
bpy.ops.object.light_add(type='AREA'); L=bpy.context.active_object; L.data.energy=1500; L.data.size=8; L.location=(cx+40,cy-60,zmin+90); L.rotation_euler=(math.radians(50),0,math.radians(22))
ctr=mathutils.Vector((cx,cy,zmin+25))
cdat=bpy.data.cameras.new("c"); cam=bpy.data.objects.new("c",cdat); sc.collection.objects.link(cam); sc.camera=cam
tgt=bpy.data.objects.new("t",None); sc.collection.objects.link(tgt); tgt.location=ctr
con=cam.constraints.new('TRACK_TO'); con.target=tgt; con.track_axis='TRACK_NEGATIVE_Z'; con.up_axis='UP_Y'
cam.location=(cx+40, cy-150, zmin+55); sc.render.filepath=OUT+"/assembled.png"; bpy.ops.render.render(write_still=True)
print("RENDERED")
