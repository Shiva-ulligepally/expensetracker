require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const expenseRoutes = require('./routes/expenseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://expensetracker-frontend-zeta.vercel.app',
  'https://expensetracker-five-phi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {

    console.log("Request Origin:", origin);

    // Allow requests without origin
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Allow ALL Vercel deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Allow configured frontend URL
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked Origin:", origin);
    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => res.send('API running'));
app.get('/api', (req, res) => res.send('API running'));

app.use('/api/expenses', expenseRoutes);
app.use('/expenses', expenseRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
