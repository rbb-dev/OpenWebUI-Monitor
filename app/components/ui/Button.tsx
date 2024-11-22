import { ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled = false,
}: ButtonProps) {
  const baseStyles =
    "flex items-center justify-center transition-all duration-300 rounded-full font-medium";

  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300",
    secondary:
      "bg-white/80 text-gray-700 hover:bg-white disabled:bg-gray-100 border border-gray-200",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
  };

  const sizes = {
    sm: "text-sm px-4 py-1.5",
    md: "text-base px-6 py-2",
    lg: "text-lg px-8 py-3",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && "cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  className,
  disabled = false,
}: Omit<ButtonProps, "size" | "variant"> & {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex items-center justify-center",
        "w-8 h-8 rounded-full",
        "bg-white/50 hover:bg-white/80",
        "text-gray-500 hover:text-gray-700",
        "transition-all duration-300",
        "backdrop-blur-sm",
        "shadow-sm hover:shadow-md",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}
