import io

import pytest

from app import create_app
from app.extensions import db


@pytest.fixture()
def app(tmp_path):
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite://",  # in-memory, no MySQL needed
            "UPLOAD_FOLDER": str(tmp_path / "uploads"),
        }
    )
    with app.app_context():
        db.create_all()
    return app


@pytest.fixture()
def client(app):
    return app.test_client()


def register(c, name="Ann", email="ann@example.com", pw="password123"):
    return c.post(
        "/api/auth/register",
        json={"full_name": name, "email": email, "password": pw, "confirm_password": pw},
    )


def login(c, email="ann@example.com", pw="password123"):
    return c.post("/api/auth/login", json={"email": email, "password": pw})


def upload(c, description="Report", name="r.txt", content=b"data"):
    return c.post(
        "/api/documents",
        data={"description": description, "file": (io.BytesIO(content), name)},
        content_type="multipart/form-data",
    )
