import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  intent?: 'danger' | 'warning' | 'info' | 'success'
  loading?: boolean
  children?: React.ReactNode
}

const intentConfig = {
  danger: {
    icon: XCircle,
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    btn: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    btn: 'bg-amber-500 hover:bg-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  },
  info: {
    icon: Info,
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    btn: 'bg-cyan-400 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.2)]',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    btn: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  },
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  intent = 'info',
  loading = false,
  children,
}: ConfirmationDialogProps) {
  
  const config = intentConfig[intent]
  const Icon = config.icon
  
  // Keybindings: Escape to close, Enter to confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, loading])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden select-none">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-md bg-[#07090e] border border-white/5 shadow-2xl rounded-2xl overflow-hidden z-10 p-6 flex flex-col gap-4 text-left"
          >
            {/* Top border glow indicator */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${config.bg.replace('/10', '/30')}`} />

            {/* Title / Icon Row */}
            <div className="flex gap-4 items-start">
              <div className={`p-2.5 rounded-xl border shrink-0 ${config.bg} ${config.border} ${config.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-bold text-white font-display">
                  {title}
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Custom Children Input Slot */}
            {children && (
              <div className="mt-2 w-full">
                {children}
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-mono font-bold text-zinc-400 hover:text-white border border-transparent hover:border-white/5 hover:bg-white/5 rounded-lg disabled:opacity-40 disabled:hover:border-transparent transition-all duration-150"
              >
                {cancelText}
              </button>
              
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-lg disabled:opacity-40 transition-all duration-150 ${config.btn}`}
              >
                {loading && <Loader2 className="animate-spin" size={13} />}
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
