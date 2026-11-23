import { useId } from "react";

/**
 * Interruptor de estado. La selección se marca con masa tinta (nunca con un
 * contorno) y el control completo mide ≥44 px para ser cómodo en móvil.
 */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex min-h-14 items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-carbon">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-xs text-tibio">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`inline-flex min-h-11 min-w-12 shrink-0 items-center px-1 transition-colors disabled:opacity-50 ${
          checked ? "justify-end bg-tinta" : "justify-start bg-nude"
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-6 transition-colors ${checked ? "bg-crema" : "bg-white"}`}
        />
      </button>
    </div>
  );
}
