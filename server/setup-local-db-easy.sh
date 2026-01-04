#!/bin/bash
echo "=========================================="
echo "PostgreSQL Local Database Setup"
echo "=========================================="
echo ""
echo "This script will create:"
echo "  - User: muhib"
echo "  - Password: 1234567890"
echo "  - Database: shirt_database"
echo ""
echo "You will be prompted for your sudo password."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Run the SQL script
sudo -u postgres psql -p 5434 -f scripts/setupLocalDatabase.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "Testing connection..."
    PGPASSWORD=1234567890 psql -p 5434 -U muhib -h localhost -d shirt_database -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Connection test successful!"
        echo ""
        echo "You can now run: npm run db:fix-local"
    else
        echo "⚠️  Connection test failed. Please check manually."
    fi
else
    echo ""
    echo "❌ Setup failed. Please run manually:"
    echo "   sudo -u postgres psql -p 5434 -f scripts/setupLocalDatabase.sql"
fi
