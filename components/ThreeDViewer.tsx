/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";
import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center, Bounds, Html, useProgress } from "@react-three/drei";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-blue-400 font-bold whitespace-nowrap bg-slate-900/80 px-4 py-2 rounded-lg backdrop-blur-sm shadow-xl">
        3D Model Yükleniyor: {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    return () => {
      // Bellek sızıntısını önlemek için cache'i temizle
      useGLTF.clear(url);
    };
  }, [url]);

  return <primitive object={scene} />;
}

export default function ThreeDViewer({ modelUrl }: { modelUrl?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  // Sadece istemci tarafında (Client-side) render olmasını garantiye alıyoruz
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !modelUrl || !modelUrl.startsWith('http')) return null;

  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing bg-slate-950 relative overflow-hidden">
      {/* Key prop'u sayesinde URL değiştiğinde veya bileşen yenilendiğinde WebGL context sıfırdan başlar */}
      <Canvas 
        key={modelUrl}
        camera={{ far: 20000, near: 0.1, fov: 45, position: [50, 50, 50] }}
        gl={{ preserveDrawingBuffer: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[20, 20, 10]} intensity={2} />
        <Environment preset="city"/> 
        
        <Suspense fallback={<Loader />}>
          <Bounds clip fit margin={1.2} observe>
            <Center>
              <Model url={modelUrl}/>
            </Center>
          </Bounds>
        </Suspense>
        
        <OrbitControls autoRotate autoRotateSpeed={1.0} dampingFactor={0.05} enableDamping enablePan={false} enableZoom={true} makeDefault/>
      </Canvas>
    </div>
  );
}
