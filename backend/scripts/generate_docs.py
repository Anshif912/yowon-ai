import json
import os
import sys
from fastapi.openapi.utils import get_openapi

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import Base

def generate_docs():
    # 1. OpenAPI spec
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
    os.makedirs(docs_dir, exist_ok=True)
    
    with open(os.path.join(docs_dir, "openapi.json"), "w") as f:
        json.dump(openapi_schema, f, indent=2)
        
    # 2. REST Endpoint Inventory
    inventory = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            inventory.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name,
                "summary": getattr(route, "summary", "")
            })
    with open(os.path.join(docs_dir, "rest_endpoints.json"), "w") as f:
        json.dump(inventory, f, indent=2)

    # 3. Database ER reference
    er_ref = {}
    for table_name, table in Base.metadata.tables.items():
        columns = []
        for col in table.columns:
            columns.append({
                "name": col.name,
                "type": str(col.type),
                "primary_key": col.primary_key,
                "nullable": col.nullable,
                "foreign_key": [str(fk.target_fullname) for fk in col.foreign_keys] if col.foreign_keys else []
            })
        er_ref[table_name] = columns
    with open(os.path.join(docs_dir, "database_schema.json"), "w") as f:
        json.dump(er_ref, f, indent=2)

    # 4. Environment Config Reference
    from config import CORS_ORIGINS
    jwt_secret = os.getenv("JWT_SECRET_KEY", "yowon-ai-super-secret-key-2026-auth-prod-ready")
    config_ref = {
        "JWT_SECRET_KEY_CONFIGURED": jwt_secret != "yowon-ai-super-secret-key-2026-auth-prod-ready",
        "CORS_ORIGINS": CORS_ORIGINS
    }
    with open(os.path.join(docs_dir, "environment_config.json"), "w") as f:
        json.dump(config_ref, f, indent=2)

    print("Platform Architectural Documentation generated successfully under backend/docs/")

if __name__ == "__main__":
    generate_docs()
