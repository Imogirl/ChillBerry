# ChillBerry mood trees

Real, editable Blender meshes generated with Blender 4.5 LTS and its bundled
`bpy` API. No paid assets, add-ons, textures, or image planes are used.

## Current milestone

Happy is the first visual-review asset. The remaining seven mood-specific
generators and the full-collection master script follow approval of this asset,
as requested. The existing React Garden is preserved.

The requested `references/mood-trees/` directory was absent at inspection time.
Happy now follows the user's supplied `frontend/src/assets/tree-happy.png`:
golden foliage, a large smiling yellow face, white daisies, golden fruit,
branching roots, and a real carved hollow with an emissive heart and sprout.
The user explicitly retained the 3,000–8,000 triangle limit after reviewing the
detail tradeoff. This is a simplified 3D recreation, not an exact reconstruction
of the image's dense sculpted leaf and bark detail. Leaf relief and bark ridges
are mesh geometry. There are no texture images or procedural-only surface
details that disappear when exported to GLB.

## Generate and validate Happy

Run these commands from the project root in PowerShell:

```powershell
$env:BLENDER_USER_RESOURCES = Join-Path (Get-Location) '.tools\blender-user'
& '.\.tools\blender-4.5.9-windows-x64\blender.exe' --background --factory-startup --python-exit-code 1 --python '.\blender_scripts\generate_happy.py'
& '.\.tools\blender-4.5.9-windows-x64\blender.exe' --background --factory-startup --python-exit-code 1 --python '.\blender_scripts\validate_tree.py' -- happy
```

If using an installed Blender, substitute its full executable path. Generation
needs Blender, not a standalone Python interpreter. Add `-- --no-render` to the
generation command to skip the preview. Output is under
`assets/models/mood-trees/`: `happy_tree.blend`, `happy_tree.glb`,
`happy_preview.png`, and (after successful validation) `happy_validation.json`.
Regeneration replaces only the named generated outputs.

## Editing and animation

Open the `.blend` and expand the `Happy` collection. Each trunk, root, branch,
crown lobe, facial feature, petal, and decorative leaf is a separate named mesh.
All mesh object origins and the armature origin are at world ground zero;
vertices hold the model geometry. Object scale and rotation are identity.
The bottom of the trunk is at Z=0. Units are metres, with stylized trees around
three metres tall; this establishes consistent scale for the collection.

A four-bone rig provides rigid weights for each part. Edit meshes in Edit Mode;
use Pose Mode for animation. The `Happy_Idle` action loops from frames 1 to 97
at 24 fps (four seconds). Crown and facial pieces move together; branch leaves
move with their branches. Bone pivots provide natural sway while object origins
remain grounded. Slightly embedded component junctions prevent visible gaps;
these separate editable components are not intended as a single printable solid.

The preview studio contains a camera, floor, and lights in its own collection.
Happy's reference preview uses a transparent background and hides the floor.
The heart's Principled emission is included in the GLB. The additional small
warm light inside the hollow belongs to the preview studio; reproduce this
with a nearby point light in R3F if illumination of the cavity is desired.
Export selects only `Happy`, so studio objects never enter the GLB. Materials
use Principled BSDF. Faceted leaves retain their low-poly silhouette while round
parts use smooth shading. No destructive remeshing is used.

## React Three Fiber integration (future Garden change)

The current Garden renders PNGs and has no Three.js dependencies. Integration
requires `three`, `@react-three/fiber`, and `@react-three/drei`. Copy the approved
GLB into `frontend/public/models/mood-trees/` to serve it at
`/models/mood-trees/happy_tree.glb`; the root `assets/` folder is not a Vite public
directory. Keep the `.blend` source files outside the web public folder.

```jsx
import { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export function HappyTree(props) {
  const group = useRef();
  const { scene, animations } = useGLTF('/models/mood-trees/happy_tree.glb');
  // Each planted tree needs its own cloned skeleton.
  const instance = useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, group);
  useEffect(() => {
    const idle = actions.Happy_Idle;
    idle?.reset().play();
    return () => { idle?.stop(); };
  }, [actions]);
  return <group ref={group} {...props}><primitive object={instance} /></group>;
}
```

Render this inside a single shared R3F `Canvas` with lighting and Suspense.
Blender's -Y front becomes glTF's +Z front after standard Y-up export: place
the web camera on positive Z and the tree at Y=0. Preserve the Garden's mood
history, tree selection, and accessible controls when replacing the visuals.
Current mood IDs are `happy`, `sad` (display label “Low”), `stressed`, `tired`,
and `calm`; adding `angry`, `bored`, and `loved` to check-ins is a separate data/UI
change. Reduce active animations for distant trees and honour reduced motion.

## Validation scope

The validator reopens the saved Blender file, checks names, transforms,
grounding, closed mesh parts, Principled materials, and the 3,000–8,000 triangle
budget. It samples deformed mesh vertices to check movement and matching loop
endpoints, parses the GLB, checks its named animation, then re-imports it using
Blender's glTF importer. It reports real file sizes and triangle counts.
Rendered previews require visual inspection too; automated topology checks do
not establish artistic quality or measure browser performance.
