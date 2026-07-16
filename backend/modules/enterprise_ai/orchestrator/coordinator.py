import logging
from typing import Dict, Any, List
from modules.enterprise_ai.planner.logical_planner import LogicalPlanner
from modules.enterprise_ai.tools.registry import tool_registry

logger = logging.getLogger("yowon.ai.coordinator")

class AICoordinator:
    def __init__(self):
        self.planner = LogicalPlanner()

    async def coordinate_execution(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrates query parsing, step planning, tool calls, and final summary generation."""
        tools_metadata = tool_registry.list_tools()
        plan = self.planner.create_plan(query, tools_metadata)
        
        logger.info(f"Generated plan for query: {query} with {len(plan['steps'])} steps.")
        
        results = []
        for step in plan["steps"]:
            tool_name = step["tool"]
            tool_obj = tool_registry.get_tool(tool_name)
            
            if tool_obj:
                try:
                    logger.info(f"Executing step {step['step_id']} using tool: {tool_name}")
                    res = await tool_obj.execute({"query": query}, context)
                    results.append({
                        "step_id": step["step_id"],
                        "tool": tool_name,
                        "status": "success",
                        "output": res
                    })
                except Exception as e:
                    logger.error(f"Step {step['step_id']} execution failed: {e}")
                    results.append({
                        "step_id": step["step_id"],
                        "tool": tool_name,
                        "status": "failed",
                        "error": str(e)
                    })
            else:
                results.append({
                    "step_id": step["step_id"],
                    "tool": tool_name,
                    "status": "not_implemented",
                    "output": {"summary": f"Tool {tool_name} was invoked but not registered in this sandbox environment."}
                })

        return {
            "query": query,
            "plan": plan,
            "executions": results,
            "status": "completed"
        }
