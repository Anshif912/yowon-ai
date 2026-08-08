/**
 * useEvaluationLock.ts
 * Manages evaluation focus mode: prevents navigation while an evaluation runs.
 * Persists lock state in localStorage for cross-refresh resilience.
 */
import { useState, useEffect, useCallback } from 'react'

const LOCK_KEY = 'yowon_active_evaluation'
const STAGE_KEY = 'yowon_eval_stage'
const PROGRESS_KEY = 'yowon_eval_progress'

export interface EvaluationLockState {
  isLocked: boolean
  activeEvaluationId: string | null
  currentStage: string
  progress: number
  unlock: () => void
  setLock: (evaluationId: string, stage?: string, progress?: number) => void
  updateProgress: (stage: string, progress: number) => void
}

export function useEvaluationLock(): EvaluationLockState {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | null>(
    () => localStorage.getItem(LOCK_KEY)
  )
  const [currentStage, setCurrentStage] = useState<string>(
    () => localStorage.getItem(STAGE_KEY) || 'Initializing...'
  )
  const [progress, setProgress] = useState<number>(
    () => Number(localStorage.getItem(PROGRESS_KEY)) || 0
  )

  const setLock = useCallback((evaluationId: string, stage = 'Initializing...', prog = 0) => {
    localStorage.setItem(LOCK_KEY, evaluationId)
    localStorage.setItem(STAGE_KEY, stage)
    localStorage.setItem(PROGRESS_KEY, String(prog))
    setActiveEvaluationId(evaluationId)
    setCurrentStage(stage)
    setProgress(prog)
    window.dispatchEvent(new Event('yowon_evaluation_lock_changed'))
  }, [])

  const unlock = useCallback(() => {
    localStorage.removeItem(LOCK_KEY)
    localStorage.removeItem(STAGE_KEY)
    localStorage.removeItem(PROGRESS_KEY)
    setActiveEvaluationId(null)
    setCurrentStage('')
    setProgress(0)
    window.dispatchEvent(new Event('yowon_evaluation_lock_changed'))
  }, [])

  const updateProgress = useCallback((stage: string, prog: number) => {
    localStorage.setItem(STAGE_KEY, stage)
    localStorage.setItem(PROGRESS_KEY, String(prog))
    setCurrentStage(stage)
    setProgress(prog)
    window.dispatchEvent(new Event('yowon_evaluation_lock_changed'))
  }, [])

  // Sync across browser tabs and same-tab component instances
  useEffect(() => {
    const handleSync = () => {
      setActiveEvaluationId(localStorage.getItem(LOCK_KEY))
      setCurrentStage(localStorage.getItem(STAGE_KEY) || 'Initializing...')
      setProgress(Number(localStorage.getItem(PROGRESS_KEY)) || 0)
    }
    
    window.addEventListener('storage', handleSync)
    window.addEventListener('yowon_evaluation_lock_changed', handleSync)
    
    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('yowon_evaluation_lock_changed', handleSync)
    }
  }, [])

  return {
    isLocked: !!activeEvaluationId,
    activeEvaluationId,
    currentStage,
    progress,
    unlock,
    setLock,
    updateProgress,
  }
}
