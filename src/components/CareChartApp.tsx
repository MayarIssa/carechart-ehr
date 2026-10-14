"use client";

import { useEffect, useMemo, useState } from "react";
import { ageOn, latestVitals, matchesSearch, vitalFlags } from "@/lib/clinical";
import { PatientStore } from "@/lib/store";
import { PatientForm } from "./forms";
import { PatientChart } from "./PatientChart";
import { Button, inputClass, Sheet } from "./ui";

/** Reads the selected patient from the URL hash, so a chart can be bookmarked or reloaded. */
function hashId(): string | null {
  const h = window.location.hash.replace(/^#/, "");
  return h ? decodeURIComponent(h) : null;
}

/**
 * The whole app. It only ever renders in the browser (see ClientOnly.tsx),
 * because the records live in localStorage.
 */
export function CareChartApp() {
  const [store] = useState(() => new PatientStore(window.localStorage));
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<string | null>(() => {
    const fromHash = hashId();
    if (fromHash && store.getPatient(fromHash)) return fromHash;
    // Open on the fullest chart first, so a first-time visitor sees what a record can hold.
    const list = store.listPatients();
    return ([...list].sort((a, b) => b.vitals.length + b.notes.length - (a.vitals.length + a.notes.length))[0] ?? list[0])?.id ?? null;
  });
  const [search, setSearch] = useState("");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const onHash = () => setSelected(hashId());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const select = (id: string | null) => {
    setSelected(id);
    history.replaceState(null, "", id ? `#${encodeURIComponent(id)}` : window.location.pathname);
  };
  const refresh = () => setVersion((v) => v + 1);

  const patients = useMemo(
    () => store.listPatients().filter((p) => matchesSearch(p, search)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` bumps after every store write
    [store, search, version],
  );
  const current = selected ? store.getPatient(selected) : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule bg-sheet">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <rect x="4" y="2" width="20" height="24" rx="3" fill="var(--color-scrub)" />
              <rect x="10" y="0.5" width="8" height="4" rx="1.5" fill="var(--color-scrub-deep)" />
              <path d="M14 9v10M9 14h10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
            <span className="text-lg font-semibold tracking-tight">CareChart</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-ink-soft md:inline">Demo with fictional patients. Data stays in this browser.</span>
            <Button
              variant="quiet"
              onClick={() => {
                if (confirm("Reset all records to the demo patients? Your changes will be lost.")) {
                  store.reset();
                  select(store.listPatients()[0]?.id ?? null);
                  refresh();
                }
              }}
            >
              Reset demo
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                const blob = new Blob([store.exportJson()], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "carechart-export.json";
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              Export JSON
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[19rem_1fr]">
        <aside className="flex min-w-0 flex-col gap-3" aria-label="Patients">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Patients <span className="font-normal text-ink-soft">({patients.length})</span></h2>
            <Button onClick={() => setRegistering(true)}>Register patient</Button>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, MRN or phone"
            aria-label="Search patients"
            className={inputClass}
          />
          <ul className="flex flex-col gap-1.5">
            {patients.map((p) => {
              const v = latestVitals(p);
              const flags = v ? vitalFlags(v) : [];
              const isCurrent = p.id === selected;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => select(p.id)}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`w-full rounded-lg border px-3.5 py-3 text-left transition-colors ${
                      isCurrent ? "border-scrub bg-scrub-tint" : "border-rule bg-sheet hover:border-ink-soft"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{p.lastName}, {p.firstName}</span>
                      {p.allergies.some((a) => a.severity === "Severe") && (
                        <span className="rounded bg-alert px-1.5 text-xs font-semibold leading-5 text-white" title="Severe allergy on record">Allergy</span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-soft">
                      {p.mrn}, {p.sex.charAt(0)} {ageOn(p.dateOfBirth)}y
                      {flags.length > 0 && <span className="text-warn"> &nbsp;{flags.length} vital flag{flags.length > 1 ? "s" : ""}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
            {patients.length === 0 && (
              <li className="rounded-lg border border-dashed border-rule p-4 text-sm text-ink-soft">
                No patients match &ldquo;{search}&rdquo;. Check the spelling, or register them as a new patient.
              </li>
            )}
          </ul>
        </aside>

        <main className="min-w-0">
          {current ? (
            <PatientChart
              key={current.id}
              patient={current}
              store={store}
              onChange={refresh}
              onDeleted={() => {
                select(store.listPatients()[0]?.id ?? null);
                refresh();
              }}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-rule p-10 text-center text-ink-soft">
              Choose a patient from the list, or register a new one.
            </div>
          )}
        </main>
      </div>

      {registering && (
        <Sheet title="Register patient" onClose={() => setRegistering(false)}>
          <PatientForm
            submit={(data) => {
              const result = store.createPatient(data);
              if (result.ok) select(result.value.id);
              return result;
            }}
            onDone={() => {
              setRegistering(false);
              refresh();
            }}
            onCancel={() => setRegistering(false)}
          />
        </Sheet>
      )}
    </div>
  );
}

