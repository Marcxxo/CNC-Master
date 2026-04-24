"use client";

import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";
import { explainLineInGerman, GCODE_REFERENCE } from "@/lib/data/learning";

export function LearningPanel() {
  const selectedLine = useSimulationStore((state) => state.selectedLineNumber);
  const lines = useSimulationStore((state) => state.parsedProgram.lines);

  const lineSource = lines.find((line) => line.lineNumber === selectedLine)?.source ?? "";

  return (
    <PanelShell title="Lernhilfe" subtitle="Kurzreferenz und einfache Zeilenerklärung">
      <div className="rounded-3xl border border-cyan-400/15 bg-slate-950/50 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Aktive Zeile</p>
        <p className="mt-2 font-mono text-sm text-cyan-100">
          {selectedLine ? `N${selectedLine}: ${lineSource || "(leer)"}` : "Noch keine Zeile ausgewählt"}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{explainLineInGerman(lineSource)}</p>
      </div>

      <div className="mt-5 grid gap-3">
        {GCODE_REFERENCE.map((entry) => (
          <div
            key={entry.code}
            className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-sm text-cyan-200">{entry.code}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {entry.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{entry.description}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

