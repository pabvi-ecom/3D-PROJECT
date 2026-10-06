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

# ===== MARMOL BEIGE CALIDO con vetas (procedural) =====
def marble_mat():
    m=bpy.data.materials.new("marble"); m.use_nodes=True; nt=m.node_tree
    for n in list(nt.nodes):
        if n.type!='OUTPUT_MATERIAL': nt.nodes.remove(n)
    out=nt.nodes.get('Material Output') or nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf=nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs[0], out.inputs['Surface'])
    tc=nt.nodes.new('ShaderNodeTexCoord')
    mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(0.09,0.09,0.09)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    # warp con ruido -> vetas abstractas tipo marmol (no repeticion/flor)
    n1=nt.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value=2.0
    n1.inputs['Detail'].default_value=8; n1.inputs['Roughness'].default_value=0.6
    nt.links.new(mp.outputs['Vector'], n1.inputs['Vector'])
    sc=nt.nodes.new('ShaderNodeVectorMath'); sc.operation='SCALE'; sc.inputs['Scale'].default_value=1.4
    nt.links.new(n1.outputs['Color'], sc.inputs[0])
    add=nt.nodes.new('ShaderNodeVectorMath'); add.operation='ADD'
    nt.links.new(mp.outputs['Vector'], add.inputs[0]); nt.links.new(sc.outputs[0], add.inputs[1])
    wv=nt.nodes.new('ShaderNodeTexWave'); wv.wave_type='BANDS'
    wv.inputs['Scale'].default_value=1.6; wv.inputs['Distortion'].default_value=10
    wv.inputs['Detail'].default_value=4; wv.inputs['Detail Scale'].default_value=2
    nt.links.new(add.outputs[0], wv.inputs['Vector'])
    ramp=nt.nodes.new('ShaderNodeValToRGB'); e=ramp.color_ramp.elements
    e[0].position=0.15; e[0].color=(0.90,0.80,0.66,1)   # crema calida
    e[1].position=0.90; e[1].color=(0.74,0.58,0.42,1)   # tan
    v=ramp.color_ramp.elements.new(0.52); v.color=(0.60,0.45,0.31,1)  # veta oscura
    nt.links.new(wv.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value=0.2
    return m
mb=marble_mat()

# pedestal UNA sola altura (mas fino)
R=foot/2*1.10; H=5.0
bpy.ops.mesh.primitive_cylinder_add(radius=R, depth=H, location=(cx,cy,TOP-H/2), vertices=128)
base=bpy.context.active_object; base.data.materials.append(mb)
bpy.ops.object.modifier_add(type='BEVEL'); base.modifiers["Bevel"].width=0.6; base.modifiers["Bevel"].segments=3
bpy.ops.object.modifier_apply(modifier="Bevel")
ZRIM=TOP-H/2; YF=cy-R

FONT=bpy.data.fonts.load("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
# surco HONDO en el canto (letras bold gordas)
bpy.ops.object.text_add(location=(cx, YF, ZRIM))
txt=bpy.context.active_object; txt.data.body="PEPE"; txt.data.font=FONT
txt.data.align_x="CENTER"; txt.data.align_y="CENTER"; txt.data.size=H*0.74
txt.data.resolution_u=4; txt.data.extrude=1.8
txt.scale=(1.25,1.0,1.0)   # letras mas anchas
txt.rotation_euler=(math.radians(90),0,0)
bpy.context.view_layer.objects.active=txt; bpy.ops.object.convert(target='MESH')
bpy.context.view_layer.objects.active=base
mod=base.modifiers.new("cut",'BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=txt
bpy.ops.object.modifier_apply(modifier="cut")
bpy.data.objects.remove(txt, do_unlink=True)
# relleno beige OSCURO, incrustado (recessed ~0.5mm)
bpy.ops.object.text_add(location=(cx, YF+0.9, ZRIM))
ink=bpy.context.active_object; ink.data.body="PEPE"; ink.data.font=FONT
ink.data.align_x="CENTER"; ink.data.align_y="CENTER"; ink.data.size=H*0.74
ink.data.resolution_u=4; ink.data.extrude=0.6
ink.scale=(1.25,1.0,1.0)
ink.rotation_euler=(math.radians(90),0,0)
bpy.context.view_layer.objects.active=ink; bpy.ops.object.convert(target='MESH')
mi=bpy.data.materials.new("ink"); mi.use_nodes=True
pi=mi.node_tree.nodes["Principled BSDF"]
pi.inputs["Base Color"].default_value=(0.14,0.10,0.07,1); pi.inputs["Roughness"].default_value=0.45
ink.data.materials.append(mi)

# render
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=64
sc.render.resolution_x=760; sc.render.resolution_y=900
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(1,1,1,1); w.node_tree.nodes["Background"].inputs[1].default_value=1.3
bpy.ops.object.light_add(type='AREA'); L=bpy.context.active_object
L.data.energy=1700; L.data.size=10; L.location=(cx+42,cy-50,TOP+90); L.rotation_euler=(math.radians(50),0,math.radians(22))
# luz rasante baja frontal para marcar sombra del grabado
bpy.ops.object.light_add(type='AREA'); L2=bpy.context.active_object
L2.data.energy=500; L2.data.size=6; L2.location=(cx-35,cy-80,ZRIM+6); L2.rotation_euler=(math.radians(80),0,math.radians(-30))
ctr=mathutils.Vector((cx,cy,TOP*0.3))
cdat=bpy.data.cameras.new("c"); cam=bpy.data.objects.new("c",cdat); sc.collection.objects.link(cam); sc.camera=cam
tgt=bpy.data.objects.new("t",None); sc.collection.objects.link(tgt); tgt.location=ctr
con=cam.constraints.new('TRACK_TO'); con.target=tgt; con.track_axis='TRACK_NEGATIVE_Z'; con.up_axis='UP_Y'
cam.location=(cx+8, cy-150, TOP+18); sc.render.filepath=OUT+"/base_v4.png"; bpy.ops.render.render(write_still=True)
print("RENDERED marble veins, deep engrave")
