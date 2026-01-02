#!/bin/bash

# Enhanced setup script for Shirt Application development environment

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting enhanced setup for Shirt Application...${NC}"

# 1. Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "${RED}Error: Node.js version 22 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js version check passed: $(node -v)${NC}"

# 2. Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL (psql) is not installed.${NC}"
    echo -e "Please install PostgreSQL before continuing:"
    echo -e "  Ubuntu/Debian: sudo apt-get install postgresql"
    echo -e "  Mac (Homebrew): brew install postgresql"
    exit 1
fi
echo -e "${GREEN}PostgreSQL check passed: $(psql --version | head -n 1)${NC}"

# 3. Database Configuration
DB_NAME="shirt_database"
DB_USER="muhib"
DB_PASS="password123"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}Configuring PostgreSQL database...${NC}"
echo -e "This step will attempt to create the database and user."
echo -e "If it fails due to permissions, please run the following commands manually as a PostgreSQL superuser:"
echo -e "  CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
echo -e "  CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
echo -e "  GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
echo -e "  \c ${DB_NAME}"
echo -e "  GRANT ALL ON SCHEMA public TO ${DB_USER};"

# Attempt automated setup (works if the current user has peer auth or if sudo is available)
if command -v sudo &> /dev/null; then
    echo -e "Attempting to create user and database using sudo (postgres user)..."
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || echo "User ${DB_USER} might already exist."
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || echo "Database ${DB_NAME} might already exist."
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null
    sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" 2>/dev/null
else
    echo -e "${RED}Sudo not found. Skipping automated DB creation. Proceeding with .env setup...${NC}"
fi

# 4. Create/Update .env files
echo -e "${BLUE}Creating/Updating .env files...${NC}"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Server .env
if [ ! -f server/.env ]; then
    echo "DATABASE_URL=\"${DATABASE_URL}\"" > server/.env
    echo "PORT=5000" >> server/.env
    echo "JWT_SECRET=your_jwt_secret_here" >> server/.env
    echo "JWT_EXPIRES_IN=90d" >> server/.env
    echo "JWT_COOKIE_EXPIRES_IN=90" >> server/.env
    echo -e "${GREEN}Created server/.env${NC}"
else
    if grep -q "DATABASE_URL" server/.env; then
        # Use a different delimiter for sed since URL contains slashes
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" server/.env
    else
        echo "DATABASE_URL=\"${DATABASE_URL}\"" >> server/.env
    fi
    echo -e "${GREEN}Updated server/.env${NC}"
fi

# Client .env (if needed)
if [ ! -f client/.env ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > client/.env
    echo -e "${GREEN}Created client/.env${NC}"
fi

# 5. Install Dependencies
echo -e "${BLUE}Installing server dependencies...${NC}"
cd server && npm install && cd ..

echo -e "${BLUE}Installing client dependencies...${NC}"
cd client && npm install && cd ..

# 6. Prisma Setup and Seeding
echo -e "${BLUE}Syncing Prisma schema and seeding database...${NC}"
cd server
npx prisma db push
if [ $? -eq 0 ]; then
    npx prisma db seed
    echo -e "${GREEN}Database synchronization and seeding successful!${NC}"
else
    echo -e "${RED}Prisma sync failed. Check your database connection.${NC}"
fi
cd ..

echo -e "${GREEN}Enhanced setup completed!${NC}"
echo -e "To start development:"
echo -e "  Term 1: cd server && npm run dev"
echo -e "  Term 2: cd client && npm run dev"
