import { useMemo } from 'react'
import { useAuth } from '../components/auth/AuthContext'

export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 5,
  ORG_OWNER: 4,
  WORKSPACE_ADMIN: 3,
  SECURITY_ENGINEER: 3,
  TEAM_LEADER: 2,
  PROJECT_OWNER: 2,
  DEVELOPER: 2,
  TEAM_MEMBER: 2,
  JUDGE: 2,
  REVIEWER: 2,
  EVALUATOR: 2,
  GUEST: 1,
  VIEWER: 1,
}

// Normalized Role Groups
export const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN', 'PLATFORM OWNER', 'ORGANIZATION ADMIN', 'ADMIN']
export const SECURITY_ROLES = [...ADMIN_ROLES, 'SECURITY_ENGINEER', 'SECURITY ENGINEER']
export const EVALUATOR_ROLES = [...ADMIN_ROLES, 'JUDGE', 'REVIEWER', 'EVALUATOR']

export function useRole() {
  const { user } = useAuth()

  const currentRole = useMemo(() => {
    return (user?.role || '').trim().toUpperCase()
  }, [user?.role])

  const roleLevel = useMemo(() => {
    return ROLE_HIERARCHY[currentRole] || 1
  }, [currentRole])

  const hasRole = (allowedRoles: string[]): boolean => {
    if (!user) return false
    const userRoleClean = currentRole
    const userRoleRaw = (user.role || '').trim().toLowerCase()

    return allowedRoles.some((role) => {
      const target = role.trim().toUpperCase()
      const targetLower = role.trim().toLowerCase()
      if (userRoleClean === target || userRoleRaw === targetLower) return true

      if (target === 'ADMIN' && ADMIN_ROLES.includes(userRoleClean)) return true
      if (target === 'SECURITY' && SECURITY_ROLES.includes(userRoleClean)) return true
      if (target === 'EVALUATOR' && EVALUATOR_ROLES.includes(userRoleClean)) return true

      return false
    })
  }

  const isAdmin = useMemo(() => {
    return ADMIN_ROLES.includes(currentRole)
  }, [currentRole])

  const isOwner = useMemo(() => {
    return ['SUPER_ADMIN', 'ORG_OWNER', 'PLATFORM OWNER'].includes(currentRole)
  }, [currentRole])

  const canManageUsers = useMemo(() => {
    return ADMIN_ROLES.includes(currentRole)
  }, [currentRole])

  const canManageVault = useMemo(() => {
    return SECURITY_ROLES.includes(currentRole)
  }, [currentRole])

  return {
    user,
    currentRole,
    roleLevel,
    hasRole,
    isAdmin,
    isOwner,
    canManageUsers,
    canManageVault,
  }
}
