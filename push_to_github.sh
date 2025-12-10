#!/bin/bash
# Script to push AI Job Market Dashboard to GitHub

echo "🚀 Pushing AI Job Market Dashboard to GitHub"
echo ""

# Check if remote already exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Remote 'origin' already configured"
    REMOTE_URL=$(git remote get-url origin)
    echo "   Current remote: $REMOTE_URL"
    echo ""
    read -p "Do you want to use this remote? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please create a new repository on GitHub and run:"
        echo "  git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
        exit 1
    fi
else
    echo "📝 To create a new GitHub repository:"
    echo ""
    echo "   1. Go to https://github.com/new"
    echo "   2. Repository name: AI-Job-Market-Dashboard (or your choice)"
    echo "   3. Description: AI-Driven Job Market Intelligence Dashboard"
    echo "   4. Choose Public or Private"
    echo "   5. DO NOT initialize with README, .gitignore, or license"
    echo "   6. Click 'Create repository'"
    echo ""
    read -p "Enter your GitHub username: " GITHUB_USERNAME
    read -p "Enter your repository name (default: AI-Job-Market-Dashboard): " REPO_NAME
    REPO_NAME=${REPO_NAME:-AI-Job-Market-Dashboard}
    
    REMOTE_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    git remote add origin "$REMOTE_URL"
    echo "✅ Added remote: $REMOTE_URL"
fi

echo ""
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🔐 Next steps:"
    echo "   1. Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\/[^/]*\)\.git/\1/')"
    echo "   2. Settings → Secrets and variables → Actions"
    echo "   3. Add secrets: RAPIDAPI_KEY, RAPIDAPI_HOST, JSEARCH_API_ENDPOINT"
    echo "   4. Go to Actions tab → Run workflow manually to test"
else
    echo ""
    echo "❌ Push failed. Make sure:"
    echo "   - Repository exists on GitHub"
    echo "   - You have push access"
    echo "   - Remote URL is correct"
fi

