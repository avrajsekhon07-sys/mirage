# 🔮 Mirage — Behavioral Financial Manipulation Detection Engine

<div align="center">

![Mirage Banner](https://img.shields.io/badge/Mirage-Detection%20Engine-00D4FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzAwRDRGRiIgZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNS0xMC01LTEwIDV6TTIgMTJsMTAgNSAxMC01LTEwLTUtMTAgNXoiLz48L3N2Zz4=)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![XGBoost](https://img.shields.io/badge/XGBoost-ML-FF6600?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**AI-powered platform that detects psychological financial manipulation patterns in real time.**

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Docs](#-api-documentation) • [ML Pipeline](#-ml-pipeline) • [Screenshots](#-screenshots)

</div>

---

## 🎯 What is Mirage?

Mirage is a production-grade fintech AI platform that analyzes user transaction behavior to detect psychological financial manipulation patterns. It uses machine learning to identify:

- 🎰 **Gambling addiction patterns** — escalating bets, chasing losses
- ⚡ **Impulsive spending** — transaction bursts, rapid escalation
- 📈 **Emotional trading** — reactive crypto/investment behavior
- 🌙 **Suspicious late-night activity** — off-hours high-value transactions
- 🎣 **Scam susceptibility** — behavioral markers of social engineering victims
- 🔍 **Behavioral anomalies** — statistical deviation from personal baselines

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Auth** | Secure login/register with bcrypt-hashed passwords |
| 📡 **Real-Time WebSockets** | Live transaction streaming and risk score updates |
| 🤖 **AI Risk Engine** | Isolation Forest + XGBoost + SHAP explainability |
| 📊 **Interactive Dashboard** | Live risk gauges, trend charts, activity heatmaps |
| 🚨 **Alert System** | Severity-graded alerts with AI-generated explanations |
| 📄 **PDF Export** | Exportable risk reports |
| 👑 **Admin Panel** | Platform-wide analytics and user oversight |
| 🎭 **Behavioral Profiles** | Per-user feature vectors and pattern tracking |
| 🐳 **Docker Ready** | One-command deployment with `docker-compose up` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MIRAGE PLATFORM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────┐     ┌──────────────────────────────────┐   │
│   │  React Frontend  │     │         FastAPI Backend           │   │
│   │                  │     │                                   │   │
│   │  ┌────────────┐  │     │  ┌──────────┐  ┌─────────────┐  │   │
│   │  │ Redux Store │  │◄───┤  │ Auth API  │  │ Analytics   │  │   │
│   │  │ Auth/Dash  │  │     │  │ JWT/BCrypt│  │ Risk Scores │  │   │
│   │  └────────────┘  │     │  └──────────┘  └─────────────┘  │   │
│   │                  │     │                                   │   │
│   │  ┌────────────┐  │     │  ┌──────────┐  ┌─────────────┐  │   │
│   │  │  Recharts  │  │◄WS─┤  │WebSocket │  │  Tx Alerts  │  │   │
│   │  │  Framer    │  │     │  │ Manager  │  │  Generator  │  │   │
│   │  └────────────┘  │     │  └──────────┘  └─────────────┘  │   │
│   └─────────────────┘     │                                   │   │
│                            │  ┌────────────────────────────┐  │   │
│                            │  │      ML Risk Engine         │  │   │
│                            │  │                             │  │   │
│                            │  │  IsolationForest (anomaly)  │  │   │
│                            │  │  XGBoost (classification)   │  │   │
│                            │  │  SHAP (explainability)      │  │   │
│                            │  │  Explanation Engine (NLG)   │  │   │
│                            │  └────────────────────────────┘  │   │
│                            │                                   │   │
│                            │  ┌──────────┐  ┌─────────────┐  │   │
│                            │  │ SQLAlchemy│  │  Tx Sim     │  │   │
│                            │  │   ORM    │  │ (5 personas) │  │   │
│                            │  └──────────┘  └─────────────┘  │   │
│                            └──────────────────────────────────┘   │
│                                         │                          │
│                            ┌────────────▼─────────────────────┐   │
│                            │         PostgreSQL 16             │   │
│                            │  users · transactions · alerts    │   │
│                            │  risk_scores · behavioral_profiles│   │
│                            └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, TailwindCSS, Framer Motion, Recharts |
| **State** | Redux Toolkit |
| **Backend** | FastAPI, Python 3.11, Uvicorn |
| **Database** | PostgreSQL 16, SQLAlchemy 2 (async), Asyncpg |
| **ML** | scikit-learn (IsolationForest), XGBoost, SHAP, NumPy |
| **Auth** | JWT (python-jose), bcrypt (passlib) |
| **Real-time** | WebSockets (FastAPI native) |
| **Infrastructure** | Docker, docker-compose, Nginx |

### Folder Structure

```
mirage/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # FastAPI route handlers
│   │   │   ├── auth.py        # JWT login/register
│   │   │   ├── transactions.py
│   │   │   ├── analytics.py   # Dashboard, risk trends, heatmaps
│   │   │   ├── alerts.py
│   │   │   ├── admin.py
│   │   │   └── websocket.py   # WS stream endpoints
│   │   ├── core/
│   │   │   ├── config.py      # Pydantic settings
│   │   │   └── security.py    # JWT + password utils
│   │   ├── db/
│   │   │   └── database.py    # Async SQLAlchemy engine
│   │   ├── models/
│   │   │   └── models.py      # ORM models (5 tables)
│   │   ├── schemas/
│   │   │   └── schemas.py     # Pydantic request/response schemas
│   │   ├── ml/
│   │   │   ├── risk_engine.py      # IsolationForest + XGBoost + SHAP
│   │   │   └── explanation_engine.py  # NLG explanations
│   │   ├── services/
│   │   │   ├── user_service.py
│   │   │   ├── risk_service.py
│   │   │   ├── transaction_simulator.py  # Live data generator
│   │   │   └── websocket_manager.py
│   │   └── main.py            # FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/        # Recharts visualizations
│   │   │   │   ├── RiskScoreGauge.tsx
│   │   │   │   ├── RiskTrendChart.tsx
│   │   │   │   ├── ActivityHeatmap.tsx
│   │   │   │   ├── ShapChart.tsx
│   │   │   │   └── MultiRiskChart.tsx
│   │   │   └── dashboard/     # Layout, cards, feeds
│   │   ├── pages/             # Route-level page components
│   │   ├── store/             # Redux slices
│   │   ├── hooks/             # useWebSocket
│   │   ├── services/          # Axios API client
│   │   └── App.tsx
│   ├── tailwind.config.js
│   ├── package.json
│   └── Dockerfile
│
├── scripts/
│   ├── init.sql               # PostgreSQL initialization
│   └── generate_sample_data.py
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop ≥ 24.0
- Docker Compose ≥ 2.20
- (Optional) Python 3.11+ for local scripts

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/mirage.git
cd mirage

# Copy and optionally edit environment variables
cp .env.example .env
```

### 2. Launch the Stack

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port `5432`
- **FastAPI backend** on port `8000` — also trains ML models on first run
- **React frontend** on port `3000`

> ⏱️ First build takes ~3–4 minutes (installing Python ML dependencies + Node modules)

### 3. Access the Platform

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API Docs (Swagger)** | http://localhost:8000/api/docs |
| **API Docs (ReDoc)** | http://localhost:8000/api/redoc |
| **Health Check** | http://localhost:8000/api/health |

### 4. Demo Credentials

The transaction simulator automatically creates demo users. Use these to log in:

| User | Email | Password | Profile |
|------|-------|----------|---------|
| Alex (Emotional Trader) | `alex@mirage.demo` | `Demo1234!` | High crypto activity, late-night |
| Sam (Normal) | `sam@mirage.demo` | `Demo1234!` | Low risk baseline |
| Riley (Gambler) | `riley@mirage.demo` | `Demo1234!` | High gambling ratio |
| Morgan (Impulsive) | `morgan@mirage.demo` | `Demo1234!` | Transaction bursts |
| Jordan (Scam Risk) | `jordan@mirage.demo` | `Demo1234!` | Large late-night transfers |

### 5. Generate Additional Sample Data (Optional)

```bash
pip install httpx
python scripts/generate_sample_data.py --days 30
```

---

## 🤖 ML Pipeline

### Architecture

```
Transaction Data → Behavioral Profile → Feature Extraction → Risk Scores
                                                │
                                    ┌───────────┼──────────────┐
                                    ▼           ▼              ▼
                              IsolationForest  XGBoost     Rule Engine
                              (Anomaly Score) (Manipulation  (Impulsiveness,
                                              Probability)   Scam Risk, etc.)
                                    │           │              │
                                    └───────────┼──────────────┘
                                                ▼
                                         SHAP Explainer
                                                │
                                                ▼
                                      NLG Explanation Engine
                                      (Human-readable text)
```

### Risk Dimensions

| Score | Method | Description |
|-------|--------|-------------|
| `overall_score` | Weighted ensemble | 0–1 composite risk |
| `manipulation_probability` | XGBoost | P(behavioral manipulation) |
| `anomaly_score` | Isolation Forest | Statistical deviation from baseline |
| `impulsiveness_score` | Rule engine | Burst + escalation + velocity |
| `behavioral_risk` | Ensemble | Cross-dimensional behavioral risk |
| `scam_susceptibility` | Rule engine | High-value + late-night + crypto |
| `gambling_risk` | Rule engine | Gambling ratio + escalation cycles |

### Feature Vector (16 Features)

```python
features = [
    "avg_amount",              # Mean transaction amount
    "max_amount",              # Maximum transaction amount
    "amount_std",              # Standard deviation of amounts
    "transaction_count_7d",    # Weekly frequency
    "transaction_count_30d",   # Monthly frequency
    "late_night_ratio",        # % transactions 11PM–5AM
    "weekend_ratio",           # % transactions on weekends
    "gambling_ratio",          # % gambling category
    "crypto_ratio",            # % crypto category
    "burst_count",             # Transaction burst episodes
    "escalation_count",        # Escalating-amount sequences
    "velocity",                # Transactions per hour
    "amount_variance_normalized",  # Normalized variance
    "peak_hour_risk",          # 1 if peak activity is 11PM–5AM
    "high_value_ratio",        # % transactions > 2× average
    "category_diversity",      # Number of unique categories
]
```

### Model Training

Models train automatically on synthetic data at startup and are cached to disk:
- **IsolationForest**: `contamination=0.2`, 200 estimators
- **XGBoost**: 300 estimators, `max_depth=6`, `learning_rate=0.05`
- **SHAP**: TreeExplainer for feature attribution

---

## 📡 API Documentation

Full interactive docs: http://localhost:8000/api/docs

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "myuser",
  "password": "StrongPass123!",
  "full_name": "John Doe"
}

# Login → returns JWT token
POST /api/auth/login
{ "email": "user@example.com", "password": "StrongPass123!" }

# All subsequent requests need:
Authorization: Bearer <token>
```

### Key Endpoints

```bash
# Dashboard
GET  /api/analytics/dashboard          # Full dashboard summary
GET  /api/analytics/risk-score         # Latest risk score
POST /api/analytics/risk-score/refresh # Force recompute
GET  /api/analytics/risk-trend         # Risk over time
GET  /api/analytics/heatmap            # Activity heatmap
GET  /api/analytics/shap-explanation   # SHAP feature contributions
GET  /api/analytics/behavioral-profile # User behavioral profile

# Transactions
GET  /api/transactions/          # Paginated list (filters: category, flagged_only)
GET  /api/transactions/recent    # Latest N transactions
GET  /api/transactions/flagged   # Flagged transactions only
POST /api/transactions/          # Manual transaction entry

# Alerts
GET   /api/alerts/              # User alerts
PATCH /api/alerts/{id}          # Mark read/resolved
POST  /api/alerts/mark-all-read # Bulk mark read

# Admin (admin role required)
GET /api/admin/stats   # Platform statistics
GET /api/admin/users   # All users with risk scores

# WebSocket
WS /ws/stream?token=<jwt>&user_id=<id>   # Real-time event stream
```

### WebSocket Events

```json
// Transaction event
{ "event_type": "transaction", "user_id": 1, "data": { "amount": 250.00, "merchant": "Binance", "category": "crypto", "is_flagged": false }, "timestamp": "..." }

// Risk update
{ "event_type": "risk_update", "user_id": 1, "data": { "overall_score": 0.72, "risk_level": "high" }, "timestamp": "..." }

// New alert
{ "event_type": "alert", "user_id": 1, "data": { "alert_type": "gambling_pattern", "severity": "high", "title": "Gambling Pattern Detected" }, "timestamp": "..." }
```

---

## 🗄️ Database Schema

```sql
users
  id, email, username, hashed_password, full_name, is_active, is_admin, created_at

transactions
  id, user_id, amount, merchant, category, description,
  timestamp, is_flagged, flag_reason, hour_of_day, day_of_week, metadata

risk_scores
  id, user_id, overall_score, behavioral_risk, manipulation_probability,
  impulsiveness_score, anomaly_score, scam_susceptibility, gambling_risk,
  risk_level, shap_values (JSON), model_version, computed_at

alerts
  id, user_id, alert_type, severity, title, message, ai_explanation,
  is_read, is_resolved, transaction_ids (JSON), created_at

behavioral_profiles
  id, user_id, avg_transaction_amount, max_transaction_amount,
  total_transactions_7d, total_transactions_30d, peak_activity_hour,
  late_night_transaction_ratio, weekend_activity_ratio,
  gambling_ratio, crypto_ratio, transaction_velocity,
  amount_variance, burst_frequency, consecutive_escalation_count,
  feature_vector (JSON), updated_at
```

---

## 📸 Screenshots

> Screenshots from the live platform:

### Dashboard Overview
![Dashboard](docs/screenshots/dashboard.png)
*Live risk score gauge, behavioral trend charts, real-time transaction feed and AI-generated summary*

### Risk Analytics
![Analytics](docs/screenshots/analytics.png)
*Activity heatmap by hour×day, multi-dimensional risk trends, SHAP explainability chart*

### Alert Center
![Alerts](docs/screenshots/alerts.png)
*Severity-graded alerts with AI-generated behavioral explanations*

### Admin Command Center
![Admin](docs/screenshots/admin.png)
*Platform-wide statistics, risk distribution, top-risk user monitoring*

---

## 🔧 Development Setup

### Backend (local)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL separately (or use docker-compose for just the DB)
docker-compose up db -d

export DATABASE_URL=postgresql+asyncpg://mirage:mirage_pass@localhost:5432/mirage_db
uvicorn app.main:app --reload --port 8000
```

### Frontend (local)

```bash
cd frontend
npm install
npm run dev  # Starts at http://localhost:5173
```

### Running Tests

```bash
# Backend tests (add pytest to requirements-dev.txt)
cd backend
pytest tests/ -v

# Frontend type check
cd frontend
npm run lint
```

---

## 🚀 Production Deployment

### Environment Variables

```bash
# Critical — change before deploying!
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
POSTGRES_PASSWORD=<strong-password>
DEBUG=false
```

### Scale Backend Workers

```yaml
# docker-compose.prod.yml
backend:
  command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Add SSL (Recommended)

Use a reverse proxy like Traefik or Nginx with Let's Encrypt certificates in front of the frontend container.

---

## 🔮 Future Improvements

- [ ] **Graph Network Visualization** — D3.js suspicious transaction relationship graphs
- [ ] **Multi-user Correlation** — detect coordinated fraud rings
- [ ] **Email/SMS Alerts** — real-time notifications via SendGrid/Twilio
- [ ] **Model Retraining Pipeline** — periodic retraining on production data
- [ ] **Federated Learning** — privacy-preserving cross-institution model training
- [ ] **API Rate Limiting** — Redis-based rate limiting with sliding window
- [ ] **Audit Logs** — immutable audit trail for compliance
- [ ] **2FA** — TOTP-based two-factor authentication
- [ ] **ML Drift Detection** — monitor for behavioral data distribution shifts
- [ ] **Mobile App** — React Native companion app
- [ ] **Bank API Integration** — Plaid/TrueLayer for real transaction feeds
- [ ] **Regulatory Reporting** — GDPR/AML-compliant report generation

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ using FastAPI, React, and scikit-learn

**Mirage — See through the noise.**

</div>
