import asyncio
import random
import httpx

BASE_URL = "https://mirage-backend-sw2n.onrender.com"

PERSONAS = [
    {"email": "alex@mirage.demo", "username": "alex_trader", "full_name": "Alex Thompson"},
    {"email": "sam@mirage.demo", "username": "sam_normal", "full_name": "Sam Johnson"},
    {"email": "riley@mirage.demo", "username": "riley_gambler", "full_name": "Riley Chen"},
    {"email": "morgan@mirage.demo", "username": "morgan_impulsive", "full_name": "Morgan Davis"},
    {"email": "jordan@mirage.demo", "username": "jordan_scam", "full_name": "Jordan Williams"},
]

async def main():
    print(f"Creating users on {BASE_URL}...")
    async with httpx.AsyncClient(timeout=30) as client:
        for p in PERSONAS:
            try:
                r = await client.post(f"{BASE_URL}/api/auth/register", json={
                    "email": p["email"],
                    "username": p["username"],
                    "full_name": p["full_name"],
                    "password": "Demo1234!"
                })
                if r.status_code in (200, 201):
                    print(f"✅ Created: {p['username']}")
                else:
                    print(f"⚠️ {p['username']}: {r.text[:50]}")
            except Exception as e:
                print(f"❌ {p['username']}: {e}")

asyncio.run(main())
