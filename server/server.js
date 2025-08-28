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
dotenv.config({ override: true });

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'STRIPE_SECRET_KEY', 
  'FLUTTERWAVE_PUBLIC_KEY',
  'FLUTTERWAVE_SECRET_KEY',
  'API_KEY',
  'UNSPLASH_ACCESS_KEY',
  'EMAIL',
  'PASSWORD'
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

// Admin: payments list
app.get('/api/admin/payments', async (req, res) => {
    try {
        const payments = await Payment.find().sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
});

// Admin: refunds list
app.get('/api/admin/refunds', async (req, res) => {
    try {
        const refunds = await Refund.find().sort({ date: -1 });
        res.json(refunds);
    } catch (error) {
        console.error('Error fetching refunds:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch refunds' });
    }
});

// Admin: process a refund
app.post('/api/admin/refunds/process', async (req, res) => {
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
app.post('/api/admin/refunds/bulk', async (req, res) => {
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

// Admin: generate invoice (stub)
app.post('/api/admin/invoices/generate', async (req, res) => {
    try {
        const { paymentId } = req.body;
        const invoiceUrl = `${process.env.WEBSITE_URL || ''}/invoices/${paymentId}.pdf`;
        res.json({ success: true, invoiceUrl });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ success: false, message: 'Failed to generate invoice' });
    }
});

// Start server
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
