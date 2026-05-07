import { describe, expect, it } from "vitest";
import type { SimulationMove } from "@/lib/cnc/types";
import {
  applyMovesToGrid,
  applyToolAtPosition,
  createVoxelGrid,
  getCellIndex,
  resetVoxelGrid,
} from "@/lib/cnc/voxel";

const WORKPIECE = { width: 20, depth: 20, height: 10 };
const RESOLUTION = 1.0;

function makeGrid() {
  return createVoxelGrid(WORKPIECE, RESOLUTION);
}

function makeMove(
  pathPoints: { x: number; y: number; z: number }[],
  type: "cut" | "rapid" = "cut",
): SimulationMove {
  return {
    id: "test",
    lineNumber: 1,
    type,
    from: pathPoints[0] ?? { x: 0, y: 0, z: 0 },
    to: pathPoints[pathPoints.length - 1] ?? { x: 0, y: 0, z: 0 },
    spindleOn: true,
    isCutting: type === "cut",
    cuttingMode: "unknown",
    warnings: [],
    pathPoints,
  };
}

describe("createVoxelGrid", () => {
  it("initializes all cells to workpieceHeight", () => {
    const grid = makeGrid();
    const expectedCols = Math.ceil(WORKPIECE.width / RESOLUTION);
    const expectedRows = Math.ceil(WORKPIECE.depth / RESOLUTION);

    expect(grid.cols).toBe(expectedCols);
    expect(grid.rows).toBe(expectedRows);
    expect(grid.cells.length).toBe(expectedCols * expectedRows);

    for (let i = 0; i < grid.cells.length; i++) {
      expect(grid.cells[i]).toBe(WORKPIECE.height);
    }
  });
});

describe("applyToolAtPosition", () => {
  it("lowers cells within toolRadius to cz, leaves outside cells unchanged", () => {
    const grid = makeGrid();
    // cx=5, cy=5 with radius=2: cell (5,5) center=(5.5,5.5) → dist≈0.7 → inside
    //                             cell (0,0) center=(0.5,0.5) → dist≈6.4 → outside
    applyToolAtPosition(grid, 5, 5, 8, 2);

    const insideIdx = getCellIndex(grid, 5, 5);
    const outsideIdx = getCellIndex(grid, 0, 0);

    expect(grid.cells[insideIdx]).toBe(8);
    expect(grid.cells[outsideIdx]).toBe(WORKPIECE.height);
  });

  it("clamps topZ to 0 when cz=0", () => {
    const grid = makeGrid();
    applyToolAtPosition(grid, 5, 5, 0, 2);

    const insideIdx = getCellIndex(grid, 5, 5);
    expect(grid.cells[insideIdx]).toBe(0);
  });

  it("never allows topZ below 0 when cz is negative", () => {
    const grid = makeGrid();
    // cz=-5 simulates a raw G-code Z passed without height conversion (caller error)
    applyToolAtPosition(grid, 5, 5, -5, 2);

    for (let i = 0; i < grid.cells.length; i++) {
      expect(grid.cells[i]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("resetVoxelGrid", () => {
  it("restores all cells to workpieceHeight after a cut", () => {
    const grid = makeGrid();
    applyToolAtPosition(grid, 5, 5, 7, 3);

    // Confirm at least one cell was lowered
    expect(grid.cells[getCellIndex(grid, 5, 5)]).toBeLessThan(WORKPIECE.height);

    resetVoxelGrid(grid);

    for (let i = 0; i < grid.cells.length; i++) {
      expect(grid.cells[i]).toBe(WORKPIECE.height);
    }
  });
});

describe("applyMovesToGrid", () => {
  it("applies only the first move when upToMoveIndex=0", () => {
    const grid = makeGrid();
    const toolRadius = 1.5;

    // Move 0 cuts near (5, 5); move 1 cuts near (15, 15) — no overlap
    const moves: SimulationMove[] = [
      makeMove([
        { x: 4, y: 5, z: -2 },
        { x: 6, y: 5, z: -2 },
      ]),
      makeMove([
        { x: 14, y: 15, z: -2 },
        { x: 16, y: 15, z: -2 },
      ]),
    ];

    applyMovesToGrid(grid, moves, toolRadius, 0);

    // Cell in move-0 area should be cut (cz = height + gcodeZ = 10 + (-2) = 8)
    const cutIdx = getCellIndex(grid, 5, 4);
    expect(grid.cells[cutIdx]).toBe(8);

    // Cell in move-1 area must be untouched
    const untouchedIdx = getCellIndex(grid, 15, 15);
    expect(grid.cells[untouchedIdx]).toBe(WORKPIECE.height);
  });

  it("leaves grid untouched when upToMoveIndex is -1", () => {
    const grid = makeGrid();
    const moves: SimulationMove[] = [
      makeMove([
        { x: 5, y: 5, z: -2 },
        { x: 15, y: 5, z: -2 },
      ]),
    ];

    applyMovesToGrid(grid, moves, 2, -1);

    for (let i = 0; i < grid.cells.length; i++) {
      expect(grid.cells[i]).toBe(WORKPIECE.height);
    }
  });

  it("leaves grid untouched when moves array is empty", () => {
    const grid = makeGrid();
    applyMovesToGrid(grid, [], 2, 0);

    for (let i = 0; i < grid.cells.length; i++) {
      expect(grid.cells[i]).toBe(WORKPIECE.height);
    }
  });

  it("skips rapid moves without cutting any material", () => {
    const grid = makeGrid();
    const rapid = makeMove(
      [
        { x: 5, y: 5, z: 5 },
        { x: 15, y: 5, z: 5 },
      ],
      "rapid",
    );

    applyMovesToGrid(grid, [rapid], 2, 0);

    for (let i = 0; i < grid.cells.length; i++) {
      expect(grid.cells[i]).toBe(WORKPIECE.height);
    }
  });
});
