"""Swagger / OpenAPI documentation endpoints."""
import re


def test_swagger_ui_page_is_public(client):
    r = client.get("/api/docs")
    assert r.status_code == 200
    assert b"SwaggerUIBundle" in r.data and b"/api/openapi.json" in r.data


def test_openapi_json_is_valid_shape(client):
    spec = client.get("/api/openapi.json").json
    assert spec["openapi"].startswith("3.")
    assert spec["info"]["title"]
    assert "cookieAuth" in spec["components"]["securitySchemes"]


def test_every_api_route_is_documented(app, client):
    """Fails when someone adds a Flask route but forgets to add it to the Swagger spec."""
    documented = set()
    for path, ops in client.get("/api/openapi.json").json["paths"].items():
        for method in ops:
            documented.add((method.upper(), "/api" + path))

    skipped = {"/api/docs", "/api/openapi.json", "/api/health"}
    actual = set()
    for rule in app.url_map.iter_rules():
        if not rule.rule.startswith("/api") or rule.rule in skipped:
            continue
        path = re.sub(r"<(?:int:)?(\w+)>", r"{\1}", rule.rule)
        for method in rule.methods - {"HEAD", "OPTIONS"}:
            actual.add((method, path))

    # path parameter names differ (doc_id/target_id vs id/user_id), so compare by shape
    def shape(items):
        return {(m, re.sub(r"\{\w+\}", "{}", p)) for m, p in items}

    assert shape(actual) == shape(documented)
