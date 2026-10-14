"use client";

import { useId, type ReactNode } from "react";

/** Small form building blocks shared by every form in the chart. */

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error || hint ? msgId : undefined })}
      {error ? (
        <p id={msgId} className="text-sm text-alert">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-rule bg-sheet px-3 py-2 text-[15px] text-ink placeholder:text-ink-soft/70 aria-[invalid=true]:border-alert focus:border-scrub focus:outline-none focus:ring-2 focus:ring-scrub/20";

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet" | "danger" }) {
  const styles = {
    primary: "bg-scrub text-white hover:bg-scrub-deep",
    quiet: "border border-rule bg-sheet text-ink hover:border-ink-soft",
    danger: "border border-alert/40 bg-sheet text-alert hover:bg-alert-tint",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${styles} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

/** A modal sheet for add/edit forms. Escape or the backdrop closes it. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-sheet p-5 shadow-2xl sm:max-w-xl sm:rounded-xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-ink-soft hover:text-ink" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-md bg-alert-tint px-3 py-2 text-sm text-alert">{message}</p>;
}

/** Reads a <form> into a plain object, turning checkboxes into booleans. */
export function readForm(form: HTMLFormElement): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const el of Array.from(form.elements)) {
    const input = el as HTMLInputElement;
    if (!input.name) continue;
    data[input.name] = input.type === "checkbox" ? input.checked : input.value;
  }
  return data;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  return new Date(iso.length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
