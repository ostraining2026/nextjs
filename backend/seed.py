"""Local development seed data ONLY. Run from backend/:  python seed.py"""
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import Message, User

app = create_app()
with app.app_context():
    db.create_all()
    if User.query.count() == 0:
        users = [
            User(full_name="Alice Demo", email="alice@example.com", password_hash=generate_password_hash("password123")),
            User(full_name="Bob Demo", email="bob@example.com", password_hash=generate_password_hash("password123")),
        ]
        db.session.add_all(users)
        db.session.flush()
        db.session.add(Message(user_id=users[0].id, body="Welcome to the group chat!"))
        db.session.commit()
        print("Seeded alice@example.com and bob@example.com (password: password123)")
    else:
        print("Users already exist; nothing seeded.")
