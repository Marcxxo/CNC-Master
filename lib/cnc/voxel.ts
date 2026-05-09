import type { ParsedMove } from "@/lib/cnc/types";
import { isSimulationMove } from "@/lib/cnc/types";

export interface VoxelGrid {
  cells: Float32Array;
  cols: number;
  rows: number;
  resolution: number;
  originX: number;
  originY: number;
  workpieceHeight: number;
}

export function getCellIndex(grid: VoxelGrid, col: number, row: number): number {
  return col + row * grid.cols;
}

export function createVoxelGrid(
  workpiece: { width: number; depth: number; height: number },
  resolution = 0.5,
): VoxelGrid {
  const cols = Math.max(1, Math.ceil(workpiece.width / resolution));
  const rows = Math.max(1, Math.ceil(workpiece.depth / resolution));
  const cells = new Float32Array(cols * rows).fill(workpiece.height);
  return {
    cells,
    cols,
    rows,
    resolution,
    originX: 0,
    originY: 0,
    workpieceHeight: workpiece.height,
  };
}

/**
 * cz is absolute height from workpiece bottom (0 = bottom, workpieceHeight = top surface).
 * Convert from G-code Z before calling: cz = workpieceHeight + gcodeZ
 */
export function applyToolAtPosition(
  grid: VoxelGrid,
  cx: number,
  cy: number,
  cz: number,
  toolRadius: number,
): void {
  const { cells, cols, rows, resolution, originX, originY } = grid;

  const gridCx = (cx - originX) / resolution;
  const gridCy = (cy - originY) / resolution;
  const gridRadius = toolRadius / resolution;
  const radiusSq = gridRadius * gridRadius;

  const minCol = Math.max(0, Math.floor(gridCx - gridRadius));
  const maxCol = Math.min(cols - 1, Math.ceil(gridCx + gridRadius));
  const minRow = Math.max(0, Math.floor(gridCy - gridRadius));
  const maxRow = Math.min(rows - 1, Math.ceil(gridCy + gridRadius));

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const dx = col + 0.5 - gridCx;
      const dy = row + 0.5 - gridCy;
      if (dx * dx + dy * dy <= radiusSq) {
        const index = getCellIndex(grid, col, row);
        cells[index] = Math.max(0, Math.min(cells[index], cz));
      }
    }
  }
}

export function applyMovesToGrid(
  grid: VoxelGrid,
  moves: ParsedMove[],
  toolRadius: number,
  upToMoveIndex: number,
): void {
  const { resolution, workpieceHeight } = grid;
  const step = resolution / 2;
  const limit = Math.min(upToMoveIndex, moves.length - 1);

  for (let i = 0; i <= limit; i++) {
    const move = moves[i];
    if (!isSimulationMove(move) || move.type === "rapid") {
      continue;
    }

    const points = move.pathPoints;
    if (points.length < 2) {
      continue;
    }

    for (let pi = 0; pi < points.length - 1; pi++) {
      const a = points[pi];
      const b = points[pi + 1];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const segLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (segLength < 0.0001) {
        applyToolAtPosition(grid, a.x, a.y, workpieceHeight + a.z, toolRadius);
        continue;
      }

      const steps = Math.max(1, Math.ceil(segLength / step));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        applyToolAtPosition(
          grid,
          a.x + dx * t,
          a.y + dy * t,
          workpieceHeight + (a.z + dz * t),
          toolRadius,
        );
      }
    }
  }
}

export function resetVoxelGrid(grid: VoxelGrid): void {
  grid.cells.fill(grid.workpieceHeight);
}
