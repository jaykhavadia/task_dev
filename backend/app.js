const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require("path");

// Middleware
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const rateLimiter = require('./middleware/rateLimit');


dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();
const buildPath = path.join(__dirname, "..", "spa", "dist");
app.use(express.static(buildPath));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiter); // Apply rate limiting

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

const logger = require('./utils/logger');

app.get("/api/test", (req, res) => {
  res.send("Everything is Healthy...!");
});

app.get("*", (req, res) => {
  console.log("Route :->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", req.url);
  res.sendFile(path.join(buildPath, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server Error: %s', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
