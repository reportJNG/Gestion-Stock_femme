import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,hsl(var(--rose)),hsl(var(--rose-soft)))] text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/35 active:translate-y-0 dark:text-black-rose",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-lg active:translate-y-0",
        outline:
          "border border-primary/45 bg-[hsl(var(--surface-glass))] text-primary shadow-sm shadow-primary/10 backdrop-blur hover:-translate-y-0.5 hover:border-primary hover:bg-brand-muted hover:shadow-md hover:shadow-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm shadow-primary/10 hover:-translate-y-0.5 hover:bg-accent hover:text-primary",
        ghost:
          "text-foreground hover:bg-brand-muted hover:text-primary hover:shadow-sm hover:shadow-primary/10",
        link: "min-h-0 text-primary underline-offset-4 hover:text-primary/85 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-12 rounded-2xl px-7",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
