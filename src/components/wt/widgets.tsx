import type { ReactNode } from "react";

export function WfButton({
  children,
  onClick,
  disabled,
  defaultBtn,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  defaultBtn?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`wf-btn ${defaultBtn ? "wf-btn-default" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function WfField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="wf-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function WfGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="wf-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

export function WfNumber({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      className="wf-input"
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
