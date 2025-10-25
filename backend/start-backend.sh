#!/bin/bash

echo "🚀 Starting Beyond Speech Backend..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not running"
    echo "📋 Please start PostgreSQL first:"
    echo ""
    echo "  macOS:"
    echo "    brew services start postgresql"
    echo "    # or"
    echo "    pg_ctl -D /usr/local/var/postgres start"
    echo ""
    echo "  Linux:"
    echo "    sudo service postgresql start"
    echo "    # or"
    echo "    sudo systemctl start postgresql"
    echo ""
    echo "  Windows:"
    echo "    Start PostgreSQL service from Services"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check if database exists
if ! psql -h localhost -U postgres -d beyond_speech_db -c '\q' 2>/dev/null; then
    echo "🗄️  Creating database..."
    createdb -h localhost -U postgres beyond_speech_db
    echo "✅ Database created"
else
    echo "✅ Database already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push schema to database
echo "📊 Pushing database schema..."
npm run db:push

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo "🎉 Backend setup complete!"
echo ""
echo "🚀 Starting the server..."
npm run dev



