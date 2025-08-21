import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FriendWithLcrypt } from "@/hooks/types/lcryptDataManagerTypes";
import * as THREE from "three";

interface SoldierMascot3DProps {
  friends: FriendWithLcrypt[];
  isLoading?: boolean;
  size?: number;
  className?: string;
}

const parseTodayElo = (elo: unknown): number | null => {
  if (elo === null || elo === undefined) return null;
  if (typeof elo === "number" && !Number.isNaN(elo)) return elo;
  if (typeof elo === "string") {
    const parsed = parseInt(elo);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const thresholds = {
  veryGood: 35,
  good: 15,
  neutralLow: -10,
  bad: -30,
};

const getState = (avg: number) => {
  if (avg >= thresholds.veryGood) return "veryGood" as const;
  if (avg >= thresholds.good) return "good" as const;
  if (avg >= thresholds.neutralLow) return "neutral" as const;
  if (avg >= thresholds.bad) return "bad" as const;
  return "veryBad" as const;
};

const stateLabels: Record<ReturnType<typeof getState>, string> = {
  veryGood: "Foarte vesel",
  good: "Vesel",
  neutral: "Neutru",
  bad: "Trist",
  veryBad: "Foarte trist",
};

// Real 3D Soldier Component using uploaded models
const Soldier3D: React.FC<{ state: ReturnType<typeof getState>; avg: number }> = ({ state, avg }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Load the uploaded 3D models
  const { scene: basicModel } = useGLTF("/faceit-icons/base_basic_shaded.glb");
  const { scene: pbrModel } = useGLTF("/faceit-icons/base_basic_pbr.glb");
  
  // Use PBR model for better quality
  const model = pbrModel.clone();

  // Color scheme based on state
  const colors = {
    veryGood: "#10b981", // emerald
    good: "#22c55e",     // green
    neutral: "#64748b",  // slate
    bad: "#f59e0b",      // amber
    veryBad: "#ef4444"   // red
  };

  const currentColor = colors[state];

  // Animation based on state
  useFrame((frameState, delta) => {
    if (!meshRef.current) return;

    const time = frameState.clock.getElapsedTime();

    switch (state) {
      case "veryGood":
        // Victory dance - bouncing and rotating
        meshRef.current.position.y = Math.sin(time * 8) * 0.2;
        meshRef.current.rotation.y = Math.sin(time * 4) * 0.3;
        meshRef.current.rotation.z = Math.sin(time * 6) * 0.1;
        break;
      case "good":
        // Happy bobbing
        meshRef.current.position.y = Math.sin(time * 4) * 0.1;
        meshRef.current.rotation.y = Math.sin(time * 3) * 0.1;
        break;
      case "neutral":
        // Gentle breathing
        meshRef.current.scale.y = 1 + Math.sin(time * 2) * 0.02;
        break;
      case "bad":
        // Sad swaying
        meshRef.current.rotation.z = Math.sin(time * 2) * 0.05;
        meshRef.current.position.y = -0.1;
        break;
      case "veryBad":
        // Angry shaking
        meshRef.current.position.x = Math.sin(time * 15) * 0.05;
        meshRef.current.rotation.z = Math.sin(time * 10) * 0.1;
        meshRef.current.scale.setScalar(1 + Math.sin(time * 8) * 0.02);
        break;
    }
  });

  // Apply color tint to model materials
  React.useEffect(() => {
    if (model) {
      model.traverse((child: any) => {
        if (child.isMesh && child.material) {
          // Clone material to avoid modifying the original
          child.material = child.material.clone();
          // Apply color tint
          child.material.color = new THREE.Color(currentColor);
          // Add emissive glow for very states
          if (state === "veryGood" || state === "veryBad") {
            child.material.emissive = new THREE.Color(currentColor);
            child.material.emissiveIntensity = 0.2;
          } else {
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      });
    }
  }, [model, currentColor, state]);

  return (
    <group ref={meshRef}>
      {/* The actual 3D model */}
      <primitive 
        object={model} 
        scale={[1.5, 1.5, 1.5]} 
        position={[0, -1, 0]}
        rotation={[0, Math.PI, 0]}
      />

      {/* State-specific effects */}
      {state === "veryGood" && (
        <>
          {/* Victory sparkles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i / 8) * Math.PI * 2) * 1.2,
                Math.sin((i / 8) * Math.PI * 2) * 1.2 + 0.5,
                0
              ]}
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
          ))}
        </>
      )}

      {state === "veryBad" && (
        <>
          {/* Anger steam */}
          <mesh position={[-0.3, 1.2, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.3, 1.2, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {/* ELO indicator above model */}
      <group position={[0, 1.5, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.2]} />
          <meshBasicMaterial color={currentColor} transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
};

// Preload the models
useGLTF.preload("/faceit-icons/base_basic_shaded.glb");
useGLTF.preload("/faceit-icons/base_basic_pbr.glb");

const Scene3D: React.FC<{ state: ReturnType<typeof getState>; avg: number }> = ({ state, avg }) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} color={state === "veryBad" ? "#ff4444" : "#ffffff"} />
      
      {/* Soldier */}
      <Soldier3D state={state} avg={avg} />
    </>
  );
};

export const SoldierMascot3D: React.FC<SoldierMascot3DProps> = ({ 
  friends, 
  isLoading, 
  size = 80, 
  className 
}) => {
  const { avg, count } = useMemo(() => {
    const todays = (friends || [])
      .map((f) => {
        const present = f.lcryptData?.today?.present;
        const value = parseTodayElo(f.lcryptData?.today?.elo);
        return present && value !== null ? value : null;
      })
      .filter((v): v is number => v !== null);

    if (todays.length === 0) return { avg: 0, count: 0 };
    const sum = todays.reduce((a, b) => a + b, 0);
    return { avg: Math.round(sum / todays.length), count: todays.length };
  }, [friends]);

  if (isLoading && count === 0) {
    return (
      <div 
        className={cn("rounded-full bg-muted animate-pulse", className)} 
        style={{ width: size, height: size }}
        aria-label="Se încarcă mascotă 3D" 
      />
    );
  }

  if (count === 0) return null;

  const state = getState(avg);
  const title = `ELO Today: ${avg > 0 ? "+" + avg : avg} • ${stateLabels[state]} • ${count} au jucat`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative transition-all duration-300",
              className
            )}
            style={{ width: size, height: size }}
            aria-label={title}
            role="img"
          >
            <Canvas
              camera={{ position: [0, 0, 6], fov: 50 }}
              style={{ width: '100%', height: '100%' }}
            >
              <Suspense fallback={null}>
                <Scene3D state={state} avg={avg} />
              </Suspense>
            </Canvas>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs font-medium">
          <span>{title}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SoldierMascot3D;