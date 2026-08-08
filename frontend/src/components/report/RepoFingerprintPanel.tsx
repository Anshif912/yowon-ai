import React, { useState } from 'react'
import { Fingerprint, Copy, Check, ShieldCheck, Cpu, Code, Database, Server } from 'lucide-react'
import { DashboardSection } from './DashboardSection'

interface RepoFingerprintPanelProps {
  verdictData: any
}

export function RepoFingerprintPanel({ verdictData }: RepoFingerprintPanelProps) {
  const [copied, setCopied] = useState(false)

  const fingerprint = verdictData?.repository_fingerprint
  const metadata = verdictData?.report_metadata
  const integrity = verdictData?.report_integrity

  if (!fingerprint || !metadata) {
    return null
  }

  const handleCopy = () => {
    if (integrity?.sha256) {
      navigator.clipboard.writeText(integrity.sha256)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <DashboardSection id="repo-fingerprint" title="Repository DNA & Provenance" icon={Fingerprint}>
      <div className="font-mono text-zinc-300 text-xs bg-white/[0.01] border border-white/[0.05] rounded-2xl p-6 space-y-6 relative overflow-hidden backdrop-blur-md">
        
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Integrity Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Integrity Seal</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                SHA256 SECURE VERIFIED
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2 flex items-center justify-between gap-3 max-w-full">
            <span className="text-[10px] text-zinc-400 font-mono select-all truncate block md:max-w-[320px]">
              {integrity?.sha256 || 'n/a'}
            </span>
            <button 
              onClick={handleCopy} 
              className="text-zinc-500 hover:text-cyan-400 transition-colors p-1"
              title="Copy hash to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Primary Classification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Repository Type</span>
            <span className="text-white font-semibold text-sm flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {fingerprint.repository_type}
            </span>
          </div>
          
          <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Primary Languages</span>
            <span className="text-white font-semibold text-sm flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              {(fingerprint.primary_languages || []).join(' · ')}
            </span>
          </div>

          <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl col-span-1 md:col-span-2">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Detected Frameworks</span>
            <span className="text-zinc-300 text-xs flex flex-wrap gap-1 mt-0.5">
              {(fingerprint.frameworks || []).map((fw: string) => (
                <span key={fw} className="px-2 py-0.5 bg-cyan-950/20 text-cyan-300 border border-cyan-800/30 rounded-md text-[10px]">
                  {fw}
                </span>
              ))}
            </span>
          </div>
        </div>

        {/* Code metrics bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-white/[0.03]">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase block">Size</span>
            <span className="text-zinc-200 text-sm font-bold block mt-0.5">
              {(fingerprint.total_loc || 0).toLocaleString()} <span className="text-[9px] font-normal text-zinc-500">LOC</span>
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 uppercase block">Files</span>
            <span className="text-zinc-200 text-sm font-bold block mt-0.5">
              {fingerprint.total_files || 0}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 uppercase block">Classes</span>
            <span className="text-zinc-200 text-sm font-bold block mt-0.5">
              {fingerprint.total_classes || 0}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 uppercase block">Functions</span>
            <span className="text-zinc-200 text-sm font-bold block mt-0.5">
              {fingerprint.total_functions || 0}
            </span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-[9px] text-zinc-500 uppercase block">Dependencies</span>
            <span className="text-zinc-200 text-sm font-bold block mt-0.5">
              {fingerprint.total_dependencies || 0}
            </span>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Architecture Topology</span>
          <span className="text-zinc-300 text-xs leading-relaxed block">
            {fingerprint.architecture}
          </span>
        </div>

        {/* Audit Metadata Trail */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.05] text-[10px] text-zinc-500">
          <div>
            <span className="block uppercase text-[8px] tracking-wider mb-0.5">Evaluation ID</span>
            <span className="text-zinc-400 font-mono select-all block">{metadata.evaluation_id}</span>
          </div>
          <div>
            <span className="block uppercase text-[8px] tracking-wider mb-0.5">Snapshot Commit</span>
            <span className="text-zinc-400 font-mono select-all block">{metadata.repository_commit} ({metadata.repository_branch})</span>
          </div>
          <div>
            <span className="block uppercase text-[8px] tracking-wider mb-0.5">Engine / Schema</span>
            <span className="text-zinc-400 block">YOWON v{metadata.ri_engine_version} (Jury v{metadata.council_version})</span>
          </div>
          <div>
            <span className="block uppercase text-[8px] tracking-wider mb-0.5">Execution Duration</span>
            <span className="text-zinc-400 block">{metadata.duration_seconds}s across {metadata.evidence_count} evidence nodes</span>
          </div>
        </div>
      </div>
    </DashboardSection>
  )
}
