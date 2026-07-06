from typing import Dict, Any, List
from intelligence.models import GraphNode, GraphEdge
from intelligence.graph.base_builder import BaseGraphBuilder

class DependencyGraphBuilder(BaseGraphBuilder):
    def build(self, dependencies: Any, project_name: str) -> None:
        """Constructs Dependency Graph listing package ecosystem dependencies."""
        self.nodes = []
        self.edges = []

        # Convert dependencies to a unified dict format
        deps_dict: Dict[str, str] = {}
        if isinstance(dependencies, dict):
            for k, v in dependencies.items():
                deps_dict[str(k)] = str(v) if v is not None else ""
        elif isinstance(dependencies, list):
            for item in dependencies:
                if isinstance(item, dict):
                    name = item.get("name")
                    version = item.get("version") or ""
                    if name:
                        deps_dict[str(name)] = str(version)
                elif isinstance(item, str):
                    deps_dict[item] = ""

        # 1. Main project node
        root_id = "project"
        self.nodes.append(GraphNode(
            id=root_id,
            label=project_name,
            type="project",
            metadata={"description": "Target codebase"}
        ))

        # 2. Package nodes
        for dep_name, version in deps_dict.items():
            dep_id = f"dep_{dep_name.lower().replace('-', '_')}"
            self.nodes.append(GraphNode(
                id=dep_id,
                label=f"{dep_name}@{version}" if version else dep_name,
                type="dependency",
                metadata={"version": version}
            ))
            # Link root project to each dependency
            self.edges.append(GraphEdge(
                source=root_id,
                target=dep_id,
                label="requires"
            ))

            # Add typical dependency relationships (heuristics)
            if "langchain" in dep_name.lower() and any("pydantic" in d for d in deps_dict):
                pydantic_id = next(f"dep_{d.lower().replace('-', '_')}" for d in deps_dict if "pydantic" in d)
                self.edges.append(GraphEdge(
                    source=dep_id,
                    target=pydantic_id,
                    label="depends on"
                ))
