"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";
import { buildPathPoints, toThreePosition } from "@/components/viewer/toolpath-helpers";

function AnimatedTool() {
  const tool = useSimulationStore((state) => state.tool);
  const frame = useSimulationStore((state) => state.frame);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) {
      return;
    }
    const { x, y, z } = frame.position;
    meshRef.current.position.copy(toThreePosition(x, y, z + tool.totalLength / 2));
  });

  return (
    <mesh ref={meshRef} castShadow>
      <cylinderGeometry args={[tool.diameter / 2, tool.diameter / 2, tool.totalLength, 32]} />
      <meshStandardMaterial color="#93c5fd" metalness={0.45} roughness={0.25} />
    </mesh>
  );
}

const ToolpathLines = memo(function ToolpathLines() {
  const moves = useSimulationStore((state) => state.parsedProgram.moves);

  const rapidPoints = useMemo(
    () => buildPathPoints(moves, (move) => move.type === "rapid"),
    [moves],
  );
  const cutPoints = useMemo(
    () => buildPathPoints(moves, (move) => move.type !== "rapid"),
    [moves],
  );

  return (
    <>
      {rapidPoints.length > 1 ? (
        <Line
          points={rapidPoints}
          color="#89b4ff"
          lineWidth={1.6}
          dashed
          dashScale={1.2}
          dashSize={0.8}
          gapSize={0.6}
        />
      ) : null}
      {cutPoints.length > 1 ? (
        <Line points={cutPoints} color="#49d6ff" lineWidth={2.5} />
      ) : null}
    </>
  );
});

function CutGrooves() {
  const moves = useSimulationStore((state) => state.parsedProgram.moves);
  const tool = useSimulationStore((state) => state.tool);

  return (
    <>
      {/* Future extension point: swap these preview grooves for voxel removal,
          height-field stock simulation, or robust CSG when the physics layer matures. */}
      {moves
        .filter((move) => move.type !== "rapid" && move.to.z < 0)
        .flatMap((move) =>
          move.pathPoints.slice(1).map((point, index) => {
            const start = move.pathPoints[index];
            const end = point;
            const length = Math.max(
              Math.hypot(end.x - start.x, end.y - start.y),
              tool.diameter,
            );
            const centerX = (start.x + end.x) / 2;
            const centerY = (start.y + end.y) / 2;
            const depth = Math.max(Math.abs(start.z), Math.abs(end.z));
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            return (
              <mesh
                key={`${move.id}-${index}`}
                position={[centerX, -depth / 2, centerY]}
                rotation={[-Math.PI / 2, 0, angle]}
              >
                <boxGeometry args={[length, tool.diameter * 0.86, depth]} />
                <meshStandardMaterial
                  color="#0ea5e9"
                  transparent
                  opacity={0.22}
                  roughness={0.45}
                />
              </mesh>
            );
          }),
        )}
    </>
  );
}

function WorkpieceScene() {
  const workpiece = useSimulationStore((state) => state.workpiece);
  const frame = useSimulationStore((state) => state.frame);
  const parsedProgram = useSimulationStore((state) => state.parsedProgram);
  const tick = useSimulationStore((state) => state.tick);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const playbackSpeed = useSimulationStore((state) => state.playbackSpeed);

  const lastTimeRef = useRef<number | null>(null);

  useFrame((state) => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }
    if (lastTimeRef.current == null) {
      lastTimeRef.current = state.clock.elapsedTime;
      return;
    }
    const delta = state.clock.elapsedTime - lastTimeRef.current;
    lastTimeRef.current = state.clock.elapsedTime;
    tick(delta);
  });

  useEffect(() => {
    if (!parsedProgram.moves.length) {
      lastTimeRef.current = null;
    }
  }, [parsedProgram.moves.length, playbackSpeed]);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[80, 120, 40]} intensity={1.8} castShadow />
      <gridHelper args={[180, 18, "#12385a", "#0c1f35"]} position={[workpiece.width / 2, -workpiece.height / 2 - 0.1, workpiece.depth / 2]} />
      <axesHelper args={[40]} />
      <RoundedBox
        args={[workpiece.width, workpiece.height, workpiece.depth]}
        radius={1.6}
        smoothness={5}
        position={[workpiece.width / 2, -workpiece.height / 2, workpiece.depth / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#355b79"
          transparent
          opacity={0.52}
          metalness={0.18}
          roughness={0.68}
        />
      </RoundedBox>
      <CutGrooves />
      <ToolpathLines />
      <AnimatedTool />
      <mesh position={toThreePosition(frame.position.x, frame.position.y, 0)}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#49d6ff" />
      </mesh>
      <Environment preset="city" />
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

export function Viewer3D() {
  const workpiece = useSimulationStore((state) => state.workpiece);
  const play = useSimulationStore((state) => state.play);
  const pause = useSimulationStore((state) => state.pause);
  const reset = useSimulationStore((state) => state.reset);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const playbackSpeed = useSimulationStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = useSimulationStore((state) => state.setPlaybackSpeed);
  const elapsedSeconds = useSimulationStore((state) => state.elapsedSeconds);
  const runtimeSeconds = useSimulationStore((state) => state.runtimeSeconds);
  const activeLine = useSimulationStore((state) => state.frame.activeLineNumber);

  return (
    <PanelShell
      title="Simulation"
      subtitle="Werkzeug, Bahn und vereinfachte Materialabnahme"
      className="h-full"
      actions={<span className="pill">Aktive Zeile {activeLine ?? "-"}</span>}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            onClick={isPlaying ? pause : play}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
            onClick={reset}
          >
            Reset
          </button>
          <label className="flex items-center gap-3 text-sm text-slate-300">
            Speed
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.25}
              value={playbackSpeed}
              onChange={(event) => setPlaybackSpeed(Number(event.target.value))}
            />
            <span className="w-12 text-right text-cyan-100">{playbackSpeed.toFixed(2)}x</span>
          </label>
          <span className="ml-auto text-sm text-slate-400">
            {elapsedSeconds.toFixed(1)}s / {runtimeSeconds.toFixed(1)}s
          </span>
        </div>

        <div className="rounded-[30px] border border-slate-800 bg-[#02070e] p-2">
          <div className="h-[460px] overflow-hidden rounded-[24px]">
            <Canvas
              shadows
              camera={{
                position: [
                  workpiece.width * 0.9,
                  workpiece.height * 2.1,
                  workpiece.depth * 1.3,
                ],
                fov: 42,
              }}
            >
              <color attach="background" args={["#02070e"]} />
              <WorkpieceScene />
            </Canvas>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
