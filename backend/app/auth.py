import re

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from .errors import ApiError
from .extensions import db
from .models import User
from .security import login_required

bp = Blueprint("auth", __name__, url_prefix="/api/auth")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _json() -> dict:
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


@bp.post("/register")
def register():
    data = _json()
    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    confirm = str(data.get("confirm_password", ""))

    fields: dict[str, str] = {}
    if not full_name or len(full_name) > 120:
        fields["full_name"] = "Enter your full name (max 120 characters)."
    if not EMAIL_RE.match(email) or len(email) > 255:
        fields["email"] = "Enter a valid email address."
    elif User.query.filter_by(email=email).first():
        fields["email"] = "Email is already registered."
    if len(password) < 8:
        fields["password"] = "Password must be at least 8 characters."
    if password != confirm:
        fields["confirm_password"] = "Passwords do not match."
    if fields:
        raise ApiError(400, "validation_error", "Please fix the highlighted fields.", fields)

    user = User(full_name=full_name, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@bp.post("/login")
def login():
    data = _json()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = User.query.filter_by(email=email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        raise ApiError(401, "invalid_credentials", "Invalid email or password.")
    session.clear()
    session["user_id"] = user.id
    return jsonify(user.to_dict())


@bp.post("/logout")
def logout():
    session.clear()
    return "", 204


@bp.get("/me")
@login_required
def me(user: User):
    return jsonify(user.to_dict())
