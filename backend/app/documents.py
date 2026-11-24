import os
import uuid

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from .errors import ApiError
from .extensions import db
from .models import Document, Share, User
from .security import login_required

bp = Blueprint("documents", __name__, url_prefix="/api/documents")


def delete_stored_file(stored_name: str) -> None:
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored_name)
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


def _owned_or_error(user: User, doc_id: int) -> Document:
    doc = db.session.get(Document, doc_id)
    if doc is None:
        raise ApiError(404, "not_found", "Document not found.")
    if doc.owner_id != user.id:
        raise ApiError(403, "forbidden", "You do not own this document.")
    return doc


def _description() -> str:
    if request.is_json:
        source = request.get_json(silent=True) or {}
    else:
        source = request.form
    desc = str(source.get("description", "")).strip()
    if not 1 <= len(desc) <= 255:
        raise ApiError(
            400,
            "validation_error",
            "Please fix the highlighted fields.",
            {"description": "Enter a description (max 255 characters)."},
        )
    return desc


@bp.get("")
@login_required
def list_documents(user: User):
    mine = Document.query.filter_by(owner_id=user.id).order_by(Document.id.desc()).all()
    shared_docs = (
        db.session.query(Document)
        .join(Share, Share.document_id == Document.id)
        .filter(Share.user_id == user.id)
        .order_by(Document.id.desc())
        .all()
    )
    shared = []
    for d in shared_docs:
        item = d.to_dict()
        item["shared_by"] = {"full_name": d.owner.full_name, "email": d.owner.email}
        shared.append(item)
    return jsonify({"mine": [d.to_dict() for d in mine], "shared": shared})


@bp.post("")
@login_required
def upload(user: User):
    desc = _description()
    file = request.files.get("file")
    if file is None or not file.filename:
        raise ApiError(400, "validation_error", "Please fix the highlighted fields.", {"file": "Choose a file."})
    display = secure_filename(file.filename)
    ext = display.rsplit(".", 1)[-1].lower() if "." in display else ""
    allowed = current_app.config["ALLOWED_EXTENSIONS"]
    if ext not in allowed:
        raise ApiError(
            400,
            "validation_error",
            "Please fix the highlighted fields.",
            {"file": "File type not allowed. Allowed: " + ", ".join(sorted(allowed)) + "."},
        )

    folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(folder, exist_ok=True)
    stored = uuid.uuid4().hex  # random name, never user controlled
    path = os.path.join(folder, stored)
    file.save(path)
    doc = Document(
        owner_id=user.id, description=desc, file_name=display, stored_name=stored, size=os.path.getsize(path)
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify(doc.to_dict()), 201


@bp.put("/<int:doc_id>")
@login_required
def edit(user: User, doc_id: int):
    doc = _owned_or_error(user, doc_id)
    doc.description = _description()
    db.session.commit()
    return jsonify(doc.to_dict())


@bp.delete("/<int:doc_id>")
@login_required
def remove(user: User, doc_id: int):
    doc = _owned_or_error(user, doc_id)
    stored = doc.stored_name
    db.session.delete(doc)
    db.session.commit()
    delete_stored_file(stored)
    return "", 204


@bp.get("/<int:doc_id>/download")
@login_required
def download(user: User, doc_id: int):
    doc = db.session.get(Document, doc_id)
    if doc is None:
        raise ApiError(404, "not_found", "Document not found.")
    is_shared = Share.query.filter_by(document_id=doc.id, user_id=user.id).first() is not None
    if doc.owner_id != user.id and not is_shared:
        raise ApiError(403, "forbidden", "You do not have access to this document.")
    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"], doc.stored_name, as_attachment=True, download_name=doc.file_name
    )


@bp.get("/<int:doc_id>/shares")
@login_required
def list_shares(user: User, doc_id: int):
    doc = _owned_or_error(user, doc_id)
    shared_ids = {s.user_id for s in doc.shares}
    shared_with = [s.user.to_dict() for s in doc.shares]
    candidates = [
        u.to_dict()
        for u in User.query.filter(User.id != user.id).order_by(User.full_name).all()
        if u.id not in shared_ids
    ]
    return jsonify({"shared_with": shared_with, "candidates": candidates})


@bp.post("/<int:doc_id>/shares")
@login_required
def add_share(user: User, doc_id: int):
    doc = _owned_or_error(user, doc_id)
    data = request.get_json(silent=True) or {}
    target_id = data.get("user_id")
    if not isinstance(target_id, int) or target_id == user.id or db.session.get(User, target_id) is None:
        raise ApiError(400, "validation_error", "Choose a valid user.", {"user_id": "Choose a user."})
    if Share.query.filter_by(document_id=doc.id, user_id=target_id).first():
        raise ApiError(409, "conflict", "Already shared with this user.")
    db.session.add(Share(document_id=doc.id, user_id=target_id))
    db.session.commit()
    return "", 201


@bp.delete("/<int:doc_id>/shares/<int:target_id>")
@login_required
def remove_share(user: User, doc_id: int, target_id: int):
    doc = _owned_or_error(user, doc_id)
    share = Share.query.filter_by(document_id=doc.id, user_id=target_id).first()
    if share is None:
        raise ApiError(404, "not_found", "Share not found.")
    db.session.delete(share)
    db.session.commit()
    return "", 204
