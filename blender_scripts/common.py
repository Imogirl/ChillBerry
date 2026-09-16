"""ChillBerry mesh-only asset helpers. Run with Blender 4.5 LTS Python."""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets' / 'models' / 'mood-trees'


def reset(mood):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1
    scene.render.fps = 24
    scene.frame_start, scene.frame_end = 1, 97
    collection = bpy.data.collections.new(mood)
    scene.collection.children.link(collection)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    return collection


def material(name, hex_color, roughness=.72):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    rgb = [int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    # Palette values are sRGB; shader colours are scene-linear.
    rgb = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, 1)
    shader.inputs['Roughness'].default_value = roughness
    return mat


class Builder:
    def __init__(self, mood):
        self.mood = mood
        self.collection = reset(mood)
        self.parts = []

    def mesh(self, name, vertices, faces, mat, bone='Root', smooth=True):
        mesh = bpy.data.meshes.new(f'{self.mood}_{name}_Mesh')
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        import bmesh
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new(f'{self.mood}_{name}', mesh)
        self.collection.objects.link(obj)
        mesh.materials.append(mat)
        for polygon in mesh.polygons:
            polygon.use_smooth = smooth
        obj['part'] = name
        obj['idle_bone'] = bone
        self.parts.append(obj)
        return obj

    def ellipsoid(self, name, center, radii, mat, bone='Crown', segments=12, rings=7):
        vertices = [(center[0], center[1], center[2] + radii[2])]
        for j in range(1, rings):
            phi = math.pi * j / rings
            for i in range(segments):
                theta = 2 * math.pi * i / segments
                vertices.append((center[0] + radii[0] * math.sin(phi) * math.cos(theta),
                                 center[1] + radii[1] * math.sin(phi) * math.sin(theta),
                                 center[2] + radii[2] * math.cos(phi)))
        bottom = len(vertices)
        vertices.append((center[0], center[1], center[2] - radii[2]))
        faces = [(0, 1+i, 1+(i+1) % segments) for i in range(segments)]
        for j in range(rings-2):
            a, b = 1+j*segments, 1+(j+1)*segments
            faces.extend((a+i, b+i, b+(i+1) % segments, a+(i+1) % segments) for i in range(segments))
        faces.extend((bottom, bottom-1-i, bottom-1-(i+1) % segments) for i in range(segments))
        return self.mesh(name, vertices, faces, mat, bone)

    def tube(self, name, points, radii, mat, bone='Root', sides=8):
        vertices = []
        for j, point in enumerate(points):
            tangent = Vector(points[min(j+1, len(points)-1)]) - Vector(points[max(0, j-1)])
            tangent.normalize()
            reference = Vector((0, 1, 0)) if abs(tangent.y) < .95 else Vector((1, 0, 0))
            u = tangent.cross(reference).normalized()
            v = tangent.cross(u).normalized()
            for i in range(sides):
                theta = 2 * math.pi * i / sides
                vertices.append(Vector(point) + radii[j]*(math.cos(theta)*u + math.sin(theta)*v))
        faces = [tuple(reversed(range(sides)))]
        for j in range(len(points)-1):
            a, b = j*sides, (j+1)*sides
            faces.extend((a+i, a+(i+1) % sides, b+(i+1) % sides, b+i) for i in range(sides))
        faces.append(tuple(range((len(points)-1)*sides, len(points)*sides)))
        return self.mesh(name, vertices, faces, mat, bone)

    def arc(self, name, center, width, height, mat, bone='Crown', radius=.018, samples=12):
        points = [(center[0] + width*(2*i/samples-1), center[1],
                   center[2] + height*math.sin(math.pi*i/samples)) for i in range(samples+1)]
        return self.tube(name, points, [radius]*(samples+1), mat, bone, sides=6)

    def leaf(self, name, start, end, width, mat, bone='Crown'):
        start, end = Vector(start), Vector(end)
        delta = end-start
        across = delta.cross(Vector((0, -1, 0))).normalized()*width
        middle = start+delta*.48
        vertices = [start, middle+across, end, middle-across,
                    middle+Vector((0, -width*.36, 0)), middle+Vector((0, width*.36, 0))]
        faces = [(0,1,4), (1,2,4), (2,3,4), (3,0,4),
                 (1,0,5), (2,1,5), (3,2,5), (0,3,5)]
        return self.mesh(name, vertices, faces, mat, bone, smooth=False)

    def flower(self, name, center, mat, core, bone='Crown', size=.13):
        for i in range(5):
            theta = 2*math.pi*i/5
            c = (center[0]+size*.78*math.sin(theta), center[1], center[2]+size*.78*math.cos(theta))
            self.ellipsoid(f'{name}_Petal_{i+1}', c, (size*.57, size*.24, size*.57), mat, bone, 8, 5)
        self.ellipsoid(f'{name}_Center', (center[0],center[1]-.035,center[2]),
                       (size*.46, size*.30, size*.46), core, bone, 10, 5)

    def rig(self, movement):
        armature = bpy.data.armatures.new(f'{self.mood}_Rig_Data')
        rig = bpy.data.objects.new(f'{self.mood}_Rig', armature)
        self.collection.objects.link(rig)
        bpy.context.view_layer.objects.active = rig
        rig.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        specs = {'Root': ((0,0,0),(0,0,.8),None),
                 'Crown': ((0,0,1.45),(0,0,2.1),'Root'),
                 'Branch_L': ((-.2,0,1.05),(-.7,0,1.6),'Root'),
                 'Branch_R': ((.2,0,1.05),(.7,0,1.6),'Root')}
        for name,(head,tail,parent) in specs.items():
            bone = armature.edit_bones.new(name)
            bone.head, bone.tail = head, tail
            if parent:
                bone.parent = armature.edit_bones[parent]
        bpy.ops.object.mode_set(mode='OBJECT')
        rig.show_in_front = True
        for obj in self.parts:
            group = obj.vertex_groups.new(name=obj['idle_bone'])
            group.add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
            modifier = obj.modifiers.new('Gentle_Idle', 'ARMATURE')
            modifier.object = rig
            obj.parent = rig
        for name, amplitude in movement.items():
            pose = rig.pose.bones[name]
            pose.rotation_mode = 'XYZ'
            for frame in range(1,98,8):
                phase = (frame-1)/96*2*math.pi
                pose.rotation_euler = (amplitude*.3*math.sin(phase), amplitude*math.sin(phase), 0)
                pose.keyframe_insert('rotation_euler', frame=frame, group=name)
        action = rig.animation_data.action
        action.name = f'{self.mood}_Idle'
        for curve in action.fcurves:
            for key in curve.keyframe_points:
                key.interpolation = 'BEZIER'
                key.handle_left_type = key.handle_right_type = 'AUTO_CLAMPED'
        bpy.context.scene.frame_set(1)
        rig['front_axis'] = '-Y'
        rig['ground_origin'] = True
        return rig


def export(builder):
    scene = bpy.context.scene
    scene.frame_set(1)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in builder.collection.objects:
        obj.select_set(True)
    path = OUTPUT / f'{builder.mood.lower()}_tree'
    bpy.ops.export_scene.gltf(filepath=str(path.with_suffix('.glb')), export_format='GLB',
                             use_selection=True, export_yup=True, export_animations=True,
                             export_animation_mode='ACTIONS', export_force_sampling=True,
                             export_frame_range=True, export_skins=True, export_morph=False,
                             export_cameras=False, export_lights=False)
    return path


def studio_and_save(builder, path, render=True):
    scene = bpy.context.scene
    studio = bpy.data.collections.new('Preview_Studio_Not_Exported')
    scene.collection.children.link(studio)

    def move_to_studio(obj):
        for collection in list(obj.users_collection):
            collection.objects.unlink(obj)
        studio.objects.link(obj)

    bpy.ops.mesh.primitive_plane_add(size=200)
    floor = bpy.context.object
    floor.name = 'Preview_Ground'
    move_to_studio(floor)
    floor.data.materials.append(material('Studio_Cream', 'E8EFDB'))
    bpy.ops.object.camera_add(location=(.35,-7.8,3.25))
    camera = bpy.context.object
    camera.name = 'Preview_Camera'
    move_to_studio(camera)
    camera.rotation_euler = (Vector((0,0,1.55))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 3.85
    scene.camera = camera
    for name, location, power, size, color in [
        ('Key',(-3,-4,6),500,4,(1,.88,.72)),
        ('Fill',(3,-2,4),260,3,(.78,.9,1)),
        ('Rim',(1,3,5),650,3,(1,.94,.70))]:
        bpy.ops.object.light_add(type='AREA', location=location)
        light = bpy.context.object
        light.name = f'Preview_{name}'
        move_to_studio(light)
        light.data.energy, light.data.shape, light.data.size = power,'DISK',size
        light.data.color = color
        light.rotation_euler = (Vector((0,0,1.4))-light.location).to_track_quat('-Z','Y').to_euler()
    world = bpy.data.worlds.new('Preview_World')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.35,.42,.32,1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .45
    scene.world = world
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 900, 1000
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'AgX'
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(path.parent / f'{builder.mood.lower()}_preview.png')
    if getattr(builder, 'reference_studio', False):
        camera.location = (0,-8,2.5)
        camera.rotation_euler = (Vector((0,0,1.71))-camera.location).to_track_quat('-Z','Y').to_euler()
        camera.data.ortho_scale = 3.85
        scene.render.resolution_x, scene.render.resolution_y = 1000, 1200
        scene.cycles.samples = 40
        scene.render.film_transparent = True
        scene.render.image_settings.color_mode = 'RGBA'
        floor.hide_render = True
        world.node_tree.nodes['Background'].inputs[0].default_value = (.7,.7,.7,1)
        world.node_tree.nodes['Background'].inputs[1].default_value = .25
        scene.view_settings.view_transform = 'Standard'
        scene.view_settings.look = 'None'
        scene.view_settings.exposure = -.35
        bpy.data.objects['Preview_Key'].data.energy = 420
        bpy.data.objects['Preview_Fill'].data.energy = 180
        bpy.data.objects['Preview_Rim'].data.energy = 600
        bpy.ops.object.light_add(type='POINT', location=(0,-.31,.32))
        light = bpy.context.object
        light.name = 'Preview_Hollow_Glow'
        move_to_studio(light)
        light.data.energy = 1.4
        light.data.color = (1,.33,.02)
        light.data.shadow_soft_size = .055
    bpy.ops.object.select_all(action='DESELECT')
    for obj in builder.parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = builder.parts[0]
    scene['asset_collection'] = builder.mood
    scene['asset_front'] = '-Y in Blender; +Z after glTF Y-up conversion'
    bpy.ops.wm.save_as_mainfile(filepath=str(path.with_suffix('.blend')))
    if render:
        bpy.ops.render.render(write_still=True)
