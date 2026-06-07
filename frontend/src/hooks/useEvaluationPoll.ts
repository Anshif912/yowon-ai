import { useEffect, useState } from 'react'
import { getStatus } from '../api/api'
import type { ProjectStatus } from '../types'

export function useEvaluationPoll(
  projectId: string | undefined,
  onComplete?: (id: string) => void,
) {
  const [status, setStatus] = useState<ProjectStatus>('running')
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    if (!projectId) return

    let cancelled = false
    let terminal = false

    const poll = async () => {
      try {
        if (terminal) return
        const data = await getStatus(projectId)
        if (cancelled) return
        setStatus(data.status as ProjectStatus)
        setProjectName(data.name)
        if (data.status === 'done') {
          terminal = true
          onComplete?.(projectId)
        }
        if (data.status === 'failed') terminal = true
      } catch {
        /* retry on next interval */
      }
    }

    poll()
    const interval = setInterval(poll, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [projectId, onComplete])

  return { status, projectName }
}
