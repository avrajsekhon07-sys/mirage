#!/usr/bin/env python3
"""
Mirage — Sample Data Generator
───────────────────────────────
Populates the database with realistic demo data for testing.
Run after `docker-compose up` once the backend is healthy.

Usage:
    python scripts/generate_sample_data.py
    python scripts/generate_sample_data.py --users 20 --days 30
"""

import argparse
import asyncio
import random
import sys
from datetime import datetime, timedelta

import httpx

BASE_URL = "http://localhost:8000"

PERSONAS = [
    {"email": "alice@demo.com", "username": "alice_normal", "full_name": "Alice Chen", "type": "normal"},
    {"email": "bob@demo.com", "username": "bob_gambler", "full_name": "Bob Martinez", "type": "gambler"},
    {"email": "carol@demo.com", "username": "carol_trader", "full_name": "Carol Johnson", "type": "emotional_trader"},
    {"email": "dave@demo.com", "username": "dave_impulsive", "full_name": "Dave Williams", "type": "impulsive"},
    {"email": "eve@demo.com", "username": "eve_scam", "full_name": "Eve Thompson", "type": "scam_victim"},
    # Admin user
    {"email": "admin@mirage.io", "username": "mirage_admin", "full_name": "System Admin", "type": "normal", "is_admin": True},
]

TRANSACTION_PROFILES = {
    "normal": {
        "amounts": (20, 200, 0.3),  # min, max, late_night_prob
        "categories": ["retail", "food", "entertainment", "subscription", "transfer"],
        "weights": [0.35, 0.30, 0.15, 0.10, 0.10],
        "daily_tx": (1, 4),
    },
    "gambler": {
        "amounts": (50, 5000, 0.5),
        "categories": ["gambling", "crypto", "transfer", "retail"],
        "weights": [0.60, 0.20, 0.12, 0.08],
        "daily_tx": (3, 15),
    },
    "emotional_trader": {
        "amounts": (100, 10000, 0.4),
        "categories": ["crypto", "investment", "transfer", "retail"],
        "weights": [0.55, 0.25, 0.12, 0.08],
        "daily_tx": (2, 10),
    },
    "impulsive": {
        "amounts": (30, 2000, 0.25),
        "categories": ["retail", "entertainment", "gambling", "food", "crypto"],
        "weights": [0.40, 0.25, 0.15, 0.12, 0.08],
        "daily_tx": (2, 12),
    },
    "scam_victim": {
        "amounts": (500, 20000, 0.6),
        "categories": ["transfer", "crypto", "unknown"],
        "weights": [0.50, 0.30, 0.20],
        "daily_tx": (1, 5),
    },
}

MERCHANTS = {
    "gambling": ["BetWay", "Casino Royale", "PokerStars", "Bet365", "DraftKings", "FanDuel"],
    "crypto": ["Binance", "Coinbase", "Kraken", "Bybit", "KuCoin", "OKX"],
    "retail": ["Amazon", "Walmart", "Target", "Best Buy", "ASOS", "Nike", "Zara"],
    "food": ["Uber Eats", "DoorDash", "McDonald's", "Starbucks", "Chipotle", "Grubhub"],
    "entertainment": ["Netflix", "Spotify", "Steam", "PlayStation", "Xbox", "Ticketmaster"],
    "transfer": ["Wire Transfer", "Zelle", "Venmo", "PayPal", "CashApp", "Wise"],
    "investment": ["Robinhood", "E*TRADE", "Fidelity", "Charles Schwab", "TD Ameritrade"],
    "subscription": ["Adobe", "Microsoft 365", "iCloud", "Google One", "Dropbox"],
    "unknown": ["Unknown Vendor", "Foreign Merchant", "Unverified Payee"],
}


async def register_user(client: httpx.AsyncClient, user: dict) -> dict | None:
    """Register a user and return token + user data."""
    try:
        resp = await client.post(f"{BASE_URL}/api/auth/register", json={
            "email": user["email"],
            "username": user["username"],
            "full_name": user["full_name"],
            "password": "Demo1234!",
        })
        if resp.status_code in (200, 201):
            data = resp.json()
            print(f"  ✅ Created user: {user['username']}")
            return data
        elif resp.status_code == 400 and "already" in resp.text.lower():
            # User exists — login instead
            resp2 = await client.post(f"{BASE_URL}/api/auth/login", json={
                "email": user["email"],
                "password": "Demo1234!",
            })
            if resp2.status_code == 200:
                data = resp2.json()
                print(f"  ⚠️  User exists, logged in: {user['username']}")
                return data
        else:
            print(f"  ❌ Failed to create {user['username']}: {resp.text}")
    except Exception as e:
        print(f"  ❌ Error creating {user['username']}: {e}")
    return None


async def generate_transactions(
    client: httpx.AsyncClient,
    token: str,
    persona_type: str,
    days: int = 30,
):
    """Generate synthetic transactions for a user."""
    profile = TRANSACTION_PROFILES.get(persona_type, TRANSACTION_PROFILES["normal"])
    headers = {"Authorization": f"Bearer {token}"}
    tx_count = 0

    now = datetime.utcnow()

    for day_offset in range(days, 0, -1):
        day = now - timedelta(days=day_offset)
        daily_count = random.randint(*profile["daily_tx"])

        for _ in range(daily_count):
            # Determine hour
            amt_min, amt_max, late_prob = profile["amounts"]
            if random.random() < late_prob:
                hour = random.choice([23, 0, 1, 2, 3, 4])
            else:
                hour = random.randint(8, 22)

            timestamp = day.replace(
                hour=hour,
                minute=random.randint(0, 59),
                second=random.randint(0, 59),
                microsecond=0,
            )

            # Category
            category = random.choices(profile["categories"], weights=profile["weights"])[0]
            merchant = random.choice(MERCHANTS.get(category, ["Unknown"]))

            # Amount — occasionally escalate
            amount = random.uniform(amt_min, amt_max)
            if random.random() < 0.1:  # 10% chance of escalation
                amount *= random.uniform(1.5, 4.0)
            amount = round(amount, 2)

            try:
                resp = await client.post(
                    f"{BASE_URL}/api/transactions/",
                    json={
                        "amount": amount,
                        "merchant": merchant,
                        "category": category,
                        "description": f"{merchant} payment",
                        "timestamp": timestamp.isoformat(),
                    },
                    headers=headers,
                )
                if resp.status_code == 201:
                    tx_count += 1
            except Exception:
                pass

    print(f"    📊 Generated {tx_count} transactions ({days} days)")


async def main(args):
    print("\n🚀 Mirage Sample Data Generator")
    print(f"   Target: {BASE_URL}")
    print(f"   Days of history: {args.days}")
    print()

    # Wait for backend
    print("⏳ Waiting for backend to be ready...")
    async with httpx.AsyncClient(timeout=30) as client:
        for attempt in range(12):
            try:
                resp = await client.get(f"{BASE_URL}/api/health")
                if resp.status_code == 200:
                    print("✅ Backend is ready!\n")
                    break
            except Exception:
                pass
            await asyncio.sleep(5)
            print(f"   Attempt {attempt + 1}/12...")
        else:
            print("❌ Backend not reachable. Make sure docker-compose is running.")
            sys.exit(1)

    # Create users and generate data
    print("👥 Creating demo users...\n")
    async with httpx.AsyncClient(timeout=60) as client:
        for persona in PERSONAS:
            print(f"Processing: {persona['username']} ({persona['type']})")
            auth_data = await register_user(client, persona)

            if auth_data:
                token = auth_data["access_token"]
                await generate_transactions(client, token, persona["type"], days=args.days)

                # Trigger risk score computation
                try:
                    await client.post(
                        f"{BASE_URL}/api/analytics/risk-score/refresh",
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    print("    🧠 Risk score computed")
                except Exception:
                    pass

            print()

    print("✅ Sample data generation complete!")
    print("\nDemo credentials:")
    print("  Email: alex@mirage.demo  |  Password: Demo1234!")
    print("  Email: admin@mirage.io   |  Password: Demo1234!")
    print(f"\n🌐 Open http://localhost:3000 to access the platform\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Mirage sample data")
    parser.add_argument("--days", type=int, default=30, help="Days of transaction history (default: 30)")
    args = parser.parse_args()
    asyncio.run(main(args))
