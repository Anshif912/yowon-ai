/**
 * TerminalLog — Compact Mission Control Live Agent Stream
 *
 * Upgrades per spec:
 * - Width: 360px (22% panel width)
 * - Compact formatting: HH:MM [AGENT] Message
 * - Severity colors: Info (cyan), Success (emerald), Warning (amber), Error (red)
 * - Auto-scroll: scroll to bottom only when user is near bottom; suspends on manual scroll-up
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal } from 'lucide-react'

interface TerminalLogProps { logs?: string[] }

/* ── Severity & Agent Tag Colors ────────────────────────────── */
const TAG_COLORS: Record<string, string> = {
  '[SYS]'         : '#31E6FF',
  '[REPO]'        : '#31E6FF',
  '[DEPENDENCY]'  : '#31E6FF',
  '[AST]'         : '#7EB8FF',
  '[DNA]'         : '#F5B942',
  '[GRAPH]'       : '#8D6BFF',
  '[FORGE]'       : '#31E6FF',
  '[GUARDIAN]'    : '#10B981',
  '[SENTINEL]'    : '#FF5C5C',
  '[VISIONARY]'   : '#F5A623',
  '[SHOWCASE]'    : '#F5B942',
  '[PRIME]'       : '#8D6BFF',
  '[COORDINATOR]' : '#10B981',
  '[CHIEF]'       : '#8D6BFF',
  '[WARN]'        : '#F5B942',
  '[ERR]'         : '#FF5C5C',
  '[OK]'          : '#10B981',
}

/* ── Parse log line into tag, message & severity colors ──────── */
function parseLine(raw: string): { tag: string | null; tagColor: string; msg: string; lineColor: string } {
  const tagMatch = raw.match(/^\[([A-Z0-9_]+)\]/)
  const tag      = tagMatch ? `[${tagMatch[1]}]` : null
  const tagColor = tag ? (TAG_COLORS[tag] ?? '#9CA3AF') : '#9CA3AF'
  const msg      = tag ? raw.slice(tag.length).trim() : raw.trim()

  let lineColor = '#D1D5DB' // Default clean light grey
  const lower   = raw.toLowerCase()
  if (lower.includes('failed') || lower.includes('error') || lower.includes('[err]')) {
    lineColor = '#FF5C5C' // Error red
  } else if (lower.includes('completed') || lower.includes('done') || lower.includes('[ok]')) {
    lineColor = '#10B981' // Success emerald
  } else if (lower.includes('[warn]') || lower.includes('warning')) {
    lineColor = '#F5B942' // Warning amber
  } else if (tag === '[SYS]' || tag === '[REPO]') {
    lineColor = '#31E6FF' // Info cyan
  }

  return { tag, tagColor, msg, lineColor }
}

function getShortTimestamp(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export default function TerminalLog({ logs }: TerminalLogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const displayLogs = logs && logs.length > 0
    ? logs.slice(-50)
    : ['[SYS] Initializing evaluation pipeline telemetry...']

  /* Detect manual scroll position */
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 36
    setIsAtBottom(nearBottom)
  }

  /* Auto-scroll only when user is at the bottom */
  useEffect(() => {
    const el = containerRef.current
    if (el && isAtBottom) {
      el.scrollTop = el.scrollHeight
    }
  }, [displayLogs.length, isAtBottom])

  return (
    <div
      className="overflow-hidden flex flex-col h-full min-h-0"
      style={{
        background  : '#06080D',
        border      : '1px solid #111C27',
        borderRadius: 12,
      }}
    >
      {/* ── Terminal Header ──────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 border-b shrink-0"
        style={{ borderColor: '#111C27', background: '#080C14' }}
      >
        <div className="flex gap-1.5">
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF5C5C', opacity: 0.8 }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5B942', opacity: 0.8 }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', opacity: 0.8 }} />
        </div>

        <Terminal size={11} style={{ color: '#4B5563', marginLeft: 4 }} />

        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, color: '#6B7280', letterSpacing: '0.2em', textTransform: 'uppercase', flex: 1 }}>
          Live Agent Log
        </span>

        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <motion.span
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ width: 4, height: 4, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}
          />
          Active
        </span>
      </div>

      {/* ── Log Stream Body ──────────────────────────── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{ fontFamily: "'IBM Plex Mono', monospace", background: '#05070D', padding: '10px 12px' }}
      >
        <AnimatePresence initial={false}>
          {displayLogs.map((log, i) => {
            const { tag, tagColor, msg, lineColor } = parseLine(log)
            const ts = getShortTimestamp()

            return (
              <motion.div
                key={`${log}-${i}`}
                className="flex gap-1.5 mb-1.5"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                style={{ alignItems: 'flex-start', lineHeight: 1.4 }}
              >
                {/* Timestamp e.g. 22:17 */}
                <span style={{ fontSize: 8.5, color: '#1E2F40', flexShrink: 0, marginTop: 1, minWidth: 32 }}>
                  {ts}
                </span>

                {/* Agent Tag e.g. [FORGE] */}
                {tag && (
                  <span style={{
                    fontSize: 8.5, fontWeight: 700, color: tagColor, flexShrink: 0,
                    textShadow: `0 0 6px ${tagColor}44`,
                    marginTop: 1,
                    minWidth: 72,
                  }}>
                    {tag}
                  </span>
                )}

                {/* Compact Log Message */}
                <span style={{ fontSize: 9.5, color: lineColor, wordBreak: 'break-word', flex: 1 }}>
                  {msg}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Blinking cursor */}
        <span
          style={{
            display    : 'inline-block',
            width      : 5,
            height     : 12,
            background : '#31E6FF',
            marginLeft : 2,
            verticalAlign: 'middle',
            animation  : 'termCursorBlink 1s step-end infinite',
          }}
        />
        <style>{`
          @keyframes termCursorBlink {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  )
}
