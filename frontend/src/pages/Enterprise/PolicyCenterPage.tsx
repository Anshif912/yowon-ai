import React from 'react'
import { ShieldCheck, Lock, CheckCircle2, AlertOctagon, Sliders, Check } from 'lucide-react'

export default function PolicyCenterPage() {
  const POLICIES = [
    { title: 'Security Zero-Tolerance Rule', category: 'Security', status: 'ENFORCED', desc: 'Rejects evaluations with critical secret leaks or high-severity vulnerabilities.' },
    { title: 'Architecture Layer Separation Rule', category: 'Architecture', status: 'ENFORCED', desc: 'Requires UI components to depend strictly on domain service interfaces.' },
    { title: 'License Compliance Gate', category: 'Compliance', status: 'MONITORING', desc: 'Flags non-commercial or restrictive open-source dependency licenses.' },
    { title: 'Branch Protection & PR Scan Gate', category: 'CI/CD', status: 'ENFORCED', desc: 'Requires automated AST static analysis prior to merging pull requests.' }
  ]

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-8 space-y-8 font-sans">
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono mb-1">
          <ShieldCheck size={14} /> ENTERPRISE GOVERNANCE ENGINE
        </div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Policy Center</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure automated compliance rules, deployment policies, and security gates enforced across all repositories.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {POLICIES.map((p, i) => (
          <div key={i} className="p-6 rounded-xl border border-zinc-800 bg-[#090d13] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded bg-cyan-500/10">{p.category}</span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400"><CheckCircle2 size={14} /> {p.status}</span>
            </div>
            <h3 className="text-lg font-bold text-white font-display">{p.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
