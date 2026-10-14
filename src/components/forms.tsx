"use client";

import { useState, type FormEvent } from "react";
import { ALLERGY_SEVERITIES, BLOOD_TYPES, SEXES, type Patient } from "@/lib/schema";
import type { Result, Section } from "@/lib/store";
import { Button, Field, FormError, inputClass, readForm, today } from "./ui";

type Submit = (data: Record<string, unknown>) => Result<Patient>;

/** Shared submit handling: validate through the store, show field errors, close on success. */
function useFormSubmit(submit: Submit, onDone: () => void) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = submit(readForm(e.currentTarget));
    if (result.ok) onDone();
    else setErrors(result.errors);
  };
  return { errors, onSubmit };
}

function Actions({ onCancel, label }: { onCancel: () => void; label: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="quiet" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">{label}</Button>
    </div>
  );
}

export function PatientForm({
  initial,
  submit,
  onDone,
  onCancel,
}: {
  initial?: Patient;
  submit: Submit;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { errors, onSubmit } = useFormSubmit(submit, onDone);
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="First name" error={errors.firstName}>
        {(p) => <input {...p} name="firstName" defaultValue={initial?.firstName} className={inputClass} autoFocus />}
      </Field>
      <Field label="Last name" error={errors.lastName}>
        {(p) => <input {...p} name="lastName" defaultValue={initial?.lastName} className={inputClass} />}
      </Field>
      <Field label="Date of birth" error={errors.dateOfBirth}>
        {(p) => <input {...p} type="date" name="dateOfBirth" max={today()} defaultValue={initial?.dateOfBirth} className={inputClass} />}
      </Field>
      <Field label="Sex" error={errors.sex}>
        {(p) => (
          <select {...p} name="sex" defaultValue={initial?.sex ?? "Female"} className={inputClass}>
            {SEXES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Blood type" error={errors.bloodType}>
        {(p) => (
          <select {...p} name="bloodType" defaultValue={initial?.bloodType ?? "Unknown"} className={inputClass}>
            {BLOOD_TYPES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Phone" error={errors.phone}>
        {(p) => <input {...p} type="tel" name="phone" defaultValue={initial?.phone} className={inputClass} placeholder="+20 100 000 0000" />}
      </Field>
      <div className="sm:col-span-2">
        <Field label="Email (optional)" error={errors.email}>
          {(p) => <input {...p} type="email" name="email" defaultValue={initial?.email} className={inputClass} />}
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Address" error={errors.address}>
          {(p) => <input {...p} name="address" defaultValue={initial?.address} className={inputClass} />}
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Emergency contact" error={errors.emergencyContact} hint="Name, relationship and phone">
          {(p) => <input {...p} name="emergencyContact" defaultValue={initial?.emergencyContact} className={inputClass} />}
        </Field>
      </div>
      <div className="sm:col-span-2">
        <FormError message={errors.form} />
        <Actions onCancel={onCancel} label={initial ? "Save changes" : "Register patient"} />
      </div>
    </form>
  );
}

type EntryFormProps = { submit: Submit; onDone: () => void; onCancel: () => void };

export function AllergyForm(props: EntryFormProps) {
  const { errors, onSubmit } = useFormSubmit(props.submit, props.onDone);
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Field label="Substance" error={errors.substance}>
        {(p) => <input {...p} name="substance" className={inputClass} placeholder="e.g. Penicillin" autoFocus />}
      </Field>
      <Field label="Reaction" error={errors.reaction}>
        {(p) => <input {...p} name="reaction" className={inputClass} placeholder="e.g. Hives" />}
      </Field>
      <Field label="Severity" error={errors.severity}>
        {(p) => (
          <select {...p} name="severity" defaultValue="Moderate" className={inputClass}>
            {ALLERGY_SEVERITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </Field>
      <Actions onCancel={props.onCancel} label="Add allergy" />
    </form>
  );
}

export function ConditionForm(props: EntryFormProps) {
  const { errors, onSubmit } = useFormSubmit(props.submit, props.onDone);
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Field label="Condition" error={errors.name}>
        {(p) => <input {...p} name="name" className={inputClass} placeholder="e.g. Hypertension" autoFocus />}
      </Field>
      <Field label="Diagnosed on" error={errors.diagnosedOn}>
        {(p) => <input {...p} type="date" name="diagnosedOn" max={today()} defaultValue={today()} className={inputClass} />}
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked className="size-4 accent-scrub" />
        Currently active
      </label>
      <Actions onCancel={props.onCancel} label="Add condition" />
    </form>
  );
}

export function MedicationForm(props: EntryFormProps) {
  const { errors, onSubmit } = useFormSubmit(props.submit, props.onDone);
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Medication" error={errors.name}>
          {(p) => <input {...p} name="name" className={inputClass} placeholder="e.g. Metformin" autoFocus />}
        </Field>
      </div>
      <Field label="Dose" error={errors.dose}>
        {(p) => <input {...p} name="dose" className={inputClass} placeholder="e.g. 500 mg" />}
      </Field>
      <Field label="Frequency" error={errors.frequency}>
        {(p) => <input {...p} name="frequency" className={inputClass} placeholder="e.g. Twice daily" />}
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked className="size-4 accent-scrub" />
        Currently taking
      </label>
      <div className="sm:col-span-2">
        <Actions onCancel={props.onCancel} label="Add medication" />
      </div>
    </form>
  );
}

export function VitalsForm(props: EntryFormProps & { lastHeightCm?: number }) {
  const { errors, onSubmit } = useFormSubmit(props.submit, props.onDone);
  const num = (name: string, label: string, unit: string, defaultValue?: number, step = "1") => (
    <Field label={`${label} (${unit})`} error={errors[name]}>
      {(p) => <input {...p} name={name} type="number" inputMode="decimal" step={step} defaultValue={defaultValue} className={inputClass} />}
    </Field>
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Field label="Date" error={errors.recordedOn}>
          {(p) => <input {...p} type="date" name="recordedOn" max={today()} defaultValue={today()} className={inputClass} />}
        </Field>
      </div>
      {num("systolic", "Systolic", "mmHg")}
      {num("diastolic", "Diastolic", "mmHg")}
      {num("heartRate", "Heart rate", "bpm")}
      {num("temperatureC", "Temperature", "°C", undefined, "0.1")}
      {num("weightKg", "Weight", "kg", undefined, "0.1")}
      {num("heightCm", "Height", "cm", props.lastHeightCm)}
      <div className="col-span-2">
        <Actions onCancel={props.onCancel} label="Record vitals" />
      </div>
    </form>
  );
}

export function NoteForm(props: EntryFormProps) {
  const { errors, onSubmit } = useFormSubmit(props.submit, props.onDone);
  const area = (name: string, label: string, hint: string) => (
    <Field label={label} error={errors[name]} hint={hint}>
      {(p) => <textarea {...p} name={name} rows={3} className={inputClass} />}
    </Field>
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Visit date" error={errors.visitDate}>
          {(p) => <input {...p} type="date" name="visitDate" max={today()} defaultValue={today()} className={inputClass} />}
        </Field>
        <Field label="Clinician" error={errors.clinician}>
          {(p) => <input {...p} name="clinician" className={inputClass} placeholder="Dr. …" />}
        </Field>
      </div>
      <Field label="Reason for visit" error={errors.reason}>
        {(p) => <input {...p} name="reason" className={inputClass} autoFocus />}
      </Field>
      {area("subjective", "Subjective", "What the patient reports")}
      {area("objective", "Objective", "Exam findings and measurements")}
      {area("assessment", "Assessment", "Diagnosis or clinical impression")}
      {area("plan", "Plan", "Treatment, tests and follow-up")}
      <Actions onCancel={props.onCancel} label="Save note" />
    </form>
  );
}

export const entryForms: Record<Section, { title: string; Form: (p: EntryFormProps & { lastHeightCm?: number }) => React.JSX.Element }> = {
  allergies: { title: "Add allergy", Form: AllergyForm },
  conditions: { title: "Add condition", Form: ConditionForm },
  medications: { title: "Add medication", Form: MedicationForm },
  vitals: { title: "Record vitals", Form: VitalsForm },
  notes: { title: "New visit note", Form: NoteForm },
};
