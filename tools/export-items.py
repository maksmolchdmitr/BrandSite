"""blender -b scene.blend --python export-items.py -- /absolute/output/directory"""
import bpy,os,sys,json,math,collections
from mathutils import Vector,Matrix
out=os.path.abspath(sys.argv[sys.argv.index('--')+1]);os.makedirs(out,exist_ok=True)
s=bpy.context.scene;s.frame_set(1)
# Real dial assembly; its axis marker survives coordinate conversion to glTF.
dial=bpy.data.objects['Weather dial'];pivot=bpy.data.objects.new('WeatherDial',None);s.collection.objects.link(pivot);pivot.matrix_world=dial.matrix_world.copy();pivot['interaction']='weather-dial'
bpy.context.view_layer.update()
for o in list(s.objects):
 if o==pivot:continue
 if o.name.startswith(('Weather dial','Dial concentric ring','Knurl','Dial indicator')):
  mw=o.matrix_world.copy();o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted();o.matrix_world=mw
axis=bpy.data.objects.new('WeatherDialAxis',None);s.collection.objects.link(axis);axis.parent=pivot;axis.location=(0,0,.10)
# No app audio, camera, or lights are exported. Runtime supplies accessible controls.
for o in list(s.objects):
 if o.type in {'CAMERA','LIGHT'}:bpy.data.objects.remove(o,do_unlink=True)
# Curves (stems, handle) must be real geometry in a web model.
bpy.ops.object.select_all(action='DESELECT');curves=[o for o in s.objects if o.type=='CURVE']
if curves:
 for o in curves:o.select_set(True)
 bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
# Bake static modifiers only; retain the real animated leaf armatures.
dg=bpy.context.evaluated_depsgraph_get()
for o in list(s.objects):
 if o.type!='MESH' or any(m.type=='ARMATURE' for m in o.modifiers):continue
 if o.modifiers:
  me=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg);o.data=me
  for m in list(o.modifiers):o.modifiers.remove(m)
# A glTF-compatible transparent glass surface; no opaque fallback from custom nodes.
glass=bpy.data.materials.new('Web capsule glass');glass.use_nodes=True;glass.surface_render_method='BLENDED';p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.81,.91,.85,1);p.inputs['Alpha'].default_value=.10;p.inputs['Roughness'].default_value=.13;p.inputs['Metallic'].default_value=.12
for o in s.objects:
 if o.name=='Glass capsule':o.data.materials.clear();o.data.materials.append(glass);o['glassShell']=True
# Static batches keep draw calls low. The knob is batched separately so it can rotate.
batches=collections.defaultdict(list)
for o in s.objects:
 if o.type!='MESH' or o.animation_data or any(m.type=='ARMATURE' for m in o.modifiers) or o.get('glassShell'):continue
 space='dial' if o.parent==pivot else 'static';key=(space,tuple(m.name if m else '' for m in o.data.materials));batches[key].append(o)
for (space,names),objects in batches.items():
 if len(objects)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=('Dial' if space=='dial' else 'Static')+'_'+(names[0] if names else 'details')
# Bake porcelain crazing and copper colour to small UV textures. Other geometry keeps
# its material colours; no huge baked lighting maps are shipped to visitors.
for o in list(s.objects):
 if o.type!='MESH' or len(o.data.materials)!=1:continue
 m=o.data.materials[0]
 if not m or m.name not in {'Warm aged ivory enamel','Worn copper'}:continue
 if any(mod.type=='ARMATURE' for mod in o.modifiers):continue
 m=m.copy();m.name='Baked '+o.name;o.data.materials[0]=m;nt=m.node_tree;p=nt.nodes.get('Principled BSDF');output=next(n for n in nt.nodes if n.type=='OUTPUT_MATERIAL')
 size=1024 if o.parent!=pivot else 256;image=bpy.data.images.new('Colour '+o.name,width=size,height=size,alpha=False);tex=nt.nodes.new('ShaderNodeTexImage');tex.image=image;nt.nodes.active=tex
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
 emission=nt.nodes.new('ShaderNodeEmission')
 if p.inputs['Base Color'].is_linked:nt.links.new(p.inputs['Base Color'].links[0].from_socket,emission.inputs['Color'])
 else:emission.inputs['Color'].default_value=p.inputs['Base Color'].default_value
 nt.links.new(emission.outputs[0],output.inputs['Surface']);s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=1;s.render.bake.use_clear=True;s.render.bake.margin=6;bpy.ops.object.bake(type='EMIT')
 nt.links.new(p.outputs[0],output.inputs['Surface']);nt.nodes.remove(emission)
 for link in list(p.inputs['Base Color'].links):nt.links.remove(link)
 nt.links.new(tex.outputs['Color'],p.inputs['Base Color']);image.pack()
# Complete the 4-second loop explicitly, instead of a 3.95s exported clip.
for action in bpy.data.actions:
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     k=fc.keyframe_points.insert(81,fc.evaluate(1));k.interpolation='LINEAR'
s.frame_end=81;s.frame_set(1);bpy.context.view_layer.update()
args=dict(filepath=out+'/quiet-garden.glb',export_format='GLB',export_extras=True,export_animations=True,export_animation_mode='SCENE',export_anim_scene_split_object=False,export_frame_range=True,export_frame_step=1,export_force_sampling=True,export_apply=True,export_yup=True,export_cameras=False,export_lights=False,export_skins=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=16,export_draco_normal_quantization=12,export_draco_generic_quantization=16)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(**args)
# Metadata is useful for a browser smoke test and future reproducible exports.
json.dump({'source_frames':[1,80],'export_frames':[1,81],'duration_seconds':4,'dial_node':'WeatherDial','axis_node':'WeatherDialAxis','meshes':sum(o.type=='MESH' for o in s.objects),'armatures':sum(o.type=='ARMATURE' for o in s.objects),'bytes':os.path.getsize(out+'/quiet-garden.glb')},open(out+'/model-info.json','w'),indent=2)
print('WEB_MODEL_READY',os.path.getsize(out+'/quiet-garden.glb'),flush=True)
