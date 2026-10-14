import { beforeEach, describe, expect, it } from "vitest";
import { PatientStore, STORAGE_KEY, type KeyValueStorage } from "./store";

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

const validPatient = {
  firstName: "Sara",
  lastName: "Ibrahim",
  dateOfBirth: "1990-01-15",
  sex: "Female",
  bloodType: "O-",
  phone: "+20 100 000 0000",
  email: "",
  address: "Alexandria",
  emergencyContact: "",
};

describe("PatientStore", () => {
  let storage: MemoryStorage;
  let store: PatientStore;

  beforeEach(() => {
    storage = new MemoryStorage();
    store = new PatientStore(storage);
  });

  it("starts with the demo patients and saves them", () => {
    expect(store.listPatients().length).toBe(4);
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("registers a patient with the next MRN", () => {
    const result = store.createPatient(validPatient);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.mrn).toBe("MRN-000105");
    expect(store.listPatients().length).toBe(5);
  });

  it("rejects invalid patient details with field messages", () => {
    const result = store.createPatient({ ...validPatient, firstName: "", phone: "abc" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.firstName).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    }
  });

  it("rejects a date of birth in the future", () => {
    const result = store.createPatient({ ...validPatient, dateOfBirth: "2999-01-01" });
    expect(result.ok).toBe(false);
  });

  it("keeps data between sessions", () => {
    store.createPatient(validPatient);
    const reopened = new PatientStore(storage);
    expect(reopened.listPatients().some((p) => p.lastName === "Ibrahim")).toBe(true);
  });

  it("adds a vitals reading and checks diastolic is below systolic", () => {
    const id = store.listPatients()[0].id;
    const bad = store.addEntry(id, "vitals", {
      recordedOn: "2026-10-01", systolic: 80, diastolic: 90, heartRate: 70, temperatureC: 37, weightKg: 70, heightCm: 170,
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.diastolic).toMatch(/lower than systolic/);

    const good = store.addEntry(id, "vitals", {
      recordedOn: "2026-10-01", systolic: "120", diastolic: "80", heartRate: "70", temperatureC: "37", weightKg: "70", heightCm: "170",
    });
    expect(good.ok).toBe(true);
  });

  it("records every change in the audit trail", () => {
    const created = store.createPatient(validPatient);
    if (!created.ok) throw new Error("setup failed");
    store.addEntry(created.value.id, "allergies", { substance: "Aspirin", reaction: "", severity: "Mild" });

    const actions = store.auditFor(created.value.id).map((a) => a.action);
    expect(actions).toEqual(["Added allergy", "Registered patient"]);
  });

  it("toggles a medication between active and inactive", () => {
    const p = store.listPatients().find((x) => x.medications.length > 0)!;
    const med = p.medications[0];
    const was = med.active;
    expect(store.toggleActive(p.id, "medications", med.id)).toBe(true);
    expect(store.getPatient(p.id)!.medications[0].active).toBe(!was);
  });

  it("removes an entry", () => {
    const p = store.listPatients().find((x) => x.allergies.length > 0)!;
    const count = p.allergies.length;
    expect(store.removeEntry(p.id, "allergies", p.allergies[0].id)).toBe(true);
    expect(store.getPatient(p.id)!.allergies.length).toBe(count - 1);
  });

  it("recovers from corrupted storage by reloading the demo data", () => {
    storage.setItem(STORAGE_KEY, "{not json");
    const recovered = new PatientStore(storage);
    expect(recovered.listPatients().length).toBe(4);
  });

  it("resets to the demo data", () => {
    store.createPatient(validPatient);
    store.reset();
    expect(store.listPatients().length).toBe(4);
  });
});
