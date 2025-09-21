require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Example API route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date() });
});

// User routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Schedule routes
const scheduleRoutes = require('./routes/schedule');
app.use('/api/schedule', scheduleRoutes);

// Course routes
const courseRoutes = require('./routes/courses');
app.use('/api/courses', courseRoutes);

// Catalog routes
const catalogRoutes = require('./routes/catalog');
app.use('/api/catalog', catalogRoutes);

// Reports routes
const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

// Chat routes
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// Create HTTP server
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const { initializeSocketServer } = require('./socket/socketServer');
const io = initializeSocketServer(server);

// Make io accessible in routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});