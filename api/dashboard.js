// Vercel Serverless Function for Dashboard
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Mock data for now - replace with Supabase queries later
    const mockData = {
      users: 1250,
      courses: 89,
      payments: {
        count: 456,
        totalAmount: 45600
      },
      refunds: {
        processed: 23,
        pending: 5,
        rejected: 2
      }
    };

    res.status(200).json(mockData);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data' 
    });
  }
}
