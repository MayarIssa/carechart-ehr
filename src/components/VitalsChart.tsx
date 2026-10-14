"use client";

import type { Vitals } from "@/lib/schema";
import { formatDate } from "./ui";

/**
 * Blood-pressure trend: a band per reading from diastolic to systolic,
 * drawn against the 130/80 line where stage 1 hypertension starts.
 */
export function BloodPressureChart({ readings }: { readings: Vitals[] }) {
  const data = [...readings].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
  if (data.length < 2) {
    return (
      <p className="text-sm text-ink-soft">
        {data.length === 0 ? "No readings yet." : "Record one more reading to see the trend."}
      </p>
    );
  }

  const W = 640;
  const H = 220;
  const pad = { l: 40, r: 16, t: 14, b: 30 };
  const lo = Math.min(60, ...data.map((d) => d.diastolic)) - 5;
  const hi = Math.max(160, ...data.map((d) => d.systolic)) + 5;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (data.length - 1);
  const y = (v: number) => pad.t + ((hi - v) * (H - pad.t - pad.b)) / (hi - lo);
  const ticks = [60, 80, 100, 120, 140, 160].filter((t) => t > lo && t < hi);
  const line = (key: "systolic" | "diastolic") => data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");

  const latest = data[data.length - 1];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label={`Blood pressure over ${data.length} readings, latest ${latest.systolic}/${latest.diastolic}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-rule)" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-soft)">{t}</text>
          </g>
        ))}
        {/* Stage 1 thresholds */}
        <line x1={pad.l} x2={W - pad.r} y1={y(130)} y2={y(130)} stroke="var(--color-warn)" strokeDasharray="4 4" strokeWidth="1.2" />
        <line x1={pad.l} x2={W - pad.r} y1={y(80)} y2={y(80)} stroke="var(--color-warn)" strokeDasharray="4 4" strokeWidth="1.2" />

        {data.map((d, i) => (
          <line key={d.id} x1={x(i)} x2={x(i)} y1={y(d.systolic)} y2={y(d.diastolic)}
            stroke="var(--color-scrub-tint)" strokeWidth="14" strokeLinecap="round" />
        ))}
        <path d={line("systolic")} fill="none" stroke="var(--color-scrub)" strokeWidth="2.2" />
        <path d={line("diastolic")} fill="none" stroke="var(--color-scrub)" strokeWidth="2.2" strokeOpacity="0.55" />
        {data.map((d, i) => (
          <g key={d.id + "-pts"}>
            <circle cx={x(i)} cy={y(d.systolic)} r="4" fill="var(--color-sheet)" stroke="var(--color-scrub)" strokeWidth="2" />
            <circle cx={x(i)} cy={y(d.diastolic)} r="4" fill="var(--color-sheet)" stroke="var(--color-scrub)" strokeOpacity="0.55" strokeWidth="2" />
            <text x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--color-ink-soft)">
              {formatDate(d.recordedOn)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-scrub" /> Systolic</span>
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-scrub/55" /> Diastolic</span>
        <span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-warn" /> 130/80, where stage 1 hypertension starts</span>
      </figcaption>
    </figure>
  );
}
