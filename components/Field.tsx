import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

type FieldProps = {
  label: string;
  error?: string | null;
  hint?: string;
};

export const TextField = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <label htmlFor={inputId} className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-ink placeholder:text-slate/50 outline-none transition-colors focus:border-seal focus:ring-1 focus:ring-seal ${
            error ? "border-wax" : "border-line"
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="mt-1.5 block text-sm text-wax">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${inputId}-hint`} className="mt-1.5 block text-sm text-slate">
            {hint}
          </span>
        )}
      </label>
    );
  }
);
TextField.displayName = "TextField";

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ label, error, hint, id, className = "", ...props }, ref) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <textarea
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-ink placeholder:text-slate/50 outline-none transition-colors focus:border-seal focus:ring-1 focus:ring-seal ${
          error ? "border-wax" : "border-line"
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="mt-1.5 block text-sm text-wax">{error}</span>}
      {!error && hint && <span className="mt-1.5 block text-sm text-slate">{hint}</span>}
    </label>
  );
});
TextAreaField.displayName = "TextAreaField";
