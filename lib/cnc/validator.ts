import { DEFAULT_TOOL, DEFAULT_WORKPIECE } from "@/lib/cnc/defaults";
import type {
  Diagnostic,
  MachineState,
  ParsedLine,
  SimulationMove,
  ToolDefinition,
  WorkpieceDefinition,
} from "@/lib/cnc/types";
import { isFiniteNumber } from "@/lib/cnc/utils";

const makeDiagnostic = (
  lineNumber: number,
  severity: Diagnostic["severity"],
  code: string,
  message: string,
): Diagnostic => ({
  id: `${lineNumber}-${code}-${message}`,
  lineNumber,
  severity,
  code,
  message,
});

export const validateProgram = (
  lines: ParsedLine[],
  moves: SimulationMove[],
  state: MachineState,
  workpiece: WorkpieceDefinition = DEFAULT_WORKPIECE,
  tool: ToolDefinition = DEFAULT_TOOL,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  let activePlane: "XY" | "XZ" | "YZ" = "XY";

  if (state.unitMode === "inch") {
    diagnostics.push(
      makeDiagnostic(
        1,
        "warning",
        "INCH_MODE",
        "G20 wurde erkannt. Die MVP-Simulation arbeitet intern in Millimetern und zeigt deshalb nur eine Warnung.",
      ),
    );
  }

  for (const line of lines) {
    const hasG1 = line.words.some((word) => word.raw === "G1" || word.raw === "G01");
    const hasFeed = line.words.some((word) => word.letter === "F");
    const hasSpindle = line.words.some((word) => word.raw === "M3" || word.raw === "M03");
    const hasArc = line.words.some((word) => ["G2", "G02", "G3", "G03"].includes(word.raw));
    const hasPlaneXZ = line.words.some((word) => word.raw === "G18");
    const hasPlaneYZ = line.words.some((word) => word.raw === "G19");
    const hasRArc = line.words.some((word) => word.letter === "R");
    const iWord = line.words.find((word) => word.letter === "I");
    const jWord = line.words.find((word) => word.letter === "J");
    const coords = line.words.filter((word) => ["X", "Y", "Z"].includes(word.letter));

    if (line.words.some((word) => word.raw === "G17")) {
      activePlane = "XY";
    }
    if (hasPlaneXZ) {
      activePlane = "XZ";
    }
    if (hasPlaneYZ) {
      activePlane = "YZ";
    }

    if (hasG1 && !hasFeed && !moves.some((move) => move.lineNumber < line.lineNumber && move.feedRate)) {
      diagnostics.push(
        makeDiagnostic(
          line.lineNumber,
          "error",
          "MISSING_FEED",
          "Vor dem ersten G1-Schnitt fehlt eine Vorschubangabe F.",
        ),
      );
    }

    if (hasArc && activePlane !== "XY") {
      diagnostics.push(
        makeDiagnostic(
          line.lineNumber,
          "warning",
          activePlane === "XZ" ? "UNSUPPORTED_PLANE_G18" : "UNSUPPORTED_PLANE_G19",
          "G2/G3 wird aktuell nur in der G17-XY-Ebene interpoliert. Diese Arc-Bewegung wird vereinfacht behandelt.",
        ),
      );
    }

    if (hasArc && hasRArc) {
      diagnostics.push(
        makeDiagnostic(
          line.lineNumber,
          "warning",
          "UNSUPPORTED_R_ARC",
          "R-basierte Boegen werden im MVP noch nicht unterstuetzt. Bitte I/J-Mittelpunktoffsets verwenden.",
        ),
      );
    }

    if (hasArc && !hasRArc && (!isFiniteNumber(iWord?.value) || !isFiniteNumber(jWord?.value))) {
      diagnostics.push(
        makeDiagnostic(
          line.lineNumber,
          "warning",
          "MISSING_ARC_CENTER",
          "Fuer G2/G3 in G17 werden I- und J-Mittelpunktoffsets benoetigt.",
        ),
      );
    }

    for (const coord of coords) {
      if (typeof coord.value !== "number" || Number.isNaN(coord.value)) {
        diagnostics.push(
          makeDiagnostic(
            line.lineNumber,
            "error",
            "INVALID_COORDINATE",
            `Ungueltige Koordinate ${coord.raw}.`,
          ),
        );
      }
    }

    if (hasSpindle && !line.words.some((word) => word.letter === "S")) {
      diagnostics.push(
        makeDiagnostic(
          line.lineNumber,
          "warning",
          "MISSING_SPINDLE_SPEED",
          "Spindelstart ohne S-Wert. Fuer Lernzwecke ist das erlaubt, aber in der Praxis riskant.",
        ),
      );
    }
  }

  let spindleSeen = false;
  let feedSeen = false;

  for (const move of moves) {
    if (move.feedRate) {
      feedSeen = true;
    }
    if (move.spindleOn) {
      spindleSeen = true;
    }

    if (move.type === "cut" && !feedSeen) {
      diagnostics.push(
        makeDiagnostic(
          move.lineNumber,
          "error",
          "FEED_REQUIRED",
          "G1 ohne aktiven Vorschubwert erkannt.",
        ),
      );
    }

    if (move.type === "cut" && !spindleSeen) {
      diagnostics.push(
        makeDiagnostic(
          move.lineNumber,
          "error",
          "SPINDLE_OFF",
          "Schnittbewegung erkannt, obwohl die Spindel nicht gestartet wurde.",
        ),
      );
    }

    if (move.type === "rapid" && move.to.z < workpiece.safeZ) {
      diagnostics.push(
        makeDiagnostic(
          move.lineNumber,
          "warning",
          "UNSAFE_RAPID_Z",
          `Schnellfahrt unter Safe-Z ${workpiece.safeZ} mm erkannt.`,
        ),
      );
    }

    if (move.to.z < -workpiece.height) {
      diagnostics.push(
        makeDiagnostic(
          move.lineNumber,
          "error",
          "TOO_DEEP",
          "Werkzeug faehrt tiefer als die Unterseite des Rohteils.",
        ),
      );
    }

    const radius = tool.diameter / 2;
    const outsideX = move.to.x < radius || move.to.x > workpiece.width - radius;
    const outsideY = move.to.y < radius || move.to.y > workpiece.depth - radius;
    if (outsideX || outsideY) {
      diagnostics.push(
        makeDiagnostic(
          move.lineNumber,
          "warning",
          "BOUNDARY_COLLISION",
          "Werkzeugmittelpunkt plus Durchmesser verlaesst die Werkstueckgrenze.",
        ),
      );
    }

    const outsideVolume =
      move.to.x < 0 ||
      move.to.x > workpiece.width ||
      move.to.y < 0 ||
      move.to.y > workpiece.depth ||
      move.to.z > workpiece.safeZ + workpiece.height;

    if (outsideVolume) {
      diagnostics.push(
        makeDiagnostic(
          move.lineNumber,
          "warning",
          "OUTSIDE_STOCK",
          "Bewegung liegt teilweise ausserhalb des simulierten Rohmaterials.",
        ),
      );
    }

    if (move.to.z < -tool.fluteLength) {
      diagnostics.push(
        makeDiagnostic(
          move.lineNumber,
          "warning",
          "FLUTE_LIMIT",
          "Schnitttiefe ist groesser als die definierte Schneidenlaenge.",
        ),
      );
    }
  }

  return diagnostics;
};
