import * as THREE from "three";
import type { SimulationMove } from "@/lib/cnc/types";

export const toThreePosition = (x: number, y: number, z: number) =>
  new THREE.Vector3(x, z, y);

export const buildPathPoints = (moves: SimulationMove[], filter?: (move: SimulationMove) => boolean) =>
  moves
    .filter((move) => (filter ? filter(move) : true))
    .flatMap((move) => [toThreePosition(move.from.x, move.from.y, move.from.z), toThreePosition(move.to.x, move.to.y, move.to.z)]);
