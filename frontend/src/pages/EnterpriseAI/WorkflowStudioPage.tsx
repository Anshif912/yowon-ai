import React, { useState } from 'react'
import {
  Workflow,
  Plus,
  Play,
  RotateCw,
  Trash2,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  BookOpen,
  Terminal,
  Activity,
  CheckCircle,
  Clock,
  Settings,
  HelpCircle
} from 'lucide-react'
import {
  PageHeader,
  SplitView,
  DataTable,
  StatusBadge,
  ActionPanel
} from '../../components/enterprise'

interface FlowNode {
  id: string
  label: string
  type: 'trigger' | 'condition' | 'decision' | 'approval' | 'action' | 'notification' | 'complete'
  status: 'active' | 'success' | 'idle'
  desc: string
}

const FLOW_NODES: FlowNode[] = [
  { id: 'n1', label: 'PR Commit Trigger', type: 'trigger', status: 'success', desc: 'Triggered when commit code is pushed.' },
  { id: 'n2', label: 'Security Check Rules', type: 'condition', status: 'success', desc: 'Evaluates codebase against security rules.' },
  { id: 'n3', label: 'AI Scanners Verdict', type: 'decision', status: 'success', desc: 'Jury evaluates vulnerability thresholds.' },
  { id: 'n4', label: 'CTO Authorization', type: 'approval', status: 'active', desc: 'Requires manual signature override.' },
  { id: 'n5', label: 'Auto-Merge Actions', type: 'action', status: 'idle', desc: 'Merges PR branch into main.' },
  { id: 'n6', label: 'Slack Briefing Dispatch', type: 'notification', status: 'idle', desc: 'Alerts devs on Slack channel.' },
  { id: 'n7', label: 'Sync Complete', type: 'complete', status: 'idle', desc: 'Terminates workflow run logs.' }
]

const MOCK_FLOW_LOGS = [
  { id: 'l1', timestamp: '10:15:02', node: 'PR Commit Trigger', message: 'Trigger received for commit #0x4a2f.', state: 'success' },
  { id: 'l2', timestamp: '10:15:05', node: 'Security Check Rules', message: 'Cosine similarity indices compiled. Strict mode.', state: 'success' },
  { id: 'l3', timestamp: '10:15:08', node: 'AI Scanners Verdict', message: 'Jury verdict Accept. Confidence: 99.4%.', state: 'success' },
  { id: 'l4', timestamp: '10:15:10', node: 'CTO Authorization', message: 'Pending manual signature authorization.', state: 'pending' }
]

export default function WorkflowStudioPage() {
  const [nodes, setNodes] = useState<FlowNode[]>(FLOW_NODES)
  const [zoom, setZoom] = useState(100)
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('logs')
  const [running, setRunning] = useState(false)

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(150, prev + 10))
  const handleZoomOut = () => setZoom(prev => Math.max(70, prev - 10))
  
  // Trigger flow execution
  const handleExecuteFlow = () => {
    setRunning(true)
    setTimeout(() => {
      setRunning(false)
    }, 1500)
  }

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      {/* Page Header */}
      <PageHeader
        title="Workflow Studio Designer"
        description="Design conditional decisions pipelines, automate Git branch actions, and configure webhook messaging notification dispatches."
        breadcrumbs={[
          { label: 'Intelligence', href: '/intelligence' },
          { label: 'Workflow Studio' }
        ]}
        status={{ label: 'WORKFLOW ENGINE ONLINE', type: 'success' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Split View */}
        <SplitView
          leftPanel={
            <div className="flex flex-col h-[700px] border border-white/5 bg-[#0b0c10]/80 rounded-xl overflow-hidden backdrop-blur-md relative select-none">
              {/* Dynamic top edge line */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

              {/* Toolbar controls bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#05070a] shrink-0">
                <div className="flex items-center gap-2">
                  <Workflow size={15} className="text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Flowchart Canvas (v1.2)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 border border-white/5 bg-zinc-950 p-1 rounded-lg">
                  <button onClick={handleZoomIn} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5" title="Zoom In">
                    <ZoomIn size={12} />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500 px-1">{zoom}%</span>
                  <button onClick={handleZoomOut} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5" title="Zoom Out">
                    <ZoomOut size={12} />
                  </button>
                  <div className="w-px h-3 bg-white/10 mx-1" />
                  <button className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5" title="Undo Action">
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Node designer viewport */}
              <div className="flex-grow overflow-auto p-8 flex flex-col items-center justify-start gap-5 custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px]">
                
                {nodes.map((node, index) => {
                  const nodeTypeColors = {
                    trigger: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
                    condition: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
                    decision: 'border-violet-500/30 text-violet-400 bg-violet-500/5',
                    approval: 'border-pink-500/30 text-pink-400 bg-pink-500/5',
                    action: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5',
                    notification: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
                    complete: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                  }

                  const statusGlows = {
                    active: 'shadow-[0_0_10px_rgba(244,63,94,0.15)] border-rose-500/50',
                    success: 'shadow-[0_0_10px_rgba(16,185,129,0.15)] border-emerald-500/30',
                    idle: 'shadow-none'
                  }

                  return (
                    <React.Fragment key={node.id}>
                      {/* Flow Card */}
                      <div
                        className={`w-64 border rounded-xl p-4 text-left transition-all duration-150 relative bg-[#05070a]/90 ${
                          nodeTypeColors[node.type]
                        } ${statusGlows[node.status]}`}
                        style={{ transform: `scale(${zoom / 100})` }}
                      >
                        {/* Node status dot indicator */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest leading-none">
                            {node.type}
                          </span>
                          <StatusBadge status={node.status === 'active' ? 'pending' : node.status === 'success' ? 'success' : 'neutral'} size="xs" customLabel={node.status} />
                        </div>
                        <h5 className="text-xs font-bold text-white mb-1">{node.label}</h5>
                        <p className="text-[10px] text-zinc-500 leading-normal">{node.desc}</p>
                      </div>

                      {/* Direction Arrow */}
                      {index < nodes.length - 1 && (
                        <div
                          className="flex flex-col items-center justify-center h-5 w-px bg-cyan-500/20 shrink-0 relative"
                          style={{ transform: `scale(${zoom / 100})` }}
                        >
                          <ChevronRight className="rotate-90 text-cyan-500/30 shrink-0" size={12} />
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

            </div>
          }
          rightPanel={
            <div className="flex flex-col gap-6">
              
              {/* Studio Operations action card */}
              <ActionPanel
                title="Studio Commands"
                description="Trigger manual execution logs audits or commit design revisions."
                actions={[
                  {
                    label: running ? 'RUNNING TEST FLOW...' : 'TRIGGER TEST FLOW',
                    onClick: handleExecuteFlow,
                    icon: Play,
                    intent: 'primary',
                    disabled: running
                  },
                  {
                    label: 'SAVE FLOW DESIGN',
                    onClick: () => {},
                    icon: Save,
                    intent: 'secondary'
                  }
                ]}
              />

              {/* Tabs sidebar container */}
              <div className="flex flex-col border border-white/5 bg-[#0b0c10]/80 rounded-xl p-6 text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />

                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Studio Telemetry
                  </span>

                  <div className="flex items-center gap-1 border border-white/5 bg-zinc-950 p-0.5 rounded-lg shrink-0">
                    {(['templates', 'logs'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase transition-colors duration-150 ${
                          activeTab === tab
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                  <div className="flex flex-col gap-3 font-sans">
                    <div className="p-3 border border-white/5 rounded-lg bg-zinc-950/40 hover:border-cyan-500/20 transition-all duration-150 cursor-pointer">
                      <h6 className="text-xs font-bold text-zinc-300">Vulnerability Scanners Pipeline</h6>
                      <p className="text-[10px] text-zinc-500 mt-1">Triggers AST scans on commits and alerts Slack channels.</p>
                    </div>
                    <div className="p-3 border border-white/5 rounded-lg bg-zinc-950/40 hover:border-cyan-500/20 transition-all duration-150 cursor-pointer">
                      <h6 className="text-xs font-bold text-zinc-300">Automatic API Secret Rotation</h6>
                      <p className="text-[10px] text-zinc-500 mt-1">Triggers credentials refresh on expiries warnings.</p>
                    </div>
                  </div>
                )}

                {/* Execution Logs Tab */}
                {activeTab === 'logs' && (
                  <DataTable
                    rowIdKey="id"
                    data={MOCK_FLOW_LOGS}
                    columns={[
                      { key: 'timestamp', header: 'TIME', width: '80px', className: 'font-mono text-zinc-500 text-[10px]' },
                      { key: 'node', header: 'NODE', width: '130px', className: 'font-sans font-bold text-[10px]' },
                      {
                        key: 'state',
                        header: 'STATE',
                        render: (_, val) => (
                          <StatusBadge status={val === 'success' ? 'success' : 'pending'} size="xs" />
                        )
                      }
                    ]}
                  />
                )}

              </div>

            </div>
          }
          leftWidth="w-full xl:w-7/12"
          rightWidth="w-full xl:w-5/12"
          gap="gap-6"
        />

      </div>
    </div>
  )
}
