import type { Database, Patient } from "./schema";

/**
 * Fictional demo patients. Every name, number and history here is invented;
 * none of it describes a real person.
 */

let counter = 0;
const id = () => `seed-${++counter}`;

/** A date N days before today, as YYYY-MM-DD, so the demo data never goes stale. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function patient(p: Omit<Patient, "id" | "createdAt" | "updatedAt">): Patient {
  const stamp = new Date().toISOString();
  return { ...p, id: id(), createdAt: stamp, updatedAt: stamp };
}

export function createSeedDatabase(): Database {
  counter = 0;

  const patients: Patient[] = [
    patient({
      mrn: "MRN-000101",
      firstName: "Nour",
      lastName: "Hassan",
      dateOfBirth: "1978-03-14",
      sex: "Female",
      bloodType: "A+",
      phone: "+20 100 555 0101",
      email: "nour.hassan@example.com",
      address: "Smouha, Alexandria",
      emergencyContact: "Karim Hassan (husband) +20 100 555 0102",
      allergies: [{ id: id(), substance: "Penicillin", reaction: "Hives", severity: "Severe" }],
      conditions: [
        { id: id(), name: "Type 2 diabetes", diagnosedOn: "2019-06-02", active: true },
        { id: id(), name: "Hypertension", diagnosedOn: "2021-01-18", active: true },
      ],
      medications: [
        { id: id(), name: "Metformin", dose: "500 mg", frequency: "Twice daily", active: true },
        { id: id(), name: "Amlodipine", dose: "5 mg", frequency: "Once daily", active: true },
      ],
      vitals: [
        { id: id(), recordedOn: daysAgo(180), systolic: 148, diastolic: 94, heartRate: 82, temperatureC: 36.8, weightKg: 84, heightCm: 162 },
        { id: id(), recordedOn: daysAgo(120), systolic: 142, diastolic: 90, heartRate: 80, temperatureC: 36.7, weightKg: 82.5, heightCm: 162 },
        { id: id(), recordedOn: daysAgo(60), systolic: 136, diastolic: 86, heartRate: 76, temperatureC: 36.9, weightKg: 81, heightCm: 162 },
        { id: id(), recordedOn: daysAgo(7), systolic: 128, diastolic: 82, heartRate: 74, temperatureC: 36.6, weightKg: 79.5, heightCm: 162 },
      ],
      notes: [
        {
          id: id(),
          visitDate: daysAgo(7),
          clinician: "Dr. Salma Fathy",
          reason: "Diabetes and blood-pressure follow-up",
          subjective: "Feels well. Walking 30 minutes most days. No dizziness.",
          objective: "BP 128/82, HR 74. Weight down 1.5 kg since last visit.",
          assessment: "Blood pressure improving on amlodipine. Glucose control stable.",
          plan: "Continue current medications. HbA1c in 3 months. Keep up the walking.",
        },
      ],
    }),
    patient({
      mrn: "MRN-000102",
      firstName: "Omar",
      lastName: "Farouk",
      dateOfBirth: "1994-11-02",
      sex: "Male",
      bloodType: "O+",
      phone: "+20 111 555 0201",
      email: "",
      address: "Roushdy, Alexandria",
      emergencyContact: "Mona Farouk (mother) +20 111 555 0202",
      allergies: [],
      conditions: [{ id: id(), name: "Asthma", diagnosedOn: "2002-04-10", active: true }],
      medications: [{ id: id(), name: "Salbutamol inhaler", dose: "100 mcg, 2 puffs", frequency: "As needed", active: true }],
      vitals: [
        { id: id(), recordedOn: daysAgo(3), systolic: 118, diastolic: 76, heartRate: 104, temperatureC: 38.4, weightKg: 72, heightCm: 178 },
      ],
      notes: [
        {
          id: id(),
          visitDate: daysAgo(3),
          clinician: "Dr. Ahmed Nabil",
          reason: "Fever and cough for 2 days",
          subjective: "Dry cough, mild shortness of breath at night, fever since Tuesday.",
          objective: "Temp 38.4 °C, HR 104. Mild expiratory wheeze, no crackles.",
          assessment: "Viral upper respiratory infection with mild asthma flare.",
          plan: "Fluids and rest. Inhaler up to 4 times daily. Return if breathing worsens or fever lasts beyond 5 days.",
        },
      ],
    }),
    patient({
      mrn: "MRN-000103",
      firstName: "Laila",
      lastName: "Mansour",
      dateOfBirth: "1956-07-21",
      sex: "Female",
      bloodType: "B-",
      phone: "+20 122 555 0301",
      email: "laila.m@example.com",
      address: "Miami, Alexandria",
      emergencyContact: "Youssef Mansour (son) +20 122 555 0302",
      allergies: [
        { id: id(), substance: "Sulfa drugs", reaction: "Rash", severity: "Moderate" },
        { id: id(), substance: "Latex", reaction: "Itching", severity: "Mild" },
      ],
      conditions: [
        { id: id(), name: "Osteoarthritis, both knees", diagnosedOn: "2015-09-30", active: true },
        { id: id(), name: "Hypothyroidism", diagnosedOn: "2010-02-12", active: true },
      ],
      medications: [
        { id: id(), name: "Levothyroxine", dose: "75 mcg", frequency: "Once daily, before breakfast", active: true },
        { id: id(), name: "Paracetamol", dose: "1 g", frequency: "Up to 3 times daily as needed", active: true },
        { id: id(), name: "Ibuprofen", dose: "400 mg", frequency: "As needed", active: false },
      ],
      vitals: [
        { id: id(), recordedOn: daysAgo(90), systolic: 134, diastolic: 78, heartRate: 68, temperatureC: 36.5, weightKg: 70, heightCm: 158 },
        { id: id(), recordedOn: daysAgo(14), systolic: 131, diastolic: 77, heartRate: 66, temperatureC: 36.6, weightKg: 69, heightCm: 158 },
      ],
      notes: [],
    }),
    patient({
      mrn: "MRN-000104",
      firstName: "Youssef",
      lastName: "Adel",
      dateOfBirth: "2015-05-09",
      sex: "Male",
      bloodType: "Unknown",
      phone: "+20 106 555 0401",
      email: "",
      address: "Sidi Gaber, Alexandria",
      emergencyContact: "Heba Adel (mother) +20 106 555 0402",
      allergies: [{ id: id(), substance: "Peanuts", reaction: "Swelling of lips", severity: "Severe" }],
      conditions: [],
      medications: [{ id: id(), name: "Epinephrine auto-injector", dose: "0.15 mg", frequency: "Emergency use", active: true }],
      vitals: [],
      notes: [],
    }),
  ];

  return { version: 1, nextMrn: 105, patients, audit: [] };
}
