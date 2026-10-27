import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import User

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()

        if not users:
            print("NO USERS FOUND")
        else:
            for user in users:
                print("ID:", user.id)
                print("EMAIL:", user.email)
                print("PASSWORD HASH:", user.hashed_password)
                print("--------------------")

if __name__ == "__main__":
    asyncio.run(main())