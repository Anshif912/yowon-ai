/**
 * VerdictDetailView — Premium Verdict Panel
 * Layout (exact match to screenshot):
 *   Row 1: [Hero block 70%] | [Sidebar: Production Readiness + Risk Level 30%]
 *   Row 2: CONFIDENCE BREAKDOWN — 6 columns (Overall, Architecture, Security, Business, Innovation, Performance)
 *   Row 3: Strengths / Weaknesses / Deployment / Eng Hours / Business Impact
 */
import React, { useState } from 'react'
import { Shield, Activity, AlertTriangle, CheckCircle, Zap, TrendingUp, Sliders } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ReportData } from '../../types'


interface Props { report: ReportData }

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-0.5 rounded-full overflow-hidden mt-1" style={{ background: '#1A2535' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </div>
  )
}

export default function VerdictDetailView({ report }: Props) {
  const vd = report?.verdict_data as any

  const rawScore = report?.overall_score ?? vd?.overall_score ?? 75
  const overallScore = Math.round(rawScore > 1 ? rawScore : rawScore * 100)

  const rawConf  = vd?.confidence ?? 0.85
  const confidence = Math.round(rawConf > 1 ? rawConf : rawConf * 100)

  const recommendation = (vd?.final_recommendation || vd?.verdict || 'CONDITIONAL APPROVE')
    .toString().toUpperCase().replace(/_/g, ' ')

  const riskLevel = (vd?.risk_level || 'LOW').toUpperCase()
  const riskColor = riskLevel === 'HIGH' ? '#FF5C5C' : riskLevel === 'MEDIUM' ? '#F5B942' : '#10B981'

  const isReady = !riskLevel.includes('HIGH')

  /* Dynamic Reasoning Sections from LLM */
  const sectionData = vd?.reasoning_sections?.executive

  const title = sectionData?.title || recommendation
  const summary = sectionData?.summary || vd?.executive_summary || vd?.final_reason || ''
  const takeaway = sectionData?.executive_takeaway
  const deploymentAdvice = sectionData?.deployment_readiness || vd?.production_readiness || vd?.deployment_advice || 'Repository meets all criteria for production deployment.'
  
  const strengths = (sectionData?.positive_findings && sectionData.positive_findings.length > 0)
    ? sectionData.positive_findings
    : (vd?.top_strengths || vd?.strengths || [
        'Modular architecture with clear separation of frontend and backend',
        'Use of Docker for deployment',
      ])

  const weaknesses = (sectionData?.negative_findings && sectionData.negative_findings.length > 0)
    ? sectionData.negative_findings
    : (vd?.top_weaknesses || vd?.weaknesses || [
        'Static Analysis Health: 0/100',
        'Testing Health: 55.0/100',
      ])

  const actions = (sectionData?.recommended_actions && sectionData.recommended_actions.length > 0)
    ? sectionData.recommended_actions
    : (vd?.recommended_fixes || [])

  const engHours = vd?.engineering_hours ?? vd?.estimated_engineering_hours ?? 16
  const businessImpact = vd?.business_impact || 'From a business perspective, the repository exhibits a maintainability grade of B, carrying an estimated 2 days of technical debt.'

  /* Confidence breakdown */
  const s = vd?.agent_scores || {}
  const breakdown = [
    { label: 'Overall',      value: confidence },
    { label: 'Architecture', value: Math.round(s.technical ?? s.engineering ?? s.forge ?? confidence) },
    { label: 'Security',     value: Math.round(s.security  ?? s.sentinel  ?? confidence) },
    { label: 'Business',     value: Math.round(s.impact    ?? s.guardian  ?? confidence) },
    { label: 'Innovation',   value: Math.round(s.innovation ?? s.visionary ?? confidence) },
    { label: 'Performance',  value: Math.round(s.scalability ?? s.innovation_scalability ?? confidence) },
  ]

  return (
    <div className="space-y-4 font-sans text-white">

      {/* ── Row 1: Hero (left) + Sidebar (right) ─────────── */}
      <div className="flex gap-4" style={{ alignItems: 'stretch' }}>

        {/* Hero block */}
        <div
          className="flex-1 rounded-2xl p-10 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, #1A1400 0%, #141008 40%, #0E0C08 100%)',
            border: '1px solid #F5B94222',
            minHeight: 200,
          }}
        >
          <div className="space-y-6">
            {/* Icon + Verdict */}
            <div className="flex items-center gap-5">
              <Shield size={38} style={{ color: '#F5B942' }} />
              <h1
                className="font-mono font-black tracking-widest uppercase"
                style={{ fontSize: 32, color: '#F5B942', lineHeight: 1.1 }}
              >
                {title}
              </h1>
            </div>

            {/* Amber confidence bar */}
            <div className="space-y-2">
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: '#2A1F00', maxWidth: 480 }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#F5B942' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 1.3, ease: 'easeOut' }}
                />
              </div>
              <span
                className="font-mono font-black text-sm tracking-widest"
                style={{ color: '#F5B942' }}
              >
                {confidence}% CONFIDENCE ({sectionData?.confidence || 'High'})
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="flex flex-col gap-4" style={{ width: 240, flexShrink: 0 }}>
          {/* Production Readiness */}
          <div
            className="flex-1 rounded-xl p-5 flex flex-col justify-between"
            style={{ background: '#070A0F', border: '1px solid #111C27' }}
          >
            <p className="text-[8.5px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">
              Production Readiness
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <Activity size={14} style={{ color: '#10B981' }} />
              <div className="w-3 h-3 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px #10B981' }} />
            </div>
            <p className="text-[15px] font-semibold text-white mt-2">
              {isReady ? 'Ready' : 'Not Ready'}
            </p>
          </div>

          {/* Risk Level */}
          <div
            className="flex-1 rounded-xl p-5 flex flex-col justify-between"
            style={{ background: '#070A0F', border: '1px solid #111C27' }}
          >
            <p className="text-[8.5px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">
              Risk Level
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: riskColor }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: riskColor }} />
              </div>
              <span
                className="font-mono font-black text-base"
                style={{ color: riskColor }}
              >
                {riskLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Confidence Breakdown ───────────────────── */}
      <div
        className="rounded-xl p-6"
        style={{ background: '#070A0F', border: '1px solid #111C27' }}
      >
        <p className="text-[9px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold flex items-center gap-2 mb-5">
          <Zap size={11} /> Confidence Breakdown
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-5">
          {breakdown.map(d => (
            <div key={d.label}>
              <p className="text-[10.5px] text-zinc-400 font-mono">{d.label}</p>
              <p className="text-[18px] font-bold text-white font-mono mt-0.5">{d.value}%</p>
              <MiniBar value={d.value} color="#31E6FF" />
            </div>
          ))}
        </div>
        <p className="text-[10.5px] text-zinc-600 font-mono mt-5">
          Confidence derived from {breakdown.length} specialized agents evaluating specific repository dimensions.
        </p>
      </div>

      {/* ── Row 3: Executive Summary / Takeaway ───────────────────────── */}
      {summary && (
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ borderLeft: '3px solid #31E6FF', background: '#070A0F', border: '1px solid #111C27', borderLeftColor: '#31E6FF', borderLeftWidth: 3 }}
        >
          <p className="text-[13px] text-zinc-300 leading-relaxed font-sans">{summary}</p>
          {takeaway && (
            <div className="mt-2 pt-2 border-t border-white/[0.05] text-[11px] font-mono text-cyan-400">
              <span className="text-zinc-500 uppercase tracking-widest font-black block text-[8px] mb-1">Executive Takeaway:</span>
              {takeaway}
            </div>
          )}
        </div>
      )}

      {/* ── Row 4: Strengths / Weaknesses ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5 space-y-3" style={{ background: '#070A0F', border: '1px solid #111C27' }}>
          <p className="text-[8.5px] font-mono uppercase tracking-[0.28em] text-emerald-400 font-bold flex items-center gap-2">
            <CheckCircle size={10} /> Top Strengths
          </p>
          <ul className="space-y-2">
            {strengths.slice(0, 5).map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl p-5 space-y-3" style={{ background: '#070A0F', border: '1px solid #111C27' }}>
          <p className="text-[8.5px] font-mono uppercase tracking-[0.28em] text-amber-400 font-bold flex items-center gap-2">
            <AlertTriangle size={10} /> Top Weaknesses
          </p>
          <ul className="space-y-2">
            {weaknesses.slice(0, 5).map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Row 5: Deployment / Hours / Business Impact ───── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 space-y-2" style={{ background: '#070A0F', border: '1px solid #111C27' }}>
          <p className="text-[8.5px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">Deployment Advice</p>
          <p className="text-[12.5px] text-zinc-300 leading-relaxed font-sans">{deploymentAdvice}</p>
        </div>
        <div className="rounded-xl p-5 space-y-2" style={{ background: '#070A0F', border: '1px solid #111C27' }}>
          <p className="text-[8.5px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">Est. Engineering Hours</p>
          <p className="font-mono font-black text-cyan-400" style={{ fontSize: 38 }}>{engHours}h</p>
        </div>
        <div className="rounded-xl p-5 space-y-2" style={{ background: '#070A0F', border: '1px solid #111C27' }}>
          <p className="text-[8.5px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">Business Impact</p>
          <p className="text-[12px] text-zinc-300 leading-relaxed font-sans">
            {sectionData?.business_implications?.[0] || businessImpact}
          </p>
        </div>
      </div>

      {/* ── Row 6: Recommended Actions Checklist ─────────── */}
      {actions.length > 0 && (
        <div className="rounded-xl p-5 space-y-3" style={{ background: '#070A0F', border: '1px solid #111C27' }}>
          <p className="text-[8.5px] font-mono uppercase tracking-[0.28em] text-cyan-400 font-bold">
            Prioritized Technical Roadmap
          </p>
          <ul className="space-y-2">
            {actions.map((act: string, i: number) => (
              <li key={i} className="flex gap-2.5 items-center text-[12.5px] text-zinc-300">
                <span className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 text-[10px] flex items-center justify-center font-mono font-bold text-zinc-500">
                  {i + 1}
                </span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── P2: Decision Simulation Playground ─────────── */}
      <DecisionSimulatorCard agentScores={s} baseVerdict={recommendation} baseScore={overallScore} />

      {/* ── Row 7: Evidence Grounding & Citations ─────────── */}
      {sectionData?.evidence && sectionData.evidence.length > 0 && (
        <div className="rounded-xl p-5 space-y-3 font-mono text-[11px]" style={{ background: '#070A0F', border: '1px solid #111C27' }}>
          <p className="text-[8.5px] uppercase tracking-[0.28em] text-zinc-500 font-bold">
            Evidence Grounding & Citations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sectionData.evidence.map((c: any, i: number) => (
              <div key={i} className="p-3.5 rounded bg-white/[0.02] border border-white/[0.04] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
                    {c.id || `E-${i+1}`}
                  </span>
                  <span className="text-zinc-500 text-[9px] uppercase tracking-wider">
                    Source: {c.source || 'Engine'}
                  </span>
                </div>
                <p className="text-zinc-300 text-[11.5px] leading-relaxed font-sans italic">
                  "{c.finding}"
                </p>
                {c.file_path && (
                  <div className="text-[9.5px] text-zinc-500 flex items-center gap-1 mt-1.5">
                    <span>File:</span>
                    <span className="text-cyan-400 underline cursor-pointer">
                      {c.file_path}{c.line_range ? `:${c.line_range}` : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

/* ── Interactive Decision Simulator Helper Component ─────────────────────────── */
function DecisionSimulatorCard({ agentScores, baseVerdict, baseScore }: { agentScores: any; baseVerdict: string; baseScore: number }) {
  const [fixAuth, setFixAuth]   = useState(false)
  const [fixTests, setFixTests] = useState(false)
  const [fixCache, setFixCache] = useState(false)
  const [fixDocs, setFixDocs]   = useState(false)

  // base scores
  const tScore = Math.round(agentScores.technical ?? agentScores.engineering ?? agentScores.forge ?? baseScore)
  const sScore = Math.round(agentScores.security  ?? agentScores.sentinel ?? baseScore)
  const scScore = Math.round(agentScores.scalability ?? agentScores.innovation_scalability ?? baseScore)
  const iScore = Math.round(agentScores.innovation ?? agentScores.visionary ?? baseScore)
  const bScore = Math.round(agentScores.impact ?? agentScores.guardian ?? baseScore)
  const pScore = Math.round(agentScores.presentation ?? agentScores.showcase ?? baseScore)

  // simulated scores
  const simT   = Math.min(100, tScore + (fixTests ? 20 : 0))
  const simS   = Math.min(100, sScore + (fixAuth ? 25 : 0))
  const simSc  = Math.min(100, scScore + (fixCache ? 20 : 0))
  const simI   = Math.min(100, iScore + (fixDocs ? 15 : 0))

  // overall simulation
  // weights: technical=0.25, security=0.20, scalability=0.15, innovation=0.15, impact=0.15, presentation=0.10
  const simOverall = Math.round(
    simT * 0.25 +
    simS * 0.20 +
    simSc * 0.15 +
    simI * 0.15 +
    bScore * 0.15 +
    pScore * 0.10
  )

  const simVerdict = simOverall >= 82 && simS >= 75 ? 'ACCEPT' : (simOverall >= 60 ? 'CONDITIONAL APPROVE' : 'IMPROVE')
  const simRisk    = simS >= 75 ? 'LOW' : (simS >= 50 ? 'MEDIUM' : 'HIGH')
  const simRiskColor = simRisk === 'HIGH' ? 'text-red-400' : (simRisk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400')

  const scoreDiff  = simOverall - baseScore

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: '#070A0F', border: '1px solid #111C27' }}>
      <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3.5">
        <Sliders size={15} className="text-cyan-400" />
        <h3 className="text-[13px] font-bold text-white uppercase tracking-wider font-mono">
          AI Decision Simulation Playground
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Toggle options */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-[11px] text-zinc-500 font-sans">
            Select remediation plans to simulate prospective score changes in real time before refactoring code:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setFixAuth(!fixAuth)}
              className={`text-left p-3.5 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                fixAuth ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-white/[0.01] border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <p className="text-[12.5px] font-bold">Fix Auth Middleware</p>
                <p className="text-[9.5px] text-zinc-500">Security Score +25</p>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${fixAuth ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-600'}`}>
                {fixAuth && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </button>

            <button
              onClick={() => setFixTests(!fixTests)}
              className={`text-left p-3.5 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                fixTests ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-white/[0.01] border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <p className="text-[12.5px] font-bold">Implement Unit Tests</p>
                <p className="text-[9.5px] text-zinc-500">Technical Score +20</p>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${fixTests ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-600'}`}>
                {fixTests && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </button>

            <button
              onClick={() => setFixCache(!fixCache)}
              className={`text-left p-3.5 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                fixCache ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-white/[0.01] border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <p className="text-[12.5px] font-bold">Add Redis & Caching</p>
                <p className="text-[9.5px] text-zinc-500">Scalability Score +20</p>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${fixCache ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-600'}`}>
                {fixCache && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </button>

            <button
              onClick={() => setFixDocs(!fixDocs)}
              className={`text-left p-3.5 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                fixDocs ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-white/[0.01] border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <p className="text-[12.5px] font-bold">Document Architecture API</p>
                <p className="text-[9.5px] text-zinc-500">Innovation Score +15</p>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${fixDocs ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-600'}`}>
                {fixDocs && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </button>
          </div>
        </div>

        {/* Recalculated values side-by-side */}
        <div className="p-4 rounded border border-zinc-800 bg-zinc-950 flex flex-col justify-between gap-3 font-mono text-[11px]">
          <div>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-2">Simulated Outcome</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span>Verdict:</span>
                <span className="font-bold text-white">{simVerdict}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <span className={`font-bold ${simRiskColor}`}>{simRisk}</span>
              </div>
              <div className="flex justify-between">
                <span>Security Score:</span>
                <span className="text-white">{simS}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Technical Score:</span>
                <span className="text-white">{simT}/100</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-zinc-800">
            <p className="text-[9px] text-zinc-500 uppercase">Simulated Overall Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-400">{simOverall}</span>
              {scoreDiff > 0 && (
                <span className="text-[11px] font-bold text-emerald-400">+{scoreDiff} gain</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



