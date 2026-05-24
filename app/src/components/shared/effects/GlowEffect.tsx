'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

// Custom shader material for soft glowing smoke effect with triangle shape
class GlowSmokeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        u_time: { value: 0 },
        u_color1: { value: new THREE.Color('#ffffff') }, // pure white core
        u_color2: { value: new THREE.Color('#f8f4f0') }, // warm white
        u_color3: { value: new THREE.Color('#e8ddd4') }, // soft cream
        u_color4: { value: new THREE.Color('#d4c8bc') }, // light taupe
        u_glowIntensity: { value: 1.0 },
        u_smokeAmount: { value: 0.5 },
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
        uniform float u_glowIntensity;
        uniform float u_smokeAmount;
        varying vec2 vUv;
        
        // Simplex noise functions
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
        
        // Smooth FBM for organic movement
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for (int i = 0; i < 5; i++) {
            value += amplitude * snoise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        // Triangle SDF - pyramid pointing downward (tip at bottom)
        float triangleSDF(vec2 p) {
          // Flip Y so 0 is at top, 1 is at bottom
          vec2 uv = vec2(p.x, 1.0 - p.y);
          
          // Wide base at top (y=0), tip pointing down to bottom (y=1)
          vec2 topLeft = vec2(0.0, 0.0);
          vec2 topRight = vec2(1.0, 0.0);
          vec2 tip = vec2(0.5, 0.95);
          
          // Signed distance to each edge
          vec2 e0 = topRight - topLeft;
          vec2 e1 = tip - topRight;
          vec2 e2 = topLeft - tip;
          
          vec2 v0 = uv - topLeft;
          vec2 v1 = uv - topRight;
          vec2 v2 = uv - tip;
          
          float d0 = v0.x * e0.y - v0.y * e0.x;
          float d1 = v1.x * e1.y - v1.y * e1.x;
          float d2 = v2.x * e2.y - v2.y * e2.x;
          
          return max(max(d0, d1), d2);
        }
        
        void main() {
          vec2 uv = vUv;
          float time = u_time * 0.12;
          
          // Triangle shape with soft edges
          float triDist = triangleSDF(uv);
          float triShape = 1.0 - smoothstep(-0.15, 0.08, triDist);
          
          // Add wavy distortion to triangle edges
          float edgeWave1 = fbm(uv * 4.0 + vec2(time * 0.4, time * 0.3)) * 0.06;
          float edgeWave2 = fbm(uv * 6.0 + vec2(-time * 0.35, time * 0.25) + 20.0) * 0.04;
          float wavyTri = 1.0 - smoothstep(-0.15 + edgeWave1 + edgeWave2, 0.1, triDist);
          
          // Center glow within triangle (positioned in upper area since triangle points down)
          vec2 triCenter = vec2(0.5, 0.7);
          float distToCenter = length(uv - triCenter);
          float coreGlow = 1.0 - smoothstep(0.0, 0.5, distToCenter);
          coreGlow = pow(coreGlow, 1.8) * u_glowIntensity;
          
          // Pulsing animation
          float pulse = sin(time * 1.5) * 0.12 + 0.88;
          coreGlow *= pulse;
          
          // Small smoky waves around the form
          float smoke1 = fbm(uv * 5.0 + vec2(time * 0.5, time * 0.35));
          float smoke2 = fbm(uv * 7.0 + vec2(-time * 0.4, time * 0.3) + 40.0);
          float smoke3 = fbm(uv * 3.5 + vec2(time * 0.25, -time * 0.2) + 80.0);
          
          // Create small wave patterns
          float waves = sin(uv.x * 15.0 + time * 2.0 + smoke1 * 2.0) * 0.5 + 0.5;
          waves *= sin(uv.y * 12.0 - time * 1.5 + smoke2 * 2.0) * 0.5 + 0.5;
          waves = smoothstep(0.2, 0.8, waves);
          
          // Combine smoke layers
          float smokeCombo = (smoke1 * 0.4 + smoke2 * 0.35 + smoke3 * 0.25);
          smokeCombo = smoothstep(-0.4, 0.6, smokeCombo);
          
          // Edge smoke wisps - stronger near triangle edges
          float edgeDist = abs(triDist);
          float edgeSmoke = smoothstep(0.2, 0.0, edgeDist) * smokeCombo;
          
          // Color blending
          vec3 col = mix(u_color1, u_color2, 1.0 - coreGlow);
          col = mix(col, u_color3, smokeCombo * u_smokeAmount * 0.6);
          col = mix(col, u_color4, waves * u_smokeAmount * 0.4);
          
          // Add bright core
          col += u_color1 * coreGlow * 0.4;
          
          // Add subtle color variation from smoke
          col += vec3(0.05, 0.03, 0.0) * edgeSmoke;
          
          // Final alpha: combine triangle shape, glow, and edge smoke
          float innerAlpha = wavyTri * (coreGlow * 0.7 + 0.3);
          float smokeAlpha = edgeSmoke * 0.5 * u_smokeAmount;
          float waveAlpha = waves * wavyTri * 0.15;
          
          float alpha = innerAlpha + smokeAlpha + waveAlpha;
          alpha = smoothstep(0.0, 0.7, alpha);
          alpha *= triShape * 0.9 + smokeCombo * 0.1;
          
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }
}

extend({ GlowSmokeMaterial });

// Animated glow layer
function GlowLayer({ 
  position, 
  scale, 
  speed = 1,
}: { 
  position: [number, number, number];
  scale: [number, number, number];
  speed?: number;
}) {
  const materialRef = useRef<GlowSmokeMaterial | null>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime * speed;
    }
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <glowSmokeMaterial ref={materialRef} />
    </mesh>
  );
}

// Multiple layered glow planes for depth
function GlowLayers() {
  const layers = useMemo(() => [
    { position: [0, 0, -1] as [number, number, number], scale: [10, 8, 1] as [number, number, number], speed: 0.8 },
    { position: [0, 0.1, -0.5] as [number, number, number], scale: [8, 6, 1] as [number, number, number], speed: 1.0 },
    { position: [0, 0, 0] as [number, number, number], scale: [6, 5, 1] as [number, number, number], speed: 1.2 },
  ], []);

  return (
    <>
      {layers.map((layer, i) => (
        <GlowLayer key={i} {...layer} />
      ))}
    </>
  );
}

interface GlowEffectProps {
  className?: string;
}

export function GlowEffect({ className = '' }: GlowEffectProps) {
  return (
    <div className={`page-home-background__glow ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'low-power'
        }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <GlowLayers />
      </Canvas>
    </div>
  );
}
