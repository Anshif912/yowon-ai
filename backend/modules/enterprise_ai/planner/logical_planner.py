from typing import List, Dict, Any

class LogicalPlanner:
    def create_plan(self, query: str, available_tools: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generates a task execution breakdown plan tree based on available tools."""
        # Simple logical planning heuristic matching tools to keywords
        plan_steps = []
        lowered_query = query.lower()

        if "predict" in lowered_query or "readiness" in lowered_query or "debt" in lowered_query:
            plan_steps.append({
                "step_id": 1,
                "tool": "predictions_tool",
                "purpose": "Analyze codebase readiness and predict technical debt values.",
                "depends_on": []
            })
        if "twin" in lowered_query or "simulation" in lowered_query:
            plan_steps.append({
                "step_id": 2,
                "tool": "digital_twin_tool",
                "purpose": "Simulate organizational processes and run workflow twin runs.",
                "depends_on": [1] if plan_steps else []
            })
        if "search" in lowered_query or "knowledge" in lowered_query or "log" in lowered_query:
            plan_steps.append({
                "step_id": 3,
                "tool": "knowledge_tool",
                "purpose": "Fetch enterprise knowledge repository matching query.",
                "depends_on": []
            })

        # Default fallback step if no keyword matches
        if not plan_steps:
            plan_steps.append({
                "step_id": 1,
                "tool": "copilot_general_tool",
                "purpose": "Analyze general workspace request.",
                "depends_on": []
            })

        return {
            "query": query,
            "steps": plan_steps,
            "is_achievable": True
        }
