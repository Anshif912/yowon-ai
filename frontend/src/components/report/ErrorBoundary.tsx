import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  name: string
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Error in ${this.props.name}:`, error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card p-6 border border-red-500/20 bg-red-950/10 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-red-400 font-display font-semibold">{this.props.name} Load Failed</h3>
            <span className="text-xs font-mono text-red-500/80 uppercase">Error Isolation Boundary</span>
          </div>
          <p className="text-sm text-yowon-muted font-mono bg-black/20 p-3 rounded border border-white/5 max-h-24 overflow-auto">
            {this.state.error?.message || 'Unknown render exception'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 font-mono text-xs border border-red-500/30 transition-all"
            >
              Retry Panel
            </button>
            {this.state.error?.stack && (
              <button
                onClick={() => {
                  const blob = new Blob([this.state.error?.stack || ''], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${this.props.name.toLowerCase().replace(/\s+/g, '_')}_error_log.txt`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-yowon-muted font-mono text-xs border border-white/10 transition-all"
              >
                Download Logs
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface PanelErrorFallbackProps {
  name: string
  error?: any
  refetch: () => void
}

export function PanelErrorFallback({ name, error, refetch }: PanelErrorFallbackProps) {
  return (
    <div className="glass-card p-6 border border-red-500/20 bg-red-950/5 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-red-400 font-display font-semibold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {name} Data Failed
        </h3>
        <span className="text-[10px] font-mono text-red-500/80 uppercase">API Error</span>
      </div>
      <p className="text-xs text-yowon-muted font-mono bg-black/20 p-3 rounded border border-white/5 max-h-24 overflow-auto">
        {error?.response?.data?.detail || error?.message || 'Failed to fetch panel intelligence data.'}
      </p>
      <div>
        <button
          onClick={refetch}
          className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/25 text-red-300 font-mono text-xs border border-red-500/20 flex items-center gap-1.5 transition-all"
        >
          Retry Load
        </button>
      </div>
    </div>
  )
}

