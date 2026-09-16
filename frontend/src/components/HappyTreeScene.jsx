import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useAnimations, useGLTF } from '@react-three/drei';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

function Tree({ paused, angle, onReady }) {
  const { scene, animations } = useGLTF('/models/mood-trees/happy_tree.glb');
  const instance = useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, instance);
  useEffect(() => {
    const action = actions.Happy_Idle;
    action?.reset().play();
    onReady();
    return () => { action?.stop(); };
  }, [actions, onReady]);
  useEffect(() => {
    actions.Happy_Idle?.setEffectiveTimeScale(paused ? 0 : 1);
  }, [actions, paused]);
  return <group rotation={[0, angle, 0]} dispose={null}>
    <primitive object={instance} />
    <pointLight position={[0, .35, .32]} color="#ffb52d" intensity={.18} distance={1.2} />
  </group>;
}

function Controls({ reset, onLost }) {
  const controls = useRef();
  const { gl, camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 2.45, 8);
    controls.current?.target.set(0, 1.65, 0);
    controls.current?.update();
  }, [reset, camera]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return <OrbitControls ref={controls} target={[0, 1.65, 0]} enablePan={false} enableZoom={false}
    minPolarAngle={1.12} maxPolarAngle={1.55} minAzimuthAngle={-.85} maxAzimuthAngle={.85}
    enableDamping dampingFactor={.08} />;
}

export default function HappyTreeScene({ paused, active, angle, reset, onReady, onLost }) {
  return <Canvas camera={{ position: [0, 2.45, 8], fov: 35 }} dpr={[1, 1.5]}
    frameloop={active && !paused ? 'always' : 'demand'} gl={{ antialias: true, alpha: true }}
    aria-label="Interactive golden Happy tree. Drag to turn, or use the rotation buttons below.">
    <ambientLight intensity={1.1} />
    <hemisphereLight args={['#fff8db', '#6c8960', 1.8]} />
    <directionalLight position={[-3, 6, 5]} intensity={3.2} color="#fff1d1" />
    <directionalLight position={[4, 3, -2]} intensity={2} color="#ffe7a0" />
    <Suspense fallback={null}><Tree paused={paused || !active} angle={angle} onReady={onReady} /></Suspense>
    <mesh position={[0, -.085, 0]}>
      <cylinderGeometry args={[1.43, 1.32, .14, 64]} />
      <meshStandardMaterial color="#94b877" roughness={1} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.008, 0]}>
      <ringGeometry args={[1.19, 1.23, 64]} />
      <meshBasicMaterial color="#e4edb8" />
    </mesh>
    <Controls reset={reset} onLost={onLost} />
  </Canvas>;
}
