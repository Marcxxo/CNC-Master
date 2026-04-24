import type { Vector3 } from "@/lib/cnc/types";
import { clamp, distance3D, lerp } from "@/lib/cnc/utils";

interface ArcInterpolationInput {
  from: Vector3;
  to: Vector3;
  centerOffsetI: number;
  centerOffsetJ: number;
  clockwise: boolean;
}

const TAU = Math.PI * 2;
const DEFAULT_MAX_SEGMENT_ANGLE = Math.PI / 18;

const normalizeAngle = (angle: number) => {
  let normalized = angle % TAU;
  if (normalized < 0) {
    normalized += TAU;
  }
  return normalized;
};

const getSweepAngle = (startAngle: number, endAngle: number, clockwise: boolean) => {
  const normalizedStart = normalizeAngle(startAngle);
  const normalizedEnd = normalizeAngle(endAngle);

  if (clockwise) {
    const sweep = normalizedStart - normalizedEnd;
    return sweep <= 0 ? sweep + TAU : sweep;
  }

  const sweep = normalizedEnd - normalizedStart;
  return sweep <= 0 ? sweep + TAU : sweep;
};

export const interpolateArcXY = ({
  from,
  to,
  centerOffsetI,
  centerOffsetJ,
  clockwise,
}: ArcInterpolationInput): Vector3[] => {
  const center = {
    x: from.x + centerOffsetI,
    y: from.y + centerOffsetJ,
    z: from.z,
  };

  const radius = Math.hypot(from.x - center.x, from.y - center.y);
  const endRadius = Math.hypot(to.x - center.x, to.y - center.y);

  if (radius <= 0.0001 || Math.abs(radius - endRadius) > 0.05) {
    return [from, to];
  }

  const startAngle = Math.atan2(from.y - center.y, from.x - center.x);
  const endAngle = Math.atan2(to.y - center.y, to.x - center.x);
  const sweepAngle = getSweepAngle(startAngle, endAngle, clockwise);
  const segmentCount = Math.max(8, Math.ceil(sweepAngle / DEFAULT_MAX_SEGMENT_ANGLE));

  const points: Vector3[] = [];

  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = clamp(index / segmentCount, 0, 1);
    const angle = clockwise
      ? startAngle - sweepAngle * progress
      : startAngle + sweepAngle * progress;

    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
      z: lerp(from.z, to.z, progress),
    });
  }

  points[0] = from;
  points[points.length - 1] = to;

  return points;
};

export const getPathLength = (pathPoints: Vector3[]) => {
  let length = 0;

  for (let index = 1; index < pathPoints.length; index += 1) {
    length += distance3D(pathPoints[index - 1], pathPoints[index]);
  }

  return length;
};

export const getPointAlongPath = (pathPoints: Vector3[], progress: number) => {
  if (!pathPoints.length) {
    return { x: 0, y: 0, z: 0 };
  }

  if (pathPoints.length === 1) {
    return pathPoints[0];
  }

  const targetDistance = getPathLength(pathPoints) * clamp(progress, 0, 1);
  let traversed = 0;

  for (let index = 1; index < pathPoints.length; index += 1) {
    const start = pathPoints[index - 1];
    const end = pathPoints[index];
    const segmentLength = distance3D(start, end);

    if (traversed + segmentLength >= targetDistance) {
      const segmentProgress =
        segmentLength <= 0.0001 ? 1 : (targetDistance - traversed) / segmentLength;
      return {
        x: lerp(start.x, end.x, segmentProgress),
        y: lerp(start.y, end.y, segmentProgress),
        z: lerp(start.z, end.z, segmentProgress),
      };
    }

    traversed += segmentLength;
  }

  return pathPoints[pathPoints.length - 1];
};
