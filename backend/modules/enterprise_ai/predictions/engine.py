import math
from typing import Dict, Any, List

class PredictionsEngine:
    def calculate_technical_debt(self, codebase_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Projects technical debt ratio and remediation effort from codebase metrics."""
        loc = codebase_metrics.get("lines_of_code", 1000)
        duplication = codebase_metrics.get("code_duplication_percentage", 5.0)
        coverage = codebase_metrics.get("test_coverage_percentage", 80.0)
        complexity = codebase_metrics.get("cyclomatic_complexity", 10.0)

        # Heuristics formulas
        debt_hours = (loc * 0.01) * (duplication / 5.0) + (100.0 - coverage) * 0.5 + (complexity * 2.0)
        remediation_cost_usd = debt_hours * 85.0  # $85/hr standard dev cost
        
        # Debt ratio relative to build cost (LOC * $15/LOC estimated build cost)
        estimated_build_cost = loc * 15.0
        debt_ratio = (remediation_cost_usd / estimated_build_cost) * 100.0 if estimated_build_cost > 0 else 0.0

        return {
            "debt_hours": round(debt_hours, 1),
            "remediation_cost_usd": round(remediation_cost_usd, 2),
            "debt_ratio_percentage": min(round(debt_ratio, 2), 100.0),
            "maintenance_index": max(round(100.0 - debt_ratio * 0.5, 1), 10.0)
        }

    def predict_readiness_score(self, project_dna: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates project release readiness score out of 100 based on DNA completeness."""
        checks = [
            project_dna.get("has_readme", True),
            project_dna.get("has_tests", True),
            project_dna.get("has_ci", False),
            project_dna.get("has_dockerfile", False),
            project_dna.get("has_license", True)
        ]
        
        passed_count = sum(1 for c in checks if c)
        base_score = (passed_count / len(checks)) * 100.0
        
        # Adjust score based on open issues and vulnerabilities
        vulnerabilities = project_dna.get("vulnerability_count", 0)
        penalty = min(vulnerabilities * 5.0, 30.0)
        final_score = max(base_score - penalty, 0.0)

        return {
            "readiness_score": round(final_score, 1),
            "status": "RELEASE_READY" if final_score >= 80.0 else "REVIEW_REQUIRED" if final_score >= 50.0 else "UNREADY",
            "vulnerabilities_penalty": penalty
        }
