import jwt from 'jsonwebtoken';
import { setupChessSocket } from './chess.js';
import { setupTTTSocket } from './tictactoe.js';
import { setupOthelloSocket } from './othello.js';

const SECRET = process.env.JWT_SECRET || 'gamezone_secret_2024';
export const rooms = new Map();
export const waitingPlayers = { chess: null, tictactoe: null, othello: null };

export function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      socket.user = jwt.verify(token, SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.username} connected`);
    setupChessSocket(io, socket);
    setupTTTSocket(io, socket);
    setupOthelloSocket(io, socket);

    socket.on('disconnect', () => {
      for (const game of Object.keys(waitingPlayers)) {
        if (waitingPlayers[game]?.id === socket.id) waitingPlayers[game] = null;
      }
      for (const [roomId, room] of rooms.entries()) {
        if (room.players.includes(socket.id)) {
          socket.to(roomId).emit('opponent_disconnected');
          rooms.delete(roomId);
        }
      }
    });
  });
}
