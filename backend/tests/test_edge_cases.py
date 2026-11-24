"""Edge cases: limits, security rules, 404s and cleanup."""
import os

import pytest
from conftest import login, register, upload

from app.extensions import db
from app.models import Document, Message, Share, User


@pytest.fixture()
def ann(client):
    register(client)
    login(client)
    return client


# ---- auth ---------------------------------------------------------------

def test_password_is_hashed_and_never_returned(client, app):
    resp = register(client)
    assert "password" not in resp.json and "password_hash" not in resp.json
    with app.app_context():
        stored = User.query.one().password_hash
    assert stored != "password123" and stored.startswith(("scrypt:", "pbkdf2:"))


def test_email_is_case_insensitive_and_trimmed(client):
    register(client, email="  Ann@Example.COM ")
    assert login(client, "ann@example.com").status_code == 200


def test_same_error_for_unknown_email_and_wrong_password(client):
    register(client)
    unknown = login(client, "nobody@example.com")
    wrong = login(client, "ann@example.com", "wrongpass1")
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json == wrong.json


def test_register_rejects_mismatched_and_short_passwords(client):
    r = client.post(
        "/api/auth/register",
        json={"full_name": "A", "email": "a@x.com", "password": "short", "confirm_password": "short"},
    )
    assert "password" in r.json["error"]["fields"]
    r = client.post(
        "/api/auth/register",
        json={"full_name": "A", "email": "a@x.com", "password": "password123", "confirm_password": "other12345"},
    )
    assert set(r.json["error"]["fields"]) == {"confirm_password"}


def test_garbage_body_gives_validation_error_not_500(client):
    r = client.post("/api/auth/register", data="not json", content_type="text/plain")
    assert r.status_code == 400


def test_health(client):
    assert client.get("/api/health").json == {"status": "ok"}


# ---- users --------------------------------------------------------------

def test_edit_user_validation_and_missing_user(ann):
    me = ann.get("/api/auth/me").json
    bad = ann.put(f"/api/users/{me['id']}", json={"full_name": "", "email": "nope"})
    assert bad.status_code == 400 and set(bad.json["error"]["fields"]) == {"full_name", "email"}
    assert ann.put("/api/users/9999", json={"full_name": "A", "email": "a@x.com"}).status_code == 404
    assert ann.delete("/api/users/9999").status_code == 404


def test_can_keep_own_email_when_editing(ann):
    me = ann.get("/api/auth/me").json
    r = ann.put(f"/api/users/{me['id']}", json={"full_name": "New Name", "email": me["email"]})
    assert r.status_code == 200 and r.json["full_name"] == "New Name"


def test_deleting_yourself_logs_you_out(ann):
    me = ann.get("/api/auth/me").json
    assert ann.delete(f"/api/users/{me['id']}").status_code == 204
    assert ann.get("/api/auth/me").status_code == 401


def test_deleting_user_removes_messages_documents_files_and_shares(client, app):
    register(client)
    register(client, "Bob", "bob@example.com")
    login(client, "bob@example.com")
    doc = upload(client).json
    client.post("/api/messages", json={"body": "bye"})
    ann_id = None
    with app.app_context():
        ann_id = User.query.filter_by(email="ann@example.com").one().id
        stored = Document.query.one().stored_name
    client.post(f"/api/documents/{doc['id']}/shares", json={"user_id": ann_id})
    bob_id = client.get("/api/auth/me").json["id"]
    path = os.path.join(app.config["UPLOAD_FOLDER"], stored)
    assert os.path.exists(path)

    assert client.delete(f"/api/users/{bob_id}").status_code == 204
    with app.app_context():
        assert Document.query.count() == 0
        assert Message.query.count() == 0
        assert Share.query.count() == 0
    assert not os.path.exists(path)


# ---- messages -----------------------------------------------------------

def test_message_length_limits(ann):
    assert ann.post("/api/messages", json={"body": "x" * 1000}).status_code == 201
    too_long = ann.post("/api/messages", json={"body": "x" * 1001})
    assert too_long.status_code == 400 and "body" in too_long.json["error"]["fields"]
    assert ann.post("/api/messages", json={}).status_code == 400


def test_messages_require_login(client):
    assert client.get("/api/messages").status_code == 401
    assert client.post("/api/messages", json={"body": "hi"}).status_code == 401


def test_messages_return_latest_100_oldest_first(ann):
    for i in range(105):
        ann.post("/api/messages", json={"body": f"m{i}"})
    bodies = [m["body"] for m in ann.get("/api/messages").json]
    assert len(bodies) == 100 and bodies[0] == "m5" and bodies[-1] == "m104"


# ---- documents ----------------------------------------------------------

def test_upload_requires_login(client):
    assert upload(client).status_code == 401


def test_upload_requires_description_and_file(ann):
    no_desc = ann.post("/api/documents", data={"description": " "}, content_type="multipart/form-data")
    assert no_desc.status_code == 400 and "description" in no_desc.json["error"]["fields"]
    no_file = ann.post("/api/documents", data={"description": "x"}, content_type="multipart/form-data")
    assert no_file.status_code == 400 and "file" in no_file.json["error"]["fields"]


def test_upload_too_large_returns_413(app, ann):
    app.config["MAX_CONTENT_LENGTH"] = 1024
    r = upload(ann, content=b"x" * 5000)
    assert r.status_code == 413 and r.json["error"]["code"] == "file_too_large"


def test_stored_file_has_random_name_and_safe_display_name(ann, app):
    doc = upload(ann, name="../../etc/passwd.txt").json
    assert "/" not in doc["file_name"] and ".." not in doc["file_name"]
    with app.app_context():
        stored = db.session.get(Document, doc["id"]).stored_name
    assert len(stored) == 32 and "." not in stored
    assert os.path.exists(os.path.join(app.config["UPLOAD_FOLDER"], stored))


def test_delete_document_removes_file_from_disk(ann, app):
    doc = upload(ann).json
    with app.app_context():
        path = os.path.join(app.config["UPLOAD_FOLDER"], db.session.get(Document, doc["id"]).stored_name)
    assert os.path.exists(path)
    assert ann.delete(f"/api/documents/{doc['id']}").status_code == 204
    assert not os.path.exists(path)
    assert ann.get(f"/api/documents/{doc['id']}/download").status_code == 404


def test_edit_document_description(ann):
    doc = upload(ann).json
    ok = ann.put(f"/api/documents/{doc['id']}", json={"description": "Renamed"})
    assert ok.json["description"] == "Renamed"
    assert ann.put(f"/api/documents/{doc['id']}", json={"description": ""}).status_code == 400
    assert ann.put("/api/documents/9999", json={"description": "x"}).status_code == 404


def test_non_owner_cannot_manage_shares(client):
    register(client)
    register(client, "Bob", "bob@example.com")
    login(client)
    doc = upload(client).json
    client.post("/api/auth/logout")
    login(client, "bob@example.com")
    assert client.get(f"/api/documents/{doc['id']}/shares").status_code == 403
    assert client.post(f"/api/documents/{doc['id']}/shares", json={"user_id": 1}).status_code == 403
    assert client.delete(f"/api/documents/{doc['id']}/shares/2").status_code == 403


def test_share_candidates_exclude_self_and_already_shared(client):
    register(client)
    register(client, "Bob", "bob@example.com")
    register(client, "Cy", "cy@example.com")
    login(client)
    doc = upload(client).json
    users = {u["email"]: u["id"] for u in client.get("/api/users").json}
    before = client.get(f"/api/documents/{doc['id']}/shares").json
    assert {u["email"] for u in before["candidates"]} == {"bob@example.com", "cy@example.com"}
    client.post(f"/api/documents/{doc['id']}/shares", json={"user_id": users["bob@example.com"]})
    after = client.get(f"/api/documents/{doc['id']}/shares").json
    assert [u["email"] for u in after["shared_with"]] == ["bob@example.com"]
    assert [u["email"] for u in after["candidates"]] == ["cy@example.com"]


def test_cannot_share_with_self_or_unknown_user(ann):
    doc = upload(ann).json
    me = ann.get("/api/auth/me").json["id"]
    assert ann.post(f"/api/documents/{doc['id']}/shares", json={"user_id": me}).status_code == 400
    assert ann.post(f"/api/documents/{doc['id']}/shares", json={"user_id": 9999}).status_code == 400
    assert ann.post(f"/api/documents/{doc['id']}/shares", json={"user_id": "2"}).status_code == 400
    assert ann.delete(f"/api/documents/{doc['id']}/shares/9999").status_code == 404


def test_removed_share_loses_download_access(client):
    register(client)
    register(client, "Bob", "bob@example.com")
    login(client)
    doc = upload(client).json
    bob_id = next(u["id"] for u in client.get("/api/users").json if u["email"] == "bob@example.com")
    client.post(f"/api/documents/{doc['id']}/shares", json={"user_id": bob_id})
    client.delete(f"/api/documents/{doc['id']}/shares/{bob_id}")
    client.post("/api/auth/logout")
    login(client, "bob@example.com")
    assert client.get(f"/api/documents/{doc['id']}/download").status_code == 403
    assert client.get("/api/documents").json["shared"] == []
