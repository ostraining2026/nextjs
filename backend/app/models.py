from datetime import datetime, timezone

from .extensions import db


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(dt: datetime) -> str:
    return dt.isoformat() + "Z"


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=_now)

    messages = db.relationship("Message", cascade="all, delete-orphan", backref="author")
    documents = db.relationship("Document", cascade="all, delete-orphan", backref="owner")
    shares = db.relationship("Share", cascade="all, delete-orphan", backref="user")

    def to_dict(self) -> dict:
        # Never include password_hash.
        return {"id": self.id, "full_name": self.full_name, "email": self.email}


class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body = db.Column(db.String(1000), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=_now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "full_name": self.author.full_name,
            "body": self.body,
            "created_at": iso(self.created_at),
        }


class Document(db.Model):
    __tablename__ = "documents"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    stored_name = db.Column(db.String(64), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=_now)

    shares = db.relationship("Share", cascade="all, delete-orphan", backref="document")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "description": self.description,
            "file_name": self.file_name,
            "size": self.size,
            "created_at": iso(self.created_at),
        }


class Share(db.Model):
    __tablename__ = "shares"
    __table_args__ = (db.UniqueConstraint("document_id", "user_id", name="uq_share"),)
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
