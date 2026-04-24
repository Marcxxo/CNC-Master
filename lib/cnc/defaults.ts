import type { ToolDefinition, WorkpieceDefinition } from "@/lib/cnc/types";

export const DEFAULT_WORKPIECE: WorkpieceDefinition = {
  width: 120,
  depth: 80,
  height: 25,
  material: "aluminum",
  originMode: "top-front-left",
  safeZ: 5,
};

export const DEFAULT_TOOL: ToolDefinition = {
  type: "flat-end-mill",
  diameter: 10,
  fluteLength: 18,
  totalLength: 55,
  toolNumber: 1,
  spindleSpeed: 12000,
  feedRate: 600,
};
