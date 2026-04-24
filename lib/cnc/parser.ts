import { DEFAULT_TOOL } from "@/lib/cnc/defaults";
import type {
  Diagnostic,
  GCodeWord,
  MachineState,
  ParsedLine,
  ParsedProgram,
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

    const seenTokens = new Set<string>();
    const axisValues: Partial<Vector3> = {};

    for (const word of line.words) {
      const token = `${word.letter}${word.value}`;
      seenTokens.add(token);

      if (word.letter === "G" || word.letter === "M") {
        const normalized = `${word.letter}${Number(word.value)}`;
        if (!SUPPORTED_CODES.has(normalized)) {
          diagnostics.push({
            id: `${line.lineNumber}-${normalized}-unknown`,
            lineNumber: line.lineNumber,
            severity: "error",
            code: "UNKNOWN_COMMAND",
            message: `Unbekannter oder noch nicht unterstuetzter Befehl: ${normalized}`,
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
    }

    const hasMotion = !!activeMotion && (axisValues.x !== undefined || axisValues.y !== undefined || axisValues.z !== undefined);
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
