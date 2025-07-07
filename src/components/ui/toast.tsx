import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
  message: string
  type?: "success" | "error" | "info"
  duration?: number
}

interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Date.now().toString()
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 3000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: ToastProps[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ message, type = "info", onClose }: { message: string, type?: ToastProps["type"], onClose: () => void }) {
  const typeStyles = {
    success: "bg-green-900/90 text-green-100 border-green-800",
    error: "bg-red-900/90 text-red-100 border-red-800",
    info: "bg-blue-900/90 text-blue-100 border-blue-800"
  }

  return (
    <div className={cn(
      "px-4 py-3 rounded-lg border backdrop-blur-sm animate-in slide-in-from-right fade-in duration-200",
      typeStyles[type]
    )}>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}