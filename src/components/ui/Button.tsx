import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: { primary: "bg-violet-500 text-white hover:bg-violet-400", secondary: "bg-white/8 text-slate-200 hover:bg-white/12", ghost: "text-slate-400 hover:bg-white/8 hover:text-white" }, size: { default: "h-9 px-3", sm: "h-8 px-2.5 text-xs", lg: "h-10 px-4" } },
  defaultVariants: { variant: "primary", size: "default" }
});

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
