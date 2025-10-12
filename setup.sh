#!/bin/bash

echo "🚀 Setting up Insights App..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your OpenAI API key"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check for sox installation
if command -v sox &> /dev/null; then
    echo "✅ SoX is installed"
elif command -v rec &> /dev/null; then
    echo "✅ SoX (rec) is installed"
else
    echo "⚠️  SoX not found. Please install it:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   macOS: brew install sox"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   Linux: sudo apt-get install sox"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  npm start"
