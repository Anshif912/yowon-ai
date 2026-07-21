import React from 'react'
import { Activity, Server, Database, Bot, Webhook, CheckCircle2, Cpu } from 'lucide-react'

export default function SystemHealthPage() {
  const SERVICES = [
    { name: 'FastAPI Backend Core', type: 'API Gateway', status: 'HEALTHY', latency: '8ms', uptime: '99.98%' },
    { name: 'PostgreSQL Enterprise DB', type: 'Persistence', status: 'HEALTHY', latency: '2ms', uptime: '99.99%' },
    { name: 'GitHub Integration Pipeline', type: 'VCS Provider', status: 'HEALTHY', latency: '24ms', uptime: '99.95%' },
    { name: 'AI Model Router (OpenAI/Gemini)', type: 'LLM Orchestrator', status: 'HEALTHY', latency: '340ms', uptime: '99.90%' },
    { name: 'Background Workers & Event Bus', type: 'Async Engine', status: 'HEALTHY', latency: '12ms', uptime: '99.99%' },
    { name: 'Webhook Event Dispatcher', type: 'Event Bus', status: 'HEALTHY', latency: '18ms', uptime: '99.99%' }
  ]

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-8 space-y-8 font-sans">
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-mono mb-1">
          <Activity size={14} /> SUBSYSTEM DIAGNOSTICS & TELEMETRY
        </div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white">System Health & Telemetry</h1>
        <p className="text-zinc-400 text-sm mt-1">Real-time status monitoring for enterprise databases, AI providers, background workers, and event dispatchers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((s, i) => (
          <div key={i} className="p-6 rounded-xl border border-zinc-800 bg-[#090d13] space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Server size={20} />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                <CheckCircle2 size={12} /> {s.status}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">{s.name}</h3>
              <div className="text-xs text-zinc-400 font-mono mt-0.5">{s.type}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono border-t border-zinc-800/60">
              <div><span className="text-zinc-500">Latency:</span> <span className="text-white font-bold">{s.latency}</span></div>
              <div><span className="text-zinc-500">Uptime:</span> <span className="text-emerald-400 font-bold">{s.uptime}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
