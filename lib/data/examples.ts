import type { ToolDefinition, WorkpieceDefinition } from "@/lib/cnc/types";

export interface BuiltInExample {
  id: string;
  title: string;
  description: string;
  gcode: string;
  workpiece: WorkpieceDefinition;
  tool?: ToolDefinition;
}

export const BUILTIN_EXAMPLES: BuiltInExample[] = [
  {
    id: "linear-slot",
    title: "Lineare Bearbeitung mit Nut",
    description:
      "Einfaches Beispiel mit G0 und G1: erst eine gestufte lineare Bearbeitung, danach eine gerade Nut.",
    workpiece: {
      width: 80,
      depth: 80,
      height: 40,
      material: "aluminum",
      originMode: "top-front-left",
      safeZ: 8,
    },
    gcode: `%
(Lineare Bearbeitung mit Nut)
G21
G17
G90
T1 M6
S12000 M3
F450
G0 X15 Y15 Z8
G1 Z-2
G1 X65
G1 Y65
G1 X15
G1 Y15
G0 Z8
G0 X20 Y20
G1 Z-6
G1 X60
G1 Y60
G1 X20
G1 Y20
G0 Z8
G0 X20 Y40
G1 Z-10
G1 X60
G0 Z8
M5
%`,
  },
  {
    id: "arc-contour",
    title: "Kontur mit G2/G3",
    description:
      "Ruhige Kontur mit Kreisbögen in G17 auf der XY-Ebene. Gut geeignet zum Lernen von I- und J-Werten.",
    workpiece: {
      width: 80,
      depth: 80,
      height: 40,
      material: "aluminum",
      originMode: "top-front-left",
      safeZ: 8,
    },
    gcode: `%
(CNC Master Demo-Kontur mit G2/G3)
G21
G17
G90
T1 M6
S12000 M3
F500
G0 X45 Y25 Z8
G1 Z-2
G1 X60 Y25
G2 X75 Y40 I0 J15
G1 X75 Y55
G3 X60 Y70 I-15 J0
G1 X45 Y70
G2 X30 Y55 I0 J-15
G1 X30 Y40
G3 X45 Y25 I15 J0
G0 Z8
M5
%`,
  },
  {
    id: "tool-change",
    title: "Werkzeugwechsel T1–T2",
    description:
      "Zwei Werkzeuge in einem Programm: Schaftfräser für Konturbearbeitung, danach Bohrer für eine Tiefenbohrung.",
    workpiece: {
      width: 80,
      depth: 60,
      height: 20,
      material: "aluminum",
      originMode: "top-front-left",
      safeZ: 5,
    },
    gcode: `(Werkzeugwechsel T1-T2)
G21 G90 G54
T1 M6
M03 S3000
G00 X10 Y10 Z5
G01 Z-5 F100
G01 X50 F300
G01 Z5
M05
T2 M6
M03 S2000
G00 X20 Y20 Z5
G01 Z-15 F80
G01 Z5
M05
M30`,
  },
];

export const DEFAULT_EXAMPLE_ID = BUILTIN_EXAMPLES[0].id;

export const getBuiltInExample = (id: string) =>
  BUILTIN_EXAMPLES.find((example) => example.id === id) ?? BUILTIN_EXAMPLES[0];

export const SAMPLE_GCODE = getBuiltInExample("arc-contour").gcode;
