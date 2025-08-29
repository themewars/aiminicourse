export default function handler(req, res) {
  console.log('🧪 Test API called:', req.method, req.url);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const response = {
    success: true,
    message: 'Test API is working! 🎯',
    timestamp: new Date().toISOString(),
    version: '1.0.2',
    forceDeploy: true,
    testData: {
      random: Math.random(),
      date: new Date().toISOString(),
      headers: Object.keys(req.headers).length,
      method: req.method,
      url: req.url
    }
  };

  console.log('✅ Test API response:', response);
  res.status(200).json(response);
}
