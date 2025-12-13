"use client";
import { Canvas } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import styles from "./css/styles.module.css";

export default function AIOrb() {
  return (
    <div className={styles.container}>
      <Canvas camera={{ position: [0, 0, 6] }}>
        <ambientLight intensity={1.3} />
        <directionalLight position={[5, 5, 5] as [number, number, number]} intensity={0.6} />
        <Sphere args={[3, 65, 65]}>
          <MeshDistortMaterial
            color="#596D7E"
            distort={0.3}
            speed={2}
            roughness={0}
            transparent
            opacity={0.8}
          />
        </Sphere>
        
      </Canvas>
    </div>
  );
}
