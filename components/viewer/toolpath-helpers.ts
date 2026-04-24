import * as THREE from "three";
import type { SimulationMove, Vector3 } from "@/lib/cnc/types";

interface ScenePointOptions {
  verticalOffset?: number;
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
