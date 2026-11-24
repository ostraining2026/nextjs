import re

from flask import Blueprint, jsonify, request, session

from .documents import delete_stored_file
from .errors import ApiError
from .extensions import db
from .models import User
from .security import login_required

bp = Blueprint("users", __name__, url_prefix="/api/users")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _get_or_404(user_id: int) -> User:
    target = db.session.get(User, user_id)
    if target is None:
        raise ApiError(404, "not_found", "User not found.")
    return target


@bp.get("")
@login_required
def list_users(_user: User):
    users = User.query.order_by(User.full_name).all()
    return jsonify([u.to_dict() for u in users])


@bp.get("/<int:user_id>")
@login_required
def get_user(_user: User, user_id: int):
    return jsonify(_get_or_404(user_id).to_dict())


@bp.put("/<int:user_id>")
@login_required
def update_user(_user: User, user_id: int):
    target = _get_or_404(user_id)
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()

    fields: dict[str, str] = {}
    if not full_name or len(full_name) > 120:
        fields["full_name"] = "Enter a full name (max 120 characters)."
    if not EMAIL_RE.match(email) or len(email) > 255:
        fields["email"] = "Enter a valid email address."
    elif User.query.filter(User.email == email, User.id != target.id).first():
        raise ApiError(409, "conflict", "Email is already registered.", {"email": "Email is already registered."})
    if fields:
        raise ApiError(400, "validation_error", "Please fix the highlighted fields.", fields)

    target.full_name, target.email = full_name, email
    db.session.commit()
    return jsonify(target.to_dict())


@bp.delete("/<int:user_id>")
@login_required
def delete_user(user: User, user_id: int):
    target = _get_or_404(user_id)
    deleting_self = target.id == user.id
    stored = [d.stored_name for d in target.documents]
    db.session.delete(target)  # cascades to messages, documents, shares
    db.session.commit()
    for name in stored:
        delete_stored_file(name)
    if deleting_self:
        session.clear()
    return "", 204
