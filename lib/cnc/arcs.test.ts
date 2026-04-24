import { describe, expect, it } from "vitest";
import { interpolateArcXY } from "@/lib/cnc/arcs";
import { parseGCode } from "@/lib/cnc/parser";
import { getSimulationFrame } from "@/lib/cnc/simulation";
import { SAMPLE_GCODE } from "@/lib/data/sample-gcode";

describe("interpolateArcXY", () => {
  it("builds a clockwise quarter arc in the XY plane", () => {
    const points = interpolateArcXY({
      from: { x: 10, y: 0, z: -2 },
      to: { x: 0, y: -10, z: -2 },
      centerOffsetI: -10,
      centerOffsetJ: 0,
      clockwise: true,
    });

    expect(points.length).toBeGreaterThan(8);
    expect(points[0]).toEqual({ x: 10, y: 0, z: -2 });
    expect(points[points.length - 1]).toEqual({ x: 0, y: -10, z: -2 });
  });
});

describe("parseGCode arc support", () => {
  it("converts G2/G3 with I/J into sampled path points for playback", () => {
    const program = parseGCode([
      "G21",
      "G17",
      "G90",
      "F600",
      "S12000 M3",
      "G0 X10 Y0 Z5",
      "G1 Z-2",
      "G2 X0 Y-10 I-10 J0",
    ].join("\n"));

    const arcMove = program.moves.find((move) => move.type === "arc");

    expect(arcMove).toBeDefined();
    expect(arcMove?.pathPoints.length).toBeGreaterThan(8);
    expect(arcMove?.arc?.plane).toBe("XY");

    const halfway = getSimulationFrame(
      {
        ...program,
        moves: [arcMove!],
      },
      0.5,
      5,
    );

    expect(halfway.position.x).toBeLessThan(10);
    expect(halfway.position.y).toBeLessThan(0);
  });

  it("warns for unsupported R arcs, G18/G19, and missing I/J", () => {
    const program = parseGCode([
      "G21",
      "G18",
      "G2 X10 Z-5 R8",
      "G17",
      "G3 X20 Y20",
    ].join("\n"));

    expect(program.diagnostics.some((item) => item.code === "UNSUPPORTED_PLANE_G18")).toBe(true);
    expect(program.diagnostics.some((item) => item.code === "UNSUPPORTED_R_ARC")).toBe(true);
    expect(program.diagnostics.some((item) => item.code === "MISSING_ARC_CENTER")).toBe(true);
  });

  it("keeps the default sample program free of diagnostics for first impressions", () => {
    const program = parseGCode(SAMPLE_GCODE);

    expect(program.diagnostics).toHaveLength(0);
  });
});
