from sqlalchemy.orm import sessionmaker
from database import engine, KnowledgeGraphNode, KnowledgeGraphEdge, RepositorySnapshot
from intelligence.models import SymbolRecord
from intelligence.knowledge_graph.knowledge_graph_builder import KnowledgeGraphBuilder
from intelligence.knowledge_graph.knowledge_graph_service import (
    sync_knowledge_graph,
    get_knowledge_graph_data,
    find_shortest_dependency_path,
    collapse_folder_nodes
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_knowledge_graph_builder_extraction():
    builder = KnowledgeGraphBuilder()
    
    files = ["main.py", "database.py", "requirements.txt", "docker-compose.yml"]
    file_contents = {
        "main.py": "import os\nimport database\n\n@app.get('/health')\ndef check_health():\n    db_call()\n\ndb_url = os.getenv('DATABASE_URL')",
        "database.py": "class YowonDB:\n    pass",
        "requirements.txt": "fastapi==0.110.0\nsqlalchemy",
        "docker-compose.yml": "services:\n  backend:\n    image: yowon-backend:latest"
    }
    
    symbols = [
        SymbolRecord(
            name="YowonDB",
            type="class",
            file_path="database.py",
            line_start=1,
            line_end=2,
            column_start=0,
            column_end=15
        ),
        SymbolRecord(
            name="check_health",
            type="function",
            file_path="main.py",
            line_start=4,
            line_end=6,
            column_start=0,
            column_end=17,
            relationships=[{"type": "calls", "target": "YowonDB"}]
        )
    ]
    
    nodes, edges = builder.build_graph(files, file_contents, symbols)
    
    # Verify node types are extracted
    node_types = {n["type"] for n in nodes}
    assert "file" in node_types
    assert "class" in node_types
    assert "function" in node_types
    assert "env_var" in node_types
    assert "library" in node_types
    assert "docker_service" in node_types
    
    # Verify environment variable exists
    env_vars = [n for n in nodes if n["type"] == "env_var"]
    assert len(env_vars) == 1
    assert env_vars[0]["label"] == "DATABASE_URL"
    
    # Verify relation edge exists
    relations = {e["relation"] for e in edges}
    assert "USES" in relations or "DEPENDS_ON" in relations or "CALLS" in relations

def test_knowledge_graph_service_sync_and_pathfinder():
    db = TestingSessionLocal()
    try:
        # Create a mock snapshot
        snapshot = RepositorySnapshot(
            snapshot_id="mock-snapshot-kg-123",
            repository_id="mock-repo-id",
            commit_sha="mock-commit-sha-val",
            folder_structure="[]"
        )
        db.add(snapshot)
        db.commit()
        
        nodes = [
            {"id": "nodeA", "label": "Node A", "type": "file", "metadata": {}},
            {"id": "nodeB", "label": "Node B", "type": "class", "metadata": {}},
            {"id": "nodeC", "label": "Node C", "type": "function", "metadata": {}}
        ]
        edges = [
            {"source": "nodeA", "target": "nodeB", "relation": "CALLS"},
            {"source": "nodeB", "target": "nodeC", "relation": "DEPENDS_ON"}
        ]
        
        # Test DB sync
        sync_knowledge_graph(db, "mock-snapshot-kg-123", "mock-commit-sha-val", nodes, edges)
        
        # Test Get Graph Data
        res = get_knowledge_graph_data(db, "mock-snapshot-kg-123")
        assert len(res["nodes"]) == 3
        assert len(res["edges"]) == 2
        
        # Test path finder
        path = find_shortest_dependency_path(res["nodes"], res["edges"], "nodeA", "nodeC")
        assert len(path["nodes"]) == 3
        assert len(path["edges"]) == 2
        
        path_ids = [n["id"] for n in path["nodes"]]
        assert path_ids == ["nodeA", "nodeB", "nodeC"]
        
    finally:
        # Cleanup
        db.query(KnowledgeGraphEdge).filter(KnowledgeGraphEdge.repository_snapshot_id == "mock-snapshot-kg-123").delete()
        db.query(KnowledgeGraphNode).filter(KnowledgeGraphNode.repository_snapshot_id == "mock-snapshot-kg-123").delete()
        db.query(RepositorySnapshot).filter(RepositorySnapshot.snapshot_id == "mock-snapshot-kg-123").delete()
        db.commit()
        db.close()

def test_knowledge_graph_folder_collapsing():
    nodes = [
        {"id": "src/controllers/api.py", "label": "api.py", "type": "file", "metadata": {}},
        {"id": "src/controllers/admin.py", "label": "admin.py", "type": "file", "metadata": {}},
        {"id": "database.py", "label": "database.py", "type": "file", "metadata": {}}
    ]
    edges = [
        {"source": "src/controllers/api.py", "target": "database.py", "relation": "IMPORTS"},
        {"source": "src/controllers/admin.py", "target": "database.py", "relation": "IMPORTS"}
    ]
    
    collapsed = collapse_folder_nodes(nodes, edges)
    # Check that controllers are grouped to a folder node src/controllers
    node_ids = {n["id"] for n in collapsed["nodes"]}
    assert "src/controllers" in node_ids
    assert "src/controllers/api.py" not in node_ids
    assert "src/controllers/admin.py" not in node_ids
    assert "database.py" in node_ids
    
    # Check that redirected edge points from folder to database
    edge_pairs = [(e["source"], e["target"]) for e in collapsed["edges"]]
    assert ("src/controllers", "database.py") in edge_pairs
    assert len(collapsed["edges"]) == 1
