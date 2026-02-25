import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-md border bg-paper-warm/50 px-3 py-2 text-sm text-ink transition-colors placeholder:text-ink-muted focus:border-ink-faint focus:bg-paper focus:outline-none focus:ring-1 focus:ring-ink-faint disabled:bg-paper-warm disabled:text-ink-muted ${
            error
              ? "border-serif-error/40 focus:border-serif-error focus:ring-serif-error/30"
              : "border-ink-faint/20"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-serif-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
