# 🚀 Vercel Deployment Guide for AI Course Platform

## 📋 Prerequisites
- [Vercel Account](https://vercel.com/signup)
- [GitHub Repository](https://github.com) connected
- [Supabase Account](https://supabase.com) (for database)

## 🔧 Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
git add .
git commit -m "Optimize for Vercel deployment"
git push origin main
```

### 1.2 Ensure these files exist:
- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - with proper scripts
- ✅ `vite.config.ts` - optimized build config
- ✅ `api/` folder - with serverless functions

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository

### 2.2 Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

### 2.3 Environment Variables
Add these in Vercel Dashboard > Settings > Environment Variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
VITE_API_URL=https://your-vercel-domain.vercel.app

# Google AI
VITE_GOOGLE_AI_API_KEY=your_google_generative_ai_api_key

# Payment Gateways
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_your_key

# External Services
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
```

## 🗄️ Step 3: Supabase Setup

### 3.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project
3. Get your project URL and anon key

### 3.2 Database Schema
Run this SQL in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan_type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Step 4: Row Level Security (RLS)

### 4.1 Enable RLS
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
```

### 4.2 Create Policies
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Courses are public for viewing
CREATE POLICY "Courses are viewable by everyone" ON courses
  FOR SELECT USING (true);

-- Only course creators can modify their courses
CREATE POLICY "Course creators can modify courses" ON courses
  FOR ALL USING (auth.uid() = user_id);
```

## 🚀 Step 5: Deploy & Test

### 5.1 Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Get your live URL

### 5.2 Test Your App
- ✅ Main page loads
- ✅ Admin panel accessible
- ✅ API endpoints working
- ✅ Database connections successful

## 📱 Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. Go to Vercel Project Settings
2. Domains section
3. Add your domain
4. Update DNS records

### 6.2 Update Environment Variables
```env
VITE_API_URL=https://yourdomain.com
```

## 🔍 Troubleshooting

### Common Issues:

#### Build Fails
- Check `package.json` scripts
- Verify all dependencies are in `dependencies` (not `devDependencies`)
- Check Node.js version compatibility

#### API Routes Not Working
- Verify `vercel.json` routing configuration
- Check API folder structure
- Ensure proper CORS headers

#### Database Connection Issues
- Verify Supabase credentials
- Check RLS policies
- Test connection in Supabase dashboard

## 📊 Monitoring & Analytics

### Vercel Analytics
- Built-in performance monitoring
- Real-time user analytics
- Error tracking

### Supabase Monitoring
- Database performance
- Query analytics
- Real-time subscriptions

## 🔄 Continuous Deployment

### Auto-Deploy
- Every push to `main` branch triggers deployment
- Preview deployments for pull requests
- Automatic rollback on failures

### Environment Management
- Development: `main` branch
- Staging: `staging` branch
- Production: `main` branch with production env vars

## 💰 Cost Optimization

### Vercel Pricing
- **Hobby**: Free (100GB bandwidth/month)
- **Pro**: $20/month (unlimited bandwidth)
- **Enterprise**: Custom pricing

### Supabase Pricing
- **Free**: 500MB database, 2GB bandwidth
- **Pro**: $25/month (8GB database, 250GB bandwidth)
- **Team**: $599/month (100GB database, 2TB bandwidth)

## 🎯 Next Steps

1. **Migrate existing data** from MongoDB to Supabase
2. **Implement real-time features** using Supabase subscriptions
3. **Add authentication** with Supabase Auth
4. **Set up monitoring** and alerting
5. **Implement CI/CD** pipelines

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**Happy Deploying! 🚀**
