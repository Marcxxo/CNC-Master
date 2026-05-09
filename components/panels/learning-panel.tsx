"use client";

import { useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";
import { explainLineInGerman, GCODE_REFERENCE } from "@/lib/data/learning";
import { isSimulationMove } from "@/lib/cnc/types";

const SKILL_LABELS = {
  beginner: "Anfänger",
  intermediate: "Fortgeschritten",
  advanced: "Profi",
} as const;

type SkillLevel = keyof typeof SKILL_LABELS;

const CUTTING_MODE_CONFIG = {
  climb: { color: "#4ade80", label: "Gleichlauf (Climb)" },
  conventional: { color: "#fb923c", label: "Gegenlauf (Conventional)" },
  unknown: { color: "#94a3b8", label: "Einstellungsart unbekannt" },
} as const;

export function LearningPanel() {
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const selectedLine = useSimulationStore((state) => state.selectedLineNumber);
  const lines = useSimulationStore((state) => state.parsedProgram.lines);
  const parsedProgram = useSimulationStore((state) => state.parsedProgram);

  const lineSource = lines.find((line) => line.lineNumber === selectedLine)?.source ?? "";

  const activeArcMove = parsedProgram.moves
    .filter(isSimulationMove)
    .find((m) => m.lineNumber === selectedLine && m.type === "arc");

  return (
    <PanelShell title="Lernhilfe" subtitle="Kurzreferenz und einfache Zeilenerklärung">
      <div className="rounded-3xl border border-cyan-400/15 bg-slate-950/50 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Aktive Zeile</p>
        <p className="mt-2 font-mono text-sm text-cyan-100">
          {selectedLine ? `N${selectedLine}: ${lineSource || "(leer)"}` : "Noch keine Zeile ausgewählt"}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{explainLineInGerman(lineSource)}</p>
        {activeArcMove && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CUTTING_MODE_CONFIG[activeArcMove.cuttingMode].color }}
            />
            <span className="text-slate-300">
              {CUTTING_MODE_CONFIG[activeArcMove.cuttingMode].label}
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-1 rounded-2xl border border-slate-800 bg-slate-950/45 p-1">
        {(Object.keys(SKILL_LABELS) as SkillLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setSkillLevel(level)}
            className={`flex-1 rounded-xl py-1.5 text-xs font-medium transition ${
              skillLevel === level
                ? "bg-cyan-400/15 text-cyan-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {SKILL_LABELS[level]}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3">
        {GCODE_REFERENCE.map((entry) => {
          const levelDescription = entry.levels?.[skillLevel];
          return (
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
              <p className="mt-2 text-sm text-slate-300">
                {levelDescription ?? entry.description}
              </p>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}
