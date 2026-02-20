import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDB } from './database.js';
import authRoutes from './routes/auth.js';
import { setupSocket } from './socket/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.sendFile(join(__dirname, '../public/index.html')));
app.get('/game/:type', (req, res) => res.sendFile(join(__dirname, '../public/game.html')));

initDB();
setupSocket(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🎮 GameZone berjalan di http://localhost:${PORT}`);
});
