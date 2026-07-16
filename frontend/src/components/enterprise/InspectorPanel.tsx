import React, { useEffect } from 'react'
import { X, PanelRightClose } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface InspectorPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  width?: string // e.g. "max-w-md", "max-w-lg", "max-w-xl"
}

export default function InspectorPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  width = 'max-w-md',
}: InspectorPanelProps) {
  
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className={`relative w-full ${width} h-full bg-[#07090e] border-l border-white/5 shadow-2xl flex flex-col z-10`}
          >
            {/* Top Border Deco */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20" />

            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-white/5 shrink-0 select-none">
              <div className="flex flex-col gap-0.5 max-w-[70%]">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                  INSPECTOR VIEW
                </span>
                <h3 className="text-base font-bold text-white truncate font-display">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-zinc-400 truncate font-sans">
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-white/5 bg-[#0b0c10] text-zinc-400 hover:text-white hover:border-white/15 transition-all duration-150"
                  title="Close Inspector"
                >
                  <PanelRightClose size={15} />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              {children}
            </div>

            {/* Footer Actions (Optional) */}
            {actions && (
              <div className="px-6 py-4 border-t border-white/5 bg-[#05070a] flex items-center justify-end gap-3 shrink-0">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
