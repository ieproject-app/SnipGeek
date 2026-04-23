"use client"

import { BellRing, TriangleAlert } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={4500}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant === "destructive" ? TriangleAlert : BellRing

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/70 text-foreground/80 group-[.destructive]:border-destructive-foreground/15 group-[.destructive]:bg-destructive-foreground/10 group-[.destructive]:text-destructive-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="grid min-w-0 gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action ? (
              <div className="ml-auto flex items-center gap-2 pl-2">
                <span className="hidden h-8 w-px bg-border/60 sm:block group-[.destructive]:bg-destructive-foreground/15" />
                {action}
              </div>
            ) : null}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
