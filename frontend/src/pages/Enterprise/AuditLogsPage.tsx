import React, { useState } from 'react'
import { FileText, Shield, Search, Filter, Lock, Key, Webhook, UserCheck, AlertTriangle } from 'lucide-react'

interface AuditEvent {
  id: string
  action: string
  actor: string
  resource: string
  timestamp: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  ipAddress: string
}

const AUDIT_LOGS: AuditEvent[] = [
  { id: 'ev1', action: 'SECRET_ROTATED', actor: 'Anshif', resource: 'Vault / GITHUB_PAT', timestamp: '2m ago', severity: 'WARNING', ipAddress: '192.168.1.45' },
  { id: 'ev2', action: 'EVALUATION_COMPLETED', actor: 'System Worker', resource: 'Repo / yowon-ai', timestamp: '8m ago', severity: 'INFO', ipAddress: '10.0.4.12' },
  { id: 'ev3', action: 'WEBHOOK_DELIVERED', actor: 'Event Bus', resource: 'Endpoint / slack-prod', timestamp: '14m ago', severity: 'INFO', ipAddress: '10.0.4.12' },
  { id: 'ev4', action: 'RBAC_ROLE_UPDATED', actor: 'Anshif', resource: 'User / Sarah Chen -> Security Engineer', timestamp: '45m ago', severity: 'WARNING', ipAddress: '192.168.1.45' },
  { id: 'ev5', action: 'CONNECTOR_CONNECTED', actor: 'Anshif', resource: 'Connector / Google Gemini', timestamp: '1h ago', severity: 'INFO', ipAddress: '192.168.1.45' }
]

export default function AuditLogsPage() {
  const [logs] = useState<AuditEvent[]>(AUDIT_LOGS)

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-8 space-y-8 font-sans">
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <FileText size={14} /> SECURITY & COMPLIANCE OBSERVABILITY
        </div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Enterprise Audit Logs</h1>
        <p className="text-zinc-400 text-sm mt-1">Immutable audit stream recording authentication, authorization, secret access, and workflow executions.</p>
      </div>

      <div className="border border-zinc-800 rounded-xl bg-[#090d13] overflow-hidden">
        <table className="w-full text-left text-sm font-mono">
          <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase border-b border-zinc-800">
            <tr>
              <th className="py-3.5 px-6">Timestamp</th>
              <th className="py-3.5 px-6">Event Action</th>
              <th className="py-3.5 px-6">Actor</th>
              <th className="py-3.5 px-6">Target Resource</th>
              <th className="py-3.5 px-6">Severity</th>
              <th className="py-3.5 px-6 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-zinc-800/20 transition">
                <td className="py-3.5 px-6 text-zinc-400 text-xs">{log.timestamp}</td>
                <td className="py-3.5 px-6 font-bold text-white">{log.action}</td>
                <td className="py-3.5 px-6 text-cyan-400">{log.actor}</td>
                <td className="py-3.5 px-6 text-zinc-300">{log.resource}</td>
                <td className="py-3.5 px-6">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${log.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : log.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {log.severity}
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right text-zinc-500 text-xs">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
