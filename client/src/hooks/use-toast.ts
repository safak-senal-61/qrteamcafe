import { toast as sonnerToast } from "sonner"
import { useCallback } from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  className?: string
}

export function useToast() {
  const toast = useCallback(({ title, description, variant, className }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title, { description, className })
    } else {
      sonnerToast.success(title, { description, className })
    }
  }, [])

  return { toast }
}
