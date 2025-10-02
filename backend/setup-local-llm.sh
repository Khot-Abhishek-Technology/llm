#!/bin/bash

echo "=========================================="
echo "Local LLM Setup for StarCoder 3B"
echo "=========================================="
echo ""

# Check if Ollama is installed
if command -v ollama &> /dev/null; then
    echo "✓ Ollama is already installed"
else
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh

    if [ $? -eq 0 ]; then
        echo "✓ Ollama installed successfully"
    else
        echo "✗ Failed to install Ollama"
        exit 1
    fi
fi

echo ""
echo "Available setup options:"
echo "1. Use StarCoder (3B parameters) - Recommended"
echo "2. Use CodeLlama (7B parameters) - Better for code"
echo "3. Use Mistral (7B parameters) - Best general performance"
echo "4. Use Phi-2 (2.7B parameters) - Fastest, smallest"
echo ""
read -p "Select option (1-4): " option

case $option in
    1)
        MODEL="starcoder2:3b"
        echo "Pulling StarCoder 3B model..."
        ;;
    2)
        MODEL="codellama:7b"
        echo "Pulling CodeLlama 7B model..."
        ;;
    3)
        MODEL="mistral:7b"
        echo "Pulling Mistral 7B model..."
        ;;
    4)
        MODEL="phi"
        echo "Pulling Phi-2 model..."
        ;;
    *)
        echo "Invalid option. Using StarCoder 3B as default."
        MODEL="starcoder2:3b"
        ;;
esac

echo ""
ollama pull $MODEL

if [ $? -eq 0 ]; then
    echo "✓ Model downloaded successfully"
else
    echo "✗ Failed to download model"
    exit 1
fi

# Create a custom Modelfile
echo ""
echo "Creating custom interview assistant model..."

cat > /tmp/InterviewModelfile << EOF
FROM $MODEL

SYSTEM You are an expert technical interview assistant. You generate quiz questions, technical problems, and evaluate code solutions. Always return valid JSON responses only. Be concise and accurate.

PARAMETER temperature 0.5
PARAMETER top_p 0.95
PARAMETER num_ctx 4096
EOF

ollama create interview-assistant -f /tmp/InterviewModelfile

if [ $? -eq 0 ]; then
    echo "✓ Custom model created successfully"
else
    echo "✗ Failed to create custom model"
    exit 1
fi

# Update .env file
echo ""
echo "Updating .env file..."

if [ -f "../.env" ]; then
    if grep -q "LOCAL_LLM_URL" ../.env; then
        echo "✓ LOCAL_LLM_URL already configured"
    else
        echo "" >> ../.env
        echo "# Local LLM Configuration" >> ../.env
        echo "LOCAL_LLM_URL=http://localhost:11434" >> ../.env
        echo "✓ Added LOCAL_LLM_URL to .env"
    fi
else
    echo "✗ .env file not found"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "To start the local LLM server, run:"
echo "  ollama serve"
echo ""
echo "Or run in background:"
echo "  ollama serve &"
echo ""
echo "To test the model:"
echo '  curl http://localhost:11434/v1/completions \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '"'"'{"model": "interview-assistant", "prompt": "Generate 2 quiz questions as JSON", "max_tokens": 500}'"'"
echo ""
echo "Update LOCAL_LLM_URL in .env if needed (default: http://localhost:11434)"
echo ""
