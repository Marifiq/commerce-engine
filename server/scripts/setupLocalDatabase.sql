-- Setup Local PostgreSQL Database
-- Run this as: sudo -u postgres psql -p 5434 -f setupLocalDatabase.sql

-- Create user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'muhib') THEN
    CREATE USER muhib WITH PASSWORD '1234567890';
    RAISE NOTICE 'User muhib created';
  ELSE
    ALTER USER muhib WITH PASSWORD '1234567890';
    RAISE NOTICE 'User muhib password updated';
  END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE shirt_database OWNER muhib'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'shirt_database')\gexec

-- Grant privileges on database
GRANT ALL PRIVILEGES ON DATABASE shirt_database TO muhib;

-- Connect to the database and grant schema privileges
\c shirt_database

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO muhib;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO muhib;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO muhib;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO muhib;

-- Verify
\du muhib
\l shirt_database

\q

