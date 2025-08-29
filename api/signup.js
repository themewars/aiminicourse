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

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: String,
  password: String,
  type: String,
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  loginHistory: [{ 
    date: { type: Date, default: Date.now },
    ip: String,
    userAgent: String
  }],
  profile: {
    avatar: String,
    bio: String,
    location: String,
    website: String,
    socialLinks: {
      twitter: String,
      linkedin: String,
      github: String
    }
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    courseRecommendations: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },
  stats: {
    totalCourses: { type: Number, default: 0 },
    completedCourses: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  }
}, { timestamps: true });

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

// Models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default async function handler(req, res) {
  console.log('🚀 Signup API called:', req.method, req.url);
  console.log('📝 Request body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    const { email, mName, password, type } = req.body;

    // Validate required fields
    if (!email || !mName || !password || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, mName, password, type'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.estimatedDocumentCount();
    
    let userType = type;
    if (userCount === 0) {
      userType = 'forever'; // First user gets forever access
    }

    // Create new user
    const newUser = new User({
      email,
      mName,
      password,
      type: userType
    });

    await newUser.save();

    // If this is the first user, also create admin record
    if (userCount === 0) {
      const newAdmin = new Admin({
        email,
        mName,
        type: 'main'
      });
      await newAdmin.save();
    }

    res.status(200).json({
      success: true,
      message: 'Account created successfully',
      userId: newUser._id,
      isFirstUser: userCount === 0
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
