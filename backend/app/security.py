from functools import wraps

from flask import session

from .errors import ApiError
from .extensions import db
from .models import User


def current_user() -> User | None:
    uid = session.get("user_id")
    return db.session.get(User, uid) if uid else None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if user is None:
            raise ApiError(401, "not_logged_in", "Please log in.")
        return fn(user, *args, **kwargs)

    return wrapper
