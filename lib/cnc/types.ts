export type MaterialType = "aluminum" | "steel" | "plastic" | "wood";
export type OriginMode = "top-front-left" | "top-center" | "custom";
export type MotionType = "rapid" | "cut" | "arc";
export type DiagnosticSeverity = "error" | "warning" | "info";
export type UnitMode = "mm" | "inch";
export type PositionMode = "absolute" | "incremental";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface WorkpieceDefinition {
  width: number;
  depth: number;
  height: number;
  material: MaterialType;
  originMode: OriginMode;
  customOrigin?: Vector3;
  safeZ: number;
}

export interface ToolDefinition {
  type: "flat-end-mill";
  diameter: number;
  fluteLength: number;
  totalLength: number;
  toolNumber: number;
  spindleSpeed: number;
  feedRate: number;
}

export interface GCodeWord {
  letter: string;
  value: number | string;
  raw: string;
}

export interface ParsedLine {
  lineNumber: number;
  source: string;
  sanitized: string;
  words: GCodeWord[];
  comment?: string;
}

export interface MachineState {
  position: Vector3;
  spindleOn: boolean;
  feedRate?: number;
  spindleSpeed?: number;
  toolNumber?: number;
  unitMode: UnitMode;
  positionMode: PositionMode;
}

export interface SimulationMove {
  id: string;
  lineNumber: number;
  type: MotionType;
  from: Vector3;
  to: Vector3;
  feedRate?: number;
  spindleOn: boolean;
  isCutting: boolean;
  warnings: string[];
}

export interface Diagnostic {
  id: string;
  lineNumber: number;
  severity: DiagnosticSeverity;
  code: string;
  message: string;
}

export interface ParsedProgram {
  lines: ParsedLine[];
  moves: SimulationMove[];
  diagnostics: Diagnostic[];
  finalState: MachineState;
}

export interface SimulationFrame {
  moveIndex: number;
  progress: number;
  position: Vector3;
  activeLineNumber: number | null;
}
