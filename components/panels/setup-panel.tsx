"use client";

import type { ChangeEvent } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";

const numberValue = (event: ChangeEvent<HTMLInputElement>) => Number(event.target.value);

export function SetupPanel() {
  const workpiece = useSimulationStore((state) => state.workpiece);
  const tool = useSimulationStore((state) => state.tool);
  const setWorkpiece = useSimulationStore((state) => state.setWorkpiece);
  const setTool = useSimulationStore((state) => state.setTool);

  return (
    <div className="space-y-5">
      <PanelShell title="Werkstueck" subtitle="Rohteil, Material und Nullpunkt">
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
            <span className="field-label">Hoehe Z (mm)</span>
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
              <option value="top-front-left">Top-front-left</option>
              <option value="top-center">Top-center</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label>
            <span className="field-label">Safe Z (mm)</span>
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

      <PanelShell title="Werkzeug" subtitle="MVP-Endmill und Basisparameter">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Werkzeugtyp</span>
            <input className="field-input" value="Flat End Mill" readOnly />
          </label>
          <label>
            <span className="field-label">Werkzeugnummer T</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={tool.toolNumber}
              onChange={(event) =>
                setTool({ ...tool, toolNumber: numberValue(event) })
              }
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
              onChange={(event) =>
                setTool({ ...tool, diameter: numberValue(event) })
              }
            />
          </label>
          <label>
            <span className="field-label">Schneidenlaenge (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={tool.fluteLength}
              onChange={(event) =>
                setTool({ ...tool, fluteLength: numberValue(event) })
              }
            />
          </label>
          <label>
            <span className="field-label">Gesamtlaenge (mm)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={tool.totalLength}
              onChange={(event) =>
                setTool({ ...tool, totalLength: numberValue(event) })
              }
            />
          </label>
          <label>
            <span className="field-label">Drehzahl S</span>
            <input
              className="field-input"
              type="number"
              min={0}
              value={tool.spindleSpeed}
              onChange={(event) =>
                setTool({ ...tool, spindleSpeed: numberValue(event) })
              }
            />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Vorschub F (mm/min)</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={tool.feedRate}
              onChange={(event) =>
                setTool({ ...tool, feedRate: numberValue(event) })
              }
            />
          </label>
        </div>
      </PanelShell>
    </div>
  );
}
