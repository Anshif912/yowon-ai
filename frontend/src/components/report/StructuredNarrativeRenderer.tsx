import React from 'react';
import { CheckCircle2, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface EvidenceItem {
  id: string;
  source: string;
  confidence: number;
  finding: string;
}

interface ReasoningSection {
  title?: string;
  summary?: string;
  executive_takeaway?: string;
  positive_findings?: string[];
  negative_findings?: string[];
  technical_observations?: string[];
  business_implications?: string[];
  deployment_readiness?: string;
  confidence?: string;
  recommended_actions?: string[];
  evidence?: EvidenceItem[];
  priority?: string;
}

interface Props {
  narrative: string;
  defaultTitle?: string;
}

export default function StructuredNarrativeRenderer({ narrative, defaultTitle = 'Intelligence Briefing' }: Props) {
  let data: ReasoningSection | null = null;
  let isJSON = false;

  try {
    if (narrative && (narrative.startsWith('{') || narrative.includes('{"') || narrative.includes('{"title"'))) {
      // Find JSON block if wrapped
      const start = narrative.indexOf('{');
      const end = narrative.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        data = JSON.parse(narrative.slice(start, end + 1));
        isJSON = true;
      }
    }
  } catch (e) {
    isJSON = false;
  }

  // Fallback rendering for plain text strings
  if (!isJSON || !data) {
    return (
      <p className="text-zinc-300 text-sm font-sans leading-relaxed">
        {narrative || 'Intelligence summary is currently unavailable.'}
      </p>
    );
  }

  const {
    title,
    summary,
    executive_takeaway,
    positive_findings = [],
    negative_findings = [],
    technical_observations = [],
    business_implications = [],
    deployment_readiness,
    confidence,
    recommended_actions = [],
    evidence = []
  } = data;

  return (
    <div className="space-y-6 text-zinc-100 select-text">
      
      {/* Dynamic Title if present */}
      {title && title !== defaultTitle && (
        <h4 className="text-lg font-bold font-display text-white border-b border-white/[0.04] pb-2 tracking-tight">
          {title}
        </h4>
      )}

      {/* Summary Narrative */}
      {summary && (
        <p className="text-zinc-300 text-sm font-sans leading-relaxed">
          {summary}
        </p>
      )}

      {/* Executive Takeaway */}
      {executive_takeaway && (
        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-xs font-sans leading-relaxed text-zinc-300 border-l-4 border-l-cyan-400">
          <span className="font-bold text-cyan-400 block mb-1 uppercase tracking-wider text-[10px] font-mono">Executive Takeaway</span>
          {executive_takeaway}
        </div>
      )}

      {/* Double Column Grid: Findings / Implications */}
      {(positive_findings.length > 0 || negative_findings.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Positive findings */}
          {positive_findings.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold block mb-2.5">Positive Indicators</span>
              <ul className="space-y-2 text-xs font-sans text-zinc-400">
                {positive_findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Negative findings */}
          {negative_findings.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-extrabold block mb-2.5">Risk Callouts</span>
              <ul className="space-y-2 text-xs font-sans text-zinc-400">
                {negative_findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Observations Grid */}
      {(technical_observations.length > 0 || business_implications.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/[0.04]">
          {/* Technical observations */}
          {technical_observations.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-extrabold block mb-2.5">Technical Observations</span>
              <ul className="space-y-2 text-xs font-sans text-zinc-400">
                {technical_observations.map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Business implications */}
          {business_implications.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-extrabold block mb-2.5">Business Implications</span>
              <ul className="space-y-2 text-xs font-sans text-zinc-400">
                {business_implications.map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Deployment Readiness & Confidence boxes */}
      {(deployment_readiness || confidence) && (
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/[0.04] text-xs font-mono select-none">
          {deployment_readiness && (
            <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Deployment Readiness</span>
              <span className="font-semibold text-zinc-200">{deployment_readiness}</span>
            </div>
          )}
          {confidence && (
            <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Confidence Rating</span>
              <span className="font-semibold text-cyan-400">{confidence}</span>
            </div>
          )}
        </div>
      )}

      {/* Recommended Actions checklist */}
      {recommended_actions.length > 0 && (
        <div className="pt-3 border-t border-white/[0.04]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block mb-3">Recommended Actions</span>
          <div className="space-y-2">
            {recommended_actions.map((act, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/40 text-xs text-zinc-300">
                <input type="checkbox" className="mt-0.5 accent-cyan-500 shrink-0 pointer-events-none" checked={false} readOnly />
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citations Grounding Tags */}
      {evidence.length > 0 && (
        <div className="pt-4 border-t border-white/[0.04] select-none">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-bold">Citations & Grounding Sources</span>
          <div className="flex flex-wrap gap-2">
            {evidence.map((ev, i) => (
              <div
                key={i}
                title={`Finding: "${ev.finding}" (Confidence: ${Math.round(ev.confidence * 100)}%)`}
                className="group relative px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors cursor-help flex items-center gap-1.5"
              >
                <BookOpen size={10} className="text-zinc-500 group-hover:text-cyan-400" />
                <span>{ev.source} ({ev.id})</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
