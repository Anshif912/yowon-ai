# YOWON AI — Testing Strategy & Verification Guidelines (v1.0)

Registers guidelines for maintaining zero-regression core coverage.

---

## 1. Test Categories

- **Core Unit Tests**: Located in `tests/`. Runs SQLite local files db to isolate environment setups.
- **API Contract Verification**: Validates route inputs and envelope formats.
- **Maturity & Replay Tests**: Asserts recomputed parameters return matching verdicts.

---

## 2. Test Execution Commands
- **Run all unit tests**: `pytest tests/`
- **Isolate Decision tests**: `pytest tests/test_decision_governance.py`
- **Lint check**: `ruff check .`
