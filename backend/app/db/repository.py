from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from app.db.models import User, Resume, Job, MatchResult, Application, CareerGoal, Bookmark, RecruiterProfile, Connection, ApplicationNote

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update(self, user: User) -> User:
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_all_visible(self) -> List[User]:
        """Get all users that have a visible recruiter profile."""
        result = await self.db.execute(
            select(User).join(RecruiterProfile, RecruiterProfile.user_id == User.id)
            .where(RecruiterProfile.is_visible == True)
        )
        return list(result.scalars().all())

class ResumeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, resume: Resume) -> Resume:
        self.db.add(resume)
        await self.db.commit()
        await self.db.refresh(resume)
        return resume

    async def get_by_user_id(self, user_id: str) -> List[Resume]:
        result = await self.db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_latest_by_user_id(self, user_id: str) -> Optional[Resume]:
        result = await self.db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc()).limit(1)
        )
        return result.scalars().first()

    async def get_all_by_user_id(self, user_id: str) -> List[Resume]:
        """Return all resumes for a user, most recent first."""
        result = await self.db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, resume_id: str, user_id: str) -> Optional[Resume]:
        """Fetch a specific resume, ensuring it belongs to the requesting user."""
        result = await self.db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        return result.scalars().first()

class JobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, job: Job) -> Job:
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def get_all(self, limit: int = 50, domain: Optional[str] = None) -> List[Job]:
        query = select(Job)
        if domain and domain != "All":
            query = query.where(Job.domain == domain)
        query = query.order_by(Job.created_at.desc()).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def search(self, query_str: str, domain: Optional[str] = None, limit: int = 50) -> List[Job]:
        from sqlalchemy import or_
        q = select(Job)
        if query_str:
            like = f"%{query_str}%"
            q = q.where(or_(Job.title.ilike(like), Job.company.ilike(like), Job.description.ilike(like)))
        if domain and domain != "All":
            q = q.where(Job.domain == domain)
        q = q.order_by(Job.created_at.desc()).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_by_external_id(self, external_id: str) -> Optional[Job]:
        result = await self.db.execute(select(Job).where(Job.external_id == external_id))
        return result.scalars().first()

    async def get_by_id(self, job_id: str) -> Optional[Job]:
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        return result.scalars().first()

class MatchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_match(self, match: MatchResult) -> MatchResult:
        self.db.add(match)
        await self.db.commit()
        await self.db.refresh(match)
        return match

    async def get_user_matches(self, user_id: str, limit: int = 20) -> List[MatchResult]:
        result = await self.db.execute(
            select(MatchResult)
            .where(MatchResult.user_id == user_id)
            .order_by(MatchResult.overall_match_score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

class ApplicationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, app: Application) -> Application:
        self.db.add(app)
        await self.db.commit()
        await self.db.refresh(app)
        return app

    async def get_by_user_id(self, user_id: str) -> List[Application]:
        result = await self.db.execute(
            select(Application).where(Application.user_id == user_id).order_by(Application.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, app_id: str) -> Optional[Application]:
        result = await self.db.execute(select(Application).where(Application.id == app_id))
        return result.scalars().first()

    async def update_status(self, app_id: str, status: str) -> Optional[Application]:
        app = await self.get_by_id(app_id)
        if app:
            app.status = status
            await self.db.commit()
            await self.db.refresh(app)
        return app

class CareerGoalRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: str) -> Optional[CareerGoal]:
        result = await self.db.execute(select(CareerGoal).where(CareerGoal.user_id == user_id))
        return result.scalars().first()

    async def upsert(self, user_id: str, data: dict) -> CareerGoal:
        goal = await self.get_by_user(user_id)
        if goal:
            for k, v in data.items():
                setattr(goal, k, v)
            goal.updated_at = __import__('datetime').datetime.utcnow()
        else:
            goal = CareerGoal(user_id=user_id, **data)
            self.db.add(goal)
        await self.db.commit()
        await self.db.refresh(goal)
        return goal

class BookmarkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: str) -> List[Bookmark]:
        result = await self.db.execute(
            select(Bookmark).where(Bookmark.user_id == user_id).order_by(Bookmark.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_user_and_job(self, user_id: str, job_id: str) -> Optional[Bookmark]:
        result = await self.db.execute(
            select(Bookmark).where(and_(Bookmark.user_id == user_id, Bookmark.job_id == job_id))
        )
        return result.scalars().first()

    async def create(self, bookmark: Bookmark) -> Bookmark:
        self.db.add(bookmark)
        await self.db.commit()
        await self.db.refresh(bookmark)
        return bookmark

    async def delete(self, bookmark: Bookmark):
        await self.db.delete(bookmark)
        await self.db.commit()

class RecruiterProfileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: str) -> Optional[RecruiterProfile]:
        result = await self.db.execute(select(RecruiterProfile).where(RecruiterProfile.user_id == user_id))
        return result.scalars().first()

    async def upsert(self, user_id: str, data: dict) -> RecruiterProfile:
        profile = await self.get_by_user(user_id)
        if profile:
            for k, v in data.items():
                setattr(profile, k, v)
        else:
            profile = RecruiterProfile(user_id=user_id, **data)
            self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def get_all_visible(self) -> List[RecruiterProfile]:
        result = await self.db.execute(
            select(RecruiterProfile).where(RecruiterProfile.is_visible == True)
        )
        return list(result.scalars().all())

class ConnectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, conn: Connection) -> Connection:
        self.db.add(conn)
        await self.db.commit()
        await self.db.refresh(conn)
        return conn

    async def get_by_users(self, requester_id: str, target_id: str) -> Optional[Connection]:
        result = await self.db.execute(
            select(Connection).where(
                and_(Connection.requester_id == requester_id, Connection.target_id == target_id)
            )
        )
        return result.scalars().first()

    async def get_received(self, user_id: str) -> List[Connection]:
        result = await self.db.execute(
            select(Connection).where(Connection.target_id == user_id).order_by(Connection.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_sent(self, user_id: str) -> List[Connection]:
        result = await self.db.execute(
            select(Connection).where(Connection.requester_id == user_id).order_by(Connection.created_at.desc())
        )
        return list(result.scalars().all())

    async def update_status(self, conn_id: str, status: str) -> Optional[Connection]:
        result = await self.db.execute(select(Connection).where(Connection.id == conn_id))
        conn = result.scalars().first()
        if conn:
            conn.status = status
            await self.db.commit()
            await self.db.refresh(conn)
        return conn


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

class ResumeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, resume: Resume) -> Resume:
        self.db.add(resume)
        await self.db.commit()
        await self.db.refresh(resume)
        return resume

    async def get_by_user_id(self, user_id: str) -> List[Resume]:
        result = await self.db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_latest_by_user_id(self, user_id: str) -> Optional[Resume]:
        result = await self.db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc()).limit(1)
        )
        return result.scalars().first()

    async def get_all_by_user_id(self, user_id: str) -> List[Resume]:
        """Return all resumes for a user, most recent first."""
        result = await self.db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, resume_id: str, user_id: str) -> Optional[Resume]:
        """Fetch a specific resume, ensuring it belongs to the requesting user."""
        result = await self.db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        return result.scalars().first()

class JobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, job: Job) -> Job:
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def get_all(self, limit: int = 50, domain: Optional[str] = None) -> List[Job]:
        query = select(Job)
        if domain and domain != "All":
            query = query.where(Job.domain == domain)
        query = query.order_by(Job.created_at.desc()).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_external_id(self, external_id: str) -> Optional[Job]:
        result = await self.db.execute(select(Job).where(Job.external_id == external_id))
        return result.scalars().first()

    async def get_by_id(self, job_id: str) -> Optional[Job]:
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        return result.scalars().first()

class MatchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_match(self, match: MatchResult) -> MatchResult:
        self.db.add(match)
        await self.db.commit()
        await self.db.refresh(match)
        return match

    async def get_user_matches(self, user_id: str, limit: int = 20) -> List[MatchResult]:
        result = await self.db.execute(
            select(MatchResult)
            .where(MatchResult.user_id == user_id)
            .order_by(MatchResult.overall_match_score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

class ApplicationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, app: Application) -> Application:
        self.db.add(app)
        await self.db.commit()
        await self.db.refresh(app)
        return app

    async def get_by_user_id(self, user_id: str) -> List[Application]:
        result = await self.db.execute(
            select(Application).where(Application.user_id == user_id).order_by(Application.created_at.desc())
        )
        return list(result.scalars().all())
