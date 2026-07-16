from typing import Dict, List, Optional
from modules.enterprise_ai.tools.base import BaseTool

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register_tool(self, tool: BaseTool) -> None:
        self._tools[tool.name.lower()] = tool

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name.lower())

    def list_tools(self) -> List[Dict[str, str]]:
        return [
            {"name": tool.name, "description": tool.description}
            for tool in self._tools.values()
        ]

# Global registry instance
tool_registry = ToolRegistry()
