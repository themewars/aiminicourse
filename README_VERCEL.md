# 🚀 AI Course Platform - Vercel Optimized

A modern, scalable AI course platform built with React, TypeScript, and Vite, optimized for Vercel deployment.

## ✨ Features

- 🎓 **Course Management** - Create, edit, and manage AI courses
- 👥 **User Management** - Role-based access control
- 💳 **Payment Integration** - Stripe, Flutterwave, and more
- 📊 **Admin Dashboard** - Analytics and user insights
- 🔐 **Authentication** - Secure user login and registration
- 📱 **PWA Ready** - Progressive Web App capabilities
- 🎨 **Modern UI** - Built with Shadcn UI and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe, Flutterwave
- **AI Integration**: Google Generative AI

## 🚀 Quick Deploy

### Option 1: Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/aicourse)

1. Click the deploy button above
2. Connect your GitHub repository
3. Add environment variables
4. Deploy!

### Option 2: Manual Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/aicourse.git
cd aicourse

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## ⚙️ Environment Variables

Create a `.env.local` file or add these in Vercel Dashboard:

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
```

## 📁 Project Structure

```
aicourse/
├── api/                    # Vercel serverless functions
│   ├── dashboard.js       # Dashboard API
│   ├── users.js          # Users API
│   └── courses.js        # Courses API
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── lib/              # Utilities and API client
│   └── contexts/         # React contexts
├── vercel.json           # Vercel configuration
├── vite.config.ts        # Vite build configuration
└── package.json          # Dependencies and scripts
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 API Endpoints

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

## 🗄️ Database Schema

The platform uses Supabase (PostgreSQL) with the following main tables:

- **users** - User accounts and profiles
- **courses** - Course information and content
- **subscriptions** - User subscription plans
- **payments** - Payment transaction history
- **refunds** - Refund processing and history

## 🔐 Authentication

- **Supabase Auth** for user management
- **Row Level Security (RLS)** for data protection
- **JWT tokens** for API authentication
- **Role-based access control** (Admin, User)

## 💳 Payment Integration

- **Stripe** - Credit card payments
- **Flutterwave** - African payment gateway
- **PayPal** - International payments
- **Razorpay** - Indian payment gateway

## 📱 PWA Features

- **Offline support** with service worker
- **App-like experience** on mobile
- **Push notifications** (configurable)
- **Install prompt** for mobile devices

## 🚀 Performance Features

- **Code splitting** with dynamic imports
- **Lazy loading** for components
- **Image optimization** with Vite
- **Tree shaking** for unused code removal
- **CDN distribution** via Vercel Edge Network

## 📊 Monitoring & Analytics

- **Vercel Analytics** - Performance monitoring
- **Supabase Dashboard** - Database insights
- **Error tracking** with built-in logging
- **Real-time metrics** and user analytics

## 🔄 Continuous Deployment

- **Automatic deployment** on Git push
- **Preview deployments** for pull requests
- **Environment management** for staging/production
- **Rollback capability** for failed deployments

## 🛡️ Security Features

- **HTTPS enforcement** via Vercel
- **CORS protection** for API endpoints
- **SQL injection prevention** with parameterized queries
- **XSS protection** with Content Security Policy
- **Rate limiting** for API endpoints

## 📈 Scaling

- **Serverless functions** for API endpoints
- **Edge caching** for static assets
- **Global CDN** distribution
- **Automatic scaling** based on traffic

## 🎯 Roadmap

- [ ] **Real-time features** with Supabase subscriptions
- [ ] **Advanced analytics** dashboard
- [ ] **Mobile app** with React Native
- [ ] **AI-powered course recommendations**
- [ ] **Multi-language support**
- [ ] **Advanced payment workflows**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/aicourse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/aicourse/discussions)

## 🙏 Acknowledgments

- **Vercel** for amazing deployment platform
- **Supabase** for powerful backend services
- **Shadcn UI** for beautiful components
- **Vite** for fast build tooling

---

**Built with ❤️ for the AI education community**
