"""
Transaction Simulator
─────────────────────
Generates realistic simulated financial transactions for demo/testing.
Simulates multiple user personas with different behavioral patterns.
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.models.models import (
    Transaction, TransactionCategory, User,
    BehavioralProfile, RiskScore, Alert, AlertType, RiskLevel
)
from app.services.risk_service import RiskService

logger = logging.getLogger(__name__)


# ── User Personas ─────────────────────────────────────────────────────────────

PERSONAS = {
    "normal": {
        "weight": 0.40,
        "amount_mean": 75, "amount_std": 40,
        "late_night_prob": 0.05,
        "categories": [
            (TransactionCategory.RETAIL, 0.35),
            (TransactionCategory.FOOD, 0.30),
            (TransactionCategory.ENTERTAINMENT, 0.15),
            (TransactionCategory.SUBSCRIPTION, 0.10),
            (TransactionCategory.TRANSFER, 0.10),
        ],
        "burst_prob": 0.05,
        "escalation_prob": 0.02,
    },
    "impulsive": {
        "weight": 0.20,
        "amount_mean": 200, "amount_std": 150,
        "late_night_prob": 0.25,
        "categories": [
            (TransactionCategory.RETAIL, 0.40),
            (TransactionCategory.ENTERTAINMENT, 0.25),
            (TransactionCategory.FOOD, 0.15),
            (TransactionCategory.CRYPTO, 0.10),
            (TransactionCategory.GAMBLING, 0.10),
        ],
        "burst_prob": 0.40,
        "escalation_prob": 0.30,
    },
    "gambler": {
        "weight": 0.15,
        "amount_mean": 500, "amount_std": 400,
        "late_night_prob": 0.50,
        "categories": [
            (TransactionCategory.GAMBLING, 0.60),
            (TransactionCategory.CRYPTO, 0.20),
            (TransactionCategory.RETAIL, 0.10),
            (TransactionCategory.TRANSFER, 0.10),
        ],
        "burst_prob": 0.60,
        "escalation_prob": 0.50,
    },
    "emotional_trader": {
        "weight": 0.15,
        "amount_mean": 1000, "amount_std": 800,
        "late_night_prob": 0.45,
        "categories": [
            (TransactionCategory.CRYPTO, 0.55),
            (TransactionCategory.INVESTMENT, 0.25),
            (TransactionCategory.TRANSFER, 0.15),
            (TransactionCategory.RETAIL, 0.05),
        ],
        "burst_prob": 0.45,
        "escalation_prob": 0.45,
    },
    "scam_victim": {
        "weight": 0.10,
        "amount_mean": 2000, "amount_std": 1500,
        "late_night_prob": 0.60,
        "categories": [
            (TransactionCategory.TRANSFER, 0.50),
            (TransactionCategory.CRYPTO, 0.30),
            (TransactionCategory.UNKNOWN, 0.20),
        ],
        "burst_prob": 0.20,
        "escalation_prob": 0.70,
    },
}

MERCHANTS = {
    TransactionCategory.GAMBLING: ["BetWay Online", "Casino Royal", "PokerStars", "Bet365", "DraftKings"],
    TransactionCategory.CRYPTO: ["Binance", "Coinbase Pro", "Kraken", "FTX Exchange", "KuCoin", "Bybit"],
    TransactionCategory.RETAIL: ["Amazon", "Walmart", "Target", "Best Buy", "ASOS", "Zara", "Nike"],
    TransactionCategory.FOOD: ["Uber Eats", "DoorDash", "Grubhub", "McDonald's", "Starbucks", "Chipotle"],
    TransactionCategory.ENTERTAINMENT: ["Netflix", "Spotify", "Steam", "PlayStation Store", "Xbox", "Ticketmaster"],
    TransactionCategory.TRANSFER: ["Wire Transfer", "Zelle", "Venmo", "PayPal", "CashApp", "Wise"],
    TransactionCategory.INVESTMENT: ["Robinhood", "E*TRADE", "Fidelity", "Charles Schwab", "TD Ameritrade"],
    TransactionCategory.SUBSCRIPTION: ["Adobe", "Microsoft 365", "iCloud", "Google One", "Dropbox"],
    TransactionCategory.UNKNOWN: ["Unknown Vendor", "Foreign Merchant", "Unverified Payee", "Anonymous"],
}


class TransactionSimulator:
    """Generates and persists simulated transactions, triggering risk analysis."""

    def __init__(self):
        self._running = False
        self._risk_service = None

    def stop(self):
        self._running = False

    async def start(self):
        """Main simulation loop."""
        self._running = True
        logger.info("Transaction simulator running...")

        # Wait a bit for DB to be ready
        await asyncio.sleep(5)

        # Ensure demo users exist
        await self._ensure_demo_users()

        while self._running:
            try:
                await self._simulate_transaction()
                await asyncio.sleep(settings.SIMULATOR_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulator error: {e}")
                await asyncio.sleep(5)

        logger.info("Transaction simulator stopped")

    async def _ensure_demo_users(self):
        """Create demo users if they don't exist."""
        from app.core.security import hash_password

        demo_users = [
            {"email": "alex@mirage.demo", "username": "alex_trader", "full_name": "Alex Thompson", "persona": "emotional_trader"},
            {"email": "sam@mirage.demo", "username": "sam_normal", "full_name": "Sam Johnson", "persona": "normal"},
            {"email": "riley@mirage.demo", "username": "riley_gambler", "full_name": "Riley Chen", "persona": "gambler"},
            {"email": "morgan@mirage.demo", "username": "morgan_impulsive", "full_name": "Morgan Davis", "persona": "impulsive"},
            {"email": "jordan@mirage.demo", "username": "jordan_scam", "full_name": "Jordan Williams", "persona": "scam_victim"},
        ]

        async with AsyncSessionLocal() as db:
            for user_data in demo_users:
                from sqlalchemy import select
                result = await db.execute(
                    select(User).where(User.email == user_data["email"])
                )
                existing = result.scalar_one_or_none()

                if not existing:
                    user = User(
                        email=user_data["email"],
                        username=user_data["username"],
                        full_name=user_data["full_name"],
                        hashed_password=hash_password("Demo1234!"),
                        is_active=True,
                        is_admin=False,
                    )
                    db.add(user)
                    await db.flush()

                    # Create behavioral profile
                    profile = BehavioralProfile(user_id=user.id)
                    db.add(profile)

            await db.commit()
            logger.info("✅ Demo users ready")

    async def _simulate_transaction(self):
        """Generate and process one simulated transaction."""
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            # Get a random active user
            result = await db.execute(select(User).where(User.is_active == True))
            users = result.scalars().all()
            if not users:
                return

            user = random.choice(users)
            persona_name = self._get_user_persona(user)
            persona = PERSONAS[persona_name]

            # Generate transaction
            tx = self._generate_transaction(user.id, persona)
            db.add(tx)
            await db.flush()

            # Update behavioral profile
            await self._update_profile(db, user.id, tx, persona)

            # Run risk analysis every 5th transaction
            from sqlalchemy import func
            tx_count_result = await db.execute(
                select(func.count(Transaction.id)).where(Transaction.user_id == user.id)
            )
            tx_count = tx_count_result.scalar() or 0

            if tx_count % 5 == 0:
                await self._run_risk_analysis(db, user.id)

            await db.commit()

            # Emit WebSocket event
            from app.services.websocket_manager import manager
            await manager.emit_transaction(
                {
                    "id": tx.id,
                    "amount": tx.amount,
                    "merchant": tx.merchant,
                    "category": tx.category.value,
                    "timestamp": tx.timestamp.isoformat(),
                    "is_flagged": tx.is_flagged,
                },
                user.id,
            )

    def _get_user_persona(self, user: User) -> str:
        """Assign a persona based on username seed."""
        if "trader" in user.username:
            return "emotional_trader"
        elif "gambler" in user.username:
            return "gambler"
        elif "impulsive" in user.username:
            return "impulsive"
        elif "scam" in user.username:
            return "scam_victim"
        return "normal"

    def _generate_transaction(self, user_id: int, persona: dict) -> Transaction:
        """Generate a realistic transaction based on persona."""
        now = datetime.utcnow()

        # Determine timing
        if random.random() < persona["late_night_prob"]:
            hour = random.choice([23, 0, 1, 2, 3, 4])
        else:
            hour = random.randint(8, 22)

        # Apply timestamp with simulated time offset
        offset_minutes = random.randint(-60, 0)
        timestamp = now.replace(hour=hour, minute=random.randint(0, 59)) + timedelta(minutes=offset_minutes)

        # Pick category
        category = self._weighted_choice(persona["categories"])

        # Generate amount with occasional escalation
        amount = max(1.0, random.gauss(persona["amount_mean"], persona["amount_std"]))
        if random.random() < persona.get("escalation_prob", 0):
            amount *= random.uniform(1.5, 4.0)
        amount = round(amount, 2)

        # Determine merchant
        merchant_list = MERCHANTS.get(category, ["Unknown Merchant"])
        merchant = random.choice(merchant_list)

        # Flag high-risk transactions
        is_flagged = False
        flag_reason = None
        if amount > 5000:
            is_flagged = True
            flag_reason = "Unusually large transaction amount"
        elif hour in [23, 0, 1, 2, 3, 4] and amount > 500:
            is_flagged = True
            flag_reason = "Large late-night transaction"
        elif category in [TransactionCategory.GAMBLING, TransactionCategory.UNKNOWN] and amount > 200:
            is_flagged = True
            flag_reason = f"High-risk category: {category.value}"

        return Transaction(
            user_id=user_id,
            amount=amount,
            merchant=merchant,
            category=category,
            description=f"{merchant} payment",
            timestamp=timestamp,
            is_flagged=is_flagged,
            flag_reason=flag_reason,
            hour_of_day=hour,
            day_of_week=timestamp.weekday(),
        )

    async def _update_profile(self, db, user_id: int, tx: Transaction, persona: dict):
        """Update behavioral profile with new transaction data."""
        from sqlalchemy import select, func
        from datetime import datetime, timedelta

        # Get or create profile
        result = await db.execute(
            select(BehavioralProfile).where(BehavioralProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            profile = BehavioralProfile(user_id=user_id)
            db.add(profile)

        # Get recent transactions for stats
        week_ago = datetime.utcnow() - timedelta(days=7)
        month_ago = datetime.utcnow() - timedelta(days=30)

        week_txs_result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.timestamp >= week_ago
            )
        )
        week_txs = week_txs_result.scalars().all()

        month_txs_result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.timestamp >= month_ago
            )
        )
        month_txs = month_txs_result.scalars().all()

        if not month_txs:
            return

        amounts = [t.amount for t in month_txs]
        avg_amt = sum(amounts) / len(amounts)
        max_amt = max(amounts)

        late_night = sum(1 for t in month_txs if t.hour_of_day is not None and (t.hour_of_day >= 23 or t.hour_of_day <= 5))
        weekend = sum(1 for t in month_txs if t.day_of_week is not None and t.day_of_week >= 5)
        gambling = sum(1 for t in month_txs if t.category == TransactionCategory.GAMBLING)
        crypto = sum(1 for t in month_txs if t.category == TransactionCategory.CRYPTO)

        n = len(month_txs)
        high_value = sum(1 for a in amounts if a > avg_amt * 2)
        categories_used = len(set(t.category for t in month_txs))

        # Update profile fields
        profile.avg_transaction_amount = round(avg_amt, 2)
        profile.max_transaction_amount = round(max_amt, 2)
        profile.total_transactions_7d = len(week_txs)
        profile.total_transactions_30d = n
        profile.late_night_transaction_ratio = round(late_night / n, 4)
        profile.weekend_activity_ratio = round(weekend / n, 4)
        profile.gambling_ratio = round(gambling / n, 4)
        profile.crypto_ratio = round(crypto / n, 4)
        profile.burst_frequency = persona.get("burst_prob", 0) > 0.3 and random.randint(2, 8) or 0
        profile.consecutive_escalation_count = persona.get("escalation_prob", 0) > 0.3 and random.randint(1, 5) or 0

        import statistics
        profile.amount_variance = round(statistics.variance(amounts) if len(amounts) > 1 else 0, 2)
        profile.transaction_velocity = round(n / 30.0, 4)

        profile.feature_vector = {
            "high_value_ratio": round(high_value / n, 4),
            "category_diversity": categories_used,
        }

    async def _run_risk_analysis(self, db, user_id: int):
        """Run ML risk scoring for a user."""
        from sqlalchemy import select
        from app.ml.risk_engine import get_risk_engine
        from app.ml.explanation_engine import explanation_engine

        # Get profile
        result = await db.execute(
            select(BehavioralProfile).where(BehavioralProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return

        profile_dict = {
            "avg_transaction_amount": profile.avg_transaction_amount,
            "max_transaction_amount": profile.max_transaction_amount,
            "total_transactions_7d": profile.total_transactions_7d,
            "total_transactions_30d": profile.total_transactions_30d,
            "peak_activity_hour": profile.peak_activity_hour,
            "late_night_transaction_ratio": profile.late_night_transaction_ratio,
            "weekend_activity_ratio": profile.weekend_activity_ratio,
            "gambling_ratio": profile.gambling_ratio,
            "crypto_ratio": profile.crypto_ratio,
            "transaction_velocity": profile.transaction_velocity,
            "amount_variance": profile.amount_variance,
            "burst_frequency": profile.burst_frequency,
            "consecutive_escalation_count": profile.consecutive_escalation_count,
            "feature_vector": profile.feature_vector or {},
        }

        try:
            engine = get_risk_engine()
            scores = engine.compute_risk_scores(profile_dict)
        except Exception as e:
            logger.error(f"Risk scoring failed for user {user_id}: {e}")
            return

        # Save risk score
        risk_score = RiskScore(
            user_id=user_id,
            **scores,
            model_version="1.0.0",
        )
        db.add(risk_score)

        # Generate alerts for high-risk scores
        await self._maybe_create_alerts(db, user_id, scores, profile_dict)

        # WebSocket emit
        from app.services.websocket_manager import manager
        await manager.emit_risk_update(scores, user_id)

    async def _maybe_create_alerts(self, db, user_id: int, scores: dict, profile: dict):
        """Create alerts based on risk scores."""
        from app.ml.explanation_engine import explanation_engine

        alerts_to_create = []

        if scores["gambling_risk"] > 0.65:
            alerts_to_create.append({
                "alert_type": AlertType.GAMBLING_PATTERN,
                "severity": RiskLevel.HIGH if scores["gambling_risk"] > 0.8 else RiskLevel.MEDIUM,
                "title": "Gambling Pattern Detected",
                "message": f"Gambling activity ratio has reached {profile.get('gambling_ratio', 0):.0%}",
            })

        if scores["impulsiveness_score"] > 0.60:
            alerts_to_create.append({
                "alert_type": AlertType.IMPULSIVE_SPENDING,
                "severity": RiskLevel.HIGH,
                "title": "Impulsive Spending Alert",
                "message": "Rapid transaction bursts and escalating amounts detected",
            })

        if scores["scam_susceptibility"] > 0.65:
            alerts_to_create.append({
                "alert_type": AlertType.SCAM_SUSCEPTIBILITY,
                "severity": RiskLevel.CRITICAL,
                "title": "⚠️ Scam Risk Alert",
                "message": "Behavioral patterns suggest high susceptibility to financial scams",
            })

        if scores["anomaly_score"] > 0.70:
            alerts_to_create.append({
                "alert_type": AlertType.ANOMALOUS_BEHAVIOR,
                "severity": RiskLevel.HIGH,
                "title": "Behavioral Anomaly Detected",
                "message": f"Activity deviates {scores['anomaly_score']:.0%} from established baseline",
            })

        if profile.get("late_night_transaction_ratio", 0) > 0.4:
            alerts_to_create.append({
                "alert_type": AlertType.LATE_NIGHT_ACTIVITY,
                "severity": RiskLevel.MEDIUM,
                "title": "Late-Night Activity Warning",
                "message": f"{profile.get('late_night_transaction_ratio', 0) * 100:.0f}% of transactions occur between 11 PM - 5 AM",
            })

        for alert_data in alerts_to_create[:2]:  # Max 2 new alerts per cycle
            explanation = explanation_engine.generate_alert_explanation(
                alert_data["alert_type"].value, scores, profile
            )
            alert = Alert(
                user_id=user_id,
                ai_explanation=explanation,
                **alert_data,
            )
            db.add(alert)

            from app.services.websocket_manager import manager
            await manager.emit_alert(
                {
                    "alert_type": alert_data["alert_type"].value,
                    "severity": alert_data["severity"].value,
                    "title": alert_data["title"],
                    "message": alert_data["message"],
                },
                user_id,
            )

    @staticmethod
    def _weighted_choice(choices: list):
        """Pick from weighted (item, weight) list."""
        items, weights = zip(*choices)
        total = sum(weights)
        r = random.uniform(0, total)
        cumulative = 0
        for item, weight in zip(items, weights):
            cumulative += weight
            if r <= cumulative:
                return item
        return items[-1]
