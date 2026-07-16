import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../../api/api'
import { useAuth } from './AuthContext'

export interface WorkspaceProfile {
  workspace_id: string
  organization_id: string | null
  name: string
  description: string | null
  type: 'PERSONAL' | 'HACKATHON' | 'UNIVERSITY' | 'RESEARCH' | 'COMPANY' | 'STARTUP'
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
  owner_id: string | null
  preferences: string | null
  created_at: string
}

interface WorkspaceContextType {
  workspaces: WorkspaceProfile[]
  currentWorkspace: WorkspaceProfile | null
  loading: boolean
  fetchWorkspaces: () => Promise<WorkspaceProfile[]>
  selectWorkspace: (workspaceId: string) => void
  createWorkspace: (name: string, type: string, visibility: string, organizationId?: string) => Promise<WorkspaceProfile>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

// Inject X-Workspace-ID header into axios requests
api.interceptors.request.use((config) => {
  const activeWorkspaceId = localStorage.getItem('yowon_active_workspace_id')
  if (activeWorkspaceId) {
    config.headers['X-Workspace-ID'] = activeWorkspaceId
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [workspaces, setWorkspaces] = useState<WorkspaceProfile[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchWorkspaces = useCallback(async (): Promise<WorkspaceProfile[]> => {
    if (!isAuthenticated) return []
    setLoading(true)
    try {
      const res = await api.get('/workspaces')
      const list: WorkspaceProfile[] = res.data
      setWorkspaces(list)

      // Auto-restore selected workspace from localStorage
      const savedId = localStorage.getItem('yowon_active_workspace_id')
      const match = list.find(w => w.workspace_id === savedId) || list.find(w => w.type === 'PERSONAL') || list[0] || null
      
      if (match) {
        setCurrentWorkspace(match)
        localStorage.setItem('yowon_active_workspace_id', match.workspace_id)
      } else {
        setCurrentWorkspace(null)
      }
      return list
    } catch (err) {
      console.error('[Workspace] Failed to fetch workspaces', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces()
    } else {
      setWorkspaces([])
      setCurrentWorkspace(null)
      localStorage.removeItem('yowon_active_workspace_id')
    }
  }, [isAuthenticated, fetchWorkspaces])

  const selectWorkspace = (workspaceId: string) => {
    const match = workspaces.find(w => w.workspace_id === workspaceId)
    if (match) {
      setCurrentWorkspace(match)
      localStorage.setItem('yowon_active_workspace_id', match.workspace_id)
      // Dispatch custom event to notify components to reload scoped views
      window.dispatchEvent(new CustomEvent('workspace-changed', { detail: match }))
    }
  }

  const createWorkspace = async (
    name: string, type: string, visibility: string, organizationId?: string
  ): Promise<WorkspaceProfile> => {
    try {
      const res = await api.post('/workspaces', {
        name,
        type,
        visibility,
        organization_id: organizationId || null
      })
      const newWs: WorkspaceProfile = res.data
      await fetchWorkspaces()
      // Select the newly created workspace
      selectWorkspace(newWs.workspace_id)
      return newWs
    } catch (err) {
      console.error('[Workspace] Creation failed', err)
      throw err
    }
  }

  const value = {
    workspaces,
    currentWorkspace,
    loading,
    fetchWorkspaces,
    selectWorkspace,
    createWorkspace
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
