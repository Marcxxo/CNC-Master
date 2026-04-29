"use client";

import { create } from "zustand";
import { parseGCode } from "@/lib/cnc/parser";
import { getSimulationFrame, getTotalRuntime } from "@/lib/cnc/simulation";
import type {
  ParsedProgram,
  SimulationFrame,
  Tool,
  ToolCategory,
  ToolDefinition,
  ToolLibrary,
  WorkpieceDefinition,
} from "@/lib/cnc/types";
import {
  type VoxelGrid,
  applyMovesToGrid,
  createVoxelGrid,
  resetVoxelGrid,
} from "@/lib/cnc/voxel";
import {
  applyTemplate,
  buildToolLabel,
  createDefaultToolLibrary,
} from "@/lib/data/tool-library";
import {
  BUILTIN_EXAMPLES,
  DEFAULT_EXAMPLE_ID,
  getBuiltInExample,
} from "@/lib/data/examples";

interface SimulationStore {
  activeExampleId: string;
  availableExamples: typeof BUILTIN_EXAMPLES;
  workpiece: WorkpieceDefinition;
  toolLibrary: ToolLibrary;
  gcode: string;
  parsedProgram: ParsedProgram;
  selectedLineNumber: number | null;
  isPlaying: boolean;
  playbackSpeed: number;
  elapsedSeconds: number;
  runtimeSeconds: number;
  frame: SimulationFrame;
  voxelGrid: VoxelGrid | null;
  setWorkpiece: (value: WorkpieceDefinition) => void;
  setTool: (tNumber: number, updates: Partial<Tool>) => void;
  setActiveTool: (tNumber: number) => void;
  applyToolTemplate: (tNumber: number, category: ToolCategory) => void;
  setGCode: (value: string) => void;
  selectLine: (value: number | null) => void;
  setPlaybackSpeed: (value: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  tick: (deltaSeconds: number) => void;
  loadExample: (exampleId: string) => void;
  updateVoxelToFrame: (moveIndex: number) => void;
}

const toToolDefinition = (tool: Tool): ToolDefinition => ({
  type: "flat-end-mill",
  diameter: tool.diameter,
  fluteLength: tool.cuttingLength,
  totalLength: tool.length,
  toolNumber: tool.id,
  spindleSpeed: tool.spindleSpeed,
  feedRate: tool.feedRate,
});

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

const initialExample = getBuiltInExample(DEFAULT_EXAMPLE_ID);
const initialToolLibrary = createDefaultToolLibrary();
const _initActiveTool =
  initialToolLibrary.tools.find((t) => t.id === initialToolLibrary.activeTool) ??
  initialToolLibrary.tools[0];

const initialDerived = buildDerivedSimulation({
  gcode: initialExample.gcode,
  workpiece: initialExample.workpiece,
  tool: toToolDefinition(_initActiveTool),
  elapsedSeconds: 0,
  playbackSpeed: 1,
});

export const useSimulationStore = create<SimulationStore>((set, get) => {
  const _rebuildVoxelGrid = () => {
    const { workpiece } = get();
    if (!workpiece) {
      set({ voxelGrid: null });
      return;
    }
    const grid = createVoxelGrid(workpiece, 0.5);
    set({ voxelGrid: { ...grid } });
  };

  const getActiveTool = (): Tool => {
    const { toolLibrary } = get();
    return (
      toolLibrary.tools.find((t) => t.id === toolLibrary.activeTool) ??
      toolLibrary.tools[0]
    );
  };

  return {
    activeExampleId: initialExample.id,
    availableExamples: BUILTIN_EXAMPLES,
    workpiece: initialExample.workpiece,
    toolLibrary: initialToolLibrary,
    gcode: initialExample.gcode,
    parsedProgram: initialDerived.parsedProgram,
    selectedLineNumber: null,
    isPlaying: false,
    playbackSpeed: 1,
    elapsedSeconds: 0,
    runtimeSeconds: initialDerived.runtimeSeconds,
    frame: initialDerived.frame,
    voxelGrid: { ...createVoxelGrid(initialExample.workpiece, 0.5) },
    setWorkpiece: (workpiece) => {
      const { gcode, elapsedSeconds, playbackSpeed } = get();
      const derived = buildDerivedSimulation({
        gcode,
        workpiece,
        tool: toToolDefinition(getActiveTool()),
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
    setTool: (tNumber, updates) => {
      const { toolLibrary } = get();
      const tools = toolLibrary.tools.map((t) => {
        if (t.id !== tNumber) return t;
        const updated = { ...t, ...updates };
        return { ...updated, label: buildToolLabel(updated) };
      });
      if ("diameter" in updates) _rebuildVoxelGrid();
      set({ toolLibrary: { ...toolLibrary, tools } });
    },
    setActiveTool: (tNumber) => {
      const { toolLibrary } = get();
      set({ toolLibrary: { ...toolLibrary, activeTool: tNumber } });
    },
    applyToolTemplate: (tNumber, category) => {
      const { toolLibrary } = get();
      const tools = toolLibrary.tools.map((t) =>
        t.id !== tNumber ? t : applyTemplate(t, category),
      );
      set({ toolLibrary: { ...toolLibrary, tools } });
    },
    setGCode: (gcode) => {
      const { workpiece, playbackSpeed } = get();
      const derived = buildDerivedSimulation({
        gcode,
        workpiece,
        tool: toToolDefinition(getActiveTool()),
        elapsedSeconds: 0,
        playbackSpeed,
      });
      set({
        activeExampleId: "custom",
        gcode,
        parsedProgram: derived.parsedProgram,
        elapsedSeconds: 0,
        runtimeSeconds: derived.runtimeSeconds,
        frame: derived.frame,
        isPlaying: false,
        selectedLineNumber: null,
      });
      _rebuildVoxelGrid();
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
        voxelGrid: null,
      });
      _rebuildVoxelGrid();
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

      const currentMove = parsedProgram.moves[frame.moveIndex];
      if (currentMove?.type === "tool-change") {
        get().setActiveTool(currentMove.toolNumber);
      }

      if (get().voxelGrid !== null) {
        get().updateVoxelToFrame(frame.moveIndex);
      }
    },
    loadExample: (exampleId) => {
      const example = getBuiltInExample(exampleId);
      const derived = buildDerivedSimulation({
        gcode: example.gcode,
        workpiece: example.workpiece,
        tool: toToolDefinition(getActiveTool()),
        elapsedSeconds: 0,
        playbackSpeed: 1,
      });
      set({
        activeExampleId: example.id,
        workpiece: example.workpiece,
        gcode: example.gcode,
        parsedProgram: derived.parsedProgram,
        elapsedSeconds: 0,
        runtimeSeconds: derived.runtimeSeconds,
        playbackSpeed: 1,
        frame: derived.frame,
        isPlaying: false,
        selectedLineNumber: null,
      });
    },
    updateVoxelToFrame: (moveIndex) => {
      const grid = get().voxelGrid;
      if (!grid) {
        return;
      }
      resetVoxelGrid(grid);
      applyMovesToGrid(grid, get().parsedProgram.moves, getActiveTool().diameter / 2, moveIndex);
      set({ voxelGrid: { ...grid } });
    },
  };
});
