import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.db.models import User
from app.services.auth_service import get_password_hash, verify_password


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == "test@example.com")
        )

        user = result.scalar_one_or_none()

        if user is None:
            print("USER NOT FOUND")
            return

        new_password = "Test@12345"

        user.hashed_password = get_password_hash(new_password)

        await db.commit()
        await db.refresh(user)

        print("PASSWORD RESET SUCCESSFULLY")
        print("Email:", user.email)
        print("New password:", new_password)

        verified = verify_password(
            new_password,
            user.hashed_password
        )

        print("Password verification:", verified)


asyncio.run(main())