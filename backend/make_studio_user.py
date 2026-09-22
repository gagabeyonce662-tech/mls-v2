"""Create or update a Blog Studio test user.

Usage:
    python make_studio_user.py <email> <password> [--staff]

Creates the account if it does not exist, marks it active and verified, and
grants `can_author`. Pass --staff to also grant staff (needed for the team page).
"""
import os
import sys

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402

User = get_user_model()


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 1

    email = sys.argv[1].strip().lower()
    password = sys.argv[2]
    make_staff = "--staff" in sys.argv

    user, created = User.objects.get_or_create(
        email=email,
        defaults={"first_name": "Studio", "last_name": "Author"},
    )
    user.set_password(password)
    user.is_active = True
    user.can_author = True
    if make_staff:
        user.is_staff = True
    user.save()

    print(
        f"{'Created' if created else 'Updated'}: {user.email} "
        f"(can_author={user.can_author}, is_staff={user.is_staff})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
