import type { ButtonHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant } from "../lib/ui";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export default function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={`${buttonClasses(variant)} ${className}`} {...rest} />;
}
