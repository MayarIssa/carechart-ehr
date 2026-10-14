import { z } from "zod";

/** Validation rules for every record, shared by the forms and the data store. */

const isoDate = z
  .string()
  .min(1, "Required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Not a real date");

export const SEXES = ["Female", "Male"] as const;
export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;
export const ALLERGY_SEVERITIES = ["Mild", "Moderate", "Severe"] as const;

export const patientInputSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  dateOfBirth: isoDate.refine((v) => new Date(v) <= new Date(), "Date of birth can't be in the future"),
  sex: z.enum(SEXES),
  bloodType: z.enum(BLOOD_TYPES),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
  address: z.string().trim().max(200),
  emergencyContact: z.string().trim().max(120),
});
export type PatientInput = z.infer<typeof patientInputSchema>;

export const allergyInputSchema = z.object({
  substance: z.string().trim().min(1, "Required").max(80),
  reaction: z.string().trim().max(120),
  severity: z.enum(ALLERGY_SEVERITIES),
});
export type AllergyInput = z.infer<typeof allergyInputSchema>;

export const conditionInputSchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  diagnosedOn: isoDate,
  active: z.boolean(),
});
export type ConditionInput = z.infer<typeof conditionInputSchema>;

export const medicationInputSchema = z.object({
  name: z.string().trim().min(1, "Required").max(80),
  dose: z.string().trim().min(1, "Required").max(60),
  frequency: z.string().trim().min(1, "Required").max(60),
  active: z.boolean(),
});
export type MedicationInput = z.infer<typeof medicationInputSchema>;

/** Numbers come from form text fields, so they're coerced and range-checked to catch typos. */
export const vitalsInputSchema = z
  .object({
    recordedOn: isoDate,
    systolic: z.coerce.number().int().min(60, "Too low").max(260, "Too high"),
    diastolic: z.coerce.number().int().min(30, "Too low").max(160, "Too high"),
    heartRate: z.coerce.number().int().min(25, "Too low").max(250, "Too high"),
    temperatureC: z.coerce.number().min(32, "Too low").max(43, "Too high"),
    weightKg: z.coerce.number().min(1, "Too low").max(400, "Too high"),
    heightCm: z.coerce.number().min(30, "Too low").max(250, "Too high"),
  })
  .refine((v) => v.diastolic < v.systolic, {
    message: "Diastolic must be lower than systolic",
    path: ["diastolic"],
  });
export type VitalsInput = z.infer<typeof vitalsInputSchema>;

/** Visit notes follow the SOAP format clinicians use: Subjective, Objective, Assessment, Plan. */
export const visitNoteInputSchema = z.object({
  visitDate: isoDate,
  clinician: z.string().trim().min(1, "Required").max(80),
  reason: z.string().trim().min(1, "Required").max(120),
  subjective: z.string().trim().max(2000),
  objective: z.string().trim().max(2000),
  assessment: z.string().trim().min(1, "Required").max(2000),
  plan: z.string().trim().min(1, "Required").max(2000),
});
export type VisitNoteInput = z.infer<typeof visitNoteInputSchema>;

type WithId<T> = T & { id: string };

export type Allergy = WithId<AllergyInput>;
export type Condition = WithId<ConditionInput>;
export type Medication = WithId<MedicationInput>;
export type Vitals = WithId<VitalsInput>;
export type VisitNote = WithId<VisitNoteInput>;

export interface Patient extends PatientInput {
  id: string;
  /** Medical record number shown to staff, e.g. MRN-000123. */
  mrn: string;
  createdAt: string;
  updatedAt: string;
  allergies: Allergy[];
  conditions: Condition[];
  medications: Medication[];
  vitals: Vitals[];
  notes: VisitNote[];
}

export interface AuditEntry {
  id: string;
  at: string;
  patientId: string;
  action: string;
}

export interface Database {
  version: 1;
  nextMrn: number;
  patients: Patient[];
  audit: AuditEntry[];
}

/** Turns a failed validation into { fieldName: "first error message" } for the forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
