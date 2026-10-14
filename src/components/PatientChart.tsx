"use client";

import { useState } from "react";
import { ageOn, bloodPressureCategory, bmi, bmiCategory, fullName, latestVitals, vitalFlags } from "@/lib/clinical";
import type { Patient } from "@/lib/schema";
import type { PatientStore, Section } from "@/lib/store";
import { entryForms, PatientForm } from "./forms";
import { Button, formatDate, Sheet } from "./ui";
import { BloodPressureChart } from "./VitalsChart";

type Tab = "summary" | "vitals" | "notes" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "vitals", label: "Vitals" },
  { id: "notes", label: "Visit notes" },
  { id: "history", label: "Change log" },
];

export function PatientChart({
  patient,
  store,
  onChange,
  onDeleted,
}: {
  patient: Patient;
  store: PatientStore;
  onChange: () => void;
  onDeleted: () => void;
}) {
  const [tab, setTab] = useState<Tab>("summary");
  const [adding, setAdding] = useState<Section | null>(null);
  const [editing, setEditing] = useState(false);

  const vitals = latestVitals(patient);
  const severe = patient.allergies.filter((a) => a.severity === "Severe");
  const AddForm = adding ? entryForms[adding] : null;

  const remove = (section: Section, entryId: string, what: string) => {
    if (confirm(`Remove this ${what} from ${fullName(patient)}'s record?`)) {
      store.removeEntry(patient.id, section, entryId);
      onChange();
    }
  };

  return (
    <article className="flex flex-col gap-6">
      {/* Patient banner: identity first, allergies impossible to miss. */}
      <header className="overflow-hidden rounded-lg border border-rule bg-sheet">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {patient.lastName}, {patient.firstName}
            </h1>
            <p className="mt-1 text-ink-soft">
              {patient.mrn} &nbsp;|&nbsp; {patient.sex}, {ageOn(patient.dateOfBirth)} years (born {formatDate(patient.dateOfBirth)})
              &nbsp;|&nbsp; Blood type {patient.bloodType}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="quiet" onClick={() => setEditing(true)}>Edit details</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Delete ${fullName(patient)}'s whole record? This can't be undone.`)) {
                  store.deletePatient(patient.id);
                  onDeleted();
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
        {patient.allergies.length > 0 ? (
          <div className={`px-5 py-2.5 text-sm font-medium ${severe.length ? "bg-alert text-white" : "bg-alert-tint text-alert"}`}>
            Allergies: {patient.allergies.map((a) => `${a.substance}${a.severity === "Severe" ? " (severe)" : ""}`).join(", ")}
          </div>
        ) : (
          <div className="bg-scrub-tint px-5 py-2.5 text-sm text-scrub-deep">No known allergies</div>
        )}
      </header>

      <nav className="flex gap-1 border-b border-rule" aria-label="Record sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id ? "border-scrub text-scrub-deep" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "summary" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Latest vitals" action={<Button variant="quiet" onClick={() => setAdding("vitals")}>Record vitals</Button>}>
            {vitals ? <LatestVitals v={vitals} /> : <Empty text="No vitals recorded yet." />}
          </Panel>

          <Panel title="Contact">
            <dl className="grid gap-2 text-[15px]">
              <Row k="Phone" v={patient.phone} />
              <Row k="Email" v={patient.email || "Not given"} />
              <Row k="Address" v={patient.address || "Not given"} />
              <Row k="Emergency contact" v={patient.emergencyContact || "Not given"} />
            </dl>
          </Panel>

          <Panel title="Allergies" action={<Button variant="quiet" onClick={() => setAdding("allergies")}>Add</Button>}>
            {patient.allergies.length === 0 ? <Empty text="No known allergies. Add one if the patient reports any." /> : (
              <ul className="divide-y divide-rule">
                {patient.allergies.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-medium">{a.substance}</p>
                      <p className="text-sm text-ink-soft">{a.reaction || "Reaction not recorded"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Severity level={a.severity} />
                      <RemoveButton onClick={() => remove("allergies", a.id, "allergy")} label={`Remove ${a.substance} allergy`} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Problems" action={<Button variant="quiet" onClick={() => setAdding("conditions")}>Add</Button>}>
            {patient.conditions.length === 0 ? <Empty text="No conditions on record." /> : (
              <ul className="divide-y divide-rule">
                {patient.conditions.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className={c.active ? "" : "text-ink-soft line-through decoration-ink-soft/50"}>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-ink-soft">Diagnosed {formatDate(c.diagnosedOn)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ToggleButton active={c.active} onClick={() => { store.toggleActive(patient.id, "conditions", c.id); onChange(); }} />
                      <RemoveButton onClick={() => remove("conditions", c.id, "condition")} label={`Remove ${c.name}`} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Medications" className="lg:col-span-2" action={<Button variant="quiet" onClick={() => setAdding("medications")}>Add</Button>}>
            {patient.medications.length === 0 ? <Empty text="No medications on record." /> : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-[15px]">
                  <thead className="text-sm text-ink-soft">
                    <tr><th className="py-2 font-medium">Medication</th><th className="py-2 font-medium">Dose</th><th className="py-2 font-medium">Frequency</th><th className="py-2 font-medium">Status</th><th className="sr-only">Remove</th></tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {patient.medications.map((m) => (
                      <tr key={m.id} className={m.active ? "" : "text-ink-soft"}>
                        <td className="py-2.5 pr-3 font-medium">{m.name}</td>
                        <td className="py-2.5 pr-3">{m.dose}</td>
                        <td className="py-2.5 pr-3">{m.frequency}</td>
                        <td className="py-2.5 pr-3"><ToggleButton active={m.active} onClick={() => { store.toggleActive(patient.id, "medications", m.id); onChange(); }} /></td>
                        <td className="py-2.5 text-right"><RemoveButton onClick={() => remove("medications", m.id, "medication")} label={`Remove ${m.name}`} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === "vitals" && (
        <div className="flex flex-col gap-6">
          <Panel title="Blood pressure" action={<Button onClick={() => setAdding("vitals")}>Record vitals</Button>}>
            <BloodPressureChart readings={patient.vitals} />
          </Panel>
          <Panel title="All readings">
            {patient.vitals.length === 0 ? <Empty text="No vitals recorded yet." /> : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[15px]">
                  <thead className="text-sm text-ink-soft">
                    <tr><th className="py-2 font-medium">Date</th><th className="py-2 font-medium">BP (mmHg)</th><th className="py-2 font-medium">Heart rate</th><th className="py-2 font-medium">Temp</th><th className="py-2 font-medium">Weight</th><th className="py-2 font-medium">BMI</th><th className="sr-only">Remove</th></tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {[...patient.vitals].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn)).map((v) => {
                      const flagged = vitalFlags(v);
                      return (
                        <tr key={v.id}>
                          <td className="py-2.5 pr-3">{formatDate(v.recordedOn)}</td>
                          <td className="py-2.5 pr-3">{v.systolic}/{v.diastolic}</td>
                          <td className="py-2.5 pr-3">{v.heartRate} bpm</td>
                          <td className="py-2.5 pr-3">{v.temperatureC} °C</td>
                          <td className="py-2.5 pr-3">{v.weightKg} kg</td>
                          <td className="py-2.5 pr-3">{bmi(v.weightKg, v.heightCm)}</td>
                          <td className="py-2.5 text-right">
                            <span className="mr-3 text-sm">{flagged.length > 0 && <span className={flagged.some((f) => f.level === "critical") ? "text-alert" : "text-warn"}>{flagged.length} flag{flagged.length > 1 ? "s" : ""}</span>}</span>
                            <RemoveButton onClick={() => remove("vitals", v.id, "vitals reading")} label={`Remove reading from ${formatDate(v.recordedOn)}`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === "notes" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end"><Button onClick={() => setAdding("notes")}>New visit note</Button></div>
          {patient.notes.length === 0 ? (
            <Panel title="No visit notes"><Empty text="Write the first note after this patient's next visit." /></Panel>
          ) : (
            [...patient.notes].sort((a, b) => b.visitDate.localeCompare(a.visitDate)).map((n) => (
              <section key={n.id} className="rounded-lg border border-rule bg-sheet p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold">{n.reason}</h3>
                  <p className="text-sm text-ink-soft">{formatDate(n.visitDate)}, {n.clinician}</p>
                </div>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {([["Subjective", n.subjective], ["Objective", n.objective], ["Assessment", n.assessment], ["Plan", n.plan]] as const).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-sm font-semibold text-scrub-deep">{k}</dt>
                      <dd className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{v || <span className="text-ink-soft">Not recorded</span>}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 text-right">
                  <RemoveButton onClick={() => remove("notes", n.id, "visit note")} label={`Remove note from ${formatDate(n.visitDate)}`} />
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <Panel title="Change log">
          {(() => {
            const entries = store.auditFor(patient.id);
            if (entries.length === 0) return <Empty text="No changes since this record was loaded. Every edit you make will appear here." />;
            return (
              <ol className="divide-y divide-rule">
                {entries.map((e) => (
                  <li key={e.id} className="flex justify-between gap-4 py-2.5 text-[15px]">
                    <span>{e.action}</span>
                    <time className="text-sm text-ink-soft" dateTime={e.at}>{new Date(e.at).toLocaleString("en-GB")}</time>
                  </li>
                ))}
              </ol>
            );
          })()}
        </Panel>
      )}

      {AddForm && adding && (
        <Sheet title={`${AddForm.title} for ${patient.firstName}`} onClose={() => setAdding(null)}>
          <AddForm.Form
            lastHeightCm={vitals?.heightCm}
            submit={(data) => store.addEntry(patient.id, adding, data)}
            onDone={() => { setAdding(null); onChange(); }}
            onCancel={() => setAdding(null)}
          />
        </Sheet>
      )}

      {editing && (
        <Sheet title="Edit patient details" onClose={() => setEditing(false)}>
          <PatientForm
            initial={patient}
            submit={(data) => store.updatePatient(patient.id, data)}
            onDone={() => { setEditing(false); onChange(); }}
            onCancel={() => setEditing(false)}
          />
        </Sheet>
      )}
    </article>
  );
}

function LatestVitals({ v }: { v: NonNullable<ReturnType<typeof latestVitals>> }) {
  const flags = vitalFlags(v);
  const b = bmi(v.weightKg, v.heightCm);
  return (
    <div>
      <p className="text-sm text-ink-soft">Taken {formatDate(v.recordedOn)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Stat k="Blood pressure" v={`${v.systolic}/${v.diastolic}`} sub={bloodPressureCategory(v.systolic, v.diastolic)} />
        <Stat k="Heart rate" v={`${v.heartRate}`} sub="bpm" />
        <Stat k="Temperature" v={`${v.temperatureC}`} sub="°C" />
        <Stat k="Weight" v={`${v.weightKg}`} sub="kg" />
        <Stat k="Height" v={`${v.heightCm}`} sub="cm" />
        <Stat k="BMI" v={`${b}`} sub={bmiCategory(b)} />
      </dl>
      {flags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {flags.map((f) => (
            <li key={f.label} className={`rounded px-2.5 py-1 text-sm font-medium ${f.level === "critical" ? "bg-alert-tint text-alert" : "bg-warn-tint text-warn"}`}>
              {f.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Panel({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-rule bg-sheet p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div>
      <dt className="text-sm text-ink-soft">{k}</dt>
      <dd className="text-2xl font-semibold tracking-tight">{v}</dd>
      <dd className="text-sm text-ink-soft">{sub}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr] gap-3">
      <dt className="text-ink-soft">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-[15px] text-ink-soft">{text}</p>;
}

function Severity({ level }: { level: "Mild" | "Moderate" | "Severe" }) {
  const cls = level === "Severe" ? "bg-alert text-white" : level === "Moderate" ? "bg-alert-tint text-alert" : "bg-warn-tint text-warn";
  return <span className={`rounded px-2 py-0.5 text-sm font-medium ${cls}`}>{level}</span>;
}

function ToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded border border-rule px-2 py-0.5 text-sm hover:border-ink-soft"
      title={active ? "Mark as inactive" : "Mark as active"}>
      {active ? "Active" : "Inactive"}
    </button>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="rounded p-1 text-ink-soft hover:bg-alert-tint hover:text-alert">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
