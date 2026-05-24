'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================
// CONFIGURABLE PROPS INTERFACE
// ============================================

export interface CinematicLightBeamProps {
  // Core appearance
  color?: string;           // Primary beam color (default: cyan)
  colorSecondary?: string;  // Secondary gradient color (default: soft blue)
  colorTertiary?: string;   // Tertiary accent color (default: violet)
  intensity?: number;       // Overall brightness 0-1 (default: 0.6)

  // Motion
  slideSpeed?: number;      // Speed of initial slide-in in seconds (default: 1.5)
  driftSpeed?: number;      // Lateral drift speed (default: 0.05)
  driftAmount?: number;     // How far beam drifts horizontally (default: 0.15)
  oscillationSpeed?: number; // Vertical oscillation speed (default: 0.03)
  oscillationAmount?: number; // Vertical oscillation amount (default: 0.05)

  // Pulse
  pulseEnabled?: boolean;   // Enable brightness pulsing (default: true)
  pulseSpeed?: number;      // Pulse frequency (default: 0.3)
  pulseAmount?: number;     // Pulse intensity variation (default: 0.15)

  // Direction
  direction?: 'top' | 'left' | 'right';  // Entry direction (default: 'top')

  className?: string;
}

// ============================================
// CUSTOM SHADER MATERIAL
// ============================================

class CinematicBeamMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        u_time: { value: 0 },
        u_slideIn: { value: 0 },
        u_drift: { value: 0 },
        u_oscillation: { value: 0 },
        u_pulse: { value: 1.0 },
        u_color1: { value: new THREE.Color('#00d4ff') }, // Cyan
        u_color2: { value: new THREE.Color('#4fa8ff') }, // Soft blue
        u_color3: { value: new THREE.Color('#8b5cf6') }, // Violet
        u_intensity: { value: 0.6 },
        u_resolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform float u_slideIn;
        uniform float u_drift;
        uniform float u_oscillation;
        uniform float u_pulse;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform vec3 u_color3;
        uniform float u_intensity;
        uniform vec2 u_resolution;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Simplex noise for organic variation
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
        
        // Fractal brownian motion for volumetric texture
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
        
        // Gaussian falloff for soft edges
        float gaussian(float x, float sigma) {
          return exp(-(x * x) / (2.0 * sigma * sigma));
        }
        
        void main() {
          vec2 uv = vUv;
          float time = u_time * 0.08;
          
          // Core beam uses FIXED center horizontally
          float fixedCenterX = vUv.x - 0.5;
          
          // Y coordinate: 0 at top of screen, 1 at bottom
          // Light source is AT the top edge (y = 0)
          float distFromTop = uv.y;  // 0 at top, 1 at bottom
          
          // Smooth fade-in animation (no movement, just opacity)
          float fadeIn = u_slideIn;
          
          // ========================================
          // BEAM FROM TOP EDGE - Only bottom 180° visible
          // Light source is positioned AT the top edge
          // ========================================
          
          // Horizontal spread (Gaussian from center)
          float beamCore = gaussian(fixedCenterX, 0.2) * 1.5;
          float beamMid = gaussian(fixedCenterX, 0.45) * 0.85;
          float beamOuter = gaussian(fixedCenterX, 0.8) * 0.4;
          float beamAmbient = gaussian(fixedCenterX, 1.2) * 0.2;
          
          float beam = beamCore + beamMid + beamOuter + beamAmbient;
          
          // Vertical falloff - light decays as it travels DOWN from top
          // Brightest at top (distFromTop = 0), fading as it goes down
          float verticalFalloff = exp(-distFromTop * 1.4);
          
          // Soft start - fade in from the very top edge
          float topFade = smoothstep(0.0, 0.08, distFromTop);
          
          // ========================================
          // AMBIENT GLOW EFFECTS - subtle animation around static core
          // ========================================
          
          // Very subtle animated noise for organic feel (doesn't affect core position)
          float noise1 = fbm(uv * 2.0 + vec2(time * 0.15, time * 0.1)) * 0.08;
          float noise2 = fbm(uv * 3.0 + vec2(-time * 0.1, time * 0.08) + 100.0) * 0.05;
          
          // Subtle shimmer in the outer glow only
          float shimmer = (sin(time * 2.0 + uv.y * 5.0) * 0.5 + 0.5) * 0.03;
          
          // ========================================
          // COMBINE LIGHTING
          // ========================================
          
          // Core beam is static, emanates from top edge
          float coreLight = (beamCore + beamMid) * verticalFalloff * topFade;
          
          // Outer ambient has subtle variation
          float ambientLight = (beamOuter + beamAmbient) * verticalFalloff * topFade;
          ambientLight += (noise1 + noise2) * verticalFalloff * topFade * 0.5;
          ambientLight += shimmer * beamAmbient * topFade;
          
          // Combine static core with animated ambient
          float light = coreLight + ambientLight;
          
          // Apply intensity and subtle pulse (only affects brightness, not position)
          light *= u_intensity * u_pulse;
          
          // Smooth final output
          light = smoothstep(0.0, 0.8, light);
          
          // ========================================
          // COLOR GRADING
          // ========================================
          
          // Core is brightest, transitions to secondary/tertiary at edges
          vec3 col = u_color1 * beamCore * 2.0;
          col += u_color2 * beamMid * 1.5;
          col += u_color3 * beamOuter;
          col = mix(col, u_color1, beam * 0.3);
          
          // Normalize and add subtle color variation
          col = col / max(max(col.r, col.g), col.b + 0.001);
          col *= 0.9 + noise1 * 0.2;
          
          // ========================================
          // ALPHA & EDGE SOFTENING
          // ========================================
          
          float alpha = light * u_slideIn;
          
          // Super soft edge fade
          float edgeFadeX = smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.8, uv.x);
          float edgeFadeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          alpha *= edgeFadeX * edgeFadeY;
          
          // Clamp alpha for subtlety
          alpha = clamp(alpha, 0.0, 0.85);
          
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

extend({ CinematicBeamMaterial });

// ============================================
// ANIMATED BEAM LAYER COMPONENT
// ============================================

interface BeamLayerProps {
  position: [number, number, number];
  scale: [number, number, number];
  slideSpeed: number;
  driftSpeed: number;
  driftAmount: number;
  oscillationSpeed: number;
  oscillationAmount: number;
  pulseEnabled: boolean;
  pulseSpeed: number;
  pulseAmount: number;
  color1: THREE.Color;
  color2: THREE.Color;
  color3: THREE.Color;
  intensity: number;
  delay: number;
}

function CinematicBeamLayer({
  position,
  scale,
  slideSpeed,
  driftSpeed,
  driftAmount,
  oscillationSpeed,
  oscillationAmount,
  pulseEnabled,
  pulseSpeed,
  pulseAmount,
  color1,
  color2,
  color3,
  intensity,
  delay,
}: BeamLayerProps) {
  const materialRef = useRef<CinematicBeamMaterial | null>(null);
  const startTime = useRef<number | null>(null);
  const { size } = useThree();

  // Update resolution uniform
  useEffect(() => {
    materialRef.current?.uniforms.u_resolution.value.set(size.width, size.height);
  }, [size]);

  // Update color uniforms
  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_color1.value = color1;
    materialRef.current.uniforms.u_color2.value = color2;
    materialRef.current.uniforms.u_color3.value = color3;
  }, [color1, color2, color3]);

  useFrame((state) => {
    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTime.current;
    const time = state.clock.elapsedTime;

    // Slide-in animation with delay
    const slideProgress = Math.max(0, elapsed - delay);
    const slideIn = Math.min(1, slideProgress / slideSpeed);
    // Smooth ease-out cubic
    const easedSlideIn = 1 - Math.pow(1 - slideIn, 3);

    // Lateral drift - slow sine wave
    const drift = Math.sin(time * driftSpeed) * driftAmount;

    // Vertical oscillation - even slower
    const oscillation = Math.sin(time * oscillationSpeed) * oscillationAmount;

    // Brightness pulse
    let pulse = 1.0;
    if (pulseEnabled) {
      pulse = 1.0 - pulseAmount * 0.5 + Math.sin(time * pulseSpeed) * pulseAmount * 0.5;
    }

    // Update uniforms
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_time.value = time;
    materialRef.current.uniforms.u_slideIn.value = easedSlideIn;
    materialRef.current.uniforms.u_drift.value = drift;
    materialRef.current.uniforms.u_oscillation.value = oscillation;
    materialRef.current.uniforms.u_pulse.value = pulse;
    materialRef.current.uniforms.u_intensity.value = intensity;
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <cinematicBeamMaterial ref={materialRef} />
    </mesh>
  );
}

// ============================================
// MULTI-LAYER BEAM SCENE
// ============================================

interface BeamSceneProps {
  color1: THREE.Color;
  color2: THREE.Color;
  color3: THREE.Color;
  intensity: number;
  slideSpeed: number;
  driftSpeed: number;
  driftAmount: number;
  oscillationSpeed: number;
  oscillationAmount: number;
  pulseEnabled: boolean;
  pulseSpeed: number;
  pulseAmount: number;
}

function CinematicBeamScene({
  color1,
  color2,
  color3,
  intensity,
  slideSpeed,
  driftSpeed,
  driftAmount,
  oscillationSpeed,
  oscillationAmount,
  pulseEnabled,
  pulseSpeed,
  pulseAmount,
}: BeamSceneProps) {
  // Multiple layers for volumetric depth
  const layers = useMemo(() => [
    // Background diffuse layer
    {
      position: [0, 0.5, -3] as [number, number, number],
      scale: [14, 12, 1] as [number, number, number],
      intensityMod: 0.4,
      delay: 0
    },
    // Mid layer
    {
      position: [0.1, 0.3, -2] as [number, number, number],
      scale: [12, 11, 1] as [number, number, number],
      intensityMod: 0.7,
      delay: 0.15
    },
    // Primary beam
    {
      position: [0, 0.2, -1] as [number, number, number],
      scale: [10, 10, 1] as [number, number, number],
      intensityMod: 1.0,
      delay: 0.3
    },
    // Foreground accent
    {
      position: [-0.05, 0.1, 0] as [number, number, number],
      scale: [8, 9, 1] as [number, number, number],
      intensityMod: 0.5,
      delay: 0.45
    },
  ], []);

  return (
    <>
      {layers.map((layer, i) => (
        <CinematicBeamLayer
          key={i}
          position={layer.position}
          scale={layer.scale}
          slideSpeed={slideSpeed}
          driftSpeed={driftSpeed * (1 + i * 0.1)}
          driftAmount={driftAmount * (1 - i * 0.15)}
          oscillationSpeed={oscillationSpeed * (1 + i * 0.05)}
          oscillationAmount={oscillationAmount * (1 - i * 0.1)}
          pulseEnabled={pulseEnabled}
          pulseSpeed={pulseSpeed * (1 + i * 0.1)}
          pulseAmount={pulseAmount}
          color1={color1}
          color2={color2}
          color3={color3}
          intensity={intensity * layer.intensityMod}
          delay={layer.delay}
        />
      ))}
    </>
  );
}

// ============================================
// MAIN COMPONENT EXPORT
// ============================================

export function LightBeamEffect({
  color = '#00d4ff',
  colorSecondary = '#4fa8ff',
  colorTertiary = '#8b5cf6',
  intensity = 0.6,
  slideSpeed = 1.5,
  driftSpeed = 0.05,
  driftAmount = 0.15,
  oscillationSpeed = 0.03,
  oscillationAmount = 0.05,
  pulseEnabled = true,
  pulseSpeed = 0.3,
  pulseAmount = 0.15,
  className = '',
}: CinematicLightBeamProps) {
  // Parse colors to THREE.Color
  const color1 = useMemo(() => new THREE.Color(color), [color]);
  const color2 = useMemo(() => new THREE.Color(colorSecondary), [colorSecondary]);
  const color3 = useMemo(() => new THREE.Color(colorTertiary), [colorTertiary]);

  return (
    <div className={`page-home-background__lightbeam ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'default',
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <CinematicBeamScene
          color1={color1}
          color2={color2}
          color3={color3}
          intensity={intensity}
          slideSpeed={slideSpeed}
          driftSpeed={driftSpeed}
          driftAmount={driftAmount}
          oscillationSpeed={oscillationSpeed}
          oscillationAmount={oscillationAmount}
          pulseEnabled={pulseEnabled}
          pulseSpeed={pulseSpeed}
          pulseAmount={pulseAmount}
        />
      </Canvas>
    </div>
  );
}
