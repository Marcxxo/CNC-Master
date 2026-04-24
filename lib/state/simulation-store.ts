"use client";

import { create } from "zustand";
import { DEFAULT_TOOL, DEFAULT_WORKPIECE } from "@/lib/cnc/defaults";
import { parseGCode } from "@/lib/cnc/parser";
import { getSimulationFrame, getTotalRuntime } from "@/lib/cnc/simulation";
import type {
  ParsedProgram,
  SimulationFrame,
  ToolDefinition,
  WorkpieceDefinition,
} from "@/lib/cnc/types";
import { SAMPLE_GCODE } from "@/lib/data/sample-gcode";

interface SimulationStore {
  workpiece: WorkpieceDefinition;
  tool: ToolDefinition;
  gcode: string;
  parsedProgram: ParsedProgram;
  selectedLineNumber: number | null;
  isPlaying: boolean;
  playbackSpeed: number;
  elapsedSeconds: number;
  runtimeSeconds: number;
  frame: SimulationFrame;
  setWorkpiece: (value: WorkpieceDefinition) => void;
  setTool: (value: ToolDefinition) => void;
  setGCode: (value: string) => void;
  selectLine: (value: number | null) => void;
  setPlaybackSpeed: (value: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  tick: (deltaSeconds: number) => void;
  loadExample: () => void;
}

const buildDerivedSimulation = ({
  gcode,
  workpiece,
  tool,
  elapsedSeconds,
  playbackSpeed,
}: {
  gcode: string;
  workpiece: WorkpieceDefinition;
  tool: ToolDefinition;
  elapsedSeconds: number;
  playbackSpeed: number;
}) => {
  const parsedProgram = parseGCode(gcode, workpiece, tool);
  return {
    parsedProgram,
    runtimeSeconds: getTotalRuntime(parsedProgram, playbackSpeed),
    frame: getSimulationFrame(parsedProgram, elapsedSeconds, playbackSpeed),
  };
};

const initialDerived = buildDerivedSimulation({
  gcode: SAMPLE_GCODE,
  workpiece: DEFAULT_WORKPIECE,
  tool: DEFAULT_TOOL,
  elapsedSeconds: 0,
  playbackSpeed: 1,
});

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  workpiece: DEFAULT_WORKPIECE,
  tool: DEFAULT_TOOL,
  gcode: SAMPLE_GCODE,
  parsedProgram: initialDerived.parsedProgram,
  selectedLineNumber: null,
  isPlaying: false,
  playbackSpeed: 1,
  elapsedSeconds: 0,
  runtimeSeconds: initialDerived.runtimeSeconds,
  frame: initialDerived.frame,
  setWorkpiece: (workpiece) => {
    const { gcode, tool, elapsedSeconds, playbackSpeed } = get();
    const derived = buildDerivedSimulation({
      gcode,
      workpiece,
      tool,
      elapsedSeconds,
      playbackSpeed,
    });
    set({
      workpiece,
      parsedProgram: derived.parsedProgram,
      runtimeSeconds: derived.runtimeSeconds,
      frame: derived.frame,
    });
  },
  setTool: (tool) => {
    const { gcode, workpiece, elapsedSeconds, playbackSpeed } = get();
    const derived = buildDerivedSimulation({
      gcode,
      workpiece,
      tool,
      elapsedSeconds,
      playbackSpeed,
    });
    set({
      tool,
      parsedProgram: derived.parsedProgram,
      runtimeSeconds: derived.runtimeSeconds,
      frame: derived.frame,
    });
  },
  setGCode: (gcode) => {
    const { workpiece, tool } = get();
    const playbackSpeed = get().playbackSpeed;
    const derived = buildDerivedSimulation({
      gcode,
      workpiece,
      tool,
      elapsedSeconds: 0,
      playbackSpeed,
    });
    set({
      gcode,
      parsedProgram: derived.parsedProgram,
      elapsedSeconds: 0,
      runtimeSeconds: derived.runtimeSeconds,
      frame: derived.frame,
      isPlaying: false,
      selectedLineNumber: null,
    });
  },
  selectLine: (selectedLineNumber) => set({ selectedLineNumber }),
  setPlaybackSpeed: (playbackSpeed) => {
    const { parsedProgram, elapsedSeconds } = get();
    set({
      playbackSpeed,
      runtimeSeconds: getTotalRuntime(parsedProgram, playbackSpeed),
      frame: getSimulationFrame(parsedProgram, elapsedSeconds, playbackSpeed),
    });
  },
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  reset: () => {
    const { parsedProgram, playbackSpeed } = get();
    set({
      isPlaying: false,
      elapsedSeconds: 0,
      frame: getSimulationFrame(parsedProgram, 0, playbackSpeed),
    });
  },
  tick: (deltaSeconds) => {
    const { isPlaying, elapsedSeconds, runtimeSeconds, parsedProgram, playbackSpeed } = get();
    if (!isPlaying) {
      return;
    }

    const nextElapsed = Math.min(elapsedSeconds + deltaSeconds, runtimeSeconds);
    const frame = getSimulationFrame(parsedProgram, nextElapsed, playbackSpeed);
    set({
      elapsedSeconds: nextElapsed,
      frame,
      selectedLineNumber: frame.activeLineNumber,
      isPlaying: nextElapsed < runtimeSeconds,
    });
  },
  loadExample: () => {
    const { workpiece, tool } = get();
    const derived = buildDerivedSimulation({
      gcode: SAMPLE_GCODE,
      workpiece,
      tool,
      elapsedSeconds: 0,
      playbackSpeed: 1,
    });
    set({
      gcode: SAMPLE_GCODE,
      parsedProgram: derived.parsedProgram,
      elapsedSeconds: 0,
      runtimeSeconds: derived.runtimeSeconds,
      playbackSpeed: 1,
      frame: derived.frame,
      isPlaying: false,
      selectedLineNumber: null,
    });
  },
}));
