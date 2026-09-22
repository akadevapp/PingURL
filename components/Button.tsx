import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-seal text-white hover:bg-seal-dark disabled:bg-seal/50",
  secondary: "bg-white text-ink border border-line hover:border-slate/60 disabled:opacity-50",
  ghost: "bg-transparent text-slate hover:text-ink disabled:opacity-50",
  danger: "bg-white text-wax border border-wax/40 hover:bg-wax-light disabled:opacity-50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[0.95rem] font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
