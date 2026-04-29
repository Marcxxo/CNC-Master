import { describe, expect, it } from "vitest";
import { parseGCode } from "@/lib/cnc/parser";
import { DEFAULT_TOOL, DEFAULT_WORKPIECE } from "@/lib/cnc/defaults";
import { BUILTIN_EXAMPLES } from "@/lib/data/examples";

describe("T+M6 Werkzeugwechsel", () => {
  it("T1 M6 erzeugt einen tool-change Move mit toolNumber=1", () => {
    const result = parseGCode("T1 M6", DEFAULT_WORKPIECE, DEFAULT_TOOL);
    const move = result.moves.find((m) => m.type === "tool-change");
    expect(move).toBeDefined();
    expect((move as { toolNumber: number }).toolNumber).toBe(1);
  });

  it("T1M6 (kein Leerzeichen) erzeugt einen tool-change Move mit toolNumber=1", () => {
    const result = parseGCode("T1M6", DEFAULT_WORKPIECE, DEFAULT_TOOL);
    const move = result.moves.find((m) => m.type === "tool-change");
    expect(move).toBeDefined();
    expect((move as { toolNumber: number }).toolNumber).toBe(1);
  });

  it("T2 M6 erzeugt einen tool-change Move mit toolNumber=2", () => {
    const result = parseGCode("T2 M6", DEFAULT_WORKPIECE, DEFAULT_TOOL);
    const move = result.moves.find((m) => m.type === "tool-change");
    expect(move).toBeDefined();
    expect((move as { toolNumber: number }).toolNumber).toBe(2);
  });

  it("T1 ohne M6 erzeugt Warnung TOOL_WITHOUT_M6 und keinen tool-change Move", () => {
    const result = parseGCode("T1", DEFAULT_WORKPIECE, DEFAULT_TOOL);
    expect(result.diagnostics.some((d) => d.code === "TOOL_WITHOUT_M6")).toBe(true);
    expect(result.moves.filter((m) => m.type === "tool-change")).toHaveLength(0);
  });

  it("M6 ohne T erzeugt Warnung MISSING_TOOL_NUMBER", () => {
    const result = parseGCode("M6", DEFAULT_WORKPIECE, DEFAULT_TOOL);
    expect(result.diagnostics.some((d) => d.code === "MISSING_TOOL_NUMBER")).toBe(true);
  });
});

describe("G54–G59 WCS-Unterstützung", () => {
  it("G54 erzeugt keinen UNKNOWN_COMMAND und einen wcs Move", () => {
    const result = parseGCode("G54", DEFAULT_WORKPIECE, DEFAULT_TOOL);
    expect(result.diagnostics.some((d) => d.code === "UNKNOWN_COMMAND")).toBe(false);
    const wcsMove = result.moves.find((m) => m.type === "wcs");
    expect(wcsMove).toBeDefined();
    expect((wcsMove as { wcsNumber: number }).wcsNumber).toBe(54);
  });
});

describe("Werkzeugwechsel-Beispiel", () => {
  it("parst korrekt: 2 tool-change Moves, keine UNKNOWN_COMMAND oder TOOL_WITHOUT_M6", () => {
    const example = BUILTIN_EXAMPLES.find((e) => e.id === "tool-change");
    expect(example).toBeDefined();

    const result = parseGCode(example!.gcode, example!.workpiece, example!.tool);

    const toolChanges = result.moves.filter((m) => m.type === "tool-change");
    expect(toolChanges).toHaveLength(2);
    expect((toolChanges[0] as { toolNumber: number }).toolNumber).toBe(1);
    expect((toolChanges[1] as { toolNumber: number }).toolNumber).toBe(2);

    expect(result.diagnostics.some((d) => d.code === "UNKNOWN_COMMAND")).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "TOOL_WITHOUT_M6")).toBe(false);
  });
});
