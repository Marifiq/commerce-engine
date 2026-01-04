#!/bin/bash
# Setup local PostgreSQL database

PORT=5434
USER="muhib"
PASSWORD="1234567890"
DB="shirt_database"

echo "Setting up local PostgreSQL database..."
echo "Port: $PORT"
echo "User: $USER"
echo "Database: $DB"
echo ""

# Try to connect and create user/database
psql -p $PORT -U postgres -h localhost << EOF 2>&1
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$USER') THEN
    CREATE USER $USER WITH PASSWORD '$PASSWORD';
    RAISE NOTICE 'User $USER created';
  ELSE
    RAISE NOTICE 'User $USER already exists';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB OWNER $USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB TO $USER;

-- Connect to the database and grant schema privileges
\c $DB
GRANT ALL ON SCHEMA public TO $USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $USER;

\q
EOF

echo ""
echo "✅ Database setup complete!"
echo "Testing connection..."
psql -p $PORT -U $USER -h localhost -d $DB -c "SELECT 1;" > /dev/null 2>&1 && echo "✅ Connection successful!" || echo "❌ Connection failed"
