export type BlueprintPoint = { x: number; y: number };

/**
 * Build an SVG path from an orthogonal polyline, replacing every interior 90°
 * corner with a quadratic fillet. The fillet is clamped to half of each
 * adjoining segment, so short detours cannot overshoot.
 */
export function roundedPolyline(points: BlueprintPoint[], radius: number) {
  const clean = points.filter(
    (point, index) =>
      index === 0 ||
      Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) > 0.5
  );

  let d = `M ${clean[0].x.toFixed(2)} ${clean[0].y.toFixed(2)}`;

  for (let i = 1; i < clean.length - 1; i += 1) {
    const previous = clean[i - 1];
    const current = clean[i];
    const next = clean[i + 1];

    const inX = previous.x - current.x;
    const inY = previous.y - current.y;
    const outX = next.x - current.x;
    const outY = next.y - current.y;
    const inLength = Math.hypot(inX, inY);
    const outLength = Math.hypot(outX, outY);

    if (!inLength || !outLength || inX * outY - inY * outX === 0) {
      d += ` L ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
      continue;
    }

    const fillet = Math.min(radius, inLength / 2, outLength / 2);
    const start = {
      x: current.x + (inX / inLength) * fillet,
      y: current.y + (inY / inLength) * fillet,
    };
    const end = {
      x: current.x + (outX / outLength) * fillet,
      y: current.y + (outY / outLength) * fillet,
    };

    d += ` L ${start.x.toFixed(2)} ${start.y.toFixed(2)} Q ${current.x.toFixed(
      2
    )} ${current.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  }

  const last = clean[clean.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}
