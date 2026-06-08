"""Tests for PDF report fix normalization."""

from reports.report_generator import YowonReport


def test_format_fixes_string_list():
    fixes = ["Fix validation", "Add monitoring"]
    text = YowonReport._format_fixes(fixes)
    assert "Fix validation" in text
    assert "#1:" in text


def test_format_fixes_dict_list():
    fixes = [{"priority": 1, "fix": "Patch auth", "effort": "low"}]
    text = YowonReport._format_fixes(fixes)
    assert "Patch auth" in text
    assert "Effort: low" in text


def test_pdf_report_does_not_render_raw_debug_json(tmp_path, monkeypatch):
    from reports import report_generator
    from pypdf import PdfReader

    monkeypatch.setattr(report_generator, "REPORT_DIR", tmp_path)
    results = {
        "verdict": {
            "overall_score": 62,
            "verdict": "IMPROVE",
            "risk_level": "MEDIUM",
            "project_type": "Hackathon Project",
            "evaluation_standard": "Production readiness",
            "score_band": "Strong",
            "confidence": 55,
            "confidence_explanation": "Moderate evidence.",
            "repository_statistics": {
                "total_files": 8,
                "code_files": 4,
                "documentation_files": 1,
                "presentation_files": 0,
                "test_files": 0,
                "deployment_files": 0,
                "meaningful_files": 5,
            },
            "repository_completeness_score": 45,
            "evidence_quality": "Functional",
            "scoring_weights": {"technical": 0.3, "security": 0.2, "innovation": 0.2, "presentation": 0.1, "impact": 0.2},
            "agent_scores": {"technical": 62, "security": 30, "scalability": 50, "innovation": 45, "presentation": 35, "impact": 40},
            "raw_agent_scores": {"technical": 99},
            "calibrated_agent_scores": {"technical": 62},
            "agent_calibration_reasons": {"technical": ["No tests"]},
            "penalties": [{"dimension": "technical", "factor": "No test evidence"}],
            "executive_summary": "Readable executive summary.",
            "blocking_issues": ["Add tests"],
            "recommended_fixes": ["Add test coverage"],
            "deployment_roadmap": ["Stabilize release"],
        },
        "technical": '{"technical_score": 62, "strengths": ["Readable"], "weaknesses": ["No tests"]}',
        "security": "Security Analysis\nSecurity Score:\n30/100\nFindings:\n- No security evidence",
        "innovation": "Innovation Analysis\nInnovation Score:\n45/100\nRecommendations:\n- Document novelty",
        "impact": "Impact Analysis\nImpact Score:\n40/100\nTop Risks:\n- Unclear adoption",
        "failure": "- Missing tests\n- No deployment evidence",
        "scalability": "Scalability Assessment\nScalability Score:\n50/100",
        "ppt": "Presentation Analysis\nPresentation Score:\n35/100",
        "cross_exam": "No major contradictions detected.",
    }

    path = report_generator.generate_report("Demo", "test-report", results)
    assert report_generator.validate_pdf_file(path) > 0
    with open(path, "rb") as handle:
        assert handle.read(5) == b"%PDF-"
    text = "\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
    assert "Raw Agent Scores" not in text
    assert "raw_agent_scores" not in text
    assert "calibrated_agent_scores" not in text
    assert "agent_calibration_reasons" not in text
    assert '{"technical_score"' not in text
    assert "Top Failure Predictions" in text
    assert "1. Missing tests" in text


def test_rejection_pdf_is_rejection_only(tmp_path, monkeypatch):
    from reports import report_generator
    from pypdf import PdfReader

    monkeypatch.setattr(report_generator, "REPORT_DIR", tmp_path)
    results = {
        "rejection_report": True,
        "verdict": {
            "status": "INSUFFICIENT_EVIDENCE",
            "overall_score": 0,
            "verdict": "REJECT",
            "risk_level": "CRITICAL",
            "final_reason": "Repository contains no evaluable content.",
            "repository_statistics": {"total_files": 0, "code_files": 0, "documentation_files": 0, "presentation_files": 0, "meaningful_files": 0},
        },
    }
    path = report_generator.generate_report("Empty", "empty-report", results)
    assert report_generator.validate_pdf_file(path) > 0
    text = "\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
    assert "INSUFFICIENT_EVIDENCE" in text
    assert "Repository contains no evaluable content." in text
    assert "Technical Analysis" not in text


def _case_results(project_type: str, *, score: int = 58, roadmap=None, missing=None, positives=None):
    return {
        "verdict": {
            "overall_score": score,
            "verdict": "IMPROVE" if score >= 50 else "REJECT",
            "risk_level": "MEDIUM" if score >= 50 else "HIGH",
            "project_type": project_type,
            "evaluation_standard": "YOWON AI readiness rubric",
            "score_band": "Functional",
            "confidence": 52,
            "confidence_explanation": "Synthetic validation case.",
            "repository_statistics": {
                "total_files": 6,
                "code_files": 2,
                "documentation_files": 1,
                "presentation_files": 0,
                "test_files": 0,
                "deployment_files": 0,
                "meaningful_files": 3,
            },
            "repository_completeness_score": 36,
            "evidence_quality": "Functional",
            "agent_scores": {
                "technical": score,
                "security": 42,
                "scalability": 45,
                "innovation": 50,
                "presentation": 48,
                "impact": 44,
            },
            "executive_summary": f"{project_type} validation report.",
            "top_strengths": positives,
            "top_weaknesses": missing,
            "positive_factors": positives,
            "missing_evidence": missing,
            "deployment_roadmap": roadmap,
            "recommended_fixes": ["Add tests", "Document deployment"],
        },
        "technical": "Repository has a small implementation with limited tests.",
        "security": "No security evidence was available.",
        "innovation": "Innovation evidence is limited.",
        "impact": "Impact evidence is limited.",
        "failure": ["Missing tests", "No deployment evidence"],
        "scalability": "No scalability evidence was available.",
        "ppt": "Documentation is partial.",
        "cross_exam": "No major contradictions detected.",
    }


def test_pdf_generation_required_validation_cases(tmp_path, monkeypatch):
    from reports import report_generator
    from pypdf import PdfReader

    monkeypatch.setattr(report_generator, "REPORT_DIR", tmp_path)
    cases = [
        ("Empty Repository", _case_results("Hackathon Project", score=0, roadmap="", missing=[], positives=[])),
        ("Small ML Project", _case_results("University Project", score=62, roadmap=list("Phase 1 - Add tests\nPhase 2 - Deploy"), positives=["Machine learning implementation"])),
        ("Hackathon Project", _case_results("Hackathon Project", score=55, roadmap="Add tests\nAdd demo deployment")),
        ("University Project", _case_results("University Project", score=64, roadmap=["Document methodology", "Add evaluation notebook"])),
        ("Research Project", _case_results("Research Project", score=59, roadmap="Phase 1 - Add baselines; Phase 2 - Publish reproducibility package")),
    ]

    for name, results in cases:
        path = report_generator.generate_report(name, name.lower().replace(" ", "-"), results)
        assert report_generator.validate_pdf_file(path) > 0
        with open(path, "rb") as handle:
            assert handle.read(5) == b"%PDF-"
        text = "\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
        assert "YOWON AI" in text
        assert "Executive Summary" in text
        assert "Score Table" in text
        assert "Category Score Chart" in text
        assert "Missing Evidence" in text
        assert "Positive Factors" in text
        assert "Deployment Roadmap" in text
        assert "Final Verdict" in text
        assert "P h a s e" not in text
        assert "No testing evidence" in text or "Machine learning implementation" in text


def test_pdf_validation_rejects_corrupt_file(tmp_path):
    from reports import report_generator
    import pytest

    corrupt = tmp_path / "corrupt.pdf"
    corrupt.write_text("not a real pdf", encoding="utf-8")
    with pytest.raises(report_generator.PDFGenerationError):
        report_generator.validate_pdf_file(corrupt)
