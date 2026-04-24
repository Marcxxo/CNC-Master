import type { Vector3 } from "@/lib/cnc/types";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

export const lerpVector = (from: Vector3, to: Vector3, progress: number): Vector3 => ({
  x: lerp(from.x, to.x, progress),
  y: lerp(from.y, to.y, progress),
  z: lerp(from.z, to.z, progress),
});

export const distance3D = (from: Vector3, to: Vector3) =>
  Math.sqrt(
    (to.x - from.x) ** 2 + (to.y - from.y) ** 2 + (to.z - from.z) ** 2,
  );

export const round = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
