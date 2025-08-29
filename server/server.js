// IMPORT
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import gis from 'g-i-s';
import youtubesearchapi from 'youtube-search-api';
import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { createApi } from 'unsplash-js';
import showdown from 'showdown';
import axios from 'axios';
import Stripe from 'stripe';
import Flutterwave from 'flutterwave-node-v3';

// Load environment variables (override any pre-set env from PM2/shell)
dotenv.config({ 
  path: './.env',
  override: true 
});

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'STRIPE_SECRET_KEY', 
  'FLUTTERWAVE_PUBLIC_KEY',
  'FLUTTERWAVE_SECRET_KEY',
  'API_KEY',
  'UNSPLASH_ACCESS_KEY',
  'EMAIL',
  'PASSWORD',
  'ADMIN_TOKEN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

// Initialize services that need config
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);

//INITIALIZE
const app = express();
app.use(cors());
const PORT = process.env.PORT;
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
// MongoDB connection with proper error handling
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}).then(() => {
  console.log('✅ Connected to MongoDB successfully');
}).catch((error) => {
  console.error('❌ MongoDB connection failed:', error);
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    service: 'gmail',
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // For now, we'll use a simple token check
    // In production, you should verify JWT tokens or use proper session management
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Input validation middleware
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    next();
  };
};

// Standardized error response helper
const sendErrorResponse = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    message: message
  };
  
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error.message;
  }
  
  res.status(statusCode).json(response);
};

// Root health route
app.get('/', (req, res) => {
    res.json({
        message: 'AI Course API Server',
        status: 'running',
        endpoints: {
            admin: '/api/admin/*',
            users: '/api/users/*',
            courses: '/api/courses/*'
        }
    });
});

//SCHEMA
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
const courseSchema = new mongoose.Schema({
    user: String,
    content: { type: String, required: true },
    type: String,
    mainTopic: String,
    photo: String,
    date: { type: Date, default: Date.now },
    end: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    category: String,
    tags: [String],
    description: String,
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    duration: Number, // in minutes
    language: { type: String, default: 'English' },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        reviews: [{
            userId: String,
            rating: Number,
            comment: String,
            date: { type: Date, default: Date.now }
        }]
    },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'flagged'],
        default: 'draft'
    },
    metadata: {
        keywords: [String],
        seoDescription: String,
        featured: { type: Boolean, default: false },
        trending: { type: Boolean, default: false }
    }
}, { timestamps: true });
const subscriptionSchema = new mongoose.Schema({
    user: String,
    subscription: String,
    subscriberId: String,
    plan: String,
    method: String,
    date: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    nextBillingDate: Date,
    lastPaymentDate: Date,
    paymentHistory: [{
        amount: Number,
        currency: String,
        date: Date,
        status: String,
        transactionId: String
    }],
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly', 'lifetime'],
        default: 'monthly'
    },
    autoRenew: { type: Boolean, default: true },
    cancellationDate: Date,
    refundHistory: [{
        amount: Number,
        reason: String,
        date: Date,
        status: String
    }]
}, { timestamps: true });
const contactShema = new mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    phone: Number,
    msg: String,
    date: { type: Date, default: Date.now },
});
const notesSchema = new mongoose.Schema({
    course: String,
    notes: String,
});
const examSchema = new mongoose.Schema({
    course: String,
    exam: String,
    marks: String,
    passed: { type: Boolean, default: false },
});
const langSchema = new mongoose.Schema({
    course: String,
    lang: String,
});
const blogSchema = new mongoose.Schema({
    title: { type: String, unique: true, required: true },
    excerpt: String,
    category: String,
    tags: String,
    content: String,
    image: {
        type: Buffer,
        required: true
    },
    popular: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
});

// PHASE 2: ADDITIONAL SCHEMAS
const paymentSchema = new mongoose.Schema({
    user: { type: String, required: true },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['success', 'failed', 'pending', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    gateway: { type: String, required: true },
    metadata: {
        description: String,
        plan: String,
        userId: String
    }
}, { timestamps: true });

const refundSchema = new mongoose.Schema({
    user: { type: String, required: true },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
    date: { type: Date, default: Date.now },
    processedBy: String,
    notes: String,
    originalPayment: {
        transactionId: String,
        amount: Number,
        gateway: String
    }
}, { timestamps: true });

const billingOperationSchema = new mongoose.Schema({
    user: { type: String, required: true },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    type: { type: String, enum: ['manual', 'recurring', 'adjustment'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    description: String,
    date: { type: Date, default: Date.now },
    processedBy: String,
    metadata: {
        plan: String,
        billingCycle: String,
        dueDate: Date
    }
}, { timestamps: true });

//MODEL
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Contact = mongoose.model('Contact', contactShema);
const Admin = mongoose.model('Admin', adminSchema);
const NotesSchema = mongoose.model('Notes', notesSchema);
const ExamSchema = mongoose.model('Exams', examSchema);
const LangSchema = mongoose.model('Lang', langSchema);
const BlogSchema = mongoose.model('Blog', blogSchema);

// Create models
const Payment = mongoose.model('Payment', paymentSchema);
const Refund = mongoose.model('Refund', refundSchema);
const BillingOperation = mongoose.model('BillingOperation', billingOperationSchema);

//REQUEST

// Admin dashboard summary
app.get('/api/dashboard', async (req, res) => {
    try {
        const [userCount, courseCount, paymentAgg, refundsAgg] = await Promise.all([
            User.estimatedDocumentCount(),
            Course.estimatedDocumentCount(),
            Payment.aggregate([
                { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
            ]),
            Refund.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ]);

        const payments = paymentAgg && paymentAgg.length ? paymentAgg[0] : { totalAmount: 0, count: 0 };
        const refundsByStatus = {};
        refundsAgg.forEach(r => { refundsByStatus[r._id] = r.count; });

        return res.json({
            users: userCount || 0,
            courses: courseCount || 0,
            payments: {
                count: payments.count || 0,
                totalAmount: payments.totalAmount || 0
            },
            refunds: refundsByStatus
        });
    } catch (error) {
        console.error('Error building dashboard:', error);
        return res.status(500).json({ success: false, message: 'Failed to load dashboard' });
    }
});

// Support POST for clients that send POST to fetch dashboard
app.post('/api/dashboard', async (req, res) => {
    try {
        const [userCount, courseCount, paymentAgg, refundsAgg] = await Promise.all([
            User.estimatedDocumentCount(),
            Course.estimatedDocumentCount(),
            Payment.aggregate([
                { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
            ]),
            Refund.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ]);

        const payments = paymentAgg && paymentAgg.length ? paymentAgg[0] : { totalAmount: 0, count: 0 };
        const refundsByStatus = {};
        refundsAgg.forEach(r => { refundsByStatus[r._id] = r.count; });

        return res.json({
            users: userCount || 0,
            courses: courseCount || 0,
            payments: {
                count: payments.count || 0,
                totalAmount: payments.totalAmount || 0
            },
            refunds: refundsByStatus
        });
    } catch (error) {
        console.error('Error building dashboard (POST):', error);
        return res.status(500).json({ success: false, message: 'Failed to load dashboard' });
    }
});

//SIGNUP
app.post('/api/signup', validateRequiredFields(['email', 'mName', 'password', 'type']), async (req, res) => {
    const { email, mName, password, type } = req.body;

    try {
        const estimate = await User.estimatedDocumentCount();
        if (estimate > 0) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.json({ success: false, message: 'User with this email already exists' });
            }
            const newUser = new User({ email, mName, password, type });
            await newUser.save();
            res.json({ success: true, message: 'Account created successfully', userId: newUser._id });
        } else {
            const newUser = new User({ email, mName, password, type: 'forever' });
            await newUser.save();
            const newAdmin = new Admin({ email, mName, type: 'main' });
            await newAdmin.save();
            res.json({ success: true, message: 'Account created successfully', userId: newUser._id });
        }
    } catch (error) {
        console.error('Error in signup:', error);
        sendErrorResponse(res, 500, 'Internal server error', error);
    }
});

//SIGNIN
app.post('/api/signin', validateRequiredFields(['email', 'password']), async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        if (password === user.password) {
            return res.json({ success: true, message: 'SignIn Successful', userData: user });
        }

        res.json({ success: false, message: 'Invalid email or password' });

    } catch (error) {
        console.error('Error in signin:', error);
        sendErrorResponse(res, 500, 'Invalid email or password', error);
    }

});

//SIGNINSOCIAL
app.post('/api/social', validateRequiredFields(['email', 'name']), async (req, res) => {
    const { email, name } = req.body;
    let mName = name;
    let password = '';
    let type = 'free';
    try {
        const user = await User.findOne({ email });

        if (!user) {
            const estimate = await User.estimatedDocumentCount();
            if (estimate > 0) {
                const newUser = new User({ email, mName, password, type });
                await newUser.save();
                res.json({ success: true, message: 'Account created successfully', userData: newUser });
            } else {
                const newUser = new User({ email, mName, password, type });
                await newUser.save();
                const newAdmin = new Admin({ email, mName, type: 'main' });
                await newAdmin.save();
                res.json({ success: true, message: 'Account created successfully', userData: newUser });
            }
        } else {
            return res.json({ success: true, message: 'SignIn Successful', userData: user });
        }

    } catch (error) {
        console.error('Error in social signin:', error);
        sendErrorResponse(res, 500, 'Internal Server Error', error);
    }

});

//SEND MAIL
app.post('/api/data', validateRequiredFields(['html', 'to', 'subject']), async (req, res) => {
    const receivedData = req.body;

    try {
        const emailHtml = receivedData.html;

        const options = {
            from: process.env.EMAIL,
            to: receivedData.to,
            subject: receivedData.subject,
            html: emailHtml,
        };

        const data = await transporter.sendMail(options);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error sending email:', error);
        sendErrorResponse(res, 400, 'Failed to send email', error);
    }
});

//FOROGT PASSWORD
app.post('/api/forgot', validateRequiredFields(['email', 'name']), async (req, res) => {
    const { email, name } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetLink = `${process.env.WEBSITE_URL}/reset-password/${token}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: `${name} Password Reset`,
            html: `<html><body><p>Hi ${user.mName || 'there'},</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p></body></html>`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
        console.error('Error in forgot password:', error);
        sendErrorResponse(res, 400, 'Failed to send reset email', error);
    }
});

// Admin check endpoint
app.get('/api/admin/check', async (req, res) => {
    try {
        const admin = await Admin.findOne().sort({ createdAt: 1 });
        if (admin) {
            res.json({
                success: true,
                admin: {
                    email: admin.email,
                    mName: admin.mName,
                    type: admin.type
                }
            });
        } else {
            res.json({
                success: false,
                message: 'No admin found'
            });
        }
    } catch (error) {
        console.error('Error checking admin:', error);
        res.status(500).json({ success: false, message: 'Failed to check admin' });
    }
});

// Admin: payments list with pagination and filtering
app.get('/api/admin/payments', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, gateway, search, dateFilter } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build filter object
        let filter = {};
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (gateway && gateway !== 'all') {
            filter.gateway = gateway;
        }
        
        if (search) {
            filter.$or = [
                { userEmail: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } },
                { gateway: { $regex: search, $options: 'i' } },
                { 'metadata.plan': { $regex: search, $options: 'i' } }
            ];
        }
        
        if (dateFilter && dateFilter !== 'all') {
            const now = new Date();
            let startDate;
            
            switch (dateFilter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }
            
            if (startDate) {
                filter.date = { $gte: startDate };
            }
        }
        
        // Get total count for pagination
        const total = await Payment.countDocuments(filter);
        
        // Get paginated results
        const payments = await Payment.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        res.json({
            success: true,
            payments,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
});

// Admin: refunds list
app.get('/api/admin/refunds', authenticateAdmin, async (req, res) => {
    try {
        const refunds = await Refund.find().sort({ date: -1 });
        res.json(refunds);
    } catch (error) {
        console.error('Error fetching refunds:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch refunds' });
    }
});

// Admin: process a refund
app.post('/api/admin/refunds/process', authenticateAdmin, async (req, res) => {
    try {
        const { refundId, amount, reason, notes, status } = req.body;
        const update = {
            amount,
            reason,
            notes: notes || '',
            status: status === 'approved' ? 'processed' : status || 'processed',
            processedBy: 'admin',
            date: new Date()
        };
        const refund = await Refund.findByIdAndUpdate(refundId, update, { new: true });
        if (!refund) return res.status(404).json({ success: false, message: 'Refund not found' });
        res.json({ success: true, refund });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({ success: false, message: 'Failed to process refund' });
    }
});

// Admin: bulk approve/reject refunds
app.post('/api/admin/refunds/bulk', authenticateAdmin, async (req, res) => {
    try {
        const { refundIds, action, notes } = req.body;
        const status = action === 'approve' ? 'approved' : 'rejected';
        await Refund.updateMany({ _id: { $in: refundIds } }, { $set: { status, notes: notes || '' } });
            res.json({ success: true });
    } catch (error) {
        console.error('Error in bulk refunds:', error);
        res.status(500).json({ success: false, message: 'Failed bulk operation' });
    }
});

// Admin: bulk payment operations
app.post('/api/admin/payments/bulk', authenticateAdmin, async (req, res) => {
    try {
        const { paymentIds, action, status, notes } = req.body;
        
        if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Payment IDs array is required'
            });
        }
        
        let updateData = {};
        
        switch (action) {
            case 'updateStatus':
                if (!status || !['success', 'failed', 'pending', 'refunded'].includes(status)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Valid status is required for updateStatus action'
                    });
                }
                updateData.status = status;
                if (notes) updateData['metadata.notes'] = notes;
                break;
                
            case 'delete':
                // Only allow deletion of failed or pending payments
                const paymentsToDelete = await Payment.find({
                    _id: { $in: paymentIds },
                    status: { $in: ['failed', 'pending'] }
                });
                
                if (paymentsToDelete.length !== paymentIds.length) {
                    return res.status(400).json({
                        success: false,
                        message: 'Some payments cannot be deleted (only failed/pending payments can be deleted)'
                    });
                }
                
                await Payment.deleteMany({ _id: { $in: paymentIds } });
                
                return res.json({
                    success: true,
                    message: `${paymentsToDelete.length} payments deleted successfully`
                });
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Supported actions: updateStatus, delete'
                });
        }
        
        const result = await Payment.updateMany(
            { _id: { $in: paymentIds } },
            { $set: updateData }
        );
        
        res.json({
            success: true,
            message: `${result.modifiedCount} payments updated successfully`
        });
    } catch (error) {
        console.error('Error in bulk payment operations:', error);
        res.status(500).json({ success: false, message: 'Failed to perform bulk operation' });
    }
});

// Admin: delete payment
app.delete('/api/admin/payments/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        // Only allow deletion of failed or pending payments
        if (payment.status === 'success') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete successful payments'
            });
        }
        
        await Payment.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Payment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ success: false, message: 'Failed to delete payment' });
    }
});

// Admin: get payment analytics
app.get('/api/admin/payments/analytics', authenticateAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        let startDate;
        const now = new Date();
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        const analytics = await Payment.aggregate([
            {
                $match: {
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        status: '$status',
                        gateway: '$gateway',
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $group: {
                    _id: '$_id.status',
                    count: { $sum: '$count' },
                    totalAmount: { $sum: '$totalAmount' },
                    gateways: {
                        $push: {
                            gateway: '$_id.gateway',
                            count: '$count',
                            amount: '$totalAmount'
                        }
                    }
                }
            }
        ]);
        
        res.json({
            success: true,
            analytics,
            period,
            startDate,
            endDate: now
        });
    } catch (error) {
        console.error('Error fetching payment analytics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
});

// Admin: update payment status
app.put('/api/admin/payments/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        if (!['success', 'failed', 'pending', 'refunded'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: success, failed, pending, refunded'
            });
        }
        
        const payment = await Payment.findByIdAndUpdate(
            id,
            { 
                status,
                ...(notes && { 'metadata.notes': notes })
            },
            { new: true }
        );
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        res.json({
            success: true,
            payment,
            message: 'Payment status updated successfully'
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ success: false, message: 'Failed to update payment status' });
    }
});

// Admin: generate invoice
app.post('/api/admin/invoices/generate', authenticateAdmin, async (req, res) => {
    try {
        const { paymentId } = req.body;
        
        // Find the payment
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Payment not found' 
            });
        }
        
        // Generate invoice HTML content
        const invoiceHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Invoice - ${payment.transactionId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .payment-info { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
                    .amount { font-size: 24px; font-weight: bold; color: #2c5aa0; }
                    .status { padding: 5px 10px; border-radius: 3px; font-weight: bold; }
                    .status.success { background: #d4edda; color: #155724; }
                    .status.failed { background: #f8d7da; color: #721c24; }
                    .status.pending { background: #fff3cd; color: #856404; }
                    .status.refunded { background: #d1ecf1; color: #0c5460; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>INVOICE</h1>
                    <h2>${process.env.COMPANY_NAME || 'AiCourse'}</h2>
                </div>
                
                <div class="invoice-details">
                    <div>
                        <strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}<br>
                        <strong>Transaction ID:</strong> ${payment.transactionId}<br>
                        <strong>Payment Date:</strong> ${new Date(payment.date).toLocaleDateString()}
                    </div>
                    <div>
                        <strong>Customer:</strong><br>
                        ${payment.userEmail}<br>
                        Plan: ${payment.metadata?.plan || 'Unknown'}
                    </div>
                </div>
                
                <div class="payment-info">
                    <h3>Payment Summary</h3>
                    <table>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                        <tr>
                            <td>${payment.metadata?.description || 'Course Subscription'}</td>
                            <td class="amount">$${payment.amount.toFixed(2)} ${payment.currency}</td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 20px;">
                        <strong>Payment Method:</strong> ${payment.paymentMethod}<br>
                        <strong>Gateway:</strong> ${payment.gateway}<br>
                        <strong>Status:</strong> 
                        <span class="status ${payment.status}">${payment.status.toUpperCase()}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 40px; color: #666;">
                    <p>Thank you for your business!</p>
                    <p>For support, contact: ${process.env.EMAIL || 'support@aicourse.com'}</p>
                </div>
            </body>
            </html>
        `;
        
        // For now, return the HTML content
        // In production, you should convert this to PDF using a library like puppeteer or html-pdf
        res.json({ 
            success: true, 
            invoiceHtml,
            message: 'Invoice generated successfully. Convert to PDF in production.'
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ success: false, message: 'Failed to generate invoice' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${process.env.PORT || 5000}/api/health`);
});
