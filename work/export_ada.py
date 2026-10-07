import bpy, bmesh, math, mathutils
OUT="/Users/saborit22/3D-PROJECT/work"
bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------- perro ----------
bpy.ops.import_scene.gltf(filepath=OUT+"/ada.glb")
ms=[o for o in bpy.data.objects if o.type=='MESH']
for o in bpy.data.objects: o.select_set(o.type=='MESH')
bpy.context.view_layer.objects.active=ms[0]
if len(ms)>1: bpy.ops.object.join()
dog=bpy.context.active_object
bm=bmesh.new(); bm.from_mesh(dog.data)
zspan=max(v.co.z for v in bm.verts)-min(v.co.z for v in bm.verts)
f=50.0/zspan
for v in bm.verts:
    v.co*=f; v.co.x=-v.co.x; v.co.y=-v.co.y   # escala + giro 180 Z
bm.to_mesh(dog.data); bm.free()
bm=bmesh.new(); bm.from_mesh(dog.data)
xs=[v.co.x for v in bm.verts]; ys=[v.co.y for v in bm.verts]; zs=[v.co.z for v in bm.verts]; bm.free()
cx=(min(xs)+max(xs))/2; cy=(min(ys)+max(ys))/2; TOP=min(zs)
foot=max(max(xs)-min(xs), max(ys)-min(ys))

# ---------- material marmol (procedural, se horneará) ----------
mb=bpy.data.materials.new("marble"); mb.use_nodes=True; nt=mb.node_tree
for n in list(nt.nodes):
    if n.type!='OUTPUT_MATERIAL': nt.nodes.remove(n)
out=nt.nodes.get('Material Output') or nt.nodes.new('ShaderNodeOutputMaterial')
bsdf=nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(bsdf.outputs[0], out.inputs['Surface'])
tc=nt.nodes.new('ShaderNodeTexCoord'); mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(0.09,0.09,0.09)
nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
n1=nt.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value=2.0; n1.inputs['Detail'].default_value=8; n1.inputs['Roughness'].default_value=0.6
nt.links.new(mp.outputs['Vector'], n1.inputs['Vector'])
scn=nt.nodes.new('ShaderNodeVectorMath'); scn.operation='SCALE'; scn.inputs['Scale'].default_value=1.4
nt.links.new(n1.outputs['Color'], scn.inputs[0])
add=nt.nodes.new('ShaderNodeVectorMath'); add.operation='ADD'
nt.links.new(mp.outputs['Vector'], add.inputs[0]); nt.links.new(scn.outputs[0], add.inputs[1])
wv=nt.nodes.new('ShaderNodeTexWave'); wv.wave_type='BANDS'; wv.inputs['Scale'].default_value=1.6; wv.inputs['Distortion'].default_value=10; wv.inputs['Detail'].default_value=4; wv.inputs['Detail Scale'].default_value=2
nt.links.new(add.outputs[0], wv.inputs['Vector'])
ramp=nt.nodes.new('ShaderNodeValToRGB'); e=ramp.color_ramp.elements
e[0].position=0.15; e[0].color=(0.90,0.80,0.66,1); e[1].position=0.90; e[1].color=(0.74,0.58,0.42,1)
vv=ramp.color_ramp.elements.new(0.52); vv.color=(0.60,0.45,0.31,1)
nt.links.new(wv.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value=0.2

# ---------- base 1 altura + nombre grabado (ADA) ----------
R=foot/2*1.10; H=5.0
bpy.ops.mesh.primitive_cylinder_add(radius=R, depth=H, location=(cx,cy,TOP-H/2), vertices=128)
base=bpy.context.active_object; base.data.materials.append(mb)
bpy.ops.object.modifier_add(type='BEVEL'); base.modifiers["Bevel"].width=0.6; base.modifiers["Bevel"].segments=3
bpy.ops.object.modifier_apply(modifier="Bevel")
ZRIM=TOP-H/2; YF=cy-R
FONT=bpy.data.fonts.load("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
bpy.ops.object.text_add(location=(cx, YF, ZRIM))
txt=bpy.context.active_object; txt.data.body="PEPE"; txt.data.font=FONT
txt.data.align_x="CENTER"; txt.data.align_y="CENTER"; txt.data.size=H*0.74
txt.data.resolution_u=4; txt.data.extrude=1.8; txt.scale=(1.25,1.0,1.0); txt.rotation_euler=(math.radians(90),0,0)
bpy.context.view_layer.objects.active=txt; bpy.ops.object.convert(target='MESH')
bpy.context.view_layer.objects.active=base
mod=base.modifiers.new("cut",'BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=txt
bpy.ops.object.modifier_apply(modifier="cut")
bpy.data.objects.remove(txt, do_unlink=True)
# relleno oscuro ADA
bpy.ops.object.text_add(location=(cx, YF+0.9, ZRIM))
ink=bpy.context.active_object; ink.data.body="PEPE"; ink.data.font=FONT
ink.data.align_x="CENTER"; ink.data.align_y="CENTER"; ink.data.size=H*0.74
ink.data.resolution_u=4; ink.data.extrude=0.6; ink.scale=(1.25,1.0,1.0); ink.rotation_euler=(math.radians(90),0,0)
bpy.context.view_layer.objects.active=ink; bpy.ops.object.convert(target='MESH')
mi=bpy.data.materials.new("ink"); mi.use_nodes=True
mi.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(0.14,0.10,0.07,1)
ink.data.materials.append(mi)

# ---------- unir base+ink, UV, BAKE a imagen ----------
for o in bpy.data.objects: o.select_set(False)
base.select_set(True); ink.select_set(True); bpy.context.view_layer.objects.active=base
bpy.ops.object.join()  # base ahora tiene 2 materiales (marble, ink)
baseobj=bpy.context.active_object
bpy.context.view_layer.objects.active=baseobj; baseobj.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')
img=bpy.data.images.new("base_baked", 2048, 2048)
for mat in baseobj.data.materials:
    if mat is None: continue
    if not mat.use_nodes: mat.use_nodes=True
    m2=mat.node_tree; node=m2.nodes.new('ShaderNodeTexImage'); node.image=img
    m2.nodes.active=node
sc=bpy.context.scene; sc.render.engine='CYCLES'
try: sc.cycles.device='CPU'
except Exception: pass
sc.cycles.bake_type='DIFFUSE'
sc.render.bake.use_pass_direct=False; sc.render.bake.use_pass_indirect=False; sc.render.bake.use_pass_color=True
sc.render.bake.margin=8
bpy.ops.object.bake(type='DIFFUSE')
img.filepath_raw=OUT+"/base_baked.png"; img.file_format='PNG'; img.save()
# material unico con la imagen horneada
mbake=bpy.data.materials.new("base_tex"); mbake.use_nodes=True
bt=mbake.node_tree; bn=bt.nodes.new('ShaderNodeTexImage'); bn.image=img
bt.links.new(bn.outputs['Color'], bt.nodes["Principled BSDF"].inputs["Base Color"])
baseobj.data.materials.clear(); baseobj.data.materials.append(mbake)

# ---------- unir perro+base, escalar a 70mm total ----------
for o in bpy.data.objects: o.select_set(False)
dog.select_set(True); baseobj.select_set(True); bpy.context.view_layer.objects.active=dog
bpy.ops.object.join()
whole=bpy.context.active_object
bm=bmesh.new(); bm.from_mesh(whole.data)
zs=[v.co.z for v in bm.verts]; total=max(zs)-min(zs)
s=70.0/total
for v in bm.verts: v.co*=s
bm.to_mesh(whole.data); bm.free()
print("TOTAL_BEFORE=%.2f  SCALED_TO=70"%total)

import os
WALL=1.6
# ---------- VACIAR limpio: outer intacto (color) - inner remesh encogido ----------
bm=bmesh.new(); bm.from_mesh(whole.data)
zs=[v.co.z for v in bm.verts]; zmin=min(zs); zmax=max(zs)
xs=[v.co.x for v in bm.verts]; ys=[v.co.y for v in bm.verts]
bcx=(min(xs)+max(xs))/2; bcy=(min(ys)+max(ys))/2; bm.free()
# inner = copia remeshada (manifold) encogida WALL hacia dentro
inner=whole.copy(); inner.data=whole.data.copy(); bpy.context.collection.objects.link(inner)
inner.data.materials.clear()
bpy.context.view_layer.objects.active=inner
rm=inner.modifiers.new("rm",'REMESH'); rm.mode='VOXEL'; rm.voxel_size=1.1; rm.adaptivity=0
bpy.ops.object.modifier_apply(modifier="rm")
bm=bmesh.new(); bm.from_mesh(inner.data); bm.normal_update()
for v in bm.verts: v.co -= v.normal*WALL   # encoge hacia dentro
bm.to_mesh(inner.data); bm.free()
# resta inner del outer -> cascara; partes finas (sin inner dentro) quedan solidas
bpy.context.view_layer.objects.active=whole
mdiff=whole.modifiers.new("hollow",'BOOLEAN'); mdiff.operation='DIFFERENCE'; mdiff.object=inner
mdiff.solver='EXACT'
bpy.ops.object.modifier_apply(modifier="hollow")
bpy.data.objects.remove(inner, do_unlink=True)
# drenaje: taladro vertical central desde el fondo hasta medio cuerpo
chan_h=(zmax-zmin)*0.5
bpy.ops.mesh.primitive_cylinder_add(radius=3.0, depth=chan_h+6,
    location=(bcx,bcy, zmin-3 + (chan_h+6)/2), vertices=48)
drill=bpy.context.active_object
bpy.context.view_layer.objects.active=whole
mdr=whole.modifiers.new("drain",'BOOLEAN'); mdr.operation='DIFFERENCE'; mdr.object=drill; mdr.solver='EXACT'
bpy.ops.object.modifier_apply(modifier="drain")
bpy.data.objects.remove(drill, do_unlink=True)
print("HOLLOWED wall=%.1f (diff remesh) + drain"%WALL)

# ---------- VERIFICACION: corte transversal (copia, no toca el export) ----------
cut=whole.copy(); cut.data=whole.data.copy(); bpy.context.collection.objects.link(cut)
bpy.ops.mesh.primitive_cube_add(size=400, location=(bcx, bcy-200, (zmin+zmax)/2))
box=bpy.context.active_object  # quita la mitad hacia -Y (lado camara)
bpy.context.view_layer.objects.active=cut
mcut=cut.modifiers.new("sec",'BOOLEAN'); mcut.operation='DIFFERENCE'; mcut.object=box
bpy.ops.object.modifier_apply(modifier="sec")
bpy.data.objects.remove(box, do_unlink=True)
whole.hide_render=True
sc.render.engine='CYCLES'; sc.cycles.samples=40
sc.render.resolution_x=700; sc.render.resolution_y=800
w0=bpy.data.worlds.new("ws"); sc.world=w0; w0.use_nodes=True; w0.node_tree.nodes["Background"].inputs[1].default_value=1.2
bpy.ops.object.light_add(type='SUN'); Ls=bpy.context.active_object; Ls.data.energy=3; Ls.rotation_euler=(math.radians(55),0,math.radians(20))
cds=bpy.data.cameras.new('cs'); cds.type='ORTHO'; cds.ortho_scale=(zmax-zmin)*1.2
cams=bpy.data.objects.new('cs',cds); sc.collection.objects.link(cams); sc.camera=cams
cams.location=(bcx, bcy-300, (zmin+zmax)/2); cams.rotation_euler=(math.radians(90),0,0)
sc.render.filepath=OUT+"/jlc_section.png"; bpy.ops.render.render(write_still=True)
whole.hide_render=False
bpy.data.objects.remove(cut, do_unlink=True)
print("SECTION rendered")

# ---------- export OBJ+MTL+PNG a zip (archivos en la raiz) ----------
JLC=OUT+"/jlc"; os.makedirs(JLC, exist_ok=True)
# Guardar a disco las imagenes de Base Color empaquetadas (si no, OBJ no
# escribe map_Kd y el perro saldria gris).
for mat in whole.data.materials:
    if not mat or not mat.use_nodes: continue
    for n in mat.node_tree.nodes:
        if n.type=='BSDF_PRINCIPLED' and n.inputs['Base Color'].is_linked:
            src=n.inputs['Base Color'].links[0].from_node
            if src.type=='TEX_IMAGE' and src.image and (src.image.packed_file or not src.image.filepath_raw):
                p=JLC+"/"+mat.name.replace('/','_')[:36]+"_color.png"
                src.image.filepath_raw=p; src.image.file_format='PNG'; src.image.save()
for o in bpy.data.objects: o.select_set(False)
whole.select_set(True); bpy.context.view_layer.objects.active=whole
bpy.ops.wm.obj_export(filepath=JLC+"/PEPE.obj", export_selected_objects=True,
                      export_materials=True, path_mode='COPY', forward_axis='NEGATIVE_Z', up_axis='Y')
print("EXPORTED obj")

# ---------- render final color ----------
sc.render.engine='CYCLES'; sc.cycles.samples=60
sc.render.resolution_x=720; sc.render.resolution_y=860
w=bpy.data.worlds.new("w2"); sc.world=w; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(1,1,1,1); w.node_tree.nodes["Background"].inputs[1].default_value=1.2
bpy.ops.object.light_add(type='SUN'); L=bpy.context.active_object; L.data.energy=3.2; L.rotation_euler=(math.radians(52),0,math.radians(30))
bm=bmesh.new(); bm.from_mesh(whole.data)
xs=[v.co.x for v in bm.verts]; ys=[v.co.y for v in bm.verts]; zs=[v.co.z for v in bm.verts]; bm.free()
ccx=(min(xs)+max(xs))/2; ccy=(min(ys)+max(ys))/2; ccz=(min(zs)+max(zs))/2; HH=max(xs)-min(xs)
cd=bpy.data.cameras.new('c'); cd.type='ORTHO'; cd.ortho_scale=(max(zs)-min(zs))*1.2
cam=bpy.data.objects.new('c',cd); sc.collection.objects.link(cam); sc.camera=cam
cam.location=(ccx, ccy-200, ccz); cam.rotation_euler=(math.radians(90),0,0)
sc.render.filepath=OUT+"/ada_final.png"; bpy.ops.render.render(write_still=True)
print("DONE")
