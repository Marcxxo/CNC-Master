import { getPathLength, getPointAlongPath } from "@/lib/cnc/arcs";
import type { ParsedProgram, SimulationFrame, SimulationMove } from "@/lib/cnc/types";
import { clamp, distance3D, lerpVector } from "@/lib/cnc/utils";

const BASE_MM_PER_SECOND = 45;

export const getMoveDuration = (move: SimulationMove, speedMultiplier: number) => {
  // Future extension point:
  // replace this timing model with acceleration curves, machine limits,
  // jerk control, and controller-specific rapid behavior.
  const distance =
    move.pathPoints.length > 1 ? getPathLength(move.pathPoints) : distance3D(move.from, move.to);
  const effectiveSpeed =
    move.type === "rapid"
      ? BASE_MM_PER_SECOND * 2.4 * speedMultiplier
      : Math.max((move.feedRate ?? 300) / 60, 1) * speedMultiplier;
  return distance <= 0.001 ? 0.01 : distance / effectiveSpeed;
};

export const getSimulationFrame = (
  program: ParsedProgram,
  elapsedSeconds: number,
  speedMultiplier: number,
): SimulationFrame => {
  if (!program.moves.length) {
    return {
      moveIndex: 0,
      progress: 0,
      position: { x: 0, y: 0, z: 0 },
      activeLineNumber: null,
    };
  }

  let remaining = elapsedSeconds;

  for (let index = 0; index < program.moves.length; index += 1) {
    const move = program.moves[index];
    const duration = getMoveDuration(move, speedMultiplier);

    if (remaining <= duration || index === program.moves.length - 1) {
      const progress = duration === 0 ? 1 : clamp(remaining / duration, 0, 1);
      return {
        moveIndex: index,
        progress,
        position:
          move.pathPoints.length > 1
            ? getPointAlongPath(move.pathPoints, progress)
            : lerpVector(move.from, move.to, progress),
        activeLineNumber: move.lineNumber,
      };
    }

    remaining -= duration;
  }

  const lastMove = program.moves[program.moves.length - 1];
  return {
    moveIndex: program.moves.length - 1,
    progress: 1,
    position: lastMove.to,
    activeLineNumber: lastMove.lineNumber,
  };
};

export const getTotalRuntime = (program: ParsedProgram, speedMultiplier: number) =>
  program.moves.reduce((sum, move) => sum + getMoveDuration(move, speedMultiplier), 0);
