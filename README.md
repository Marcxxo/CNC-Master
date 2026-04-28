# CNC Master

Deutschsprachige Lern- und Simulationsplattform für CNC G-Code.
Anfänger können G-Code schreiben, Warnungen bekommen und die
Werkzeugbewegung in einer live 2.5D-Voxel-Simulation verfolgen.

## Features

- G-Code Editor mit Syntax-Highlighting (Monaco Editor)
- Zeilenweise Analyse auf Deutsch — Anfänger / Fortgeschritten / Profi
- Live 2.5D Voxel-Simulation: Materialzerspanung sichtbar während Playback
- G2/G3 Kreisinterpolation (IJ- und R-Variante)
- Regelbasierte Validierung: fehlende Spindel, Z-Übertiefung, G90/G91-Mix
- Schnittgeschwindigkeit / Drehzahl / Vorschub Rechner

## Tech Stack

- Next.js 14 · React · TypeScript
- Three.js / React Three Fiber
- Zustand · Monaco Editor · Vitest

## Lokale Entwicklung

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 16 Tests (parser, arcs, voxel, learning)
npx tsc --noEmit   # Type-Check
```

## Projektstruktur

```
app/                        Next.js App Router
components/
  editor/gcode-editor.tsx   Monaco Editor Integration
  panels/                   Diagnostics, Learning, Setup
  viewer/viewer-3d.tsx      Three.js Szene + VoxelMesh
lib/
  cnc/                      Parser, Validator, Arcs, Voxel-Engine
  data/                     Lerninhalte, Beispiel-Programme
  state/simulation-store.ts Zentraler Zustand (Zustand)
```

## Bekannte Einschränkungen (MVP)

- Material Removal ist 2.5D — keine Hinterschneidungen simulierbar
- Ausschließlich für Lernzwecke, kein echtes CAM-System
- G2/G3 Helix (simultane Z-Bewegung) experimentell

## Lizenz

MIT
