class ConnectorException(Exception):
    """Base exception for all integration connector errors."""
    pass

class ConnectorAuthException(ConnectorException):
    """Exception thrown upon oauth or secret credential lookup failures."""
    pass

class ConnectorSyncException(ConnectorException):
    """Exception thrown when sync tasks executions fail."""
    pass
