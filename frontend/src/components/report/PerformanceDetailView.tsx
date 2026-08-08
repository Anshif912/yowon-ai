/**
 * PerformanceDetailView — Score Parameters Breakdown Panel
 * Matches screenshot: individual score bars (Architecture, Security, Innovation,
 * Council Consensus, Overall) + Analysis Index sidebar with AI-generated narrative
 */
import React from 'react'
import { TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { ReportData } from '../../types'

interface Props { report: ReportData; projectId: string }

function ScoreBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const display = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between font-mono text-[12px]">
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold text-white">{display}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#111827' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${display}%` }}
          transition={{ duration: 1.0, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function PerformanceDetailView({ report, projectId }: Props) {
  const navigate = useNavigate()
  const vd = report?.verdict_data as any
  const scores = vd?.agent_scores || {}

  const rawScore = report?.overall_score ?? vd?.overall_score ?? 0
  const overallScore = Math.round(rawScore > 1 ? rawScore : rawScore * 100)

  const archScore  = Math.round(scores.technical ?? scores.engineering ?? scores.forge ?? overallScore)
  const secScore   = Math.round(scores.security  ?? scores.sentinel ?? overallScore)
  const innScore   = Math.round(scores.innovation ?? scores.visionary ?? overallScore)
  const councilScore = Math.round(scores.impact  ?? scores.guardian ?? overallScore)

  const bars = [
    { label: 'Architecture Score', value: archScore,   color: '#31E6FF', delay: 0.0 },
    { label: 'Security Score',     value: secScore,    color: '#31E6FF', delay: 0.1 },
    { label: 'Innovation Score',   value: innScore,    color: '#31E6FF', delay: 0.2 },
    { label: 'Council Consensus',  value: councilScore, color: '#31E6FF', delay: 0.3 },
    { label: 'Overall Score',      value: overallScore, color: '#F5B942', delay: 0.4 },
  ]

  const archSection = vd?.reasoning_sections?.architecture
  const analysisText = archSection?.summary ||
    vd?.architecture_summary ||
    vd?.executive_summary ||
    `The architectural footprint relies primarily on the detected technology stack. While the fundamental structure supports current requirements, increasing complexity suggests a need for stricter modularity rules as the codebase evolves.`


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Score Bars — 2/3 width */}
      <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-[#090d13] p-7 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <TrendingUp size={16} className="text-cyan-400" />
          Score Parameters Breakdown
        </h2>
        <div className="space-y-5">
          {bars.map(b => (
            <ScoreBar key={b.label} {...b} />
          ))}
        </div>
      </div>

      {/* Analysis Index — 1/3 width */}
      <div className="rounded-xl border border-zinc-800 bg-[#090d13] p-7 flex flex-col justify-between gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800/80 pb-3">Analysis Index</h2>
          <p className="text-[13px] text-zinc-400 leading-relaxed">
            {analysisText}
          </p>
        </div>
        <div className="pt-4 border-t border-zinc-800/60 space-y-1">
          <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Overall Score</p>
          <p className="font-mono font-extrabold text-cyan-400" style={{ fontSize: 32 }}>{overallScore}/100</p>
        </div>
      </div>
    </div>
  )
}
