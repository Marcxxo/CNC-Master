import * as THREE from "three";
import type { SimulationMove } from "@/lib/cnc/types";

export const toThreePosition = (x: number, y: number, z: number) =>
  new THREE.Vector3(x, z, y);

export const buildPathPoints = (moves: SimulationMove[], filter?: (move: SimulationMove) => boolean) =>
  moves
    .filter((move) => (filter ? filter(move) : true))
    .flatMap((move) =>
      move.pathPoints.map((point) => toThreePosition(point.x, point.y, point.z)),
    );
