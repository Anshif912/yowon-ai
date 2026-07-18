import React from 'react'

export interface EnterpriseMetadata {
  level?: string
  estimated_effort_days?: number
  description?: string
  priority?: string
  confidence?: number
  impact?: string
  risk_score?: number
  owner?: string
  status?: string
  category?: string
  [key: string]: any
}

interface StoryValueRendererProps {
  value: any
}

export function StoryValueRenderer({ value }: StoryValueRendererProps) {
  // 1. Null / Undefined
  if (value === null || value === undefined) {
    return <span className="text-zinc-600 italic">Not specified</span>
  }

  // 2. Boolean
  if (typeof value === 'boolean') {
    return (
      <span className={`px-2 py-0.5 rounded text-[8px] font-mono border ${
        value 
          ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      }`}>
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  // 3. Number
  if (typeof value === 'number') {
    return <span className="text-white font-mono font-bold">{value.toLocaleString()}</span>
  }

  // 4. String
  if (typeof value === 'string') {
    return <span className="text-zinc-300 font-sans leading-relaxed">{value}</span>
  }

  // 5. Array
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-zinc-600 italic">None</span>
    }
    return (
      <ul className="list-disc list-inside space-y-1 text-zinc-300 font-sans">
        {value.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            <StoryValueRenderer value={item} />
          </li>
        ))}
      </ul>
    )
  }

  // 6. Object
  if (typeof value === 'object') {
    // Check if it is an Enterprise Metadata Object
    const hasLevel = 'level' in value
    const hasEffort = 'estimated_effort_days' in value
    const hasDesc = 'description' in value

    if (hasLevel || hasEffort || hasDesc) {
      const meta = value as EnterpriseMetadata
      const level = meta.level || 'Medium'
      
      // Determine severity badge colors
      let badgeStyle = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      if (level.toLowerCase() === 'high') {
        badgeStyle = 'bg-orange-400/10 text-orange-400 border-orange-400/20'
      } else if (level.toLowerCase() === 'critical') {
        badgeStyle = 'bg-red-400/10 text-red-400 border-red-400/20'
      } else if (level.toLowerCase() === 'low') {
        badgeStyle = 'bg-blue-400/10 text-blue-400 border-blue-400/20'
      } else if (level.toLowerCase() === 'success' || level.toLowerCase() === 'resolved') {
        badgeStyle = 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
      }

      return (
        <div className="space-y-2 p-2.5 rounded-lg border border-white/[0.04] bg-white/[0.01] font-sans">
          <div className="flex flex-wrap items-center gap-2">
            {meta.level && (
              <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase border ${badgeStyle}`}>
                {meta.level}
              </span>
            )}
            {meta.estimated_effort_days !== undefined && (
              <span className="text-[8px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                Effort: {meta.estimated_effort_days} {meta.estimated_effort_days === 1 ? 'day' : 'days'}
              </span>
            )}
            {/* Render any additional fields dynamically if they exist */}
            {Object.keys(meta).map((key) => {
              if (['level', 'estimated_effort_days', 'description'].includes(key)) return null
              const val = meta[key]
              if (val === null || val === undefined || typeof val === 'object') return null
              return (
                <span key={key} className="text-[8px] font-mono text-cyan-400 bg-cyan-400/5 border border-cyan-400/15 px-2 py-0.5 rounded">
                  {key}: {String(val)}
                </span>
              )
            })}
          </div>
          {meta.description && (
            <p className="text-zinc-300 leading-relaxed text-[8.5px]">{meta.description}</p>
          )}
        </div>
      )
    }

    // Generic Object recursive rendering
    const keys = Object.keys(value)
    if (keys.length === 0) {
      return <span className="text-zinc-600 italic">Empty object</span>
    }

    return (
      <div className="space-y-1.5 pl-3 border-l border-white/[0.06] py-1 font-sans text-xs">
        {keys.map((key) => (
          <div key={key} className="space-y-0.5">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block">{key}:</span>
            <div className="text-zinc-300">
              <StoryValueRenderer value={value[key]} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Fallback
  return <span className="text-zinc-300">{String(value)}</span>
}
