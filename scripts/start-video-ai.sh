#!/bin/bash
# Campaia — Start Local Video AI Service (GPU)
#
# Runs ModelScope text-to-video-ms-1.7b on your NVIDIA GPU.
# Backend connects via STABLE_VIDEO_URL=http://localhost:8001

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/local-video-env"

if [ ! -d "$VENV_DIR" ]; then
    echo "ERROR: Virtual environment not found at $VENV_DIR"
    echo "Run: virtualenv $VENV_DIR --python=python3.12"
    echo "Then: source $VENV_DIR/bin/activate && pip install torch diffusers transformers accelerate safetensors fastapi uvicorn pydantic"
    exit 1
fi

echo "========================================"
echo "  Campaia Local Video AI (GPU)"
echo "  Model: ModelScope text-to-video-ms-1.7b"
echo "  Port:  8001"
echo "========================================"

if command -v nvidia-smi &>/dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo "unknown")
    GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader 2>/dev/null || echo "unknown")
    echo "  GPU:   $GPU_NAME ($GPU_MEM)"
else
    echo "  WARNING: nvidia-smi not found, CUDA may not work"
fi

echo "========================================"
echo ""

source "$VENV_DIR/bin/activate"
exec python "$SCRIPT_DIR/local_video_service.py"
