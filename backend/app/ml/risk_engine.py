"""
Mirage ML Risk Engine
─────────────────────
Behavioral financial manipulation detection using:
- Isolation Forest (anomaly detection)
- XGBoost (risk classification)
- SHAP (explainability)

Produces: behavioral_risk, manipulation_probability, impulsiveness_score,
          anomaly_score, scam_susceptibility, gambling_risk, overall_score
"""

import logging
import numpy as np
import warnings
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

warnings.filterwarnings("ignore")

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

logger = logging.getLogger(__name__)

# Feature names (must match feature extraction order)
FEATURE_NAMES = [
    "avg_amount",
    "max_amount",
    "amount_std",
    "transaction_count_7d",
    "transaction_count_30d",
    "late_night_ratio",
    "weekend_ratio",
    "gambling_ratio",
    "crypto_ratio",
    "burst_count",
    "escalation_count",
    "velocity",
    "amount_variance_normalized",
    "peak_hour_risk",          # 1 if peak activity is 23-5, else 0
    "high_value_ratio",        # ratio of tx > 2x average
    "category_diversity",      # number of unique categories
]


class RiskEngine:
    """
    Core ML engine for behavioral risk scoring.
    Uses pre-trained models or trains on synthetic data if not available.
    """

    MODEL_PATH = "/app/models"

    def __init__(self):
        self.isolation_forest: Optional[IsolationForest] = None
        self.xgb_model = None
        self.scaler = StandardScaler()
        self._is_trained = False
        self._load_or_train_models()

    def _load_or_train_models(self):
        """Load saved models or train new ones on synthetic data."""
        iso_path = os.path.join(self.MODEL_PATH, "isolation_forest.pkl")
        xgb_path = os.path.join(self.MODEL_PATH, "xgb_model.pkl")
        scaler_path = os.path.join(self.MODEL_PATH, "scaler.pkl")

        os.makedirs(self.MODEL_PATH, exist_ok=True)

        if all(os.path.exists(p) for p in [iso_path, xgb_path, scaler_path]):
            try:
                self.isolation_forest = joblib.load(iso_path)
                self.xgb_model = joblib.load(xgb_path)
                self.scaler = joblib.load(scaler_path)
                self._is_trained = True
                logger.info("✅ Loaded pre-trained ML models")
                return
            except Exception as e:
                logger.warning(f"Failed to load models: {e}. Retraining...")

        self._train_on_synthetic_data()

    def _generate_synthetic_training_data(self, n_normal=2000, n_risky=500):
        """Generate synthetic behavioral data for initial training."""
        np.random.seed(42)

        # Normal users
        normal = np.column_stack([
            np.random.lognormal(4, 0.8, n_normal),   # avg_amount (50-500)
            np.random.lognormal(5, 1, n_normal),       # max_amount
            np.random.lognormal(3, 0.7, n_normal),     # amount_std
            np.random.randint(5, 30, n_normal),         # tx_count_7d
            np.random.randint(20, 100, n_normal),       # tx_count_30d
            np.random.beta(1, 9, n_normal),             # late_night_ratio (low)
            np.random.beta(2, 5, n_normal),             # weekend_ratio
            np.random.beta(0.5, 10, n_normal),          # gambling_ratio (very low)
            np.random.beta(1, 8, n_normal),             # crypto_ratio
            np.random.randint(0, 2, n_normal),          # burst_count
            np.random.randint(0, 1, n_normal),          # escalation_count
            np.random.uniform(0.1, 1.5, n_normal),      # velocity
            np.random.beta(2, 5, n_normal),             # amount_variance_norm
            np.random.binomial(1, 0.05, n_normal),      # peak_hour_risk (low)
            np.random.beta(1, 6, n_normal),             # high_value_ratio
            np.random.randint(2, 7, n_normal),          # category_diversity
        ])
        normal_labels = np.zeros(n_normal)

        # Risky users (manipulated/addicted behavior)
        risky = np.column_stack([
            np.random.lognormal(5, 1.5, n_risky),      # higher avg amounts
            np.random.lognormal(7, 1.2, n_risky),      # much higher max
            np.random.lognormal(5, 1.5, n_risky),      # high variance
            np.random.randint(15, 80, n_risky),         # high tx count
            np.random.randint(60, 300, n_risky),        # very high monthly
            np.random.beta(5, 5, n_risky),              # high late night
            np.random.beta(4, 3, n_risky),              # high weekend
            np.random.beta(4, 4, n_risky),              # high gambling
            np.random.beta(5, 3, n_risky),              # high crypto
            np.random.randint(3, 15, n_risky),          # frequent bursts
            np.random.randint(2, 10, n_risky),          # many escalations
            np.random.uniform(2, 10, n_risky),          # high velocity
            np.random.beta(5, 2, n_risky),              # high variance
            np.random.binomial(1, 0.7, n_risky),        # peak during night
            np.random.beta(4, 3, n_risky),              # many high-value
            np.random.randint(1, 4, n_risky),           # low diversity (obsessive)
        ])
        risky_labels = np.ones(n_risky)

        X = np.vstack([normal, risky])
        y = np.concatenate([normal_labels, risky_labels])

        # Shuffle
        idx = np.random.permutation(len(X))
        return X[idx], y[idx]

    def _train_on_synthetic_data(self):
        """Train ML models on synthetic data."""
        logger.info("🔧 Training ML models on synthetic data...")
        X, y = self._generate_synthetic_training_data()

        # Fit scaler
        X_scaled = self.scaler.fit_transform(X)

        # Train Isolation Forest (unsupervised anomaly detection)
        self.isolation_forest = IsolationForest(
            n_estimators=200,
            contamination=0.2,
            random_state=42,
            n_jobs=-1,
        )
        self.isolation_forest.fit(X_scaled)
        logger.info("✅ Isolation Forest trained")

        # Train XGBoost classifier
        if XGBOOST_AVAILABLE:
            self.xgb_model = xgb.XGBClassifier(
                n_estimators=300,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                use_label_encoder=False,
                eval_metric="logloss",
                random_state=42,
            )
            self.xgb_model.fit(X_scaled, y)
            logger.info("✅ XGBoost classifier trained")
        else:
            from sklearn.ensemble import GradientBoostingClassifier
            self.xgb_model = GradientBoostingClassifier(
                n_estimators=200, max_depth=5, random_state=42
            )
            self.xgb_model.fit(X_scaled, y)
            logger.info("✅ GradientBoosting classifier trained (XGBoost unavailable)")

        # Save models
        try:
            os.makedirs(self.MODEL_PATH, exist_ok=True)
            joblib.dump(self.isolation_forest, os.path.join(self.MODEL_PATH, "isolation_forest.pkl"))
            joblib.dump(self.xgb_model, os.path.join(self.MODEL_PATH, "xgb_model.pkl"))
            joblib.dump(self.scaler, os.path.join(self.MODEL_PATH, "scaler.pkl"))
            logger.info("✅ Models saved to disk")
        except Exception as e:
            logger.warning(f"Could not save models: {e}")

        self._is_trained = True

    def extract_features(self, profile_data: Dict) -> np.ndarray:
        """
        Extract feature vector from behavioral profile data.
        Returns shape (1, n_features).
        """
        avg_amount = profile_data.get("avg_transaction_amount", 0)
        max_amount = profile_data.get("max_transaction_amount", 0)
        tx_7d = profile_data.get("total_transactions_7d", 0)
        tx_30d = profile_data.get("total_transactions_30d", 0)
        peak_hour = profile_data.get("peak_activity_hour", 12)
        late_night_ratio = profile_data.get("late_night_transaction_ratio", 0)
        weekend_ratio = profile_data.get("weekend_activity_ratio", 0)
        gambling_ratio = profile_data.get("gambling_ratio", 0)
        crypto_ratio = profile_data.get("crypto_ratio", 0)
        velocity = profile_data.get("transaction_velocity", 0)
        amount_variance = profile_data.get("amount_variance", 0)
        burst_count = profile_data.get("burst_frequency", 0)
        escalation_count = profile_data.get("consecutive_escalation_count", 0)
        feature_vector = profile_data.get("feature_vector", {})

        # Derived features
        amount_std = np.sqrt(amount_variance) if amount_variance > 0 else 0
        peak_hour_risk = 1.0 if (peak_hour >= 23 or peak_hour <= 5) else 0.0
        amount_variance_normalized = (amount_variance / (avg_amount ** 2 + 1e-9))
        high_value_ratio = feature_vector.get("high_value_ratio", 0)
        category_diversity = feature_vector.get("category_diversity", 3)

        features = np.array([[
            avg_amount,
            max_amount,
            amount_std,
            tx_7d,
            tx_30d,
            late_night_ratio,
            weekend_ratio,
            gambling_ratio,
            crypto_ratio,
            burst_count,
            escalation_count,
            velocity,
            amount_variance_normalized,
            peak_hour_risk,
            high_value_ratio,
            category_diversity,
        ]], dtype=np.float64)

        # Replace NaN/inf
        features = np.nan_to_num(features, nan=0.0, posinf=10.0, neginf=0.0)
        return features

    def compute_risk_scores(self, profile_data: Dict) -> Dict:
        """
        Main scoring function. Returns all risk dimensions + SHAP values.
        """
        if not self._is_trained:
            raise RuntimeError("Models not trained yet")

        features = self.extract_features(profile_data)
        features_scaled = self.scaler.transform(features)

        # ── Anomaly Score (Isolation Forest) ─────────────────────────────────
        # Returns -1 (anomaly) or 1 (normal); score_samples gives raw scores
        iso_score = self.isolation_forest.score_samples(features_scaled)[0]
        # Normalize to [0, 1]: lower isolation score = more anomalous
        anomaly_score = float(np.clip((0.5 - iso_score) / 0.5, 0, 1))

        # ── Manipulation Probability (XGBoost) ────────────────────────────────
        proba = self.xgb_model.predict_proba(features_scaled)[0]
        manipulation_probability = float(proba[1])  # probability of class 1 (risky)

        # ── Impulsiveness Score ───────────────────────────────────────────────
        # Computed from burst frequency, escalation, velocity, late-night activity
        burst_score = min(profile_data.get("burst_frequency", 0) / 10.0, 1.0)
        escalation_score = min(profile_data.get("consecutive_escalation_count", 0) / 5.0, 1.0)
        velocity_score = min(profile_data.get("transaction_velocity", 0) / 5.0, 1.0)
        late_night = profile_data.get("late_night_transaction_ratio", 0)
        impulsiveness_score = float(
            0.35 * burst_score +
            0.30 * escalation_score +
            0.20 * velocity_score +
            0.15 * late_night
        )

        # ── Scam Susceptibility ───────────────────────────────────────────────
        # High-value transactions to unknown merchants, late-night activity
        high_value_ratio = profile_data.get("feature_vector", {}).get("high_value_ratio", 0)
        scam_susceptibility = float(
            0.4 * late_night +
            0.4 * high_value_ratio +
            0.2 * profile_data.get("crypto_ratio", 0)
        )

        # ── Gambling Risk ─────────────────────────────────────────────────────
        gambling_ratio = profile_data.get("gambling_ratio", 0)
        gambling_risk = float(
            0.7 * gambling_ratio +
            0.2 * burst_score +
            0.1 * escalation_score
        )

        # ── Behavioral Risk ───────────────────────────────────────────────────
        behavioral_risk = float(
            0.25 * manipulation_probability +
            0.20 * anomaly_score +
            0.20 * impulsiveness_score +
            0.15 * scam_susceptibility +
            0.10 * gambling_risk +
            0.10 * late_night
        )

        # ── Overall Score ──────────────────────────────────────────────────────
        overall_score = float(np.clip(
            0.3 * manipulation_probability +
            0.25 * anomaly_score +
            0.20 * behavioral_risk +
            0.15 * impulsiveness_score +
            0.10 * gambling_risk,
            0, 1
        ))

        # ── Risk Level ────────────────────────────────────────────────────────
        if overall_score >= 0.75:
            risk_level = "critical"
        elif overall_score >= 0.50:
            risk_level = "high"
        elif overall_score >= 0.25:
            risk_level = "medium"
        else:
            risk_level = "low"

        # ── SHAP Values ───────────────────────────────────────────────────────
        shap_values = self._compute_shap(features_scaled)

        return {
            "overall_score": round(overall_score, 4),
            "behavioral_risk": round(behavioral_risk, 4),
            "manipulation_probability": round(manipulation_probability, 4),
            "impulsiveness_score": round(impulsiveness_score, 4),
            "anomaly_score": round(anomaly_score, 4),
            "scam_susceptibility": round(scam_susceptibility, 4),
            "gambling_risk": round(gambling_risk, 4),
            "risk_level": risk_level,
            "shap_values": shap_values,
        }

    def _compute_shap(self, features_scaled: np.ndarray) -> Dict:
        """Compute SHAP feature importance values."""
        shap_dict = {}

        try:
            if SHAP_AVAILABLE and self.xgb_model is not None:
                explainer = shap.TreeExplainer(self.xgb_model)
                shap_vals = explainer.shap_values(features_scaled)
                # For binary classification, shap_vals may be 2D
                if isinstance(shap_vals, list):
                    values = shap_vals[1][0]  # positive class
                else:
                    values = shap_vals[0]

                for i, name in enumerate(FEATURE_NAMES):
                    if i < len(values):
                        shap_dict[name] = round(float(values[i]), 4)
            else:
                # Fallback: use feature importances from the model
                if hasattr(self.xgb_model, "feature_importances_"):
                    importances = self.xgb_model.feature_importances_
                    for i, name in enumerate(FEATURE_NAMES):
                        if i < len(importances):
                            shap_dict[name] = round(float(importances[i]), 4)
        except Exception as e:
            logger.warning(f"SHAP computation failed: {e}")
            # Return uniform importances as fallback
            for name in FEATURE_NAMES:
                shap_dict[name] = 0.0625

        return shap_dict


# Singleton instance
_risk_engine: Optional[RiskEngine] = None


def get_risk_engine() -> RiskEngine:
    """Get or create singleton RiskEngine."""
    global _risk_engine
    if _risk_engine is None:
        _risk_engine = RiskEngine()
    return _risk_engine
