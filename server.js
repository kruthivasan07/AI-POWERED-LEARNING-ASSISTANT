require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/documents');
const generateRoute = require('./routes/generate');

const app = express();
app.use(cors());
app.use(express.json());
app.use( express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/generate', generateRoute);

const PORT = process.env.PORT || 5000;

async function start() {
  let mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.log('MONGO_URI not set — starting in-memory MongoDB for development');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      // Optional: keep 'mongod' in memory if you want to stop it later
      // global.__MONGOD__ = mongod;
    } catch (err) {
      console.error('Failed to start in-memory MongoDB:', err);
      process.exit(1);
    }
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Mongo connected');

    // Bind to 0.0.0.0 and print the actual address/port
    const server = app.listen(PORT, '0.0.0.0', () => {
      const addr = server.address();
      console.log(`Server running on ${addr.address}:${addr.port}`);
    });

  } catch (err) {
    console.error('Mongo connection error', err);
    process.exit(1);
  }
}

start();