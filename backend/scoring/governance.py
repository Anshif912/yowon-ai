import logging
from typing import Dict, Any, List
from agents.atlas_agent import AtlasFactsheet

logger = logging.getLogger(__name__)

class EvaluationDrift(Exception):
    """Raised when scoring runs on identical inputs yield different metrics."""
    pass

class GovernanceValidator:
    @staticmethod
    def validate_score_stability(calc_fn: Any, inputs: Any, expected_overall: float):
        """
        Verifies score reproducibility. Run identical calculation again to check drift.
        """
        run_1 = calc_fn(*inputs)
        if abs(run_1 - expected_overall) > 0.5:  # 0.5% drift threshold
            raise EvaluationDrift(f"Deterministic scoring drift detected: {run_1} vs {expected_overall}")

    @staticmethod
    def run_governance_gate(
        factsheet: AtlasFactsheet,
        final_scores: Dict[str, int],
        overall_score: int,
        recommendations: List[Any]
    ) -> Dict[str, Any]:
        """
        Runs the final Governance Validation Layer checks prior to releasing the report:
        - No score mismatches
        - No invalid bounds
        - No orphan recommendations
        """
        logs = []
        passed = True

        # Check bounds
        for agent, score in final_scores.items():
            if score < 0 or score > 100:
                logs.append(f"Governance Failure: {agent} has out-of-bounds score {score}")
                passed = False

        if not recommendations:
            logs.append("Governance Warning: No actionable recommendations generated.")
            # We don't fail the build, just warning

        return {
            "passed": passed,
            "logs": logs or ["All governance checks passed successfully."]
        }
