#!/bin/bash

echo "🚀 Setting up Beyond Speech Backend Database..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created from template"
    echo "⚠️  Please edit .env file with your database credentials"
else
    echo "✅ .env file already exists"
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed"
    
    # Try to connect to default database
    if psql -h localhost -U postgres -d postgres -c '\q' 2>/dev/null; then
        echo "✅ PostgreSQL is running and accessible"
        
        # Create database if it doesn't exist
        echo "🗄️  Creating database..."
        psql -h localhost -U postgres -d postgres -c "CREATE DATABASE beyond_speech_db;" 2>/dev/null || echo "Database may already exist"
        
        echo "📊 Pushing database schema..."
        npm run db:push
        
        echo "🌱 Seeding database with sample data..."
        npm run db:seed
        
        echo "🎉 Database setup complete!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Start the backend: npm run dev"
        echo "2. View database: npm run db:studio"
        echo "3. Test the API: curl http://localhost:3001/health"
        
    else
        echo "❌ Cannot connect to PostgreSQL"
        echo "Please make sure PostgreSQL is running and accessible"
        echo "You can start PostgreSQL with: brew services start postgresql"
    fi
else
    echo "❌ PostgreSQL is not installed"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "  Windows: Download from https://www.postgresql.org/download/"
fi



