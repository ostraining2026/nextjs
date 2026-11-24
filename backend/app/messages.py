from flask import Blueprint, jsonify, request

from .errors import ApiError
from .extensions import db
from .models import Message, User
from .security import login_required

bp = Blueprint("messages", __name__, url_prefix="/api/messages")


@bp.get("")
@login_required
def list_messages(_user: User):
    after_id = request.args.get("after_id", type=int)
    if after_id is not None:
        rows = Message.query.filter(Message.id > after_id).order_by(Message.id).limit(100).all()
    else:
        # latest 100, shown oldest first
        rows = Message.query.order_by(Message.id.desc()).limit(100).all()[::-1]
    return jsonify([m.to_dict() for m in rows])


@bp.post("")
@login_required
def send_message(user: User):
    data = request.get_json(silent=True) or {}
    body = str(data.get("body", "")).strip()
    if not 1 <= len(body) <= 1000:
        raise ApiError(
            400, "validation_error", "Message must be 1 to 1000 characters.", {"body": "Enter 1 to 1000 characters."}
        )
    msg = Message(user_id=user.id, body=body)
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201
