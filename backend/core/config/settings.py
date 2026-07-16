import os

ENV = os.getenv("YOWON_ENV", "development")
DEBUG = os.getenv("YOWON_DEBUG", "True") == "True"

DEFAULT_PAGINATION_SIZE = 100
MAX_CONNECTIONS_POOL = 20
