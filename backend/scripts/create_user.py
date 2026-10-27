"""Create a real local account without seeded/demo identities. Run from backend/."""
import getpass
import sys
import uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import app  # initializes schema; does not seed demo accounts
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.governance import User, Role, UserRole


def main():
    email = input('Account email: ').strip().lower()
    name = input('Your name: ').strip()
    password = getpass.getpass('Password (12+ characters): ')
    if '@' not in email or not name or len(password) < 12:
        raise SystemExit('Valid email, name and a password of at least 12 characters are required.')
    if password != getpass.getpass('Confirm password: '):
        raise SystemExit('Passwords do not match.')
    with SessionLocal() as db:
        if db.query(User).filter(User.email == email).first():
            raise SystemExit('Account already exists; no changes made.')
        if not db.query(Role).filter(Role.id == 'DEVELOPER').first():
            db.add(Role(id='DEVELOPER', name='DEVELOPER', description='Local project owner'))
            db.flush()
        user_id = 'user-' + uuid.uuid4().hex
        db.add(User(id=user_id, username=email, email=email, full_name=name,
                    password_hash=hash_password(password), is_active=True))
        db.flush()
        db.add(UserRole(user_id=user_id, role_id='DEVELOPER'))
        db.commit()
    print('Account created. Sign in using your email and password.')


if __name__ == '__main__':
    main()
