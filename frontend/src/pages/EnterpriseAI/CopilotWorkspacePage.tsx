import React, { useState, useRef, useEffect } from 'react'
import {
  Brain,
  MessageSquare,
  Send,
  User,
  ShieldAlert,
  Zap,
  FolderOpen,
  GitBranch,
  Terminal,
  Layers,
  Sparkles,
  Bot,
  Play,
  RotateCw,
  Plus
} from 'lucide-react'
import {
  PageHeader,
  SplitView,
  StatusBadge,
  ActionPanel,
  DataTable
} from '../../components/enterprise'

interface Persona {
  id: string
  name: string
  role: string
  avatarColor: string
  specialty: string
  greeting: string
}

const PERSONAS: Persona[] = [
  {
    id: 'cto',
    name: 'CTO Executive Agent',
    role: 'CTO Agent',
    avatarColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    specialty: 'High-level technology roadmap strategy and engineering alignment.',
    greeting: 'Welcome. I am ready to review our engineering velocity benchmarks and security posture metrics. What reports should we analyze?'
  },
  {
    id: 'developer',
    name: 'Dev Assistant Agent',
    role: 'Lead Dev',
    avatarColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    specialty: 'Refactoring code, fixing bugs, and recommending AST security adjustments.',
    greeting: 'Hey! I can help you draft code, refactor async worker routines, or resolve static scanner warning issues. Paste the snippet here.'
  },
  {
    id: 'judge',
    name: 'Vulnerability Judge',
    role: 'AI Judge',
    avatarColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    specialty: 'Enforcing deterministic coding guidelines and validating pull requests.',
    greeting: 'AI Judge initialized. I am scanning active commits and PR metrics against compliance criteria. Input a patch details to audit.'
  },
  {
    id: 'security',
    name: 'SecOps Officer',
    role: 'Security',
    avatarColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    specialty: 'Identifying dependency exploits, HMAC leaks, and access audits leaks.',
    greeting: 'SecOps scanner active. I evaluate credential exposures and static dependency trees vulnerabilities. How can I assist in mitigation?'
  },
  {
    id: 'architect',
    name: 'System Architect',
    role: 'Architect',
    avatarColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    specialty: 'Database sharding plans, microservices pipelines, and latency profiles.',
    greeting: 'Systems architecture matrix ready. I forecast latency decay points and suggest decoupling patterns. Let me inspect your topology.'
  }
]

interface Message {
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function CopilotWorkspacePage() {
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[1]) // Dev Assistant default
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    cto: [{ sender: 'assistant', content: PERSONAS[0].greeting, timestamp: 'Just now' }],
    developer: [{ sender: 'assistant', content: PERSONAS[1].greeting, timestamp: 'Just now' }],
    judge: [{ sender: 'assistant', content: PERSONAS[2].greeting, timestamp: 'Just now' }],
    security: [{ sender: 'assistant', content: PERSONAS[3].greeting, timestamp: 'Just now' }],
    architect: [{ sender: 'assistant', content: PERSONAS[4].greeting, timestamp: 'Just now' }]
  })

  const [activeContextTab, setActiveContextTab] = useState<'workspace' | 'repo' | 'tools'>('workspace')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activePersona])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg: Message = {
      sender: 'user',
      content: chatInput,
      timestamp: 'Just now'
    }

    // Add user message immediately
    const personaId = activePersona.id
    setMessages(prev => ({
      ...prev,
      [personaId]: [...(prev[personaId] || []), userMsg]
    }))
    setChatInput('')

    // Simulate AI response after delay
    setTimeout(() => {
      let aiContent = ''
      if (activePersona.id === 'cto') {
        aiContent = `I have received your query concerning architectural decay and technical debt metrics. I recommend we audit our active scanners on the Operations Page to evaluate threads load. Let's schedule an executive briefing.`
      } else if (activePersona.id === 'developer') {
        aiContent = `Code snippet refactored successfully. I replaced the blocking loops with parallel Promise mappings. This should reduce background worker latency down to ~8ms.`
      } else if (activePersona.id === 'judge') {
        aiContent = `PR assessment completed: PASSED. All deterministic guide constraints matched. Scoring confidence is 99.8%. Ready for merge authorization.`
      } else if (activePersona.id === 'security') {
        aiContent = `ALERT: Detected a potential plaintext database password assignment. Please rotate secrets using the Secure Vault Manager immediately to prevent access exploits.`
      } else {
        aiContent = `I simulated your microservices sharding plan under 10k/sec requests load. Recommended adjustments: add a Redis cache layer to decouple database ops from workers.`
      }

      const assistantMsg: Message = {
        sender: 'assistant',
        content: aiContent,
        timestamp: 'Just now'
      }

      setMessages(prev => ({
        ...prev,
        [personaId]: [...(prev[personaId] || []), assistantMsg]
      }))
    }, 1000)
  }

  // Active tools execution log mock
  const activeToolsData = [
    { id: 't1', tool: 'AST_Vulnerability_Scan', status: 'success', latency: '4ms' },
    { id: 't2', tool: 'Docker_Manifest_Audit', status: 'success', latency: '12ms' },
    { id: 't3', tool: 'Confluence_Vector_Search', status: 'success', latency: '22ms' }
  ]

  return (
    <div className="flex-grow overflow-hidden bg-[#05070a] min-h-full flex flex-col">
      {/* Page Header */}
      <PageHeader
        title="AI Copilot Workspace"
        description="Collaborate with dedicated AI persona agents specialized in codebase logic, database compliance, and infrastructure planning."
        breadcrumbs={[
          { label: 'Intelligence', href: '/intelligence' },
          { label: 'Copilot Workspace' }
        ]}
        status={{ label: 'COPILOT ENGINES READY', type: 'info' }}
      />

      {/* Main split-screen container */}
      <div className="flex-1 min-h-0 p-6 sm:p-8">
        <SplitView
          leftPanel={
            <div className="flex flex-col h-[650px] border border-white/5 bg-[#0b0c10]/80 rounded-xl overflow-hidden backdrop-blur-md">
              
              {/* Persona Switcher header */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-[#05070a] shrink-0 select-none overflow-x-auto">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePersona(p)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border rounded-lg transition-all duration-150 shrink-0 ${
                      activePersona.id === p.id
                        ? p.avatarColor
                        : 'border-white/5 text-zinc-500 hover:text-zinc-300 bg-zinc-950/60'
                    }`}
                  >
                    <Bot size={13} />
                    <span>{p.role}</span>
                  </button>
                ))}
              </div>

              {/* Chat messages viewport */}
              <div className="flex-grow overflow-y-auto px-6 py-6 flex flex-col gap-6 custom-scrollbar">
                {(messages[activePersona.id] || []).map((msg, i) => {
                  const isAssistant = msg.sender === 'assistant'
                  return (
                    <div
                      key={i}
                      className={`flex gap-4 max-w-[85%] ${
                        isAssistant ? 'self-start text-left' : 'self-end flex-row-reverse text-right'
                      }`}
                    >
                      {/* Avatar Icon */}
                      <div
                        className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 select-none ${
                          isAssistant
                            ? activePersona.avatarColor
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                        }`}
                      >
                        {isAssistant ? <Bot size={14} /> : <User size={14} />}
                      </div>

                      {/* Content panel */}
                      <div className="flex flex-col gap-1 max-w-full">
                        <div
                          className={`px-4 py-3 rounded-xl text-xs font-sans leading-relaxed border ${
                            isAssistant
                              ? 'bg-zinc-950/40 border-white/5 text-zinc-300'
                              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-white/5 bg-[#05070a] flex items-center gap-3 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask YOWON ${activePersona.name}...`}
                  className="flex-1 px-4 py-2.5 text-xs font-sans text-white bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-cyan-500/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
                />
                
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg disabled:opacity-40 transition-colors duration-150 shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>

            </div>
          }
          rightPanel={
            <div className="flex flex-col h-[650px] border border-white/5 bg-[#0b0c10]/80 rounded-xl overflow-hidden backdrop-blur-md relative select-none">
              {/* Top decorator glow */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />

              {/* Tabs header */}
              <div className="flex border-b border-white/5 bg-[#05070a] shrink-0 overflow-x-auto">
                {(['workspace', 'repo', 'tools'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveContextTab(tab)}
                    className={`flex-1 py-3 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-b-2 transition-all duration-150 shrink-0 ${
                      activeContextTab === tab
                        ? 'border-cyan-400 text-cyan-400 bg-cyan-500/[0.02]'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab === 'repo' ? 'code context' : tab === 'tools' ? 'active tools' : 'context vectors'}
                  </button>
                ))}
              </div>

              {/* Scrollable info container */}
              <div className="flex-grow overflow-y-auto p-6 text-left custom-scrollbar">
                
                {/* Context Vectors */}
                {activeContextTab === 'workspace' && (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">CONTEXT VECTORS INDEX</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Workspace Context Scope</h4>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
                      The active agent has access to index vectors compiled from local docs databases. You can feed workspace tickets metrics or settings straight into prompts.
                    </p>

                    <div className="flex flex-col gap-2 font-mono text-[11px] text-zinc-400 bg-zinc-950/60 p-3 rounded-lg border border-white/5">
                      <div className="flex justify-between">
                        <span>Organization:</span>
                        <span className="font-bold text-zinc-200">yowon-sentinel</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Scanners:</span>
                        <span className="font-bold text-zinc-200">3 Online</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SSO Identity:</span>
                        <span className="font-bold text-zinc-200">AES-GCM Verified</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Code Context */}
                {activeContextTab === 'repo' && (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">SCANNED REPOSITORIES</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Active Codebase Context</h4>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
                      Code context indexes branches files and pull request history to allow code generation and static audits checks.
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-950/40 border border-white/5">
                        <FolderOpen size={13} className="text-zinc-500" />
                        <span className="font-mono text-xs text-zinc-300">frontend/src/components/enterprise</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-950/40 border border-white/5">
                        <FolderOpen size={13} className="text-zinc-500" />
                        <span className="font-mono text-xs text-zinc-300">backend/src/workers</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Tools */}
                {activeContextTab === 'tools' && (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">AGENT RUNNERS</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Cognitive Tools Execution</h4>
                    </div>

                    <DataTable
                      rowIdKey="id"
                      data={activeToolsData}
                      columns={[
                        {
                          key: 'tool',
                          header: 'TOOL EXECUTABLE',
                          render: (_, val) => <span className="font-mono text-zinc-300 font-bold">{val}</span>
                        },
                        {
                          key: 'status',
                          header: 'STATUS',
                          width: '90px',
                          render: (_, val) => <StatusBadge status={val} size="xs" />
                        },
                        { key: 'latency', header: 'LATENCY', width: '80px', className: 'font-mono text-zinc-500' }
                      ]}
                    />
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
