import { Link, useLocation } from 'react-router-dom'
import { CircuitBoard, Radio } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Header() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-300/10 bg-yowon-bg/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-300 via-emerald-300 to-violet-600 flex items-center justify-center shadow-glow-rose"
            whileHover={{ scale: 1.05 }}
          >
            <CircuitBoard size={18} className="text-[#04111F]" />
          </motion.div>
          <div>
            <span className="font-display font-bold text-lg text-yowon-text tracking-tight">
              YOWON AI
            </span>
            {!isLanding && (
              <p className="text-[10px] text-yowon-muted font-mono tracking-widest uppercase hidden sm:block">
                Autonomous AI Jury Platform
              </p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 glass-pill px-3 py-1.5 border-cyan-300/20">
            <Radio size={12} className="text-yowon-secondary animate-pulse" />
            <span className="text-xs font-mono text-yowon-muted">SYSTEM ONLINE</span>
          </div>
          {pathname !== '/submit' && (
            <Link to="/submit" className="yowon-btn-primary text-sm py-2 px-4">
              Start Evaluation
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
