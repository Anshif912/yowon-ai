"""
test_repository_intelligence.py — Regression test suite for hardered Repository Intelligence system.
"""

import pytest
from pydantic import BaseModel
from typing import List, Dict, Any

from intelligence.models import EvidenceRecord, RecommendationRecord, SymbolRecord
from utils.serialization import to_dict, from_dict, to_json, from_json
from intelligence.exceptions import RepositoryValidationError
from intelligence.engine_contract import run_isolated_engine, EngineStatus
from intelligence.orchestrator import RepositoryPlanner, ExecutionScheduler, DiagnosticsCollector, CacheManager


def test_pydantic_model_compatibility():
    """Verify that models inherit from DictCompatibilityMixin and work with dictionary get/contains/keys."""
    ev = EvidenceRecord(
        rule_id="RULE_TEST_PERF",
        parser="python",
        language="python",
        file_path="main.py",
        line_start=10,
        line_end=12,
        column_start=0,
        column_end=5,
        matched_code_hash="abc123hash",
        confidence=0.95,
        severity="HIGH"
    )

    # 1. Attribute Access
    assert ev.rule_id == "RULE_TEST_PERF"
    assert ev.confidence == 0.95

    # 2. Dictionary Get Compatibility
    assert ev.get("rule_id") == "RULE_TEST_PERF"
    assert ev.get("non_existent", "default_val") == "default_val"
    assert ev["file_path"] == "main.py"

    # 3. Contains & Keys check
    assert "severity" in ev
    assert "rule_id" in ev.keys()


def test_central_serialization_layer():
    """Verify that serialization.py properly transforms Pydantic models and parses back."""
    ev = EvidenceRecord(
        rule_id="RULE_TEST_PERF",
        parser="python",
        language="python",
        file_path="main.py",
        line_start=10,
        line_end=12,
        column_start=0,
        column_end=5,
        matched_code_hash="abc123hash",
        confidence=0.95,
        severity="HIGH"
    )

    # Serialize
    d = to_dict(ev)
    assert isinstance(d, dict)
    assert d["rule_id"] == "RULE_TEST_PERF"
    assert d["confidence"] == 0.95

    # Deserialize
    rebuilt = from_dict(EvidenceRecord, d)
    assert isinstance(rebuilt, EvidenceRecord)
    assert rebuilt.rule_id == "RULE_TEST_PERF"
    assert rebuilt.confidence == 0.95


def test_isolated_engine_failures():
    """Verify that run_isolated_engine handles exceptions gracefully and collects timing delta."""
    def buggy_engine():
        raise ValueError("Simulated parsing crash")

    # Run stage
    res = run_isolated_engine(
        name="buggy_ast_parser",
        func=buggy_engine,
        fallback_payload={"nodes": [], "edges": []}
    )

    # Asserts
    assert res.status == EngineStatus.FAILED
    assert "Simulated parsing crash" in res.errors[0]
    assert res.payload == {"nodes": [], "edges": []}
    assert res.duration >= 0.0
    assert res.confidence == 0.0


def test_repository_planner_routing():
    """Verify that the planner detects AI libs, size and assigns pipelines correctly."""
    # Fast Pipeline
    fast_pipeline = RepositoryPlanner.plan(
        scan_files=["main.py", "README.md"],
        file_contents={"main.py": "print('hello')"},
        detected_techs=["Python"],
        total_loc=100
    )
    assert fast_pipeline == "FastPipeline"

    # AI Pipeline
    ai_pipeline = RepositoryPlanner.plan(
        scan_files=["main.py", "agent.py"],
        file_contents={"agent.py": "from crewai import Agent"},
        detected_techs=["Python", "CrewAI"],
        total_loc=500
    )
    assert ai_pipeline == "AIPipeline"

    # Deep Pipeline
    deep_pipeline = RepositoryPlanner.plan(
        scan_files=[f"file_{i}.py" for i in range(600)],
        file_contents={},
        detected_techs=["Python"],
        total_loc=60000
    )
    assert deep_pipeline == "DeepPipeline"


def test_diagnostics_confidence_math():
    """Verify that DiagnosticsCollector computes mathematical confidence correctly."""
    scheduler = ExecutionScheduler()
    # Mock some runs
    scheduler.results["stage_1"] = run_isolated_engine(
        "stage_1", lambda: "payload", quality_gate_min_confidence=0.0
    )
    
    diag = DiagnosticsCollector.collect(
        scan_files=["main.py", "utils.py"],
        discovered_count=10,
        loaded_count=8,  # 80% coverage
        parsed_count=8,
        total_loc=1000,
        results=scheduler.results,
        timeline=scheduler.get_timeline(),
        cache_status="MISS"
    )

    assert diag["repository_coverage"] == 80.0
    assert diag["confidence"] > 0.5
    assert "CONFIDENCE" in diag["confidence_label"]
