import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  FolderGit2,
  Users,
  ShieldCheck,
  Plus,
  Globe,
  ExternalLink,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react'
import { api } from '../../api/api'

interface Org {
  uuid: string
  name: string
  login: string
  provider_type: string
  created_at: string
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get('/orgs')
        if (res.data && Array.isArray(res.data)) {
          setOrgs(res.data)
        } else {
          setOrgs([
            {
              uuid: 'org-yowon-hq',
              name: 'YOWON AI Organization',
              login: 'yowon-ai-hq',
              provider_type: 'github',
              created_at: new Date().toISOString()
            }
          ])
        }
      } catch (e) {
        setOrgs([
          {
            uuid: 'org-yowon-hq',
            name: 'YOWON AI Organization',
            login: 'yowon-ai-hq',
            provider_type: 'github',
            created_at: new Date().toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchOrgs()
  }, [])

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <Building2 size={14} /> MULTI-TENANT DOMAIN HIERARCHY
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">
            Enterprise Organizations
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage root multi-tenant organizations, workspace boundaries, and repository ownership.
          </p>
        </div>

        <button
          onClick={() => alert('New organization modal triggered')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition cursor-pointer text-sm font-mono"
        >
          <Plus size={16} /> Create Organization
        </button>
      </div>

      {/* Org Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map(org => (
          <motion.div
            key={org.uuid}
            whileHover={{ y: -2 }}
            className="p-6 rounded-xl border border-zinc-800 bg-[#090d13] flex flex-col justify-between space-y-6 hover:border-cyan-500/50 transition shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Building2 size={24} />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={12} /> Active Tenant
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-display">{org.name}</h3>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">@{org.login}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-500">Repositories</div>
                  <div className="text-sm font-bold text-white mt-0.5">20 Repos</div>
                </div>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-500">Teams</div>
                  <div className="text-sm font-bold text-white mt-0.5">5 Teams</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Provider: {org.provider_type.toUpperCase()}</span>
              <button
                onClick={() => alert(`Navigating to org ${org.login}`)}
                className="flex items-center gap-1 text-cyan-400 hover:underline cursor-pointer"
              >
                Manage Org <ExternalLink size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
