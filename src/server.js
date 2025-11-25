const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT, NODE_ENV } = require('./config/env');

// Import routes
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const mailRoutes = require('./routes/mailRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import services
const db = require('./config/db');   // PostgreSQL pool
const schedulerService = require('./services/schedulerService');

const app = express();

// ⭐ CORS Configuration - Allow all origins for development
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AutoHR API is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AutoHR API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      companies: '/api/companies',
      resumes: '/api/resumes',
      mail: '/api/mail',
      settings: '/api/settings'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ⭐ Start server function
const startServer = async () => {
  try {
    // ⭐ PostgreSQL connection test
    const client = await db.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();

    // Start scheduler service
    schedulerService.start();
    console.log('✅ Scheduler started');

    // ⭐ Start Express server
    app.listen(PORT, () => {
      console.log('🚀 Server running on port ' + PORT + ' in ' + NODE_ENV + ' mode');
      console.log('📍 API: http://localhost:' + PORT);
      console.log('❤️  Health check: http://localhost:' + PORT + '/health');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
