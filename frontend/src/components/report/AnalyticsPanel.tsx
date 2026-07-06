import React from 'react'
import { BarChart3 } from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell,
} from 'recharts'
import RiskHeatmap from '../results/RiskHeatmap'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { getRadarData, scoreColor } from '../../utils/reportParser'

interface AnalyticsPanelProps {
  projectId: string
}

function AnalyticsContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[1, 2].map(i => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (!report) return null

  const vd = report.verdict_data
  const radarData = getRadarData(vd?.agent_scores)
  const barData = radarData.map(d => ({ name: d.subject, score: d.score }))
  const heatmapCategories = radarData.map(d => ({ label: d.subject, score: d.score }))

  return (
    <DashboardSection id="analytics" title="Analytics" icon={BarChart3} accent="violet">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card">
          <h3 className="text-xs font-mono text-yowon-muted uppercase tracking-widest mb-4">
            Council Score Radar
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1E2A44" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Space Grotesk' }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#00E5FF"
                fill="#00E5FF"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card">
          <h3 className="text-xs font-mono text-yowon-muted uppercase tracking-widest mb-6">
            Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ background: '#0B1023', border: '1px solid #1E2A44', borderRadius: 8 }}
                labelStyle={{ color: '#F8FAFC' }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {barData.map(entry => (
                  <Cell key={entry.name} fill={scoreColor(entry.score)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="xl:col-span-2">
          <RiskHeatmap categories={heatmapCategories} />
        </div>
      </div>
    </DashboardSection>
  )
}

export default function AnalyticsPanel({ projectId }: AnalyticsPanelProps) {
  return (
    <ErrorBoundary name="Analytics Panel">
      <AnalyticsContent projectId={projectId} />
    </ErrorBoundary>
  )
}
