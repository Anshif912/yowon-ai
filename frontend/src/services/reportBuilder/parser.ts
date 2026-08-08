import { ReportData, VerdictData, AgentScores, Evaluation } from '../../types';

export interface ParsedPayload {
  projectId: string;
  projectName: string;
  projectType: string;
  status: string;
  overallScore: number;
  verdict: string;
  evaluations: Record<string, Evaluation>;
  verdictData: Partial<VerdictData>;
  agentScores: Record<string, number>;
}

export function parseReportData(raw: ReportData): ParsedPayload {
  const chief = raw.evaluations?.yowon_prime ?? raw.evaluations?.chief_evaluation;
  
  let verdictData: Partial<VerdictData> = {};
  if (raw.verdict_data) {
    verdictData = raw.verdict_data as Partial<VerdictData>;
  } else if (chief?.findings) {
    try {
      const match = chief.findings.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        verdictData = JSON.parse(match[1]);
      } else {
        const braceMatch = chief.findings.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          verdictData = JSON.parse(braceMatch[0]);
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  const rawScores: AgentScores = verdictData.agent_scores || {};
  const evals = raw.evaluations || {};

  // Normalize agent scores
  const agentScores: Record<string, number> = {
    forge: rawScores.forge ?? rawScores.technical ?? rawScores.engineering ?? evals.forge?.score ?? evals.technical?.score ?? 0,
    sentinel: rawScores.sentinel ?? rawScores.security ?? evals.sentinel?.score ?? evals.security?.score ?? 0,
    guardian: rawScores.guardian ?? rawScores.impact ?? rawScores.risk_impact ?? evals.guardian?.score ?? evals.impact?.score ?? 0,
    visionary: rawScores.visionary ?? rawScores.innovation ?? rawScores.innovation_scalability ?? evals.visionary?.score ?? evals.innovation?.score ?? 0,
    prime: evals.yowon_prime?.score ?? evals.chief_evaluation?.score ?? 0,
    showcase: rawScores.showcase ?? rawScores.presentation ?? rawScores.ppt ?? evals.showcase?.score ?? evals.presentation?.score ?? 0,
  };

  return {
    projectId: raw.project_id || '',
    projectName: raw.project_name || 'Unknown Project',
    projectType: (raw.project_type || verdictData.project_type || verdictData.submitted_project_type || 'Unknown').toString(),
    status: raw.status || 'unknown',
    overallScore: raw.overall_score ?? verdictData.overall_score ?? 0,
    verdict: (raw.verdict || verdictData.verdict || 'UNKNOWN').toString(),
    evaluations: evals,
    verdictData: verdictData,
    agentScores,
  };
}
