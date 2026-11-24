"""Happy-path and permission tests that walk through the main flows."""
import io

from conftest import login, register


def test_register_validation_and_login(client):
    r = client.post(
        "/api/auth/register",
        json={"full_name": "", "email": "bad", "password": "x", "confirm_password": "y"},
    )
    assert r.status_code == 400
    assert set(r.json["error"]["fields"]) == {"full_name", "email", "password", "confirm_password"}
    first = register(client)
    assert first.status_code == 201 and "password" not in first.json
    assert register(client).status_code == 400  # duplicate email
    assert login(client, pw="wrongwrong").status_code == 401
    assert login(client).status_code == 200
    assert client.get("/api/auth/me").json["email"] == "ann@example.com"
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_users_require_login_and_crud(client):
    assert client.get("/api/users").status_code == 401
    register(client)
    register(client, "Bob", "bob@example.com")
    login(client)
    users = client.get("/api/users").json
    assert len(users) == 2 and all("password_hash" not in u for u in users)
    bob = next(u for u in users if u["email"] == "bob@example.com")
    clash = client.put(f"/api/users/{bob['id']}", json={"full_name": "Bobby", "email": "ann@example.com"})
    assert clash.status_code == 409
    ok = client.put(f"/api/users/{bob['id']}", json={"full_name": "Bobby", "email": "bob@example.com"})
    assert ok.json["full_name"] == "Bobby"
    assert client.delete(f"/api/users/{bob['id']}").status_code == 204
    assert client.get(f"/api/users/{bob['id']}").status_code == 404


def test_messages(client):
    register(client)
    login(client)
    assert client.post("/api/messages", json={"body": "  "}).status_code == 400
    first = client.post("/api/messages", json={"body": "hello"}).json
    client.post("/api/messages", json={"body": "again"})
    assert [m["body"] for m in client.get("/api/messages").json] == ["hello", "again"]
    assert [m["body"] for m in client.get(f"/api/messages?after_id={first['id']}").json] == ["again"]


def test_documents_ownership_and_sharing(client):
    register(client)
    register(client, "Bob", "bob@example.com")
    register(client, "Cy", "cy@example.com")
    login(client)
    up = client.post(
        "/api/documents",
        data={"description": "Report", "file": (io.BytesIO(b"data"), "r.txt")},
        content_type="multipart/form-data",
    )
    assert up.status_code == 201
    doc_id = up.json["id"]
    bad = client.post(
        "/api/documents",
        data={"description": "x", "file": (io.BytesIO(b"x"), "evil.exe")},
        content_type="multipart/form-data",
    )
    assert bad.status_code == 400
    bob_id = next(u["id"] for u in client.get("/api/users").json if u["email"] == "bob@example.com")
    assert client.post(f"/api/documents/{doc_id}/shares", json={"user_id": bob_id}).status_code == 201
    assert client.post(f"/api/documents/{doc_id}/shares", json={"user_id": bob_id}).status_code == 409
    client.post("/api/auth/logout")

    login(client, "bob@example.com")
    shared = client.get("/api/documents").json["shared"]
    assert shared[0]["shared_by"]["email"] == "ann@example.com"
    assert client.get(f"/api/documents/{doc_id}/download").data == b"data"
    assert client.delete(f"/api/documents/{doc_id}").status_code == 403
    assert client.put(f"/api/documents/{doc_id}", json={"description": "x"}).status_code == 403
    client.post("/api/auth/logout")

    login(client, "cy@example.com")
    assert client.get(f"/api/documents/{doc_id}/download").status_code == 403
    client.post("/api/auth/logout")

    login(client)
    assert client.delete(f"/api/documents/{doc_id}/shares/{bob_id}").status_code == 204
    assert client.delete(f"/api/documents/{doc_id}").status_code == 204
