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

const initialProgram = parseGCode(SAMPLE_GCODE, DEFAULT_WORKPIECE, DEFAULT_TOOL);

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  workpiece: DEFAULT_WORKPIECE,
  tool: DEFAULT_TOOL,
  gcode: SAMPLE_GCODE,
  parsedProgram: initialProgram,
  selectedLineNumber: null,
  isPlaying: false,
  playbackSpeed: 1,
  elapsedSeconds: 0,
  runtimeSeconds: getTotalRuntime(initialProgram, 1),
  frame: getSimulationFrame(initialProgram, 0, 1),
  setWorkpiece: (workpiece) => {
    const { gcode, tool } = get();
    const parsedProgram = parseGCode(gcode, workpiece, tool);
    set({
      workpiece,
      parsedProgram,
      runtimeSeconds: getTotalRuntime(parsedProgram, get().playbackSpeed),
      frame: getSimulationFrame(parsedProgram, get().elapsedSeconds, get().playbackSpeed),
      tool,
    });
  },
  setTool: (tool) => {
    const { gcode, workpiece } = get();
    const parsedProgram = parseGCode(gcode, workpiece, tool);
    set({
      tool,
      parsedProgram,
      runtimeSeconds: getTotalRuntime(parsedProgram, get().playbackSpeed),
      frame: getSimulationFrame(parsedProgram, get().elapsedSeconds, get().playbackSpeed),
    });
  },
  setGCode: (gcode) => {
    const { workpiece, tool } = get();
    const parsedProgram = parseGCode(gcode, workpiece, tool);
    const playbackSpeed = get().playbackSpeed;
    set({
      gcode,
      parsedProgram,
      elapsedSeconds: 0,
      runtimeSeconds: getTotalRuntime(parsedProgram, playbackSpeed),
      frame: getSimulationFrame(parsedProgram, 0, playbackSpeed),
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
    const parsedProgram = parseGCode(SAMPLE_GCODE, workpiece, tool);
    set({
      gcode: SAMPLE_GCODE,
      parsedProgram,
      elapsedSeconds: 0,
      runtimeSeconds: getTotalRuntime(parsedProgram, 1),
      playbackSpeed: 1,
      frame: getSimulationFrame(parsedProgram, 0, 1),
      isPlaying: false,
      selectedLineNumber: null,
    });
  },
}));
