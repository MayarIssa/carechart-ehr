import {
  allergyInputSchema,
  conditionInputSchema,
  medicationInputSchema,
  patientInputSchema,
  visitNoteInputSchema,
  vitalsInputSchema,
  type AuditEntry,
  type Database,
  type Patient,
} from "./schema";
import { createSeedDatabase } from "./seed";
import type { z } from "zod";

/** The subset of the browser's localStorage the store needs, so tests can pass a fake. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "carechart-ehr:v1";

export type Result<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

/** Record sections that hold lists of entries on a patient. */
export type Section = "allergies" | "conditions" | "medications" | "vitals" | "notes";

const sectionSchemas = {
  allergies: allergyInputSchema,
  conditions: conditionInputSchema,
  medications: medicationInputSchema,
  vitals: vitalsInputSchema,
  notes: visitNoteInputSchema,
} satisfies Record<Section, z.ZodTypeAny>;

const sectionLabels: Record<Section, string> = {
  allergies: "allergy",
  conditions: "condition",
  medications: "medication",
  vitals: "vitals reading",
  notes: "visit note",
};

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * All reads and writes go through this class. Every change is validated,
 * saved, and written to an audit trail — the same shape a server-backed
 * version would have, with storage swapped for an API.
 */
export class PatientStore {
  private db: Database;

  constructor(private storage: KeyValueStorage, private now: () => Date = () => new Date()) {
    this.db = this.load();
  }

  private load(): Database {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Database;
        if (parsed && parsed.version === 1 && Array.isArray(parsed.patients)) return parsed;
      } catch {
        // Corrupted data falls through to a fresh demo database.
      }
    }
    const seeded = createSeedDatabase();
    this.storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  private save(): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }

  private log(patientId: string, action: string): void {
    const entry: AuditEntry = { id: newId(), at: this.now().toISOString(), patientId, action };
    this.db.audit.unshift(entry);
    this.db.audit = this.db.audit.slice(0, 500);
  }

  listPatients(): Patient[] {
    return [...this.db.patients].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
    );
  }

  getPatient(id: string): Patient | undefined {
    return this.db.patients.find((p) => p.id === id);
  }

  auditFor(patientId: string): AuditEntry[] {
    return this.db.audit.filter((a) => a.patientId === patientId);
  }

  createPatient(input: unknown): Result<Patient> {
    const parsed = patientInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errors: toErrors(parsed.error) };

    const stamp = this.now().toISOString();
    const patient: Patient = {
      ...parsed.data,
      id: newId(),
      mrn: `MRN-${String(this.db.nextMrn).padStart(6, "0")}`,
      createdAt: stamp,
      updatedAt: stamp,
      allergies: [],
      conditions: [],
      medications: [],
      vitals: [],
      notes: [],
    };
    this.db.nextMrn += 1;
    this.db.patients.push(patient);
    this.log(patient.id, "Registered patient");
    this.save();
    return { ok: true, value: patient };
  }

  updatePatient(id: string, input: unknown): Result<Patient> {
    const patient = this.getPatient(id);
    if (!patient) return { ok: false, errors: { form: "Patient not found" } };

    const parsed = patientInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errors: toErrors(parsed.error) };

    Object.assign(patient, parsed.data, { updatedAt: this.now().toISOString() });
    this.log(id, "Updated demographics");
    this.save();
    return { ok: true, value: patient };
  }

  deletePatient(id: string): boolean {
    const before = this.db.patients.length;
    this.db.patients = this.db.patients.filter((p) => p.id !== id);
    if (this.db.patients.length === before) return false;
    this.db.audit = this.db.audit.filter((a) => a.patientId !== id);
    this.save();
    return true;
  }

  /** Add an allergy, condition, medication, vitals reading or visit note to a patient. */
  addEntry(patientId: string, section: Section, input: unknown): Result<Patient> {
    const patient = this.getPatient(patientId);
    if (!patient) return { ok: false, errors: { form: "Patient not found" } };

    const parsed = sectionSchemas[section].safeParse(input);
    if (!parsed.success) return { ok: false, errors: toErrors(parsed.error) };

    const list = patient[section] as Array<{ id: string }>;
    list.push({ ...(parsed.data as object), id: newId() });
    patient.updatedAt = this.now().toISOString();
    this.log(patientId, `Added ${sectionLabels[section]}`);
    this.save();
    return { ok: true, value: patient };
  }

  removeEntry(patientId: string, section: Section, entryId: string): boolean {
    const patient = this.getPatient(patientId);
    if (!patient) return false;

    const list = patient[section] as Array<{ id: string }>;
    const index = list.findIndex((e) => e.id === entryId);
    if (index === -1) return false;

    list.splice(index, 1);
    patient.updatedAt = this.now().toISOString();
    this.log(patientId, `Removed ${sectionLabels[section]}`);
    this.save();
    return true;
  }

  /** Toggle a condition or medication between active and inactive. */
  toggleActive(patientId: string, section: "conditions" | "medications", entryId: string): boolean {
    const patient = this.getPatient(patientId);
    const entry = patient?.[section].find((e) => e.id === entryId);
    if (!patient || !entry) return false;

    entry.active = !entry.active;
    patient.updatedAt = this.now().toISOString();
    this.log(patientId, `Marked ${sectionLabels[section]} ${entry.active ? "active" : "inactive"}`);
    this.save();
    return true;
  }

  /** Wipe everything and start again from the demo patients. */
  reset(): void {
    this.storage.removeItem(STORAGE_KEY);
    this.db = this.load();
  }

  /** The whole database as JSON, for the export button. */
  exportJson(): string {
    return JSON.stringify(this.db, null, 2);
  }
}
