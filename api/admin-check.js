import mongoose from 'mongoose';

// MongoDB connection
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: String,
  type: { type: String, required: true },
  total: { type: Number, default: 0 },
  terms: { type: String, default: '' },
  privacy: { type: String, default: '' },
  cancel: { type: String, default: '' },
  refund: { type: String, default: '' },
  billing: { type: String, default: '' }
});

// Model
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    // Find the first admin user (created first)
    const admin = await Admin.findOne().sort({ createdAt: 1 });

    if (admin) {
      res.status(200).json({
        success: true,
        admin: {
          email: admin.email,
          mName: admin.mName,
          type: admin.type
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No admin found'
      });
    }

  } catch (error) {
    console.error('Error checking admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
