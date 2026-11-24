// Shared Tailwind class strings so links and buttons look the same.

const base =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60";

export type ButtonVariant = "primary" | "secondary" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue-700 text-white hover:bg-blue-800",
  secondary: "border border-slate-400 bg-white text-slate-900 hover:bg-slate-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

export function buttonClasses(variant: ButtonVariant = "primary"): string {
  return `${base} ${variants[variant]}`;
}

export const linkClasses =
  "text-blue-700 underline hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

export const tableClasses = "w-full border-collapse text-left text-sm";
export const thClasses = "border border-slate-300 bg-slate-100 px-3 py-2 font-semibold";
export const tdClasses = "border border-slate-300 px-3 py-2";
