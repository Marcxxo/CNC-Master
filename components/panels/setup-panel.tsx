"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";
import type { ToolCategory } from "@/lib/cnc/types";
import { TOOL_CATEGORY_LABELS, TOOL_MATERIAL_LABELS } from "@/lib/data/tool-library";

const numberValue = (event: ChangeEvent<HTMLInputElement>) => Number(event.target.value);

export function SetupPanel() {
  const [activeTab, setActiveTab] = useState<"workpiece" | "tools">("workpiece");

  const workpiece = useSimulationStore((state) => state.workpiece);
  const toolLibrary = useSimulationStore((s) => s.toolLibrary);
  const parsedProgram = useSimulationStore((s) => s.parsedProgram);
  const setWorkpiece = useSimulationStore((state) => state.setWorkpiece);
  const setTool = useSimulationStore((state) => state.setTool);
  const setActiveTool = useSimulationStore((state) => state.setActiveTool);
  const applyToolTemplate = useSimulationStore((state) => state.applyToolTemplate);

  const activeTool =
    toolLibrary.tools.find((t) => t.id === toolLibrary.activeTool) ?? toolLibrary.tools[0];

  const usedToolNumbers = new Set(
    parsedProgram.moves
      .filter((m) => m.type === "tool-change")
      .map((m) => (m as { toolNumber: number }).toolNumber),
  );

  const vc = (Math.PI * activeTool.diameter * activeTool.spindleSpeed) / 1000;

  const originLabels: Record<typeof workpiece.originMode, string> = {
    "top-front-left": "Oben vorne links",
    "top-center": "Oben mittig",
    custom: "Benutzerdefiniert",
  };

  return (
    <PanelShell title="Einrichtung" subtitle="Werkstück und Werkzeugbibliothek">
      {/* Tab bar */}
      <div className="mb-5 flex gap-2">
        {(["workpiece", "tools"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? "rounded-full border border-cyan-400/50 bg-cyan-400/15 px-4 py-1.5 text-sm font-medium text-cyan-100 transition"
                : "rounded-full border border-slate-700 px-4 py-1.5 text-sm text-slate-400 transition hover:border-slate-500 hover:text-slate-300"
            }
          >
            {tab === "workpiece" ? "Werkstück" : "Werkzeuge"}
          </button>
        ))}
      </div>

      {/* Tab 1 – Werkstück */}
      {activeTab === "workpiece" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Breite X (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={workpiece.width}
              onChange={(event) => setWorkpiece({ ...workpiece, width: numberValue(event) })}
            />
          </label>
          <label>
            <span className="field-label">Tiefe Y (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={workpiece.depth}
              onChange={(event) => setWorkpiece({ ...workpiece, depth: numberValue(event) })}
            />
          </label>
          <label>
            <span className="field-label">Höhe Z (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={workpiece.height}
              onChange={(event) => setWorkpiece({ ...workpiece, height: numberValue(event) })}
            />
          </label>
          <label>
            <span className="field-label">Material</span>
            <select
              className="field-input"
              value={workpiece.material}
              onChange={(event) =>
                setWorkpiece({
                  ...workpiece,
                  material: event.target.value as typeof workpiece.material,
                })
              }
            >
              <option value="aluminum">Aluminium</option>
              <option value="steel">Stahl</option>
              <option value="plastic">Kunststoff</option>
              <option value="wood">Holz</option>
            </select>
          </label>
          <label>
            <span className="field-label">Nullpunkt</span>
            <select
              className="field-input"
              value={workpiece.originMode}
              onChange={(event) =>
                setWorkpiece({
                  ...workpiece,
                  originMode: event.target.value as typeof workpiece.originMode,
                })
              }
            >
              <option value="top-front-left">{originLabels["top-front-left"]}</option>
              <option value="top-center">{originLabels["top-center"]}</option>
              <option value="custom">{originLabels.custom}</option>
            </select>
          </label>
          <label>
            <span className="field-label">Sichere Z-Höhe (mm)</span>
            <input
              className="field-input"
              type="number"
              min={0}
              value={workpiece.safeZ}
              onChange={(event) => setWorkpiece({ ...workpiece, safeZ: numberValue(event) })}
            />
          </label>
        </div>
      )}

      {/* Tab 2 – Werkzeuge */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          {/* T1–T9 slot selector */}
          <div className="flex flex-wrap gap-1.5">
            {toolLibrary.tools.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={[
                  "relative rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  t.id === toolLibrary.activeTool
                    ? "border-cyan-400 bg-slate-700 text-cyan-100"
                    : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                T{t.id}
                {usedToolNumbers.has(t.id) && (
                  <span className="absolute -right-0.5 -top-0.5 block h-2 w-2 rounded-full bg-green-400" />
                )}
              </button>
            ))}
          </div>

          {/* Tool form */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Vorlage – full width */}
            <label className="sm:col-span-2">
              <span className="field-label">Vorlage</span>
              <select
                className="field-input"
                value={activeTool.category}
                onChange={(event) =>
                  applyToolTemplate(activeTool.id, event.target.value as ToolCategory)
                }
              >
                {Object.entries(TOOL_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-label">Durchmesser (mm)</span>
              <input
                className="field-input"
                type="number"
                min={0.1}
                step="0.1"
                value={activeTool.diameter}
                onChange={(event) => setTool(activeTool.id, { diameter: numberValue(event) })}
              />
            </label>
            <label>
              <span className="field-label">Schneiden</span>
              <input
                className="field-input"
                type="number"
                min={1}
                max={12}
                value={activeTool.fluteCount}
                onChange={(event) => setTool(activeTool.id, { fluteCount: numberValue(event) })}
              />
            </label>

            <label>
              <span className="field-label">Gesamtlänge (mm)</span>
              <input
                className="field-input"
                type="number"
                min={1}
                value={activeTool.length}
                onChange={(event) => setTool(activeTool.id, { length: numberValue(event) })}
              />
            </label>
            <label>
              <span className="field-label">Schneidenlänge (mm)</span>
              <input
                className="field-input"
                type="number"
                min={1}
                value={activeTool.cuttingLength}
                onChange={(event) => setTool(activeTool.id, { cuttingLength: numberValue(event) })}
              />
            </label>

            <label>
              <span className="field-label">Material</span>
              <select
                className="field-input"
                value={activeTool.material}
                onChange={(event) =>
                  setTool(activeTool.id, {
                    material: event.target.value as keyof typeof TOOL_MATERIAL_LABELS,
                  })
                }
              >
                {Object.entries(TOOL_MATERIAL_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Drehzahl S (U/min)</span>
              <input
                className="field-input"
                type="number"
                min={0}
                value={activeTool.spindleSpeed}
                onChange={(event) => setTool(activeTool.id, { spindleSpeed: numberValue(event) })}
              />
            </label>

            <label className="sm:col-span-2">
              <span className="field-label">Vorschub F (mm/min)</span>
              <input
                className="field-input"
                type="number"
                min={1}
                value={activeTool.feedRate}
                onChange={(event) => setTool(activeTool.id, { feedRate: numberValue(event) })}
              />
            </label>

            <label className="sm:col-span-2">
              <span className="field-label">Notiz</span>
              <input
                className="field-input"
                type="text"
                placeholder="Freitext..."
                value={activeTool.notes}
                onChange={(event) => setTool(activeTool.id, { notes: event.target.value })}
              />
            </label>
          </div>

          <hr className="border-slate-800" />

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
            <p className="text-sm font-semibold text-cyan-100">
              Vc = {vc.toFixed(1)} m/min
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Schnittgeschwindigkeit (Richtwert)</p>
          </div>
        </div>
      )}
    </PanelShell>
  );
}
