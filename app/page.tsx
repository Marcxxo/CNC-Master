"use client";

import { DiagnosticsPanel } from "@/components/panels/diagnostics-panel";
import { LearningPanel } from "@/components/panels/learning-panel";
import { SetupPanel } from "@/components/panels/setup-panel";
import { GCodeEditorPanel } from "@/components/editor/gcode-editor";
import { Viewer3D } from "@/components/viewer/viewer-3d";
import { useSimulationStore } from "@/lib/state/simulation-store";

export default function HomePage() {
  const diagnostics = useSimulationStore((state) => state.parsedProgram.diagnostics);
  const moves = useSimulationStore((state) => state.parsedProgram.moves);
  const material = useSimulationStore((state) => state.workpiece.material);

  return (
    <main className="min-h-screen p-4 text-slate-50 md:p-6">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-6">
        <header className="glass-panel rounded-[34px] px-6 py-6 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="pill">CNC Learning Simulator</span>
              <h1
                className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CNC Master
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Definiere dein Rohteil, schreibe G-Code, pruefe Sicherheitsregeln und
                beobachte die Werkzeugbahn in einer klaren 3D-Lernumgebung. Die
                Architektur ist bewusst modular aufgebaut, damit spaeter realistischere
                Kinematik, Materialmodelle und Postprozessoren anschliessen koennen.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Material</p>
                <p className="mt-2 text-lg font-semibold capitalize text-cyan-100">{material}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Moves</p>
                <p className="mt-2 text-lg font-semibold text-cyan-100">{moves.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Diagnostics</p>
                <p className="mt-2 text-lg font-semibold text-cyan-100">{diagnostics.length}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_480px]">
          <div className="space-y-6">
            <SetupPanel />
            <LearningPanel />
          </div>

          <div className="min-h-[720px]">
            <Viewer3D />
          </div>

          <div className="space-y-6">
            <GCodeEditorPanel />
            <DiagnosticsPanel />
          </div>
        </section>
      </div>
    </main>
  );
}
