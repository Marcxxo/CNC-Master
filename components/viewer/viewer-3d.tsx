"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";
import { buildScenePathPoints, toScenePosition } from "@/components/viewer/toolpath-helpers";

type OrbitControlsApi = {
  object: THREE.Camera;
  target: THREE.Vector3;
  update: () => void;
};

function AnimatedTool() {
  const tool = useSimulationStore((state) => state.tool);
  const frame = useSimulationStore((state) => state.frame);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) {
      return;
    }
    const { x, y, z } = frame.position;
    meshRef.current.position.copy(toScenePosition(x, y, z + tool.totalLength / 2));
  });

  return (
    <mesh ref={meshRef} castShadow renderOrder={30}>
      <cylinderGeometry args={[tool.diameter / 2, tool.diameter / 2, tool.totalLength, 32]} />
      <meshStandardMaterial color="#93c5fd" metalness={0.45} roughness={0.25} />
    </mesh>
  );
}

const ToolpathLines = memo(function ToolpathLines({
  visible,
}: {
  visible: boolean;
}) {
  const moves = useSimulationStore((state) => state.parsedProgram.moves);

  if (!visible) {
    return null;
  }

  return (
    <>
      {moves.map((move) => {
        const points = buildScenePathPoints(move, { verticalOffset: 0.06 });

        if (points.length < 2) {
          return null;
        }

        if (move.type === "rapid") {
          return (
            <Line
              key={`rapid-${move.id}`}
              points={points}
              color="#89b4ff"
              lineWidth={1.15}
              dashed
              dashScale={1.2}
              dashSize={0.8}
              gapSize={0.6}
              transparent
              opacity={0.72}
              depthTest={false}
              depthWrite={false}
              renderOrder={20}
            />
          );
        }

        return (
          <Line
            key={`cut-${move.id}`}
            points={points}
            color="#49d6ff"
            lineWidth={1.85}
            transparent
            opacity={0.92}
            depthTest={false}
            depthWrite={false}
            renderOrder={21}
          />
        );
      })}
    </>
  );
});

const CutPreview = memo(function CutPreview({
  visible,
}: {
  visible: boolean;
}) {
  const moves = useSimulationStore((state) => state.parsedProgram.moves);

  if (!visible) {
    return null;
  }

  return (
    <>
      {moves
        .filter((move) => move.type !== "rapid" && move.to.z < 0)
        .map((move) => {
          const points = buildScenePathPoints(move, { verticalOffset: 0.03 });

          if (points.length < 2) {
            return null;
          }

          return (
            <Line
              key={`preview-${move.id}`}
              points={points}
              color="#22d3ee"
              lineWidth={7.5}
              transparent
              opacity={0.14}
              depthTest={false}
              depthWrite={false}
              renderOrder={10}
            />
          );
        })}
    </>
  );
});

function WorkpieceScene({
  showToolpath,
  showCutPreview,
  controlsRef,
}: {
  showToolpath: boolean;
  showCutPreview: boolean;
  controlsRef: { current: OrbitControlsApi | null };
}) {
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

  useEffect(() => {
    if (!controlsRef.current) {
      return;
    }

    controlsRef.current.target.set(workpiece.width / 2, -workpiece.height / 2, workpiece.depth / 2);
    controlsRef.current.update();
  }, [controlsRef, workpiece.width, workpiece.height, workpiece.depth]);

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
          opacity={0.5}
          metalness={0.18}
          roughness={0.68}
        />
      </RoundedBox>
      <CutPreview visible={showCutPreview} />
      <ToolpathLines visible={showToolpath} />
      <AnimatedTool />
      <mesh position={toScenePosition(frame.position.x, frame.position.y, 0)} renderOrder={25}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#49d6ff" depthTest={false} />
      </mesh>
      <Environment preset="city" />
      <OrbitControls
        ref={controlsRef as never}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={18}
        maxDistance={320}
        maxPolarAngle={Math.PI / 2.02}
      />
    </>
  );
}

function formatPlaneMode(planeMode: string | undefined) {
  if (!planeMode) {
    return "-";
  }
  return planeMode === "XY" ? "G17 / XY" : planeMode === "XZ" ? "G18 / XZ" : "G19 / YZ";
}

function formatUnitMode(unitMode: string | undefined) {
  if (!unitMode) {
    return "-";
  }
  return unitMode === "mm" ? "Millimeter" : "Zoll";
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-cyan-100">{value}</p>
    </div>
  );
}

export function Viewer3D() {
  const workpiece = useSimulationStore((state) => state.workpiece);
  const tool = useSimulationStore((state) => state.tool);
  const play = useSimulationStore((state) => state.play);
  const pause = useSimulationStore((state) => state.pause);
  const reset = useSimulationStore((state) => state.reset);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const playbackSpeed = useSimulationStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = useSimulationStore((state) => state.setPlaybackSpeed);
  const elapsedSeconds = useSimulationStore((state) => state.elapsedSeconds);
  const runtimeSeconds = useSimulationStore((state) => state.runtimeSeconds);
  const activeLine = useSimulationStore((state) => state.frame.activeLineNumber);
  const frame = useSimulationStore((state) => state.frame);
  const parsedProgram = useSimulationStore((state) => state.parsedProgram);
  const [showToolpath, setShowToolpath] = useState(true);
  const [showCutPreview, setShowCutPreview] = useState(true);
  const controlsRef = useRef<OrbitControlsApi | null>(null);

  const activeMove = useMemo(
    () => parsedProgram.moves.find((move) => move.lineNumber === frame.activeLineNumber),
    [parsedProgram.moves, frame.activeLineNumber],
  );

  const spindleState = activeMove
    ? activeMove.spindleOn
      ? "Ein"
      : "Aus"
    : parsedProgram.finalState.spindleOn
      ? "Ein"
      : "Aus";

  const currentFeed = activeMove?.feedRate ?? tool.feedRate;
  const activeToolNumber = parsedProgram.finalState.toolNumber ?? tool.toolNumber;
  const planeMode = formatPlaneMode(parsedProgram.finalState.planeMode);
  const unitMode = formatUnitMode(parsedProgram.finalState.unitMode);

  const resetCamera = () => {
    if (!controlsRef.current) {
      return;
    }

    controlsRef.current.target.set(
      workpiece.width / 2,
      -workpiece.height / 2,
      workpiece.depth / 2,
    );
    controlsRef.current.object.position.set(
      workpiece.width * 0.95,
      workpiece.height * 1.9,
      workpiece.depth * 1.2,
    );
    controlsRef.current.update();
  };

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
            {isPlaying ? "Pause" : "Start"}
          </button>
          <button
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
            onClick={reset}
          >
            Zurücksetzen
          </button>
          <label className="flex items-center gap-3 text-sm text-slate-300">
            Tempo
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
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showToolpath}
              onChange={(event) => setShowToolpath(event.target.checked)}
            />
            Werkzeugbahn
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showCutPreview}
              onChange={(event) => setShowCutPreview(event.target.checked)}
            />
            Schnittvorschau
          </label>
          <button
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
            onClick={resetCamera}
          >
            Kamera zurücksetzen
          </button>
          <span className="ml-auto text-sm text-slate-400">
            {elapsedSeconds.toFixed(1)}s / {runtimeSeconds.toFixed(1)}s
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatusTile label="Position X" value={`${frame.position.x.toFixed(2)} mm`} />
          <StatusTile label="Position Y" value={`${frame.position.y.toFixed(2)} mm`} />
          <StatusTile label="Position Z" value={`${frame.position.z.toFixed(2)} mm`} />
          <StatusTile label="Aktive Zeile" value={activeLine ? `N${activeLine}` : "-"} />
          <StatusTile label="Vorschub" value={`${currentFeed.toFixed(0)} mm/min`} />
          <StatusTile label="Spindel" value={spindleState} />
          <StatusTile label="Werkzeug T" value={`T${activeToolNumber}`} />
          <StatusTile label="Ebene" value={planeMode} />
          <StatusTile label="Einheit" value={unitMode} />
        </div>

        <div className="rounded-[30px] border border-slate-800 bg-[#02070e] p-2">
          <div className="h-[460px] overflow-hidden rounded-[24px]">
            <Canvas
              shadows
              camera={{
                position: [
                  workpiece.width * 0.95,
                  workpiece.height * 1.9,
                  workpiece.depth * 1.2,
                ],
                fov: 42,
              }}
            >
              <color attach="background" args={["#02070e"]} />
              <WorkpieceScene
                showToolpath={showToolpath}
                showCutPreview={showCutPreview}
                controlsRef={controlsRef}
              />
            </Canvas>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
