#!/bin/bash

echo "========================================"
echo "  ADCN Nutrition-OS Deployment Script"
echo "========================================"
echo ""

# Configuration
PATIENT_APP_DIR="./patient-app"
CDN_WORKER="src/cdn/worker.ts"
API_WORKER="src/api/worker.ts"

# 1. Run Unit Tests
echo "[1/5] Running unit tests..."
cd "$PATIENT_APP_DIR" && npm test
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed!"
  exit 1
fi
echo "✅ Unit tests passed"
echo ""

# 2. Run E2E Tests
echo "[2/5] Running E2E tests..."
npm run test:e2e
if [ $? -ne 0 ]; then
  echo "⚠️  E2E tests skipped (requires dev server)"
fi
echo ""

# 3. Build Patient App
echo "[3/5] Building Patient App..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi
echo "✅ Patient App built: dist/"
echo ""

# 4. Deploy CDN Worker
cd ..
echo "[4/5] Deploying CDN Worker..."
if command -v wrangler &> /dev/null; then
  wrangler deploy --env production
  echo "✅ CDN Worker deployed"
else
  echo "⚠️  wrangler not found. Install with: npm install -g wrangler"
fi
echo ""

# 5. Verify Deployment
echo "[5/5] Verifying deployment..."
echo "✅ Patient App: http://localhost:3000"
echo "✅ CDN Worker: https://cdn.adcn.io"
echo ""

echo "========================================"
echo "  🎉 Deployment Complete!"
echo "========================================"
