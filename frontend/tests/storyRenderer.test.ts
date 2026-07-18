import React from 'react'
import ReactDOMServer from 'react-dom/server'

// Duplicate function interface for standalone Node testing to avoid ESM .tsx loader restrictions
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

function StoryValueRenderer({ value }: { value: any }): React.ReactElement {
  if (value === null || value === undefined) {
    return React.createElement('span', { className: "text-zinc-600 italic" }, "Not specified")
  }

  if (typeof value === 'boolean') {
    return React.createElement('span', {
      className: `px-2 py-0.5 rounded text-[8px] font-mono border ${
        value 
          ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      }`
    }, value ? 'Yes' : 'No')
  }

  if (typeof value === 'number') {
    return React.createElement('span', { className: "text-white font-mono font-bold" }, value.toLocaleString())
  }

  if (typeof value === 'string') {
    return React.createElement('span', { className: "text-zinc-300 font-sans leading-relaxed" }, value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return React.createElement('span', { className: "text-zinc-600 italic" }, "None")
    }
    return React.createElement('ul', { className: "list-disc list-inside space-y-1 text-zinc-300 font-sans" },
      value.map((item, idx) => React.createElement('li', { key: idx, className: "leading-relaxed" }, 
        React.createElement(StoryValueRenderer, { value: item })
      ))
    )
  }

  if (typeof value === 'object') {
    const hasLevel = 'level' in value
    const hasEffort = 'estimated_effort_days' in value
    const hasDesc = 'description' in value

    if (hasLevel || hasEffort || hasDesc) {
      const meta = value as EnterpriseMetadata
      const level = meta.level || 'Medium'
      
      let badgeStyle = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      if (level.toLowerCase() === 'high') {
        badgeStyle = 'bg-orange-400/10 text-orange-400 border-orange-400/20'
      } else if (level.toLowerCase() === 'critical') {
        badgeStyle = 'bg-red-400/10 text-red-400 border-red-400/20'
      } else if (level.toLowerCase() === 'low') {
        badgeStyle = 'bg-blue-400/10 text-blue-400 border-blue-400/20'
      }

      const badge = meta.level ? React.createElement('span', {
        className: `px-2 py-0.5 rounded text-[8px] font-mono uppercase border ${badgeStyle}`
      }, meta.level) : null

      const effort = meta.estimated_effort_days !== undefined ? React.createElement('span', {
        className: "text-[8px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded"
      }, `Effort: ${meta.estimated_effort_days} ${meta.estimated_effort_days === 1 ? 'day' : 'days'}`) : null

      const extraBadges = Object.keys(meta).map((key) => {
        if (['level', 'estimated_effort_days', 'description'].includes(key)) return null
        const val = meta[key]
        if (val === null || val === undefined || typeof val === 'object') return null
        return React.createElement('span', {
          key,
          className: "text-[8px] font-mono text-cyan-400 bg-cyan-400/5 border border-cyan-400/15 px-2 py-0.5 rounded"
        }, `${key}: ${String(val)}`)
      })

      const desc = meta.description ? React.createElement('p', {
        className: "text-zinc-300 leading-relaxed text-[8.5px]"
      }, meta.description) : null

      return React.createElement('div', {
        className: "space-y-2 p-2.5 rounded-lg border border-white/[0.04] bg-white/[0.01] font-sans"
      }, 
        React.createElement('div', { className: "flex flex-wrap items-center gap-2" }, badge, effort, ...extraBadges),
        desc
      )
    }

    const keys = Object.keys(value)
    if (keys.length === 0) {
      return React.createElement('span', { className: "text-zinc-600 italic" }, "Empty object")
    }

    return React.createElement('div', {
      className: "space-y-1.5 pl-3 border-l border-white/[0.06] py-1 font-sans text-xs"
    },
      keys.map((key) => React.createElement('div', { key, className: "space-y-0.5" },
        React.createElement('span', { className: "text-[8px] font-mono text-zinc-500 uppercase block" }, `${key}:`),
        React.createElement('div', { className: "text-zinc-300" },
          React.createElement(StoryValueRenderer, { value: value[key] })
        )
      ))
    )
  }

  return React.createElement('span', { className: "text-zinc-300" }, String(value))
}

// Helper to render component to static HTML string
function render(value: any): string {
  return ReactDOMServer.renderToStaticMarkup(React.createElement(StoryValueRenderer, { value }))
}

// Test cases
// 1. Primitive string
const sHTML = render("Refactor auth")
if (!sHTML.includes("Refactor auth")) {
  throw new Error(`Primitive string test failed: ${sHTML}`)
}

// 2. Primitive number
const nHTML = render(12500)
if (!nHTML.includes("12,500")) {
  throw new Error(`Primitive number test failed: ${nHTML}`)
}

// 3. Boolean
const bTrueHTML = render(true)
if (!bTrueHTML.includes("Yes")) {
  throw new Error(`Boolean true test failed: ${bTrueHTML}`)
}
const bFalseHTML = render(false)
if (!bFalseHTML.includes("No")) {
  throw new Error(`Boolean false test failed: ${bFalseHTML}`)
}

// 4. Null & Undefined
const nullHTML = render(null)
if (!nullHTML.includes("Not specified")) {
  throw new Error(`Null test failed: ${nullHTML}`)
}

// 5. Array
const arrHTML = render(["Strengths A", "Strengths B"])
if (!arrHTML.includes("Strengths A") || !arrHTML.includes("Strengths B")) {
  throw new Error(`Array test failed: ${arrHTML}`)
}

// 6. Enterprise Metadata Object
const metaHTML = render({
  level: "Critical",
  estimated_effort_days: 12,
  description: "Fix vulnerability"
})
if (!metaHTML.includes("Critical") || !metaHTML.includes("12 days") || !metaHTML.includes("Fix vulnerability")) {
  throw new Error(`Enterprise metadata object test failed: ${metaHTML}`)
}

// 7. Generic Object
const genHTML = render({
  keyA: "valueA",
  keyB: "valueB"
})
if (!genHTML.includes("keyA") || !genHTML.includes("valueA") || !genHTML.includes("keyB") || !genHTML.includes("valueB")) {
  throw new Error(`Generic object test failed: ${genHTML}`)
}

console.log("All StoryValueRenderer unit tests PASSED successfully!")
export {}
