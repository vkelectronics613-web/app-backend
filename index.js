const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables dynamically based on file location
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./src/config/db');
const { initializeFirebase } = require('./src/config/firebase');
const { errorHandler } = require('./src/middleware/errorMiddleware');
const { initializeSocket } = require('./src/socket/socketManager');

// Initialize Integrations
connectDB();
initializeFirebase();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes Imports
const authRoutes = require('./src/routes/authRoutes');
const rewardsRoutes = require('./src/routes/rewardsRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const admobRoutes = require('./src/routes/admobRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rewards', rewardsRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/admob', admobRoutes);
app.use('/api/v1/admin', adminRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to RupeeCash API' });
});

// Error Middleware
app.use(errorHandler);// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
