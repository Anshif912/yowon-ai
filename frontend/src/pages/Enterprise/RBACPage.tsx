import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Lock,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Plus,
  Sliders,
  Users,
  Building2,
  FileCode,
  Check
} from 'lucide-react'

interface RolePermission {
  role: string
  description: string
  level: string
  permissions: {
    repositories: boolean
    workflows: boolean
    secrets: boolean
    connectors: boolean
    policies: boolean
    marketplace: boolean
    administration: boolean
  }
}

const INITIAL_ROLES: RolePermission[] = [
  {
    role: 'Platform Owner',
    description: 'Full administrative control over all organizations, infrastructure, and policies.',
    level: 'L5 - System',
    permissions: {
      repositories: true,
      workflows: true,
      secrets: true,
      connectors: true,
      policies: true,
      marketplace: true,
      administration: true
    }
  },
  {
    role: 'Organization Admin',
    description: 'Manages teams, members, connectors, and workspace policies.',
    level: 'L4 - Organization',
    permissions: {
      repositories: true,
      workflows: true,
      secrets: true,
      connectors: true,
      policies: true,
      marketplace: true,
      administration: false
    }
  },
  {
    role: 'Security Engineer',
    description: 'Inspects vulnerability reports, updates policies, and rotates secret keys.',
    level: 'L3 - Security',
    permissions: {
      repositories: true,
      workflows: true,
      secrets: true,
      connectors: false,
      policies: true,
      marketplace: false,
      administration: false
    }
  },
  {
    role: 'Developer',
    description: 'Triggers evaluations, views repository intelligence, and executes Copilot queries.',
    level: 'L2 - Member',
    permissions: {
      repositories: true,
      workflows: true,
      secrets: false,
      connectors: false,
      policies: false,
      marketplace: false,
      administration: false
    }
  },
  {
    role: 'Viewer',
    description: 'Read-only access to executive dashboards and evaluation verdicts.',
    level: 'L1 - Read Only',
    permissions: {
      repositories: true,
      workflows: false,
      secrets: false,
      connectors: false,
      policies: false,
      marketplace: false,
      administration: false
    }
  }
]

export default function RBACPage() {
  const [roles, setRoles] = useState<RolePermission[]>(INITIAL_ROLES)

  const togglePermission = (roleIndex: number, permKey: keyof RolePermission['permissions']) => {
    const updated = [...roles]
    updated[roleIndex].permissions[permKey] = !updated[roleIndex].permissions[permKey]
    setRoles(updated)
  }

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <Lock size={14} /> CENTRALIZED AUTHORIZATION ENGINE
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Configure hierarchical permission scopes (Platform → Organization → Team → Repository → Resource Policy).
          </p>
        </div>

        <button
          onClick={() => alert('New custom role modal triggered')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition cursor-pointer text-sm font-mono"
        >
          <Plus size={16} /> Create Custom Role
        </button>
      </div>

      {/* Permission Matrix */}
      <div className="border border-zinc-800 rounded-xl bg-[#090d13] overflow-hidden">
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <Shield size={16} className="text-cyan-400" /> Enterprise Permissions Matrix
          </div>
          <span className="text-xs text-zinc-400 font-mono">Changes persist automatically</span>
        </div>

        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-xs uppercase border-b border-zinc-800">
            <tr>
              <th className="py-4 px-6">Role & Scope</th>
              <th className="py-4 px-3 text-center">Repositories</th>
              <th className="py-4 px-3 text-center">Workflows</th>
              <th className="py-4 px-3 text-center">Secrets Vault</th>
              <th className="py-4 px-3 text-center">Connectors</th>
              <th className="py-4 px-3 text-center">Policies</th>
              <th className="py-4 px-3 text-center">Marketplace</th>
              <th className="py-4 px-3 text-center">Administration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {roles.map((r, idx) => (
              <tr key={r.role} className="hover:bg-zinc-800/20 transition">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Key size={14} className="text-cyan-400" /> {r.role}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {r.level}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{r.description}</p>
                </td>

                {(Object.keys(r.permissions) as (keyof typeof r.permissions)[]).map(permKey => {
                  const isGranted = r.permissions[permKey]
                  return (
                    <td key={permKey} className="py-4 px-3 text-center">
                      <button
                        onClick={() => togglePermission(idx, permKey)}
                        className={`p-2 rounded-lg transition cursor-pointer border ${
                          isGranted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-zinc-900 text-zinc-600 border-zinc-800 hover:text-zinc-400'
                        }`}
                      >
                        {isGranted ? <Check size={16} /> : <XCircle size={16} />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
