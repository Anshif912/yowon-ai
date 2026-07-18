import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  projectId: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class StoryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error("[StoryErrorBoundary] Caught render execution error:", error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render() {
    if (this.state.hasError) {
      // Mock correlation id for developer trace mapping
      const correlationId = `corr-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      const apiPath = `/api/v1/evaluations/${this.props.projectId}/repository-story`
      
      // Deduce diagnostic metadata from the exception
      let expectedType = 'string | array | object (validated)'
      let receivedType = 'unknown'
      let failedField = 'unknown'
      
      const errMsg = this.state.error?.message || ''
      if (errMsg.includes('React child')) {
        receivedType = 'Object (raw JavaScript object)'
        expectedType = 'string | number | boolean | ReactElement'
        // Inspect error message for keys hint
        if (errMsg.includes('keys')) {
          const keysMatch = errMsg.match(/keys \{([^}]+)\}/)
          failedField = keysMatch ? `Object containing keys: { ${keysMatch[1]} }` : 'Structured metadata object'
        }
      }

      return (
        <div className="glass-card p-6 border border-red-500/25 bg-red-950/10 rounded-2xl space-y-4 font-mono text-[10px] text-zinc-300">
          <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
            <h3 className="text-red-400 font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Repository Story Panel Failed
            </h3>
            <span className="text-[9px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase">
              Render Isolation Exception
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/30 p-4 rounded-xl border border-white/[0.04] text-[9.5px] space-y-2 md:space-y-0">
            <div className="space-y-1.5">
              <div>
                <span className="text-zinc-500 block uppercase">Panel Name:</span>
                <span className="text-white font-bold">Repository Story Panel</span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase">API Endpoint:</span>
                <span className="text-cyan-400 font-bold">{apiPath}</span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase">Correlation ID:</span>
                <span className="text-yellow-400 font-bold">{correlationId}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="text-zinc-500 block uppercase">Failed Field / Structure:</span>
                <span className="text-red-400 font-bold">{failedField}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-zinc-500 block uppercase">Expected Type:</span>
                  <span className="text-emerald-400">{expectedType}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase">Received Type:</span>
                  <span className="text-red-400">{receivedType}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-zinc-500 block uppercase">Stack Trace / Developer Diagnostics:</span>
            <pre className="p-3.5 bg-black/40 rounded-xl border border-white/5 text-zinc-400 overflow-auto max-h-48 whitespace-pre text-[9px] leading-relaxed">
              {this.state.error?.stack || this.state.error?.message || 'No stack trace captured.'}
            </pre>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-300 border border-red-500/30 transition-all font-bold"
            >
              Reset Panel State
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
export default StoryErrorBoundary
