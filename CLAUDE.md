# CNC Master – Claude Context

## Was ist dieses Projekt?
Deutschsprachige Lern- und Simulationsplattform für CNC G-Code.
Zielgruppe: Berufsschüler und CNC-Einsteiger.
Deployed auf: cnc-master-ten.vercel.app

## Tech Stack
- Next.js 15, React, TypeScript
- React Three Fiber + Three.js (3D Viewer)
- Zustand (State Management, simulation-store.ts)
- Monaco Editor (G-Code Editor)
- Vitest (Tests)

## Projektstruktur
app/                          Next.js App Router
components/
  editor/gcode-editor.tsx     Monaco Editor
  panels/
    setup-panel.tsx           Werkstück + Werkzeug-Tabs (T1–T9)
    diagnostics-panel.tsx     Warnungen, Fehler, Info-Diagnostics
    learning-panel.tsx        G-Code Erklärungen mit Skill-Toggle
  viewer/viewer-3d.tsx        Three.js Szene, VoxelMesh, ToolpathLines
  panel-shell.tsx             Wrapper-Komponente für alle Panels
lib/
  cnc/
    types.ts                  Alle Typen – ParsedMove Union, Tool,
                              ToolLibrary, CuttingMode, DiagnosticCode
    parser.ts                 G-Code Parser → ParsedMove[]
    validator.ts              Regelbasierte Validierung → Diagnostic[]
    arcs.ts                   G02/G03 Kreisinterpolation
    simulation.ts             Frame-Berechnung für Playback
    voxel.ts                  2.5D Heightmap Voxel-Engine
  data/
    tool-library.ts           Tool-Vorlagen, createDefaultToolLibrary()
    learning.ts               Lerninhalte pro G-Code + Skill-Level
    examples.ts               Beispiel-G-Code Programme
  state/
    simulation-store.ts       Zentraler Zustand (Zustand)

## Architektur-Entscheidungen

### ParsedMove Union
Moves sind typisiert als ParsedMove = SimulationMove | ToolChangeMove | WcsMove
isSimulationMove() type guard vorhanden.
Nur SimulationMoves fließen in Simulation, Voxel, Viewer.

### Tool System
toolLibrary: ToolLibrary im Store (9 Slots T1–T9).
getActiveTool() als interne Store-Closure.
toToolDefinition() als Adapter für Parser/Validator (LegacyToolDefinition).
setTool(tNumber, updates) – rebuildet Label, triggert _rebuildVoxelGrid bei diameter-Änderung.

### Voxel Engine
2.5D Heightmap (Float32Array), Resolution 0.5mm.
currentTopZ: absolute Höhe vom Boden (0=Boden, workpieceHeight=Oberfläche).
G-Code Z ist negativ beim Schneiden → cz = workpieceHeight + gcodeZ.
Grid startet leer, wird live via tick() → updateVoxelToFrame(moveIndex) aufgebaut.
Rendering: InstancedMesh in viewer-3d.tsx (VoxelMesh Komponente).

### Gleich-/Gegenlauf
CuttingMode: 'climb' | 'conventional' | 'unknown'
Parser trackt spindleDirection (M03→cw, M04→ccw, M05→null).
ArcMove.cuttingMode via computeCuttingMode(arcDir, spindleDir).
Farben im Viewer: grün=climb, orange=conventional, lila=unknown.
React key muss type+cuttingMode+id enthalten (nicht nur id) –
sonst LineMaterial-Reconciliation-Bug.

## Code-Konventionen
- Sprache: Deutsche UI-Texte, englischer Code
- Imports: @/ Alias (nicht relative ../.. Pfade)
- Keine neuen CSS-Frameworks – bestehende Klassen weiterverwenden
- Neue Logik-Dateien in lib/cnc/ ohne Three.js/React Imports
- Bestehende Typen nie löschen – deprecaten und Alias anlegen
- Immer npx tsc --noEmit + npm test vor jedem Commit
- Commit-Messages: "feat:", "fix:", "test:", "docs:" Präfix

## Aktueller Stand / Was zuletzt gebaut wurde
- Voxel-Zerspanung live während Playback (0.5mm Auflösung)
- Multi-Werkzeug T1–T9 mit Vorlagen-Panel und Vc-Rechner
- T1 M6 Parser, G54–G59 als WcsMove (kein UNKNOWN_COMMAND)
- Gleich-/Gegenlauf-Erkennung mit farbiger Toolpath-Darstellung
- Learning Panel mit Skill-Toggle (Anfänger/Fortgeschritten/Profi)
- 31 Tests grün

## Bekannte Einschränkungen (MVP)
- Material Removal ist 2.5D – keine Hinterschneidungen
- G02/G03 Helix (simultane Z-Bewegung) experimentell
- Nur für Lernzwecke, kein echtes CAM-System
- Gleich-/Gegenlauf nur für Kreisbewegungen (G02/G03),
  nicht für G01 Linearbewegungen (zu komplex für MVP)

## Nächste geplante Features
- Zyklen-Generator: Tasche, Nut, Bohrung als Parameter-Dialog
  der fertigen G-Code generiert
- DXF-Import (längerfristig)
