import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", isLoading, children, disabled, ...props }, ref) => {

    const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
      primary: "bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm shadow-cyan-500/20",
      secondary: "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",
      ghost: "hover:bg-slate-800 text-slate-300 hover:text-white",
      destructive: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
      outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
      link: "text-cyan-400 underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    }

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && children}
      </button>
    )
  }
)
Button.displayName = "Button"
