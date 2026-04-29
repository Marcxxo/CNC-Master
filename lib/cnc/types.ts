export type MaterialType = "aluminum" | "steel" | "plastic" | "wood";
export type OriginMode = "top-front-left" | "top-center" | "custom";
export type MotionType = "rapid" | "cut" | "arc";
export type DiagnosticSeverity = "error" | "warning" | "info";
export type UnitMode = "mm" | "inch";
export type PositionMode = "absolute" | "incremental";
export type PlaneMode = "XY" | "XZ" | "YZ";

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

/** @deprecated Use Tool instead */
export interface LegacyToolDefinition {
  type: "flat-end-mill";
  diameter: number;
  fluteLength: number;
  totalLength: number;
  toolNumber: number;
  spindleSpeed: number;
  feedRate: number;
}

/** @deprecated Use Tool instead — kept for backward compatibility */
export type ToolDefinition = LegacyToolDefinition;

export type ToolCategory =
  | "schaftfraeser"
  | "kantenfraeser"
  | "bohrer"
  | "senker"
  | "gewindefraeser"
  | "kugelfraeser";

export type ToolMaterial = "hss" | "vhm" | "beschichtet";

export interface Tool {
  id: number;
  label: string;
  category: ToolCategory;
  diameter: number;
  fluteCount: number;
  length: number;
  cuttingLength: number;
  material: ToolMaterial;
  spindleSpeed: number;
  feedRate: number;
  notes: string;
}

export interface ToolLibrary {
  tools: Tool[];
  activeTool: number;
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
  planeMode: PlaneMode;
}

export interface ArcDefinition {
  center: Vector3;
  clockwise: boolean;
  plane: "XY";
  radius: number;
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
  pathPoints: Vector3[];
  arc?: ArcDefinition;
}

export interface ToolChangeMove {
  type: "tool-change";
  id: string;
  lineNumber: number;
  toolNumber: number;
}

export interface WcsMove {
  type: "wcs";
  id: string;
  lineNumber: number;
  wcsNumber: number;
}

export type ParsedMove = SimulationMove | ToolChangeMove | WcsMove;

export function isSimulationMove(move: ParsedMove): move is SimulationMove {
  return move.type === "rapid" || move.type === "cut" || move.type === "arc";
}

export type DiagnosticCode =
  | "UNKNOWN_COMMAND"
  | "TOOL_WITHOUT_M6"
  | "MISSING_TOOL_NUMBER"
  | "INCH_MODE"
  | "MISSING_FEED"
  | "UNSUPPORTED_PLANE_G18"
  | "UNSUPPORTED_PLANE_G19"
  | "UNSUPPORTED_R_ARC"
  | "MISSING_ARC_CENTER"
  | "INVALID_COORDINATE"
  | "MISSING_SPINDLE_SPEED"
  | "FEED_REQUIRED"
  | "SPINDLE_OFF"
  | "UNSAFE_RAPID_Z"
  | "TOO_DEEP"
  | "BOUNDARY_COLLISION"
  | "OUTSIDE_STOCK"
  | "FLUTE_LIMIT";

export interface Diagnostic {
  id: string;
  lineNumber: number;
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
}

export interface ParsedProgram {
  lines: ParsedLine[];
  moves: ParsedMove[];
  diagnostics: Diagnostic[];
  finalState: MachineState;
}

export interface SimulationFrame {
  moveIndex: number;
  progress: number;
  position: Vector3;
  activeLineNumber: number | null;
}
