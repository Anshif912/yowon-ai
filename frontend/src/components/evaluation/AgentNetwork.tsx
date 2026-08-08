/**
 * AgentNetwork — Mission Control AI Network Visualization
 *
 * Upgrades:
 * - Proportions: Scale increased by ~15% (orbit radius ~0.42)
 * - Hub-Spoke: All agents connect directly to CORE
 * - Secondary collaboration links: Forge ── Guardian, Sentinel ── Prime, Visionary ── Prime
 * - 2px stroke width with animated data packets traveling along edges
 * - Illuminated static lines post-completion, pulsing while running
 * - Agent node states: Waiting (grey), Running (cyan glow), Completed (emerald border + tick), Error (red pulse)
 * - Interactive hover tooltip showing Agent, Execution Time, Score, and Status
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Cpu, Shield, Presentation, Lightbulb, Globe, Gavel, Brain, Check, AlertCircle } from 'lucide-react'
import type { AgentStateEntry, AgentStatus } from '../../types'

/* ── Semantic design tokens ─────────────────────────────── */
const T = {
  cyan   : '#31E6FF',   // Forge / Coordinator
  green  : '#10B981',   // Guardian / Completed
  red    : '#FF5C5C',   // Sentinel / Error
  violet : '#8B5CF6',   // Prime / Decision
  orange : '#F5A623',   // Visionary / Innovation
  amber  : '#F5B942',   // Showcase / Presentation
  muted  : '#1F2937',
  dim    : '#374151',
  bg     : '#050608',
  text   : '#F3F4F6',
  sub    : '#9CA3AF',
  mono   : "'IBM Plex Mono', monospace",
  sans   : "'Inter', sans-serif",
}

/* ── Agent Definitions ───────────────────────────────────── */
interface AgentDef {
  id: string
  icon: React.ElementType
  label: string
  angle: number
  accent: string
  role: string
}

const AGENTS: AgentDef[] = [
  { id: 'risk',         icon: Globe,        label: 'Guardian',    role: 'Scalability Evaluator', angle: 270,   accent: T.green  },
  { id: 'chief',        icon: Gavel,        label: 'Prime',       role: 'Business Impact',       angle: 321.4, accent: T.violet },
  { id: 'coordinator',  icon: Brain,        label: 'Coordinator', role: 'Context Synthesis',    angle: 12.8,  accent: T.cyan   },
  { id: 'technical',    icon: Cpu,          label: 'Forge',       role: 'Architecture Review',   angle: 64.3,  accent: T.cyan   },
  { id: 'security',     icon: Shield,       label: 'Sentinel',    role: 'Vulnerability Audit',   angle: 115.7, accent: T.red    },
  { id: 'presentation', icon: Presentation, label: 'Showcase',    role: 'Presentation Quality',  angle: 167.1, accent: T.amber  },
  { id: 'innovation',   icon: Lightbulb,    label: 'Visionary',   role: 'Novelty & Impact',      angle: 218.6, accent: T.orange },
]

const SPOKES = AGENTS.map(a => a.id)

/* Secondary Collaboration Links */
const COLLABORATION_LINKS: [string, string][] = [
  ['technical', 'risk'],      // Forge ─── Guardian
  ['security', 'chief'],       // Sentinel ─── Prime
  ['innovation', 'chief'],     // Visionary ─── Prime
  ['coordinator', 'chief'],    // Coordinator ─── Prime
]

/* ── Helpers ────────────────────────────────────────────── */
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function getStatus(id: string, states?: Record<string, AgentStateEntry>, statuses?: AgentStatus[], idx?: number): AgentStatus {
  const s = states?.[id]
  if (s?.status === 'failed')    return 'failed' as any
  if (s?.status === 'completed') return 'completed'
  if (s?.status === 'running')   return 'running'
  return statuses?.[idx ?? 0] ?? 'waiting'
}

/* ── Connection Line (2px) with Traveling Data Packets ────── */
function ConnectionEdge({
  x1, y1, x2, y2, color, active, pulsing, isDone, reduced,
}: {
  x1: number; y1: number; x2: number; y2: number
  color: string; active: boolean; pulsing: boolean; isDone: boolean; reduced: boolean
}) {
  const len  = Math.hypot(x2 - x1, y2 - y1)
  const dash = 8

  return (
    <g>
      {/* Base line — 2px width per spec */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isDone ? `${color}40` : active ? `${color}30` : '#1A2535'}
        strokeWidth={2}
      />

      {/* Pulsing / Flowing line */}
      {active && !reduced && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color}
          strokeWidth={2}
          strokeOpacity={pulsing ? 0.85 : 0.45}
          strokeDasharray={`${dash} ${len}`}
          style={{ filter: pulsing ? `drop-shadow(0 0 4px ${color})` : 'none' }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from={len + dash}
            to={-dash}
            dur={pulsing ? '1.1s' : '2.4s'}
            repeatCount="indefinite"
          />
        </line>
      )}

      {/* Traveling Data Packet Dot */}
      {pulsing && !reduced && (
        <circle r={2.5} fill="#31E6FF" style={{ filter: 'drop-shadow(0 0 4px #31E6FF)' }}>
          <animateMotion
            path={`M ${x1} ${y1} L ${x2} ${y2}`}
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  )
}

/* ── Secondary Collaboration Arc Edge (2px) ─────────────── */
function CollaborationArc({
  x1, y1, x2, y2, cx: ccx, cy: ccy, color, active, reduced,
}: {
  x1: number; y1: number; x2: number; y2: number
  cx: number; cy: number
  color: string; active: boolean; reduced: boolean
}) {
  const d   = `M ${x1} ${y1} Q ${ccx} ${ccy} ${x2} ${y2}`
  const len = Math.hypot(x2 - x1, y2 - y1) * 1.25

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={active ? `${color}25` : '#141E2B'}
        strokeWidth={2}
        strokeDasharray="4 6"
      />
      {active && !reduced && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.6}
          strokeDasharray={`6 ${len}`}
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        >
          <animate attributeName="stroke-dashoffset" from={len + 6} to={-6} dur="2.2s" repeatCount="indefinite" />
        </path>
      )}
    </g>
  )
}

/* ── Core Nucleus with Volumetric Bloom ──────────────────── */
function CoreNucleus({
  cx, cy, reduced, isActive,
}: { cx: number; cy: number; reduced: boolean; isActive: boolean }) {
  const r0 = 50, r1 = 66, r2 = 84

  return (
    <g>
      {/* Outer ambient guide circle */}
      <circle cx={cx} cy={cy} r={r2} fill="none" stroke={`${T.cyan}12`} strokeWidth={1} strokeDasharray="4 8" />

      {/* Breathing ring 1 */}
      {!reduced && (
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke={`${T.cyan}25`} strokeWidth={1.5}>
          <animate attributeName="r" values={`${r1};${r1 + 5};${r1}`} dur="3.4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.4;0.15;0.4" dur="3.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Sync pulse ring */}
      {!reduced && isActive && (
        <circle cx={cx} cy={cy} r={r0} fill="none" stroke={T.cyan} strokeWidth={1.5} strokeOpacity={0}>
          <animate attributeName="r" values={`${r0};${r0 + 75};${r0 + 75}`} dur="4.8s" repeatCount="indefinite" begin="1.5s" />
          <animate attributeName="stroke-opacity" values="0.45;0;0" dur="4.8s" repeatCount="indefinite" begin="1.5s" />
        </circle>
      )}
    </g>
  )
}

/* ── Main Component ──────────────────────────────────────── */
export interface AgentNetworkProps {
  activeAgent  : string
  agentStates ?: Record<string, AgentStateEntry>
  statuses     : AgentStatus[]
  showPresentation?: boolean
  status?      : string
}

export default function AgentNetwork({
  activeAgent, agentStates, statuses, showPresentation = true, status,
}: AgentNetworkProps) {
  const reduced       = useReducedMotion() ?? false
  const containerRef  = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 680, h: 580 })
  const [hoveredAgent, setHoveredAgent] = useState<AgentDef | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDims({ w: Math.max(380, width), h: Math.max(360, height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = dims
  const cx    = w / 2
  const cy    = h / 2 - 18
  // Increased scale by ~15% per spec (0.42 radius)
  const orbit = Math.min(w, h) * 0.42
  const core  = 52

  const agents = showPresentation ? AGENTS : AGENTS.filter(a => a.id !== 'presentation')
  const spokes = showPresentation ? SPOKES : SPOKES.filter(id => id !== 'presentation')

  const pos: Record<string, { x: number; y: number }> = {}
  agents.forEach(a => { pos[a.id] = polar(cx, cy, orbit, a.angle) })

  const isDone   = status === 'done'
  const isFailed = status === 'failed'
  const capColor = isFailed ? T.red : isDone ? T.green : T.cyan
  const capLabel = isFailed ? 'FAILED' : isDone ? 'COMPLETED' : 'EXECUTING'
  const capDesc  = isFailed
    ? 'Pipeline encountered an exception'
    : isDone ? 'All jury models finished evaluation'
    : 'AI Council actively reasoning...'

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ minHeight: 440 }}>
      {/* ── SVG layer: 2px connections + pulses ─────────── */}
      <svg className="absolute inset-0 pointer-events-none z-0" width={w} height={h} style={{ overflow: 'visible' }}>
        {/* Outer orbit circle */}
        <circle cx={cx} cy={cy} r={orbit} fill="none" stroke={`${T.cyan}0B`} strokeWidth={1} strokeDasharray="3 9" />

        {/* Core nucleus background rings */}
        <CoreNucleus cx={cx} cy={cy} reduced={reduced} isActive={!isDone && !isFailed} />

        {/* Spoke connections: Agent → CORE */}
        {spokes.map(id => {
          const p = pos[id]
          if (!p) return null
          const agent   = agents.find(a => a.id === id)!
          const st      = getStatus(id, agentStates, statuses)
          const active  = st === 'running' || st === 'completed'
          const pulsing = st === 'running'

          const dx  = cx - p.x, dy = cy - p.y, dist = Math.hypot(dx, dy)
          const ux  = dx / dist, uy = dy / dist
          const x2e = cx - ux * (core + 2)
          const y2e = cy - uy * (core + 2)
          const x1e = p.x + ux * 28
          const y1e = p.y + uy * 28

          return (
            <ConnectionEdge
              key={`spoke-${id}`}
              x1={x1e} y1={y1e} x2={x2e} y2={y2e}
              color={agent.accent}
              active={active}
              pulsing={pulsing}
              isDone={st === 'completed'}
              reduced={reduced}
            />
          )
        })}

        {/* Secondary Collaboration Arcs */}
        {COLLABORATION_LINKS.map(([from, to]) => {
          if (!showPresentation && (from === 'presentation' || to === 'presentation')) return null
          const a = pos[from], b = pos[to]
          if (!a || !b) return null
          const agentFrom = agents.find(x => x.id === from)!
          const fSt    = getStatus(from, agentStates, statuses)
          const tSt    = getStatus(to,   agentStates, statuses)
          const active = fSt === 'running' || tSt === 'running' || (fSt === 'completed' && tSt === 'completed')

          const mx  = (a.x + b.x) / 2, my = (a.y + b.y) / 2
          const ex  = mx - cx, ey = my - cy
          const el  = Math.hypot(ex, ey) || 1
          const cpx = mx + (ex / el) * orbit * 0.32
          const cpy = my + (ey / el) * orbit * 0.32

          return (
            <CollaborationArc
              key={`arc-${from}-${to}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              cx={cpx} cy={cpy}
              color={agentFrom.accent}
              active={active}
              reduced={reduced}
            />
          )
        })}
      </svg>

      {/* ── Visually Dominant CORE Nucleus ──────────────── */}
      <motion.div
        className="absolute z-20 flex flex-col items-center justify-center cursor-default"
        style={{
          left        : cx - core,
          top         : cy - core,
          width       : core * 2,
          height      : core * 2,
          borderRadius: '50%',
          background  : 'radial-gradient(circle at 38% 32%, #0E293B 0%, #060B12 80%)',
          border      : `2px solid ${T.cyan}`,
          boxShadow   : `0 0 0 6px ${T.cyan}0A, 0 0 45px ${T.cyan}30, inset 0 0 24px ${T.cyan}18`,
        }}
        animate={reduced ? {} : {
          boxShadow: [
            `0 0 0 6px ${T.cyan}0A, 0 0 45px ${T.cyan}30, inset 0 0 24px ${T.cyan}18`,
            `0 0 0 10px ${T.cyan}06, 0 0 65px ${T.cyan}45, inset 0 0 32px ${T.cyan}25`,
            `0 0 0 6px ${T.cyan}0A, 0 0 45px ${T.cyan}30, inset 0 0 24px ${T.cyan}18`,
          ],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span style={{
          fontFamily   : T.mono, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.24em', color: T.cyan,
          textShadow   : `0 0 16px ${T.cyan}D0`,
        }}>
          CORE
        </span>
      </motion.div>

      {/* ── Status Capsule below CORE ───────────────────── */}
      <div
        className="absolute z-30 flex flex-col items-center"
        style={{ left: 0, right: 0, top: cy + core + 16 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{
            display     : 'flex',
            alignItems  : 'center',
            gap         : 8,
            padding     : '6px 16px',
            borderRadius: 9999,
            background  : 'rgba(6, 7, 10, 0.92)',
            border      : `1px solid ${capColor}35`,
            boxShadow   : `0 4px 24px rgba(0,0,0,0.6)`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <motion.span
            animate={reduced || isDone ? {} : { opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: capColor, boxShadow: `0 0 8px ${capColor}`,
              display: 'inline-block', flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: T.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', color: capColor }}>
            {capLabel}
          </span>
          <span style={{ color: '#1E2D3D', fontSize: 9 }}>│</span>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.sub }}>
            {capDesc}
          </span>
        </motion.div>
      </div>

      {/* ── Agent Nodes ──────────────────────────────────── */}
      {agents.map((agent, idx) => {
        const p     = pos[agent.id]
        if (!p) return null

        const st    = getStatus(agent.id, agentStates, statuses, idx + 5)
        const isRun = st === 'running'
        const isDone= st === 'completed'
        const isFail= (st as string) === 'failed'
        const isAct = activeAgent === agent.id || (activeAgent === 'brief' && agent.id === 'coordinator')
        const color = isRun ? agent.accent : isDone ? T.green : isFail ? T.red : T.dim
        const Icon  = agent.icon
        const SZ    = 50
        const half  = SZ / 2
        const stateEntry = agentStates?.[agent.id]
        const score = stateEntry?.score
        const dur   = stateEntry?.duration_sec

        const nodeGlow = isRun
          ? `0 0 0 2px ${agent.accent}, 0 0 28px ${agent.accent}60, 0 8px 28px rgba(0,0,0,0.7)`
          : isDone
          ? `0 0 0 1.5px ${T.green}, 0 0 16px ${T.green}40, 0 6px 20px rgba(0,0,0,0.5)`
          : isFail
          ? `0 0 0 1.5px ${T.red}, 0 0 16px ${T.red}40, 0 6px 20px rgba(0,0,0,0.5)`
          : `0 0 0 1px ${T.muted}, 0 4px 12px rgba(0,0,0,0.4)`

        const nodeBg = isRun
          ? `radial-gradient(circle at 38% 32%, #0C283B 0%, #060B12 80%)`
          : isDone
          ? `radial-gradient(circle at 38% 32%, #092014 0%, #060B12 80%)`
          : `radial-gradient(circle at 38% 32%, #0A0E18 0%, #05070E 80%)`

        return (
          <div
            key={agent.id}
            className="absolute z-20 flex flex-col items-center"
            style={{ left: p.x - half, top: p.y - half, width: SZ, height: SZ }}
            onMouseEnter={() => setHoveredAgent(agent)}
            onMouseLeave={() => setHoveredAgent(null)}
          >
            {/* Active breathing halo */}
            {isRun && !reduced && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.9, 1.75, 2.1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                style={{
                  position: 'absolute', inset: -8, borderRadius: 18,
                  border: `1.5px solid ${agent.accent}`, pointerEvents: 'none',
                }}
              />
            )}

            {/* Node Capsule */}
            <motion.div
              style={{
                width       : SZ,
                height      : SZ,
                borderRadius: 14,
                background  : nodeBg,
                boxShadow   : nodeGlow,
                display     : 'flex',
                alignItems  : 'center',
                justifyContent: 'center',
                position    : 'relative',
                transition  : 'box-shadow 0.2s ease, border-color 0.2s ease',
                cursor      : 'pointer',
              }}
              whileHover={reduced ? {} : {
                scale    : 1.1,
                boxShadow: `0 0 0 2px ${color}, 0 0 32px ${color}77, 0 12px 36px rgba(0,0,0,0.7)`,
              }}
              transition={{ duration: 0.2 }}
            >
              <Icon
                size={20}
                style={{
                  color     : color,
                  filter    : (isRun || isDone) ? `drop-shadow(0 0 6px ${color}A0)` : 'none',
                  transition: 'color 0.2s ease',
                }}
              />

              {/* Tiny Completed Emerald Check Badge */}
              {isDone && (
                <div
                  style={{
                    position    : 'absolute',
                    top         : -4,
                    right       : -4,
                    width       : 16,
                    height      : 16,
                    borderRadius: '50%',
                    background  : T.green,
                    display     : 'flex',
                    alignItems  : 'center',
                    justifyContent: 'center',
                    boxShadow   : `0 0 8px ${T.green}`,
                  }}
                >
                  <Check size={10} style={{ color: '#05070E', strokeWidth: 3 }} />
                </div>
              )}

              {/* Tiny Error Badge */}
              {isFail && (
                <div
                  style={{
                    position    : 'absolute',
                    top         : -4,
                    right       : -4,
                    width       : 16,
                    height      : 16,
                    borderRadius: '50%',
                    background  : T.red,
                    display     : 'flex',
                    alignItems  : 'center',
                    justifyContent: 'center',
                    boxShadow   : `0 0 8px ${T.red}`,
                  }}
                >
                  <AlertCircle size={10} style={{ color: '#FFF', strokeWidth: 2.5 }} />
                </div>
              )}
            </motion.div>

            {/* Label below node */}
            <span style={{
              position   : 'absolute', top: SZ + 7, left: '50%', transform: 'translateX(-50%)',
              fontFamily : T.mono, fontSize: 9.5, fontWeight: isRun || isDone ? 600 : 500,
              color      : isRun || isDone ? T.text : T.sub,
              whiteSpace : 'nowrap', textShadow: '0 1px 6px rgba(0,0,0,0.95)',
              pointerEvents: 'none',
            }}>
              {agent.label}
            </span>

            {/* Duration / Score Pill */}
            {isDone && (dur != null || score != null) && (
              <span style={{
                position  : 'absolute', top: SZ + 22, left: '50%', transform: 'translateX(-50%)',
                fontFamily: T.mono, fontSize: 8, fontWeight: 700,
                color     : T.green, whiteSpace: 'nowrap', pointerEvents: 'none',
              }}>
                {score != null ? `${Math.round(score)}%` : `${dur}s`}
              </span>
            )}
          </div>
        )
      })}

      {/* ── Hover Tooltip Card ───────────────────────────── */}
      <AnimatePresence>
        {hoveredAgent && (() => {
          const hPos   = pos[hoveredAgent.id]
          if (!hPos) return null
          const hSt    = getStatus(hoveredAgent.id, agentStates, statuses)
          const entry  = agentStates?.[hoveredAgent.id]
          const isRun  = hSt === 'running'
          const isDone = hSt === 'completed'
          const statusText = isRun ? 'EXECUTING' : isDone ? 'COMPLETED' : 'WAITING'
          const statusColor= isRun ? hoveredAgent.accent : isDone ? T.green : T.sub

          return (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position    : 'absolute',
                left        : Math.min(w - 180, Math.max(10, hPos.x - 85)),
                top         : hPos.y > cy ? hPos.y - 105 : hPos.y + 65,
                width       : 170,
                padding     : '10px 12px',
                borderRadius: 10,
                background  : 'rgba(9, 14, 22, 0.94)',
                border      : `1px solid ${statusColor}40`,
                boxShadow   : '0 8px 32px rgba(0,0,0,0.75)',
                backdropFilter: 'blur(10px)',
                zIndex      : 40,
                pointerEvents: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.text }}>
                  {hoveredAgent.label}
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: statusColor }}>
                  {statusText}
                </span>
              </div>
              <p style={{ fontFamily: T.mono, fontSize: 8.5, color: T.sub, margin: '0 0 6px' }}>
                {hoveredAgent.role}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1E293B', paddingTop: 6, fontFamily: T.mono, fontSize: 8.5 }}>
                <span style={{ color: '#6B7280' }}>Exec Time:</span>
                <span style={{ color: T.text }}>{entry?.duration_sec != null ? `${entry.duration_sec}s` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontFamily: T.mono, fontSize: 8.5 }}>
                <span style={{ color: '#6B7280' }}>Score:</span>
                <span style={{ color: entry?.score != null ? T.green : T.sub, fontWeight: 700 }}>
                  {entry?.score != null ? `${Math.round(entry.score)}/100` : '—'}
                </span>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
