import React, { useState, useMemo } from 'react'
import {
  Cpu,
  Sliders,
  Settings,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  RefreshCw,
  SlidersHorizontal as ConfigIcon,
  ToggleLeft,
  ToggleRight,
  Database,
  Layers,
  ArrowRight,
  AlertTriangle,
  Info
} from 'lucide-react'
import {
  PageHeader,
  SearchToolbar,
  StatusBadge,
  DataTable,
  InspectorPanel,
  ConfirmationDialog,
  LoadingSkeleton,
  EmptyState
} from '../../components/enterprise'

interface SystemPlugin {
  id: string
  name: string
  type: 'Scanner' | 'DNA Analyzer'
  status: 'active' | 'inactive' | 'error'
  latency: string
  memory: string
  threads: number
  description: string
  configYaml: string
  threshold: number
}

const INITIAL_PLUGINS: SystemPlugin[] = [
  {
    id: 'plg-ast',
    name: 'AST Vulnerability Analyzer',
    type: 'Scanner',
    status: 'active',
    latency: '8ms',
    memory: '38 MB',
    threads: 4,
    description: 'Generates abstract syntax tree maps to spot code vulnerability patterns.',
    configYaml: 'threshold: high\nscanner_rules:\n  - sql_injection\n  - xss_leak\n  - path_traversal',
    threshold: 80
  },
  {
    id: 'plg-complexity',
    name: 'Cognitive DNA Analyzer',
    type: 'DNA Analyzer',
    status: 'active',
    latency: '45ms',
    memory: '142 MB',
    threads: 8,
    description: 'Analyzes reasoning flow structures and checks logic paths for AI hallucinations.',
    configYaml: 'max_hallucination_index: 0.15\nrun_jury_evals: true\ndeterminism_mode: verified',
    threshold: 90
  },
  {
    id: 'plg-secret-leak',
    name: 'Credentials Scanner',
    type: 'Scanner',
    status: 'active',
    latency: '3ms',
    memory: '12 MB',
    threads: 2,
    description: 'Performs entropy analysis and regular expressions matches to catch API tokens in source code commits.',
    configYaml: 'entropy_threshold: 4.5\nwhitelist:\n  - test_secrets.json',
    threshold: 95
  },
  {
    id: 'plg-dependency',
    name: 'Dependency Vulnerability Check',
    type: 'Scanner',
    status: 'inactive',
    latency: '0ms (Offline)',
    memory: '0 MB',
    threads: 0,
    description: 'Cross-checks manifest files against global NVD databases.',
    configYaml: 'fetch_db_interval: 24h\nfail_build_on: critical',
    threshold: 70
  }
]

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<SystemPlugin[]>(INITIAL_PLUGINS)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Selected plugin for config inspector
  const [selectedPlugin, setSelectedPlugin] = useState<SystemPlugin | null>(null)
  
  // Configuration editing states
  const [editingYaml, setEditingYaml] = useState('')
  const [editingThreshold, setEditingThreshold] = useState(50)

  // Dialog controls
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'toggle' | 'reset' | null>(null)
  const [dialogPlugin, setDialogPlugin] = useState<SystemPlugin | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  const handleReload = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 600)
  }

  // Filter list
  const filteredPlugins = useMemo(() => {
    return plugins.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [plugins, searchQuery])

  // Open configuration inspector
  const handleOpenInspector = (plugin: SystemPlugin) => {
    setSelectedPlugin(plugin)
    setEditingYaml(plugin.configYaml)
    setEditingThreshold(plugin.threshold)
  }

  // Trigger enable/disable toggle dialog
  const triggerToggleDialog = (e: React.MouseEvent, plugin: SystemPlugin) => {
    e.stopPropagation()
    setDialogPlugin(plugin)
    setDialogType('toggle')
    setDialogOpen(true)
  }

  // Handle dialog confirm
  const handleConfirmAction = () => {
    if (!dialogPlugin || !dialogType) return
    setDialogLoading(true)

    setTimeout(() => {
      if (dialogType === 'toggle') {
        setPlugins(prev =>
          prev.map(p =>
            p.id === dialogPlugin.id
              ? {
                  ...p,
                  status: p.status === 'active' ? 'inactive' as const : 'active' as const,
                  latency: p.status === 'active' ? '0ms (Offline)' : '10ms',
                  memory: p.status === 'active' ? '0 MB' : '32 MB'
                }
              : p
          )
        )
        // If it is open in inspector, update state there too
        if (selectedPlugin?.id === dialogPlugin.id) {
          setSelectedPlugin(prev =>
            prev
              ? {
                  ...prev,
                  status: prev.status === 'active' ? 'inactive' as const : 'active' as const
                }
              : null
          )
        }
      }
      setDialogLoading(false)
      setDialogOpen(false)
      setDialogPlugin(null)
      setDialogType(null)
    }, 1000)
  }

  // Save config inside inspector
  const handleSaveConfig = () => {
    if (!selectedPlugin) return
    setPlugins(prev =>
      prev.map(p =>
        p.id === selectedPlugin.id
          ? { ...p, configYaml: editingYaml, threshold: editingThreshold }
          : p
      )
    )
    setSelectedPlugin(null)
  }

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      
      {/* Page Header */}
      <PageHeader
        title="System Analyzers & Scanners"
        description="Configure runtime extensions, performance limits, and evaluation scoring thresholds for AST and Cognitive DNA plugins."
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'System Plugins' }
        ]}
        status={{ label: 'SYSTEM SCRIPTS LIVE', type: 'success' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Search toolbar */}
        <SearchToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          placeholder="Filter system analyzer plugins by name or type..."
          onReload={handleReload}
          isLoading={loading}
        />

        {/* Content Table */}
        {loading ? (
          <LoadingSkeleton variant="table" rows={4} columns={6} />
        ) : filteredPlugins.length > 0 ? (
          <DataTable
            rowIdKey="id"
            data={filteredPlugins}
            onRowClick={handleOpenInspector}
            columns={[
              {
                key: 'name',
                header: 'PLUGIN NAME',
                width: '240px',
                render: (_, val) => (
                  <div className="flex items-center gap-2">
                    <Cpu size={12} className="text-zinc-500 shrink-0" />
                    <span className="font-bold text-white hover:text-cyan-400 transition-colors duration-150">
                      {val}
                    </span>
                  </div>
                )
              },
              { key: 'type', header: 'PLUGIN TYPE', width: '150px', className: 'font-mono text-[11px]' },
              {
                key: 'status',
                header: 'STATUS',
                width: '100px',
                render: (_, value) => (
                  <StatusBadge
                    status={value}
                    size="xs"
                  />
                )
              },
              { key: 'latency', header: 'LATENCY (AVG)', width: '130px', className: 'font-mono text-zinc-400 text-[11px]' },
              { key: 'memory', header: 'MEMORY WORKSPACE', width: '150px', className: 'font-mono text-zinc-400 text-[11px]' },
              {
                key: 'actions',
                header: 'CONTROLS',
                width: '120px',
                className: 'text-right',
                render: (row) => (
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => triggerToggleDialog(e, row)}
                      className={`p-1.5 rounded-lg border transition-all duration-150 ${
                        row.status === 'active'
                          ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                          : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 bg-zinc-950/60'
                      }`}
                      title={row.status === 'active' ? 'Deactivate Plugin' : 'Activate Plugin'}
                    >
                      {row.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    
                    <button
                      onClick={() => handleOpenInspector(row)}
                      className="p-1.5 text-zinc-400 hover:text-white bg-zinc-950/60 border border-white/5 hover:border-white/10 rounded-lg transition-all duration-150"
                      title="Configure Settings"
                    >
                      <Settings size={12} />
                    </button>
                  </div>
                )
              }
            ]}
          />
        ) : (
          <EmptyState
            title="NO PLUGINS FOUND"
            description="Your filter criteria did not match any installed system analyzers plugins."
            action={
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 text-xs font-mono font-bold bg-zinc-900 border border-white/10 text-white rounded-lg hover:bg-zinc-800 transition-colors duration-150"
              >
                CLEAR FILTER
              </button>
            }
          />
        )}

      </div>

      {/* Settings Configuration Inspector */}
      <InspectorPanel
        isOpen={!!selectedPlugin}
        onClose={() => setSelectedPlugin(null)}
        title={selectedPlugin?.name || ''}
        subtitle="Plugin Parameters Configuration"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPlugin(null)}
              className="px-4 py-2 text-xs font-mono font-bold text-zinc-500 hover:text-white transition-colors duration-150"
            >
              CANCEL
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all duration-150"
            >
              SAVE PARAMETERS
            </button>
          </div>
        }
      >
        {selectedPlugin && (
          <div className="flex flex-col gap-6 text-left select-none">
            
            {/* Type badge status */}
            <div className="grid grid-cols-2 gap-4 border border-white/5 p-3 rounded-lg bg-zinc-950/40 text-xs font-mono">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">TYPE</span>
                <span className="text-zinc-200 font-bold">{selectedPlugin.type}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">STATE</span>
                <StatusBadge status={selectedPlugin.status} size="xs" />
              </div>
            </div>

            {/* Threshold slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">SCORING THRESHOLD</span>
                <span className="text-cyan-400 font-bold">{editingThreshold}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={editingThreshold}
                onChange={(e) => setEditingThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-zinc-500 leading-normal">
                Sets the sensitivity index for report alerts triggers. Higher values reduce false warnings rates.
              </span>
            </div>

            {/* YAML Editor */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <div className="flex items-center gap-1.5 text-zinc-400 font-bold font-mono uppercase tracking-wider text-[10px]">
                <ConfigIcon size={12} className="text-cyan-400" />
                <span>PARAMETERS CODE (YAML)</span>
              </div>
              <textarea
                rows={7}
                value={editingYaml}
                onChange={(e) => setEditingYaml(e.target.value)}
                className="w-full p-3 font-mono text-[11px] text-zinc-300 bg-zinc-950/80 border border-white/5 hover:border-white/10 focus:border-cyan-500/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200 resize-none"
              />
            </div>

          </div>
        )}
      </InspectorPanel>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmAction}
        title={dialogPlugin?.status === 'active' ? 'Deactivate System Analyzer?' : 'Activate System Analyzer?'}
        description={
          dialogPlugin?.status === 'active'
            ? `Are you sure you want to disable "${dialogPlugin?.name}"? You will cease to run automatic vulnerability checks for this scanner during pipelines.`
            : `Are you sure you want to activate "${dialogPlugin?.name}"? This initiates background memory worker instances and starts real-time log scanning.`
        }
        confirmText={dialogPlugin?.status === 'active' ? 'YES, DEACTIVATE' : 'YES, ACTIVATE'}
        intent={dialogPlugin?.status === 'active' ? 'warning' : 'info'}
        loading={dialogLoading}
      />
    </div>
  )
}
