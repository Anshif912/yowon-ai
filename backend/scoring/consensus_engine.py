import logging
from typing import Dict, List, Any
from crew.debate_engine import SpecialistInitialEvaluation, Criticism, DebateSession

logger = logging.getLogger(__name__)

class ConsensusResolutionEngine:
    def __init__(self, initial_evals: Dict[str, SpecialistInitialEvaluation], debate_session: DebateSession):
        self.initial_evals = initial_evals
        self.debate_session = debate_session

    def resolve_consensus(self) -> Dict[str, Any]:
        """
        Deterministically resolves debates and calculates adjusted final scores by applying accepted criticisms.
        """
        final_scores: Dict[str, float] = {}
        penalties_log: Dict[str, List[Dict[str, Any]]] = {}

        # 1. Initialize adjusted scores with initial specialist scores
        for name, ev in self.initial_evals.items():
            final_scores[name] = float(ev.initial_score)
            penalties_log[name] = []

        # 2. Reconcile criticisms from all debate rounds
        for round_data in self.debate_session.rounds:
            for crit in round_data.criticisms:
                if crit.status in ("Accepted", "Partially Accepted"):
                    # Calculate penalty dynamically based on severity and agent confidence weights
                    severity_weight = {
                        "CRITICAL": 8.0,
                        "HIGH": 5.0,
                        "MEDIUM": 3.0,
                        "LOW": 1.0
                    }.get(crit.severity.upper(), 2.0)

                    # Penalty scale factor = Author Confidence / Target Confidence
                    author_conf = self.initial_evals.get(crit.author, SpecialistInitialEvaluation(initial_score=70)).engineering_confidence
                    target_conf = self.initial_evals.get(crit.target, SpecialistInitialEvaluation(initial_score=70)).engineering_confidence
                    
                    confidence_factor = author_conf / max(0.1, target_conf)
                    raw_penalty = severity_weight * confidence_factor
                    
                    # Partially accepted criticisms have 50% penalty
                    if crit.status == "Partially Accepted":
                        raw_penalty *= 0.5

                    # Clamp penalty limit
                    penalty = min(15.0, max(0.5, round(raw_penalty, 2)))

                    # Apply penalty
                    final_scores[crit.target] = max(0.0, final_scores[crit.target] - penalty)
                    
                    penalties_log[crit.target].append({
                        "round": round_data.round_number,
                        "author": crit.author,
                        "category": crit.category,
                        "severity": crit.severity,
                        "penalty": penalty,
                        "evidence": crit.repository_evidence,
                        "paths": crit.repository_paths
                    })

        # 3. Format result
        consensus_outcome = {
            "final_scores": {k: int(round(v)) for k, v in final_scores.items()},
            "penalties": penalties_log
        }
        return consensus_outcome
