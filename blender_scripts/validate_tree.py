"""Reopen the editable asset and its GLB independently; fail on invalid output.

blender --background --python-exit-code 1 --python blender_scripts/validate_tree.py -- happy
"""
import json
import hashlib
import math
import struct
import sys
from pathlib import Path
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import OUTPUT


def triangle_count(objects):
    count = 0
    for obj in objects:
        if obj.type == 'MESH':
            obj.data.calc_loop_triangles()
            count += len(obj.data.loop_triangles)
    return count


def check(mood):
    name = mood.capitalize()
    path = OUTPUT / f'{mood}_tree'
    blend, glb = path.with_suffix('.blend'), path.with_suffix('.glb')
    assert blend.stat().st_size > 0 and glb.stat().st_size > 0
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    collection = bpy.data.collections[name]
    objects = list(collection.objects)
    meshes = [obj for obj in objects if obj.type == 'MESH']
    source_mesh_names = {obj.name for obj in meshes}
    source_counts = {obj.name: triangle_count([obj]) for obj in meshes}
    assert meshes and all(obj.type in {'MESH','ARMATURE'} for obj in objects)
    assert all(obj.name.startswith(name+'_') for obj in objects)
    assert len({obj.name for obj in objects}) == len(objects)
    assert all(obj.location.length < 1e-6 for obj in objects), 'Origins must be at ground zero'
    assert all(obj.rotation_euler.to_matrix().is_identity for obj in objects)
    assert all((obj.scale-Vector((1,1,1))).length < 1e-6 for obj in objects)
    assert all(obj.data.materials for obj in meshes)
    mats = {mat for obj in meshes for mat in obj.data.materials}
    assert all(mat.use_nodes and any(n.type == 'BSDF_PRINCIPLED' for n in mat.node_tree.nodes) for mat in mats)
    assert not any(n.type == 'TEX_IMAGE' for mat in mats for n in mat.node_tree.nodes)
    triangles = triangle_count(meshes)
    assert 3000 <= triangles <= 8000, f'Triangle budget exceeded: {triangles}'
    trunk = bpy.data.objects[name+'_Trunk']
    assert abs(min(v.co.z for v in trunk.data.vertices)) < 1e-6
    assert min(v.co.z for obj in meshes for v in obj.data.vertices) >= -1e-5
    assert all(v.co.y < 0 for obj in meshes if obj.name.startswith(name+'_Face_') for v in obj.data.vertices)
    # Every part must be a closed mesh without loose vertices or edges.
    import bmesh
    for obj in meshes:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        assert all(edge.is_manifold for edge in bm.edges), f'Non-manifold mesh: {obj.name}'
        assert all(vertex.link_faces for vertex in bm.verts), f'Loose vertex: {obj.name}'
        bm.free()
    rig = next(obj for obj in objects if obj.type == 'ARMATURE')
    assert rig.animation_data.action.name == name+'_Idle'
    depsgraph = bpy.context.evaluated_depsgraph_get()
    snapshots = []
    for frame in [1,25,97]:
        bpy.context.scene.frame_set(frame)
        snapshots.append([tuple(v.co) for obj in meshes for v in obj.evaluated_get(depsgraph).data.vertices])
    assert max(math.dist(a,b) for a,b in zip(snapshots[0],snapshots[-1])) < 1e-5, 'Loop seam'
    assert max(math.dist(a,b) for a,b in zip(snapshots[0],snapshots[1])) > .001, 'No visible animation'
    data = glb.read_bytes()
    magic,version,length = struct.unpack_from('<4sII',data)
    assert magic == b'glTF' and version == 2 and length == len(data)
    json_length,json_type = struct.unpack_from('<II',data,12)
    assert json_type == 0x4E4F534A
    document = json.loads(data[20:20+json_length])
    assert document.get('materials') and document.get('skins')
    animations = document.get('animations',[])
    assert len(animations) == 1 and animations[0]['name'] == name+'_Idle'
    assert not document.get('images'), 'Unexpected texture images'
    assert not any(node.get('name','').startswith('Preview_') for node in document['nodes'])
    assert all(node.get('name','').startswith(name+'_') or node.get('name','') in
               {'Root','Crown','Branch_L','Branch_R'} for node in document['nodes'])
    glb_triangles = sum(document['accessors'][p['indices']]['count']//3
                        for mesh in document['meshes'] for p in mesh['primitives'])
    assert glb_triangles == triangles
    # Re-import tests that Blender's actual glTF reader can load the delivered asset.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    # Blender's importer creates an Icosphere custom bone-display helper locally.
    # It is not present in the GLB; exclude only meshes actually referenced by bones.
    bone_shapes = {bone.custom_shape for obj in bpy.context.scene.objects if obj.type == 'ARMATURE'
                   for bone in obj.pose.bones if bone.custom_shape}
    imported = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and obj not in bone_shapes]
    assert len(imported) == len(meshes), (len(imported),len(meshes),
        source_mesh_names - {obj.name for obj in imported},
        {obj.name for obj in imported} - source_mesh_names)
    assert triangle_count(imported) == triangles, {
        'source': triangles, 'imported': triangle_count(imported),
        'changed_meshes': {obj.name:(source_counts.get(obj.name),triangle_count([obj])) for obj in imported
                           if source_counts.get(obj.name) != triangle_count([obj])}}
    assert bpy.data.actions and any(action.name == name+'_Idle' for action in bpy.data.actions)
    # Import converts glTF Y-up back to Blender Z-up; positions must round-trip.
    imported_trunk = next(obj for obj in imported if obj.name == name+'_Trunk')
    assert abs(min((imported_trunk.matrix_world @ v.co).z for v in imported_trunk.data.vertices)) < 1e-5
    imported_face = next(obj for obj in imported if obj.name == name+'_Face_Mouth')
    assert all((imported_face.matrix_world @ v.co).y < 0 for v in imported_face.data.vertices)
    report = {'mood':name,'status':'passed','blender_version':bpy.app.version_string,
              'triangles':triangles,'mesh_objects':len(meshes),'materials':len(mats),
              'blend_bytes':blend.stat().st_size,'glb_bytes':glb.stat().st_size,
              'blend_sha256':hashlib.sha256(blend.read_bytes()).hexdigest(),
              'glb_sha256':hashlib.sha256(data).hexdigest(),
              'animation':name+'_Idle','loop_seconds':4,'bones':4,
              'blender_front':'-Y','glb_front':'+Z','trunk_min_z':0,
              'checks':['blend_reopened','glb_reimported','mesh_triangle_budget',
                        'names','ground_origins','identity_object_transforms',
                        'principled_materials','no_textures','closed_mesh_parts',
                        'trunk_grounded','front_direction','animation_moves',
                        'loop_endpoints_match','single_named_glb_clip','collection_only_export'],
              'visual_review':'Render inspection required; intentional part junctions overlap slightly to avoid gaps.'}
    report_path = OUTPUT / f'{mood}_validation.json'
    report_path.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['happy']
    for mood in args:
        try:
            check(mood.lower())
        except Exception as error:
            OUTPUT.mkdir(parents=True, exist_ok=True)
            (OUTPUT / f'{mood.lower()}_validation.json').write_text(
                json.dumps({'mood':mood,'status':'failed','error':str(error)},indent=2)+'\n',encoding='utf-8')
            raise
