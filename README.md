# 🎓 AiCourse - AI-Powered Course Generator

> **Transform any text into comprehensive, structured courses with the power of AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

## 🌟 Features

- **AI Course Generation**: Convert any topic into structured courses
- **Multiple Course Types**: Text-based and video courses
- **Subscription Management**: Free, Monthly, and Yearly plans
- **Payment Integration**: PayPal, Stripe, Razorpay, Paystack, Flutterwave
- **Admin Panel**: Comprehensive management dashboard
- **User Management**: Role-based access control
- **Blog System**: Content management and publishing
- **Responsive Design**: Mobile-first approach
- **PWA Ready**: Progressive Web App capabilities

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** 6.x or higher
- **Git** for version control
- **API Keys** for payment gateways and AI services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aicourse.git
   cd aicourse
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Start backend server
   cd server
   npm run dev
   
   # Terminal 2: Start frontend development server
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:4173
   - Backend: http://localhost:5000
   - Admin Panel: http://localhost:4173/admin

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/aicourse

# Server
PORT=5000
NODE_ENV=development

# AI Services
API_KEY=your_google_generative_ai_api_key

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_your_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_your_key

# Email
EMAIL=your_email@gmail.com
PASSWORD=your_app_password

# External Services
UNSPLASH_ACCESS_KEY=your_unsplash_key

# URLs
WEBSITE_URL=http://localhost:4173
SERVER_URL=http://localhost:5000
```

### Required API Keys

- **Google Generative AI**: [Get API Key](https://makersuite.google.com/app/apikey)
- **Stripe**: [Get API Keys](https://dashboard.stripe.com/apikeys)
- **Flutterwave**: [Get API Keys](https://dashboard.flutterwave.com/settings/apis)
- **PayPal**: [Get API Keys](https://developer.paypal.com/)
- **Razorpay**: [Get API Keys](https://razorpay.com/docs/api/)
- **Paystack**: [Get API Keys](https://paystack.com/docs/api/)
- **Unsplash**: [Get API Key](https://unsplash.com/developers)

## 🏗️ Project Structure

```
aicourse/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── minimal-tiptap/    # Rich text editor
├── server/                 # Backend server code
│   └── server.js          # Main server file
├── public/                 # Static assets
├── .env                    # Environment variables
├── package.json            # Frontend dependencies
└── README.md              # This file
```

## 🎯 Admin Panel Features

### User Management
- View all users
- Edit user details
- Delete users
- Assign admin roles
- Track user activity

### Course Management
- View all courses
- Edit course content
- Delete courses
- Approve/publish courses
- Manage course categories

### Billing System
- Subscription management
- Payment processing
- Refund handling
- Revenue analytics
- Invoice generation

### Content Management
- Blog post management
- Content moderation
- Policy management
- User reports handling

## 🛠️ Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend
cd server
npm run dev          # Start development server
npm start            # Start production server
```

### Code Style

- **Frontend**: TypeScript, React 18, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier (recommended)

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Start production server
cd server
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t aicourse .

# Run container
docker run -p 5000:5000 -p 4173:4173 aicourse
```

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
API_KEY=your_production_api_key
# ... other production variables
```

## 📊 Monitoring & Analytics

- **Performance Monitoring**: Built-in metrics collection
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: User behavior tracking
- **Revenue Analytics**: Payment and subscription metrics
- **System Health**: Server and database monitoring

## 🔒 Security Features

- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **Data Protection**: Input validation and sanitization
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin resource sharing
- **HTTPS**: Secure communication (production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/yourusername/aicourse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/aicourse/discussions)
- **Email**: support@aicourse.com

### Common Issues

#### MongoDB Connection Error
```bash
# Ensure MongoDB is running
mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/aicourse
```

#### Payment Gateway Errors
- Verify API keys in `.env` file
- Check payment gateway dashboard for errors
- Ensure test mode is enabled for development

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🎉 Acknowledgments

- **Google Generative AI** for course generation capabilities
- **Payment Gateway Providers** for seamless payment processing
- **Open Source Community** for amazing tools and libraries
- **Contributors** who help improve this project

## 📈 Roadmap

### Phase 1: Critical Foundation ✅
- [x] Environment configuration
- [x] Basic documentation
- [x] User management enhancements
- [x] Course management enhancements

### Phase 2: Billing System Core 🚧
- [ ] Subscription management
- [ ] Payment processing
- [ ] Refund system
- [ ] Billing operations

### Phase 3: Advanced Analytics 📊
- [ ] Revenue analytics
- [ ] User analytics
- [ ] Course analytics
- [ ] Financial reports

### Future Phases
- Content moderation
- System management
- Security enhancements
- Communication tools
- Advanced features

---

**Made with ❤️ by the AiCourse Team**

For more information, visit [https://aicourse.com](https://aicourse.com)
