#!/bin/bash
# Try to reset postgres password or create user via system methods

echo "Attempting to set up PostgreSQL..."

# Method 1: Try to connect as current user with peer auth
CURRENT_USER=$(whoami)
echo "Current user: $CURRENT_USER"

# Method 2: Try to create user directly if we have sudo access
echo ""
echo "Trying to create PostgreSQL user and database..."
echo "You may be prompted for sudo password"

sudo -u postgres psql -p 5434 << 'EOF' 2>&1
-- Create user
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

-- Create database
SELECT 'CREATE DATABASE shirt_database OWNER muhib'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'shirt_database')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE shirt_database TO muhib;

\c shirt_database
GRANT ALL ON SCHEMA public TO muhib;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO muhib;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO muhib;

\q
EOF

echo ""
echo "Testing connection..."
PGPASSWORD=1234567890 psql -p 5434 -U muhib -h localhost -d shirt_database -c "SELECT 1;" > /dev/null 2>&1 && echo "✅ Connection successful!" || echo "❌ Connection failed - please check manually"
