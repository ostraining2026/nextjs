import os

import click
from flask import Flask

from .config import Config
from .errors import register_error_handlers
from .extensions import db


def create_app(config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    if config:
        app.config.update(config)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    register_error_handlers(app)

    from . import auth, documents, messages, models, openapi, users  # noqa: F401

    for module in (auth, users, messages, documents, openapi):
        app.register_blueprint(module.bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.cli.command("init-db")
    def init_db():
        """Create all tables (alternative to running schema.sql)."""
        db.create_all()
        click.echo("Tables created.")

    return app
