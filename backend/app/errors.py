from flask import jsonify
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, fields: dict | None = None):
        super().__init__(message)
        self.status, self.code, self.message, self.fields = status, code, message, fields


def error_response(status: int, code: str, message: str, fields: dict | None = None):
    body: dict = {"code": code, "message": message}
    if fields:
        body["fields"] = fields
    return jsonify({"error": body}), status


def register_error_handlers(app) -> None:
    @app.errorhandler(ApiError)
    def _api_error(e: ApiError):
        return error_response(e.status, e.code, e.message, e.fields)

    @app.errorhandler(RequestEntityTooLarge)
    def _too_large(_e):
        return error_response(413, "file_too_large", "File is too large (maximum 10 MB).")

    @app.errorhandler(HTTPException)
    def _http(e: HTTPException):
        return error_response(e.code or 500, (e.name or "error").lower().replace(" ", "_"), e.description or "Error")

    @app.errorhandler(Exception)
    def _unexpected(e: Exception):
        app.logger.exception(e)
        return error_response(500, "server_error", "Something went wrong.")
