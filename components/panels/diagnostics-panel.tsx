"use client";

import clsx from "clsx";
import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";

const severityIcon = {
  error: CircleAlert,
  warning: AlertTriangle,
  info: Info,
};

const severityClass = {
  error: "border-rose-500/20 bg-rose-500/10 text-rose-100",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-100",
};

export function DiagnosticsPanel() {
  const diagnostics = useSimulationStore((state) => state.parsedProgram.diagnostics);
  const selectLine = useSimulationStore((state) => state.selectLine);

  return (
    <PanelShell
      title="Diagnostik"
      subtitle="Parserfehler, Sicherheitswarnungen und Lernhinweise"
      actions={<span className="pill">{diagnostics.length} Eintraege</span>}
    >
      <div className="space-y-3">
        {diagnostics.length ? (
          diagnostics.map((diagnostic) => {
            const Icon = severityIcon[diagnostic.severity];
            return (
              <button
                key={diagnostic.id}
                className={clsx(
                  "w-full rounded-2xl border p-4 text-left transition hover:border-cyan-400/40 hover:bg-slate-900/70",
                  severityClass[diagnostic.severity],
                )}
                onClick={() => selectLine(diagnostic.lineNumber)}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <p className="text-sm font-semibold">
                      Zeile {diagnostic.lineNumber}: {diagnostic.code}
                    </p>
                    <p className="mt-1 text-sm opacity-90">{diagnostic.message}</p>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            Keine kritischen Probleme erkannt. Die Bahn sieht fuer dieses vereinfachte Modell sicher aus.
          </div>
        )}
      </div>
    </PanelShell>
  );
}
