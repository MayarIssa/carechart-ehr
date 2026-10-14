"use client";

import dynamic from "next/dynamic";

/** Loads the app in the browser only: patient records are read from localStorage, which the server doesn't have. */
export const CareChart = dynamic(() => import("./CareChartApp").then((m) => m.CareChartApp), {
  ssr: false,
  loading: () => <div className="p-8 text-ink-soft">Opening records…</div>,
});
