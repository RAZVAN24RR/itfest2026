"""
Seed demo community campaigns for map + analytics (user: razvanandreipasaran@gmail.com).
Run: cd campaia-engine && poetry run python scripts/seed_community_map_demo.py
Requires: DB up, migration c3d4e5f6a7b8 applied.
"""
import asyncio
import uuid
from decimal import Decimal

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models.campaign import Campaign, CampaignStatus
from app.models.user import User

DEMO = [
    ("Campanie Donare Sânge — București", "blood_donation", "București", 44.4268, 26.1025, 120, 18420, 612, 89, Decimal("42.50")),
    ("Hackathon Social — Cluj", "hackathon", "Cluj-Napoca", 46.7712, 23.5901, 150, 42300, 1455, 210, Decimal("58.20")),
    ("Voluntariat Curățenie — Timișoara", "volunteering", "Timișoara", 45.7489, 21.2087, 80, 28900, 890, 134, Decimal("31.00")),
    ("Maraton Caritabil — Iași", "marathon", "Iași", 47.1585, 27.5681, 200, 67200, 2100, 340, Decimal("89.90")),
    ("Strângere fonduri — Constanța", "charity", "Constanța", 44.1598, 28.6348, 100, 35600, 980, 156, Decimal("45.00")),
    ("Workshop Educație — Brașov", "education", "Brașov", 45.6427, 25.5887, 90, 19800, 520, 78, Decimal("28.40")),
    ("Adunare civică — Oradea", "community_gathering", "Oradea", 47.0465, 21.919, 70, 12400, 310, 45, Decimal("22.10")),
    ("Reciclare cartier — Sibiu", "recycling", "Sibiu", 45.7983, 24.1256, 85, 21500, 645, 92, Decimal("33.75")),
    ("Screening sănătate — Craiova", "health", "Craiova", 44.3302, 23.7949, 110, 30100, 903, 121, Decimal("51.00")),
    ("Festival cultură — Galați", "culture", "Galați", 45.4353, 28.008, 95, 45200, 1356, 198, Decimal("62.30")),
    ("Adăpost animale — București", "animal_rescue", "București", 44.4520, 26.0820, 75, 16700, 501, 67, Decimal("26.00")),
    ("Colectă urgență — Timișoara", "disaster_relief", "Timișoara", 45.7556, 21.2290, 130, 52800, 1848, 256, Decimal("71.50")),
]


async def main() -> None:
    async with async_session_maker() as db:
        r = await db.execute(select(User).where(User.email == "razvanandreipasaran@gmail.com"))
        user = r.scalar_one_or_none()
        if not user:
            print("User razvanandreipasaran@gmail.com not found — register first.")
            return
        for name, ev, city, lat, lng, budget, imp, clk, shr, spend in DEMO:
            exists = await db.execute(
                select(Campaign).where(Campaign.user_id == user.id, Campaign.name == name)
            )
            if exists.scalar_one_or_none():
                print("skip", name)
                continue
            c = Campaign(
                id=uuid.uuid4(),
                user_id=user.id,
                name=name,
                url=f"https://campaia.ai/demo/{ev}",
                budget=Decimal(str(budget)),
                duration=14,
                product_desc=f"Demo {ev} în {city}",
                status=CampaignStatus.ACTIVE.value,
                event_type=ev,
                lat=lat,
                lng=lng,
                city=city,
                stats_impressions=imp,
                stats_clicks=clk,
                stats_shares=shr,
                stats_spend_ron=spend,
            )
            db.add(c)
        await db.commit()
        print("Seeded", len(DEMO), "demo campaigns for", user.email)


if __name__ == "__main__":
    asyncio.run(main())
