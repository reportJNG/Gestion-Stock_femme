import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[104px] w-full rounded-2xl border border-[hsl(var(--border-rose))] bg-[hsl(var(--surface-glass))] px-3.5 py-3 text-sm shadow-sm shadow-primary/10 ring-offset-background backdrop-blur transition-all placeholder:text-muted-foreground/70 hover:border-primary/55 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:shadow-md focus-visible:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
