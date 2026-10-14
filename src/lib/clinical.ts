import type { Patient, Vitals } from "./schema";

/** Age in whole years on a given day (defaults to today). */
export function ageOn(dateOfBirth: string, on: Date = new Date()): number {
  const dob = new Date(dateOfBirth + "T00:00:00");
  let age = on.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    on.getMonth() < dob.getMonth() || (on.getMonth() === dob.getMonth() && on.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Body-mass index, rounded to one decimal. */
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export type BmiCategory = "Underweight" | "Healthy" | "Overweight" | "Obese";

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "Underweight";
  if (value < 25) return "Healthy";
  if (value < 30) return "Overweight";
  return "Obese";
}

export type BpCategory = "Normal" | "Elevated" | "Stage 1 hypertension" | "Stage 2 hypertension" | "Hypertensive crisis";

/** Blood-pressure category using the ACC/AHA adult thresholds. */
export function bloodPressureCategory(systolic: number, diastolic: number): BpCategory {
  if (systolic > 180 || diastolic > 120) return "Hypertensive crisis";
  if (systolic >= 140 || diastolic >= 90) return "Stage 2 hypertension";
  if (systolic >= 130 || diastolic >= 80) return "Stage 1 hypertension";
  if (systolic >= 120) return "Elevated";
  return "Normal";
}

export interface VitalFlag {
  label: string;
  level: "warning" | "critical";
}

/** Readings a clinician should look at, so they stand out in the record. */
export function vitalFlags(v: Pick<Vitals, "systolic" | "diastolic" | "heartRate" | "temperatureC">): VitalFlag[] {
  const flags: VitalFlag[] = [];
  const bp = bloodPressureCategory(v.systolic, v.diastolic);
  if (bp === "Hypertensive crisis") flags.push({ label: bp, level: "critical" });
  else if (bp.startsWith("Stage")) flags.push({ label: bp, level: "warning" });
  else if (v.systolic < 90) flags.push({ label: "Low blood pressure", level: "warning" });

  if (v.heartRate > 120 || v.heartRate < 40) flags.push({ label: `Heart rate ${v.heartRate} bpm`, level: "critical" });
  else if (v.heartRate > 100 || v.heartRate < 50) flags.push({ label: `Heart rate ${v.heartRate} bpm`, level: "warning" });

  if (v.temperatureC >= 39.5) flags.push({ label: `High fever ${v.temperatureC} °C`, level: "critical" });
  else if (v.temperatureC >= 38) flags.push({ label: `Fever ${v.temperatureC} °C`, level: "warning" });
  else if (v.temperatureC < 35) flags.push({ label: `Low temperature ${v.temperatureC} °C`, level: "critical" });

  return flags;
}

/** The most recent vitals reading, or undefined if none were recorded. */
export function latestVitals(patient: Patient): Vitals | undefined {
  return [...patient.vitals].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn))[0];
}

export function fullName(p: Pick<Patient, "firstName" | "lastName">): string {
  return `${p.firstName} ${p.lastName}`;
}

/** Case-insensitive search over name, MRN and phone. */
export function matchesSearch(p: Patient, term: string): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return [fullName(p), p.mrn, p.phone].some((field) => field.toLowerCase().includes(q));
}
