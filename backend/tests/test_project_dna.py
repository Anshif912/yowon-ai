import json
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import (
    Base,
    get_db,
    Project,
    User,
    Workspace,
    RepositorySnapshot,
    SimilarityPolicy,
    ProjectDNASnapshot,
    ProjectDNAFeature,
    ProjectDNAFingerprint,
    ComparisonSession,
    ComparisonEvidence,
    WorkspaceMember,
)
from main import app
from auth.security import get_current_user
from modules.project_dna.engine import generate_project_dna, determine_dirty_extractors, extractor_registry
from modules.project_dna.service import (
    get_active_policy,
    run_pairwise_similarity,
    find_cached_dna_snapshot,
    find_cached_comparison,
    generate_workspace_similarity_matrix,
    search_projects_by_dna_feature,
)

# Setup test db
TEST_DATABASE_URL = "sqlite:///test_dna_advanced.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        # Seed Workspace
        ws = db.query(Workspace).filter(Workspace.workspace_id == "test-ws-dna").first()
        if not ws:
            ws = Workspace(
                workspace_id="test-ws-dna",
                name="Test Workspace DNA",
                created_at=datetime.utcnow()
            )
            db.add(ws)
            db.commit()

        # Seed User
        user = db.query(User).filter(User.uuid == "test-user-dna").first()
        if not user:
            user = User(
                uuid="test-user-dna",
                email="reviewer@yowon.ai",
                password_hash="mock",
                full_name="Mock Reviewer",
                role="WORKSPACE_ADMIN",
                status="ACTIVE"
            )
            db.add(user)
            db.commit()

        # Seed WorkspaceMember
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == "test-user-dna",
            WorkspaceMember.workspace_id == "test-ws-dna"
        ).first()
        if not member:
            member = WorkspaceMember(
                workspace_id="test-ws-dna",
                user_id="test-user-dna",
                role="WORKSPACE_ADMIN",
                status="ACCEPTED"
            )
            db.add(member)
            db.commit()

        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    def override_current_user():
        return db_session.query(User).filter(User.uuid == "test-user-dna").first()
        
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()

# ── 1. DNA Snapshot Generation Tests ──────────────────────────────────────────

def test_generate_dna_snapshot_flow(db_session):
    proj = Project(
        id="test-proj-flow-1",
        workspace_id="test-ws-dna",
        name="Flow Test Project",
        project_type="Web App",
        status="done"
    )
    db_session.add(proj)
    
    repo_snap = RepositorySnapshot(
        snapshot_id="test-snap-flow-1",
        repository_id="test-proj-flow-1",
        commit_sha="aabbcc112233",
        technology_summary=json.dumps({"Python": "3.11", "FastAPI": "0.100"}),
        dependency_summary=json.dumps({"sqlalchemy": "2.0"}),
        architecture_summary=json.dumps({"controllers": ["router"]})
    )
    db_session.add(repo_snap)
    db_session.commit()
    
    dna_snap = generate_project_dna(db_session, proj.id, repo_snap)
    
    assert dna_snap.status == "COMPLETED"
    assert dna_snap.version == "v1"
    assert dna_snap.health == "Healthy"
    assert dna_snap.dna_manifest is not None


# ── 2. Incremental Extraction Tests ───────────────────────────────────────────

def test_incremental_dirty_determination():
    dirty = determine_dirty_extractors(["Dockerfile", "src/main.py"])
    assert "Deployment" in dirty
    assert "Architecture" in dirty
    
    # documentation changes only
    dirty_docs = determine_dirty_extractors(["README.md", "docs/architecture.txt"])
    assert dirty_docs == {"Documentation"}


# ── 3. Fingerprint Versioning & Algorithm Tag Tests ─────────────────────────

def test_fingerprint_generation(db_session):
    snap = db_session.query(ProjectDNASnapshot).filter(ProjectDNASnapshot.project_id == "test-proj-flow-1").first()
    finger = db_session.query(ProjectDNAFingerprint).filter(ProjectDNAFingerprint.dna_snapshot_id == snap.uuid).first()
    
    assert finger is not None
    assert finger.fingerprint_algorithm_version == "v1"
    assert finger.technology_hash is not None
    assert finger.architecture_hash is not None


# ── 4. Similarity Policy CRUD & Weight Checks ───────────────────────────────

def test_similarity_policy_resolutions(db_session):
    policy = get_active_policy(db_session, "test-ws-dna")
    assert policy.weight_architecture == 0.30
    assert policy.weight_technology == 0.15
    assert policy.threshold_high_similarity == 0.85


# ── 5. DNA & Comparison Caching Tests ────────────────────────────────────────

def test_dna_cache_validation(db_session):
    proj_id = "test-proj-flow-1"
    snap_id = "test-snap-flow-1"
    
    # Generation request with same snapshot should hit cache
    repo_snap = db_session.query(RepositorySnapshot).filter(RepositorySnapshot.snapshot_id == snap_id).first()
    cached_snap = generate_project_dna(db_session, proj_id, repo_snap)
    
    # Should reuse previous snap uuid
    original = db_session.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == proj_id,
        ProjectDNASnapshot.repository_snapshot_id == snap_id
    ).first()
    assert cached_snap.uuid == original.uuid


def test_comparison_cache_lookup(db_session):
    # Setup mock comparison session
    session = ComparisonSession(
        uuid="session-cache-test",
        workspace_id="test-ws-dna",
        user_id="reviewer-1",
        source_project_id="proj-a",
        target_project_id="proj-b",
        source_dna_snapshot_id="dna-snap-a",
        target_dna_snapshot_id="dna-snap-b",
        overall_similarity=0.92,
        status="COMPLETED"
    )
    db_session.add(session)
    db_session.commit()
    
    cached = find_cached_comparison(db_session, "dna-snap-a", "dna-snap-b")
    assert cached is not None
    assert cached.overall_similarity == 0.92


# ── 6. Workspace Matrix Tests ────────────────────────────────────────────────

def test_workspace_similarity_matrix(db_session):
    matrix_data = generate_workspace_similarity_matrix(db_session, "test-ws-dna")
    assert "project_ids" in matrix_data
    assert "matrix" in matrix_data
    assert len(matrix_data["matrix"]) == len(matrix_data["project_ids"])


# ── 7. DNA Search Tests ──────────────────────────────────────────────────────

def test_dna_search_by_feature(db_session):
    # Add a mock feature
    snap = db_session.query(ProjectDNASnapshot).filter(ProjectDNASnapshot.project_id == "test-proj-flow-1").first()
    feature = ProjectDNAFeature(
        uuid="feat-search-1",
        dna_snapshot_id=snap.uuid,
        dimension="Technology",
        feature_type="frameworks",
        feature_name="frameworks",
        value=json.dumps(["FastAPI", "React"])
    )
    db_session.add(feature)
    db_session.commit()
    
    results = search_projects_by_dna_feature(db_session, "test-ws-dna", "FastAPI")
    assert len(results) > 0
    assert results[0]["project_id"] == "test-proj-flow-1"


# ── 8. Reviewer Actions Tests ────────────────────────────────────────────────

def test_reviewer_decision_submission_api(client, db_session):
    # Seed comparison session
    session = ComparisonSession(
        uuid="reviewer-action-session",
        workspace_id="test-ws-dna",
        user_id="test-user-dna",
        source_project_id="proj-1",
        target_project_id="proj-2",
        source_dna_snapshot_id="dna-1",
        target_dna_snapshot_id="dna-2",
        status="COMPLETED"
    )
    db_session.add(session)
    db_session.commit()
    
    # POST verdict
    res = client.post("/api/v1/projects/compare/reviewer-action-session/action?decision=ACCEPT&comment=ApprovedOriginal")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["reviewer_decision"] == "ACCEPT"
    assert data["reviewer_comment"] == "ApprovedOriginal"


# ── 9. Dynamic Extractor Registry Tests ──────────────────────────────────────

def test_dynamic_extractor_registry():
    pipeline = extractor_registry.get_pipeline()
    assert len(pipeline) > 0
    # check ordering matches priority
    priorities = [ext.priority for ext in pipeline]
    assert priorities == sorted(priorities)


# ── 10. Advanced Enterprise DNA Subsystem Tests ──────────────────────────────

def test_policy_versioning(client, db_session):
    # Create a policy and check default version is 1
    policy = SimilarityPolicy(
        uuid="versioned-policy-1",
        workspace_id="test-ws-dna",
        name="Versioned Policy",
        version=2
    )
    db_session.add(policy)
    db_session.commit()

    res = client.get("/api/v1/projects/dna/policies")
    assert res.status_code == 200
    policies = res.json()["data"]
    matched = [p for p in policies if p["uuid"] == "versioned-policy-1"]
    assert len(matched) == 1
    assert matched[0]["version"] == 2


def test_dna_drift_and_diff_apis(client, db_session):
    # Seed project
    proj = Project(id="drift-proj", name="Drift Project", workspace_id="test-ws-dna")
    db_session.add(proj)
    db_session.commit()

    # Seed two snapshots for drift
    snap_a = ProjectDNASnapshot(
        uuid="snap-drift-a",
        project_id="drift-proj",
        version="v1",
        status="COMPLETED"
    )
    snap_b = ProjectDNASnapshot(
        uuid="snap-drift-b",
        project_id="drift-proj",
        version="v2",
        status="COMPLETED"
    )
    db_session.add_all([snap_a, snap_b])
    db_session.commit()

    # Seed features
    feat_a = ProjectDNAFeature(
        uuid="feat-drift-a",
        dna_snapshot_id="snap-drift-a",
        dimension="Technology",
        feature_type="framework",
        feature_name="FastAPI",
        value="0.100.0",
        confidence=1.0
    )
    feat_b = ProjectDNAFeature(
        uuid="feat-drift-b",
        dna_snapshot_id="snap-drift-b",
        dimension="Technology",
        feature_type="framework",
        feature_name="FastAPI",
        value="0.110.0",  # modified value
        confidence=1.0
    )
    feat_c = ProjectDNAFeature(
        uuid="feat-drift-c",
        dna_snapshot_id="snap-drift-b",
        dimension="Architecture",
        feature_type="pattern",
        feature_name="Clean",
        value="true",  # added feature
        confidence=1.0
    )
    db_session.add_all([feat_a, feat_b, feat_c])
    db_session.commit()

    # Verify diff API
    res_diff = client.get("/api/v1/projects/drift-proj/dna/diff?snapshot_a=snap-drift-a&snapshot_b=snap-drift-b")
    assert res_diff.status_code == 200
    diff_data = res_diff.json()["data"]
    assert len(diff_data["added_features"]) == 1
    assert len(diff_data["modified_features"]) == 1

    # Verify drift API
    res_drift = client.get("/api/v1/projects/drift-proj/dna/drift?from_version=v1&to_version=v2")
    assert res_drift.status_code == 200
    drift_data = res_drift.json()["data"]
    assert drift_data["from_version"] == "v1"
    assert drift_data["to_version"] == "v2"
    assert drift_data["drift_score"] > 0.0


def test_dna_graph_and_export_apis(client, db_session):
    # Verify graph API
    res_graph = client.get("/api/v1/projects/drift-proj/dna/graph?snapshot_id=snap-drift-b")
    assert res_graph.status_code == 200
    graph_data = res_graph.json()["data"]
    assert len(graph_data["nodes"]) > 0
    assert len(graph_data["edges"]) > 0

    # Verify export API
    res_export = client.get("/api/v1/projects/drift-proj/dna/export?snapshot_id=snap-drift-b&format=json")
    assert res_export.status_code == 200
    export_data = res_export.json()["data"]
    assert export_data["snapshot_details"]["project_name"] == "Drift Project"
    assert len(export_data["extracted_features"]) > 0


def test_dna_observability_metrics_api(client, db_session):
    res = client.get("/api/v1/projects/system/metrics/dna")
    assert res.status_code == 200
    metrics = res.json()["data"]
    assert "average_dna_generation_time_ms" in metrics
    assert "cache_hit_ratio" in metrics
    assert "queue_length" in metrics
