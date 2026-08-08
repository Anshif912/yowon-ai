/**
 * CouncilDetailView — AI Agent Roster Panel
 * Matches screenshot: left agent list with scores, right detail pane with
 * score ring, FINISHED badge, dimension scores bar, strengths/weaknesses, recommendation, intelligence sources
 */
import React, { useState } from 'react'
import { Cpu, Shield, Lightbulb, Globe, Gavel, Brain, Clock, FileText, CheckCircle, AlertTriangle, Bookmark } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReportData } from '../../types'

interface Props { report: ReportData }

/* ── Agent Meta ─────────────────────────────────────────── */
const AGENTS = [
  { key: 'technical',  altKeys: ['engineering', 'forge'],   label: 'Forge',    role: 'Architecture & Engineering',  icon: Cpu,       color: '#31E6FF' },
  { key: 'security',   altKeys: ['sentinel'],               label: 'Sentinel', role: 'Security & Compliance',        icon: Shield,    color: '#FF5C5C' },
  { key: 'impact',     altKeys: ['risk_impact', 'guardian', 'risk'], label: 'Guardian', role: 'Risk & Impact', icon: Globe, color: '#F5B942' },
  { key: 'innovation', altKeys: ['visionary', 'innovation_scalability'], label: 'Visionary', role: 'Innovation & Scalability', icon: Lightbulb, color: '#8B5CF6' },
  { key: 'impact',     altKeys: ['chief_evaluation', 'yowon_prime'], label: 'Prime', role: 'Chief Evaluator', icon: Gavel, color: '#F5B942' },
]

// Deduplicate by label
const UNIQUE_AGENTS = AGENTS.filter((a, i, arr) => arr.findIndex(b => b.label === a.label) === i)

/* ── Score Ring ─────────────────────────────────────────── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r   = 36
  const circ = 2 * Math.PI * r
  const pct  = Math.max(0, Math.min(100, score))

  return (
    <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={45} cy={45} r={r} fill="none" stroke="#1A2535" strokeWidth={7} />
      <motion.circle
        cx={45} cy={45} r={r}
        fill="none" stroke={color} strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
      <text
        x={45} y={50}
        textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: '45px 45px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 18, fontWeight: 700, fill: color }}
      >
        {Math.round(score)}
      </text>
    </svg>
  )
}

export default function CouncilDetailView({ report }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const vd       = report?.verdict_data as any
  const scores   = vd?.agent_scores || {}
  const evals    = report?.evaluations || {}

  // Resolve score for each agent
  const agentData = UNIQUE_AGENTS.map(a => {
    const allKeys   = [a.key, ...a.altKeys]
    const score     = allKeys.reduce((found, k) => found ?? scores[k], undefined as number | undefined) ?? 0
    const evalEntry = allKeys.reduce((found, k) => found ?? evals[k], undefined as { score: number | null; findings: string } | undefined)
    const findings  = evalEntry?.findings || ''
    return { ...a, score, findings }
  })

  const selected = agentData[selectedIdx]

  // Map agent name to reasoning section key
  const sectionMap: Record<string, string> = {
    'Forge': 'architecture',
    'Sentinel': 'security',
    'Guardian': 'risk',
    'Visionary': 'innovation',
    'Prime': 'recommendations'
  }

  const sKey = sectionMap[selected.label]
  const secData = vd?.reasoning_sections?.[sKey]

  const summary = secData?.summary || `${selected.label} evaluation completed with score ${Math.round(selected.score)}.`

  // Parse strengths / weaknesses / recommendation from findings text (fallback)
  function parseSection(text: string, keyword: string): string[] {
    const lower = text.toLowerCase()
    const idx   = lower.indexOf(keyword)
    if (idx === -1) return []
    const section = text.slice(idx, idx + 400)
    const lines   = section.split('\n').slice(1, 6)
    return lines
      .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(l => l.length > 8)
      .slice(0, 3)
  }

  const strengths = (secData?.positive_findings && secData.positive_findings.length > 0)
    ? secData.positive_findings
    : (parseSection(selected.findings, 'strength').length
        ? parseSection(selected.findings, 'strength')
        : ['Strong performance in this dimension'])

  const weaknesses = (secData?.negative_findings && secData.negative_findings.length > 0)
    ? secData.negative_findings
    : (parseSection(selected.findings, 'weakness').length
        ? parseSection(selected.findings, 'weakness')
        : [])

  const recommendation = (secData?.recommended_actions && secData.recommended_actions.length > 0)
    ? secData.recommended_actions.join('. ')
    : (parseSection(selected.findings, 'recommend').join('. ') || `Review ${selected.role.toLowerCase()} best practices.`)

  const dimensionScore = Math.round(selected.score)
  const scoreColor     = selected.color


  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[520px] gap-0 rounded-xl overflow-hidden border border-zinc-800">
      {/* ── LEFT: Agent Roster ───────────────────────── */}
      <div className="lg:w-[240px] shrink-0 bg-[#07090F] border-r border-zinc-800 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-800">
          <Brain size={13} className="text-zinc-500" />
          <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">Agent Roster</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {agentData.map((agent, i) => {
            const Icon = agent.icon
            const isActive = i === selectedIdx
            return (
              <button
                key={`${agent.label}-${i}`}
                onClick={() => setSelectedIdx(i)}
                className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 transition-colors"
                style={{
                  background: isActive ? `${agent.color}12` : 'transparent',
                  borderLeft: isActive ? `3px solid ${agent.color}` : '3px solid transparent',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: agent.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate" style={{ color: isActive ? agent.color : undefined }}>
                      {agent.label}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">{agent.role}</p>
                  </div>
                </div>
                <span
                  className="font-mono font-bold text-[12px] shrink-0 px-1.5 py-0.5 rounded"
                  style={{
                    color: agent.score >= 75 ? '#10B981' : agent.score >= 60 ? '#F5B942' : '#FF5C5C',
                    background: agent.score >= 75 ? '#10B98115' : agent.score >= 60 ? '#F5B94215' : '#FF5C5C15',
                  }}
                >
                  {Math.round(agent.score)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT: Agent Detail ──────────────────────── */}
      <div className="flex-1 bg-[#090d13] p-7 overflow-y-auto space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">{selected.label}</h2>
                <p className="text-[13px] font-mono" style={{ color: selected.color }}>{selected.role}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
                    FINISHED
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                    <Clock size={9} /> 1.2s
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                    <FileText size={9} /> 5 evidences
                  </span>
                </div>
              </div>
              <ScoreRing score={selected.score} color={scoreColor} />
            </div>

            {/* Summary */}
            <p className="text-[13px] text-zinc-300 leading-relaxed font-sans">
              {summary}
            </p>

            {/* Dimension Scores */}
            <div className="space-y-2">
              <p className="text-[9px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">Dimension Scores</p>
              <div className="flex items-center gap-3 font-mono text-[12px]">
                <span className="text-zinc-400">Overall</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#1A2535' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: scoreColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${dimensionScore}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-white font-bold">{dimensionScore}/100</span>
              </div>
            </div>

            {/* Strengths / Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle size={10} /> Strengths
                </p>
                <ul className="space-y-1">
                  {strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-[12px] text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle size={10} /> Weaknesses
                </p>
                <ul className="space-y-1">
                  {weaknesses.length > 0 ? weaknesses.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-[12px] text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                      {w}
                    </li>
                  )) : (
                    <li className="text-[12px] text-zinc-500">No critical weaknesses identified.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Recommendation */}
            <div className="rounded-xl p-4 border border-amber-400/20 bg-amber-400/5 space-y-1">
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-amber-400 font-bold flex items-center gap-1">
                <Bookmark size={9} /> Recommendation
              </p>
              <p className="text-[12px] text-zinc-300">{recommendation}</p>
            </div>

            {/* Intelligence Sources */}
            <div className="space-y-2">
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold">Intelligence Sources</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-[12px] text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: selected.color }} />
                  {selected.label} Engine
                </li>
              </ul>
            </div>

            {/* Citations Grounding */}
            {secData?.evidence && secData.evidence.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold">Evidence Grounding & Citations</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                  {secData.evidence.map((c: any, idx: number) => (
                    <div key={idx} className="p-3 rounded bg-white/[0.01] border border-white/[0.03] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-cyan-400 font-bold">{c.id || `E-${idx+1}`}</span>
                        <span className="text-zinc-500 text-[8.5px]">Conf: {Math.round((c.confidence || 0) * 100)}%</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans italic leading-relaxed">
                        "{c.finding}"
                      </p>
                      {c.file_path && (
                        <p className="text-[9px] text-zinc-600 mt-1">
                          File: <span className="text-cyan-400 hover:underline cursor-pointer">{c.file_path}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
