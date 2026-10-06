import bpy, bmesh, math, mathutils
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="model.glb")
ms=[o for o in bpy.data.objects if o.type=='MESH']
for o in bpy.data.objects: o.select_set(o.type=='MESH')
bpy.context.view_layer.objects.active=ms[0]
if len(ms)>1: bpy.ops.object.join()
obj=bpy.context.active_object
bm=bmesh.new(); bm.from_mesh(obj.data)
xs=[v.co.x for v in bm.verts]; ys=[v.co.y for v in bm.verts]; zs=[v.co.z for v in bm.verts]
sp=lambda a:(round(min(a),3),round(max(a),3),round(max(a)-min(a),3))
print("X",sp(xs),"Y",sp(ys),"Z",sp(zs))
print("verts",len(bm.verts),"faces",len(bm.faces),"hasUV",bm.loops.layers.uv.active is not None)
print("boundary",sum(1 for e in bm.edges if len(e.link_faces)==1))
for im in bpy.data.images: print("img",im.name,im.size[:])
bm.free()
# render 3/4
sc=bpy.context.scene
try: sc.render.engine='BLENDER_EEVEE_NEXT'
except: pass
sc.render.resolution_x=500; sc.render.resolution_y=560
bpy.ops.object.light_add(type='SUN'); bpy.context.active_object.data.energy=4; bpy.context.active_object.rotation_euler=(math.radians(55),0,math.radians(30))
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True; w.node_tree.nodes["Background"].inputs[1].default_value=1.0
cd=bpy.data.cameras.new("c"); cam=bpy.data.objects.new("c",cd); sc.collection.objects.link(cam); sc.camera=cam
ctr=mathutils.Vector(((min(xs)+max(xs))/2,(min(ys)+max(ys))/2,(min(zs)+max(zs))/2))
tgt=bpy.data.objects.new("t",None); sc.collection.objects.link(tgt); tgt.location=ctr
con=cam.constraints.new('TRACK_TO'); con.target=tgt; con.track_axis='TRACK_NEGATIVE_Z'; con.up_axis='UP_Y'
R=max(max(xs)-min(xs),max(zs)-min(zs))*1.6
cam.location=(ctr.x+R, ctr.y-R, ctr.z+R*0.5); sc.render.filepath="//prev.png"; bpy.ops.render.render(write_still=True)
print("DONE")
