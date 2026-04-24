"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useSimulationStore } from "@/lib/state/simulation-store";
import type * as MonacoNamespace from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function GCodeEditorPanel() {
  const editorRef =
    useRef<MonacoNamespace.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof MonacoNamespace | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const gcode = useSimulationStore((state) => state.gcode);
  const setGCode = useSimulationStore((state) => state.setGCode);
  const loadExample = useSimulationStore((state) => state.loadExample);
  const activeExampleId = useSimulationStore((state) => state.activeExampleId);
  const availableExamples = useSimulationStore((state) => state.availableExamples);
  const diagnostics = useSimulationStore((state) => state.parsedProgram.diagnostics);
  const selectedLine = useSimulationStore((state) => state.selectedLineNumber);
  const selectLine = useSimulationStore((state) => state.selectLine);
  const [selectedExampleId, setSelectedExampleId] = useState(
    availableExamples[0]?.id ?? "",
  );

  useEffect(() => {
    if (availableExamples.some((example) => example.id === activeExampleId)) {
      setSelectedExampleId(activeExampleId);
    }
  }, [activeExampleId, availableExamples]);

  const markers = useMemo(
    () =>
      diagnostics.map((diagnostic) => ({
        startLineNumber: diagnostic.lineNumber,
        endLineNumber: diagnostic.lineNumber,
        startColumn: 1,
        endColumn: 999,
        message: diagnostic.message,
        severity: diagnostic.severity === "error" ? 8 : diagnostic.severity === "warning" ? 4 : 2,
      })),
    [diagnostics],
  );

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!model || !monacoRef.current) {
      return;
    }
    monacoRef.current.editor.setModelMarkers(model, "owner", markers);
  }, [markers]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || selectedLine == null) {
      return;
    }

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
      {
        range: {
          startLineNumber: selectedLine,
          endLineNumber: selectedLine,
          startColumn: 1,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: "cnc-active-line",
          glyphMarginClassName: "cnc-active-line-glyph",
        },
      },
    ]);
    editor.revealLineInCenter(selectedLine);
  }, [selectedLine]);

  const selectedExample =
    availableExamples.find((example) => example.id === activeExampleId) ?? null;

  return (
    <PanelShell
      title="G-Code-Editor"
      subtitle="Schreibe hier deinen G-Code und prüfe Zeile für Zeile, was die Maschine lernen und fahren würde"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
            value={selectedExampleId}
            onChange={(event) => setSelectedExampleId(event.target.value)}
          >
            {availableExamples.map((example) => (
              <option key={example.id} value={example.id}>
                {example.title}
              </option>
            ))}
          </select>
          <button
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
            onClick={() => loadExample(selectedExampleId)}
          >
            Beispiel laden
          </button>
        </div>
      }
    >
      <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ausgewähltes Beispiel</p>
        <p className="mt-2 text-sm font-semibold text-cyan-100">
          {selectedExample?.title ?? "Eigener G-Code"}
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {selectedExample?.description ??
            "Du bearbeitest gerade einen eigenen oder veränderten G-Code."}
        </p>
      </div>
      <div className="overflow-hidden rounded-[26px] border border-slate-800">
        <MonacoEditor
          height="460px"
          defaultLanguage="plaintext"
          language="plaintext"
          theme="vs-dark"
          value={gcode}
          onChange={(value) => setGCode(value ?? "")}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            monaco.editor.defineTheme("cnc-master", {
              base: "vs-dark",
              inherit: true,
              rules: [
                { token: "gcode.motion", foreground: "49d6ff", fontStyle: "bold" },
                { token: "gcode.feed", foreground: "53d2a8" },
                { token: "gcode.spindle", foreground: "f5b942" },
                { token: "gcode.comment", foreground: "6f86a0", fontStyle: "italic" },
              ],
              colors: {
                "editor.background": "#050d18",
                "editorLineNumber.foreground": "#52718c",
                "editorCursor.foreground": "#49d6ff",
                "editor.lineHighlightBackground": "#0b1d31",
                "editor.selectionBackground": "#13395d",
              },
            });

            monaco.languages.register({ id: "gcode" });
            monaco.languages.setMonarchTokensProvider("gcode", {
              tokenizer: {
                root: [
                  [/\(.*?\)|;.*/, "gcode.comment"],
                  [/\bG0?\d\b/i, "gcode.motion"],
                  [/\bM0?\d\b/i, "gcode.spindle"],
                  [/\b[FS]\d+(\.\d+)?\b/i, "gcode.feed"],
                  [/\b[TXYZIJKR]-?\d+(\.\d+)?\b/i, "identifier"],
                ],
              },
            });

            monaco.editor.setTheme("cnc-master");
            if (editor.getModel()) {
              monaco.editor.setModelLanguage(editor.getModel()!, "gcode");
              monaco.editor.setModelMarkers(editor.getModel()!, "owner", markers);
            }

            editor.onDidChangeCursorPosition((event) => {
              selectLine(event.position.lineNumber);
            });
          }}
          options={{
            fontSize: 14,
            fontFamily: "JetBrains Mono, Consolas, monospace",
            minimap: { enabled: false },
            smoothScrolling: true,
            padding: { top: 18, bottom: 18 },
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            glyphMargin: true,
          }}
        />
      </div>
      {selectedLine ? (
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          Aktive Editorzeile: {selectedLine}
        </p>
      ) : null}
    </PanelShell>
  );
}
