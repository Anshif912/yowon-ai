import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  Search,
  Mail,
  MoreVertical,
  CheckCircle2,
  Clock,
  Filter,
  Building2,
  Key
} from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string
  role: string
  team: string
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  lastActive: string
  avatar: string
}

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Anshif',
    email: 'anshif@yowon.ai',
    role: 'Platform Owner',
    team: 'AI Architecture',
    status: 'ACTIVE',
    lastActive: 'Just now',
    avatar: 'https://github.com/Anshif912.png'
  },
  {
    id: 'm2',
    name: 'Sarah Chen',
    email: 'sarah.chen@yowon.ai',
    role: 'Security Engineer',
    team: 'Sentinel Team',
    status: 'ACTIVE',
    lastActive: '12m ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  {
    id: 'm3',
    name: 'Marcus Vance',
    email: 'marcus.v@yowon.ai',
    role: 'Lead Architect',
    team: 'Core Engine',
    status: 'ACTIVE',
    lastActive: '1h ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    id: 'm4',
    name: 'Elena Rostova',
    email: 'elena.r@yowon.ai',
    role: 'Developer',
    team: 'Frontend OS',
    status: 'PENDING',
    lastActive: 'Invited 2d ago',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
  }
]

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                          m.email.toLowerCase().includes(search.toLowerCase()) ||
                          m.team.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <Users size={14} /> ENTERPRISE MEMBER DIRECTORY
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">
            Organization Members & Access
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage multi-tenant organization members, team assignments, and RBAC roles.
          </p>
        </div>

        <button
          onClick={() => alert('Invite member modal triggered')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition cursor-pointer text-sm"
        >
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: members.length, icon: Users, color: 'text-cyan-400' },
          { label: 'Active Users', value: members.filter(m => m.status === 'ACTIVE').length, icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Pending Invites', value: members.filter(m => m.status === 'PENDING').length, icon: Clock, color: 'text-amber-400' },
          { label: 'Security Officers', value: members.filter(m => m.role.includes('Security') || m.role.includes('Owner')).length, icon: Shield, color: 'text-purple-400' }
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-xl border border-zinc-800 bg-[#090d13] flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-zinc-400">{stat.label}</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">{stat.value}</div>
            </div>
            <div className={`p-3 rounded-lg bg-zinc-900 border border-zinc-800 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#090d13] p-4 rounded-xl border border-zinc-800">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search members by name, email, or team..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={16} className="text-zinc-400" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="Platform Owner">Platform Owner</option>
            <option value="Security Engineer">Security Engineer</option>
            <option value="Lead Architect">Lead Architect</option>
            <option value="Developer">Developer</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-xl bg-[#090d13] overflow-hidden">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-xs uppercase border-b border-zinc-800">
            <tr>
              <th className="py-3 px-6">Member</th>
              <th className="py-3 px-6">Role</th>
              <th className="py-3 px-6">Team</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Last Active</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {filteredMembers.map(member => (
              <tr key={member.id} className="hover:bg-zinc-800/30 transition">
                <td className="py-4 px-6 flex items-center gap-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-9 h-9 rounded-full border border-zinc-700 object-cover"
                  />
                  <div>
                    <div className="font-semibold text-white">{member.name}</div>
                    <div className="text-xs text-zinc-400 font-mono">{member.email}</div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Key size={12} /> {member.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-zinc-300 font-mono text-xs">{member.team}</td>
                <td className="py-4 px-6">
                  {member.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 size={12} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-xs text-zinc-400 font-mono">{member.lastActive}</td>
                <td className="py-4 px-6 text-right">
                  <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
