import React, { useState } from 'react'
import {
  Brain,
  MessageSquare,
  TrendingUp,
  Workflow,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Database,
  Cpu,
  RotateCw,
  Gauge,
  Sliders,
  Play
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  PageHeader,
  SplitView,
  MetricCard,
  ChartCard,
  StatusBadge
} from '../../components/enterprise'

// Demo data for radar chart
const INITIAL_RADAR_DATA = [
  { subject: 'Velocity', baseline: 80, simulated: 80, fullMark: 100 },
  { subject: 'Security', baseline: 92, simulated: 92, fullMark: 100 },
  { subject: 'Architecture', baseline: 78, simulated: 78, fullMark: 100 },
  { subject: 'Deploy Speed', baseline: 85, simulated: 85, fullMark: 100 },
  { subject: 'Code Quality', baseline: 88, simulated: 88, fullMark: 100 }
]

const INITIAL_TRENDS_DATA = [
  { month: 'M1', health: 85 },
  { month: 'M2', health: 86 },
  { month: 'M3', health: 87 },
  { month: 'M4', health: 86 },
  { month: 'M5', health: 88 },
  { month: 'M6', health: 89 }
]

export default function DigitalTwinPage() {
  const [radarData, setRadarData] = useState(INITIAL_RADAR_DATA)
  const [trendsData, setTrendsData] = useState(INITIAL_TRENDS_DATA)
  const [simulating, setSimulating] = useState(false)

  // Simulation variables
  const [devCount, setDevCount] = useState(150)
  const [strictness, setStrictness] = useState<'standard' | 'strict' | 'relaxed'>('standard')
  const [refactorFreq, setRefactorFreq] = useState(40) // slider: 0-100

  // Run scenario simulation
  const handleRunSimulation = () => {
    setSimulating(true)
    setTimeout(() => {
      // Calculate mock simulation results based on parameters
      const strictMult = strictness === 'strict' ? 1.08 : strictness === 'relaxed' ? 0.88 : 1.0
      const refactorMult = refactorFreq / 40.0
      
      const newRadar = [
        { subject: 'Velocity', baseline: 80, simulated: Math.round(Math.min(100, 80 * (devCount / 150) * (2 - strictMult))), fullMark: 100 },
        { subject: 'Security', baseline: 92, simulated: Math.round(Math.min(100, 92 * strictMult * (1 + refactorMult * 0.05))), fullMark: 100 },
        { subject: 'Architecture', baseline: 78, simulated: Math.round(Math.min(100, 78 * refactorMult)), fullMark: 100 },
        { subject: 'Deploy Speed', baseline: 85, simulated: Math.round(Math.min(100, 85 * (devCount / 150) * (strictness === 'strict' ? 0.9 : 1.1))), fullMark: 100 },
        { subject: 'Code Quality', baseline: 88, simulated: Math.round(Math.min(100, 88 * refactorMult)), fullMark: 100 }
      ]

      const newTrends = [
        { month: 'M1', health: Math.round(85 * strictMult) },
        { month: 'M2', health: Math.round(86 * refactorMult * strictMult) },
        { month: 'M3', health: Math.round(87 * strictMult) },
        { month: 'M4', health: Math.round(88 * refactorMult) },
        { month: 'M5', health: Math.round(89 * (devCount / 150)) },
        { month: 'M6', health: Math.round(Math.min(100, 90 * refactorMult * strictMult)) }
      ]

      setRadarData(newRadar)
      setTrendsData(newTrends)
      setSimulating(false)
    }, 1200)
  }

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      {/* Page Header */}
      <PageHeader
        title="Org Digital Twin Simulator"
        description="Simulate organization engineering velocity dynamics, check security standards strictness impact, and forecast codebase health index trends."
        breadcrumbs={[
          { label: 'Intelligence', href: '/intelligence' },
          { label: 'Digital Twin Simulator' }
        ]}
        status={{ label: 'HEALTH MODEL STABLE', type: 'success' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Split View */}
        <SplitView
          leftPanel={
            <div className="flex flex-col border border-white/5 bg-[#0b0c10]/80 rounded-xl p-6 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />

              <div className="flex items-center gap-2 mb-5">
                <Sliders size={15} className="text-cyan-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Simulation Variables
                </h4>
              </div>

              <div className="flex flex-col gap-6">
                
                {/* devCount Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">DEVELOPER RESOURCES</span>
                    <span className="text-cyan-400 font-bold">{devCount} Devs</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={devCount}
                    onChange={(e) => setDevCount(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    Adjusts active developers workforce size. Affects velocity and deployment speeds metrics.
                  </span>
                </div>

                {/* strictness selectors */}
                <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                  <span className="text-zinc-400 font-bold font-mono uppercase tracking-wider text-[10px] block mb-1">
                    SECURITY CHECK STRICTNESS
                  </span>
                  <div className="flex flex-col gap-2 text-xs">
                    {(['relaxed', 'standard', 'strict'] as const).map((lvl) => (
                      <label key={lvl} className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer select-none">
                        <input
                          type="radio"
                          name="strictnessLevel"
                          checked={strictness === lvl}
                          onChange={() => setStrictness(lvl)}
                          className="h-3.5 w-3.5 text-cyan-600 bg-zinc-950 border-zinc-700 focus:ring-cyan-500 cursor-pointer"
                        />
                        <span className="capitalize font-mono">{lvl} compliance checks</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* refactorFreq Slider */}
                <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">REFACTOR FREQUENCY</span>
                    <span className="text-cyan-400 font-bold">{refactorFreq}% Index</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={refactorFreq}
                    onChange={(e) => setRefactorFreq(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    Configures technical debt refactoring rate. Controls architecture drift mitigation curves.
                  </span>
                </div>

                {/* Simulation trigger button */}
                <button
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all duration-150"
                >
                  {simulating ? (
                    <>
                      <RotateCw className="animate-spin" size={13} />
                      RUNNING SIMULATION ENGINE...
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="currentColor" />
                      EXECUTE SCENARIO SIMULATION
                    </>
                  )}
                </button>

              </div>
            </div>
          }
          rightPanel={
            <div className="flex flex-col gap-6">
              
              {/* Simulation metrics overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                  label="Simulated Velocity"
                  value={`${radarData[0].simulated} / 100`}
                  icon={Gauge}
                  accentColor="cyan"
                />
                <MetricCard
                  label="Security Index"
                  value={`${radarData[1].simulated} / 100`}
                  icon={Shield}
                  accentColor="emerald"
                />
                <MetricCard
                  label="Architecture Drift"
                  value={`${100 - radarData[2].simulated}%`}
                  icon={Layers}
                  accentColor="violet"
                />
              </div>

              {/* Layout split: Radar and trends charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Radar chart */}
                <ChartCard
                  title="Capability Radar"
                  subtitle="Comparison of organization parameters against baseline health index"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                      <PolarRadiusAxis stroke="rgba(255,255,255,0.2)" fontSize={8} angle={30} domain={[0, 100]} />
                      <Radar name="Baseline Profile" dataKey="baseline" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                      <Radar name="Simulated Scenario" dataKey="simulated" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Trends chart */}
                <ChartCard
                  title="Projected Health Trend"
                  subtitle="Forecasted 6-month aggregate index trend under simulation parameters"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="healthGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} domain={[50, 100]} />
                      <Tooltip
                        contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        labelStyle={{ fontSize: '9px', color: '#ccc', fontFamily: 'monospace' }}
                        itemStyle={{ fontSize: '10px', color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="health" name="Org Health" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#healthGlow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

              </div>

            </div>
          }
          leftWidth="w-full xl:w-1/3"
          rightWidth="w-full xl:w-2/3"
          gap="gap-6"
        />

      </div>
    </div>
  )
}
