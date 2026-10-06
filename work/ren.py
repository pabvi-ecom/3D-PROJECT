import bpy, math, mathutils
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="model.glb")
ms=[o for o in bpy.data.objects if o.type=='MESH']
for o in bpy.data.objects: o.select_set(o.type=='MESH')
bpy.context.view_layer.objects.active=ms[0]
if len(ms)>1: bpy.ops.object.join()
obj=bpy.context.active_object
import bmesh
bm=bmesh.new(); bm.from_mesh(obj.data)
xs=[v.co.x for v in bm.verts]; ys=[v.co.y for v in bm.verts]; zs=[v.co.z for v in bm.verts]; bm.free()
ctr=mathutils.Vector(((min(xs)+max(xs))/2,(min(ys)+max(ys))/2,(min(zs)+max(zs))/2))
sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.samples=32
sc.render.resolution_x=600; sc.render.resolution_y=680
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(1,1,1,1)
w.node_tree.nodes["Background"].inputs[1].default_value=1.4
bpy.ops.object.light_add(type='AREA'); L=bpy.context.active_object; L.data.energy=800; L.data.size=5; L.location=(ctr.x+1,ctr.y-1.5,ctr.z+2); L.rotation_euler=(math.radians(50),0,math.radians(25))
cd=bpy.data.cameras.new("c"); cam=bpy.data.objects.new("c",cd); sc.collection.objects.link(cam); sc.camera=cam
tgt=bpy.data.objects.new("t",None); sc.collection.objects.link(tgt); tgt.location=ctr
con=cam.constraints.new('TRACK_TO'); con.target=tgt; con.track_axis='TRACK_NEGATIVE_Z'; con.up_axis='UP_Y'
R=max(max(xs)-min(xs),max(zs)-min(zs))*2.0
cam.location=(ctr.x+R*0.6, ctr.y-R, ctr.z+R*0.35); sc.render.filepath="/Users/saborit22/3D-PROJECT/work/lit.png"; bpy.ops.render.render(write_still=True)
print("RENDERED")
