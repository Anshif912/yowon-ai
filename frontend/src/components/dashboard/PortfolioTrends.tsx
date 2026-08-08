import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface TrendData {
  timestamp: string
  health: number
  risk: number
  debt: number
}

interface PortfolioTrendsProps {
  data?: TrendData[]
  loading?: boolean
}

export default function PortfolioTrends({ data = [], loading }: PortfolioTrendsProps) {
  if (loading) {
    return (
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/4" />
        <div className="h-32 bg-zinc-800 rounded w-full" />
      </div>
    )
  }

  const hasData = data && data.length > 1

  return (
    <section className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Portfolio Trend Analytics
        </h3>
        <p className="text-[9.5px] text-zinc-500 font-sans leading-relaxed">
          Historical changes in overall codebase quality, security threats, and engineering debt indexes.
        </p>
      </div>

      {hasData ? (
        <div className="w-full h-44 bg-[#0c0d12] border border-white/[0.04] p-3 rounded-xl">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="timestamp" stroke="#666" style={{ fontSize: 8 }} />
              <YAxis stroke="#666" style={{ fontSize: 8 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c0d12',
                  borderColor: 'rgba(255,255,255,0.08)',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
              <Line type="monotone" dataKey="health" name="Health" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="risk" name="Risk" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="debt" name="Debt (h)" stroke="#a855f7" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center text-zinc-500 font-mono italic">
          Historical trend data will appear after multiple repository evaluations.
        </div>
      )}
    </section>
  )
}
