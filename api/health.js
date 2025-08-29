export default function handler(req, res) {
  console.log('🔍 Health check API called:', req.method, req.url);
  console.log('📊 Environment variables check:', {
    hasMongo: !!process.env.MONGODB_URI,
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    hasFlutter: !!process.env.FLUTTERWAVE_SECRET_KEY,
    hasApi: !!process.env.API_KEY,
    hasAdmin: !!process.env.ADMIN_TOKEN
  });
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const response = {
    success: true,
    message: 'Vercel API is running successfully! 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.2',
    forceDeploy: true,
    debug: {
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      envCheck: {
        mongo: !!process.env.MONGODB_URI,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        flutter: !!process.env.FLUTTERWAVE_SECRET_KEY
      }
    }
  };

  console.log('✅ Health check response:', response);
  res.status(200).json(response);
}
