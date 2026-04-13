#!/bin/bash
# Voice Recording Tool for Claude Code (Git Bash / WSL)
# Usage: ./voice.sh [duration_seconds] [model_size]

cd "$(dirname "$0")"

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Python not found! Please install Python 3.8+"
    exit 1
fi

# Install dependencies
echo "📦 Checking dependencies..."
pip install -q -r .voice-tools/requirements.txt 2>/dev/null

# Defaults
DURATION=${1:-10}
MODEL=${2:-tiny}

# Run
echo "🎤 Starting voice recorder..."
python .voice-tools/record_and_transcribe.py "$DURATION" "$MODEL"
