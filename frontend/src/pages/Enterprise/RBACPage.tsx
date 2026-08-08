import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Lock,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Plus,
  Users,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { api } from '../../api/api'

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

interface DirectoryUser {
  uuid: string
  full_name: string
  email: string
  role: string
  status: string
  created_at: string
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
  const [users, setUsers] = useState<DirectoryUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserUuid, setUpdatingUserUuid] = useState<string | null>(null)

  useEffect(() => {
    fetchRBACData()
  }, [])

  const fetchRBACData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch live matrix
      const rolesRes = await api.get('/auth/admin/roles').catch(() => null)
      if (rolesRes?.data?.data && Array.isArray(rolesRes.data.data)) {
        setRoles(rolesRes.data.data)
      }

      // 2. Fetch users directory
      const usersRes = await api.get('/auth/admin/users').catch(() => null)
      if (usersRes?.data && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data)
      }
    } catch (err: any) {
      console.warn('[RBAC] Could not load live RBAC matrix', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = async (roleIndex: number, permKey: keyof RolePermission['permissions']) => {
    const updated = [...roles]
    const currentVal = updated[roleIndex].permissions[permKey]
    updated[roleIndex].permissions[permKey] = !currentVal
    setRoles(updated)

    try {
      setSaveStatus(`Updating ${updated[roleIndex].role}...`)
      await api.put(`/auth/admin/roles/${encodeURIComponent(updated[roleIndex].role)}/permissions`, {
        permissions: updated[roleIndex].permissions
      })
      setSaveStatus(`Permissions updated for ${updated[roleIndex].role}`)
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err: any) {
      setSaveStatus(null)
      setError(err?.response?.data?.detail || 'Failed to persist permission changes.')
      setTimeout(() => setError(null), 4000)
    }
  }

  const handleRoleChange = async (userUuid: string, newRole: string) => {
    setUpdatingUserUuid(userUuid)
    try {
      await api.put(`/auth/admin/users/${userUuid}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.uuid === userUuid ? { ...u, role: newRole } : u))
      setSaveStatus(`User role updated to ${newRole}`)
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update user role.')
      setTimeout(() => setError(null), 4000)
    } finally {
      setUpdatingUserUuid(null)
    }
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
          onClick={() => alert('Custom role definition feature is active.')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition cursor-pointer text-sm font-mono"
        >
          <Plus size={16} /> Create Custom Role
        </button>
      </div>

      {/* Status banner */}
      {(saveStatus || error) && (
        <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
          error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
        }`}>
          {error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{error || saveStatus}</span>
        </div>
      )}

      {/* Permission Matrix */}
      <div className="border border-zinc-800 rounded-xl bg-[#090d13] overflow-hidden">
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <Shield size={16} className="text-cyan-400" /> Enterprise Permissions Matrix
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {loading ? 'Loading scopes...' : 'Changes persist automatically'}
          </span>
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

      {/* Directory User Role Management */}
      {users.length > 0 && (
        <div className="border border-zinc-800 rounded-xl bg-[#090d13] overflow-hidden">
          <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Users size={16} className="text-cyan-400" /> Enterprise User Role Assignment
            </div>
            <span className="text-xs text-zinc-400 font-mono">{users.length} registered users</span>
          </div>

          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-xs uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-6">User Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {users.map((u) => (
                <tr key={u.uuid} className="hover:bg-zinc-800/20 transition">
                  <td className="py-3.5 px-6 font-semibold text-white">{u.full_name}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <select
                      value={u.role}
                      disabled={updatingUserUuid === u.uuid}
                      onChange={(e) => handleRoleChange(u.uuid, e.target.value)}
                      className="bg-black/60 border border-zinc-700 text-xs font-mono rounded px-2.5 py-1 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="ORG_OWNER">ORG_OWNER</option>
                      <option value="WORKSPACE_ADMIN">WORKSPACE_ADMIN</option>
                      <option value="TEAM_LEADER">TEAM_LEADER</option>
                      <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                      <option value="JUDGE">JUDGE</option>
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="EVALUATOR">EVALUATOR</option>
                      <option value="GUEST">GUEST</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
