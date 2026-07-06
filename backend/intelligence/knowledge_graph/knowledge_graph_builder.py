import re
import yaml
import json
from typing import Dict, List, Any, Set, Tuple
from intelligence.models import SymbolRecord, EvidenceRecord, RecommendationRecord

class KnowledgeGraphBuilder:
    def __init__(self):
        self.nodes: List[Dict[str, Any]] = []
        self.edges: List[Dict[str, Any]] = []
        self.node_ids: Set[str] = set()

    def add_node(self, node_id: str, label: str, node_type: str, metadata: Dict[str, Any] = None) -> None:
        clean_id = node_id.strip()
        if not clean_id or clean_id in self.node_ids:
            return
        self.node_ids.add(clean_id)
        self.nodes.append({
            "id": clean_id,
            "label": label.strip(),
            "type": node_type,
            "metadata": metadata or {}
        })

    def add_edge(self, source: str, target: str, relation: str) -> None:
        src = source.strip()
        tgt = target.strip()
        if src in self.node_ids and tgt in self.node_ids and src != tgt:
            # Prevent duplicate edges
            edge_exists = any(
                e["source"] == src and e["target"] == tgt and e["relation"] == relation
                for e in self.edges
            )
            if not edge_exists:
                self.edges.append({
                    "source": src,
                    "target": tgt,
                    "relation": relation
                })

    def build_graph(
        self,
        files: List[str],
        file_contents: Dict[str, str],
        symbols: List[SymbolRecord],
        evidence: List[Any] = None,
        recommendations: List[Any] = None
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        self.nodes.clear()
        self.edges.clear()
        self.node_ids.clear()

        evidence_list = evidence or []
        rec_list = recommendations or []

        # Map files to their evidence and recommendations
        file_evidence: Dict[str, List[Dict[str, Any]]] = {}
        for ev in evidence_list:
            fpath = ev.get("file_path") or ""
            if fpath:
                if fpath not in file_evidence:
                    file_evidence[fpath] = []
                file_evidence[fpath].append(ev)

        file_recs: Dict[str, List[Dict[str, Any]]] = {}
        for rec in rec_list:
            for fpath in rec.get("affected_files", []):
                if fpath not in file_recs:
                    file_recs[fpath] = []
                file_recs[fpath].append(rec)

        # 1. ADD FILE NODES
        for fpath in files:
            ext = fpath.split(".")[-1].lower() if "." in fpath else ""
            # Determine architecture layer
            layer = "unknown"
            if "frontend" in fpath or "/src" in fpath and ext in ("ts", "tsx", "js", "jsx"):
                layer = "frontend"
            elif "backend" in fpath or ext == "py":
                layer = "backend"
                if "database" in fpath or "models" in fpath:
                    layer = "database"
            
            f_ev = file_evidence.get(fpath, [])
            f_rec = file_recs.get(fpath, [])
            
            metadata = {
                "layer": layer,
                "language": ext,
                "metrics": {"loc": len(file_contents.get(fpath, "").splitlines())},
                "evidence": f_ev,
                "recommendations": f_rec,
                "description": f"Source file containing {ext.upper()} code."
            }
            self.add_node(node_id=fpath, label=fpath.split("/")[-1], node_type="file", metadata=metadata)

        # 2. ADD CLASS, FUNCTION, DB MODEL, AND API NODES FROM SYMBOLS
        class_by_name: Dict[str, str] = {} # class name -> file_path
        
        for sym in symbols:
            fpath = sym.file_path
            sym_id = f"{fpath}::{sym.name}"
            
            # Map type
            ntype = "function"
            if sym.type == "class":
                ntype = "class"
                class_by_name[sym.name] = fpath
            elif sym.type == "model" or "model" in sym.name.lower() or "Model" in sym.name:
                ntype = "model"
            elif sym.type in ("route", "api") or sym.name.startswith("get_") or sym.name.startswith("post_"):
                # Potential API
                ntype = "api"

            metadata = {
                "file_path": fpath,
                "line_start": sym.line_start,
                "line_end": sym.line_end,
                "description": f"AST symbol representing a {ntype} defined in {fpath.split('/')[-1]}."
            }
            
            self.add_node(node_id=sym_id, label=sym.name, node_type=ntype, metadata=metadata)
            # Link symbol to its file container
            self.add_edge(source=fpath, target=sym_id, relation="DEPENDS_ON")

        # 3. ENVIRONMENT VARIABLES (Scanning file contents)
        env_vars_detected: Set[str] = set()
        env_var_pattern = re.compile(r'(?:os\.environ\.get|os\.getenv)\(\s*["\']([A-Z0-9_]+)["\']')
        
        for fpath, content in file_contents.items():
            matches = env_var_pattern.findall(content)
            for var in matches:
                env_vars_detected.add(var)
                var_id = f"env::{var}"
                self.add_node(node_id=var_id, label=var, node_type="env_var", metadata={"description": f"Environment variable used in {fpath}."})
                self.add_edge(source=fpath, target=var_id, relation="USES")

        # 4. EXTERNAL LIBRARIES (Parsing requirements.txt and package.json)
        libraries_detected: Set[str] = set()
        for fpath, content in file_contents.items():
            if fpath.endswith("requirements.txt"):
                for line in content.splitlines():
                    clean_line = line.strip().split("==")[0].split(">=")[0].strip()
                    if clean_line and not clean_line.startswith("#"):
                        libraries_detected.add(clean_line)
                        lib_id = f"lib::{clean_line}"
                        self.add_node(node_id=lib_id, label=clean_line, node_type="library", metadata={"description": "External Python dependency."})
                        self.add_edge(source=fpath, target=lib_id, relation="DEPENDS_ON")
            elif fpath.endswith("package.json"):
                try:
                    pjson = json.loads(content)
                    deps = {**pjson.get("dependencies", {}), **pjson.get("devDependencies", {})}
                    for lib in deps:
                        libraries_detected.add(lib)
                        lib_id = f"lib::{lib}"
                        self.add_node(node_id=lib_id, label=lib, node_type="library", metadata={"description": "External Node.js package."})
                        self.add_edge(source=fpath, target=lib_id, relation="DEPENDS_ON")
                except Exception:
                    pass

        # 5. DOCKER SERVICES (Parsing docker-compose.yml)
        for fpath, content in file_contents.items():
            if "docker-compose" in fpath or fpath.endswith("docker-compose.yml"):
                try:
                    compose = yaml.safe_load(content)
                    services = compose.get("services", {})
                    for sname, sconfig in services.items():
                        service_id = f"docker::{sname}"
                        self.add_node(node_id=service_id, label=sname, node_type="docker_service", metadata={
                            "image": sconfig.get("image", "custom build"),
                            "ports": sconfig.get("ports", []),
                            "description": f"Docker microservice container: {sname}."
                        })
                        self.add_edge(source=fpath, target=service_id, relation="GENERATES")
                except Exception:
                    pass

        # 6. EDGES & RELATIONS
        # IMPORTS / CALLS from AST symbol relationships
        for sym in symbols:
            fpath = sym.file_path
            sym_id = f"{fpath}::{sym.name}"
            
            # Extract inheritances
            for rel in sym.relationships:
                rel_type = rel.get("type", "")
                target_name = rel.get("target", "")
                
                # Check if it targets another known symbol
                for other in symbols:
                    if other.name == target_name:
                        other_id = f"{other.file_path}::{other.name}"
                        if rel_type == "calls":
                            self.add_edge(source=sym_id, target=other_id, relation="CALLS")
                        elif rel_type == "inherits":
                            self.add_edge(source=sym_id, target=other_id, relation="INHERITS")
                        elif rel_type == "implements":
                            self.add_edge(source=sym_id, target=other_id, relation="IMPLEMENTS")
                        elif rel_type == "uses":
                            self.add_edge(source=sym_id, target=other_id, relation="USES")

        # Generic File Imports Edges (Parsing standard python/JS imports)
        import_pattern = re.compile(r'^(?:import|from)\s+([a-zA-Z0-9_]+)', re.MULTILINE)
        js_import_pattern = re.compile(r'import\s+.*\s+from\s+["\'](.*)["\']')
        
        for fpath, content in file_contents.items():
            ext = fpath.split(".")[-1].lower() if "." in fpath else ""
            if ext == "py":
                imports = import_pattern.findall(content)
                for imp in imports:
                    # If this import matches a library name, link it
                    if imp in libraries_detected:
                        self.add_edge(source=fpath, target=f"lib::{imp}", relation="USES")
            elif ext in ("js", "ts", "jsx", "tsx"):
                imports = js_import_pattern.findall(content)
                for imp in imports:
                    # Resolve relative import paths
                    if imp.startswith("."):
                        # Match by basename
                        base = imp.split("/")[-1]
                        for other_path in files:
                            if other_path.split("/")[-1].split(".")[0] == base:
                                self.add_edge(source=fpath, target=other_path, relation="IMPORTS")
                    elif imp in libraries_detected:
                        self.add_edge(source=fpath, target=f"lib::{imp}", relation="USES")

        # Connect DB Models and APIs together
        for node in self.nodes:
            if node["type"] == "api":
                # Scan for DB model usage inside the API definition file
                api_file = node["id"].split("::")[0]
                for other in self.nodes:
                    if other["type"] == "model" and other["id"].split("::")[0] == api_file:
                        self.add_edge(source=node["id"], target=other["id"], relation="CONNECTS_TO")

        return self.nodes, self.edges
