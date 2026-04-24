import * as THREE from "three";
import type { SimulationMove, Vector3 } from "@/lib/cnc/types";

interface ScenePointOptions {
  verticalOffset?: number;
}

export interface CutPreviewSegment {
  id: string;
  start: Vector3;
  end: Vector3;
  center: Vector3;
  sceneCenter: THREE.Vector3;
  length: number;
  width: number;
  inset: number;
  angle: number;
  depthLevel: number;
}

export const toSceneVector = (
  point: Vector3,
  options: ScenePointOptions = {},
) => {
  const { verticalOffset = 0 } = options;
  return new THREE.Vector3(point.x, point.z + verticalOffset, point.y);
};

export const toScenePosition = (
  x: number,
  y: number,
  z: number,
  options: ScenePointOptions = {},
) => toSceneVector({ x, y, z }, options);

export const buildScenePathPoints = (
  move: SimulationMove,
  options: ScenePointOptions = {},
) => move.pathPoints.map((point) => toSceneVector(point, options));

export const buildCutPreviewSegments = (
  moves: SimulationMove[],
  toolDiameter: number,
) =>
  moves
    .filter((move) => move.type !== "rapid" && move.to.z < 0)
    .flatMap((move) =>
      move.pathPoints.slice(1).flatMap((point, index) => {
        const start = move.pathPoints[index];
        const end = point;
        const length = Math.hypot(end.x - start.x, end.y - start.y);

        if (length <= 0.001) {
          return [];
        }

        const center = {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          z: (start.z + end.z) / 2,
        };
        const depth = Math.max(Math.abs(start.z), Math.abs(end.z));
        const inset = Math.min(0.22 + depth * 0.08, 1.4);

        return [
          {
            id: `${move.id}-${index}`,
            start,
            end,
            center,
            sceneCenter: toSceneVector(center, { verticalOffset: -inset }),
            length,
            width: Math.max(toolDiameter * 0.92, 1),
            inset,
            angle: Math.atan2(end.y - start.y, end.x - start.x),
            depthLevel: depth,
          },
        ];
      }),
    );
