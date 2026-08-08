import { ProductionReadiness } from '../../types/report';

export function formatScore(score: number): string {
  return `${Math.round(score)}/100`;
}

export function formatScoreDelta(delta: number): string {
  const rounded = Math.round(delta);
  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return `${rounded}`;
  return '0';
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function severityToColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
    case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-200';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'LOW': return 'text-blue-600 bg-blue-100 border-blue-200';
    case 'INFORMATIONAL': return 'text-gray-600 bg-gray-100 border-gray-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
}

export function verdictToColor(verdict: string): string {
  switch (verdict.toUpperCase()) {
    case 'ACCEPT':
    case 'APPROVE':
      return 'text-green-600 bg-green-100 border-green-200';
    case 'CONDITIONAL_APPROVE':
    case 'IMPROVE':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'REJECT':
      return 'text-red-600 bg-red-100 border-red-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
}

export function riskLevelToColor(risk: string): string {
  switch (risk.toUpperCase()) {
    case 'LOW': return 'text-green-600 bg-green-100 border-green-200';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-200';
    case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
}

export function scoreToColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
  return 'text-red-600 bg-red-100 border-red-200';
}

export function likelihoodToAxis(likelihood: string): number {
  switch (likelihood.toUpperCase()) {
    case 'HIGH': return 4; // Or 5 depending on 1-5 scale representation
    case 'MEDIUM': return 3;
    case 'LOW': return 2;
    default: return 1;
  }
}

export function impactToAxis(impact: string): number {
  switch (impact.toUpperCase()) {
    case 'HIGH': return 4; // Or 5
    case 'MEDIUM': return 3;
    case 'LOW': return 2;
    default: return 1;
  }
}

export function formatProductionReadiness(pr: ProductionReadiness): string {
  return `${pr.indicator} ${pr.status}`;
}
