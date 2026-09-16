"""Golden Happy tree modeled from tree-happy.png; mesh geometry, no image planes."""
import math
import random
import sys
from pathlib import Path
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import Builder, material, export, studio_and_save


def build():
    b = Builder('Happy')
    rng = random.Random(28)
    bark = material('Bark_Chestnut', '955B37')
    ridge = material('Bark_Raised_Grain', 'AC744A')
    gold = [material('Leaf_Marigold', 'FFBC05'), material('Leaf_Sunshine', 'FFD122'),
            material('Leaf_Honey_Shadow', 'EDA000')]
    face = material('Face_Golden_Sun', 'FFD02C', .6)
    eye = material('Face_Dark_Chocolate', '281318', .27)
    mouth = material('Face_Mouth_Interior', '600C20')
    pink = material('Face_Peach_Blush', 'F58C83')
    tongue = material('Face_Rosy_Tongue', 'F65D79', .5)
    white = material('Flower_Ivory_Petals', 'FFF9E8', .48)
    fruit = material('Fruit_Golden_Berry', 'FFBC06', .24)
    glow = material('Hollow_Golden_Heart_Glow', 'FFE25A', .4)
    shader = glow.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value = (1,.38,.015,1)
    shader.inputs['Emission Strength'].default_value = 3
    vertices, faces = [], []
    rings = [(0,.48,0),(.12,.42,0),(.3,.35,-.012),(.5,.32,-.025),
             (.73,.29,-.01),(.95,.27,.012),(1.16,.29,.015),
             (1.4,.31,-.01),(1.64,.26,-.04),(1.93,.14,-.025)]
    sides = 16
    for z,radius,dx in rings:
        for i in range(sides):
            angle = math.tau*i/sides
            ripple = 1+.10*math.sin(7*angle+z*3)+.04*math.sin(3*angle-z*4)
            vertices.append((dx+radius*ripple*math.cos(angle),radius*ripple*math.sin(angle),z))
    faces.append(tuple(reversed(range(sides))))
    for j in range(len(rings)-1):
        for i in range(sides):
            a,c = j*sides+i,j*sides+(i+1)%sides
            faces.append((a,c,c+sides,a+sides))
    faces.append(tuple(range((len(rings)-1)*sides,len(rings)*sides)))
    trunk = b.mesh('Trunk',vertices,faces,bark)
    # Triangulate the twisted side quads before carving to avoid non-planar
    # Boolean polygons whose glTF tessellation could contain degenerate faces.
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(trunk.data)
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.to_mesh(trunk.data)
    bm.free()
    # A Boolean cuts an actual rounded cavity into the closed trunk mesh.
    cutter = b.ellipsoid('Temporary_Hollow_Cutter',(.004,-.307,.481),(.235,.41,.34),bark,'Root',17,9)
    bpy.context.view_layer.objects.active = trunk
    modifier = trunk.modifiers.new('Carved_Hollow','BOOLEAN')
    modifier.operation, modifier.solver, modifier.object = 'DIFFERENCE','EXACT',cutter
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    # The offset cutter also avoids coincident ring vertices.
    b.parts.remove(cutter)
    bpy.data.objects.remove(cutter,do_unlink=True)
    arch = [(-.265*math.cos(math.pi*i/12),-.285-.035*math.sin(math.pi*i/12),
             .22+.61*math.sin(math.pi*i/12)) for i in range(13)]
    b.tube('Hollow_Arch',arch,[.052]*13,ridge,sides=6)
    for i in range(7):
        if i == 5:
            continue  # Keep the entrance clear instead of hiding it behind a root.
        theta = math.tau*i/7+.18
        x,y = math.cos(theta),math.sin(theta)
        b.tube(f'Root_{i+1:02}',[(x*.22,y*.22,.29),(x*.39,y*.39,.18),
               (x*.57,y*.57,.115),(x*.76,y*.76,.062),(x*.9,y*.9,.04)],
               [.16,.135,.095,.045,.012],bark,'Root',7)
    for i in range(9):
        angle, points = math.tau*i/9, []
        for z,rad,dx in rings[1:]:
            a = angle+.08*math.sin(z*5+i)
            if math.sin(a)<-.35 and z<.85:
                continue
            ripple = 1+.10*math.sin(7*a+z*3)+.04*math.sin(3*a-z*4)
            points.append((dx+rad*ripple*math.cos(a),rad*ripple*math.sin(a),z))
        if len(points)>2:
            points = points[::2]
            b.tube(f'Bark_Ribbon_{i+1:02}',points,[.016]*len(points),ridge,'Root',4)
    for sign,side in [(-1,'L'),(1,'R')]:
        bone = f'Branch_{side}'
        paths = [([(sign*.16,.035,1.04),(sign*.39,.02,1.19),
                   (sign*.64,.015,1.34),(sign*.87,.03,1.57),(sign*1.01,.02,1.92)],
                  [.20,.16,.115,.075,.028]),
                 ([(sign*.12,.08,1.34),(sign*.34,.07,1.54),
                   (sign*.5,.05,1.74),(sign*.53,.08,2.12)],[.14,.10,.065,.022])]
        for j,(points,radii) in enumerate(paths):
            b.tube(f'Branch_{side}_{j+1}',points,radii,bark,bone,8)
        for j in range(2):
            x,z = sign*(.58+.20*j),1.32+.18*j
            b.tube(f'Branch_{side}_Twig_{j}',[(x,.015,z),(x+sign*.25,-.015,z+.10),
                   (x+sign*.34,0,z+.29)],[.055,.035,.009],bark,bone,6)
        for j in range(3):
            x,z = sign*(.5+j*.21),1.32+j*.17
            b.leaf(f'Branch_{side}_Golden_Leaf_{j}',(x,-.06,z),
                   (x+sign*.13,-.09,z+.13),.055,gold[1],bone)
    lobes = [(-.87,.035,1.95,.31,.34,.37),(.87,.035,1.95,.31,.34,.37),
             (-.96,.06,2.28,.29,.37,.39),(.96,.06,2.28,.29,.37,.39),
             (-.84,.08,2.64,.33,.38,.37),(.84,.08,2.64,.33,.38,.37),
             (-.61,.08,2.94,.34,.36,.34),(.61,.08,2.94,.34,.36,.34),
             (-.29,.10,3.14,.35,.34,.29),(.29,.10,3.14,.35,.34,.29),
             (0,.25,3.22,.32,.38,.25),(-.53,.02,1.85,.35,.33,.28),
             (.53,.02,1.85,.35,.33,.28),(0,.11,1.84,.38,.35,.29)]
    b.ellipsoid('Canopy_Core',(0,.22,2.56),(.95,.52,.76),gold[0],segments=12,rings=7)
    for i,(x,y,z,rx,ry,rz) in enumerate(lobes):
        b.ellipsoid(f'Canopy_Lobe_{i+1:02}',(x,y,z),(rx,ry,rz),gold[i%3],segments=12,rings=4)

    def soft_leaf(name, center, length, width, mat, lean=0):
        # Six-edge closed lens, twelve triangles, soft vertex normals.
        c = Vector(center)
        along = Vector((math.sin(lean),0,-math.cos(lean)))
        across = Vector((math.cos(lean),0,math.sin(lean)))
        contour = [(0,-.5),(.78,-.23),(1,.08),(0,.5),(-1,.08),(-.78,-.23)]
        verts = [c+across*(a*width)+along*(d*length) for a,d in contour]
        verts += [c+Vector((0,-width*.52,0)),c+Vector((0,width*.30,0))]
        polys = [(i,(i+1)%6,6) for i in range(6)]+[((i+1)%6,i,7) for i in range(6)]
        b.mesh(name,verts,polys,mat,'Crown')
    for i,(x,y,z,rx,ry,rz) in enumerate(lobes):
        for j in range(10):
            angle = j*2.39996+i*.37
            r = .83*math.sqrt((j+.5)/10)
            nx,nz = r*math.cos(angle),r*math.sin(angle)
            px,pz = x+rx*nx,z+rz*nz
            py = y-ry*math.sqrt(1-r*r)-.012
            if (px/.70)**2+((pz-2.37)/.58)**2 < 1.04:
                continue
            soft_leaf(f'Canopy_Leaf_Relief_{i:02}_{j:02}',(px,py,pz),
                      rng.uniform(.14,.22),rng.uniform(.045,.066),gold[(i+j)%3],rng.uniform(-.6,.6))
    def round_lens(name, center, radii, mat, segments=16):
        x,y,z = center
        rx,ry,rz = radii
        verts = [(x+rx*math.cos(math.tau*i/segments),y,z+rz*math.sin(math.tau*i/segments))
                 for i in range(segments)]
        verts.extend([(x,y-ry,z),(x,y+ry,z)])
        faces = [(i,(i+1)%segments,segments) for i in range(segments)]
        faces.extend([((i+1)%segments,i,segments+1) for i in range(segments)])
        return b.mesh(name,verts,faces,mat,'Crown')

    b.ellipsoid('Canopy_Face',(0,-.32,2.37),(.70,.36,.57),face,segments=24,rings=12)
    for side,sign in [('L',-1),('R',1)]:
        b.arc(f'Face_Eyes_{side}',(sign*.27,-.658,2.38),.115,.10,eye,radius=.026,samples=12)
        b.arc(f'Face_Eyebrow_{side}',(sign*.29,-.58,2.65),.072,.034,ridge,radius=.018,samples=8)
        round_lens(f'Face_Cheek_{side}',(sign*.40,-.623,2.23),(.103,.035,.075),pink)
    outline = [(-.15,2.29),(-.11,2.275),(-.055,2.26),(0,2.255),(.055,2.26),(.11,2.275),
               (.15,2.29),(.163,2.25),(.143,2.18),(.10,2.125),(.05,2.097),(0,2.09),
               (-.05,2.097),(-.10,2.125),(-.143,2.18),(-.163,2.25)]
    n = len(outline)
    verts = [(x,y,z) for y in [-.698,-.637] for x,z in outline]
    polys = [tuple(reversed(range(n))),tuple(range(n,2*n))]
    polys += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    b.mesh('Face_Mouth',verts,polys,mouth,'Crown',False)
    b.ellipsoid('Face_Tongue',(0,-.709,2.143),(.087,.02,.04),tongue,segments=12,rings=5)
    b.ellipsoid('Face_Nose',(0,-.686,2.325),(.026,.012,.019),face,segments=8,rings=4)

    def front_y(x,z):
        surfaces = []
        for cx,cy,cz,rx,ry,rz in lobes:
            q = ((x-cx)/rx)**2+((z-cz)/rz)**2
            if q<1:
                surfaces.append(cy-ry*math.sqrt(1-q))
        return min(surfaces,default=-.23)
    flower_positions = [(-.30,3.11,.14),(.31,3.29,.075),(.59,3.00,.12),
                        (-.83,2.84,.11),(-.96,2.18,.085),(.95,2.61,.095),(.86,1.96,.10)]
    for index,(x,z,size) in enumerate(flower_positions):
        y = front_y(x,z)-.034
        for j in range(5):
            angle = math.tau*j/5
            px,pz = x+math.sin(angle)*size*.75,z+math.cos(angle)*size*.75
            round_lens(f'Decoration_Daisy_{index+1}_Petal_{j+1}',(px,y,pz),
                       (size*.54,size*.28,size*.60),white,segments=12)
        b.ellipsoid(f'Decoration_Daisy_{index+1}_Center',(x,y-.03,z),
                    (size*.43,size*.32,size*.43),fruit,segments=8,rings=4)
    for i,(x,z) in enumerate([(-.54,2.97),(.83,2.91),(-.81,2.41),(1.02,2.27)]):
        y = front_y(x,z)-.095
        b.ellipsoid(f'Decoration_Fruit_{i+1}',(x,y,z),(.085,.082,.095),fruit,segments=10,rings=6)
        b.tube(f'Decoration_Fruit_{i+1}_Stem',[(x,y,z+.07),(x+.006,y+.01,z+.14)],
               [.01,.007],bark,'Crown',5)
        for sign in [-1,1]:
            b.leaf(f'Decoration_Fruit_{i+1}_Leaf_{sign}',(x,y,z+.105),
                   (x+sign*.09,y,z+.18),.032,gold[1])
    b.tube('Hollow_Sprout_Stem',[(0,-.25,.20),(0,-.22,.33),(0,-.20,.51)],
           [.012,.01,.007],gold[1],sides=5)
    for sign in [-1,1]:
        b.leaf(f'Hollow_Sprout_Leaf_{sign}',(0,-.22,.37),(sign*.09,-.22,.48),.038,gold[1],'Root')
    for i in range(7):
        theta = math.tau*i/7
        b.ellipsoid(f'Hollow_Nest_Stone_{i}',(.15*math.cos(theta),-.22+.08*math.sin(theta),.17),
                    (.073,.052,.038),gold[1],'Root',8,4)
    heart_outline = []
    for i in range(20):
        t = math.tau*i/20
        heart_outline.append((.0043*16*math.sin(t)**3,
                              .285+.0043*(13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t))))
    verts = [(x,y,z) for y in [-.305,-.27] for x,z in heart_outline]
    polys = [tuple(reversed(range(20))),tuple(range(20,40))]
    polys += [(i,(i+1)%20,(i+1)%20+20,i+20) for i in range(20)]
    b.mesh('Hollow_Glowing_Heart',verts,polys,glow)
    for sign in [-1,1]:
        for j in range(2):
            b.leaf(f'Root_Sprout_{sign}_{j}',(sign*.56,-.28,.055),
                   (sign*(.61+j*.09),-.28,.17+j*.03),.043,gold[1],'Root')
    b.rig({'Crown':.018,'Branch_L':.024,'Branch_R':-.020})
    b.reference_studio = True
    return b


if __name__ == '__main__':
    builder = build()
    path = export(builder)
    studio_and_save(builder,path,render='--no-render' not in sys.argv)
