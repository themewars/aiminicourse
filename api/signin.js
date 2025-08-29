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
  lastLogin: { type: Date, default: Date.now },
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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password (simple comparison for now - in production use bcrypt)
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is admin
    const admin = await Admin.findOne({ email });
    const isAdmin = !!admin;

    // Update last login and add to login history
    user.lastLogin = new Date();
    user.loginHistory.push({
      date: new Date(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    await user.save();

    // Return user data (without password)
    const userData = {
      _id: user._id,
      email: user.email,
      mName: user.mName,
      type: user.type,
      isAdmin,
      profile: user.profile,
      preferences: user.preferences,
      stats: user.stats,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.status(200).json({
      success: true,
      message: 'SignIn Successful',
      userData
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
