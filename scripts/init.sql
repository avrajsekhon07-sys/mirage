-- Mirage Database Initialization
-- This script runs automatically when the PostgreSQL container starts for the first time.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create indexes (SQLAlchemy will create tables; these add performance indexes)
-- The ORM handles table creation via create_all on app startup.

-- Seed admin user will be created by the application on first run.
-- Demo users are created by the transaction simulator.

SELECT 'Mirage DB initialized successfully' AS status;
