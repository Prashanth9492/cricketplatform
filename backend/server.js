import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';




import teamsRouter from './routes/teams.js';
import playersRouter from './routes/players.js';
import matchesRouter from './routes/matches.js';
import newsRouter from './routes/news.js';
import galleryRouter from './routes/gallery.js';
import pointsTableRouter from './routes/pointsTable.js';
import authRouter from './routes/auth.js';


dotenv.config();

const app = express(); // ✅ initialize app first
const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  socket.on('joinMatch', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`📡 Client ${socket.id} joined match room: match_${matchId}`);
  });
  
  socket.on('leaveMatch', (matchId) => {
    socket.leave(`match_${matchId}`);
    console.log(`📡 Client ${socket.id} left match room: match_${matchId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ✅ Add the route after app is defined
app.get('/', (req, res) => {
  res.send('API is running');
});

// Debug endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date() });
});

// For file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes


app.use('/api/auth', authRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/news', newsRouter);
app.use('/api/galleries', galleryRouter);
app.use('/api/points-table', pointsTableRouter);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    isConnected = false;
    throw err;
  }
};

// For Vercel serverless
if (process.env.VERCEL) {
  // Export app for Vercel
  app.use(async (req, res, next) => {
    await connectDB();
    next();
  });
} else {
  // For local development
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🔄 Socket.IO enabled for real-time updates`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
    });
}

export default app;
