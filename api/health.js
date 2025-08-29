export default function handler(req, res) {
  console.log('🔍 Health check API called:', req.method, req.url);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const response = {
    success: true,
    message: 'Vercel API is running successfully! 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.1',
    debug: {
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
    }
  };

  console.log('✅ Health check response:', response);
  res.status(200).json(response);
}
