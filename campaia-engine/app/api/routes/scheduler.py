"""
Campaign Scheduler API — CRUD for automated campaign scheduling.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.campaign_schedule import CampaignSchedule
from app.models.user import User

router = APIRouter(prefix="/scheduler", tags=["Campaign Scheduler"])

DAY_NAMES_RO = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]
DAY_NAMES_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class ScheduleRequest(BaseModel):
    is_enabled: bool = True
    days_of_week: list[int] = [0, 1, 2, 3, 4]
    start_time: str = "09:00"
    end_time: str = "21:00"
    timezone: str = "Europe/Bucharest"


class ScheduleResponse(BaseModel):
    id: str
    campaign_id: str
    is_enabled: bool
    days_of_week: list[int]
    days_labels: list[str]
    start_time: str
    end_time: str
    timezone: str

    model_config = {"from_attributes": True}


@router.get("/{campaign_id}", response_model=Optional[ScheduleResponse])
async def get_schedule(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_campaign_ownership(db, campaign_id, current_user)

    result = await db.execute(
        select(CampaignSchedule).where(CampaignSchedule.campaign_id == campaign_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        return None

    return _to_response(schedule)


@router.post("/{campaign_id}", response_model=ScheduleResponse)
async def create_or_update_schedule(
    campaign_id: uuid.UUID,
    req: ScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_campaign_ownership(db, campaign_id, current_user)

    for d in req.days_of_week:
        if d < 0 or d > 6:
            raise HTTPException(422, f"Invalid day: {d}. Must be 0 (Mon) to 6 (Sun).")

    result = await db.execute(
        select(CampaignSchedule).where(CampaignSchedule.campaign_id == campaign_id)
    )
    schedule = result.scalar_one_or_none()

    if schedule:
        schedule.is_enabled = req.is_enabled
        schedule.days_of_week = sorted(set(req.days_of_week))
        schedule.start_time = req.start_time
        schedule.end_time = req.end_time
        schedule.timezone = req.timezone
    else:
        schedule = CampaignSchedule(
            campaign_id=campaign_id,
            is_enabled=req.is_enabled,
            days_of_week=sorted(set(req.days_of_week)),
            start_time=req.start_time,
            end_time=req.end_time,
            timezone=req.timezone,
        )
        db.add(schedule)

    await db.commit()
    await db.refresh(schedule)
    return _to_response(schedule)


@router.delete("/{campaign_id}")
async def delete_schedule(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_campaign_ownership(db, campaign_id, current_user)

    result = await db.execute(
        select(CampaignSchedule).where(CampaignSchedule.campaign_id == campaign_id)
    )
    schedule = result.scalar_one_or_none()
    if schedule:
        await db.delete(schedule)
        await db.commit()

    return {"deleted": True}


async def _verify_campaign_ownership(
    db: AsyncSession, campaign_id: uuid.UUID, user: User
):
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Campaign not found")


def _to_response(s: CampaignSchedule) -> ScheduleResponse:
    return ScheduleResponse(
        id=str(s.id),
        campaign_id=str(s.campaign_id),
        is_enabled=s.is_enabled,
        days_of_week=s.days_of_week,
        days_labels=[DAY_NAMES_RO[d] for d in s.days_of_week],
        start_time=s.start_time,
        end_time=s.end_time,
        timezone=s.timezone,
    )
