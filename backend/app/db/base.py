"""Base dichiarativa SQLAlchemy 2."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base per tutti i modelli ORM."""
