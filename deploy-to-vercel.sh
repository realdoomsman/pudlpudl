#!/bin/bash

echo "🚀 Deploying PudlPudl to Vercel..."
echo ""
echo "This will deploy the frontend directory to Vercel"
echo ""

cd frontend

# Check if vercel is installed locally
if [ ! -d "node_modules/vercel" ]; then
    echo "Installing Vercel CLI..."
    npm install vercel
fi

echo ""
echo "Running Vercel deployment..."
echo "You may need to:"
echo "1. Login to Vercel (it will open a browser)"
echo "2. Link to your existing project or create new one"
echo ""

npx vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "Your site should be live at the URL shown above"
