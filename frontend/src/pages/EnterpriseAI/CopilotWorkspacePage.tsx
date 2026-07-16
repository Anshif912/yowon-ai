import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Brain, Send, User, ShieldAlert, Zap, GitBranch, Layers, Bot,
  RotateCw, AlertCircle, CheckCircle2, Clock, FileCode2,
  ChevronRight, Sparkles, Shield, Terminal, BarChart3
} from 'lucide-react'
import { PageHeader, SplitView, StatusBadge } from '../../components/enterprise'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Evidence {
  evidence_id: string
  evidence_type: string
  label: string
  confidence: number
}

interface ToolExecution {
  step_id: number
  tool: string
  status: 'success' | 'failed' | 'not_available'
  output?: { summary?: string }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  evidence: Evidence[]
  tool_calls: { tool: string; status: string }[]
  execution_time_ms?: number
  suggestions?: string[]
  timestamp: string
  isLoading?: boolean
}

interface Persona {
  id: string
  name: string
  role: string
  avatar_color: string
  specialty: string
  tool_permissions: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AVATAR_CLASSES: Record<string, string> = {
  amber:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  cyan:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  red:     'text-red-400 bg-red-500/10 border-red-500/30',
  violet:  'text-violet-400 bg-violet-500/10 border-violet-500/30',
}

const PERSONA_ICONS: Record<string, React.ReactNode> = {
  cto:       <BarChart3 size={13} />,
  developer: <Terminal size={13} />,
  judge:     <Shield size={13} />,
  security:  <ShieldAlert size={13} />,
  architect: <Layers size={13} />,
}

const EVIDENCE_COLORS: Record<string, string> = {
  PROJECT:    'bg-blue-500/10 text-blue-300 border-blue-500/20',
  DNA:        'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  DECISION:   'bg-amber-500/10 text-amber-300 border-amber-500/20',
  FILE:       'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  EVALUATION: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  VAULT:      'bg-red-500/10 text-red-300 border-red-500/20',
  SIMULATION: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  GOVERNANCE: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

// ── API helpers ───────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getWorkspaceId(): string {
  return localStorage.getItem('yowon_active_workspace_id') || 'default-ws'
}

function getSessionKey(personaId: string): string {
  return `copilot_session_${personaId}_${getWorkspaceId()}`
}

async function fetchPersonas(): Promise<Persona[]> {
  const res = await fetch(`${API_BASE}/api/v1/enterprise-ai/copilot/personas`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load personas')
  const data = await res.json()
  return data.data || []
}

async function fetchSessionMessages(sessionId: string): Promise<Message[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/enterprise-ai/copilot/sessions/${sessionId}/messages`,
    { headers: getAuthHeaders() }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.data || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    evidence: m.evidence || [],
    tool_calls: m.tool_calls || [],
    execution_time_ms: m.execution_time_ms,
    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }))
}

async function postCopilotQuery(
  query: string,
  personaId: string,
  sessionId: string,
  workspaceId: string
): Promise<{
  session_id: string
  response: string
  evidence: Evidence[]
  suggestions: string[]
  orchestration: { executions: ToolExecution[] }
  execution_time_ms: number
}> {
  const res = await fetch(`${API_BASE}/api/v1/enterprise-ai/copilot/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      query,
      persona_id: personaId,
      session_id: sessionId,
      workspace_id: workspaceId,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Markdown renderer (lightweight) ──────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={i} className="text-[11px] font-mono font-bold text-zinc-200 uppercase tracking-wider mt-4 mb-1">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      nodes.push(
        <p key={i} className="text-xs font-bold text-white mb-1">{line.slice(2, -2)}</p>
      )
    } else if (line.startsWith('- ')) {
      nodes.push(
        <div key={i} className="flex gap-2 items-start mb-0.5">
          <span className="text-cyan-500 mt-0.5 shrink-0">›</span>
          <span className="text-xs text-zinc-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }}
          />
        </div>
      )
    } else if (line.startsWith('---')) {
      nodes.push(<hr key={i} className="border-white/5 my-3" />)
    } else if (line.startsWith('_') && line.endsWith('_')) {
      nodes.push(
        <p key={i} className="text-[10px] text-zinc-500 italic mb-2">{line.slice(1, -1)}</p>
      )
    } else if (line.trim() !== '') {
      nodes.push(
        <p key={i} className="text-xs text-zinc-300 leading-relaxed mb-1"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      )
    }
    i++
  }
  return nodes
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="text-cyan-300 font-mono text-[10px] bg-cyan-500/10 px-1 py-0.5 rounded">$1</code>')
    .replace(/_(.+?)_/g, '<em class="text-zinc-400">$1</em>')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EvidenceCard({ ev }: { ev: Evidence }) {
  const colorClass = EVIDENCE_COLORS[ev.evidence_type] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-mono ${colorClass}`}>
      <span className="opacity-60">[{ev.evidence_type}]</span>
      <span className="truncate max-w-[140px]">{ev.label}</span>
      <span className="opacity-60">{(ev.confidence * 100).toFixed(0)}%</span>
    </div>
  )
}

function ToolBadge({ tool, status }: { tool: string; status: string }) {
  const isOk = status === 'success'
  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
      isOk ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-red-500/20 text-red-400 bg-red-500/5'
    }`}>
      {isOk ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
      {tool.replace(/_tool$/, '').replace(/_/g, ' ')}
    </div>
  )
}

function ThinkingBubble({ personaColor }: { personaColor: string }) {
  return (
    <div className="flex gap-4 max-w-[85%] self-start">
      <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${personaColor}`}>
        <Bot size={14} />
      </div>
      <div className="px-4 py-3 rounded-xl border bg-zinc-950/40 border-white/5 flex items-center gap-2">
        <Sparkles size={12} className="text-cyan-400 animate-pulse" />
        <span className="text-xs text-zinc-400 font-mono">Analyzing workspace data...</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map(n => (
            <span key={n} className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce"
              style={{ animationDelay: `${n * 150}ms` }} />
          ))}
        </span>
      </div>
    </div>
  )
}

function MessageBubble({ msg, personaColor }: { msg: Message; personaColor: string }) {
  const isAssistant = msg.role === 'assistant'
  return (
    <div className={`flex gap-4 max-w-[92%] ${isAssistant ? 'self-start' : 'self-end flex-row-reverse'}`}>
      <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 select-none ${
        isAssistant ? personaColor : 'bg-zinc-800 border-zinc-700 text-zinc-300'
      }`}>
        {isAssistant ? <Bot size={14} /> : <User size={14} />}
      </div>

      <div className="flex flex-col gap-2 max-w-full min-w-0">
        <div className={`px-4 py-3 rounded-xl border ${
          isAssistant
            ? 'bg-zinc-950/40 border-white/5 text-zinc-300'
            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200 text-xs font-sans'
        }`}>
          {isAssistant ? (
            <div className="flex flex-col gap-0.5">
              {renderMarkdown(msg.content)}
            </div>
          ) : (
            <span className="text-xs">{msg.content}</span>
          )}
        </div>

        {/* Tool calls row */}
        {isAssistant && msg.tool_calls.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.tool_calls.map((tc, i) => (
              <ToolBadge key={i} tool={tc.tool} status={tc.status} />
            ))}
          </div>
        )}

        {/* Evidence cards */}
        {isAssistant && msg.evidence.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.evidence.slice(0, 6).map((ev, i) => (
              <EvidenceCard key={i} ev={ev} />
            ))}
          </div>
        )}

        {/* Suggestions */}
        {isAssistant && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                className="text-left text-[10px] text-zinc-400 hover:text-cyan-300 px-2 py-1 rounded border border-white/5 hover:border-cyan-500/20 bg-zinc-950/20 transition-colors flex items-center gap-1.5"
              >
                <ChevronRight size={9} className="text-cyan-500 shrink-0" />
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-1">
          <span className="text-[9px] font-mono text-zinc-600">{msg.timestamp}</span>
          {msg.execution_time_ms && (
            <span className="text-[9px] font-mono text-zinc-700 flex items-center gap-0.5">
              <Clock size={8} /> {msg.execution_time_ms}ms
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CopilotWorkspacePage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [activePersona, setActivePersona] = useState<Persona | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [personasLoading, setPersonasLoading] = useState(true)
  const [activeContextTab, setActiveContextTab] = useState<'context' | 'tools' | 'history'>('context')
  const [lastExecTools, setLastExecTools] = useState<ToolExecution[]>([])
  const [sessionIds, setSessionIds] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load personas from API on mount
  useEffect(() => {
    fetchPersonas()
      .then(data => {
        setPersonas(data)
        if (data.length > 0) {
          const dev = data.find(p => p.id === 'developer') || data[0]
          setActivePersona(dev)
        }
      })
      .catch(() => {
        // Fallback persona list if API is unreachable
        const fallback: Persona[] = [
          { id: 'cto', name: 'CTO Executive Agent', role: 'CTO Agent', avatar_color: 'amber', specialty: 'Executive strategy and portfolio health.', tool_permissions: ['predictions_tool', 'portfolio_tool'] },
          { id: 'developer', name: 'Dev Assistant Agent', role: 'Lead Dev', avatar_color: 'cyan', specialty: 'Code quality, metrics, and repository intelligence.', tool_permissions: ['knowledge_tool', 'metrics_tool'] },
          { id: 'judge', name: 'AI Judge Agent', role: 'AI Judge', avatar_color: 'emerald', specialty: 'Evaluation scoring and decision analysis.', tool_permissions: ['decision_intelligence_tool'] },
          { id: 'security', name: 'SecOps Officer Agent', role: 'Security', avatar_color: 'red', specialty: 'Security scanning and vault inspection.', tool_permissions: ['security_scanner_tool', 'vault_inspection_tool'] },
          { id: 'architect', name: 'System Architect Agent', role: 'Architect', avatar_color: 'violet', specialty: 'Architecture and scalability analysis.', tool_permissions: ['knowledge_tool', 'digital_twin_tool'] },
        ]
        setPersonas(fallback)
        setActivePersona(fallback[1])
      })
      .finally(() => setPersonasLoading(false))
  }, [])

  // When persona changes, restore session and load history
  useEffect(() => {
    if (!activePersona) return
    const pid = activePersona.id
    const savedSessionId = localStorage.getItem(getSessionKey(pid))

    if (savedSessionId && !messages[pid]) {
      // Load message history from API
      fetchSessionMessages(savedSessionId).then(history => {
        if (history.length > 0) {
          setMessages(prev => ({ ...prev, [pid]: history }))
          setSessionIds(prev => ({ ...prev, [pid]: savedSessionId }))
        }
      }).catch(() => {})
    }
  }, [activePersona])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activePersona])

  const handleSendMessage = useCallback(async (e: React.FormEvent, overrideQuery?: string) => {
    e.preventDefault()
    const query = overrideQuery || chatInput
    if (!query.trim() || isLoading || !activePersona) return

    const pid = activePersona.id
    const workspaceId = getWorkspaceId()
    let sessionId = sessionIds[pid]

    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`
      setSessionIds(prev => ({ ...prev, [pid]: sessionId }))
      localStorage.setItem(getSessionKey(pid), sessionId)
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      evidence: [],
      tool_calls: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const loadingMsg: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      evidence: [],
      tool_calls: [],
      isLoading: true,
      timestamp: '',
    }

    setMessages(prev => ({
      ...prev,
      [pid]: [...(prev[pid] || []), userMsg, loadingMsg],
    }))
    setChatInput('')
    setIsLoading(true)

    try {
      const result = await postCopilotQuery(query, pid, sessionId, workspaceId)

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        evidence: result.evidence || [],
        tool_calls: (result.orchestration?.executions || []).map((ex: ToolExecution) => ({
          tool: ex.tool,
          status: ex.status,
        })),
        suggestions: result.suggestions || [],
        execution_time_ms: result.execution_time_ms,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setLastExecTools(result.orchestration?.executions || [])

      setMessages(prev => ({
        ...prev,
        [pid]: [...(prev[pid] || []).filter(m => !m.isLoading), assistantMsg],
      }))
    } catch (err: any) {
      const errMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠ Copilot error: ${err.message || 'Failed to reach the backend. Ensure the API server is running.'}`,
        evidence: [],
        tool_calls: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => ({
        ...prev,
        [pid]: [...(prev[pid] || []).filter(m => !m.isLoading), errMsg],
      }))
    } finally {
      setIsLoading(false)
    }
  }, [chatInput, isLoading, activePersona, sessionIds])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    setChatInput(suggestion)
    handleSendMessage(fakeEvent, suggestion)
  }, [handleSendMessage])

  const clearSession = useCallback(() => {
    if (!activePersona) return
    const pid = activePersona.id
    localStorage.removeItem(getSessionKey(pid))
    setSessionIds(prev => { const n = { ...prev }; delete n[pid]; return n })
    setMessages(prev => { const n = { ...prev }; delete n[pid]; return n })
  }, [activePersona])

  if (personasLoading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#05070a]">
        <div className="flex flex-col items-center gap-3">
          <Brain size={32} className="text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-zinc-400">Loading Copilot personas...</span>
        </div>
      </div>
    )
  }

  const persona = activePersona || personas[0]
  const pid = persona?.id || 'developer'
  const avatarClass = AVATAR_CLASSES[persona?.avatar_color || 'cyan']
  const currentMessages = messages[pid] || []
  const currentSessionId = sessionIds[pid]

  return (
    <div className="flex-grow overflow-hidden bg-[#05070a] min-h-full flex flex-col">
      <PageHeader
        title="AI Copilot Workspace"
        description="Enterprise multi-agent AI platform with real workspace context, session memory, and evidence-backed responses."
        breadcrumbs={[
          { label: 'Intelligence', href: '/intelligence' },
          { label: 'Copilot Workspace' }
        ]}
        status={{ label: `${personas.length} PERSONAS ACTIVE`, type: 'info' }}
      />

      <div className="flex-1 min-h-0 p-6 sm:p-8">
        <SplitView
          leftPanel={
            <div className="flex flex-col h-[680px] border border-white/5 bg-[#0b0c10]/80 rounded-xl overflow-hidden backdrop-blur-md">

              {/* Persona switcher */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-[#05070a] shrink-0 overflow-x-auto">
                {personas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePersona(p)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold border rounded-lg transition-all duration-150 shrink-0 ${
                      pid === p.id
                        ? AVATAR_CLASSES[p.avatar_color || 'cyan']
                        : 'border-white/5 text-zinc-500 hover:text-zinc-300 bg-zinc-950/60'
                    }`}
                  >
                    {PERSONA_ICONS[p.id] || <Bot size={13} />}
                    <span>{p.role}</span>
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  {currentSessionId && (
                    <button
                      onClick={clearSession}
                      title="Clear session"
                      className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <RotateCw size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Persona info bar */}
              <div className="px-5 py-2.5 border-b border-white/5 bg-[#08090d] shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full border flex items-center justify-center ${avatarClass}`}>
                    <Bot size={11} />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{persona?.specialty}</span>
                </div>
                {currentSessionId && (
                  <span className="text-[9px] font-mono text-zinc-700 truncate max-w-[120px]">
                    session: {currentSessionId.slice(0, 8)}
                  </span>
                )}
              </div>

              {/* Chat messages */}
              <div className="flex-grow overflow-y-auto px-5 py-5 flex flex-col gap-5 custom-scrollbar">
                {currentMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40 select-none">
                    <Brain size={36} className="text-zinc-600" />
                    <p className="text-xs font-mono text-zinc-500 text-center max-w-[240px]">
                      {persona?.name} is ready. Ask about your workspace projects, code quality, security posture, or architecture.
                    </p>
                  </div>
                )}
                {currentMessages.map(msg =>
                  msg.isLoading ? (
                    <ThinkingBubble key={msg.id} personaColor={avatarClass} />
                  ) : (
                    <MessageBubble key={msg.id} msg={msg} personaColor={avatarClass} />
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="px-5 py-4 border-t border-white/5 bg-[#05070a] flex items-center gap-2.5 shrink-0"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  disabled={isLoading}
                  placeholder={`Ask ${persona?.name ?? 'Copilot'}...`}
                  className="flex-1 px-4 py-2.5 text-xs font-sans text-white bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-cyan-500/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isLoading}
                  className="p-2.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg disabled:opacity-40 transition-colors duration-150 shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          }
          rightPanel={
            <div className="flex flex-col h-[680px] border border-white/5 bg-[#0b0c10]/80 rounded-xl overflow-hidden backdrop-blur-md relative select-none">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />

              {/* Tabs */}
              <div className="flex border-b border-white/5 bg-[#05070a] shrink-0">
                {(['context', 'tools', 'history'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveContextTab(tab)}
                    className={`flex-1 py-3 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-b-2 transition-all duration-150 ${
                      activeContextTab === tab
                        ? 'border-cyan-400 text-cyan-400 bg-cyan-500/[0.02]'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab === 'context' ? 'Context Scope' : tab === 'tools' ? 'Tool Execution' : 'Session History'}
                  </button>
                ))}
              </div>

              <div className="flex-grow overflow-y-auto p-5 custom-scrollbar">

                {/* Context Scope */}
                {activeContextTab === 'context' && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live Workspace Context</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mt-0.5">{persona?.name}</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {persona?.specialty} This agent has access to real workspace data from the database — no hardcoded context.
                    </p>
                    <div className="flex flex-col gap-1.5 font-mono text-[10px] bg-zinc-950/60 p-3 rounded-lg border border-white/5">
                      <div className="flex justify-between text-zinc-400">
                        <span>Workspace:</span>
                        <span className="font-bold text-zinc-200 truncate max-w-[120px]">{getWorkspaceId()}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Session:</span>
                        <span className="font-bold text-zinc-200">{currentSessionId ? 'Active' : 'Not started'}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Memory:</span>
                        <span className="font-bold text-zinc-200">{currentMessages.filter(m => !m.isLoading).length} messages</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Authorized Tools</span>
                      {(persona?.tool_permissions || []).map(tool => (
                        <div key={tool} className="flex items-center gap-2 p-2 rounded bg-zinc-950/40 border border-white/5">
                          <Zap size={11} className="text-cyan-500 shrink-0" />
                          <span className="text-[10px] font-mono text-zinc-300">{tool.replace(/_tool$/, '').replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tool Execution */}
                {activeContextTab === 'tools' && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Last Query Execution</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mt-0.5">Tool Timeline</h4>
                    </div>
                    {lastExecTools.length === 0 ? (
                      <p className="text-xs text-zinc-600 font-mono">No tools executed yet. Send a query to see the execution timeline.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {lastExecTools.map((ex, i) => (
                          <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
                            ex.status === 'success'
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : 'border-red-500/20 bg-red-500/5'
                          }`}>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                              ex.status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                            }`}>
                              {ex.status === 'success'
                                ? <CheckCircle2 size={10} className="text-emerald-400" />
                                : <AlertCircle size={10} className="text-red-400" />
                              }
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-mono font-bold text-zinc-200 truncate">
                                {ex.tool.replace(/_/g, ' ')}
                              </span>
                              {ex.output?.summary && (
                                <span className="text-[9px] text-zinc-500 leading-tight truncate">{ex.output.summary}</span>
                              )}
                            </div>
                            <StatusBadge status={ex.status} size="xs" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Session History */}
                {activeContextTab === 'history' && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Conversation Memory</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mt-0.5">Session Log</h4>
                    </div>
                    {currentMessages.filter(m => !m.isLoading).length === 0 ? (
                      <p className="text-xs text-zinc-600 font-mono">No conversation history yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {currentMessages.filter(m => !m.isLoading).map((m, i) => (
                          <div key={i} className={`flex items-start gap-2 p-2 rounded border ${
                            m.role === 'user'
                              ? 'border-cyan-500/10 bg-cyan-500/5'
                              : 'border-white/5 bg-zinc-950/30'
                          }`}>
                            <span className={`text-[9px] font-mono font-bold shrink-0 uppercase ${
                              m.role === 'user' ? 'text-cyan-400' : 'text-zinc-400'
                            }`}>{m.role}</span>
                            <span className="text-[9px] text-zinc-400 leading-tight line-clamp-2">
                              {m.content.slice(0, 120)}{m.content.length > 120 ? '…' : ''}
                            </span>
                            {m.evidence.length > 0 && (
                              <span className="text-[9px] font-mono text-emerald-500 shrink-0">{m.evidence.length}ev</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          }
          leftWidth="w-full xl:w-2/3"
          rightWidth="w-full xl:w-1/3"
        />
      </div>
    </div>
  )
}
