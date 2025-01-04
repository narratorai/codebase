class OperationalError(Exception):
    pass


class PoolClosed(OperationalError):
    """Attempt to get a connection from a closed pool."""


class PoolTimeout(OperationalError):
    """The pool couldn't provide a connection in acceptable time."""


class ConnectionExpired(OperationalError):
    """The connection has expired and should not be used."""


class ConnectionClosed(OperationalError):
    """The connection has been closed and should not be used."""
