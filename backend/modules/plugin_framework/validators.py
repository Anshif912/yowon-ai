# Validators for Plugin Framework
def validate_plugin_version(version: str) -> bool:
    parts = version.split(".")
    return len(parts) == 3 and all(p.isdigit() for p in parts)
