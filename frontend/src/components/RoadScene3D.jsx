import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const DAMAGE_CLASSES = [
  { color: '#3498db', x: -1.2, z: -2, type: 'longitudinal' },
  { color: '#2dd4bf', x: 0.8, z: -4, type: 'transverse' },
  { color: '#e67e22', x: -0.5, z: -6, type: 'alligator' },
  { color: '#e74c3c', x: 1.0, z: -8, type: 'pothole' },
];

function buildRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1f2e';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 800; i++) {
    const n = ((i * 7919 + 13) % 1000) / 1000;
    ctx.fillStyle = `rgba(255,255,255,${n * 0.04})`;
    ctx.fillRect((i * 17) % 512, (i * 31) % 512, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 12);
  return tex;
}

let roadTextureCache = null;
function getRoadTexture() {
  if (!roadTextureCache) roadTextureCache = buildRoadTexture();
  return roadTextureCache;
}

function ScanBeam() {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.elapsedTime * 0.4) % 1;
    meshRef.current.position.z = -1 - t * 10;
    meshRef.current.material.opacity = 0.15 + Math.sin(t * Math.PI) * 0.25;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, -1]}>
      <planeGeometry args={[4.5, 0.08]} />
      <meshBasicMaterial color="#e8762a" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

function DamageMarker({ color, x, z, type }) {
  const boxRef = useRef();
  useFrame(({ clock }) => {
    if (!boxRef.current) return;
    boxRef.current.material.opacity = 0.35 + Math.sin(clock.elapsedTime * 2 + z) * 0.15;
  });

  if (type === 'pothole') {
    return (
      <group position={[x, 0.02, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh ref={boxRef} position={[0, 0.05, 0]}>
          <boxGeometry args={[0.5, 0.01, 0.5]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} wireframe />
        </mesh>
      </group>
    );
  }

  if (type === 'longitudinal') {
    return (
      <group position={[x, 0.03, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, 1.2]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        <mesh ref={boxRef} position={[0, 0.05, 0]}>
          <boxGeometry args={[0.15, 0.01, 1.4]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} wireframe />
        </mesh>
      </group>
    );
  }

  if (type === 'transverse') {
    return (
      <group position={[x, 0.03, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.0, 0.06]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        <mesh ref={boxRef} position={[0, 0.05, 0]}>
          <boxGeometry args={[1.2, 0.01, 0.15]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[x, 0.03, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.85} />
      </mesh>
      <mesh ref={boxRef} position={[0, 0.05, 0]}>
        <boxGeometry args={[0.8, 0.01, 0.8]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} wireframe />
      </mesh>
    </group>
  );
}

function RoadSurface() {
  const roadRef = useRef();
  const roadTexture = useMemo(() => getRoadTexture(), []);

  return (
    <group>
      <mesh ref={roadRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[5, 14]} />
        <meshStandardMaterial map={roadTexture} roughness={0.95} metalness={0.05} color="#222830" />
      </mesh>
      {/* Lane markings */}
      {[-0.4, 0.4].map((offset) => (
        <mesh key={offset} rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.01, -5]}>
          <planeGeometry args={[0.04, 12]} />
          <meshBasicMaterial color="#e8762a" transparent opacity={0.35} />
        </mesh>
      ))}
      {/* Road edges */}
      {[-2.3, 2.3].map((offset) => (
        <mesh key={offset} rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.005, -5]}>
          <planeGeometry args={[0.15, 14]} />
          <meshStandardMaterial color="#2dd4bf" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={['#080c14', 4, 18]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 8, 2]} intensity={0.8} castShadow />
      <pointLight position={[0, 3, -3]} intensity={0.4} color="#e8762a" />

      <RoadSurface />
      <ScanBeam />

      {DAMAGE_CLASSES.map((d, i) => (
        <DamageMarker key={i} {...d} />
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
      />
    </>
  );
}

export default function RoadScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 3.5, 3], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  );
}
