#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# build.sh – pre-install hook for Railway/Render/Koyeb
# Installs PyTorch CPU-only FIRST so pip doesn't download the
# 2+ GB CUDA variants from PyPI.
# ─────────────────────────────────────────────────────────────────
set -e

echo "→ Installing PyTorch (CPU-only)…"
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

echo "→ Installing remaining dependencies…"
pip install -r requirements.txt
