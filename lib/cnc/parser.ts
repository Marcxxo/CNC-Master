import { DEFAULT_TOOL } from "@/lib/cnc/defaults";
import { interpolateArcXY } from "@/lib/cnc/arcs";
import type {
  Diagnostic,
  GCodeWord,
  MachineState,
  ParsedLine,
  ParsedProgram,
  PlaneMode,
  PositionMode,
  SimulationMove,
  Vector3,
} from "@/lib/cnc/types";
import { validateProgram } from "@/lib/cnc/validator";
import type { ToolDefinition, WorkpieceDefinition } from "@/lib/cnc/types";

const MOTION_CODES = new Set(["G0", "G00", "G1", "G01", "G2", "G02", "G3", "G03"]);
const SUPPORTED_CODES = new Set([
  "G0",
  "G00",
  "G1",
  "G01",
  "G2",
  "G02",
  "G3",
  "G03",
  "G17",
  "G18",
  "G19",
  "G20",
  "G21",
  "G90",
  "G91",
  "M3",
  "M03",
  "M5",
  "M05",
]);

const emptyState = (): MachineState => ({
  position: { x: 0, y: 0, z: 0 },
  spindleOn: false,
  feedRate: undefined,
  spindleSpeed: undefined,
  toolNumber: undefined,
  unitMode: "mm",
  positionMode: "absolute",
  planeMode: "XY",
});

const cleanLine = (line: string) => {
  const bracketComments = [...line.matchAll(/\((.*?)\)/g)].map((match) => match[1]).join(" ");
  const noBracket = line.replace(/\(.*?\)/g, " ");
  const semicolonIndex = noBracket.indexOf(";");
  const comment =
    semicolonIndex >= 0
      ? [bracketComments, noBracket.slice(semicolonIndex + 1).trim()].filter(Boolean).join(" ")
      : bracketComments;
  const sanitized = (semicolonIndex >= 0 ? noBracket.slice(0, semicolonIndex) : noBracket).trim();
  return { sanitized, comment: comment || undefined };
};

const parseWords = (sanitized: string): GCodeWord[] => {
  const matches = sanitized.match(/[A-Z][-+]?\d*\.?\d+/gi) ?? [];
  return matches.map((raw) => {
    const letter = raw[0].toUpperCase();
    const numeric = Number(raw.slice(1));
    return {
      letter,
      value: Number.isNaN(numeric) ? raw.slice(1) : numeric,
      raw: `${letter}${raw.slice(1)}`,
    };
  });
};

const getAxisValue = (
  current: number,
  nextValue: number | undefined,
  mode: PositionMode,
) => {
  if (nextValue === undefined) {
    return current;
  }

  return mode === "absolute" ? nextValue : current + nextValue;
};

const getPlaneMode = (code: string): PlaneMode | null => {
  if (code === "G17") {
    return "XY";
  }
  if (code === "G18") {
    return "XZ";
  }
  if (code === "G19") {
    return "YZ";
  }
  return null;
};

const buildParsedLines = (source: string): ParsedLine[] =>
  source.split(/\r?\n/).map((line, index) => {
    const { sanitized, comment } = cleanLine(line);
    return {
      lineNumber: index + 1,
      source: line,
      sanitized,
      comment,
      words: parseWords(sanitized),
    };
  });

export const parseGCode = (
  source: string,
  workpiece?: WorkpieceDefinition,
  tool?: ToolDefinition,
): ParsedProgram => {
  const diagnostics: Diagnostic[] = [];
  const lines = buildParsedLines(source);
  const moves: SimulationMove[] = [];
  const state = emptyState();
  let activeMotion: string | null = null;

  // Future extension point:
  // here we can inject machine-specific modal groups, canned cycles,
  // tool tables, and controller dialect rules without changing the UI layer.
  for (const line of lines) {
    if (!line.sanitized) {
      continue;
    }

    const axisValues: Partial<Vector3> = {};
    let centerOffsetI: number | undefined;
    let centerOffsetJ: number | undefined;

    for (const word of line.words) {
      if (word.letter === "G" || word.letter === "M") {
        const normalized = `${word.letter}${Number(word.value)}`;
        if (!SUPPORTED_CODES.has(normalized)) {
          diagnostics.push({
            id: `${line.lineNumber}-${normalized}-unknown`,
            lineNumber: line.lineNumber,
            severity: "error",
            code: "UNKNOWN_COMMAND",
            message: `Unbekannter oder noch nicht unterstützter Befehl: ${normalized}`,
          });
        }

        if (MOTION_CODES.has(normalized)) {
          activeMotion = normalized;
        }

        if (normalized === "G90") {
          state.positionMode = "absolute";
        }
        if (normalized === "G91") {
          state.positionMode = "incremental";
        }
        if (normalized === "G20") {
          state.unitMode = "inch";
        }
        if (normalized === "G21") {
          state.unitMode = "mm";
        }

        const nextPlane = getPlaneMode(normalized);
        if (nextPlane) {
          state.planeMode = nextPlane;
        }

        if (normalized === "M3" || normalized === "M03") {
          state.spindleOn = true;
        }
        if (normalized === "M5" || normalized === "M05") {
          state.spindleOn = false;
        }
      }

      if (word.letter === "F" && typeof word.value === "number") {
        state.feedRate = word.value;
      }

      if (word.letter === "S" && typeof word.value === "number") {
        state.spindleSpeed = word.value;
      }

      if (word.letter === "T" && typeof word.value === "number") {
        state.toolNumber = word.value;
      }

      if (word.letter === "X" && typeof word.value === "number") {
        axisValues.x = word.value;
      }
      if (word.letter === "Y" && typeof word.value === "number") {
        axisValues.y = word.value;
      }
      if (word.letter === "Z" && typeof word.value === "number") {
        axisValues.z = word.value;
      }
      if (word.letter === "I" && typeof word.value === "number") {
        centerOffsetI = word.value;
      }
      if (word.letter === "J" && typeof word.value === "number") {
        centerOffsetJ = word.value;
      }
    }

    const hasMotion =
      !!activeMotion &&
      (axisValues.x !== undefined || axisValues.y !== undefined || axisValues.z !== undefined);
    if (!hasMotion) {
      continue;
    }

    const nextPosition = {
      x: getAxisValue(state.position.x, axisValues.x, state.positionMode),
      y: getAxisValue(state.position.y, axisValues.y, state.positionMode),
      z: getAxisValue(state.position.z, axisValues.z, state.positionMode),
    };

    const moveType =
      activeMotion === "G1" || activeMotion === "G01"
        ? "cut"
        : activeMotion === "G2" || activeMotion === "G02" || activeMotion === "G3" || activeMotion === "G03"
          ? "arc"
          : "rapid";

    const canInterpolateArc =
      moveType === "arc" &&
      state.planeMode === "XY" &&
      centerOffsetI !== undefined &&
      centerOffsetJ !== undefined &&
      !line.words.some((word) => word.letter === "R");

    const pathPoints =
      canInterpolateArc && centerOffsetI !== undefined && centerOffsetJ !== undefined
        ? interpolateArcXY({
            from: { ...state.position },
            to: nextPosition,
            centerOffsetI,
            centerOffsetJ,
            clockwise: activeMotion === "G2" || activeMotion === "G02",
          })
        : [{ ...state.position }, nextPosition];

    moves.push({
      id: `move-${line.lineNumber}-${moves.length}`,
      lineNumber: line.lineNumber,
      type: moveType,
      from: { ...state.position },
      to: nextPosition,
      feedRate: state.feedRate ?? DEFAULT_TOOL.feedRate,
      spindleOn: state.spindleOn,
      isCutting: moveType !== "rapid",
      warnings: [],
      pathPoints,
      arc: canInterpolateArc && centerOffsetI !== undefined && centerOffsetJ !== undefined
        ? {
            center: {
              x: state.position.x + centerOffsetI,
              y: state.position.y + centerOffsetJ,
              z: state.position.z,
            },
            clockwise: activeMotion === "G2" || activeMotion === "G02",
            plane: "XY",
            radius: Math.hypot(centerOffsetI, centerOffsetJ),
          }
        : undefined,
    });

    state.position = nextPosition;
  }

  const validationDiagnostics = validateProgram(lines, moves, state, workpiece, tool);

  return {
    lines,
    moves,
    diagnostics: [...diagnostics, ...validationDiagnostics].sort((a, b) => a.lineNumber - b.lineNumber),
    finalState: state,
  };
};
