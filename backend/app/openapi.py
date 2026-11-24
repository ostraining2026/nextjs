"""OpenAPI 3 description of the API, served as Swagger UI at /api/docs.

Keep this file in step with docs/api-contract.md when an endpoint changes.
"""
from flask import Blueprint, jsonify

bp = Blueprint("docs", __name__, url_prefix="/api")

SWAGGER_UI_VERSION = "5.17.14"

_ref = lambda name: {"$ref": f"#/components/schemas/{name}"}  # noqa: E731


def _json_body(schema: dict, required: bool = True) -> dict:
    return {"required": required, "content": {"application/json": {"schema": schema}}}


def _ok(code: str, description: str, schema: dict | None = None) -> dict:
    resp: dict = {"description": description}
    if schema:
        resp["content"] = {"application/json": {"schema": schema}}
    return {code: resp}


_ERR = {"description": "Error", "content": {"application/json": {"schema": _ref("Error")}}}
_ERRORS = {
    "400": {**_ERR, "description": "Validation error"},
    "401": {**_ERR, "description": "Not logged in"},
    "403": {**_ERR, "description": "Not allowed (not the owner / no access)"},
    "404": {**_ERR, "description": "Not found"},
}


def _id_param(name: str = "id", where: str = "path") -> dict:
    return {"name": name, "in": where, "required": True, "schema": {"type": "integer"}}


def _op(summary: str, tag: str, responses: dict, *, auth: bool = True, body: dict | None = None,
        params: list | None = None, errors: tuple = ()) -> dict:
    op: dict = {"summary": summary, "tags": [tag], "responses": dict(responses)}
    if auth:
        op["security"] = [{"cookieAuth": []}]
        op["responses"]["401"] = _ERRORS["401"]
    for code in errors:
        op["responses"][code] = _ERRORS[code]
    if body:
        op["requestBody"] = body
    if params:
        op["parameters"] = params
    return op


def build_spec() -> dict:
    user_in = _json_body(
        {"type": "object", "required": ["full_name", "email"],
         "properties": {"full_name": {"type": "string"}, "email": {"type": "string", "format": "email"}}}
    )
    description_in = _json_body(
        {"type": "object", "required": ["description"], "properties": {"description": {"type": "string", "maxLength": 255}}}
    )
    user_ok = _ok("200", "User", _ref("User"))
    no_content = _ok("204", "Done")
    doc_id = _id_param("id")

    return {
        "openapi": "3.0.3",
        "info": {
            "title": "Communications Application API",
            "version": "1.0.0",
            "description": (
                "Flask JSON API. **How to try it:** run `POST /auth/login` below first (the browser then keeps the "
                "session cookie), then call any other endpoint with *Try it out*. Seed users after `python seed.py`: "
                "`alice@example.com` / `password123`."
            ),
        },
        "servers": [{"url": "/api", "description": "This server"}],
        "tags": [{"name": n} for n in ("Auth", "Users", "Messages", "Documents", "Sharing")],
        "components": {
            "securitySchemes": {"cookieAuth": {"type": "apiKey", "in": "cookie", "name": "session"}},
            "schemas": {
                "User": {"type": "object", "properties": {
                    "id": {"type": "integer"}, "full_name": {"type": "string"}, "email": {"type": "string"}}},
                "Message": {"type": "object", "properties": {
                    "id": {"type": "integer"}, "user_id": {"type": "integer"}, "full_name": {"type": "string"},
                    "body": {"type": "string"}, "created_at": {"type": "string", "format": "date-time"}}},
                "Document": {"type": "object", "properties": {
                    "id": {"type": "integer"}, "description": {"type": "string"}, "file_name": {"type": "string"},
                    "size": {"type": "integer"}, "created_at": {"type": "string", "format": "date-time"}}},
                "SharedDocument": {"allOf": [_ref("Document"), {"type": "object", "properties": {
                    "shared_by": {"type": "object", "properties": {
                        "full_name": {"type": "string"}, "email": {"type": "string"}}}}}]},
                "Error": {"type": "object", "properties": {"error": {"type": "object", "properties": {
                    "code": {"type": "string"}, "message": {"type": "string"},
                    "fields": {"type": "object", "additionalProperties": {"type": "string"}}}}}},
            },
        },
        "paths": {
            "/auth/register": {"post": _op(
                "Register a new user", "Auth", _ok("201", "Created", _ref("User")), auth=False, errors=("400",),
                body=_json_body({"type": "object", "required": ["full_name", "email", "password", "confirm_password"],
                                 "properties": {"full_name": {"type": "string"},
                                                "email": {"type": "string", "format": "email"},
                                                "password": {"type": "string", "minLength": 8, "format": "password"},
                                                "confirm_password": {"type": "string", "format": "password"}}}))},
            "/auth/login": {"post": _op(
                "Log in (sets the session cookie)", "Auth", {**_ok("200", "Logged in", _ref("User")),
                                                          "401": _ERRORS["401"]}, auth=False,
                body=_json_body({"type": "object", "required": ["email", "password"],
                                 "properties": {"email": {"type": "string", "format": "email"},
                                                "password": {"type": "string", "format": "password"}}}))},
            "/auth/logout": {"post": _op("Log out", "Auth", no_content, auth=False)},
            "/auth/me": {"get": _op("Current user", "Auth", _ok("200", "User", _ref("User")))},
            "/users": {"get": _op("List users", "Users", _ok("200", "Users", {"type": "array", "items": _ref("User")}))},
            "/users/{id}": {
                "get": _op("Get a user", "Users", user_ok, params=[_id_param()], errors=("404",)),
                "put": _op("Edit a user", "Users", {**user_ok, "409": {**_ERR, "description": "Email already used"}},
                           params=[_id_param()], body=user_in, errors=("400", "404")),
                "delete": _op("Delete a user (also removes their messages, files and shares)", "Users", no_content,
                              params=[_id_param()], errors=("404",)),
            },
            "/messages": {
                "get": _op("List chat messages (latest 100, oldest first)", "Messages",
                           _ok("200", "Messages", {"type": "array", "items": _ref("Message")}),
                           params=[{"name": "after_id", "in": "query", "schema": {"type": "integer"},
                                    "description": "Only messages with a larger id"}]),
                "post": _op("Send a message", "Messages", _ok("201", "Created", _ref("Message")), errors=("400",),
                            body=_json_body({"type": "object", "required": ["body"],
                                             "properties": {"body": {"type": "string", "minLength": 1,
                                                                     "maxLength": 1000}}})),
            },
            "/documents": {
                "get": _op("My uploads and files shared with me", "Documents", _ok("200", "Documents", {
                    "type": "object", "properties": {"mine": {"type": "array", "items": _ref("Document")},
                                                     "shared": {"type": "array", "items": _ref("SharedDocument")}}})),
                "post": _op("Upload a file (max 10 MB, allow-listed types)", "Documents",
                            _ok("201", "Created", _ref("Document")), errors=("400",),
                            body={"required": True, "content": {"multipart/form-data": {"schema": {
                                "type": "object", "required": ["description", "file"],
                                "properties": {"description": {"type": "string", "maxLength": 255},
                                               "file": {"type": "string", "format": "binary"}}}}}}),
            },
            "/documents/{id}": {
                "put": _op("Edit the description (owner only)", "Documents", _ok("200", "Document", _ref("Document")),
                           params=[doc_id], body=description_in, errors=("400", "403", "404")),
                "delete": _op("Delete a document and its file (owner only)", "Documents", no_content,
                              params=[doc_id], errors=("403", "404")),
            },
            "/documents/{id}/download": {"get": _op(
                "Download (owner or shared-with user)", "Documents",
                {"200": {"description": "The file", "content": {"application/octet-stream": {
                    "schema": {"type": "string", "format": "binary"}}}}}, params=[doc_id], errors=("403", "404"))},
            "/documents/{id}/shares": {
                "get": _op("Who it is shared with, and who it can still be shared with (owner only)", "Sharing",
                           _ok("200", "Shares", {"type": "object", "properties": {
                               "shared_with": {"type": "array", "items": _ref("User")},
                               "candidates": {"type": "array", "items": _ref("User")}}}),
                           params=[doc_id], errors=("403", "404")),
                "post": _op("Share with a user (owner only)", "Sharing",
                            {**_ok("201", "Shared"), "409": {**_ERR, "description": "Already shared"}},
                            params=[doc_id], errors=("400", "403", "404"),
                            body=_json_body({"type": "object", "required": ["user_id"],
                                             "properties": {"user_id": {"type": "integer"}}})),
            },
            "/documents/{id}/shares/{user_id}": {"delete": _op(
                "Remove a share (owner only)", "Sharing", no_content,
                params=[doc_id, _id_param("user_id")], errors=("403", "404"))},
        },
    }


@bp.get("/openapi.json")
def openapi_json():
    return jsonify(build_spec())


@bp.get("/docs")
def swagger_ui():
    base = f"https://cdn.jsdelivr.net/npm/swagger-ui-dist@{SWAGGER_UI_VERSION}"
    return (
        "<!doctype html><html lang='en'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>Communications API docs</title>"
        f"<link rel='stylesheet' href='{base}/swagger-ui.css'></head>"
        "<body><div id='swagger-ui'></div>"
        f"<script src='{base}/swagger-ui-bundle.js'></script>"
        "<script>window.ui = SwaggerUIBundle({url: '/api/openapi.json', dom_id: '#swagger-ui', "
        "persistAuthorization: true});</script></body></html>"
    )
