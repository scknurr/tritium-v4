#!/bin/bash
set -e

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up local Supabase environment..."
cp .env.local .env

echo "🔄 Ensuring project is linked to remote Supabase project..."
if supabase link --project-ref vearpapzcfmtbtbrnuzb; then
  echo "✅ Project linked successfully."
else
  echo "⚠️ Could not link project. You may need to provide your database password."
  echo "Please run 'supabase link --project-ref vearpapzcfmtbtbrnuzb' manually."
fi

echo "🐳 Starting Supabase local containers..."
npm run supabase:start

echo "⏳ Waiting for Supabase to initialize (30 seconds)..."
sleep 30

echo "🔄 Pulling schema from remote database..."
supabase db pull || echo "⚠️ Failed to pull schema. You may need to provide your database password."

echo "🚀 Starting development server..."
npm run dev 