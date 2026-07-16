import React, { useEffect } from 'react'
import { X, Filter, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  onClear: () => void
  onApply: () => void
  children: React.ReactNode
  activeFiltersCount?: number
}

export default function FilterDrawer({
  isOpen,
  onClose,
  onClear,
  onApply,
  children,
  activeFiltersCount = 0,
}: FilterDrawerProps) {

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
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Slide-out Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="relative w-full max-w-sm h-full bg-[#07090e] border-l border-white/5 shadow-2xl flex flex-col z-10 select-none"
          >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/0" />

            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
                  FILTER CONTROLS
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-400 font-mono">
                    {activeFiltersCount}
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1 text-zinc-500 hover:text-white transition-colors duration-150"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 custom-scrollbar">
              {children}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-white/5 bg-[#05070a] flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold text-zinc-400 hover:text-white border border-transparent hover:border-white/5 hover:bg-white/5 rounded-lg transition-all duration-150"
              >
                <RotateCcw size={12} />
                RESET
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-all duration-150"
                >
                  CANCEL
                </button>
                <button
                  onClick={onApply}
                  className="px-4 py-2 text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all duration-150"
                >
                  APPLY FILTERS
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
