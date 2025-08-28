// Vercel Serverless Function for Users API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Mock users data
        const mockUsers = [
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin', status: 'active' }
        ];
        res.status(200).json({ success: true, users: mockUsers });
        break;

      case 'POST':
        // Create user logic here
        res.status(201).json({ success: true, message: 'User created successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Users API Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
