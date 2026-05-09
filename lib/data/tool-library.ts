import type { Tool, ToolCategory, ToolLibrary, ToolMaterial } from "@/lib/cnc/types";

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  schaftfraeser: "Schaftfräser",
  kantenfraeser: "Kantenfräser",
  bohrer: "Bohrer",
  senker: "Senker",
  gewindefraeser: "Gewindefräser",
  kugelfraeser: "Kugelfräser",
};

export const TOOL_MATERIAL_LABELS: Record<ToolMaterial, string> = {
  hss: "HSS",
  vhm: "VHM",
  beschichtet: "Beschichtet",
};

export const TOOL_TEMPLATES: Record<ToolCategory, Omit<Tool, "id" | "label" | "notes">> = {
  schaftfraeser:  { category: "schaftfraeser",  diameter: 10, fluteCount: 3, length: 72, cuttingLength: 22, material: "vhm", spindleSpeed: 3000, feedRate: 300 },
  kantenfraeser:  { category: "kantenfraeser",  diameter: 10, fluteCount: 2, length: 60, cuttingLength: 15, material: "vhm", spindleSpeed: 2500, feedRate: 200 },
  bohrer:         { category: "bohrer",         diameter:  6, fluteCount: 2, length: 93, cuttingLength: 52, material: "hss", spindleSpeed: 2000, feedRate: 100 },
  senker:         { category: "senker",         diameter: 10, fluteCount: 3, length: 60, cuttingLength: 12, material: "hss", spindleSpeed: 1500, feedRate:  80 },
  gewindefraeser: { category: "gewindefraeser", diameter:  6, fluteCount: 3, length: 58, cuttingLength: 16, material: "vhm", spindleSpeed: 1800, feedRate: 120 },
  kugelfraeser:   { category: "kugelfraeser",   diameter:  8, fluteCount: 2, length: 65, cuttingLength: 20, material: "vhm", spindleSpeed: 3500, feedRate: 250 },
};

export function buildToolLabel(tool: Pick<Tool, "id" | "category" | "diameter">): string {
  return `T${tool.id} – ${TOOL_CATEGORY_LABELS[tool.category]} Ø${tool.diameter}`;
}

export function createDefaultTool(id: number): Tool {
  const template = TOOL_TEMPLATES.schaftfraeser;
  return {
    ...template,
    id,
    label: `T${id} – Leer`,
    notes: "",
  };
}

export function createDefaultToolLibrary(): ToolLibrary {
  return {
    activeTool: 1,
    tools: Array.from({ length: 9 }, (_, i) => createDefaultTool(i + 1)),
  };
}

export function applyTemplate(existing: Tool, category: ToolCategory): Tool {
  const template = TOOL_TEMPLATES[category];
  const updated = { ...existing, ...template, id: existing.id, notes: existing.notes };
  return { ...updated, label: buildToolLabel(updated) };
}
