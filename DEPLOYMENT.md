# 🚀 Deployment Guide

This guide will help you deploy the Money Tracking & POS System to various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Firebase project set up
- ✅ Environment variables configured
- ✅ Domain name (optional)

## 🔥 Firebase Setup (Required)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `money-tracking-pos`
4. Enable Google Analytics (optional)

### 2. Enable Services
```bash
# Enable required services
- Authentication (Email/Password)
- Firestore Database
- Storage (for receipts/invoices)
```

### 3. Get Configuration
1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Click "Add app" > Web app
4. Copy the configuration object

### 4. Set Up Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## ▲ Vercel Deployment (Recommended)

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AliTarekg/Invoice)

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Or via CLI:
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# ... (add all Firebase config variables)

# Deploy to production
vercel --prod
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  money-tracking:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_FIREBASE_API_KEY=${FIREBASE_API_KEY}
      - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}
      # ... other environment variables
```

### Deploy with Docker
```bash
# Build image
docker build -t money-tracking-pos .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key \
  money-tracking-pos
```

## ☁️ AWS Deployment

### Using AWS Amplify
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Using AWS ECS
1. Build Docker image
2. Push to ECR
3. Create ECS service
4. Configure load balancer

## 🌐 Netlify Deployment

### Via Git Integration
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

### Via CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

## 🔧 Environment Variables

Create `.env.local` file with:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# Application Settings
NEXT_PUBLIC_COMPANY_NAME="Your Company Name"
NEXT_PUBLIC_COMPANY_LOGO="/logo.png"
NEXT_PUBLIC_CURRENCY="EGP"

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## 🛡️ Security Checklist

### Pre-deployment
- [ ] Firebase security rules configured
- [ ] Environment variables secured
- [ ] Authentication enabled
- [ ] HTTPS enforced
- [ ] API keys restricted
- [ ] Backup strategy in place

### Post-deployment
- [ ] Test all features
- [ ] Check mobile responsiveness
- [ ] Verify SSL certificate
- [ ] Test authentication flow
- [ ] Monitor performance
- [ ] Set up alerts

## 📊 Monitoring & Analytics

### Performance Monitoring
```bash
# Add to your app
npm install @vercel/analytics

# In your app
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  return (
    <>
      {/* Your app */}
      <Analytics />
    </>
  )
}
```

### Error Tracking
```bash
# Add Sentry
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs')
```

## 🔄 CI/CD Pipeline

The repository includes GitHub Actions workflows for:
- ✅ Automated testing
- ✅ Security scanning
- ✅ Code quality checks
- ✅ Automatic deployment

### Manual CI/CD Setup
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## 🎯 Domain Setup

### Custom Domain
1. **Vercel**: Add domain in dashboard
2. **Netlify**: Configure domain settings
3. **AWS**: Use Route 53 or CloudFront
4. **Cloudflare**: Set up DNS records

### SSL Certificate
Most platforms provide automatic SSL:
- ✅ Vercel: Automatic
- ✅ Netlify: Automatic
- ✅ AWS Amplify: Automatic
- 🔧 Self-hosted: Use Let's Encrypt

## 🚨 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear cache
npm run clean
rm -rf .next
npm install

# Check Node version
node --version  # Should be 18+
```

**Firebase Connection**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY

# Test Firebase config
npm run build  # Should show no Firebase errors
```

**Performance Issues**
```bash
# Analyze bundle
npm run analyze

# Check image optimization
npm install next-optimized-images
```

## 📞 Support

Need help with deployment?
- 📧 Email: support@yourcompany.com
- 🐛 Issues: [GitHub Issues](https://github.com/AliTarekg/Invoice/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/AliTarekg/Invoice/discussions)

## 🎉 Post-Deployment

After successful deployment:
1. ✅ Create admin user account
2. ✅ Add initial product data
3. ✅ Configure company settings
4. ✅ Test POS functionality
5. ✅ Train users on the system
6. ✅ Set up regular backups

---

**Happy Deploying! 🚀**
