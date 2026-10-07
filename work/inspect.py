import bpy, math
OUT="/Users/saborit22/3D-PROJECT/work"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=OUT+"/ada.glb")
ms=[o for o in bpy.data.objects if o.type=='MESH']
v=[o.matrix_world@vv.co for o in ms for vv in o.data.vertices]
xs=[p.x for p in v]; ys=[p.y for p in v]; zs=[p.z for p in v]
cx=(min(xs)+max(xs))/2; cy=(min(ys)+max(ys))/2; cz=(min(zs)+max(zs))/2
H=max(max(xs)-min(xs),max(ys)-min(ys),max(zs)-min(zs))
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=48
sc.render.resolution_x=600; sc.render.resolution_y=600
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(1,1,1,1); w.node_tree.nodes["Background"].inputs[1].default_value=1.1
bpy.ops.object.light_add(type='SUN'); S=bpy.context.active_object; S.data.energy=3.5; S.rotation_euler=(math.radians(50),0,math.radians(35))
cd=bpy.data.cameras.new('c'); cd.type='ORTHO'; cd.ortho_scale=H*1.25
cam=bpy.data.objects.new('c',cd); sc.collection.objects.link(cam); sc.camera=cam
D=H*3
VIEWS={
 "front":((cx,cy+D,cz),(math.radians(90),0,math.radians(180))),
 "left": ((cx-D,cy,cz),(math.radians(90),0,math.radians(-90))),
 "back": ((cx,cy-D,cz),(math.radians(90),0,0)),
 "right":((cx+D,cy,cz),(math.radians(90),0,math.radians(90))),
}
for name,(loc,rot) in VIEWS.items():
    cam.location=loc; cam.rotation_euler=rot
    sc.render.filepath=OUT+f"/ada_{name}.png"; bpy.ops.render.render(write_still=True)
print("OK")
