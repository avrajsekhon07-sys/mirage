"""
AI Explanation Engine
─────────────────────
Generates human-readable explanations of behavioral risk scores.
Uses rule-based templates + contextual analysis for natural language output.
"""

import random
from typing import Dict, List, Optional


# ── Explanation Templates ─────────────────────────────────────────────────────

IMPULSIVE_TEMPLATES = [
    "This user exhibits {severity} impulsive spending patterns — rapid transaction bursts "
    "({burst_count} bursts detected) combined with escalating amounts suggest loss of financial control.",

    "Analysis reveals compulsive transaction behavior: {tx_count} transactions in 7 days "
    "with escalating amounts and {burst_count} burst episodes indicate emotional spending loops.",

    "Behavioral signature matches impulsive spending profile: high transaction velocity "
    "({velocity:.1f} tx/hour), recurring escalation patterns, and deviation from baseline spending.",
]

EMOTIONAL_TRADING_TEMPLATES = [
    "This user shows clear signs of emotional trading: transactions spike during high-stress "
    "periods (late-night concentration of {late_night_pct:.0f}%), with rapid reversals and "
    "increasing bet sizes suggesting fear-of-missing-out behavior.",

    "Emotional trading indicators detected — escalating crypto/investment transactions "
    "({crypto_pct:.0f}% of portfolio) concentrated in off-hours, suggesting reactive rather "
    "than rational decision-making.",
]

SCAM_SUSCEPTIBILITY_TEMPLATES = [
    "Elevated scam susceptibility detected: {high_value_pct:.0f}% of transactions are "
    "unusually high-value, often late-night, targeting unfamiliar merchants. This pattern "
    "correlates with known social engineering attack vectors.",

    "User shows behavioral markers consistent with scam vulnerability: irregular large "
    "transfers at unusual hours, combined with crypto activity, match phishing and "
    "investment fraud victim profiles.",
]

GAMBLING_TEMPLATES = [
    "Significant gambling-pattern risk detected ({gambling_pct:.0f}% gambling transactions). "
    "The escalation-then-recovery cycle ({escalation_count} escalation sequences) strongly "
    "suggests compulsive gambling behavior with chasing-losses dynamics.",

    "Behavioral profile matches gambling addiction pattern: repetitive small transactions "
    "interspersed with large spikes, {burst_count} activity bursts, and late-night "
    "concentration ({late_night_pct:.0f}%) typical of problem gambling.",
]

ANOMALY_TEMPLATES = [
    "Significant behavioral deviation detected — current activity deviates {deviation:.0f}% "
    "from this user's established baseline. Unusual transaction patterns may indicate account "
    "compromise or psychological manipulation.",

    "Isolation Forest anomaly detection flags this user's recent behavior as statistically "
    "unusual. Transaction amounts, timing, and frequency all deviate from learned baseline "
    "patterns, warranting immediate review.",
]

LOW_RISK_TEMPLATES = [
    "Behavioral profile appears within normal parameters. Transaction patterns are consistent, "
    "amounts are stable, and no significant anomalies detected in the analysis window.",

    "No significant behavioral manipulation patterns detected. User maintains consistent "
    "spending habits with low volatility and predictable transaction timing.",
]


class ExplanationEngine:
    """
    Generates contextual, human-readable explanations for risk scores.
    """

    @staticmethod
    def generate_alert_explanation(
        alert_type: str,
        risk_scores: Dict,
        profile_data: Dict,
        transaction_data: Optional[List[Dict]] = None,
    ) -> str:
        """Generate explanation for a specific alert type."""

        late_night_pct = profile_data.get("late_night_transaction_ratio", 0) * 100
        gambling_pct = profile_data.get("gambling_ratio", 0) * 100
        crypto_pct = profile_data.get("crypto_ratio", 0) * 100
        burst_count = profile_data.get("burst_frequency", 0)
        escalation_count = profile_data.get("consecutive_escalation_count", 0)
        velocity = profile_data.get("transaction_velocity", 0)
        tx_count = profile_data.get("total_transactions_7d", 0)
        high_value_pct = profile_data.get("feature_vector", {}).get("high_value_ratio", 0) * 100
        overall = risk_scores.get("overall_score", 0)
        deviation = overall * 100

        try:
            if alert_type in ("impulsive_spending", "transaction_burst"):
                template = random.choice(IMPULSIVE_TEMPLATES)
                return template.format(
                    severity="high" if overall > 0.6 else "moderate",
                    burst_count=burst_count,
                    tx_count=tx_count,
                    velocity=velocity,
                )

            elif alert_type == "emotional_trading":
                template = random.choice(EMOTIONAL_TRADING_TEMPLATES)
                return template.format(
                    late_night_pct=late_night_pct,
                    crypto_pct=crypto_pct,
                )

            elif alert_type == "scam_susceptibility":
                template = random.choice(SCAM_SUSCEPTIBILITY_TEMPLATES)
                return template.format(high_value_pct=high_value_pct)

            elif alert_type == "gambling_pattern":
                template = random.choice(GAMBLING_TEMPLATES)
                return template.format(
                    gambling_pct=gambling_pct,
                    escalation_count=escalation_count,
                    burst_count=burst_count,
                    late_night_pct=late_night_pct,
                )

            elif alert_type in ("anomalous_behavior", "behavioral_deviation"):
                template = random.choice(ANOMALY_TEMPLATES)
                return template.format(deviation=deviation)

            elif alert_type == "late_night_activity":
                return (
                    f"Unusual late-night financial activity detected — {late_night_pct:.0f}% of "
                    f"transactions occur between 11 PM and 5 AM. This temporal pattern is "
                    f"associated with impaired decision-making and increased manipulation risk."
                )

            else:
                return random.choice(LOW_RISK_TEMPLATES)

        except (KeyError, ValueError):
            return (
                f"Behavioral analysis detected unusual patterns with an overall risk score of "
                f"{overall:.0%}. Detailed review recommended."
            )

    @staticmethod
    def generate_dashboard_summary(
        risk_scores: Dict,
        profile_data: Dict,
        alert_count: int,
    ) -> str:
        """Generate a paragraph-length dashboard AI summary."""

        overall = risk_scores.get("overall_score", 0)
        risk_level = risk_scores.get("risk_level", "low")
        manipulation = risk_scores.get("manipulation_probability", 0)
        anomaly = risk_scores.get("anomaly_score", 0)
        impulsive = risk_scores.get("impulsiveness_score", 0)
        gambling = risk_scores.get("gambling_risk", 0)

        late_night = profile_data.get("late_night_transaction_ratio", 0) * 100
        gambling_pct = profile_data.get("gambling_ratio", 0) * 100

        # Build summary from dominant risk factors
        dominant_factors = []
        if impulsive > 0.5:
            dominant_factors.append(f"impulsive spending (score: {impulsive:.0%})")
        if gambling > 0.5:
            dominant_factors.append(f"gambling-pattern behavior ({gambling_pct:.0f}% activity)")
        if manipulation > 0.6:
            dominant_factors.append(f"manipulation susceptibility ({manipulation:.0%})")
        if anomaly > 0.6:
            dominant_factors.append(f"behavioral anomalies ({anomaly:.0%} deviation)")
        if late_night > 30:
            dominant_factors.append(f"late-night financial activity ({late_night:.0f}%)")

        if risk_level == "critical":
            intro = "⚠️ CRITICAL: Immediate intervention recommended."
        elif risk_level == "high":
            intro = "🔴 HIGH RISK: Multiple behavioral red flags detected."
        elif risk_level == "medium":
            intro = "🟡 MODERATE RISK: Behavioral patterns warrant monitoring."
        else:
            intro = "🟢 LOW RISK: Behavioral patterns appear normal."

        if dominant_factors:
            factors_str = ", ".join(dominant_factors[:3])
            body = (
                f" Mirage AI has identified {alert_count} alerts in the current analysis window. "
                f"Primary risk indicators: {factors_str}. "
                f"Overall behavioral risk: {overall:.0%}."
            )
        else:
            body = (
                f" No significant behavioral manipulation patterns detected. "
                f"Transaction activity is within normal statistical parameters. "
                f"Continued monitoring active."
            )

        return intro + body

    @staticmethod
    def generate_shap_explanation(shap_values: Dict) -> List[Dict]:
        """Convert SHAP values to human-readable feature contributions."""

        feature_labels = {
            "avg_amount": "Average Transaction Amount",
            "max_amount": "Maximum Transaction Amount",
            "amount_std": "Amount Variability",
            "transaction_count_7d": "Weekly Transaction Frequency",
            "transaction_count_30d": "Monthly Transaction Frequency",
            "late_night_ratio": "Late-Night Activity",
            "weekend_ratio": "Weekend Activity",
            "gambling_ratio": "Gambling Transactions",
            "crypto_ratio": "Crypto Transactions",
            "burst_count": "Transaction Burst Frequency",
            "escalation_count": "Escalating Amount Patterns",
            "velocity": "Transaction Velocity",
            "amount_variance_normalized": "Normalized Amount Variance",
            "peak_hour_risk": "High-Risk Peak Hours",
            "high_value_ratio": "High-Value Transaction Ratio",
            "category_diversity": "Spending Category Focus",
        }

        contributions = []
        for feature, value in shap_values.items():
            label = feature_labels.get(feature, feature.replace("_", " ").title())
            direction = "increases" if value > 0 else "decreases"
            magnitude = abs(value)
            if magnitude > 0.01:
                contributions.append({
                    "feature": feature,
                    "label": label,
                    "value": value,
                    "direction": direction,
                    "magnitude": magnitude,
                    "description": f"{label} {direction} risk by {magnitude:.3f}",
                })

        # Sort by magnitude
        contributions.sort(key=lambda x: x["magnitude"], reverse=True)
        return contributions[:10]  # Top 10 contributors


# Singleton instance
explanation_engine = ExplanationEngine()
