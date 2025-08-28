# 🚀 Vercel Deployment Guide for AI Course Platform

## 📋 Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [GitHub/GitLab Repository](https://github.com)
- [MongoDB Atlas Account](https://www.mongodb.com/atlas)
- [Stripe Account](https://stripe.com) (for payments)
- [Flutterwave Account](https://flutterwave.com) (for payments)
- [Google AI API Key](https://makersuite.google.com/app/apikey)
- [Unsplash API Key](https://unsplash.com/developers)

## 🔧 Environment Variables Setup

### 1. Create Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Flutterwave Configuration
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_...

# Google AI Configuration
API_KEY=your_google_ai_api_key

# Unsplash Configuration
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Email Configuration
EMAIL=your_email@gmail.com
PASSWORD=your_app_password

# Website Configuration
WEBSITE_URL=https://your-domain.vercel.app
NODE_ENV=production

# Port Configuration
PORT=5000
```

### 2. Environment Variables for Different Environments

- **Production**: Add to Production environment
- **Preview**: Add to Preview environment  
- **Development**: Add to Development environment

## 🚀 Deployment Steps

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository

### 2. Configure Build Settings

- **Framework Preset**: Other
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Check for any build errors

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in Vercel dashboard
# Common causes:
# - Missing environment variables
# - TypeScript compilation errors
# - Missing dependencies
```

#### 2. MongoDB Connection Issues
```bash
# Ensure MONGODB_URI is correct
# Check MongoDB Atlas network access
# Verify database user permissions
```

#### 3. API Endpoints Not Working
```bash
# Check vercel.json configuration
# Verify API routes are properly configured
# Check serverless function limits
```

### Debug Commands

```bash
# Local testing
npm run dev

# Build testing
npm run build

# Preview build
npm run preview
```

## 📁 Project Structure

```
├── api/                    # Vercel serverless functions
│   └── index.js          # API entry point
├── server/                # Express server (for local dev)
│   └── server.js         # Main server file
├── src/                   # React frontend
├── scripts/               # Build scripts
│   └── vercel-build.js   # Vercel build script
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files
- Use Vercel's environment variable system
- Rotate API keys regularly

### 2. API Security
- Implement rate limiting
- Add authentication middleware
- Validate all inputs

### 3. Database Security
- Use MongoDB Atlas security features
- Implement proper user roles
- Regular security audits

## 📊 Monitoring & Analytics

### 1. Vercel Analytics
- Enable in project settings
- Monitor performance metrics
- Track user behavior

### 2. Error Tracking
- Implement error logging
- Monitor API response times
- Track build success rates

## 🚀 Performance Optimization

### 1. Frontend
- Enable Vite build optimization
- Implement code splitting
- Use React.memo for components

### 2. Backend
- Implement caching strategies
- Optimize database queries
- Use connection pooling

## 📞 Support

### 1. Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

### 2. Project Issues
- Check GitHub issues
- Review build logs
- Test locally first

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection working
- [ ] API endpoints responding
- [ ] Frontend building successfully
- [ ] Payment gateways configured
- [ ] Email service working
- [ ] Error handling implemented
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] Monitoring enabled

## 🎉 Success!

Once deployed, your AI Course Platform will be available at:
`https://your-project-name.vercel.app`

Remember to:
- Test all functionality
- Monitor performance
- Set up backups
- Plan for scaling
