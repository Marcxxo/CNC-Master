import { describe, expect, it } from "vitest";
import { explainLineInGerman } from "@/lib/data/learning";

describe("explainLineInGerman", () => {
  it("explains G2/G3 lines with direction, I/J meaning, and MVP limits", () => {
    const explanation = explainLineInGerman("G2 X90 Y50 I0 J20");

    expect(explanation).toContain("im Uhrzeigersinn");
    expect(explanation).toContain("I und J");
    expect(explanation).toContain("G17-XY-Ebene");
    expect(explanation).toContain("R-Bögen");
    expect(explanation).toContain("G18");
    expect(explanation).toContain("G19");
  });
});
