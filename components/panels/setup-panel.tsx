"use client";

import type { ChangeEvent } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";

const numberValue = (event: ChangeEvent<HTMLInputElement>) => Number(event.target.value);

export function SetupPanel() {
  const workpiece = useSimulationStore((state) => state.workpiece);
  const toolLibrary = useSimulationStore((s) => s.toolLibrary);
  const tool = toolLibrary.tools.find((t) => t.id === toolLibrary.activeTool) ?? toolLibrary.tools[0];
  const setWorkpiece = useSimulationStore((state) => state.setWorkpiece);
  const setTool = useSimulationStore((state) => state.setTool);
  const setActiveTool = useSimulationStore((state) => state.setActiveTool);

  const originLabels: Record<typeof workpiece.originMode, string> = {
    "top-front-left": "Oben vorne links",
    "top-center": "Oben mittig",
    custom: "Benutzerdefiniert",
  };

  return (
    <div className="space-y-5">
      <PanelShell title="Werkstück" subtitle="Rohteil, Material und Nullpunkt">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Breite X (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={workpiece.width}
              onChange={(event) =>
                setWorkpiece({ ...workpiece, width: numberValue(event) })
              }
            />
          </label>
          <label>
            <span className="field-label">Tiefe Y (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={workpiece.depth}
              onChange={(event) =>
                setWorkpiece({ ...workpiece, depth: numberValue(event) })
              }
            />
          </label>
          <label>
            <span className="field-label">Höhe Z (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={workpiece.height}
              onChange={(event) =>
                setWorkpiece({ ...workpiece, height: numberValue(event) })
              }
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
              onChange={(event) =>
                setWorkpiece({ ...workpiece, safeZ: numberValue(event) })
              }
            />
          </label>
        </div>
      </PanelShell>

      <PanelShell title="Werkzeug" subtitle="Flachfräser und Grundparameter">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Werkzeugtyp</span>
            <input className="field-input" value="Flachfräser" readOnly />
          </label>
          <label>
            <span className="field-label">Werkzeugnummer T</span>
            <input
              className="field-input"
              type="number"
              min={1}
              max={9}
              value={tool.id}
              onChange={(event) => setActiveTool(numberValue(event))}
            />
          </label>
          <label>
            <span className="field-label">Durchmesser (mm)</span>
            <input
              className="field-input"
              type="number"
              min={0.1}
              step="0.1"
              value={tool.diameter}
              onChange={(event) => setTool(tool.id, { diameter: numberValue(event) })}
            />
          </label>
          <label>
            <span className="field-label">Schneidenlänge (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={tool.cuttingLength}
              onChange={(event) => setTool(tool.id, { cuttingLength: numberValue(event) })}
            />
          </label>
          <label>
            <span className="field-label">Gesamtlänge (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={tool.length}
              onChange={(event) => setTool(tool.id, { length: numberValue(event) })}
            />
          </label>
          <label>
            <span className="field-label">Spindeldrehzahl S</span>
            <input
              className="field-input"
              type="number"
              min={0}
              value={tool.spindleSpeed}
              onChange={(event) => setTool(tool.id, { spindleSpeed: numberValue(event) })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Vorschub F (mm/min)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={tool.feedRate}
              onChange={(event) => setTool(tool.id, { feedRate: numberValue(event) })}
            />
          </label>
        </div>
      </PanelShell>
    </div>
  );
}
