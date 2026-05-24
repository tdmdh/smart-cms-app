'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

// Custom shader material for flowing smoke
class SmokeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        u_time: { value: 0 },
        u_color1: { value: new THREE.Color('#071529') }, // warm dark brown
        u_color2: { value: new THREE.Color('#1a5490') }, // warm cream
        u_color3: { value: new THREE.Color('#4a7fb0') }, // natural tan
        u_color4: { value: new THREE.Color('#b8cce0') }, // dusty rose gray
        u_color5: { value: new THREE.Color('#e8eff7') }, // soft amber
        u_opacity: { value: 0.55 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform vec3 u_color3;
        uniform vec3 u_color4;
        uniform vec3 u_color5;
        uniform float u_opacity;
        varying vec2 vUv;
        
        // Simplex noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        // Smoother FBM with more octaves for natural look
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for (int i = 0; i < 6; i++) {
            value += amplitude * snoise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        // Extra smooth billowing function
        float billowNoise(vec2 p) {
          return abs(fbm(p)) * 2.0 - 1.0;
        }
        
        void main() {
          vec2 uv = vUv;
          float time = u_time * 0.15; // Moderate speed for visible but smooth movement
          
          // Create flowing smoke layers with smoother transitions
          float smoke1 = fbm(uv * 1.2 + vec2(time * 0.4, time * 0.25));
          float smoke2 = fbm(uv * 1.8 + vec2(-time * 0.35, time * 0.3) + 50.0);
          float smoke3 = fbm(uv * 0.8 + vec2(time * 0.2, -time * 0.15) + 100.0);
          float smoke4 = billowNoise(uv * 1.5 + vec2(time * 0.3, time * 0.2) + 150.0);
          
          // Combine for fuller, denser smoke
          float smoke = smoke1 * 0.35 + smoke2 * 0.3 + smoke3 * 0.2 + smoke4 * 0.15;
          smoke = smoothstep(-0.3, 0.8, smoke); // Smoother contrast
          
          // Soft wispy tendrils
          float tendrils = fbm(uv * 2.0 + vec2(smoke1, smoke2) * 0.2 + time * 0.35);
          tendrils = smoothstep(-0.2, 0.6, tendrils);
          
          // Additional volume layer for fullness
          float volume = fbm(uv * 0.6 + vec2(smoke2, smoke3) * 0.15 + time * 0.2);
          volume = smoothstep(-0.4, 0.5, volume);
          
          // Multi-color mixing for natural smoke tones
          vec3 col = mix(u_color1, u_color2, smoke);
          col = mix(col, u_color3, tendrils * 0.4);
          col = mix(col, u_color4, volume * 0.3);
          col = mix(col, u_color5, (smoke * tendrils) * 0.25);
          
          // Softer edge fade for smoother boundaries
          float edgeFade = smoothstep(0.0, 0.4, uv.x) * smoothstep(1.0, 0.6, uv.x);
          edgeFade *= smoothstep(0.0, 0.4, uv.y) * smoothstep(1.0, 0.6, uv.y);
          edgeFade = pow(edgeFade, 0.7); // Softer falloff
          
          // Fuller alpha with volume contribution
          float density = smoke * 0.6 + tendrils * 0.25 + volume * 0.15;
          float alpha = density * u_opacity * edgeFade;
          alpha = smoothstep(0.0, 0.8, alpha); // Smoother alpha transition
          
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
  }
}

extend({ SmokeMaterial });

// Individual smoke layer plane
function SmokeLayer({ 
  position, 
  scale, 
  speed = 1,
  opacity = 0.4 
}: { 
  position: [number, number, number];
  scale: [number, number, number];
  speed?: number;
  opacity?: number;
}) {
  const materialRef = useRef<SmokeMaterial | null>(null);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_time.value = state.clock.elapsedTime * speed;
    materialRef.current.uniforms.u_opacity.value = opacity;
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <smokeMaterial ref={materialRef} />
    </mesh>
  );
}

// Multiple layered smoke planes for depth - sized to match minimini triangle (~60%)
function SmokeLayers() {
  const layers = useMemo(() => [
    { position: [0, 0.5, -2] as [number, number, number], scale: [8, 6, 1] as [number, number, number], speed: 0.6, opacity: 0.4 },
    { position: [0.3, 0.8, -1.5] as [number, number, number], scale: [7, 5.5, 1] as [number, number, number], speed: 0.8, opacity: 0.45 },
    { position: [-0.2, 0.6, -1] as [number, number, number], scale: [6.5, 5, 1] as [number, number, number], speed: 0.9, opacity: 0.5 },
    { position: [0.1, 0.7, -0.5] as [number, number, number], scale: [6, 4.5, 1] as [number, number, number], speed: 0.5, opacity: 0.35 },
  ], []);

  return (
    <>
      {layers.map((layer, i) => (
        <SmokeLayer key={i} {...layer} />
      ))}
    </>
  );
}

interface SmokeEffectProps {
  className?: string;
}

export function SmokeEffect({ className = '' }: SmokeEffectProps) {
  return (
    <div className={`page-home-background__smoke ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ 
          alpha: true, 
          antialias: false,
          powerPreference: 'low-power'
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <SmokeLayers />
      </Canvas>
    </div>
  );
}
