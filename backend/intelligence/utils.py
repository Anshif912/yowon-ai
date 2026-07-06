"""
utils.py — Repository Intelligence utility and normalization functions.
"""

from typing import Any, List, Dict

def safe_list(val: Any) -> List[Any]:
    """Ensures input is returned as a list."""
    if val is None:
        return []
    if isinstance(val, (list, tuple, set)):
        return list(val)
    if isinstance(val, dict):
        return list(val.values())
    return [val]

def safe_dict(val: Any) -> Dict[Any, Any]:
    """Ensures input is returned as a dictionary."""
    if val is None:
        return {}
    if isinstance(val, dict):
        return val
    try:
        return dict(val)
    except Exception:
        return {}

def safe_string(val: Any) -> str:
    """Ensures input is returned as a string."""
    if val is None:
        return ""
    if isinstance(val, bytes):
        return val.decode("utf-8", errors="ignore")
    return str(val)

def normalize_dependency_name(dep: Any) -> str:
    """Safely extracts a lowercase dependency name string from mixed inputs."""
    if dep is None:
        return ""
    if isinstance(dep, str):
        return dep.lower().strip()
    if isinstance(dep, dict):
        for key in ("name", "package", "id", "dependency"):
            if key in dep and dep[key] is not None:
                return str(dep[key]).lower().strip()
        for val in dep.values():
            if isinstance(val, str):
                return val.lower().strip()
    if isinstance(dep, (list, tuple, set)):
        lst = list(dep)
        if lst:
            return normalize_dependency_name(lst[0])
    return safe_string(dep).lower().strip()

def normalize_path(path: Any) -> str:
    """Safely normalizes folder/file paths to use forward slashes."""
    s = safe_string(path).strip()
    s = s.replace("\\", "/")
    return s

def normalize_language(lang: Any) -> str:
    """Normalizes language name string."""
    return safe_string(lang).lower().strip()

def get_repository_name(repository: Any) -> str:
    """Safely resolves the display name of a repository with fallbacks."""
    if repository is None:
        return "Unknown Repository"
    for field in ("repository_name", "repo_name", "display_name", "project_name", "title"):
        if hasattr(repository, field):
            val = getattr(repository, field)
            if val and str(val).strip():
                return str(val).strip()
    return "Unknown Repository"
